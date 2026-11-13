import { db } from "@/database/db";

let ready: Promise<unknown> | undefined;
export function ensureLegalSections() {
  return ready ??= db.query("ALTER TABLE documentos_legales ADD COLUMN IF NOT EXISTS seccion text NOT NULL DEFAULT 'institucionales'").catch(error => {
    ready = undefined;
    throw error;
  });
}
