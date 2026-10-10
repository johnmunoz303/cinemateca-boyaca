# SQL completo

`BD_Cinemateca_PostgreSQL.sql` reúne las migraciones numeradas de la carpeta superior en orden. Es una adaptación del modelo entregado a PostgreSQL, con las ampliaciones necesarias para la aplicación.

Úsalo para revisar el modelo o crear una base vacía manualmente. No lo ejecutes después de las migraciones sobre la misma base. Docker inicializa la base mediante los archivos numerados y no necesita que ejecutes este consolidado.

Esta subcarpeta evita ejecutar las tablas y los datos iniciales dos veces durante la inicialización de Docker.
