ALTER TABLE documentos_legales ADD COLUMN IF NOT EXISTS fuente_url text;
ALTER TABLE documentos_legales ADD COLUMN IF NOT EXISTS entidad varchar(255);
ALTER TABLE documentos_legales ADD COLUMN IF NOT EXISTS fecha_documento date;
ALTER TABLE documentos_legales ADD COLUMN IF NOT EXISTS archivo_pdf text;
