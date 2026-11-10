# AGENTS.md — Kilómetro 17

- Leer `plan-km77-game.md` y trabajar solo en el hito solicitado.
- TypeScript estricto. Mantener reglas y progreso independientes del renderer y la UI.
- PlayCanvas standalone como único motor 3D. WebGL2 es la base. WebGPU es una prueba optativa.
- El MVP es estático y guarda en el navegador. Mantener secretos y credenciales fuera del cliente.
- Verificar API y tipos instalados. Consultar las skills oficiales en `.agents/skills/` al trabajar con escenas, modelos y pruebas visuales.
- Usar placeholders explícitos mientras falten assets finales. Registrar origen y licencia de assets externos.
- Ejecutar `npm run typecheck`, `npm run lint`, `npm run build` y `npm test`. Si cambia gameplay o render, probar en un navegador y registrar evidencia. Medir cambios de rendimiento y carga.
- Explicar cualquier comprobación pendiente. Cerrar un hito cuando cumpla su gate observable.
- Al iniciar cada iteración o sesión de Kilómetro 17, recuperar en Engram el contexto de `km77` y contrastarlo con el plan y el repo. Al cerrar, guardar decisiones, hallazgos verificados y pendientes relevantes para retomar.
