import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
test('Formación: migración repetible y datos de inscripción persistidos',async()=>{
 const db=new PGlite();try{
  await db.exec(await readFile(new URL('../database/001_schema.sql',import.meta.url),'utf8'));
  const sql=await readFile(new URL('../database/015_formacion_inscripciones.sql',import.meta.url),'utf8');await db.exec(sql);await db.exec(sql);
  await db.exec("INSERT INTO usuarios(nombres,email,password_hash,rol_id) VALUES('Prueba','form@example.test','hash',1);INSERT INTO cursos(titulo,descripcion,requisitos,involucrados) VALUES('Prueba','Resumen','Requisito','Equipo');INSERT INTO eventos(titulo,descripcion,inicio) VALUES('Prueba','Resumen',now()+interval '1 day')");
  const datos={nombre_completo:'Prueba',consentimiento:true};
  await db.query('INSERT INTO inscripciones(usuario_id,curso_id,datos_inscripcion) VALUES(1,1,$1)',[JSON.stringify(datos)]);
  await db.query('INSERT INTO eventos_inscripciones(usuario_id,evento_id,datos_inscripcion) VALUES(1,1,$1)',[JSON.stringify(datos)]);
  assert.deepEqual((await db.query('SELECT datos_inscripcion FROM inscripciones')).rows[0].datos_inscripcion,datos);
  assert.deepEqual((await db.query('SELECT datos_inscripcion FROM eventos_inscripciones')).rows[0].datos_inscripcion,datos);
 }finally{await db.close()}
});
