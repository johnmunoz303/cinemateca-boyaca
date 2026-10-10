UPDATE generos SET nombre='Animación' WHERE nombre='Animaci?n' AND NOT EXISTS(SELECT 1 FROM generos WHERE nombre='Animación');
