# ADR-001 — PlayCanvas Engine standalone

**Estado** — Aceptada para G0.

## Contexto

Kilómetro 17 es un juego 3D de escritorio para navegador. G0 debe comprobar que una escena nocturna con un GLB, cámara y audio funciona desde una página estática y que el jugador puede recuperar el control tras pausar.

## Decisión

Usar el starter oficial standalone de PlayCanvas Engine con TypeScript y Vite. PlayCanvas gestiona la escena, los recursos y el ciclo de render. Las reglas jugables permanecen independientes del motor cuando se incorporen en G1.

WebGL2 es la ruta de inicio predeterminada. WebGPU se solicita de forma optativa y la creación inicial del dispositivo vuelve a WebGL2 si WebGPU no está disponible o no se obtiene su dispositivo. La interfaz de diagnóstico muestra el backend efectivo. Si no se puede crear un dispositivo, la pantalla de inicio informa del fallo.

## Verificación

Para G0, abrir la aplicación en un navegador real con WebGL2 forzado y comprobar el GLB, movimiento, inicio de audio, pausa y reanudación. Registrar por separado el resultado del segundo navegador y, cuando el entorno lo permita, el intento WebGPU y el backend obtenido.
