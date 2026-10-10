import {ensureEnrollmentDetails,enrollmentData} from '@/modules/cursos/enrollment.service';
import { db } from '@/database/db';
import { fail, user, id } from '@/modules/auth/auth.service';
import { json, type RouteContext } from '@/modules/api/http';
export async function coursesRoutes({ req, parts, route, method, body }: RouteContext) {
    if (parts[0] === 'cursos' && parts.length === 2 && method === 'GET')
        return json((await db.query('SELECT * FROM modulos WHERE curso_id=$1 ORDER BY orden', [id(parts[1])])).rows);
    if (parts[0] === 'cursos' && parts[2] === 'inscribir' && method === 'POST') {
        const u = await user(req);
        await ensureEnrollmentDetails();
        const datos = enrollmentData(await body());
        if(!(await db.query('SELECT id FROM cursos WHERE id=$1 AND estado',[id(parts[1])])).rowCount)fail(404,'Programa no disponible');
        await db.query('INSERT INTO inscripciones(usuario_id,curso_id,datos_inscripcion) VALUES($1,$2,$3) ON CONFLICT(usuario_id,curso_id) DO UPDATE SET datos_inscripcion=excluded.datos_inscripcion', [u.id, id(parts[1]),JSON.stringify(datos)]);
        return json({ ok: true });
    }
    if (parts[0] === 'modulos' && parts[2] === 'completar' && method === 'POST') {
        const u = await user(req), mid = id(parts[1]);
        const m = (await db.query('SELECT curso_id FROM modulos WHERE id=$1', [mid])).rows[0];
        if (!m)
            fail(404, 'Módulo no encontrado');
        const c = await db.connect();
        try {
            await c.query('BEGIN');
            const ins = await c.query('SELECT id FROM inscripciones WHERE usuario_id=$1 AND curso_id=$2 FOR UPDATE', [u.id, m.curso_id]);
            if (!ins.rowCount)
                fail(403, 'Debes inscribirte');
            await c.query('INSERT INTO progreso_modulos VALUES($1,$2,now()) ON CONFLICT DO NOTHING', [u.id, mid]);
            await c.query(`UPDATE inscripciones SET progreso_porcentaje=(SELECT count(*)*100/(SELECT count(*) FROM modulos WHERE curso_id=$2) FROM progreso_modulos p JOIN modulos m ON m.id=p.modulo_id WHERE p.usuario_id=$1 AND m.curso_id=$2) WHERE usuario_id=$1 AND curso_id=$2`, [u.id, m.curso_id]);
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
