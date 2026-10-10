# Publicar el código sin credenciales

El repositorio contiene código, SQL y una plantilla `.env.example`. Las claves reales se generan para cada instalación con `npm run setup` y se mantienen fuera de Git.

Preparación inicial: se compararon los archivos publicables con las seis claves locales de configuración, sin coincidencias. También se revisaron patrones de claves privadas, tokens de GitHub y claves de servicios. Las contraseñas literales de los tests son datos de prueba, no credenciales de las cuentas locales. Este control no sustituye una auditoría de seguridad del sistema.

## Archivos privados

No publicar `.env`, variantes de `.env`, archivos `ACCESO_*.txt`, claves privadas, almacenamiento de videos, copias de la base de datos ni registros de ejecución. Las exclusiones están en `.gitignore` y `.dockerignore`.

`database/` contiene el esquema y migraciones, no una exportación de los usuarios registrados. Los volúmenes de Docker no forman parte del repositorio.

## Antes del primer envío

1. Crear un repositorio vacío en GitHub (preferiblemente privado durante la revisión).
2. Revisar `git status --short` y `git diff --cached --name-only` antes de confirmar.
3. No usar `git add -f` para archivos excluidos.
4. Activar las opciones de detección y bloqueo de secretos que estén disponibles en el repositorio.

Si una clave llegó a publicarse, eliminar el archivo no basta: revocar o cambiar la clave y limpiar el historial. `.gitignore` no elimina archivos ya registrados en Git.

## Producción

GitHub almacena el código; no despliega automáticamente esta aplicación. Para una instalación pública se requieren HTTPS, `COOKIE_SECURE=true`, un `APP_ORIGIN` correcto y secretos nuevos. Mantener PostgreSQL sin exposición pública y configurar acceso LAN solo cuando sea necesario. Usar `MAIL_MODE=smtp` para que los enlaces de recuperación no se guarden en archivos locales. PayU sigue requiriendo sus credenciales y configuración propias.

No compartir credenciales de demostración ni usar las claves locales en producción. Excluir secretos del repositorio reduce exposición, pero no garantiza por sí solo la seguridad del sitio.
