# ADR-003 — Controlador cinemático sin Ammo

**Estado** — Aceptada para el graybox de G1.

## Contexto

G0 validó el movimiento a altura fija en una escena de prueba. El graybox de G1 agrega interiores, puertas, un portón móvil y una rampa que conecta el sótano con la cabaña.

## Decisión

Resolver el movimiento del jugador de forma cinemática, sin Ammo. El controlador aplica el desplazamiento horizontal por eje y lo comprueba contra cajas alineadas con los ejes (`AABB`). La comprobación considera el radio y la altura del jugador. La cámara conserva una altura de 1,68 m sobre el piso calculado, que baja a lo largo de la rampa hasta llegar al sótano. Las puertas abiertas dejan de bloquear y la caja del portón acompaña su desplazamiento vertical hasta despejar el paso.

La geometría del graybox tiene pisos planos y una rampa de pendiente conocida. Si el mapa final incorpora superficies con alturas superpuestas, formas que requieran colisiones más precisas o cuerpos dinámicos, revisar esta decisión con una prueba representativa.

## Verificación

Comprobar que el jugador puede atravesar las puertas habilitadas, bajar al sótano y regresar. Verificar que las paredes y el portón cerrado bloquean el movimiento, que el portón abierto deja cruzar y que la recarga reubica al jugador en un punto transitable.
