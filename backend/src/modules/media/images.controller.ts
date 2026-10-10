import { NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fail } from '@/modules/auth/auth.service';
import { storage, type RouteContext } from '@/modules/api/http';
export async function imagesRoutes({ req, parts, route, method, body }: RouteContext) {
    if (parts[0] === 'posters' && method === 'GET') {
        const name = parts[1];
        if (parts.length !== 2 || !/^[a-f0-9-]+\.(png|jpg|webp)$/.test(name))
            fail(404, 'Imagen no encontrada');
        const file = await readFile(path.join(storage(), 'posters', name));
        const ext = name.split('.').pop();
        return new NextResponse(file, { headers: { 'Content-Type': ext === 'jpg' ? 'image/jpeg' : 'image/' + ext, 'Cache-Control': 'public, max-age=3600' } });
    }
}
