import { db } from "@/database/db";
export async function cancelEnrollment(userId: number, targetId: number, kind: "curso" | "evento") {
  const c = await db.connect();
  try {
    await c.query("BEGIN");
    if (kind === "evento") {
      // Mismo bloqueo que la inscripción para mantener coherente el cupo.
      await c.query("SELECT id FROM eventos WHERE id=$1 FOR UPDATE", [targetId]);
      await c.query("DELETE FROM eventos_inscripciones WHERE usuario_id=$1 AND evento_id=$2", [userId, targetId]);
    } else {
      const enrollment = await c.query("SELECT id FROM inscripciones WHERE usuario_id=$1 AND curso_id=$2 FOR UPDATE", [userId, targetId]);
      if (enrollment.rowCount) {
        await c.query("DELETE FROM progreso_modulos WHERE usuario_id=$1 AND modulo_id IN (SELECT id FROM modulos WHERE curso_id=$2)", [userId, targetId]);
        await c.query("DELETE FROM inscripciones WHERE usuario_id=$1 AND curso_id=$2", [userId, targetId]);
      }
    }
    await c.query("COMMIT");
    return { ok: true };
  } catch (error) { await c.query("ROLLBACK"); throw error; }
  finally { c.release(); }
}
