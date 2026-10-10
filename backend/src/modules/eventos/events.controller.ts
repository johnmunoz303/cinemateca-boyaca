import {ensureEnrollmentDetails,enrollmentData} from '@/modules/cursos/enrollment.service';
import { db } from '@/database/db';
import { fail, user, id } from '@/modules/auth/auth.service';
import { json, type RouteContext } from '@/modules/api/http';
export async function eventsRoutes({ req, parts, route, method, body }: RouteContext) {
    if (parts[0] === 'eventos' && parts[2] === 'inscribir' && method === 'POST') {
        await ensureEnrollmentDetails();
        const datos=enrollmentData(await body());
        const u = await user(req), eid = id(parts[1]), c = await db.connect();
        try {
            await c.query('BEGIN');
            const ev = (await c.query("SELECT * FROM eventos WHERE id=$1 AND estado='publicado' AND inicio>now() FOR UPDATE", [eid])).rows[0];
            if (!ev)
                fail(400, 'Inscripciones cerradas');
            const existing = await c.query('SELECT 1 FROM eventos_inscripciones WHERE usuario_id=$1 AND evento_id=$2', [u.id, eid]);
            if (!existing.rowCount && ev.cupo) {
                const count = await c.query('SELECT count(*) FROM eventos_inscripciones WHERE evento_id=$1', [eid]);
                if (Number(count.rows[0].count) >= ev.cupo)
                    fail(409, 'No hay cupos disponibles');
            }
            await c.query('INSERT INTO eventos_inscripciones(usuario_id,evento_id,datos_inscripcion) VALUES($1,$2,$3) ON CONFLICT(usuario_id,evento_id) DO UPDATE SET datos_inscripcion=excluded.datos_inscripcion', [u.id, eid,JSON.stringify(datos)]);
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
}
