import {spawn} from 'node:child_process';
import path from 'node:path';
try{process.loadEnvFile('.env')}catch{throw Error('Ejecuta npm run setup antes de iniciar.')}
const production=process.argv.includes('--production');
const env={...process.env,STORAGE_DIR:path.resolve(process.env.STORAGE_DIR??'storage'),BACKEND_URL:process.env.BACKEND_URL??'http://127.0.0.1:3003'};
const children=[];
for(const [dir,host,port]of [['backend','127.0.0.1','3003'],['frontend',process.env.PREVIEW_HOST??'0.0.0.0','3000']])children.push(spawn(process.execPath,['node_modules/next/dist/bin/next',production?'start':'dev',dir,...(production?[]:['--webpack']),'--hostname',host,'--port',port],{env,stdio:'inherit',windowsHide:true}));
children.push(spawn(process.execPath,['backend/scripts/reservations.mjs'],{env,stdio:'inherit',windowsHide:true}));
let stopping=false;function stop(){if(stopping)return;stopping=true;for(const child of children)child.kill()}
process.on('SIGINT',stop);process.on('SIGTERM',stop);
for(const child of children){child.on('error',error=>{console.error(error.message);stop();process.exitCode=1});child.on('exit',code=>{stop();process.exitCode=code??1})}
