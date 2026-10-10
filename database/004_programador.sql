INSERT INTO roles(nombre,descripcion) VALUES ('programador','Consulta y gestiona la programación de funciones') ON CONFLICT(nombre) DO NOTHING;
