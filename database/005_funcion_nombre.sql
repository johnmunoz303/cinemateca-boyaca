BEGIN;
ALTER TABLE funciones ADD COLUMN IF NOT EXISTS titulo_manual varchar(255);
ALTER TABLE funciones ALTER COLUMN obra_id DROP NOT NULL;
UPDATE funciones f SET titulo_manual=o.titulo FROM obras o WHERE f.obra_id=o.id AND f.titulo_manual IS NULL;
COMMIT;
