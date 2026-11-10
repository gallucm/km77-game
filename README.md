# Kilómetro 17 · El Portón

Prototipo 3D de suspense para navegador de escritorio. La muestra de la Fase 2 viste el recorrido entre el portón y la cabaña. El resto del predio conserva el graybox jugable. La partida se guarda en este navegador al avanzar en las pistas y mecanismos.

## Ejecutar

Requiere Node.js 22.23.2 o posterior, npm y un navegador de escritorio con WebGL2.

```sh
npm ci
npm run dev
```

Abrí la URL local que muestra Vite y pulsá **Iniciar**. Movete con **WASD**, corré con **Shift** y mirá con el mouse. Usá **F** para encender o apagar la linterna, **E** para interactuar y **Tab** para revisar la mochila y las pistas. Podés cambiar la calidad gráfica en el menú de inicio o pausa. **Esc** suelta el cursor. Pulsá **Reanudar** para volver al recorrido, o **Continuar** para cargar una partida después de recargar la página. WebGL2 es el modo predeterminado. Para ensayar WebGPU, agregá `?renderer=webgpu` a la URL y verificá el backend que aparece arriba a la derecha.

## Verificar

```sh
npm run typecheck
npm run lint
npm run build
npm test
```

Las pruebas de navegador usan Chrome instalado en el sistema. Para repetirlas también en Firefox, ejecutá `npx playwright install firefox` y luego `KM77_TEST_FIREFOX=1 npm test -- --workers=1`.

El build estático queda en `dist/`. `npm run start` lo sirve en local.

- [Plan de desarrollo](plan-km77-game.md)
- [Muestra visual y sonora de G2](docs/design/fase-2-muestra.md)
- [Plano del graybox y guion del playtest](docs/design/fase-1-graybox.md)
- [Decisiones técnicas](docs/decisions/)
- [Verificación en navegador](docs/qa/)
