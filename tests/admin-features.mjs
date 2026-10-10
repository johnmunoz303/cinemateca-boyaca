import assert from 'node:assert/strict';
import pg from 'pg';
import {readFile,readdir} from 'node:fs/promises';
import path from 'node:path';
process.loadEnvFile('.env');
const origin=process.env.TEST_ORIGIN??'http://localhost:3000';
const db=new pg.Pool({connectionString:process.env.TEST_DATABASE_URL??'postgresql://postgres:postgres@127.0.0.1:5434/postgres'});
const email=`admin-features-${Date.now()}@example.test`;let room,work,uid;
async function call(route,method='GET',body,cookie){const r=await fetch(origin+'/api/v1/'+route,{method,headers:{Origin:origin,'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},body:body?JSON.stringify(body):undefined});return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]}}
try{
 const login=await call('auth/login','POST',{email:process.env.ADMIN_EMAIL,password:process.env.ADMIN_PASSWORD});assert.equal(login.status,200);const admin=login.cookie;
 const register=await call('auth/register','POST',{email,nombres:'Prueba de mejoras',password:'prueba-segura-12345678'});assert.equal(register.status,201);uid=(await call('me','GET',null,register.cookie)).data.user.id;
 const roomBody={nombre:'Sala temporal de pruebas',direccion:'Dirección de prueba',filas:2,columnas:4,pasillo:2,inhabilitados:['A2']};
 const saved=await call('admin/salas','POST',roomBody,admin);assert.equal(saved.status,201);room=saved.data.id;
 const seats=await call(`admin/salas/${room}/asientos`,'GET',null,admin);assert.equal(seats.data.length,8);assert.equal(seats.data.filter(s=>s.habilitado).length,7);
 assert.equal((await call('admin/salas','POST',{...roomBody,filas:0},admin)).status,400);
 const f={titulo_manual:'Función temporal',sala_id:room,inicio:new Date(Date.now()+2*86400000).toISOString(),precio:10000,duracion_minutos:90,intervalo_minutos:15,estado:'publicada'};
 assert.equal((await call('admin/funciones','POST',{...f,inicio:'2020-01-01T10:00:00Z'},admin)).status,400);
 const concurrent=await Promise.all([call('admin/funciones','POST',f,admin),call('admin/funciones','POST',{...f,titulo_manual:'Intento en el mismo horario'},admin)]);assert.deepEqual(concurrent.map(r=>r.status).sort(),[201,409]);const fid=concurrent.find(r=>r.status===201).data.id;
 const map=await call(`funciones/${fid}/asientos`);assert.equal(map.data.find(s=>s.fila==='A'&&s.numero===2).estado,'inhabilitado');assert.equal(map.data[0].pasillo,2);
 assert.equal((await call('taquilla/reservar','POST',{funcion_id:fid,asientos:[map.data.find(s=>!s.habilitado).id]},register.cookie)).status,400);
 const reserved=await call('taquilla/reservar','POST',{funcion_id:fid,asientos:[map.data.find(s=>s.habilitado).id]},register.cookie);assert.equal(reserved.status,200);
 assert.equal((await call(`admin/salas/${room}`,'PATCH',{...roomBody,columnas:5},admin)).status,409);
 assert.equal((await call(`admin/funciones/${fid}`,'PATCH',{precio:15000},admin)).status,409);
 const draft=await call('admin/obras','POST',{titulo:'Obra temporal de validación',sinopsis:'Prueba sin video público',duracion:2,tipo:'corto',estado_publicacion:false,dominio_publico:true},admin);assert.equal(draft.status,201);work=draft.data.id;
 assert.equal((await call(`admin/obras/${work}`,'PATCH',{estado_publicacion:true},admin)).status,400);
 const fakeVideo=(await db.query("INSERT INTO videos(obra_id,ruta_archivo,checksum,tamano_bytes,estado_transcodificacion) VALUES($1,'00000000-0000-4000-8000-000000000000.source','test',0,'error') RETURNING id",[work])).rows[0];
 assert.equal((await call(`admin/videos/${fakeVideo.id}`,'DELETE',null,admin)).status,200);assert.ok((await db.query('SELECT eliminado_at FROM videos WHERE id=$1',[fakeVideo.id])).rows[0].eliminado_at);
 assert.equal((await call('admin/eventos','POST',{titulo:'Prueba',descripcion:'Prueba',categoria:'presencial',inicio:'2020-01-01',estado:'publicado'},admin)).status,400);
 assert.equal((await call('admin/legal','POST',{titulo:'Prueba',contenido:'Prueba',fuente_url:'javascript:alert(1)',publicado:false},admin)).status,400);
 const forgot=await call('auth/forgot','POST',{email});assert.equal(forgot.status,200);
 const mailbox=path.resolve(process.env.STORAGE_DIR??'storage','mailbox');let raw;
 for(const name of await readdir(mailbox)){const body=await readFile(path.join(mailbox,name),'utf8');if(body.includes(email))raw=body.match(/reset=([A-Za-z0-9_-]+)/)?.[1]}
 assert.ok(raw,'Recuperación local debe producir enlace');assert.equal((await call('auth/reset','POST',{token:raw,password:'nueva-prueba-segura-123456'})).status,200);assert.equal((await call('auth/reset','POST',{token:raw,password:'otra-prueba-segura-123456'})).status,400);
 console.log('Mejoras verificadas: distribución y sillas, concurrencia de horarios, fechas, reservas protegidas, publicación incompleta, eliminación de video, fuente legal y recuperación de un solo uso.');
}finally{
 if(room){await db.query('DELETE FROM pagos WHERE reserva_id IN (SELECT r.id FROM reservas r JOIN funciones f ON f.id=r.funcion_id WHERE f.sala_id=$1)',[room]);await db.query('DELETE FROM reservas_asientos WHERE funcion_id IN (SELECT id FROM funciones WHERE sala_id=$1)',[room]);await db.query('DELETE FROM reservas WHERE funcion_id IN (SELECT id FROM funciones WHERE sala_id=$1)',[room]);await db.query('DELETE FROM funciones WHERE sala_id=$1',[room]);await db.query('DELETE FROM asientos WHERE sala_id=$1',[room]);await db.query('DELETE FROM salas WHERE id=$1',[room])}
 if(work){await db.query('DELETE FROM videos WHERE obra_id=$1',[work]);await db.query('DELETE FROM obras WHERE id=$1',[work])}
 if(uid){await db.query('DELETE FROM password_tokens WHERE usuario_id=$1',[uid]);await db.query('DELETE FROM usuarios WHERE id=$1',[uid])}await db.end();
}
