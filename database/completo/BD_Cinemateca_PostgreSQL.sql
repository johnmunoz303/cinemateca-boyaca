-- Archivo: 001_schema.sql
BEGIN;
CREATE TABLE roles (id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, nombre varchar(50) UNIQUE NOT NULL, descripcion text, created_at timestamptz NOT NULL DEFAULT now());
INSERT INTO roles(nombre) VALUES ('espectador'),('administrador');
CREATE TABLE usuarios (id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, nombres varchar(100) NOT NULL, apellidos varchar(100) NOT NULL DEFAULT '', email varchar(254) UNIQUE NOT NULL CHECK(email=lower(email)), password_hash text NOT NULL, rol_id integer NOT NULL REFERENCES roles(id), estado boolean NOT NULL DEFAULT true, fecha_registro timestamptz NOT NULL DEFAULT now(), ultimo_acceso timestamptz, token_version integer NOT NULL DEFAULT 0, notificaciones boolean NOT NULL DEFAULT true);
CREATE TABLE obras (id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, titulo varchar(255) NOT NULL, sinopsis text NOT NULL, duracion integer CHECK(duracion>0), anio integer CHECK(anio BETWEEN 1888 AND 2200), pais varchar(100) DEFAULT 'Colombia', idioma_ori varchar(50) DEFAULT 'Español', clasificacion varchar(20) DEFAULT 'Todos', tipo varchar(20) NOT NULL CHECK(tipo IN ('pelicula','corto','documental')), estado_publicacion boolean NOT NULL DEFAULT false, dominio_publico boolean NOT NULL DEFAULT false, acceso_tipo varchar(30) DEFAULT 'registrado', poster text, permitir_descarga boolean NOT NULL DEFAULT false, fecha_ini_lic date, fecha_fin_lic date, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), CHECK(fecha_fin_lic IS NULL OR fecha_ini_lic IS NULL OR fecha_fin_lic>=fecha_ini_lic));
CREATE INDEX obras_titulo_idx ON obras(lower(titulo));
CREATE TABLE generos (id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, nombre varchar(100) UNIQUE NOT NULL);
CREATE TABLE obras_generos (obra_id integer REFERENCES obras(id) ON DELETE CASCADE, genero_id integer REFERENCES generos(id), PRIMARY KEY(obra_id,genero_id));
CREATE VIEW relation_8 AS SELECT obra_id AS obras_ob_id, genero_id AS generos_gen_id FROM obras_generos;
CREATE TABLE personas (id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, nombre varchar(150) NOT NULL, tipo_persona varchar(50), fecha_nac date, pais varchar(100));
CREATE TABLE obras_personas (obra_id integer REFERENCES obras(id) ON DELETE CASCADE, persona_id integer REFERENCES personas(id), rol varchar(50) NOT NULL, PRIMARY KEY(obra_id,persona_id,rol));
CREATE TABLE videos (id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, obra_id integer NOT NULL REFERENCES obras(id), tipo varchar(50) DEFAULT 'hls', ruta_archivo text NOT NULL, resolucion varchar(20), formato varchar(20), checksum varchar(128) NOT NULL, tamano_bytes bigint NOT NULL CHECK(tamano_bytes>=0), bitrate integer, codec_video varchar(50), codec_audio varchar(50), duracion_real integer, is_master boolean DEFAULT true, profile_type varchar(20) DEFAULT '720p', estado_transcodificacion varchar(30) NOT NULL DEFAULT 'pendiente' CHECK(estado_transcodificacion IN ('pendiente','procesando','listo','error')), created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX videos_obra_idx ON videos(obra_id);
CREATE TABLE subtitulos (id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, obra_id integer NOT NULL REFERENCES obras(id), idioma varchar(50) NOT NULL, ruta_archivo text NOT NULL);
CREATE TABLE sesiones_streaming (id uuid PRIMARY KEY, usuario_id integer NOT NULL REFERENCES usuarios(id), video_id integer NOT NULL REFERENCES videos(id), ip_usuario inet NOT NULL, dispositivo varchar(512) NOT NULL, fecha_ini timestamptz NOT NULL DEFAULT now(), fecha_fin timestamptz, estado varchar(30) NOT NULL DEFAULT 'activa', codigo_rastreo varchar(64) UNIQUE NOT NULL);
CREATE TABLE descargas (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, sesion_id uuid REFERENCES sesiones_streaming(id), usuario_id integer REFERENCES usuarios(id), video_id integer REFERENCES videos(id), fecha timestamptz DEFAULT now());
CREATE INDEX sesiones_usuario_idx ON sesiones_streaming(usuario_id,fecha_ini DESC);
CREATE TABLE logs_transcodificacion (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, video_id integer REFERENCES videos(id), obra_id integer REFERENCES obras(id), fecha_evnt timestamptz DEFAULT now(), estado varchar(30), detalle_error text, perfil_intentado varchar(20));
CREATE TABLE ratings (id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, obra_id integer REFERENCES obras(id), usuario_id integer REFERENCES usuarios(id), puntuacion integer NOT NULL CHECK(puntuacion BETWEEN 1 AND 5), UNIQUE(obra_id,usuario_id));
CREATE TABLE comentarios (id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, obra_id integer REFERENCES obras(id), usuario_id integer REFERENCES usuarios(id), contenido text NOT NULL CHECK(length(contenido) BETWEEN 1 AND 2000), estado varchar(30) NOT NULL DEFAULT 'pendiente' CHECK(estado IN ('pendiente','aprobado','rechazado')), created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE favoritos (usuario_id integer REFERENCES usuarios(id), obra_id integer REFERENCES obras(id), PRIMARY KEY(usuario_id,obra_id));
CREATE TABLE salas (id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, nombre varchar(100) NOT NULL, direccion text NOT NULL, latitud numeric(10,7), longitud numeric(10,7));
CREATE TABLE asientos (id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, sala_id integer NOT NULL REFERENCES salas(id), fila varchar(5) NOT NULL, numero integer NOT NULL CHECK(numero>0), tipo varchar(50) NOT NULL DEFAULT 'normal', UNIQUE(sala_id,fila,numero));
CREATE TABLE funciones (id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, titulo_manual varchar(255), obra_id integer REFERENCES obras(id), sala_id integer NOT NULL REFERENCES salas(id), inicio timestamptz NOT NULL, precio numeric(10,2) NOT NULL CHECK(precio>=0), estado varchar(30) NOT NULL DEFAULT 'publicada' CHECK(estado IN ('publicada','cancelada','finalizada')));
CREATE INDEX funciones_fecha_idx ON funciones(inicio);
CREATE TABLE reservas (id uuid PRIMARY KEY, usuario_id integer NOT NULL REFERENCES usuarios(id), funcion_id integer NOT NULL REFERENCES funciones(id), estado varchar(30) NOT NULL DEFAULT 'pendiente' CHECK(estado IN ('pendiente','confirmada','expirada','cancelada')), fecha_reserva timestamptz NOT NULL DEFAULT now(), expiracion timestamptz NOT NULL DEFAULT(now()+interval '10 minutes'), codigo_ticket text UNIQUE);
CREATE TABLE reservas_asientos (reserva_id uuid NOT NULL REFERENCES reservas(id), funcion_id integer NOT NULL REFERENCES funciones(id), asiento_id integer NOT NULL REFERENCES asientos(id), activo boolean NOT NULL DEFAULT true, PRIMARY KEY(reserva_id,asiento_id));
CREATE UNIQUE INDEX asiento_por_funcion_activo ON reservas_asientos(funcion_id,asiento_id) WHERE activo;
CREATE TABLE pagos (id uuid PRIMARY KEY, reserva_id uuid UNIQUE NOT NULL REFERENCES reservas(id), metodo_pago varchar(50) NOT NULL DEFAULT 'simulado', estado varchar(30) NOT NULL, referencia_externa varchar(255) UNIQUE, monto numeric(10,2) NOT NULL CHECK(monto>=0), fecha_pago timestamptz DEFAULT now());
CREATE TABLE cursos (id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, titulo varchar(255) NOT NULL, descripcion text NOT NULL, categoria varchar(100), duracion varchar(100), poster text, certificacion boolean DEFAULT false, estado boolean DEFAULT true);
CREATE TABLE modulos (id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, curso_id integer REFERENCES cursos(id), titulo varchar(255) NOT NULL, ruta text, orden integer NOT NULL DEFAULT 1, obra_id integer REFERENCES obras(id));
CREATE TABLE inscripciones (id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, usuario_id integer REFERENCES usuarios(id), curso_id integer REFERENCES cursos(id), fecha_inscripcion timestamptz DEFAULT now(), progreso_porcentaje integer DEFAULT 0 CHECK(progreso_porcentaje BETWEEN 0 AND 100), UNIQUE(usuario_id,curso_id));
CREATE TABLE progreso_modulos (usuario_id integer REFERENCES usuarios(id), modulo_id integer REFERENCES modulos(id), completed_at timestamptz DEFAULT now(), PRIMARY KEY(usuario_id,modulo_id));
CREATE TABLE aulas (id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, nombre varchar(100) NOT NULL, descripcion text NOT NULL, horarios text, direccion text NOT NULL, latitud numeric(10,7), longitud numeric(10,7), imagen text);
CREATE TABLE eventos (id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, titulo varchar(255) NOT NULL, descripcion text NOT NULL, categoria varchar(30) CHECK(categoria IN ('presencial','virtual','convocatoria')), inicio timestamptz NOT NULL, direccion text, latitud numeric(10,7), longitud numeric(10,7), imagen text, estado varchar(30) DEFAULT 'publicado', cupo integer CHECK(cupo>0));
CREATE TABLE eventos_inscripciones (usuario_id integer REFERENCES usuarios(id), evento_id integer REFERENCES eventos(id), estado varchar(30) DEFAULT 'inscrito', created_at timestamptz DEFAULT now(), PRIMARY KEY(usuario_id,evento_id));
CREATE TABLE rutas_cnrod (id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, municipio varchar(100) NOT NULL, ubicacion text NOT NULL, fecha_evento timestamptz NOT NULL, descripcion text NOT NULL, obra_id integer REFERENCES obras(id), latitud numeric(10,7), longitud numeric(10,7));
CREATE TABLE lsc_videos (id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, obra_id integer REFERENCES obras(id), ruta_archivo text, tipo_integracion varchar(50));
CREATE TABLE documentos_legales (id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, titulo text NOT NULL, contenido text NOT NULL, publicado boolean DEFAULT false);
CREATE TABLE password_tokens (token_hash varchar(64) PRIMARY KEY, usuario_id integer REFERENCES usuarios(id), expires_at timestamptz NOT NULL, used_at timestamptz);
CREATE TABLE rate_limits (clave varchar(128) PRIMARY KEY, hits integer NOT NULL, reset_at timestamptz NOT NULL);
COMMIT;


-- Archivo: 002_seed.sql
-- Configuraci?n de una sala de simulaci?n. Cat?logo inicialmente vac?o.
BEGIN;
INSERT INTO salas(nombre,direccion) VALUES ('Sala principal','Ubicaci?n por confirmar');
INSERT INTO asientos(sala_id,fila,numero) SELECT 1,chr(64+f),n FROM generate_series(1,10) f CROSS JOIN generate_series(1,12) n;
INSERT INTO generos(nombre) VALUES ('Drama'),('Animación'),('Comedia'),('Documental'),('Suspenso');
COMMIT;


-- Archivo: 003_tracking.sql
-- Migración idempotente para sesiones abandonadas.
ALTER TABLE sesiones_streaming ADD COLUMN IF NOT EXISTS ultimo_heartbeat timestamptz NOT NULL DEFAULT now();


-- Archivo: 004_programador.sql
INSERT INTO roles(nombre,descripcion) VALUES ('programador','Consulta y gestiona la programación de funciones') ON CONFLICT(nombre) DO NOTHING;


-- Archivo: 005_funcion_nombre.sql
BEGIN;
ALTER TABLE funciones ADD COLUMN IF NOT EXISTS titulo_manual varchar(255);
ALTER TABLE funciones ALTER COLUMN obra_id DROP NOT NULL;
UPDATE funciones f SET titulo_manual=o.titulo FROM obras o WHERE f.obra_id=o.id AND f.titulo_manual IS NULL;
COMMIT;


-- Archivo: 006_admin_mejoras.sql
BEGIN;
ALTER TABLE salas ADD COLUMN IF NOT EXISTS filas integer NOT NULL DEFAULT 6;
ALTER TABLE salas ADD COLUMN IF NOT EXISTS columnas integer NOT NULL DEFAULT 8;
ALTER TABLE salas ADD COLUMN IF NOT EXISTS pasillo integer NOT NULL DEFAULT 0;
ALTER TABLE asientos ADD COLUMN IF NOT EXISTS habilitado boolean NOT NULL DEFAULT true;
ALTER TABLE funciones ADD COLUMN IF NOT EXISTS duracion_minutos integer NOT NULL DEFAULT 120;
ALTER TABLE funciones ADD COLUMN IF NOT EXISTS intervalo_minutos integer NOT NULL DEFAULT 15;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS eliminado_at timestamptz;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS etapa varchar(100) NOT NULL DEFAULT 'En espera';
COMMIT;


-- Archivo: 007_documentos_legales.sql
ALTER TABLE documentos_legales ADD COLUMN IF NOT EXISTS fuente_url text;
ALTER TABLE documentos_legales ADD COLUMN IF NOT EXISTS entidad varchar(255);
ALTER TABLE documentos_legales ADD COLUMN IF NOT EXISTS fecha_documento date;
ALTER TABLE documentos_legales ADD COLUMN IF NOT EXISTS archivo_pdf text;


-- Archivo: 008_ampliar_sala_principal.sql
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


-- Archivo: 009_taquilla.sql
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS ingreso_at timestamptz;
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS ingreso_por integer REFERENCES usuarios(id);


-- Archivo: 010_textos.sql
UPDATE generos SET nombre='Animación' WHERE nombre='Animaci?n' AND NOT EXISTS(SELECT 1 FROM generos WHERE nombre='Animación');


-- Archivo: 011_duracion_automatica.sql
ALTER TABLE obras ALTER COLUMN duracion DROP NOT NULL;


-- Archivo: 012_eliminar_obras.sql
ALTER TABLE obras ADD COLUMN IF NOT EXISTS eliminado_at timestamptz;


-- Archivo: 013_funciones_descripcion_imagen.sql
-- Conserva las funciones existentes. Ambos campos son opcionales.
ALTER TABLE funciones ADD COLUMN IF NOT EXISTS descripcion TEXT;
ALTER TABLE funciones ADD COLUMN IF NOT EXISTS imagen VARCHAR(2048);

-- Películas destacadas del inicio
ALTER TABLE obras ADD COLUMN IF NOT EXISTS destacada_inicio boolean NOT NULL DEFAULT false;
ALTER TABLE obras ADD COLUMN IF NOT EXISTS orden_destacada integer NOT NULL DEFAULT 1 CHECK (orden_destacada BETWEEN 1 AND 999);

-- Formación e inscripciones
ALTER TABLE cursos ADD COLUMN IF NOT EXISTS requisitos text, ADD COLUMN IF NOT EXISTS involucrados text, ADD COLUMN IF NOT EXISTS inicio timestamptz, ADD COLUMN IF NOT EXISTS direccion text, ADD COLUMN IF NOT EXISTS latitud numeric(10,7), ADD COLUMN IF NOT EXISTS longitud numeric(10,7);
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS requisitos text, ADD COLUMN IF NOT EXISTS involucrados text;
ALTER TABLE inscripciones ADD COLUMN IF NOT EXISTS datos_inscripcion jsonb;
ALTER TABLE eventos_inscripciones ADD COLUMN IF NOT EXISTS datos_inscripcion jsonb;
