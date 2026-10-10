# Cinemateca de Boyacá

Aplicación con frontend y backend separados en Next.js y TypeScript, PostgreSQL, Tailwind CSS y Docker Compose.

## Ejecutar una instalación nueva

Requisitos: Node.js 22 y Docker Desktop con contenedores Linux.

```powershell
npm run setup
docker compose -p cinemateca up -d --build
```

Abrir http://localhost:3000. `setup` genera `.env` y credenciales locales aleatorias en `ACCESO_LOCAL.txt` y `ACCESO_PROGRAMADOR.txt`. Estos archivos son privados y no se incluyen en Git. Ejecutar `setup` solo una vez; no sobrescribe una configuración existente.

Si el proyecto ya está configurado:

```powershell
docker compose -p cinemateca up -d
```

Después de editar el código:

```powershell
docker compose -p cinemateca up -d --build frontend backend
```

Para detenerlo conservando los contenedores: `docker compose -p cinemateca stop`.

## Datos y estructura

- `frontend/src`: interfaz, componentes y secciones.
- `frontend/public`: recursos públicos de la interfaz.
- `backend/src`: API, autenticación, streaming, taquilla, formación y administración.
- `backend/scripts`: procesamiento de videos y expiración de reservas.
- `database`: migraciones PostgreSQL, aplicadas en orden al crear una base vacía.
- `database/completo`: SQL consolidado para una base vacía; no ejecutar junto con las migraciones individuales sobre la misma base.
- `scripts`: configuración y ejecución local.
- `tests`: comprobaciones automáticas.

El catálogo inicia sin películas de ejemplo. Las cuentas iniciales se generan con la configuración privada. Las imágenes y videos cargados, usuarios, pagos e inscripciones no forman parte del repositorio: persisten en los volúmenes Docker. No ejecutar `docker compose down -v` si se desean conservar esos datos.

## Verificación local

```powershell
npm ci
npm test
npm run build
```

`npm run test:e2e` ejecuta pruebas con una base y archivos temporales. Algunas pruebas específicas necesitan configuración adicional; no ejecutarlas contra una base de producción.

## Seguridad y GitHub

Leer [SEGURIDAD_GITHUB.md](SEGURIDAD_GITHUB.md). `.gitignore` excluye credenciales, archivos de usuarios, registros, dependencias y compilaciones. `.env.example` solo contiene una plantilla sin claves reales.

El modo de pago predeterminado es simulación. PayU dispone de integración de pruebas que requiere configuración. Publicar el código en GitHub no despliega la aplicación ni convierte los pagos en cobros reales.

Antes de desplegar en internet se requiere HTTPS, configuración de cookies y orígenes, secretos nuevos, proveedor de correo y revisión de seguridad y rendimiento. Las comprobaciones locales no garantizan ausencia de vulnerabilidades ni tiempos de respuesta bajo carga.
