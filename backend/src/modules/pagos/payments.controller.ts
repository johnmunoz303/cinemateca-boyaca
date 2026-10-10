import { checkout } from '@/modules/pagos/payu.service';
import { randomUUID } from 'node:crypto';
import QRCode from 'qrcode';
import { db } from '@/database/db';
import { fail, user, text, email, id } from '@/modules/auth/auth.service';
import { signPayload } from '@/modules/auth/security.mjs';
import { json, type RouteContext } from '@/modules/api/http';
export async function paymentsRoutes({ req, parts, route, method, body }: RouteContext) {
    if (route === 'pagos/config' && method === 'GET')
        return json({ mode: process.env.PAYMENT_MODE ?? 'simulation' });
    if (route === 'pagos/checkout' && method === 'POST') {
        const u = await user(req), b = await body();
        return json(await checkout(u.id, text(b.reserva_id, 64), u.email));
    }
    if (route === 'pagos/simular' && method === 'POST') {
        if (process.env.PAYMENT_MODE !== 'simulation')
            fail(403, 'Simulación desactivada');
        const u = await user(req), b = await body(), rid = text(b.reserva_id, 64), c = await db.connect();
        try {
            await c.query('BEGIN');
            const r = (await c.query('SELECT * FROM reservas WHERE id=$1 AND usuario_id=$2 FOR UPDATE', [rid, u.id])).rows[0];
            if (!r)
                fail(404, 'Reserva no encontrada');
            const f = (await c.query('SELECT * FROM funciones WHERE id=$1 FOR UPDATE', [r.funcion_id])).rows[0];
            if (f.estado !== 'publicada')
                fail(409, 'Función cancelada');
            if (r.estado === 'confirmada') {
                await c.query('COMMIT');
                return json({ ticket: r.codigo_ticket, qr: await QRCode.toDataURL(r.codigo_ticket), simulado: true });
            }
            if (r.estado !== 'pendiente' || new Date(r.expiracion).getTime() <= Date.now())
                fail(409, 'La reserva venció');
            const seats = (await c.query('SELECT asiento_id FROM reservas_asientos WHERE reserva_id=$1 AND activo', [rid])).rows;
            if (!seats.length)
                fail(409, 'Reserva no disponible');
            const signed = signPayload({ reserva: rid, usuario: u.id, funcion: r.funcion_id, asientos: seats.map(x => x.asiento_id) }, process.env.TICKET_SECRET);
            await c.query("INSERT INTO pagos(id,reserva_id,estado,monto) VALUES($1,$2,'aprobado',$3)", [randomUUID(), rid, Number(f.precio) * seats.length]);
            await c.query("UPDATE reservas SET estado='confirmada',codigo_ticket=$1 WHERE id=$2", [signed, rid]);
            await c.query('COMMIT');
            return json({ ticket: signed, qr: await QRCode.toDataURL(signed), simulado: true });
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
