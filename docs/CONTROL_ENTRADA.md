# Validación de tiquetes

El administrador y el programador pueden validar tiquetes desde Administración → Control de entrada. Un espectador no tiene ese permiso. El programador conserva restringidos la gestión de usuarios, roles, equipo y reportes de streaming.

Arranca la aplicación siguiendo la [guía de ejecución](GUIA_EJECUCION_INGENIERO.md).

## Probar el recorrido completo

1. Usar una función futura publicada y una reserva de prueba. Como espectador, abrir Cinemateca Física, elegir la función y seleccionar las sillas disponibles.
2. Pulsar Reservar por 10 minutos. Durante ese tiempo quedan bloqueadas para los demás usuarios.
3. Si la instalación está en modo simulation, pulsar Confirmar pago simulado. No hay cobro real. Aparece el tiquete QR y se puede descargar el PDF. Una reserva confirmada ya no se libera por vencimiento.
4. En el tiquete, abrir Código para control de entrada y pulsar Copiar código. Si el navegador no permite copiar automáticamente, seleccionar el contenido del campo y copiarlo manualmente. También se puede leer el QR mediante un lector externo que entregue su contenido como texto.
5. En otra sesión o navegador, iniciar sesión como programador. Abrir Administración → Control de entrada.
6. Pegar el código completo y pulsar Validar y registrar ingreso. Debe aparecer la confirmación de ingreso.
7. Volver a presentar el mismo código. Debe aparecer «Este tiquete ya fue utilizado».

Un QR corresponde a una reserva completa. Si incluye varias sillas, la validación registra el ingreso del grupo de una vez. Registrar un ingreso de prueba consume el tiquete; no probar con una entrada que aún se vaya a utilizar en una función real.

Una reserva pendiente vence a los 10 minutos y sus sillas vuelven a quedar disponibles. Una reserva confirmada se conserva como historial. El modo simulation y PayU sandbox son pruebas, no cobros bancarios de producción. La lectura con cámara dentro de la aplicación no está implementada; el campo de código permite realizar todo el recorrido de validación sin ella.
