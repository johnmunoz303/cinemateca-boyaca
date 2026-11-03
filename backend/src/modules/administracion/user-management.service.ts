import {db} from '@/database/db';
import {fail,id,text} from '@/modules/auth/auth.service';

export async function updateAccount(actorId:number,target:number,body:Record<string,any>){
 const client=await db.connect();
 try{
  await client.query('BEGIN');
  // Serializa cambios de rol/estado para no retirar simultáneamente los dos últimos administradores.
  const adminRole=(await client.query("SELECT id FROM roles WHERE nombre='administrador' FOR UPDATE")).rows[0];
  const actor=(await client.query('SELECT rol_id,estado FROM usuarios WHERE id=$1',[actorId])).rows[0];
  if(!actor?.estado||actor.rol_id!==adminRole?.id)fail(403,'Permisos insuficientes');
  const account=(await client.query('SELECT id,rol_id,estado FROM usuarios WHERE id=$1 FOR UPDATE',[target])).rows[0];
  if(!account)fail(404,'Usuario no encontrado');
  let role=account.rol_id;
  if(Object.hasOwn(body,'rol_id')){
   role=id(body.rol_id);
   const nextRole=(await client.query('SELECT nombre FROM roles WHERE id=$1',[role])).rows[0];
   if(!nextRole||!['administrador','espectador','programador'].includes(nextRole.nombre))fail(400,'Rol no permitido');
  }
  if(Object.hasOwn(body,'estado')&&typeof body.estado!=='boolean')fail(400,'Estado no válido');
  const enabled=body.estado??account.estado;
  if(account.estado&&account.rol_id===adminRole.id&&(!enabled||role!==adminRole.id)){
   const other=(await client.query('SELECT id FROM usuarios WHERE rol_id=$1 AND estado AND id<>$2 LIMIT 1',[adminRole.id,target])).rowCount;
   if(!other)fail(409,'Debe quedar al menos un administrador activo. Asigna ese rol a otra cuenta antes de cambiar esta.');
  }
  const keys=['nombres','apellidos','estado'].filter(key=>Object.hasOwn(body,key));
  const values=keys.map(key=>key==='estado'?body[key]:key==='nombres'?text(body[key],100):String(body[key]??'').slice(0,100));
  await client.query('UPDATE usuarios SET '+[...keys.map((key,index)=>key+'=$'+(index+1)),'rol_id=$'+(values.length+1),'token_version=token_version+1'].join(',')+' WHERE id=$'+(values.length+2),[...values,role,target]);
  await client.query('COMMIT');return {ok:true,relogin:target===actorId};
 }catch(error){await client.query('ROLLBACK');throw error}finally{client.release()}
}
