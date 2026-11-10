# Verificación de la Fase 0

El 10 de noviembre de 2026, la build de producción pasó las cuatro pruebas de Playwright en Chrome 157.0.8103.38 y Firefox 159.0. Se probó WebGL2 forzado y la selección optativa de WebGPU en ambos navegadores.

## Recorrido verificado

- La cabaña GLB llegó por HTTP y se comprobó su firma binaria. Las capturas desde la llegada muestran la cabaña, el camino, el bosque y el indicador WebGL2.
- El clic en **Iniciar** capturó el mouse y activó el contexto de audio. Se verificó el giro de cámara con el mouse y el desplazamiento con **W**.
- La salida de Pointer Lock y la pérdida de foco pausaron el movimiento. El clic en **Reanudar** recuperó el control.
- El ensayo usó `document.exitPointerLock()` para comprobar la transición que sigue a la liberación del mouse y un evento `blur` simulado para comprobar el manejador de foco. La tecla Esc física y el cambio de pestaña con interfaz visible quedan como pruebas manuales.
- Con WebGPU solicitado, los dos navegadores seleccionaron WebGL2 y permitieron iniciar. Chrome exponía la API WebGPU y Firefox no la exponía en este entorno. El render WebGPU nativo queda pendiente en un equipo compatible.
- No se registraron errores de JavaScript, consola o peticiones durante los recorridos.

## Mediciones exploratorias

Zorin OS 18.1, Intel Core i3-10105, 16 GB de RAM, navegadores headless, 1280 × 720, build servida por Vite Preview en localhost sin limitar la red. Cada prueba abrió un contexto nuevo con caché fría. El tiempo hasta el control se tomó desde el inicio de la navegación hasta que el juego confirmó la primera captura del mouse, con clic automatizado en **Iniciar**. El FPS y p99 salen de 90 intervalos de `requestAnimationFrame` en la escena inicial.

| Navegador   | Backend                             | Hasta control | Transferencia | FPS medio | p99 de cuadro |
| ----------- | ----------------------------------- | ------------: | ------------: | --------: | ------------: |
| Chrome 157  | WebGL2, ANGLE SwiftShader           |        1,74 s |      325,6 kB |        48 |      33,40 ms |
| Firefox 159 | WebGL2, renderer reportado genérico |        0,78 s |      325,6 kB |        60 |      17,18 ms |

Chrome usó renderizado por software. Firefox reportó «Intel(R) HD Graphics 400, or similar» y no se verificó una GPU física. Estos datos describen el prototipo local y sirven para reproducir el diagnóstico. La aceptación de rendimiento de lanzamiento requiere hardware físico y escenas representativas.

## Repetir

Con Chrome instalado, `npm run build && npm test` ejecuta las dos pruebas de Chrome. Para sumar Firefox y conservar capturas y métricas en el reporte de Playwright:

```sh
npx playwright install firefox
npm run build
KM77_TEST_FIREFOX=1 npm run test:e2e -- --workers=1 --reporter=list,html
```

El visor del informe se abre con `npx playwright show-report`.
