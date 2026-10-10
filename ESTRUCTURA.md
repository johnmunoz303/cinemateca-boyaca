# Organización del proyecto

```text
cinemateca/
  frontend/
    src/
      app/                   # Páginas, layout y estilos
      components/            # Interfaz principal
      features/administracion/ # Formularios, salas y videos
    public/                  # Recursos públicos
    package.json
  backend/
    src/
      app/api/               # Entrada HTTP de la API
      app/addon/             # Protocolo de catálogo
      database/db.ts         # Conexión PostgreSQL
      modules/
        api/api.controller.ts # Despacho de rutas
        auth/                # Autenticación y criptografía
        mail/                # Correo
        obras/               # Obras y relaciones artísticas
        administracion/      # Validación y gestión de salas/funciones
    scripts/worker.mjs       # Procesamiento de videos
    package.json
  database/                  # Esquema y migraciones SQL
  scripts/                   # Configuración y arranque conjunto
  tests/                     # Pruebas en bases desechables
  compose.yaml
  Dockerfile
  Dockerfile.worker
  package.json               # Workspace npm
  README.md
```

Ambas aplicaciones usan TypeScript y Next.js. No se introdujo NestJS ni Prisma: el ejemplo aportado se usó como referencia de organización. Los módulos contienen código utilizado por la aplicación, no carpetas vacías. La API conserva un controlador de despacho compartido; no se presenta como una migración completa a controladores independientes por recurso.

Ejecutar los comandos de INICIO_RAPIDO.md desde la raíz. El almacenamiento privado y la configuración local quedan fuera del ZIP.
