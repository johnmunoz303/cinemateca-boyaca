import {db} from '@/database/db';
import {fail,passwordPolicy,text} from './auth.service';
import {digest,hashPassword,verifyPassword} from './security.mjs';

export async function resetPassword(raw:unknown,password:unknown){
 const hash=digest(text(raw,200)),next=hashPassword(passwordPolicy(password));
 const client=await db.connect();
 try{
  await client.query('BEGIN');
  // Leer el propietario antes de bloquear; luego se vuelve a validar el token.
  const owner=(await client.query('SELECT usuario_id FROM password_tokens WHERE token_hash=$1',[hash])).rows[0];
  if(!owner)fail(400,'Enlace inválido o vencido');
  const account=(await client.query('SELECT id FROM usuarios WHERE id=$1 AND estado FOR UPDATE',[owner.usuario_id])).rows[0];
  if(!account)fail(400,'Enlace inválido o vencido');
  const token=(await client.query('SELECT token_hash FROM password_tokens WHERE token_hash=$1 AND usuario_id=$2 AND used_at IS NULL AND expires_at>now() FOR UPDATE',[hash,account.id])).rows[0];
  if(!token)fail(400,'Enlace inválido o vencido');
  await client.query('UPDATE usuarios SET password_hash=$1,token_version=token_version+1 WHERE id=$2',[next,account.id]);
  await client.query('UPDATE password_tokens SET used_at=now() WHERE usuario_id=$1 AND used_at IS NULL',[account.id]);
  await client.query('COMMIT');return {ok:true};
 }catch(error){await client.query('ROLLBACK');throw error}finally{client.release()}
}

export async function updateProfile(userId:number,body:Record<string,any>){
 const names=text(body.nombres,100),last=String(body.apellidos??'').slice(0,100);
 const changing=body.newPassword!==undefined&&body.newPassword!=='';
 const next=changing?hashPassword(passwordPolicy(body.newPassword)):null;
 const client=await db.connect();
 try{
  await client.query('BEGIN');
  const account=(await client.query('SELECT password_hash FROM usuarios WHERE id=$1 AND estado FOR UPDATE',[userId])).rows[0];
  if(!account)fail(401,'Sesión expirada');
  if(changing&&!verifyPassword(String(body.currentPassword??''),account.password_hash))fail(400,'Contraseña actual incorrecta');
  await client.query('UPDATE usuarios SET nombres=$1,apellidos=$2,notificaciones=$3 WHERE id=$4',[names,last,body.notificaciones!==false,userId]);
  if(changing){
   await client.query('UPDATE usuarios SET password_hash=$1,token_version=token_version+1 WHERE id=$2',[next,userId]);
   await client.query('UPDATE password_tokens SET used_at=now() WHERE usuario_id=$1 AND used_at IS NULL',[userId]);
  }
  await client.query('COMMIT');return {ok:true,relogin:changing};
 }catch(error){await client.query('ROLLBACK');throw error}finally{client.release()}
}
