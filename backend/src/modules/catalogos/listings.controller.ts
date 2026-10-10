import {ensureEnrollmentDetails} from '@/modules/cursos/enrollment.service';
import {ensureFunctionDetails} from '@/modules/taquilla/function-schema';
import { db } from '@/database/db';
import { json, type RouteContext } from '@/modules/api/http';
export async function listingsRoutes({ req, parts, route, method, body }: RouteContext) {
    if (['cursos', 'aulas', 'eventos', 'rodante', 'funciones', 'legal'].includes(route) && method === 'GET') {
        if(['cursos','eventos'].includes(route))await ensureEnrollmentDetails();
        if(route==='funciones')await ensureFunctionDetails();
        const queries: Record<string, string> = { cursos: 'SELECT * FROM cursos WHERE estado ORDER BY id', aulas: 'SELECT * FROM aulas ORDER BY id', eventos: "SELECT * FROM eventos WHERE estado='publicado' ORDER BY inicio", rodante: 'SELECT r.*,o.titulo obra_titulo FROM rutas_cnrod r LEFT JOIN obras o ON o.id=r.obra_id ORDER BY fecha_evento', funciones: "SELECT f.*,COALESCE(f.titulo_manual,o.titulo) titulo,s.nombre sala FROM funciones f LEFT JOIN obras o ON o.id=f.obra_id JOIN salas s ON s.id=f.sala_id WHERE f.estado='publicada' AND f.inicio>now() ORDER BY inicio", legal: 'SELECT * FROM documentos_legales WHERE publicado' };
        return json((await db.query(queries[route])).rows);
    }
}
