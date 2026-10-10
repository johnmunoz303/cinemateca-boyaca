ALTER TABLE obras ADD COLUMN IF NOT EXISTS destacada_inicio boolean NOT NULL DEFAULT false;
ALTER TABLE obras ADD COLUMN IF NOT EXISTS orden_destacada integer NOT NULL DEFAULT 1 CHECK (orden_destacada BETWEEN 1 AND 999);
