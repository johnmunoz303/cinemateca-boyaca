import { paymentsRoutes } from '@/modules/pagos/payments.controller';
import { ticketingRoutes } from '@/modules/taquilla/ticketing.controller';
import { authRoutes } from '@/modules/auth/auth.controller';
import { profileRoutes } from '@/modules/usuarios/profile.controller';
import { catalogRoutes } from '@/modules/obras/catalog.controller';
import { favoritesRoutes } from '@/modules/favoritos/favorites.controller';
import { listingsRoutes } from '@/modules/catalogos/listings.controller';
import { legalRoutes } from '@/modules/transparencia/legal.controller';
import { coursesRoutes } from '@/modules/cursos/courses.controller';
import { eventsRoutes } from '@/modules/eventos/events.controller';
import { streamingRoutes } from '@/modules/streaming/streaming.controller';
import { imagesRoutes } from '@/modules/media/images.controller';
import { adminRoutes } from '@/modules/administracion/admin.controller';
import { json } from '@/modules/api/http';
import { confirmation } from '@/modules/pagos/payu.service';
import { NextRequest } from 'next/server';
import { db } from '@/database/db';
import { ApiError, fail, checkOrigin, limit } from '@/modules/auth/auth.service';
export const runtime = 'nodejs';
async function handle(req: NextRequest) {
    try {
        const parts = req.nextUrl.pathname.split('/').slice(3);
        const route = parts.join('/');
        const method = req.method;
        if (route === 'pagos/webhook' && method === 'POST') {
            const reader = req.body?.getReader();
            if (!reader)
                fail(400, 'Evento vacío');
            const chunks: Uint8Array[] = [];
            let size = 0;
            while (true) {
                const r = await reader.read();
                if (r.done)
                    break;
                size += r.value.length;
                if (size > 32768) {
                    await reader.cancel();
                    fail(413, 'Evento demasiado grande');
                }
                chunks.push(r.value);
            }
            return json(await confirmation(Object.fromEntries(new URLSearchParams(Buffer.concat(chunks).toString()))));
        }
        if (method !== 'GET') {
            checkOrigin(req);
            await limit('write:local', 300);
        }
        const body = async () => { const reader = req.body?.getReader(); if (!reader)
            fail(400, 'JSON requerido'); const chunks: Uint8Array[] = []; let size = 0; while (true) {
            const r = await reader.read();
            if (r.done)
                break;
            size += r.value.length;
            if (size > 1024 * 1024) {
                await reader.cancel();
                fail(413, 'Carga demasiado grande');
            }
            chunks.push(r.value);
        } try {
            return JSON.parse(Buffer.concat(chunks).toString());
        }
        catch {
            fail(400, 'JSON incorrecto');
        } };
        const context = { req, parts, route, method, body };
        {
            const result = await paymentsRoutes(context);
            if (result)
                return result;
        }
        {
            const result = await ticketingRoutes(context);
            if (result)
                return result;
        }
        {
            const result = await authRoutes(context);
            if (result)
                return result;
        }
        {
            const result = await profileRoutes(context);
            if (result)
                return result;
        }
        {
            const result = await catalogRoutes(context);
            if (result)
                return result;
        }
        {
            const result = await favoritesRoutes(context);
            if (result)
                return result;
        }
        {
            const result = await listingsRoutes(context);
            if (result)
                return result;
        }
        {
            const result = await legalRoutes(context);
            if (result)
                return result;
        }
        {
            const result = await coursesRoutes(context);
            if (result)
                return result;
        }
        {
            const result = await eventsRoutes(context);
            if (result)
                return result;
        }
        {
            const result = await streamingRoutes(context);
            if (result)
                return result;
        }
        {
            const result = await imagesRoutes(context);
            if (result)
                return result;
        }
        {
            const result = await adminRoutes(context);
            if (result)
                return result;
        }
        if (route === 'health') {
            await db.query('SELECT 1');
            return json({ ok: true });
        }
        fail(404, 'Ruta no encontrada');
    }
    catch (e) {
        if (e instanceof ApiError)
            return json({ error: e.message }, e.status);
        const code = (e as {
            code?: string;
        }).code;
        if (code === '23505')
            return json({ error: 'El registro ya existe o la silla ya está reservada' }, 409);
        if (['23503', '23514', '22P02', '22007'].includes(code ?? ''))
            return json({ error: 'Datos o relaciones no válidos' }, 400);
        if (code === 'ENOENT')
            return json({ error: 'Archivo no disponible' }, 404);
        console.error('API error', e instanceof Error ? e.message : 'unknown');
        return json({ error: 'No se pudo completar la operación. Verifica el servicio de base de datos.' }, 503);
    }
}
export { handle as GET, handle as POST, handle as PATCH, handle as DELETE };
