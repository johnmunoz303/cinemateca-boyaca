import {PGlite} from '@electric-sql/pglite';
import {PGLiteSocketServer} from '@electric-sql/pglite-socket';
import {spawn} from 'node:child_process';
import {readFileSync,readdirSync,openSync,mkdirSync} from 'node:fs';
import {createHash,randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
mkdirSync('.test-runtime',{recursive:true});
const memory=await PGlite.create();for(const f of readdirSync('database').filter(f=>f.endsWith('.sql')).sort())await memory.exec(readFileSync('database/'+f,'utf8'));
const socket=new PGLiteSocketServer({db:memory,host:'127.0.0.1',port:5436});await socket.start();
const origin='http://127.0.0.1:3006',key='sandbox-local-test-key-only';
const env={...process.env,DATABASE_URL:'postgresql://postgres:postgres@127.0.0.1:5436/postgres',APP_ORIGIN:origin,JWT_SECRET:randomUUID()+randomUUID(),TICKET_SECRET:randomUUID()+randomUUID(),ADMIN_EMAIL:'admin@payu-test.local',ADMIN_PASSWORD:randomUUID(),PAYMENT_MODE:'payu_sandbox',PAYU_API_KEY:key,PAYU_MERCHANT_ID:'test-merchant',PAYU_ACCOUNT_ID:'test-account',PUBLIC_APP_URL:'https://example.test',NEXT_BUILD_DIR:'payu-test-build',COOKIE_SECURE:'false'};
const log=openSync('.test-runtime/payu.log','w');const web=spawn(process.execPath,['node_modules/next/dist/bin/next','dev','backend','--webpack','--hostname','127.0.0.1','--port','3006'],{env,windowsHide:true,stdio:['ignore',log,log]});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function call(route,body,cookie){const r=await fetch(origin+'/api/v1/'+route,{method:body?'POST':'GET',headers:{Origin:origin,'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},body:body?JSON.stringify(body):undefined});return {status:r.status,b:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]}}
async function webhook(fields){const r=await fetch(origin+'/api/v1/pagos/webhook',{method:'POST',body:new URLSearchParams(fields)});return {status:r.status,b:await r.json()}}
function event(reference,value='10000.00'){const b={merchant_id:env.PAYU_MERCHANT_ID,reference_sale:reference,value,currency:'COP',state_pol:'4',test:'1'};const normalized=Number(value).toFixed(2).replace(/0$/,'');b.sign=createHash('md5').update(`${key}~${b.merchant_id}~${reference}~${normalized}~COP~4`).digest('hex');return b}
try{
 let ready=false;for(let i=0;i<45;i++){try{if((await call('health')).status===200){ready=true;break}}catch{}await wait(1000)}assert.ok(ready,'Backend no respondió');
 const admin=await call('auth/login',{email:env.ADMIN_EMAIL,password:env.ADMIN_PASSWORD});assert.equal(admin.status,200);
 const user=await call('auth/register',{nombres:'Prueba aislada',email:'viewer@payu-test.local',password:randomUUID()});assert.equal(user.status,201);
 const f=(await memory.query("INSERT INTO funciones(titulo_manual,sala_id,inicio,precio) VALUES('Función de prueba aislada',1,now()+interval '1 day',10000) RETURNING id")).rows[0];
 const reserve=await call('taquilla/reservar',{funcion_id:f.id,asientos:[1]},user.cookie);assert.equal(reserve.status,200);
 const checkout=await call('pagos/checkout',{reserva_id:reserve.b.id},user.cookie);assert.equal(checkout.status,200);assert.equal(checkout.b.fields.test,'1');assert.ok(checkout.b.action.includes('sandbox'));assert.ok(!JSON.stringify(checkout.b).includes(key));
 const good=event(checkout.b.fields.referenceCode);assert.equal((await webhook({...good,sign:'0'.repeat(32)})).status,403);assert.equal((await webhook(event(good.reference_sale,'9999.00'))).status,400);
 assert.equal((await webhook(good)).status,200);assert.equal((await webhook(good)).status,200);assert.equal(Number((await memory.query('SELECT count(*) n FROM pagos WHERE reserva_id=$1',[reserve.b.id])).rows[0].n),1);
 const ticket=await call('taquilla/ticket/'+reserve.b.id,undefined,user.cookie);assert.equal(ticket.b.estado,'confirmada');assert.ok(ticket.b.ticket);
 const pdf=await fetch(origin+'/api/v1/taquilla/ticket/'+reserve.b.id+'/pdf',{headers:{Cookie:user.cookie}});assert.equal(pdf.status,200);assert.ok((await pdf.text()).startsWith('%PDF-1.4'));
 assert.equal((await call('admin/ticket',{ticket:ticket.b.ticket,registrar:true},admin.cookie)).status,200);assert.equal((await call('admin/ticket',{ticket:ticket.b.ticket,registrar:true},admin.cookie)).status,409);
 const late=await call('taquilla/reservar',{funcion_id:f.id,asientos:[2]},user.cookie);const lateCheckout=await call('pagos/checkout',{reserva_id:late.b.id},user.cookie);await memory.query("UPDATE reservas SET expiracion=now()-interval '1 minute' WHERE id=$1",[late.b.id]);assert.equal((await webhook(event(lateCheckout.b.fields.referenceCode))).b.revision,true);assert.equal((await call('taquilla/ticket/'+late.b.id,undefined,user.cookie)).b.ticket,null);
 console.log('OK: PayU sandbox, firma, monto, idempotencia, aprobación tardía, PDF y entrada de un solo uso. Sin conexión al proveedor ni cobros reales.');
}finally{web.kill();await socket.stop();await memory.close()}
