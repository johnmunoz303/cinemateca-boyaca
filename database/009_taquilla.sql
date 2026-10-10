ALTER TABLE reservas ADD COLUMN IF NOT EXISTS ingreso_at timestamptz;
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS ingreso_por integer REFERENCES usuarios(id);
