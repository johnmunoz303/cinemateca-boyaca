import {ensureFeaturedWorks} from './featured-schema';
import {db} from '../../database/db';
import {fail,id,text} from '../auth/auth.service';
import {validateRecord} from '../administracion/administracion.service';
export const classifications=['Todos','7+','12+','15+','18+'];
export async function saveWork(b:Record<string,any>,rid?:number){
 await ensureFeaturedWorks();
 if(b.destacada_inicio!==undefined&&typeof b.destacada_inicio!=='boolean')fail(400,'Selección de destacada no válida');
 if(b.orden_destacada!==undefined){const order=Number(b.orden_destacada);if(!Number.isInteger(order)||order<1||order>999)fail(400,'El orden debe ser un entero entre 1 y 999');b.orden_destacada=order}
 delete b.duracion;
 await validateRecord('obras',b,rid);
 if(b.clasificacion!==undefined&&!classifications.includes(b.clasificacion))fail(400,'Clasificación no válida');
 const genres=b.genero_ids===undefined?undefined:b.genero_ids;
 const people=b.participantes===undefined?undefined:b.participantes;
 if(genres!==undefined&&(!Array.isArray(genres)||genres.length>30))fail(400,'Géneros no válidos');
 if(people!==undefined&&(!Array.isArray(people)||people.length>100))fail(400,'Participantes no válidos');
 const gids=genres===undefined?undefined:[...new Set(genres.map(id))];
 const participants=people?.map((p:any)=>({persona_id:p.nombre===undefined?id(p.persona_id):undefined,nombre:p.nombre===undefined?undefined:text(p.nombre,150),rol:text(p.rol,50)}));
 if(participants&&new Set(participants.map((p:any)=>(p.nombre?.toLocaleLowerCase()??p.persona_id)+':'+p.rol)).size!==participants.length)fail(400,'Participante y función duplicados');
 const c=await db.connect();try{await c.query('BEGIN');
 if(rid&&!(await c.query('SELECT id FROM obras WHERE id=$1 AND eliminado_at IS NULL FOR UPDATE',[rid])).rowCount)fail(404,'Obra no encontrada');
 const fields=['destacada_inicio','orden_destacada','titulo','sinopsis','anio','tipo','clasificacion','estado_publicacion','dominio_publico','poster','permitir_descarga','fecha_ini_lic','fecha_fin_lic'];
 const keys=fields.filter(k=>Object.hasOwn(b,k));keys.push('pais');const vals=keys.map(k=>k==='pais'?'Colombia':b[k]===''?null:b[k]);
 const saved=rid?await c.query(`UPDATE obras SET ${keys.map((k,i)=>k+'=$'+(i+1)).join(',')} WHERE id=$${keys.length+1} RETURNING *`,[...vals,rid]):await c.query(`INSERT INTO obras(${keys.join(',')}) VALUES(${keys.map((_,i)=>'$'+(i+1)).join(',')}) RETURNING *`,vals);
 const oid=saved.rows[0].id;
 if(gids!==undefined){await c.query('DELETE FROM obras_generos WHERE obra_id=$1',[oid]);for(const gid of gids)await c.query('INSERT INTO obras_generos(obra_id,genero_id) VALUES($1,$2)',[oid,gid])}
 if(participants!==undefined){for(const p of participants){if(p.nombre!==undefined){const old=(await c.query('SELECT p.id FROM personas p JOIN obras_personas op ON op.persona_id=p.id WHERE op.obra_id=$1 AND lower(p.nombre)=lower($2) LIMIT 1',[oid,p.nombre])).rows[0];p.persona_id=old?.id??(await c.query('INSERT INTO personas(nombre,pais) VALUES($1,$2) RETURNING id',[p.nombre,'Colombia'])).rows[0].id}}await c.query('DELETE FROM obras_personas WHERE obra_id=$1',[oid]);for(const p of participants)await c.query('INSERT INTO obras_personas(obra_id,persona_id,rol) VALUES($1,$2,$3)',[oid,p.persona_id,p.rol])}
 await c.query('COMMIT');return saved.rows[0];
 }catch(e){await c.query('ROLLBACK');throw e}finally{c.release()}
}
