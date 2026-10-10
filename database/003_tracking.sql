-- Migración idempotente para sesiones abandonadas.
ALTER TABLE sesiones_streaming ADD COLUMN IF NOT EXISTS ultimo_heartbeat timestamptz NOT NULL DEFAULT now();
