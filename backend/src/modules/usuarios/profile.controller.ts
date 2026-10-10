import { db } from '@/database/db';
import { fail, user, text, id, passwordPolicy } from '@/modules/auth/auth.service';
import { hashPassword, verifyPassword } from '@/modules/auth/security.mjs';
import { cookie, json, type RouteContext } from '@/modules/api/http';
export async function profileRoutes({ req, parts, route, method, body }: RouteContext) {
    if (route === 'me' && method === 'GET') {
        const u = await user(req, false);
        if (!u)
            return json({ user: null });
        const [favorites, courses, events, reservations] = await Promise.all([db.query('SELECT obra_id FROM favoritos WHERE usuario_id=$1', [u.id]), db.query('SELECT i.*,c.titulo FROM inscripciones i JOIN cursos c ON c.id=i.curso_id WHERE usuario_id=$1', [u.id]), db.query('SELECT e.*,i.estado inscripcion_estado FROM eventos_inscripciones i JOIN eventos e ON e.id=i.evento_id WHERE usuario_id=$1', [u.id]), db.query('SELECT r.*,COALESCE(f.titulo_manual,o.titulo) titulo,f.inicio FROM reservas r JOIN funciones f ON f.id=r.funcion_id LEFT JOIN obras o ON o.id=f.obra_id WHERE usuario_id=$1 ORDER BY fecha_reserva DESC', [u.id])]);
        return json({ user: u, favorites: favorites.rows.map(x => x.obra_id), courses: courses.rows, events: events.rows, reservations: reservations.rows });
    }
    if (route === 'me' && method === 'PATCH') {
        const u = await user(req), b = await body();
        await db.query('UPDATE usuarios SET nombres=$1,apellidos=$2,notificaciones=$3 WHERE id=$4', [text(b.nombres, 100), String(b.apellidos ?? '').slice(0, 100), b.notificaciones !== false, u.id]);
        if (b.newPassword) {
            const old = (await db.query('SELECT password_hash FROM usuarios WHERE id=$1', [u.id])).rows[0];
            if (!verifyPassword(String(b.currentPassword ?? ''), old.password_hash))
                fail(400, 'Contraseña actual incorrecta');
            await db.query('UPDATE usuarios SET password_hash=$1,token_version=token_version+1 WHERE id=$2', [hashPassword(passwordPolicy(b.newPassword)), u.id]);
            const r = json({ ok: true, relogin: true });
            r.cookies.set('session', '', { ...cookie, maxAge: 0 });
            return r;
        }
        return json({ ok: true });
    }
}
