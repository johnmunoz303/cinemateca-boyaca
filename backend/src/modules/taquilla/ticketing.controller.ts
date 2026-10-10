import { ticketPdf } from '@/modules/taquilla/pdf';
import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import QRCode from 'qrcode';
import { db } from '@/database/db';
import { fail, user, text, id } from '@/modules/auth/auth.service';
import { json, expire, type RouteContext } from '@/modules/api/http';
export async function ticketingRoutes({ req, parts, route, method, body }: RouteContext) {
    if (parts[0] === 'taquilla' && parts[1] === 'ticket' && method === 'GET') {
        const u = await user(req), rid = text(parts[2], 64);
        const r = (await db.query("SELECT r.*,COALESCE(f.titulo_manual,o.titulo) titulo,f.inicio,s.nombre sala,p.monto,p.metodo_pago FROM reservas r JOIN funciones f ON f.id=r.funcion_id JOIN salas s ON s.id=f.sala_id LEFT JOIN obras o ON o.id=f.obra_id JOIN pagos p ON p.reserva_id=r.id WHERE r.id=$1 AND r.usuario_id=$2", [rid, u.id])).rows[0];
        if (!r)
            fail(404, 'Reserva no encontrada');
        if (parts[3] === 'pdf') {
            if (r.estado !== 'confirmada')
                fail(409, 'El pago todavía no está confirmado');
            const seats = (await db.query('SELECT a.fila,a.numero FROM reservas_asientos ra JOIN asientos a ON a.id=ra.asiento_id WHERE ra.reserva_id=$1 ORDER BY a.fila,a.numero', [rid])).rows;
            const pdf = ticketPdf(r.codigo_ticket, [r.titulo, 'Sala: ' + r.sala, 'Fecha: ' + new Date(r.inicio).toLocaleString('es-CO', { timeZone: 'America/Bogota' }), 'Sillas: ' + seats.map(a => a.fila + a.numero).join(', '), 'Total COP: ' + r.monto, 'Pago: ' + r.metodo_pago, 'Reserva: ' + rid]);
            return new NextResponse(pdf, { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename=tiquete.pdf', 'Cache-Control': 'no-store' } });
        }
        return json({ estado: r.estado, ticket: r.estado === 'confirmada' ? r.codigo_ticket : null, qr: r.estado === 'confirmada' ? await QRCode.toDataURL(r.codigo_ticket) : null });
    }
    if (parts[0] === 'funciones' && parts[2] === 'asientos' && method === 'GET') {
        await expire(db);
        return json((await db.query(`SELECT a.*,s.columnas,s.pasillo,CASE WHEN NOT a.habilitado THEN 'inhabilitado' WHEN ra.activo AND r.estado='confirmada' THEN 'ocupado' WHEN ra.activo THEN 'bloqueado' ELSE 'disponible' END estado FROM asientos a JOIN funciones f ON f.sala_id=a.sala_id JOIN salas s ON s.id=a.sala_id LEFT JOIN reservas_asientos ra ON ra.asiento_id=a.id AND ra.funcion_id=f.id AND ra.activo LEFT JOIN reservas r ON r.id=ra.reserva_id WHERE f.id=$1 ORDER BY fila,numero`, [id(parts[1])])).rows);
    }
    if (route === 'taquilla/reservar' && method === 'POST') {
        const u = await user(req), b = await body(), fid = id(b.funcion_id);
        if (!Array.isArray(b.asientos) || b.asientos.length < 1 || b.asientos.length > 8)
            fail(400, 'Selecciona entre 1 y 8 asientos');
        const seats = [...new Set<number>(b.asientos.map(id))].sort((a, b) => a - b), c = await db.connect();
        try {
            await c.query('BEGIN');
            const f = (await c.query("SELECT * FROM funciones WHERE id=$1 AND estado='publicada' AND inicio>now() FOR UPDATE", [fid])).rows[0];
            if (!f)
                fail(400, 'Función no disponible');
            await expire(c);
            const valid = await c.query('SELECT id FROM asientos WHERE sala_id=$1 AND habilitado AND id=ANY($2::int[]) ORDER BY id FOR UPDATE', [f.sala_id, seats]);
            if (valid.rowCount !== seats.length)
                fail(400, 'Asientos no válidos');
            const occupied = await c.query('SELECT 1 FROM reservas_asientos WHERE funcion_id=$1 AND asiento_id=ANY($2::int[]) AND activo', [fid, seats]);
            if (occupied.rowCount)
                fail(409, 'Otro usuario acaba de reservar una silla');
            const rid = randomUUID();
            const result = await c.query('INSERT INTO reservas(id,usuario_id,funcion_id) VALUES($1,$2,$3) RETURNING *', [rid, u.id, fid]);
            for (const seat of seats)
                await c.query('INSERT INTO reservas_asientos(reserva_id,funcion_id,asiento_id) VALUES($1,$2,$3)', [rid, fid, seat]);
            await c.query('COMMIT');
            return json({ ...result.rows[0], total: Number(f.precio) * seats.length });
        }
        catch (e) {
            await c.query('ROLLBACK');
            throw e;
        }
        finally {
            c.release();
        }
    }
    if (route === 'reservas/cancelar' && method === 'POST') {
        const u = await user(req), b = await body(), c = await db.connect();
        try {
            await c.query('BEGIN');
            const r = (await c.query('SELECT * FROM reservas WHERE id=$1 AND usuario_id=$2 FOR UPDATE', [text(b.reserva_id, 64), u.id])).rows[0];
            if (!r || r.estado !== 'pendiente')
                fail(400, 'Solo puedes cancelar reservas pendientes');
            await c.query("UPDATE reservas SET estado='cancelada' WHERE id=$1", [r.id]);
            await c.query('UPDATE reservas_asientos SET activo=false WHERE reserva_id=$1', [r.id]);
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
