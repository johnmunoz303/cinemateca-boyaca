CREATE TABLE IF NOT EXISTS equipo_miembros (
 id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 nombre varchar(150) NOT NULL CHECK (length(trim(nombre)) > 0),
 cargo varchar(150) NOT NULL CHECK (length(trim(cargo)) > 0),
 biografia text NOT NULL CHECK (length(trim(biografia)) > 0),
 foto text,
 orden integer NOT NULL DEFAULT 1 CHECK (orden BETWEEN 1 AND 999),
 estado boolean NOT NULL DEFAULT false,
 demostracion boolean NOT NULL DEFAULT false,
 demo_clave varchar(50) UNIQUE,
 eliminado_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 actualizado_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS equipo_miembros_visibles_idx ON equipo_miembros(orden,id) WHERE estado AND eliminado_at IS NULL;
INSERT INTO equipo_miembros(nombre,cargo,biografia,foto,orden,estado,demostracion,demo_clave) VALUES
('Valentina Rojas','Directora Académica','Realizadora audiovisual y docente especializada en dirección cinematográfica y desarrollo de proyectos audiovisuales.','/escuela/equipo-demostracion.png?panel=0',1,true,true,'ejemplo-valentina'),
('Santiago Mendoza','Coordinador de Producción','Productor audiovisual con experiencia en gestión de proyectos, producción cinematográfica y acompañamiento de nuevos talentos.','/escuela/equipo-demostracion.png?panel=1',2,true,true,'ejemplo-santiago'),
('Camila Torres','Mentora de Creación Audiovisual','Guionista y realizadora enfocada en narrativas contemporáneas, cine documental y procesos de creación colectiva.','/escuela/equipo-demostracion.png?panel=2',3,true,true,'ejemplo-camila')
ON CONFLICT(demo_clave) DO NOTHING;
