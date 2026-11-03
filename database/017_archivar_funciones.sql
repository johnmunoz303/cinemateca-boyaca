-- Retirada de la cartelera sin borrar reservas, pagos ni tiquetes históricos.
ALTER TABLE funciones ADD COLUMN IF NOT EXISTS eliminado_at timestamptz;
