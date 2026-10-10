import { db } from '@/database/db';
import { fail, user, id } from '@/modules/auth/auth.service';
import { json, type RouteContext } from '@/modules/api/http';
export async function favoritesRoutes({ req, parts, route, method, body }: RouteContext) {
    if (parts[0] === 'obras' && parts[2] === 'favorito' && method === 'POST') {
        const u = await user(req), oid = id(parts[1]);
        const b = await body();
        if (typeof b.active !== 'boolean')
            fail(400, 'Indica si deseas guardar o quitar el favorito');
        if (!(await db.query('SELECT 1 FROM obras WHERE id=$1 AND eliminado_at IS NULL', [oid])).rowCount)
            fail(404, 'Obra no encontrada');
        if (b.active)
            await db.query('INSERT INTO favoritos(usuario_id,obra_id) VALUES($1,$2) ON CONFLICT DO NOTHING', [u.id, oid]);
        else
            await db.query('DELETE FROM favoritos WHERE usuario_id=$1 AND obra_id=$2', [u.id, oid]);
        const favorites = (await db.query('SELECT obra_id FROM favoritos WHERE usuario_id=$1 ORDER BY obra_id', [u.id])).rows.map(x => x.obra_id);
        return json({ ok: true, favorites });
    }
}
