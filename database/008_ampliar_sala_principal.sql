BEGIN;
-- Ampliación sin borrar ni renumerar asientos existentes.
UPDATE salas SET filas=10,columnas=12
WHERE id=1 AND nombre='Sala principal' AND filas=6 AND columnas=8;
INSERT INTO asientos(sala_id,fila,numero)
SELECT s.id,chr(64+f),n FROM salas s
CROSS JOIN generate_series(1,10) f CROSS JOIN generate_series(1,12) n
WHERE s.id=1 AND s.nombre='Sala principal' AND s.filas=10 AND s.columnas=12
ON CONFLICT(sala_id,fila,numero) DO NOTHING;
COMMIT;
