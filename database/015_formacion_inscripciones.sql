ALTER TABLE cursos ADD COLUMN IF NOT EXISTS requisitos text, ADD COLUMN IF NOT EXISTS involucrados text, ADD COLUMN IF NOT EXISTS inicio timestamptz, ADD COLUMN IF NOT EXISTS direccion text, ADD COLUMN IF NOT EXISTS latitud numeric(10,7), ADD COLUMN IF NOT EXISTS longitud numeric(10,7);
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS requisitos text, ADD COLUMN IF NOT EXISTS involucrados text;
ALTER TABLE inscripciones ADD COLUMN IF NOT EXISTS datos_inscripcion jsonb;
ALTER TABLE eventos_inscripciones ADD COLUMN IF NOT EXISTS datos_inscripcion jsonb;
