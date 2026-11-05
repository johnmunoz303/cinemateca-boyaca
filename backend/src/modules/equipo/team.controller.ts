import { db } from "@/database/db";
import { admin, fail, id, text } from "@/modules/auth/auth.service";
import { json, type RouteContext } from "@/modules/api/http";
import { ensureTeamSchema } from "./team-schema";
export const teamFields = "id,nombre,cargo,biografia,foto,orden,estado,demostracion";
export async function teamRoutes({req,parts,route,method,body}: RouteContext) {
  if (route === "equipo" && method === "GET") {
    await ensureTeamSchema();
    return json((await db.query(`SELECT ${teamFields} FROM equipo_miembros WHERE estado AND eliminado_at IS NULL ORDER BY orden,id`)).rows);
  }
  if (parts[0] !== "admin" || parts[1] !== "equipo") return;
  await admin(req);
  await ensureTeamSchema();
  if(method === "GET" && parts.length === 2) return json((await db.query(`SELECT ${teamFields} FROM equipo_miembros WHERE eliminado_at IS NULL ORDER BY orden,id`)).rows);
  if(method === "DELETE" && parts.length === 3) {
    const result=await db.query("UPDATE equipo_miembros SET estado=false,eliminado_at=now(),actualizado_at=now() WHERE id=$1 AND eliminado_at IS NULL RETURNING id",[id(parts[2])]);
    if(!result.rowCount)fail(404,"Perfil no encontrado");
    return json({ok:true});
  }
  if((method === "POST" && parts.length === 2)||(method === "PATCH" && parts.length === 3)) {
    const b=await body();
    const old=method === "PATCH" ? (await db.query("SELECT * FROM equipo_miembros WHERE id=$1 AND eliminado_at IS NULL",[id(parts[2])])).rows[0] : {orden:1,estado:false,demostracion:false};
    if(!old)fail(404,"Perfil no encontrado");
    const values={...old,...b};
    const name=text(values.nombre,150),role=text(values.cargo,150),bio=text(values.biografia,3000),order=Number(values.orden);
    if(!Number.isInteger(order)||order<1||order>999)fail(400,"El orden debe estar entre 1 y 999");
    if(typeof values.estado !== "boolean"||typeof values.demostracion !== "boolean")fail(400,"Estado del perfil inválido");
    const params=[name,role,bio,order,values.estado,values.demostracion];
    const result=method === "POST"
      ? await db.query(`INSERT INTO equipo_miembros(nombre,cargo,biografia,orden,estado,demostracion) VALUES($1,$2,$3,$4,$5,$6) RETURNING ${teamFields}`,params)
      : await db.query(`UPDATE equipo_miembros SET nombre=$1,cargo=$2,biografia=$3,orden=$4,estado=$5,demostracion=$6,actualizado_at=now() WHERE id=$7 AND eliminado_at IS NULL RETURNING ${teamFields}`,[...params,id(parts[2])]);
    if(!result.rowCount)fail(404,"Perfil no encontrado");
    return json(result.rows[0],method === "POST" ? 201 : 200);
  }
  fail(404,"Ruta de equipo no encontrada");
}
