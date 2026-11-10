# ADR-004 — Evidencia de rendimiento por plataforma

**Estado** — Aceptada para G0. Los presupuestos de lanzamiento siguen siendo provisionales.

## Contexto

La escena inicial sirve para detectar errores de carga y arranque. Las zonas representativas, la densidad de vegetación y la iluminación final se incorporan en las fases siguientes.

## Decisión

En G0, registrar navegador y versión, sistema operativo, CPU, GPU o renderizador por software, backend efectivo, resolución de render y ruta probada. Registrar cuando sea medible el tiempo hasta que el jugador obtiene control, el volumen transferido y una muestra de tiempos de cuadro. Separar los resultados por navegador y backend.

El renderizado por software sirve como evidencia funcional y como diagnóstico del entorno de prueba. Para aceptar metas de lanzamiento, medir en hardware gráfico físico de referencia con escenas representativas. Mantener el procedimiento del plan para G2 y la verificación previa al lanzamiento, con la misma ruta, resolución y calidad en cada comparación. Registrar percentiles de tiempo de cuadro además del promedio.

## Verificación

Documentar qué pudo medirse en G0 y en qué entorno. Verificar con los perfiles de hardware de referencia cuando existan escenas representativas y revisar los presupuestos del plan con esas mediciones.
