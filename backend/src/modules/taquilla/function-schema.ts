import {db} from '@/database/db';

let ready: Promise<unknown> | undefined;
// Actualiza también los volúmenes ya creados: Docker solo ejecuta el SQL inicial
// cuando PostgreSQL crea una base nueva.
export function ensureFunctionDetails() {
  return ready ??= db.query('ALTER TABLE funciones ADD COLUMN IF NOT EXISTS descripcion TEXT, ADD COLUMN IF NOT EXISTS imagen VARCHAR(2048)').catch(error => {
    ready = undefined;
    throw error;
  });
}
