import {ensureEnrollmentDetails} from '@/modules/cursos/enrollment.service';
import {ensureFeaturedWorks} from '@/modules/obras/featured-schema';
import {ensureFunctionDetails} from '@/modules/taquilla/function-schema';
import { saveWork } from '@/modules/obras/obras.service';
import { randomUUID, createHash } from 'node:crypto';
import { mkdir, writeFile, rm, unlink } from 'node:fs/promises';
import path from 'node:path';
import { db } from '@/database/db';
import { saveRoom, saveFunction, validateRecord } from '@/modules/administracion/administracion.service';
import { fail, user, text, email, id } from '@/modules/auth/auth.service';
import { digest, verifyPayload } from '@/modules/auth/security.mjs';
import { json, storage, type RouteContext } from '@/modules/api/http';
export async function adminRoutes({ req, parts, route, method, body }: RouteContext) {
    if (parts[0] === 'admin') {
        const actor = await user(req);
        if (actor.rol !== 'administrador' && !(actor.rol === 'programador' && (parts[1] === 'funciones' && ['GET', 'POST', 'PATCH'].includes(method) || ['obras', 'salas'].includes(parts[1]) && method === 'GET' || parts[1] === 'imagen' && method === 'POST')))
            fail(403, 'Permisos insuficientes');
        if(['cursos','eventos'].includes(parts[1]))await ensureEnrollmentDetails();
        if(parts[1]==='obras')await ensureFeaturedWorks();
        if(parts[1]==='funciones')await ensureFunctionDetails();
        if(parts[1] === 'inscripciones' && method === 'GET') {
            await ensureEnrollmentDetails();
            return json((await db.query(`SELECT 'curso-'||i.id id,'Programa' tipo,c.titulo,u.nombres,u.email,i.fecha_inscripcion fecha,i.datos_inscripcion FROM inscripciones i JOIN usuarios u ON u.id=i.usuario_id JOIN cursos c ON c.id=i.curso_id UNION ALL SELECT 'evento-'||i.usuario_id||'-'||i.evento_id,'Evento',e.titulo,u.nombres,u.email,i.created_at,i.datos_inscripcion FROM eventos_inscripciones i JOIN usuarios u ON u.id=i.usuario_id JOIN eventos e ON e.id=i.evento_id ORDER BY fecha DESC LIMIT 500`)).rows);
        }
        if (parts[1] === 'roles') {
            if (method === 'GET') {
                await db.query("INSERT INTO roles(nombre,descripcion) VALUES('programador','Consulta y gestiona la programación de funciones') ON CONFLICT(nombre) DO NOTHING");
                return json((await db.query('SELECT id,nombre,descripcion FROM roles ORDER BY id')).rows.map(r => ({ ...r, permisos: r.nombre === 'programador' ? 'Consultar obras y salas; crear, editar, publicar y cancelar funciones' : r.nombre === 'administrador' ? 'Gestionar usuarios, roles, videos, obras, cursos, lecciones, aulas, eventos, paradas, salas, funciones y reportes' : 'Consultar contenido; reproducir con cuenta; gestionar favoritos, perfil, inscripciones y reservas propias' })));
            }
            ;
            if (method === 'PATCH') {
                const b = await body();
                const result = await db.query('UPDATE roles SET descripcion=$1 WHERE id=$2 RETURNING id', [text(b.descripcion, 2000), id(parts[2])]);
                if (!result.rowCount)
                    fail(404, 'Rol no encontrado');
                return json({ ok: true });
            }
            fail(400, 'Los roles del sistema son fijos. Puedes editar su descripción y asignarlos a usuarios registrados.');
        }
        if (parts[1] === 'usuarios' && method === 'PATCH') {
            const target = id(parts[2]), b = await body();
            const client = await db.connect();
            try {
                await client.query('BEGIN');
                const u = (await client.query('SELECT id,email,rol_id FROM usuarios WHERE id=$1 FOR UPDATE', [target])).rows[0];
                if (!u)
                    fail(404, 'Usuario no encontrado');
                let role = u.rol_id;
                if (Object.hasOwn(b, 'rol_id')) {
                    role = id(b.rol_id);
                    const r = (await client.query('SELECT nombre FROM roles WHERE id=$1', [role])).rows[0];
                    if (!r || !['administrador', 'espectador', 'programador'].includes(r.nombre))
                        fail(400, 'Rol no permitido');
                    if ((target === actor.id || u.email === process.env.ADMIN_EMAIL?.toLowerCase()) && r.nombre !== 'administrador')
                        fail(403, 'No puedes quitar el acceso de tu cuenta ni del administrador predeterminado');
                }
                if ((target === actor.id || u.email === process.env.ADMIN_EMAIL?.toLowerCase()) && b.estado === false)
                    fail(403, 'No puedes desactivar tu cuenta ni el administrador predeterminado');
                const keys = ['nombres', 'apellidos', 'estado'].filter(k => Object.hasOwn(b, k));
                if (Object.hasOwn(b, 'estado') && typeof b.estado !== 'boolean')
                    fail(400, 'Estado no válido');
                const vals = keys.map(k => k === 'estado' ? b[k] : k === 'nombres' ? text(b[k], 100) : String(b[k] ?? '').slice(0, 100));
                await client.query('UPDATE usuarios SET ' + [...keys.map((k, i) => k + '=$' + (i + 1)), 'rol_id=$' + (vals.length + 1), 'token_version=token_version+1'].join(',') + ' WHERE id=$' + (vals.length + 2), [...vals, role, target]);
                await client.query('COMMIT');
                return json({ ok: true, relogin: target === actor.id });
            }
            catch (e) {
                await client.query('ROLLBACK');
                throw e;
            }
            finally {
                client.release();
            }
        }
        if (parts[1] === 'reportes' && method === 'GET')
            return json((await db.query('SELECT ss.*,u.nombres,u.email,o.titulo,(SELECT count(*) FROM descargas d WHERE d.sesion_id=ss.id) descargas FROM sesiones_streaming ss JOIN usuarios u ON u.id=ss.usuario_id JOIN videos v ON v.id=ss.video_id JOIN obras o ON o.id=v.obra_id ORDER BY fecha_ini DESC LIMIT 500')).rows);
        if (parts[1] === 'documento' && method === 'POST') {
            const form = await req.formData(), file = form.get('file'), rid = id(form.get('id'));
            if (!(file instanceof File) || file.size > 10 * 1024 * 1024 || file.size < 5)
                fail(400, 'Selecciona un PDF de hasta 10 MB');
            const data = Buffer.from(await file.arrayBuffer());
            if (data.toString('ascii', 0, 5) !== '%PDF-')
                fail(400, 'El archivo debe ser PDF');
            if (!(await db.query('SELECT 1 FROM documentos_legales WHERE id=$1', [rid])).rowCount)
                fail(404, 'Documento no encontrado');
            const name = randomUUID() + '.pdf';
            await mkdir(path.join(storage(), 'legal'), { recursive: true });
            await writeFile(path.join(storage(), 'legal', name), data);
            await db.query('UPDATE documentos_legales SET archivo_pdf=$1 WHERE id=$2', [name, rid]);
            return json({ message: 'PDF adjuntado al documento' });
        }
        if (parts[1] === 'subtitulo' && method === 'POST') {
            const form = await req.formData(), file = form.get('file'), oid = id(form.get('obra_id')), language = text(form.get('idioma'), 50);
            if (!(file instanceof File) || file.size > 1024 * 1024)
                fail(400, 'Archivo VTT de hasta 1 MB requerido');
            const value = await file.text();
            if (!/^\uFEFF?WEBVTT(?:\s|$)/.test(value) || !value.includes('-->'))
                fail(400, 'Archivo WebVTT no válido');
            const filename = randomUUID() + '.vtt';
            await mkdir(path.join(storage(), 'subtitulos'), { recursive: true });
            await writeFile(path.join(storage(), 'subtitulos', filename), value);
            try {
                await db.query('INSERT INTO subtitulos(obra_id,idioma,ruta_archivo) VALUES($1,$2,$3)', [oid, language, filename]);
            }
            catch (e) {
                await unlink(path.join(storage(), 'subtitulos', filename));
                throw e;
            }
            return json({ ok: true }, 201);
        }
        if (parts[1] === 'imagen' && method === 'POST') {
            const form = await req.formData(), file = form.get('file'), rid = id(form.get('id')), resource = String(form.get('recurso'));
            if(actor.rol==='programador'&&resource!=='funciones')fail(403,'Solo puedes cargar imágenes de funciones');
            if(resource==='funciones')await ensureFunctionDetails();
            const options: Record<string, [
                string,
                string
            ]> = { obras: ['obras', 'poster'], cursos: ['cursos', 'poster'], eventos: ['eventos', 'imagen'], aulas: ['aulas', 'imagen'], funciones: ['funciones', 'imagen'] };
            const target = options[resource];
            if (!target || !(file instanceof File) || file.size > 5 * 1024 * 1024)
                fail(400, 'Selecciona una imagen de hasta 5 MB');
            const data = Buffer.from(await file.arrayBuffer());
            const ext = data.toString('hex', 0, 8) === '89504e470d0a1a0a' ? 'png' : data.toString('hex', 0, 3) === 'ffd8ff' ? 'jpg' : data.toString('ascii', 0, 4) === 'RIFF' && data.toString('ascii', 8, 12) === 'WEBP' ? 'webp' : null;
            if (!ext)
                fail(400, 'Imagen permitida: PNG, JPEG o WebP');
            const name = randomUUID() + '.' + ext;
            await mkdir(path.join(storage(), 'posters'), { recursive: true });
            await writeFile(path.join(storage(), 'posters', name), data);
            await db.query(`UPDATE ${target[0]} SET ${target[1]}=$1 WHERE id=$2`, ['/api/v1/posters/' + name, rid]);
            return json({ message: 'Imagen actualizada' });
        }
        if (parts[1] === 'videos' && method === 'GET')
            return json((await db.query('SELECT v.id,v.obra_id,o.titulo,v.tamano_bytes,v.created_at,v.estado_transcodificacion,v.etapa FROM videos v JOIN obras o ON o.id=v.obra_id WHERE v.eliminado_at IS NULL AND o.eliminado_at IS NULL ORDER BY v.id DESC LIMIT 500')).rows);
        if (parts[1] === 'videos' && method === 'DELETE') {
            const vid = id(parts[2]), c = await db.connect();
            let v;
            try {
                await c.query('BEGIN');
                v = (await c.query('SELECT * FROM videos WHERE id=$1 AND eliminado_at IS NULL FOR UPDATE', [vid])).rows[0];
                if (!v)
                    fail(404, 'Video no encontrado');
                if (v.estado_transcodificacion === 'procesando')
                    fail(409, 'Espera a que termine el procesamiento para eliminar el archivo');
                if ((await c.query("SELECT 1 FROM sesiones_streaming WHERE video_id=$1 AND estado='activa' AND ultimo_heartbeat>now()-interval '5 minutes' LIMIT 1", [vid])).rowCount)
                    fail(409, 'Hay una reproducci?n activa. Intenta eliminarlo cuando finalice');
                await c.query('UPDATE videos SET eliminado_at=now() WHERE id=$1', [vid]);
                await c.query('COMMIT');
            }
            catch (e) {
                await c.query('ROLLBACK');
                throw e;
            }
            finally {
                c.release();
            }
            const base = storage(), hlsBase = path.resolve(base, 'hls'), target = path.resolve(hlsBase, String(vid));
            if (!target.startsWith(hlsBase + path.sep))
                fail(400, 'Ruta de archivo no v?lida');
            await rm(target, { recursive: true, force: true });
            if (/^[a-f0-9-]+\.source$/.test(v.ruta_archivo))
                await unlink(path.join(base, 'originals', v.ruta_archivo)).catch(e => { if (e.code !== 'ENOENT')
                    throw e; });
            return json({ ok: true });
        }
        if (parts[1] === 'upload' && method === 'POST') {
            const form = await req.formData(), file = form.get('file'), oid = id(form.get('obra_id'));
            if (!(file instanceof File) || file.size > 250 * 1024 * 1024 || file.size < 12)
                fail(400, 'Selecciona un video de hasta 250 MB');
            const buffer = Buffer.from(await file.arrayBuffer());
            if (buffer.toString('ascii', 4, 8) !== 'ftyp' && buffer.toString('hex', 0, 4) !== '1a45dfa3')
                fail(400, 'Formato permitido: MP4 o WebM');
            const name = randomUUID() + '.source';
            await mkdir(path.join(storage(), 'originals'), { recursive: true });
            await writeFile(path.join(storage(), 'originals', name), buffer);
            try {
                await db.query('INSERT INTO videos(obra_id,ruta_archivo,checksum,tamano_bytes) VALUES($1,$2,$3,$4)', [oid, name, createHash('sha256').update(buffer).digest('hex'), file.size]);
            }
            catch (e) {
                throw e;
            }
            return json({ message: 'Video recibido. Revisa el estado en la lista de obras; se actualizará automáticamente.' }, 201);
        }
        if (parts[1] === 'ticket' && method === 'POST') {
            const b = await body(), raw = text(b.ticket, 4000), decoded = verifyPayload(raw, process.env.TICKET_SECRET);
            if (!decoded)
                fail(400, 'Tiquete inválido');
            const c = await db.connect();
            try {
                await c.query('BEGIN');
                const r = (await c.query("SELECT r.*,f.estado funcion_estado FROM reservas r JOIN funciones f ON f.id=r.funcion_id WHERE r.id=$1 AND r.codigo_ticket=$2 AND r.estado='confirmada' FOR UPDATE OF r", [decoded.reserva, raw])).rows[0];
                if (!r || r.funcion_estado !== 'publicada')
                    fail(400, 'Tiquete no disponible');
                if (r.ingreso_at)
                    fail(409, 'Este tiquete ya fue utilizado');
                if (b.registrar === true)
                    await c.query('UPDATE reservas SET ingreso_at=now(),ingreso_por=$1 WHERE id=$2', [actor.id, r.id]);
                await c.query('COMMIT');
                return json({ valido: true, reserva: r.id, ingreso_registrado: b.registrar === true });
            }
            catch (e) {
                await c.query('ROLLBACK');
                throw e;
            }
            finally {
                c.release();
            }
        }
        if (parts[1] === 'salas' && parts[3] === 'asientos' && method === 'GET')
            return json((await db.query('SELECT * FROM asientos WHERE sala_id=$1 ORDER BY fila,numero', [id(parts[2])])).rows);
        if (['POST', 'PATCH'].includes(method) && ['salas', 'funciones'].includes(parts[1])) {
            const data = await body();
            const rid = method === 'PATCH' ? id(parts[2]) : undefined;
            const saved = parts[1] === 'salas' ? await saveRoom(data, rid) : await saveFunction(data, rid);
            return json(saved, method === 'POST' ? 201 : 200);
        }
        if (parts[1] === 'obras' && ['POST', 'PATCH'].includes(method)) {
            return json(await saveWork(await body(), method === 'PATCH' ? id(parts[2]) : undefined), method === 'POST' ? 201 : 200);
        }
        const resources: Record<string, {
            table: string;
            fields: string[];
        }> = { generos: { table: 'generos', fields: ['nombre'] }, obras: { table: 'obras', fields: ['titulo', 'sinopsis', 'duracion', 'anio', 'tipo', 'estado_publicacion', 'dominio_publico', 'poster', 'permitir_descarga', 'fecha_ini_lic', 'fecha_fin_lic'] }, cursos: { table: 'cursos', fields: ['titulo', 'descripcion', 'categoria', 'duracion', 'poster', 'estado','requisitos','involucrados','inicio','direccion','latitud','longitud'] }, modulos: { table: 'modulos', fields: ['curso_id', 'titulo', 'ruta', 'orden', 'obra_id'] }, eventos: { table: 'eventos', fields: ['titulo', 'descripcion', 'categoria', 'inicio', 'direccion', 'latitud', 'longitud', 'imagen', 'estado', 'cupo','requisitos','involucrados'] }, rodante: { table: 'rutas_cnrod', fields: ['municipio', 'ubicacion', 'fecha_evento', 'descripcion', 'obra_id', 'latitud', 'longitud'] }, aulas: { table: 'aulas', fields: ['nombre', 'descripcion', 'horarios', 'direccion', 'latitud', 'longitud', 'imagen'] }, funciones: { table: 'funciones', fields: ['titulo_manual', 'obra_id', 'sala_id', 'inicio', 'precio', 'estado'] }, salas: { table: 'salas', fields: ['nombre', 'direccion', 'latitud', 'longitud'] }, usuarios: { table: 'usuarios', fields: ['nombres', 'apellidos', 'estado'] }, comentarios: { table: 'comentarios', fields: ['estado'] }, legal: { table: 'documentos_legales', fields: ['titulo', 'contenido', 'entidad', 'fecha_documento', 'fuente_url', 'publicado'] }, personas: { table: 'personas', fields: ['nombre', 'tipo_persona', 'fecha_nac', 'pais'] }, subtitulos: { table: 'subtitulos', fields: ['obra_id', 'idioma', 'ruta_archivo'] } };
        const resource = resources[parts[1]];
        if (!resource)
            fail(404, 'Recurso no encontrado');
        if (method === 'GET' && parts[1] === 'obras')
            return json((await db.query("SELECT o.*,COALESCE((SELECT array_agg(genero_id) FROM obras_generos WHERE obra_id=o.id),'{}') genero_ids,COALESCE((SELECT json_agg(json_build_object('persona_id',op.persona_id,'nombre',p.nombre,'rol',op.rol)) FROM obras_personas op JOIN personas p ON p.id=op.persona_id WHERE op.obra_id=o.id),'[]') participantes,v.estado_transcodificacion video_estado,v.etapa video_etapa FROM obras o LEFT JOIN LATERAL (SELECT estado_transcodificacion,etapa FROM videos WHERE obra_id=o.id AND eliminado_at IS NULL ORDER BY id DESC LIMIT 1) v ON true WHERE o.eliminado_at IS NULL ORDER BY o.id DESC LIMIT 500")).rows);
        if (method === 'GET') {
            const select = resource.table === 'usuarios' ? 'id,nombres,apellidos,email,estado,rol_id' : '*';
            return json((await db.query(`SELECT ${select} FROM ${resource.table} ORDER BY id DESC LIMIT 500`)).rows);
        }
        if (method === 'DELETE' && parts[1] === 'obras') {
            const oid = id(parts[2]), c = await db.connect();
            try {
                await c.query('BEGIN');
                const r = await c.query('UPDATE obras SET eliminado_at=now(),estado_publicacion=false WHERE id=$1 AND eliminado_at IS NULL RETURNING id', [oid]);
                if (!r.rowCount)
                    fail(404, 'Obra no encontrada');
                await c.query("UPDATE sesiones_streaming SET estado='finalizada',fecha_fin=now() WHERE estado='activa' AND video_id IN(SELECT id FROM videos WHERE obra_id=$1)", [oid]);
                await c.query('COMMIT');
                return json({ ok: true });
            }
            catch (e) {
                await c.query('ROLLBACK');
                throw e;
            }
            finally {
                c.release();
            }
        }
        if (method === 'DELETE') {
            if (['usuarios', 'funciones', 'comentarios'].includes(parts[1]))
                fail(400, 'Cambia su estado desde Editar');
            await db.query(`DELETE FROM ${resource.table} WHERE id=$1`, [id(parts[2])]);
            return json({ ok: true });
        }
        if (method === 'POST' || method === 'PATCH') {
            if (method === 'POST' && ['usuarios', 'comentarios'].includes(parts[1]))
                fail(403, 'Este recurso no admite creación administrativa');
            const b = await body();
            await validateRecord(parts[1], b, method === 'PATCH' ? id(parts[2]) : undefined);
            if (parts[1] === 'funciones' && (Object.hasOwn(b, 'titulo_manual') || method === 'POST' && !b.obra_id))
                b.titulo_manual = text(b.titulo_manual, 255);
            if (parts[1] === 'usuarios' && method === 'PATCH' && id(parts[2]) === actor.id && b.estado === false)
                fail(403, 'No puedes desactivar tu propia cuenta administrativa');
            const keys = resource.fields.filter(k => Object.hasOwn(b, k));
            if (!keys.length)
                fail(400, 'No hay campos válidos');
            if (keys.some(k => typeof b[k] === 'string' && b[k].length > 20000))
                fail(400, 'Texto demasiado largo');
            const vals = keys.map(k => b[k] === '' ? null : b[k]);
            if (method === 'POST') {
                const result = await db.query(`INSERT INTO ${resource.table}(${keys.join(',')}) VALUES(${keys.map((_, i) => '$' + (i + 1)).join(',')}) RETURNING *`, vals);
                return json(result.rows[0], 201);
            }
            await db.query(`UPDATE ${resource.table} SET ${keys.map((k, i) => k + '=$' + (i + 1)).join(',')} WHERE id=$${keys.length + 1}`, [...vals, id(parts[2])]);
            return json({ ok: true });
        }
    }
}
