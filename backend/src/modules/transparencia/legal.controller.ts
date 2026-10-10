import { NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { db } from '@/database/db';
import { fail, id } from '@/modules/auth/auth.service';
import { storage, type RouteContext } from '@/modules/api/http';
export async function legalRoutes({ req, parts, route, method, body }: RouteContext) {
    if (parts[0] === 'legal' && parts[2] === 'pdf' && method === 'GET') {
        const doc = (await db.query('SELECT archivo_pdf FROM documentos_legales WHERE id=$1 AND publicado', [id(parts[1])])).rows[0];
        if (!doc?.archivo_pdf || !/^[a-f0-9-]+\.pdf$/.test(doc.archivo_pdf))
            fail(404, 'Documento no disponible');
        const file = await readFile(path.join(storage(), 'legal', doc.archivo_pdf));
        return new NextResponse(file, { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename=documento-oficial.pdf' } });
    }
}
