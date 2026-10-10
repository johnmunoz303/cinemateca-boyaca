import {randomBytes} from 'node:crypto';
import {appendFileSync,existsSync,writeFileSync} from 'node:fs';
import pg from 'pg';
import {hashPassword} from '../backend/src/modules/auth/security.mjs';
process.loadEnvFile('.env');
const email='programador@cinemateca.local';
const credentialFile='ACCESO_PROGRAMADOR.txt';
const pool=new pg.Pool({connectionString:process.env.PREVIEW_DATABASE_URL??process.env.DATABASE_URL});
try{
 if(existsSync(credentialFile))throw Error('La cuenta ya tiene un archivo de acceso. No se sobrescribe.');
 if((await pool.query('SELECT id FROM usuarios WHERE email=$1',[email])).rowCount)throw Error('El correo ya existe. No se modifica su contraseña.');
 const password=randomBytes(18).toString('base64url');
 const client=await pool.connect();
 try{await client.query('BEGIN');await client.query("INSERT INTO roles(nombre,descripcion) VALUES('programador','Gestiona exclusivamente la programación de funciones') ON CONFLICT(nombre) DO NOTHING");await client.query("INSERT INTO usuarios(nombres,email,password_hash,rol_id) SELECT 'Programador de funciones',$1,$2,id FROM roles WHERE nombre='programador'",[email,hashPassword(password)]);await client.query('COMMIT')}catch(e){await client.query('ROLLBACK');throw e}finally{client.release()}
 appendFileSync('.env',`\nPROGRAMMER_EMAIL=${email}\nPROGRAMMER_PASSWORD=${password}\n`);
 writeFileSync(credentialFile,`Cuenta local de programación\nCorreo: ${email}\nContraseña: ${password}\n\nPermisos: consultar obras y salas; crear, editar, publicar y cancelar funciones.\nGuarda este archivo de forma privada.\n`,{mode:0o600});
 const login=await fetch((process.env.APP_ORIGIN??'http://localhost:3000')+'/api/v1/auth/login',{method:'POST',headers:{Origin:process.env.APP_ORIGIN??'http://localhost:3000','Content-Type':'application/json'},body:JSON.stringify({email,password})});
 if(login.status!==200)throw Error('Cuenta creada; no se pudo verificar el inicio de sesión.');
 const cookie=login.headers.get('set-cookie')?.split(';')[0];const response=await fetch((process.env.APP_ORIGIN??'http://localhost:3000')+'/api/v1/me',{headers:{Cookie:cookie}});const me=await response.json();if(me.user?.rol!=='programador')throw Error('Rol inesperado');
 console.log('Cuenta de programador creada y acceso verificado. Contraseña guardada en ACCESO_PROGRAMADOR.txt.');
}finally{await pool.end()}
