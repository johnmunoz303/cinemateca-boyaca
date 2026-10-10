import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
test('modelo PostgreSQL: catálogo vacío, integridad y bloqueo único por función/asiento',async()=>{
 const db=new PGlite();try{
  await db.exec(await readFile(new URL('../database/001_schema.sql',import.meta.url),'utf8'));
  await db.exec(await readFile(new URL('../database/002_seed.sql',import.meta.url),'utf8'));
  await db.exec(await readFile(new URL('../database/003_tracking.sql',import.meta.url),'utf8'));
  assert.equal((await db.query('SELECT count(*)::int n FROM obras')).rows[0].n,0);
  assert.equal((await db.query('SELECT count(*)::int n FROM asientos')).rows[0].n,120);
  await db.exec("INSERT INTO usuarios(nombres,email,password_hash,rol_id) VALUES('Test','test@example.test','hash',1); INSERT INTO obras(titulo,sinopsis,duracion,tipo) VALUES('Obra de prueba','No es contenido de catálogo',1,'corto'); INSERT INTO funciones(obra_id,sala_id,inicio,precio) VALUES(1,1,now()+interval '1 day',10000); INSERT INTO reservas(id,usuario_id,funcion_id) VALUES('00000000-0000-4000-8000-000000000001',1,1),('00000000-0000-4000-8000-000000000002',1,1); INSERT INTO reservas_asientos(reserva_id,funcion_id,asiento_id) VALUES('00000000-0000-4000-8000-000000000001',1,1)");
  await assert.rejects(()=>db.exec("INSERT INTO reservas_asientos(reserva_id,funcion_id,asiento_id) VALUES('00000000-0000-4000-8000-000000000002',1,1)"),e=>e.code==='23505');
  await db.exec("UPDATE reservas_asientos SET activo=false WHERE reserva_id='00000000-0000-4000-8000-000000000001'; INSERT INTO reservas_asientos(reserva_id,funcion_id,asiento_id) VALUES('00000000-0000-4000-8000-000000000002',1,1)");
  await assert.rejects(()=>db.exec('INSERT INTO ratings(obra_id,usuario_id,puntuacion) VALUES(1,1,6)'),e=>e.code==='23514');
  await db.exec('INSERT INTO ratings(obra_id,usuario_id,puntuacion) VALUES(1,1,4)');
  await assert.rejects(()=>db.exec('INSERT INTO ratings(obra_id,usuario_id,puntuacion) VALUES(1,1,5)'),e=>e.code==='23505');
 }finally{await db.close()}
});
