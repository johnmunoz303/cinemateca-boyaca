import assert from 'node:assert/strict';
import pg from 'pg';
process.loadEnvFile('.env');
const origin='http://localhost:3000';
const pool=new pg.Pool({connectionString:'postgresql://postgres:postgres@127.0.0.1:5434/postgres'});
const testEmail=`roles-${Date.now()}@example.test`;
async function call(route,method='GET',body,cookie){const r=await fetch(origin+'/api/v1/'+route,{method,headers:{Origin:origin,'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},body:body?JSON.stringify(body):undefined});return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]}}
try{
 const login=await call('auth/login','POST',{email:process.env.ADMIN_EMAIL,password:process.env.ADMIN_PASSWORD});assert.equal(login.status,200);
 const roles=await call('admin/roles','GET',null,login.cookie);assert.equal(roles.status,200);const programmer=roles.data.find(r=>r.nombre==='programador'),viewer=roles.data.find(r=>r.nombre==='espectador');assert.ok(programmer);
 const register=await call('auth/register','POST',{email:testEmail,password:'segura-frase-prueba-123',nombres:'Prueba roles',rol_id:programmer.id});assert.equal(register.status,201);
 const me=await call('me','GET',null,register.cookie);assert.equal(me.data.user.rol,'espectador');
 assert.equal((await call('admin/roles','GET',null,register.cookie)).status,403);
 assert.equal((await call(`admin/usuarios/${me.data.user.id}`,'PATCH',{rol_id:programmer.id},login.cookie)).status,200);
 assert.equal((await call('me','GET',null,register.cookie)).status,401);
 const sign=await call('auth/login','POST',{email:testEmail,password:'segura-frase-prueba-123'});assert.equal(sign.status,200);
 assert.equal((await call('admin/funciones','GET',null,sign.cookie)).status,200);
 assert.equal((await call('admin/obras','GET',null,sign.cookie)).status,200);
 for(const route of ['admin/roles','admin/usuarios','admin/reportes'])assert.equal((await call(route,'GET',null,sign.cookie)).status,403);
 assert.equal((await call('admin/obras','POST',{titulo:'No autorizado'},sign.cookie)).status,403);
 const adminMe=await call('me','GET',null,login.cookie);
 assert.equal((await call(`admin/usuarios/${adminMe.data.user.id}`,'PATCH',{rol_id:viewer.id},login.cookie)).status,403);
 assert.equal((await call(`admin/usuarios/${adminMe.data.user.id}`,'PATCH',{estado:false},login.cookie)).status,403);
 console.log('Roles verificados: registro sin elevación, asignación restringida, revocación de sesiones, programador limitado y administrador protegido.');
}finally{await pool.query('DELETE FROM usuarios WHERE email=$1',[testEmail]);await pool.end()}
