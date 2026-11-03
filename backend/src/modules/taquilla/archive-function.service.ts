import {db} from '@/database/db';
import {fail} from '@/modules/auth/auth.service';
import {ensureFunctionDetails} from './function-schema';
export async function archiveFunction(functionId:number){
 await ensureFunctionDetails();const client=await db.connect();
 try{
  await client.query('BEGIN');
  const item=(await client.query('SELECT * FROM funciones WHERE id=$1 AND eliminado_at IS NULL FOR UPDATE',[functionId])).rows[0];
  if(!item)fail(404,'Función no encontrada');
  if(new Date(item.inicio).getTime()>Date.now()&&(await client.query("SELECT 1 FROM reservas WHERE funcion_id=$1 AND estado='confirmada' LIMIT 1",[functionId])).rowCount)fail(409,'Esta función tiene entradas confirmadas y aún no ha ocurrido. No se puede retirar sin gestionar primero esas entradas.');
  await client.query("UPDATE reservas SET estado='cancelada' WHERE funcion_id=$1 AND estado='pendiente'",[functionId]);
  await client.query("UPDATE reservas_asientos SET activo=false WHERE reserva_id IN(SELECT id FROM reservas WHERE funcion_id=$1 AND estado='cancelada')",[functionId]);
  await client.query('UPDATE funciones SET eliminado_at=now() WHERE id=$1',[functionId]);
  await client.query('COMMIT');return {ok:true};
 }catch(error){await client.query('ROLLBACK');throw error}finally{client.release()}
}
