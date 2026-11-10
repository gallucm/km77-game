# Verificación de la Fase 2

## Recorrido verificado

La corrida de regresión pasó las ocho pruebas de navegador en Chrome 157 y Firefox 159. En ambos se probó el inicio, la pérdida de captura del mouse, el camino completo con guardado y recarga, y la lectura del registro con la linterna apagada. La prueba de G2 alterna la linterna con F, cambia el preset desde el menú y comprueba que se conserva tras recargar. Pasaron además TypeScript, ESLint, build y ocho pruebas unitarias de progreso.

El contraste de la nota es de 12,7:1. La comprobación de reflow abrió el registro a 1280 × 720, 640 × 360 y 400 × 225 CSS. El diálogo entró en el viewport, mantuvo el contenido desplazable y se cerró con Enter. Esa prueba de estrés no confirmó la recaptura del puntero en 400 × 225. La regresión sí verificó la reanudación con el botón en los tamaños de prueba habituales.

## Rendimiento

Para repetir el benchmark de Chrome con una GPU Linux disponible para ANGLE Vulkan:

```sh
npm run build
KM77_HARDWARE=1 npm run test:e2e -- tests/fase-1.spec.ts --project=chrome --grep G2 --workers=1
```

El modo `?diagnostics=1` muestra resolución interna, draw calls y FPS. El test guarda capturas y métricas en `test-results/`. El renderer informado por WebGL distingue un dispositivo real de SwiftShader. La medición es una vista fija del portón, con tres muestras de 45 intervalos por preset en Chrome y linterna apagada. La medición con linterna en Alto se informa por separado. El build genera un bundle JavaScript de 330,3 kB gzip frente a 327,2 kB de G1, más el GLB de referencia de 4,8 KiB. Las texturas de 64 × 64 y el mapa de luz del porche se generan en cliente sin descargar recursos adicionales.

## Benchmark G2 (hardware físico)

Ejecutado el 10/11/2026 con el comando del plan:

```sh
npm run build
KM77_HARDWARE=1 npm run test:e2e -- tests/fase-1.spec.ts --project=chrome --grep "G2" --workers=1
```

Resultado: **1 prueba pasada** en 12,9 s, sin errores de consola ni de página (`errors === []`).

### Entorno

| Campo             | Valor                                                                                     |
| ----------------- | ----------------------------------------------------------------------------------------- |
| Sistema operativo | Zorin OS 18.1                                                                             |
| CPU               | Intel Core i3-10105 @ 3,70 GHz                                                            |
| RAM               | 16 GB                                                                                     |
| GPU               | Intel UHD Graphics 630 (iGPU física, `0x00009BC8`)                                        |
| Backend           | WebGL2, ANGLE Vulkan (`--use-gl=angle --use-angle=vulkan`), Intel open-source Mesa driver |
| Navegador         | Google Chrome 157.0.8103.38                                                               |
| Viewport          | 1920 × 1080 (modo hardware)                                                               |
| Muestras          | 3 por preset (`repeats = 3`)                                                              |
| Escena            | Vista fija del portón (misma posición de cámara)                                          |
| Linterna          | Apagada en Bajo/Alto; medición separada en Alto con linterna encendida                    |

No es SwiftShader: el renderer reportado es `ANGLE (Intel, Vulkan 1.4.318, Intel(R) UHD Graphics 630, Intel open-source Mesa driver)`.

### Métricas (FPS y p99 de tiempo de cuadro)

| Preset          | FPS medio | p99 (ms) | Draw calls | Buffer (ancho × alto) |
| --------------- | --------: | -------: | ---------: | --------------------- |
| Bajo (×3)       |     60,01 |    16,77 |         24 | 1190 × 669            |
| Alto (×3)       |     60,00 |    16,80 |         24 | 1920 × 1080           |
| Alto + linterna |     60,01 |    16,80 |         39 | 1920 × 1080           |

- FPS medio Bajo: (60,008 + 60,000 + 60,008) / 3 = **60,01 FPS**.
- FPS medio Alto: **60,00 FPS** (3 muestras idénticas).
- FPS medio Alto con linterna: **60,01 FPS**.
- p99 de tiempo de cuadro: Bajo 16,77 ms, Alto 16,80 ms, Alto + linterna 16,80 ms (cap de vsync a 60 FPS).
- Draw calls: 24 en Bajo y Alto sin linterna; **39** con linterna encendida en Alto (las sombras de la linterna se activan solo en Alto).
- Buffer de dibujo: Bajo 1190 × 669 (0,62 × 1920/1080); Alto 1920 × 1080.

### Transferencia

Build de producción (Vite): JavaScript 1.240,50 kB sin comprimir / **330,42 kB gzip**, CSS 3,18 kB (1,28 kB gzip), HTML 3,14 kB (1,14 kB gzip), GLB de referencia 4,86 kB. Total aproximado transferido por la aplicación: **~337,70 kB gzip**. Medición en localhost sin throttling; no se registró caché fría en esta pasada.

### Errores

- Errores de consola / página: **0**.
- El test también verifica `high[0].width > low[0].width`, `high[0].height > low[0].height`, `drawCalls > 0` en ambos presets.

### Capturas y métricas

- JSON de métricas: `docs/qa/evidence/g2/metricas-porton.json` (copia del generado en `test-results/.../metricas-porton.json`).
- Capturas: `docs/qa/evidence/g2/{porton-bajo,porton-alto,porton-alto-con-linterna,registro-sin-linterna,lectura-registro}.png`.
- El test original adjunta 9 capturas y el JSON en el reporte de Playwright.

### Interpretación

En la iGPU de referencia (Intel UHD 630) la muestra del portón corre a 60 FPS con p99 de ~16,8 ms en Bajo y Alto, con y sin linterna. Los draw calls se mantienen en 24 sin linterna y suben a 39 con sombras de linterna en Alto. El buffer escala como se diseñó (0,62 en Bajo, 1,0 en Alto). No se detecta cuello de botella en esta escena; queda pendiente repetir en las otras vistas del procedimiento (entrada al bosque, camino con máxima vegetación, interior de cabaña, generador encendido, portón animándose) y en hardware dedicado de gama superior.

## Validaciones pendientes

- Sesiones ciegas con dos o tres personas para comprobar descubrimiento de pistas, orientación y tensión (gate de playtest humano).
- Escucha humana del balance de pasos, viento y generador. La automatización confirmó el contexto de audio y la señal de retorno; la captura visual no contiene la mezcla.
- Repetir el benchmark en las vistas restantes del procedimiento (entrada al bosque, camino con máxima vegetación, interior de cabaña, generador encendido, portón animándose) y en hardware dedicado de referencia.
- Evaluar compresión de modelos y texturas cuando se incorporen assets de mayor tamaño. La muestra conserva el GLB de referencia pequeño y evita añadir decodificadores.

## Estado del gate

- **Gate técnico G2: cerrado.** La escena elegida se parece razonablemente al objetivo artístico, los interactuables se ven, el contraste es 12,71:1 (≥ 4,5:1), la linterna funciona con y sin sombra, y los perfiles Bajo y Alto rinden 60 FPS con p99 ~16,8 ms en la iGPU de referencia, sin errores.
- **Gate de playtest (humano): pendiente.** Requiere 2–3 sesiones ciegas y escucha humana del audio; no bloquea el cierre técnico.
