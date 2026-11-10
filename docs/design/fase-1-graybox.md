# Fase 1 · Plano y prueba del graybox

Este plano fija una primera versión medible para el recorrido de G1. Las distancias y puntos de aparición se ajustan después de observar las primeras partidas.

## Plano métrico

Metros en ejes de PlayCanvas. `+Y` es arriba y `−Z` se aleja del portón hacia la cabaña. Las coordenadas indican centros o referencias aproximadas en `(X, Y, Z)`. El controlador parte de 3,2 m/s de marcha y 5 m/s de carrera, con 2,5 m de alcance de interacción. Como referencia de diseño, dejar al menos 1,2 m libres en puertas, 1,5 m en pasos interiores y 3 m en caminos exteriores.

| Lugar     | Referencia                         | Diseño y acceso                                                                                                                                                                             |
| --------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Llegada   | `(0, 0, 4.5)`                      | Spawn dentro del predio, mirando al portón. El cartel KM 17 lleva la placa **2** cerca de `(4, 1.55, 6.6)`. El porche señala hacia dónde ir al darse vuelta.                                |
| Portón    | `(0, 0, 8)`                        | Abertura de 4,7 m, panel y mecanismo accesibles desde el lado interior. Valla continua a ambos lados. Dejar un área libre frente a la hoja y el panel.                                      |
| Cabaña    | `X −4…4`, `Z −15…−6`               | Entrada en `(0, 0, −6)` con placa **4** afuera. Sala con croquis y registro de guardia, que incluye la nota de mantenimiento. Cocina con llave del cobertizo. Oficina con llave del sótano. |
| Sótano    | Desde `(0, 0, −15)`, piso `Y≈−2.6` | Puerta desde el interior y rampa de 5 m en dirección `−Z`. La caja `REPUESTOS PORTÓN`, cerca de `Z=−23.2`, contiene la manivela.                                                            |
| Cobertizo | `X 6…12`, `Z −10…−5`               | Entrada en `(9, 0, −5)`, con lámpara y placa **7** accesible desde afuera. Fusible y generador adentro. Bidón afuera junto a la leña.                                                       |
| Pozo      | `(−8, 0, −12)`                     | Placa **1** accesible desde camino abierto. El brocal tiene colisión y deja espacio para acercarse al soporte.                                                                              |
| Salida    | `X −2…2`, `Z≥10`                   | Área detrás del portón, alcanzable al abrirlo. Cruzar activa el cierre de la partida.                                                                                                       |

Huella jugable inicial de unos **32 × 39 m** (`X −16…16`, `Z −26…13`), con límites visibles en el bosque y a ambos lados del portón. El camino principal conecta la llegada con la cabaña. El pozo queda al oeste y el cobertizo al este. Desde la entrada de la cabaña al portón hay unos 14 m, entre 4 y 5 s de marcha recta. Medir el tiempo real con puertas, giros y obstáculos antes de agrandar el mapa.

## Recorrido y estados

1. **Reconocimiento.** Desde la llegada se puede examinar el portón y reconocer sus tres requisitos. El panel sin energía usa un texto de inspección y el seguro tiene su identificación física.
2. **Investigación.** La cabaña da acceso a ambas llaves y al registro. El croquis ubica las placas y el registro describe el orden por referencias. La anotación de las 23:47 conecta la ronda con el abandono del jugador. Las cuatro placas se pueden leer antes de encender el generador, entrar al sótano o abrir el cobertizo.
3. **Resolución abierta.** Combustible y fusible se instalan en cualquier orden. La manivela se recupera por una ruta independiente y puede liberar el seguro antes o después de energizar el panel. Con energía, el panel puede aceptar `2471` mientras el seguro sigue puesto. Mantener la autorización tras recargar.
4. **Regreso.** Probar un cambio de luz y un sonido breve al aproximarse al portón por primera vez con energía. El evento se registra una vez y deja al jugador moverse. El estado de apertura y la colisión dependen de las reglas del portón.
5. **Cierre.** Abrir el portón despeja el paso. Cruzar el área de salida completa la partida.

## Puntos de reaparición

Usar posiciones comprobadas fuera de paredes, pendientes, puertas y hojas del portón. El punto de recuperación de la prueba G1 es `gate`, en `(0, 0, 5.7)`, mirando hacia `+Z`. El caso obligatorio guarda con energía y código aceptado, vuelve a ese punto con el seguro todavía puesto, libera el seguro y cruza. Las demás anclas se ubican dentro de la cabaña `(0, 0, −7.2)`, frente al cobertizo `(9, 0, −3.3)` y al pie de la rampa `(0, −2.6, −21.2)`. Comprobar que desde cada una se puede volver a los objetos pendientes.

## Guion de playtest ciego para G2

Preparar 2–3 sesiones independientes con partida nueva. Leer el siguiente texto al comenzar. Guardar las soluciones y este plano para quien observa.

> Estás dentro de un predio y querés salir. Usá WASD y el mouse para moverte y mirar, E para interactuar, Tab para abrir la mochila y Esc para pausar. Decí en voz alta qué creés que podés hacer.

Registrar una fila por participante. Anotar antes de intervenir. Si se requiere una pista, dar primero una indicación general y registrar la hora y el texto dado.

| Sesión    | Entendió el portón (min) | Entró a la cabaña (min) | Primera pista ignorada | Primer atasco y su duración | Orden de resolución | ¿Notó el cambio al volver? | ¿Terminó? ¿Con ayuda? | Duración |
| --------- | ------------------------ | ----------------------- | ---------------------- | --------------------------- | ------------------- | -------------------------- | --------------------- | -------- |
| Pendiente | —                        | —                       | —                      | —                           | —                   | —                          | —                     | —        |

Al final preguntar «¿Qué entendiste que pasó antes de llegar?», «¿Dónde dudaste hacia dónde ir?» y «¿En qué momento cambió lo que sentías?». Si dos personas se pierden o pasan por alto la misma pista, revisar encuadre, proximidad o contraste y repetir ese tramo antes de fijar la escala. Registrar por separado la verificación de recarga y el video de un recorrido completo desde la llegada.
