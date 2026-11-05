# Cinemateca de Boyacá

Aplicación con frontend y backend separados en Next.js y TypeScript, PostgreSQL, Tailwind CSS y Docker Compose.

## Entrega para el ingeniero

Si el repositorio incluye la carpeta de entrega, sigue la [guía de ejecución](docs/GUIA_EJECUCION_INGENIERO.md) para iniciar con el catálogo y los videos incluidos.

## Ejecutar una instalación nueva para desarrollo

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

Una instalación nueva para desarrollo inicia sin películas de ejemplo. Las cuentas iniciales se generan con la configuración privada. Los datos de cada instalación persisten en los volúmenes Docker. La entrega privada incluye una copia del catálogo y los multimedia. No ejecutar `docker compose down -v` si se desean conservar esos datos.

## Verificación local

```powershell
npm ci
npm test
npm run build
```

`npm run test:e2e` ejecuta pruebas con una base y archivos temporales. Algunas pruebas específicas necesitan configuración adicional; no ejecutarlas contra una base de producción.

## Recuperación por correo real

El usuario solicita un enlace desde “Olvidé mi contraseña”. El mensaje aparece enviado por Cinemateca de Boyacá. El enlace vence a los 20 minutos, es de un solo uso y los demás enlaces pendientes se invalidan cuando se cambia la contraseña. El token no se devuelve públicamente en la respuesta de la API.

Configurar una cuenta remitente real en el `.env` privado con `MAIL_MODE=smtp`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD` y `SMTP_FROM`. La dirección `PUBLIC_APP_URL` debe ser accesible desde el dispositivo donde se abrirá el enlace; `localhost` solo sirve en el mismo computador. Consultar al proveedor qué credencial de aplicación requiere. No publicar ni enviar contraseñas por el chat.

`npm run mail:verify` verifica conexión y autenticación sin enviar mensajes. La entrega real se comprueba después solicitando una recuperación a una cuenta propia. Sin SMTP configurado, la instalación Docker de producción no envía el correo ni expone un token como alternativa.

## Límites y despliegue

El frontend sella la IP de su conexión antes de reenviar solicitudes al backend privado. No publicar directamente el puerto del backend mientras se confíe en esa cabecera. Si se coloca otro proxy delante, la IP observada será la de ese proxy hasta configurar una cadena de confianza explícita; Docker Desktop también puede traducir direcciones. No se aceptan las IP que el navegador declare libremente en `X-Forwarded-For`.

Para producción pública se necesita HTTPS y `COOKIE_SECURE=true`, `APP_ORIGIN`/`PUBLIC_APP_URL` correctos y `ALLOW_LAN_ACCESS=false`. Los límites de recursos de Compose y del worker se pueden ajustar para el equipo. No se han cambiado secretos ni contraseñas existentes como parte de estas mejoras.
