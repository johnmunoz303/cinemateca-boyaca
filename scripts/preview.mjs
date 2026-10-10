// Solo vista local de desarrollo. Docker usa PostgreSQL 17 independiente.
import ffmpeg from 'ffmpeg-static';
import {PGlite} from '@electric-sql/pglite';
import {PGLiteSocketServer} from '@electric-sql/pglite-socket';
import {readFileSync,mkdirSync} from 'node:fs';
import {spawn} from 'node:child_process';
import path from 'node:path';
try{process.loadEnvFile('.env')}catch{throw Error('Ejecuta npm run setup antes de abrir la vista local.')}
const root=path.resolve(process.env.STORAGE_DIR??'storage');
mkdirSync(root,{recursive:true});
const db=await PGlite.create(path.resolve(process.env.PREVIEW_DB_DIR??path.join(root,'preview-postgres')));
const tables=await db.query("SELECT to_regclass('public.usuarios') tabla");
if(!tables.rows[0].tabla){await db.exec(readFileSync('database/001_schema.sql','utf8'));await db.exec(readFileSync('database/002_seed.sql','utf8'))}
await db.exec(readFileSync('database/003_tracking.sql','utf8'));
await db.exec(readFileSync('database/004_programador.sql','utf8'));
await db.exec(readFileSync('database/005_funcion_nombre.sql','utf8'));
await db.exec(readFileSync('database/006_admin_mejoras.sql','utf8'));
await db.exec(readFileSync('database/007_documentos_legales.sql','utf8'));
await db.exec(readFileSync('database/008_ampliar_sala_principal.sql','utf8'));
await db.exec(readFileSync('database/009_taquilla.sql','utf8'));
await db.exec(readFileSync('database/010_textos.sql','utf8'));
await db.exec(readFileSync('database/011_duracion_automatica.sql','utf8'));
await db.exec(readFileSync('database/012_eliminar_obras.sql','utf8'));
await db.exec(readFileSync('database/013_funciones_descripcion_imagen.sql','utf8'));
await db.exec(readFileSync('database/014_obras_destacadas.sql','utf8'));
await db.exec(readFileSync('database/015_formacion_inscripciones.sql','utf8'));
const server=new PGLiteSocketServer({db,host:'127.0.0.1',port:5434,maxConnections:20});
// Reduce la cantidad de cambios pendientes si Windows se apaga inesperadamente.
const checkpointTimer=setInterval(()=>db.exec('CHECKPOINT').catch(error=>console.error('Checkpoint local:',error.message)),30000);
checkpointTimer.unref();
await server.start();
const env={...process.env,DATABASE_URL:'postgresql://postgres:postgres@127.0.0.1:5434/postgres',APP_ORIGIN:'http://localhost:3000',STORAGE_DIR:root,BACKEND_URL:'http://127.0.0.1:3003'};
const web=spawn(process.execPath,['node_modules/next/dist/bin/next','dev','frontend','--webpack','--hostname',process.env.PREVIEW_HOST??'127.0.0.1','--port','3000'],{env,stdio:'inherit',windowsHide:true});
const api=spawn(process.execPath,['node_modules/next/dist/bin/next','dev','backend','--webpack','--hostname','127.0.0.1','--port','3003'],{env,stdio:'inherit',windowsHide:true});
const expiry=spawn(process.execPath,['backend/scripts/reservations.mjs'],{env,stdio:'inherit',windowsHide:true});
const worker=spawn(process.execPath,['backend/scripts/worker.mjs'],{env:{...env,FFMPEG_BIN:ffmpeg},stdio:'inherit',windowsHide:true});
console.log('Vista local: http://localhost:3000 · base integrada de desarrollo. Docker conserva PostgreSQL independiente.');
async function stop(){clearInterval(checkpointTimer);expiry.kill();worker.kill();api.kill();web.kill();await server.stop();await db.exec('CHECKPOINT');await db.close();process.exit(0)}
process.on('SIGINT',stop);process.on('SIGTERM',stop);
web.on('exit',()=>{api.kill();expiry.kill();worker.kill();server.stop().then(()=>db.close()).then(()=>process.exit(0))});
