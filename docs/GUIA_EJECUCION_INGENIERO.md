# Ejecutar Cinemateca de Boyacá

## Requisitos

Usa Windows con Docker Desktop y el motor de contenedores Linux activo. Deja espacio para las imágenes de Docker y los videos incluidos. La primera construcción requiere internet para descargar las dependencias.

## Abrir la aplicación

Clona el repositorio privado completo. Abre PowerShell en la carpeta donde están `compose.yaml` y `compose.entrega.yaml`, y ejecuta:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\iniciar-entrega.ps1
```

Docker construye la aplicación y, en el primer inicio, importa la base del catálogo y los archivos multimedia de `entrega/`. Abre [Cinemateca](http://localhost:3000) cuando termine. Usa el mismo comando para volver a abrirla. Los cambios locales se guardan en los volúmenes del proyecto `cinemateca-entrega`.

## Acceso y comprobación

Abre el archivo local `.env.entrega` para consultar el correo y la contraseña de administrador o programador generados en tu equipo. Puedes crear un perfil de espectador desde la interfaz. La copia incluye contenido del catálogo y omite las cuentas, inscripciones, reservas y pagos de la instalación original.

Abre una película con la sesión iniciada y verifica reproducción, afiche y subtítulos donde estén disponibles. Revisa Eventos, Aprende y Cinemateca Física. Las fechas y licencias conservan los valores de la copia, así que las funciones vencidas pueden quedar fuera de la cartelera activa. Los pagos se ejecutan en modo simulación. Para recibir correos de recuperación se requiere configurar SMTP en tu instalación.

## Si el puerto está ocupado

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\iniciar-entrega.ps1 -Puerto 3001
```

En ese caso, abre [Cinemateca en el puerto 3001](http://localhost:3001). Si aparece un error de conexión al motor de Docker, abre Docker Desktop y espera a que termine de iniciar. Si el script avisa que falta contenido, comprueba que el clon incluya `entrega/base/` y `entrega/multimedia.tar.gz.part*`.
