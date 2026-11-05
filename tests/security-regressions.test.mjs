import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import vm from 'node:vm';
import ts from 'typescript';
import {PGlite} from '@electric-sql/pglite';
import * as crypto from '../backend/src/modules/auth/security.mjs';
const require=createRequire(import.meta.url);
const fail=(status,message)=>{throw Object.assign(Error(message),{status})};
const auth={fail,text:value=>{if(typeof value!=='string'||!value.trim())fail(400,'Campo requerido');return value.trim()},id:Number,passwordPolicy:value=>{if(typeof value!=='string'||value.length<12)fail(400,'Contraseña corta');return value}};
function load(file,mocks,env={}){const exports={};const code=ts.transpileModule(readFileSync(new URL('../'+file,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;vm.runInNewContext(code,{exports,require:name=>name in mocks?mocks[name]:require(name),process:{env},Buffer,Headers,Response,TransformStream,URL,URLSearchParams,Date,console},{filename:file});return exports;}
async function setup(){const memory=new PGlite();await memory.exec(readFileSync(new URL('../database/001_schema.sql',import.meta.url),'utf8'));const query=async(...args)=>{const r=await memory.query(...args);return {...r,rowCount:r.rows.length||r.affectedRows||0}};return {memory,db:{query,connect:async()=>({query,release(){}})}};}

test('Recuperación invalida enlaces pendientes, rechaza reutilización y vencimiento',async()=>{
 const {memory,db}=await setup();try{
  await db.query("INSERT INTO usuarios(nombres,email,password_hash,rol_id) VALUES('Prueba','reset@example.test',$1,1)",[crypto.hashPassword('Original-password-123')]);
  for(const raw of ['token-first','token-second'])await db.query("INSERT INTO password_tokens(token_hash,usuario_id,expires_at) VALUES($1,1,now()+interval '20 minutes')",[crypto.digest(raw)]);
  const {resetPassword}=load('backend/src/modules/auth/password-change.service.ts',{'@/database/db':{db},'./auth.service':auth,'./security.mjs':crypto});
  await resetPassword('token-first','Updated-password-123');
  await assert.rejects(()=>resetPassword('token-first','Another-password-123'),e=>e.status===400);
  await assert.rejects(()=>resetPassword('token-second','Another-password-123'),e=>e.status===400);
  const user=(await db.query('SELECT password_hash,token_version FROM usuarios WHERE id=1')).rows[0];assert.ok(crypto.verifyPassword('Updated-password-123',user.password_hash));assert.equal(user.token_version,1);
  await db.query("INSERT INTO password_tokens(token_hash,usuario_id,expires_at) VALUES($1,1,now()-interval '1 second')",[crypto.digest('expired-token')]);
  await assert.rejects(()=>resetPassword('expired-token','Another-password-123'),e=>e.status===400);
 }finally{await memory.close()}
});

test('Perfil y contraseña son atómicos; éxito invalida enlaces y sesiones',async()=>{
 const {memory,db}=await setup();try{
  await db.query("INSERT INTO usuarios(nombres,email,password_hash,rol_id) VALUES('Original','profile@example.test',$1,1)",[crypto.hashPassword('Original-password-123')]);
  await db.query("INSERT INTO password_tokens(token_hash,usuario_id,expires_at) VALUES('pending',1,now()+interval '20 minutes')");
  const {updateProfile}=load('backend/src/modules/auth/password-change.service.ts',{'@/database/db':{db},'./auth.service':auth,'./security.mjs':crypto});
  await assert.rejects(()=>updateProfile(1,{nombres:'Wrong mutation',currentPassword:'incorrect',newPassword:'Updated-password-123'}),e=>e.status===400);
  assert.equal((await db.query('SELECT nombres FROM usuarios WHERE id=1')).rows[0].nombres,'Original');
  assert.equal((await db.query('SELECT used_at FROM password_tokens')).rows[0].used_at,null);
  assert.equal((await updateProfile(1,{nombres:'Updated',currentPassword:'Original-password-123',newPassword:'Updated-password-123'})).relogin,true);
  assert.ok((await db.query('SELECT used_at FROM password_tokens')).rows[0].used_at);assert.equal((await db.query('SELECT token_version FROM usuarios WHERE id=1')).rows[0].token_version,1);
 }finally{await memory.close()}
});

test('Temario público no expone materiales; curso inactivo exige administrador',async()=>{
 const {memory,db}=await setup();try{
  await memory.exec("INSERT INTO usuarios(nombres,email,password_hash,rol_id) VALUES('Prueba','course@example.test','test',1);INSERT INTO cursos(titulo,descripcion,estado) VALUES('Curso','Resumen',true)");
  await db.query("INSERT INTO modulos(curso_id,titulo,ruta,obra_id) VALUES(1,'Lección','https://example.test/private-material',null)");
  let actor=null;const {coursesRoutes}=load('backend/src/modules/cursos/courses.controller.ts',{'@/database/db':{db},'@/modules/auth/auth.service':{...auth,user:async()=>actor},'@/modules/api/http':{json:data=>({data})},'@/modules/cursos/enrollment.service':{}});
  const request={parts:['cursos','1'],method:'GET',req:{}};
  const publicRows=(await coursesRoutes(request)).data;assert.equal(publicRows[0].titulo,'Lección');assert.equal('ruta' in publicRows[0],false);assert.equal('obra_id' in publicRows[0],false);
  actor={id:1,rol:'espectador'};await db.query('INSERT INTO inscripciones(usuario_id,curso_id) VALUES(1,1)');assert.equal((await coursesRoutes(request)).data[0].ruta,'https://example.test/private-material');
  await db.query('UPDATE cursos SET estado=false');await assert.rejects(()=>coursesRoutes(request),e=>e.status===404);
  actor={id:1,rol:'administrador'};assert.equal((await coursesRoutes(request)).data.length,1);
 }finally{await memory.close()}
});

test('Cuotas de escritura separadas por usuario y cabeceras no confiables ignoradas',async()=>{
 const calls=[];let actor={id:1};const env={TRUST_FRONTEND_IP:'true'};
 const security=load('backend/src/modules/auth/request-security.ts',{'./security.mjs':crypto,'./auth.service':{user:async()=>actor,limit:async(key,max)=>calls.push([key,max])}},env);
 const request={headers:new Headers({'x-cinemateca-client-ip':'192.168.1.20','x-forwarded-for':'8.8.8.8'}),nextUrl:new URL('http://localhost/api/v1/me')};
 await security.limitWrites(request);actor={id:2};await security.limitWrites(request);assert.notEqual(calls[0][0],calls[1][0]);assert.equal(security.clientIp(request),'192.168.1.20');
 env.TRUST_FRONTEND_IP='false';assert.equal(security.clientIp(request),'127.0.0.1');env.TRUST_FRONTEND_IP='true';request.headers.set('x-cinemateca-client-ip','not-an-ip');assert.equal(security.clientIp(request),'127.0.0.1');
});

test('Frontend sustituye IP falsificada por la dirección del socket',async()=>{
 const preload=new URL('../scripts/trusted-client-ip.cjs',import.meta.url);
 const code="const http=require('http');const server=http.createServer((req,res)=>{res.end(req.headers['x-cinemateca-client-ip']);});server.listen(0,'127.0.0.1',()=>console.log(server.address().port));";
 const child=spawn(process.execPath,['--require',preload.pathname.replace(/^\/([A-Z]:)/,'$1'),'-e',code],{env:{...process.env,SERVICE:'frontend'},windowsHide:true,stdio:['ignore','pipe','pipe']});
 try{const port=await new Promise((resolve,reject)=>{let text='';const timeout=setTimeout(()=>reject(Error('Servidor de prueba no inició')),8000);child.on('error',reject);child.stdout.on('data',chunk=>{text+=chunk;if(text.includes('\n')){clearTimeout(timeout);resolve(Number(text.trim()))}})});const response=await fetch('http://127.0.0.1:'+port,{headers:{'x-cinemateca-client-ip':'8.8.8.8','x-forwarded-for':'8.8.4.4'}});assert.equal(await response.text(),'127.0.0.1')}finally{child.kill()}
});

test('Formulario rechaza carga excesiva antes de interpretar el archivo',async()=>{
 const {limitedForm}=load('backend/src/modules/api/form-data.ts',{'@/modules/auth/auth.service':auth});
 const form=new FormData();form.set('file',new Blob([new Uint8Array(70000)]),'test.bin');const req=new Request('http://localhost',{method:'POST',body:form});await assert.rejects(()=>limitedForm(req,100),e=>e.status===413);
});

test('Correo incluye enlace temporal con token en fragmento y nombre Cinemateca',async()=>{
 let message;const mail=load('backend/src/modules/mail/mail.service.ts',{nodemailer:{createTransport:()=>({sendMail:async value=>{message=value}})}},{NODE_ENV:'production',MAIL_MODE:'smtp',SMTP_HOST:'smtp.example.test',SMTP_FROM:'cinemateca@example.test',SMTP_USER:'sender',SMTP_PASSWORD:'synthetic-only',PUBLIC_APP_URL:'https://cinemateca.example.test'});
 await mail.sendPasswordReset('reader@example.test','synthetic-reset-token');assert.equal(message.from.name,'Cinemateca de Boyacá');const link=new URL(message.text.match(/https:\/\/\S+/)[0]);assert.equal(link.search,'');assert.ok(link.hash.includes('synthetic-reset-token'));assert.equal(message.to,'reader@example.test');
});

test('Cancelar inscripción afecta solo al titular, libera cupo y permite inscribirse otra vez',async()=>{
 const {memory,db}=await setup();try{
  await db.query("INSERT INTO usuarios(nombres,email,password_hash,rol_id) VALUES('A','cancel-a@example.test','hash',1),('B','cancel-b@example.test','hash',1)");
  const course=(await db.query("INSERT INTO cursos(titulo,descripcion) VALUES('Programa','Descripción de prueba') RETURNING id")).rows[0].id;
  const module=(await db.query("INSERT INTO modulos(curso_id,titulo,orden) VALUES($1,'Lección',1) RETURNING id",[course])).rows[0].id;
  const event=(await db.query("INSERT INTO eventos(titulo,descripcion,inicio) VALUES('Evento','Descripción de prueba',now()+interval '1 day') RETURNING id")).rows[0].id;
  await db.query('INSERT INTO inscripciones(usuario_id,curso_id) VALUES(1,$1),(2,$1)',[course]);
  await db.query('INSERT INTO progreso_modulos(usuario_id,modulo_id) VALUES(1,$1),(2,$1)',[module]);
  await db.query('INSERT INTO eventos_inscripciones(usuario_id,evento_id) VALUES(1,$1),(2,$1)',[event]);
  const {cancelEnrollment}=load('backend/src/modules/cursos/cancel-enrollment.service.ts',{'@/database/db':{db}});
  await cancelEnrollment(1,event,'evento');await cancelEnrollment(1,event,'evento');
  assert.equal((await db.query('SELECT * FROM eventos_inscripciones WHERE usuario_id=1')).rows.length,0);
  assert.equal((await db.query('SELECT * FROM eventos_inscripciones WHERE usuario_id=2')).rows.length,1);
  await cancelEnrollment(1,course,'curso');
  assert.equal((await db.query('SELECT * FROM inscripciones WHERE usuario_id=1')).rows.length,0);
  assert.equal((await db.query('SELECT * FROM progreso_modulos WHERE usuario_id=1')).rows.length,0);
  assert.equal((await db.query('SELECT * FROM inscripciones WHERE usuario_id=2')).rows.length,1);
  assert.equal((await db.query('SELECT * FROM progreso_modulos WHERE usuario_id=2')).rows.length,1);
  await db.query('INSERT INTO eventos_inscripciones(usuario_id,evento_id) VALUES(1,$1)',[event]);
  await db.query('INSERT INTO inscripciones(usuario_id,curso_id) VALUES(1,$1)',[course]);
  assert.equal((await db.query('SELECT progreso_porcentaje FROM inscripciones WHERE usuario_id=1')).rows[0].progreso_porcentaje,0);
 }finally{await memory.close()}
});

test('Equipo: migración repetible conserva ediciones y no reaparece un perfil retirado',async()=>{
 const memory=new PGlite();try{
  const sql=readFileSync(new URL('../database/018_equipo.sql',import.meta.url),'utf8');await memory.exec(sql);
  assert.equal((await memory.query('SELECT count(*) n FROM equipo_miembros')).rows[0].n,3);
  await memory.query("UPDATE equipo_miembros SET nombre='Perfil editado',eliminado_at=now(),estado=false WHERE demo_clave='ejemplo-valentina'");
  await memory.exec(sql);const rows=(await memory.query("SELECT * FROM equipo_miembros WHERE demo_clave='ejemplo-valentina'")).rows;
  assert.equal(rows.length,1);assert.equal(rows[0].nombre,'Perfil editado');assert.ok(rows[0].eliminado_at);
 }finally{await memory.close()}
});

test('Equipo: solo administrador modifica, publicación y orden públicos, edición y retiro persistentes',async()=>{
 const memory=new PGlite();try{
  const query=async(...args)=>{if(args.length===1&&args[0].includes('CREATE TABLE IF NOT EXISTS equipo_miembros')){await memory.exec(args[0]);return {rows:[],rowCount:0}}const r=await memory.query(...args);return {...r,rowCount:r.rows.length||r.affectedRows||0}};
  const db={query};const schema=load('backend/src/modules/equipo/team-schema.ts',{'@/database/db':{db}});
  const {teamRoutes}=load('backend/src/modules/equipo/team.controller.ts',{'@/database/db':{db},'./team-schema':schema,'@/modules/api/http':{json:(data,status=200)=>({data,status})},'@/modules/auth/auth.service':{...auth,admin:async req=>{if(!req.actor)fail(401,'Inicia sesión');if(req.actor.rol!=='administrador')fail(403,'Sin permisos');return req.actor}}});
  const call=(route,method='GET',data,actor)=>teamRoutes({req:{actor},parts:route.split('/'),route,method,body:async()=>data});
  await assert.rejects(()=>call('admin/equipo','POST',{}),e=>e.status===401);
  await assert.rejects(()=>call('admin/equipo','GET',undefined,{rol:'espectador'}),e=>e.status===403);
  await assert.rejects(()=>call('admin/equipo','POST',{}, {rol:'programador'}),e=>e.status===403);
  const admin={rol:'administrador'},body={nombre:'Perfil propio',cargo:'Docente',biografia:'Biografía para prueba aislada',orden:4,estado:false,demostracion:false,id:999,demo_clave:'no-admitido'};
  const created=await call('admin/equipo','POST',body,admin);assert.equal(created.status,201);const pid=created.data.id;assert.notEqual(pid,999);
  assert.equal((await call('equipo')).data.some(p=>p.id===pid),false);assert.equal((await call('admin/equipo','GET',undefined,admin)).data.some(p=>p.id===pid),true);
  await call('admin/equipo/'+pid,'PATCH',{estado:true,orden:1},admin);
  let listed=(await call('equipo')).data;assert.equal(listed.some(p=>p.id===pid),true);assert.equal(listed.some(p=>'demo_clave' in p||'eliminado_at' in p),false);assert.deepEqual(listed.map(p=>p.orden),[1,1,2,3]);
  await assert.rejects(()=>call('admin/equipo/'+pid,'PATCH',{orden:0},admin),e=>e.status===400);
  await assert.rejects(()=>call('admin/equipo/'+pid,'PATCH',{nombre:''},admin),e=>e.status===400);
  await assert.rejects(()=>call('admin/equipo/'+pid,'PATCH',{estado:'true'},admin),e=>e.status===400);
  const updated=await call('admin/equipo/'+pid,'PATCH',{nombre:'Nombre actualizado'},admin);assert.equal(updated.data.biografia,body.biografia);assert.equal(updated.data.nombre,'Nombre actualizado');
  await call('admin/equipo/'+pid,'DELETE',undefined,admin);assert.equal((await call('equipo')).data.some(p=>p.id===pid),false);
  assert.equal((await call('admin/equipo','GET',undefined,admin)).data.some(p=>p.id===pid),false);
  await assert.rejects(()=>call('admin/equipo/'+pid,'PATCH',{nombre:'No restaurar'},admin),e=>e.status===404);
  assert.ok((await query('SELECT eliminado_at FROM equipo_miembros WHERE id=$1',[pid])).rows[0].eliminado_at);
 }finally{await memory.close()}
});
