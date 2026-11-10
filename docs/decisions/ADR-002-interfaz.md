# ADR-002 — Interfaz con DOM y CSS

**Estado** — Aceptada para G0.

## Contexto

La escena necesita una pantalla de inicio, indicaciones de control y una forma de pausar y reanudar. El navegador exige un gesto del usuario para solicitar el bloqueo de puntero y habilitar audio.

## Decisión

Implementar la interfaz en HTML y CSS, con eventos gestionados en TypeScript. El canvas contiene la escena 3D y los controles y mensajes se muestran en una capa DOM. La capa DOM refleja el estado de la aplicación y envía acciones explícitas. La actualización de la cámara corre en el ciclo del motor.

Usar botones que se puedan activar con teclado para iniciar y reanudar. Pedir el bloqueo de puntero a partir del gesto de inicio o reanudación. Al perderlo, detener el control FPS y mostrar la pausa. Volver a evaluar la elección si los flujos posteriores justifican un framework de interfaz.

## Verificación

Comprobar en navegador que se puede iniciar y reanudar con el botón, que Escape libera el puntero y que la interfaz permite volver al juego.
