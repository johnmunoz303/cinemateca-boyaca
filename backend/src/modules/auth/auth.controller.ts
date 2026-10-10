import { randomBytes } from 'node:crypto';
import { db } from '@/database/db';
import { sendPasswordReset } from '@/modules/mail/mail.service';
import { fail, user, limit, text, email, id, passwordPolicy, bootstrap, token } from '@/modules/auth/auth.service';
import { hashPassword, verifyPassword, digest } from '@/modules/auth/security.mjs';
import { cookie, json, type RouteContext } from '@/modules/api/http';
export async function authRoutes({ req, parts, route, method, body }: RouteContext) {
    if (route === 'auth/register' && method === 'POST') {
        const b = await body();
        const e = email(b.email), p = passwordPolicy(b.password);
        await limit('register:' + digest(e), 5);
        if ([process.env.ADMIN_EMAIL?.toLowerCase(), process.env.PROGRAMMER_EMAIL?.toLowerCase(), 'programador@cinemateca.local'].includes(e))
            fail(403, 'Correo reservado');
        const result = await db.query(`INSERT INTO usuarios(nombres,apellidos,email,password_hash,rol_id) SELECT $1,$2,$3,$4,id FROM roles WHERE nombre='espectador' RETURNING id,token_version`, [text(b.nombres, 100), typeof b.apellidos === 'string' ? b.apellidos.slice(0, 100) : '', e, hashPassword(p)]);
        const response = json({ ok: true }, 201);
        response.cookies.set('session', await token(result.rows[0]), cookie);
        return response;
    }
    if (route === 'auth/login' && method === 'POST') {
        const b = await body();
        const e = email(b.email);
        await limit('login:' + digest(e), 10);
        await bootstrap();
        const result = await db.query('SELECT * FROM usuarios WHERE email=$1 AND estado', [e]);
        const u = result.rows[0];
        const valid = verifyPassword(String(b.password ?? ''), u?.password_hash ?? hashPassword('dummy-password-12345'));
        if (!u || !valid)
            fail(401, 'Correo o contraseña incorrectos');
        await db.query('UPDATE usuarios SET ultimo_acceso=now() WHERE id=$1', [u.id]);
        const response = json({ ok: true });
        response.cookies.set('session', await token(u), cookie);
        return response;
    }
    if (route === 'auth/logout' && method === 'POST') {
        const u = await user(req);
        await db.query('UPDATE usuarios SET token_version=token_version+1 WHERE id=$1', [u.id]);
        const r = json({ ok: true });
        r.cookies.set('session', '', { ...cookie, maxAge: 0 });
        return r;
    }
    if (route === 'auth/forgot' && method === 'POST') {
        const b = await body();
        const e = email(b.email);
        await limit('reset:' + digest(e), 3);
        const u = (await db.query('SELECT id FROM usuarios WHERE email=$1', [e])).rows[0];
        if (u) {
            const raw = randomBytes(32).toString('base64url');
            await db.query(`INSERT INTO password_tokens(token_hash,usuario_id,expires_at) VALUES($1,$2,now()+interval '20 minutes')`, [digest(raw), u.id]);
            try {
                await sendPasswordReset(e, raw);
            }
            catch {
                console.error('No se pudo enviar recuperación: revisa la configuración del servicio de correo');
            }
        }
        return json({ message: 'Si el correo está registrado, recibirá instrucciones para recuperar su contraseña.' });
    }
    if (route === 'auth/reset' && method === 'POST') {
        const b = await body();
        const p = passwordPolicy(b.password);
        const c = await db.connect();
        try {
            await c.query('BEGIN');
            const t = (await c.query('SELECT * FROM password_tokens WHERE token_hash=$1 AND used_at IS NULL AND expires_at>now() FOR UPDATE', [digest(text(b.token, 200))])).rows[0];
            if (!t)
                fail(400, 'Enlace inválido o vencido');
            await c.query('UPDATE usuarios SET password_hash=$1,token_version=token_version+1 WHERE id=$2', [hashPassword(p), t.usuario_id]);
            await c.query('UPDATE password_tokens SET used_at=now() WHERE token_hash=$1', [t.token_hash]);
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
