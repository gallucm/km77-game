# Fase 2 · Muestra visual y sonora

La muestra cubre el portón, el camino y la entrada a la cabaña hasta leer el registro de guardia. El regreso con el generador en marcha comprueba que la zona cambia sin perder orientación. El mapa, los acertijos y la recuperación de progreso siguen el recorrido de G1.

## Recorrido y criterios de aceptación

| Tramo               | Evidencia que buscar                                                                                                                                                                                                                                                                                             |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Llegada y portón    | Se distinguen el hueco de salida, la hoja, el panel y el mecanismo manual. El suelo, el borde del camino y las siluetas próximas se separan con la linterna apagada.                                                                                                                                             |
| Camino y porche     | Exterior frío en azul y gris, con niebla al fondo. El porche ámbar se reconoce antes de llegar y se mantiene como baliza en Bajo. Comparar la misma posición de cámara en Bajo y Alto.                                                                                                                           |
| Umbral y registro   | El interior se percibe más cálido que el camino. La transición se aprecia también en el sonido de los pasos. El jugador descubre el registro al mirar y acercarse a la mesa. Al interactuar, la nota completa se puede leer con linterna apagada, sin forzar al jugador a descifrar texto en una textura oscura. |
| Regreso con energía | El indicador del portón cambia al restaurar la energía y el evento de retorno combina un cambio de luz y un golpe audible. Se mantiene la señal de texto del golpe y el jugador conserva el control. El evento se registra una vez.                                                                              |

La linterna ilumina donde apunta la cámara y ayuda a reconocer objetos y materiales. Validar encendido y apagado con `F` durante el juego, y que los controles de una nota abierta mantienen el foco. La penumbra y el ángulo de aproximación hacen que la inspección requiera observar. La información de los acertijos se mantiene en todos los perfiles y estados de la linterna.

### Legibilidad

- La mesa, los papeles y la señal de interacción tienen que poder distinguirse con la luz ambiente en Bajo. Revisar el objeto desde la entrada y desde la distancia de interacción, sin recurrir a información de diagnóstico.
- Para el panel de inspección, usar una superficie estable y contraste de al menos 4,5:1 entre texto normal y fondo efectivo. La combinación del documento `#251f16` sobre `#eee2c8` da 12,71:1 por luminancia relativa sRGB. En Chrome con WebGL2 se verificaron ajuste horizontal, desplazamiento del contenido y foco en `Volver al predio` con un viewport de 640 × 360 CSS, equivalente al espacio disponible al 200 % desde 1280 × 720. El diálogo también quedó dentro del viewport a 400 × 225 y se cerró con Enter. La recuperación del puntero a 400 × 225 quedó sin confirmar durante esa pasada, que coincidió con recargas de Vite.
- El croquis vincula cuatro alias con lugares y el registro da la secuencia de la ronda, incluida la anotación de las 23:47. Verificar que el jugador puede cruzar ambas pistas desde la mochila y leer las cuatro placas. El código y las dependencias del portón son los de G1.

### Coste gráfico y sonoro

- La muestra usa materiales originales para grava, madera y óxido, dos siluetas de pinos instanciadas por sectores, niebla lineal y una luz horneada de referencia en el porche. El GLB de G0 permanece como referencia. La validación de su pipeline de compresión queda pendiente.
- Bajo usa un límite de escala de 0,62 y Medio de 0,82. Alto admite hasta un DPR de 1,5 y activa la sombra de la linterna cuando está encendida. Verificar el tamaño efectivo del buffer de dibujo y el comportamiento de la linterna en ambos perfiles.
- Comparar audio de superficie y ambiente en movimiento, en el umbral y al pausar. Una grabación sin pista sonora no verifica por sí sola la mezcla. Documentar las comprobaciones automáticas y las de escucha por separado.

## Verificación en navegador y rendimiento

1. En WebGL2, realizar el recorrido con teclado, ratón y UI. Capturar portón inicial, porche, registro abierto y retorno. Registrar navegador, viewport, preset y estado de la linterna. Verificar la partida alternativa que conserva el código aceptado al recargar con el seguro puesto.
2. Para la comparación visual y de coste, repetir en Bajo y Alto con cámara, viewport, ruta, estado del generador y linterna equivalentes. Registrar backend, dispositivo, resolución interna, transferencia fría, FPS medio y p99 de tiempo de cuadro. Añadir draw calls cuando el profiler los exponga. Mantener separadas las pasadas de vídeo y rendimiento.
3. Para el gate de rendimiento, repetir tres pasadas por perfil en hardware gráfico físico de referencia. Registrar CPU, GPU, SO y versión del navegador. Usar Alto a 1920 × 1080 con meta orientativa de 60 FPS y Bajo a 1280 × 720 o equivalente con mínimo orientativo de 30 FPS. Si un perfil queda fuera, registrar qué tramo, cuánto se desvía y qué coste se ajustará. Las mediciones con GPU por software son diagnóstico de desarrollo.

## Prueba con jugadores

Usar el [guion de playtest](fase-1-graybox.md#guion-de-playtest-ciego-para-g2) con dos o tres personas que desconozcan la solución. Añadir dos observaciones por sesión. Registrar si encontraron el registro antes de pedir ayuda y qué hizo visible la nota. Al regresar, preguntar qué cambió y si se orientaron por la luz, por el camino o por una referencia distinta. Registrar el preset, si usaron la linterna y si pudieron leer sin subir brillo.

La observación con jugadores y las pasadas en hardware de referencia quedan pendientes hasta contar con evidencia. La aceptación funcional en navegador se registra por separado del cierre del gate.
