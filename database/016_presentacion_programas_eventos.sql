-- Campos opcionales: conserva todos los registros y valores anteriores.
ALTER TABLE cursos ADD COLUMN IF NOT EXISTS modalidad varchar(30);
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS tipo_evento varchar(100), ADD COLUMN IF NOT EXISTS fases text;
