import {ensureFeaturedWorks} from './featured-schema';
import { db } from '@/database/db';
import { fail, user, text, id } from '@/modules/auth/auth.service';
import { json, type RouteContext } from '@/modules/api/http';
export async function catalogRoutes({ req, parts, route, method, body }: RouteContext) {
    if (route === 'obras' && method === 'GET') {
        await ensureFeaturedWorks();
        const search = req.nextUrl.searchParams.get('q') ?? '';
        const result = await db.query(`SELECT o.*,COALESCE((SELECT array_agg(g.nombre) FROM obras_generos og JOIN generos g ON g.id=og.genero_id WHERE og.obra_id=o.id),'{}') generos,(SELECT round(avg(puntuacion),1) FROM ratings WHERE obra_id=o.id) rating FROM obras o WHERE estado_publicacion AND o.eliminado_at IS NULL AND EXISTS (SELECT 1 FROM videos v WHERE v.obra_id=o.id AND v.estado_transcodificacion='listo' AND v.eliminado_at IS NULL) AND titulo ILIKE $1 ORDER BY o.id`, ['%' + search.slice(0, 100) + '%']);
        return json(result.rows);
    }
    if (parts[0] === 'obras' && parts.length === 2 && method === 'GET') {
        const o = (await db.query('SELECT * FROM obras WHERE id=$1 AND estado_publicacion AND eliminado_at IS NULL', [id(parts[1])])).rows[0];
        if (!o)
            fail(404, 'Obra no encontrada');
        const [people, comments, subs, genres] = await Promise.all([db.query('SELECT p.nombre,op.rol FROM obras_personas op JOIN personas p ON p.id=op.persona_id WHERE obra_id=$1', [o.id]), db.query('SELECT c.id,c.contenido,u.nombres FROM comentarios c JOIN usuarios u ON u.id=c.usuario_id WHERE obra_id=$1 AND c.estado=$2 ORDER BY c.id DESC LIMIT 20 OFFSET $3', [o.id, 'aprobado', Math.max(0, Number(req.nextUrl.searchParams.get('page') ?? 0) || 0) * 20]), db.query('SELECT id,idioma FROM subtitulos WHERE obra_id=$1', [o.id]), db.query('SELECT g.nombre FROM obras_generos og JOIN generos g ON g.id=og.genero_id WHERE og.obra_id=$1 ORDER BY g.nombre',[o.id])]);
        return json({ ...o, personas: people.rows, comentarios: comments.rows, subtitulos: subs.rows, generos: genres.rows.map(g => g.nombre) });
    }
    if (parts[0] === 'obras' && parts[2] === 'rating' && method === 'POST') {
        const u = await user(req), b = await body(), n = id(b.puntuacion);
        if (n > 5)
            fail(400, 'Califica entre 1 y 5');
        await db.query('INSERT INTO ratings(obra_id,usuario_id,puntuacion) VALUES($1,$2,$3) ON CONFLICT(obra_id,usuario_id) DO UPDATE SET puntuacion=excluded.puntuacion', [id(parts[1]), u.id, n]);
        return json({ ok: true });
    }
    if (parts[0] === 'obras' && parts[2] === 'comentarios' && method === 'POST') {
        const u = await user(req), b = await body();
        await db.query('INSERT INTO comentarios(obra_id,usuario_id,contenido) VALUES($1,$2,$3)', [id(parts[1]), u.id, text(b.contenido, 2000)]);
        return json({ message: 'Comentario enviado a moderación' });
    }
}
