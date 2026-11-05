import assert from 'node:assert/strict';
import pg from 'pg';
const origin=process.env.APP_ORIGIN??'http://localhost:3000';
const db=new pg.Pool({connectionString:process.env.DATABASE_URL});
async function call(route,{method='GET',body,cookie}={}){const r=await fetch(origin+'/api/v1/'+route,{method,headers:{'Content-Type':'application/json',Origin:origin,...(cookie?{Cookie:cookie}:{})},body:body?JSON.stringify(body):undefined});return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]}}
const stamp=Date.now();let testFunction;let testWork;
try{
 assert.equal((await call('health')).status,200);
 const a=await call('auth/register',{method:'POST',body:{nombres:'Prueba A',email:`prueba-a-${stamp}@example.test`,password:'frase-segura-de-prueba-123',rol:'administrador'}});
 const b=await call('auth/register',{method:'POST',body:{nombres:'Prueba B',email:`prueba-b-${stamp}@example.test`,password:'frase-segura-de-prueba-456'}});
 assert.equal(a.status,201);assert.equal(b.status,201);
 assert.equal((await call('me',{cookie:a.cookie})).data.user.rol,'espectador');
 assert.equal((await call('admin/obras',{cookie:a.cookie})).status,403);
 assert.equal((await call('auth/register',{method:'POST',body:{nombres:'Intruso',email:process.env.ADMIN_EMAIL,password:'frase-segura-incorrecta'}})).status,403);
 const wrongOrigin=await fetch(origin+'/api/v1/obras/1/favorito',{method:'POST',headers:{Origin:'https://otro.example',Cookie:a.cookie,'Content-Type':'application/json'},body:JSON.stringify({active:true})});assert.equal(wrongOrigin.status,403);
 testWork=(await db.query("INSERT INTO obras(titulo,sinopsis,duracion,tipo) VALUES('Obra aislada de prueba','Solo para integraci?n',1,'corto') RETURNING id")).rows[0].id;
 testFunction=(await db.query("INSERT INTO funciones(obra_id,sala_id,inicio,precio) VALUES($1,1,now()+interval '1 day',12000) RETURNING id",[testWork])).rows[0].id;
 const seat=(await db.query('SELECT id FROM asientos WHERE sala_id=1 ORDER BY id LIMIT 1')).rows[0].id;
 const concurrent=await Promise.all([a,b].map(x=>call('taquilla/reservar',{method:'POST',cookie:x.cookie,body:{funcion_id:testFunction,asientos:[seat]}})));
 assert.deepEqual(concurrent.map(x=>x.status).sort(),[200,409]);
 const winner=concurrent.findIndex(x=>x.status===200),reservation=concurrent[winner].data;
 const stranger=await call('pagos/simular',{method:'POST',cookie:[a,b][1-winner].cookie,body:{reserva_id:reservation.id}});assert.equal(stranger.status,404);
 const payment=await call('pagos/simular',{method:'POST',cookie:[a,b][winner].cookie,body:{reserva_id:reservation.id}});assert.equal(payment.status,200);assert.equal(payment.data.simulado,true);
 const repeated=await call('pagos/simular',{method:'POST',cookie:[a,b][winner].cookie,body:{reserva_id:reservation.id}});assert.equal(repeated.data.ticket,payment.data.ticket);
 const count=(await db.query('SELECT count(*) FROM pagos WHERE reserva_id=$1',[reservation.id])).rows[0].count;assert.equal(Number(count),1);
 const administrator=await call('auth/login',{method:'POST',body:{email:process.env.ADMIN_EMAIL,password:process.env.ADMIN_PASSWORD}});assert.equal(administrator.status,200);
 const gate=await call('auth/register',{method:'POST',body:{nombres:'Control de prueba',email:`gate-${stamp}@example.test`,password:'frase-control-prueba-789'}});assert.equal(gate.status,201);
 await db.query("UPDATE usuarios SET rol_id=(SELECT id FROM roles WHERE nombre='programador') WHERE email=$1",[`gate-${stamp}@example.test`]);
 assert.equal((await call('admin/usuarios',{cookie:gate.cookie})).status,403);
 assert.equal((await call('admin/reportes',{cookie:gate.cookie})).status,403);
 assert.equal((await call('admin/ticket',{cookie:gate.cookie})).status,403);
 const owner=[a,b][winner];
 const ticket=await call('taquilla/ticket/'+reservation.id,{cookie:owner.cookie});assert.equal(ticket.status,200);assert.equal(ticket.data.estado,'confirmada');assert.ok(ticket.data.qr.startsWith('data:image/png;base64,'));
 assert.equal((await call('taquilla/ticket/'+reservation.id,{cookie:[a,b][1-winner].cookie})).status,404);
 const pdf=await fetch(origin+'/api/v1/taquilla/ticket/'+reservation.id+'/pdf',{headers:{Cookie:owner.cookie}});assert.equal(pdf.status,200);assert.ok(pdf.headers.get('content-type').includes('application/pdf'));assert.equal(Buffer.from(await pdf.arrayBuffer()).subarray(0,5).toString(),'%PDF-');
 assert.equal((await call('admin/ticket',{method:'POST',cookie:[a,b][1-winner].cookie,body:{ticket:ticket.data.ticket,registrar:true}})).status,403);
 assert.equal((await call('admin/ticket',{method:'POST',cookie:gate.cookie,body:{ticket:ticket.data.ticket,registrar:true}})).status,200);
 assert.equal((await call('admin/ticket',{method:'POST',cookie:administrator.cookie,body:{ticket:ticket.data.ticket,registrar:true}})).status,409);
 assert.equal((await call('admin/ticket',{method:'POST',cookie:gate.cookie,body:{ticket:ticket.data.ticket,registrar:true}})).status,409);
 console.log('Programador: valida tiquete una vez; espectadores, usuarios y reportes permanecen restringidos.');
 assert.equal((await call('admin/ticket',{method:'POST',cookie:administrator.cookie,body:{ticket:ticket.data.ticket+'x',registrar:true}})).status,400);
 const nextSeat=(await db.query('SELECT id FROM asientos WHERE sala_id=1 AND id<>$1 ORDER BY id LIMIT 1',[seat])).rows[0].id;
 const pending=await call('taquilla/reservar',{method:'POST',cookie:owner.cookie,body:{funcion_id:testFunction,asientos:[nextSeat]}});assert.equal(pending.status,200);assert.ok(new Date(pending.data.expiracion).getTime()>Date.now());
 await db.query("UPDATE reservas SET expiracion=now()-interval '1 minute' WHERE id=$1",[pending.data.id]);
 assert.equal((await call('pagos/simular',{method:'POST',cookie:owner.cookie,body:{reserva_id:pending.data.id}})).status,409);
 const available=await call('funciones/'+testFunction+'/asientos');assert.equal(available.data.find(s=>s.id===nextSeat).estado,'disponible');
 const again=await call('taquilla/reservar',{method:'POST',cookie:owner.cookie,body:{funcion_id:testFunction,asientos:[nextSeat]}});assert.equal(again.status,200);
 assert.equal((await call('reservas/cancelar',{method:'POST',cookie:owner.cookie,body:{reserva_id:again.data.id}})).status,200);
 console.log('Tiquetes: PDF y QR, titular de reserva, ingreso único, firma alterada, vencimiento, liberación y cancelación verificados.');
 assert.equal((await call('admin/reportes',{cookie:administrator.cookie})).status,200);
 const users=await call('admin/usuarios',{cookie:administrator.cookie});assert.equal(JSON.stringify(users.data).includes('password_hash'),false);
 const logoff=await call('auth/logout',{method:'POST',cookie:a.cookie,body:{}});assert.equal(logoff.status,200);assert.equal((await call('admin/obras',{cookie:a.cookie})).status,401);
 console.log('Integración correcta: registro sin elevación, CSRF, aislamiento, concurrencia de asientos, pago idempotente y revocación.');
}finally{
 if(testFunction){const ids=(await db.query('SELECT id FROM reservas WHERE funcion_id=$1',[testFunction])).rows.map(x=>x.id);await db.query('DELETE FROM pagos WHERE reserva_id=ANY($1::uuid[])',[ids]);await db.query('DELETE FROM reservas_asientos WHERE funcion_id=$1',[testFunction]);await db.query('DELETE FROM reservas WHERE funcion_id=$1',[testFunction]);await db.query('DELETE FROM funciones WHERE id=$1',[testFunction])}
 if(testWork)await db.query('DELETE FROM obras WHERE id=$1',[testWork]);
 await db.query('DELETE FROM usuarios WHERE email IN($1,$2,$3)',[`prueba-a-${stamp}@example.test`,`prueba-b-${stamp}@example.test`,`gate-${stamp}@example.test`]);await db.end();
}
