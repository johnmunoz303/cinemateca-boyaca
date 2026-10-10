import { NextResponse } from 'next/server';
import { randomUUID, randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { db } from '@/database/db';
import { fail, user, text, email, id, token } from '@/modules/auth/auth.service';
import { digest, signPayload, verifyPayload } from '@/modules/auth/security.mjs';
import { json, storage, type RouteContext } from '@/modules/api/http';
export async function streamingRoutes({ req, parts, route, method, body }: RouteContext) {
    if (parts[0] === 'streaming' && parts[1] === 'subtitulos' && method === 'GET') {
        const u = await user(req), t = verifyPayload(req.nextUrl.searchParams.get('token') ?? '', process.env.STREAM_SECRET);
        if (!t || t.uid !== u.id || t.device !== digest((req.headers.get('user-agent') ?? 'desconocido').slice(0, 512)))
            fail(403, 'Token inválido');
        const sub = (await db.query("SELECT sub.ruta_archivo FROM subtitulos sub JOIN videos v ON v.obra_id=sub.obra_id JOIN sesiones_streaming ss ON ss.video_id=v.id WHERE sub.id=$1 AND v.id=$2 AND ss.id=$3 AND ss.usuario_id=$4 AND ss.estado='activa'", [id(parts[2]), t.vid, t.sid, u.id])).rows[0];
        if (!sub || !/^[a-f0-9-]+\.vtt$/.test(sub.ruta_archivo))
            fail(404, 'Subtítulo no disponible');
        return new NextResponse(await readFile(path.join(storage(), 'subtitulos', sub.ruta_archivo)), { headers: { 'Content-Type': 'text/vtt; charset=utf-8', 'Cache-Control': 'no-store' } });
    }
    if (route === 'streaming/token' && method === 'POST') {
        const u = await user(req), b = await body();
        const o = (await db.query('SELECT * FROM obras WHERE id=$1 AND estado_publicacion', [id(b.obra_id)])).rows[0];
        if (!o)
            fail(404, 'Obra no disponible');
        if (!o.dominio_publico && (!o.fecha_ini_lic || !o.fecha_fin_lic || new Date(o.fecha_ini_lic) > new Date() || new Date(o.fecha_fin_lic).getTime() + 86400000 < Date.now()))
            fail(403, 'La obra no tiene una licencia vigente');
        const v = (await db.query("SELECT * FROM videos WHERE obra_id=$1 AND eliminado_at IS NULL AND estado_transcodificacion='listo' ORDER BY id DESC LIMIT 1", [o.id])).rows[0];
        if (!v)
            fail(409, 'Video aún no disponible');
        const ip = '127.0.0.1';
        const device = (req.headers.get('user-agent') ?? 'desconocido').slice(0, 512);
        let sid: string, code: string;
        if (b.session_id) {
            const old = (await db.query("SELECT * FROM sesiones_streaming WHERE id=$1 AND usuario_id=$2 AND video_id=$3 AND estado='activa'", [text(b.session_id, 64), u.id, v.id])).rows[0];
            if (!old || old.dispositivo !== device)
                fail(403, 'Sesión de reproducción no válida');
            sid = old.id;
            code = old.codigo_rastreo;
            await db.query('UPDATE sesiones_streaming SET ultimo_heartbeat=now() WHERE id=$1', [sid]);
        }
        else {
            sid = randomUUID();
            code = 'CB-' + randomBytes(10).toString('hex').toUpperCase();
            await db.query('INSERT INTO sesiones_streaming(id,usuario_id,video_id,ip_usuario,dispositivo,codigo_rastreo) VALUES($1,$2,$3,$4,$5,$6)', [sid, u.id, v.id, ip, device, code]);
        }
        const signed = signPayload({ sid, uid: u.id, vid: v.id, device: digest(device), ip, exp: Date.now() + 180000 }, process.env.STREAM_SECRET);
        return json({ url: `/api/v1/streaming/media/${v.id}/index.m3u8?token=${signed}`, token: signed, session_id: sid, codigo: code, email: u.email.replace(/^(.{2}).*(@.*)$/, '$1***$2'), ip, expires_in: 180, permitir_descarga: o.permitir_descarga, subtitulos: (await db.query('SELECT id,idioma FROM subtitulos WHERE obra_id=$1', [o.id])).rows.map(sub => ({ ...sub, url: '/api/v1/streaming/subtitulos/' + sub.id + '?token=' + signed })) });
    }
    if (route === 'streaming/download' && method === 'POST') {
        const u = await user(req), b = await body();
        const s = (await db.query("SELECT ss.*,v.ruta_archivo,o.permitir_descarga,o.estado_publicacion,o.fecha_ini_lic,o.fecha_fin_lic,o.dominio_publico FROM sesiones_streaming ss JOIN videos v ON v.id=ss.video_id JOIN obras o ON o.id=v.obra_id WHERE v.eliminado_at IS NULL AND ss.id=$1 AND ss.usuario_id=$2 AND ss.estado='activa'", [text(b.session_id, 64), u.id])).rows[0];
        if (!s || !s.permitir_descarga || !s.estado_publicacion)
            fail(403, 'El administrador no permite descargar esta obra');
        const signed = signPayload({ sid: s.id, uid: u.id, device: digest((req.headers.get('user-agent') ?? 'desconocido').slice(0, 512)), exp: Date.now() + 60000 }, process.env.STREAM_SECRET);
        return json({ url: '/api/v1/streaming/download?token=' + signed });
    }
    if (route === 'streaming/download' && method === 'GET') {
        const u = await user(req), t = verifyPayload(req.nextUrl.searchParams.get('token') ?? '', process.env.STREAM_SECRET);
        if (!t || t.uid !== u.id || t.device !== digest((req.headers.get('user-agent') ?? 'desconocido').slice(0, 512)))
            fail(403, 'Autorización de descarga vencida');
        const s = (await db.query("SELECT ss.*,v.ruta_archivo,o.permitir_descarga,o.estado_publicacion,o.fecha_ini_lic,o.fecha_fin_lic,o.dominio_publico FROM sesiones_streaming ss JOIN videos v ON v.id=ss.video_id JOIN obras o ON o.id=v.obra_id WHERE ss.id=$1 AND ss.usuario_id=$2 AND ss.estado='activa'", [t.sid, u.id])).rows[0];
        if (!s || !s.permitir_descarga || !s.estado_publicacion || (!s.dominio_publico && (!s.fecha_ini_lic || !s.fecha_fin_lic || new Date(s.fecha_ini_lic) > new Date() || new Date(s.fecha_fin_lic).getTime() + 86400000 < Date.now())))
            fail(403, 'Descarga no autorizada');
        if (!/^[a-f0-9-]+\.source$/.test(s.ruta_archivo))
            fail(400, 'Archivo inválido');
        const file = await readFile(path.join(storage(), 'originals', s.ruta_archivo));
        await db.query('INSERT INTO descargas(sesion_id,usuario_id,video_id) VALUES($1,$2,$3)', [s.id, u.id, s.video_id]);
        return new NextResponse(file, { headers: { 'Content-Type': 'application/octet-stream', 'Content-Disposition': 'attachment; filename=cinemateca-video.mp4', 'Cache-Control': 'no-store' } });
    }
    if (route === 'streaming/end' && method === 'POST') {
        const u = await user(req), b = await body();
        await db.query("UPDATE sesiones_streaming SET estado='finalizada',fecha_fin=now() WHERE id=$1 AND usuario_id=$2", [text(b.session_id, 64), u.id]);
        return json({ ok: true });
    }
    if (parts[0] === 'streaming' && parts[1] === 'media' && method === 'GET') {
        const u = await user(req);
        const raw = req.nextUrl.searchParams.get('token') ?? '';
        const t = verifyPayload(raw, process.env.STREAM_SECRET);
        const device = (req.headers.get('user-agent') ?? 'desconocido').slice(0, 512);
        if (!t || t.uid !== u.id || t.vid !== id(parts[2]) || t.device !== digest(device) || t.ip !== '127.0.0.1')
            fail(403, 'Token de reproducción inválido o vencido');
        const s = (await db.query("SELECT v.ruta_archivo,o.dominio_publico,o.fecha_ini_lic,o.fecha_fin_lic,o.estado_publicacion FROM sesiones_streaming ss JOIN videos v ON v.id=ss.video_id JOIN obras o ON o.id=v.obra_id WHERE ss.id=$1 AND ss.usuario_id=$2 AND ss.estado='activa'", [t.sid, u.id])).rows[0];
        if (!s || !s.estado_publicacion || (!s.dominio_publico && (!s.fecha_ini_lic || !s.fecha_fin_lic || new Date(s.fecha_ini_lic) > new Date() || new Date(s.fecha_fin_lic).getTime() + 86400000 < Date.now())))
            fail(403, 'Sesión o licencia inactiva');
        const filename = parts[3];
        if (parts.length !== 4 || !/^([a-zA-Z0-9_-]+\.(m3u8|ts|vtt))$/.test(filename))
            fail(400, 'Archivo inválido');
        const root = path.join(storage(), 'hls', String(t.vid));
        const file = await readFile(path.join(root, filename));
        if (filename.endsWith('.m3u8')) {
            const manifest = file.toString().split('\n').map(line => line && !line.startsWith('#') ? `${line}?token=${raw}` : line).join('\n');
            return new NextResponse(manifest, { headers: { 'Content-Type': 'application/vnd.apple.mpegurl', 'Cache-Control': 'no-store' } });
        }
        return new NextResponse(file, { headers: { 'Content-Type': filename.endsWith('.vtt') ? 'text/vtt' : 'video/mp2t', 'Cache-Control': 'no-store' } });
    }
}
