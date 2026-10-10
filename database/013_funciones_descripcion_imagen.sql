-- Conserva las funciones existentes. Ambos campos son opcionales.
ALTER TABLE funciones ADD COLUMN IF NOT EXISTS descripcion TEXT;
ALTER TABLE funciones ADD COLUMN IF NOT EXISTS imagen VARCHAR(2048);
