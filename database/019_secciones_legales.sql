ALTER TABLE documentos_legales ADD COLUMN IF NOT EXISTS seccion text NOT NULL DEFAULT 'institucionales';
