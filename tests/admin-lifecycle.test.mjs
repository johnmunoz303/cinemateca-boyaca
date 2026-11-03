import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import {PGlite} from '@electric-sql/pglite';

const require=createRequire(import.meta.url);
function service(file,mocks){const exports={};const source=ts.transpileModule(readFileSync(new URL('../'+file,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;vm.runInNewContext(source,{exports,require:name=>name in mocks?mocks[name]:require(name),Date},{filename:file});return exports;}
const fail=(status,message)=>{throw Object.assign(Error(message),{status})};
const auth={fail,id:value=>{const id=Number(value);if(!Number.isSafeInteger(id)||id<1)fail(400,'Id inválido');return id},text:value=>String(value)};
async function setup(){const memory=new PGlite();for(const file of readdirSync(new URL('../database/',import.meta.url)).filter(file=>/^\d.*\.sql$/.test(file)).sort())await memory.exec(readFileSync(new URL('../database/'+file,import.meta.url),'utf8'));const query=async(...args)=>{const result=await memory.query(...args);return {...result,rowCount:result.rows.length||result.affectedRows||0}};const db={query,connect:async()=>({query,release(){}})};return {memory,db};}

test('Permite volver a espectador, revoca sesión y protege al último administrador',async()=>{
 const {memory,db}=await setup();try{
  const admin=(await db.query("SELECT id FROM roles WHERE nombre='administrador'")).rows[0].id;
  const viewer=(await db.query("SELECT id FROM roles WHERE nombre='espectador'")).rows[0].id;
  const a=(await db.query("INSERT INTO usuarios(nombres,email,password_hash,rol_id) VALUES('Administrador A','admin-a@example.test','test',$1) RETURNING id",[admin])).rows[0].id;
  const b=(await db.query("INSERT INTO usuarios(nombres,email,password_hash,rol_id) VALUES('Administrador B','admin-b@example.test','test',$1) RETURNING id",[admin])).rows[0].id;
  const {updateAccount}=service('backend/src/modules/administracion/user-management.service.ts',{'@/database/db':{db},'@/modules/auth/auth.service':auth});
  assert.equal((await updateAccount(a,a,{rol_id:viewer})).relogin,true);
  const user=(await db.query('SELECT rol_id,token_version FROM usuarios WHERE id=$1',[a])).rows[0];assert.equal(user.rol_id,viewer);assert.equal(user.token_version,1);
  await assert.rejects(()=>updateAccount(b,b,{rol_id:viewer}),e=>e.status===409);
  await assert.rejects(()=>updateAccount(b,b,{estado:false}),e=>e.status===409);
  await assert.rejects(()=>updateAccount(a,b,{rol_id:viewer}),e=>e.status===403);
  await updateAccount(b,a,{rol_id:admin});await updateAccount(b,a,{rol_id:viewer});
  assert.equal((await db.query('SELECT rol_id FROM usuarios WHERE id=$1',[a])).rows[0].rol_id,viewer);
 }finally{await memory.close()}
});

test('Retirar función conserva pagos/entradas históricas y libera solo reservas pendientes',async()=>{
 const {memory,db}=await setup();try{
  const {archiveFunction}=service('backend/src/modules/taquilla/archive-function.service.ts',{'@/database/db':{db},'@/modules/auth/auth.service':auth,'./function-schema':{ensureFunctionDetails:async()=>{}}});
  await db.query("INSERT INTO usuarios(nombres,email,password_hash,rol_id) VALUES('Prueba','seats@example.test','test',1)");
  const fid=(await db.query("INSERT INTO funciones(titulo_manual,sala_id,inicio,precio) VALUES('Prueba histórica',1,now()-interval '1 day',10000) RETURNING id")).rows[0].id;
  const seat=(await db.query('SELECT id FROM asientos ORDER BY id LIMIT 1')).rows[0].id;
  const confirmed='00000000-0000-4000-8000-000000000001',pending='00000000-0000-4000-8000-000000000002';
  await db.query("INSERT INTO reservas(id,usuario_id,funcion_id,estado,codigo_ticket) VALUES($1,1,$3,'confirmada','signed-test'),($2,1,$3,'pendiente',null)",[confirmed,pending,fid]);
  await db.query('INSERT INTO reservas_asientos(reserva_id,funcion_id,asiento_id) VALUES($1,$2,$3)',[pending,fid,seat]);
  await db.query("INSERT INTO pagos(id,reserva_id,estado,monto) VALUES('00000000-0000-4000-8000-000000000003',$1,'aprobado',10000)",[confirmed]);
  await archiveFunction(fid);
  assert.ok((await db.query('SELECT eliminado_at FROM funciones WHERE id=$1',[fid])).rows[0].eliminado_at);
  assert.equal((await db.query('SELECT estado FROM reservas WHERE id=$1',[pending])).rows[0].estado,'cancelada');
  assert.equal((await db.query('SELECT activo FROM reservas_asientos WHERE reserva_id=$1',[pending])).rows[0].activo,false);
  assert.equal((await db.query('SELECT codigo_ticket FROM reservas WHERE id=$1',[confirmed])).rows[0].codigo_ticket,'signed-test');
  assert.equal((await db.query('SELECT estado FROM pagos WHERE reserva_id=$1',[confirmed])).rows[0].estado,'aprobado');
  await assert.rejects(()=>archiveFunction(fid),e=>e.status===404);
  const future=(await db.query("INSERT INTO funciones(titulo_manual,sala_id,inicio,precio) VALUES('Prueba futura',1,now()+interval '1 day',10000) RETURNING id")).rows[0].id;
  await db.query("INSERT INTO reservas(id,usuario_id,funcion_id,estado) VALUES('00000000-0000-4000-8000-000000000004',1,$1,'confirmada')",[future]);
  await assert.rejects(()=>archiveFunction(future),e=>e.status===409);
  assert.equal((await db.query('SELECT eliminado_at FROM funciones WHERE id=$1',[future])).rows[0].eliminado_at,null);
 }finally{await memory.close()}
});
