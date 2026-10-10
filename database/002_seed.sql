-- Configuraci?n de una sala de simulaci?n. Cat?logo inicialmente vac?o.
BEGIN;
INSERT INTO salas(nombre,direccion) VALUES ('Sala principal','Ubicaci?n por confirmar');
INSERT INTO asientos(sala_id,fila,numero) SELECT 1,chr(64+f),n FROM generate_series(1,10) f CROSS JOIN generate_series(1,12) n;
INSERT INTO generos(nombre) VALUES ('Drama'),('Animación'),('Comedia'),('Documental'),('Suspenso');
COMMIT;
