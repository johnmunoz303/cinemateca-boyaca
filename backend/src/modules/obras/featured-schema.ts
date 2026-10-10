import {db} from '@/database/db';
let ready: Promise<void> | undefined;
export function ensureFeaturedWorks() {
  return ready ??= db.query(`ALTER TABLE obras
    ADD COLUMN IF NOT EXISTS destacada_inicio boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS orden_destacada integer NOT NULL DEFAULT 1 CHECK (orden_destacada BETWEEN 1 AND 999)`)
    .then(() => {}).catch(error => {ready = undefined; throw error;});
}
