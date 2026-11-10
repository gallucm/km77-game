# Verificación de la Fase 1

## Prueba de recorrido

El recorrido completo pasó en Chrome 157 y Firefox 159. Chrome se probó antes del último ajuste visual, que movió un árbol fuera de la cabaña sin cambiar el trazado. Firefox pasó en 41,4 s sobre la build final y dejó un vídeo. Ese tiempo corresponde a una ruta automatizada con solución conocida.

El recorrido automatizado opera el juego con teclado, puntero e interfaz. Lee la pose y el objetivo de interacción en modo diagnóstico para orientar la cámara y envía movimientos sintéticos del mouse. Recoge los objetos en el escenario, atraviesa sus accesos y completa los acertijos sin modificar el guardado ni saltar estados. La solución conocida por la prueba sirve para verificar el recorrido completo.

El escenario de persistencia arranca desde una partida nueva y acepta el código con el seguro puesto. Tras recargar, conserva energía, código y manivela. Se libera el seguro, se cruza el portón y el final sigue visible después de otra recarga. La prueba también verifica un intento de código incorrecto, la pista de guardia y el aviso al regresar con el generador encendido.

Para repetir y grabar, con Chrome instalado y Firefox descargado con `npx playwright install firefox`:

```sh
npm run build
KM77_TEST_FIREFOX=1 KM77_RECORD=1 npm run test:e2e -- tests/fase-1.spec.ts --workers=1 --reporter=list,html
```

El informe de Playwright incluye vídeo de la partida automatizada. La captura no incluye el audio generado por el juego.

## Regresión de la Fase 0 y mediciones

La build final pasó las cuatro pruebas de regresión G0 en Chrome 157 y Firefox 159. WebGL2 fue el backend efectivo tanto al forzarlo como al solicitar WebGPU en este entorno. No se registraron errores de consola, JavaScript ni peticiones durante los recorridos de G0.

La medición conserva el método exploratorio de [G0](fase-0.md): Zorin OS 18.1, i3-10105, 16 GB, navegador headless, 1280 × 720, caché fría, Vite Preview en localhost sin limitar red y 90 intervalos de `requestAnimationFrame`. No se grabó vídeo durante esta medición.

| Navegador   | Backend                             | Hasta control | Transferencia | FPS medio | p99 de cuadro |
| ----------- | ----------------------------------- | ------------: | ------------: | --------: | ------------: |
| Chrome 157  | WebGL2, ANGLE SwiftShader           |        2,26 s |      333,1 kB |        33 |      33,40 ms |
| Firefox 159 | WebGL2, renderer reportado genérico |        0,68 s |      333,1 kB |        60 |      17,16 ms |

La transferencia subió unos 7,5 kB frente a G0. En Chrome con renderizado por software, la muestra de G1 promedió 33 FPS frente a 48 FPS en G0. Los datos son una sola muestra por navegador de la escena de llegada, con cámara y geometría distintas entre las fases. Sirven como registro de desarrollo. Los objetivos de rendimiento quedan para escenas representativas y hardware físico.

## Aceptación de G1 y validación posterior

El titular probó el juego y aprobó el cierre de G1 el 10 de noviembre de 2026. Queda como validación de G2 el playtest ciego con dos o tres personas que desconozcan el mapa y la solución. Darles solo los controles. Para cada sesión, anotar cuándo entienden el objetivo del portón, la primera pista que pasan de largo, los atascos y la ayuda que necesitaron, cuánto dura la partida y qué les llama la atención al volver al portón tras encender el generador. El playtest ciego servirá para ajustar escala y navegación durante G2.
