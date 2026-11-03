import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
test('Campos de presentación conservan registros anteriores y migración repetible',async()=>{
 const db=new PGlite();try{
  await db.exec(await readFile(new URL('../database/001_schema.sql',import.meta.url),'utf8'));
  await db.exec("INSERT INTO cursos(titulo,descripcion,categoria) VALUES('Programa de prueba','Resumen original','Principiante');INSERT INTO eventos(titulo,descripcion,categoria,inicio) VALUES('Evento de prueba','Descripción original','presencial','2030-10-05T15:00:00Z')");
  const migration=await readFile(new URL('../database/016_presentacion_programas_eventos.sql',import.meta.url),'utf8');await db.exec(migration);await db.exec(migration);
  const course=(await db.query('SELECT * FROM cursos')).rows[0],event=(await db.query('SELECT * FROM eventos')).rows[0];
  assert.equal(course.descripcion,'Resumen original');assert.equal(course.categoria,'Principiante');assert.equal(course.modalidad,null);
  assert.equal(event.descripcion,'Descripción original');assert.equal(event.categoria,'presencial');assert.equal(event.fases,null);
  await db.query('UPDATE cursos SET modalidad=$1 WHERE id=1',['virtual']);await db.query('UPDATE eventos SET tipo_evento=$1,fases=$2 WHERE id=1',['Festival escolar','A — Presentación\nB — Exhibición']);
  assert.equal((await db.query('SELECT modalidad FROM cursos')).rows[0].modalidad,'virtual');assert.equal((await db.query('SELECT tipo_evento FROM eventos')).rows[0].tipo_evento,'Festival escolar');
 }finally{await db.close()}
});
