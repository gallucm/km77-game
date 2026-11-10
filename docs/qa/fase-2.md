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

## Validaciones pendientes

- Sesiones ciegas con dos o tres personas para comprobar descubrimiento de pistas, orientación y tensión.
- Escucha humana del balance de pasos, viento y generador. La automatización confirmó el contexto de audio y la señal de retorno. La captura visual no contiene la mezcla.
- Probar el perfil Alto en el hardware dedicado de referencia y repetir el benchmark en escenas representativas del mapa completo.
- Evaluar compresión de modelos y texturas cuando se incorporen assets de mayor tamaño. La muestra conserva el GLB de referencia pequeño y evita añadir decodificadores.
