import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
export type RouteContext = {
    req: NextRequest;
    parts: string[];
    route: string;
    method: string;
    body: () => Promise<any>;
};
export const cookie = { httpOnly: true, sameSite: 'lax' as const, secure: process.env.COOKIE_SECURE === 'true', path: '/', maxAge: 28800 };
export const json = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
export const storage = () => path.resolve(process.env.STORAGE_DIR ?? 'storage');
export async function expire(client: {
    query: Function;
}) { const expired = await client.query("UPDATE reservas SET estado='expirada' WHERE estado='pendiente' AND expiracion<=now() RETURNING id"); if (expired.rows.length)
    await client.query('UPDATE reservas_asientos SET activo=false WHERE reserva_id=ANY($1::uuid[])', [expired.rows.map((r: {
            id: string;
        }) => r.id)]); }
