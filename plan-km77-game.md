# KILÓMETRO 17: EL PORTÓN — Plan maestro de desarrollo

> **Versión:** 1.1 · **Fecha:** 10 de noviembre de 2026  
> **Estado:** propuesta de preproducción, lista para delegar a Codex y agentes especializados.  
> **Idioma del juego (MVP):** español · **Plataforma de lanzamiento:** navegador de escritorio.  
> **Regla del proyecto:** primero un juego completo, pequeño y estable; después más contenido y efectos.

---

## 0. Cómo usar este documento

Este archivo es simultáneamente **Game Design Document (GDD)**, **Technical Design Document (TDD)** y **backlog inicial verificable**. No es código ni un juego ya implementado.

1. Mantener este documento como `plan-km77-game.md` en la carpeta del proyecto.
2. Leer primero las secciones 1–7 para aceptar el alcance, y 8–14 para las restricciones técnicas.
3. Crear `AGENTS.md`, `README.md`, `docs/decisions/`, `docs/qa/` y el código durante la fase 0.
4. Encomendar a Codex **una fase y un entregable a la vez**; no pedir la creación integral del juego en una sola instrucción.
5. Cada PR debe contener evidencia: build, pruebas pertinentes, prueba real en navegador y métricas cuando afecte al render.
6. No marcar un hito como terminado porque «el código compila»: debe ser **jugable, visible y comprobado**.

**Decisiones iniciales ya tomadas:** mundo 3D pequeño; primera persona; suspense psicológico; una sesión corta cuya duración se validará en graybox; sin combate ni IA enemiga en MVP; escritorio primero; motor web-first basado en TypeScript; no backend; assets propios o con licencias documentadas.

---

## 1. Visión del juego

### 1.1 High concept

**Título de trabajo:** **Kilómetro 17: El Portón**  
**Género:** suspense / terror psicológico / exploración / acertijos / escape room en primera persona.  
**Perspectiva:** primera persona, un solo jugador.  
**Elevator pitch:** *Un automóvil te abandona de noche en un bosque cercado. Para abrir el portón y escapar tenés que investigar una cabaña, restaurar la energía y descubrir quién te llevó hasta allí. El bosque parece reaccionar a tus avances.*

El atractivo principal **no** es un gran mundo abierto: es la combinación de una cabaña creíble, un entorno nocturno de gran atmósfera, acciones con consecuencias y una escapatoria con objetivo claro.

### 1.2 Fantasía y experiencia buscada

- **Sentirse perdido pero no desorientado:** pocos caminos bien diseñados y referencias visuales consistentes.
- **Investigar de verdad:** cada objeto, nota y mecanismo conduce a una deducción o acción verificable.
- **Temer al silencio:** sonidos espaciales, cambios sutiles del entorno y momentos de tensión guionados.
- **Notar progreso:** luces que se encienden, dispositivos reparados, nuevos accesos y portón que finalmente se abre.
- **Jugar directamente en el navegador:** sin instalación, cuentas, registro ni servicios externos.

### 1.3 Pilares no negociables

| Pilar | Implicación concreta | Cómo se valida |
|---|---|---|
| Atmósfera convincente | Iluminación nocturna artística, niebla moderada, PBR, buenos sonidos | Capturas + prueba con auriculares |
| Jugabilidad primero | Caminar, mirar, interactuar y resolver sin fricciones | Prueba de recorrido completo |
| Acertijos justos | Pistas suficientes, lógica consistente y sin bloqueos | Test de usuarios sin instrucciones |
| Rendimiento web | Calidad escalable, carga segmentada, modelo GLB optimizado | Medición repetible por dispositivo |
| Escala controlada | Un mapa, una historia, una salida, una sesión | Lista de alcance y gates de fases |

### 1.4 Público y clasificación creativa

Para amantes de experiencias cortas como los juegos narrativos de exploración y horror ambiental. Tono inquietante, sin gore explícito ni violencia necesaria. Priorizar la tensión psicológica sobre sobresaltos excesivos. Incluir configuración para atenuar destellos y efectos que puedan causar mareo.

---

## 2. Historia y guion interactivo

### 2.1 Premisa de apertura

**23:47.** El jugador es pasajero de un auto que circula por un camino de tierra. El conductor atraviesa con control remoto un portón de hierro, detiene el coche dentro del predio y dice: **«Esperá acá. Ahora vuelvo.»** La puerta del acompañante se abre. El jugador desciende; el coche se aleja y atraviesa el portón, que vuelve a cerrarse.

No hay explicación sobre quién es el conductor ni por qué lo abandonó. El móvil no tiene señal. Un cartel oxidado indica **KM 17 — PROPIEDAD FORESTAL**. A lo lejos, una cabaña conserva una luz encendida.

**Implementación sensata de la escena inicial:** secuencia de cámara y audio de 30–45 s; un modelo exterior/interior simplificado del vehículo; movimiento por spline o dos posiciones con cortes cinematográficos; sin física de conducción ni sistema completo de NPC. Después de la secuencia, el auto se descarga si ya no es visible.

### 2.2 Estructura narrativa en cinco actos

| Acto | Tiempo orientativo | Lo que vive el jugador | Propósito |
|---|---:|---|---|
| 0. Abandono | 0–1 min | Viaje, descenso, coche se va, portón cerrado | Gancho y controles |
| 1. Reconocimiento | 1–4 min | Examina portón, camino, cabaña y cobertizo | Comprende tres bloqueos de escape |
| 2. La investigación | 4–12 min | Encuentra pistas, recursos y acceso al sótano | Resolver y conectar acertijos |
| 3. El bosque responde | 12–17 min | Generador activo, eventos extraños, vuelta al portón | Clímax sin combate |
| 4. Salida | 17–20 min | Desbloqueo manual, código, apertura y escape | Cierre con misterio residual |

Los minutos ilustran la curva, no fijan la duración. Probar una primera ruta compacta de unos 20 minutos y revisar los tiempos con jugadores antes de ampliar el recorrido.

### 2.3 Historia ambiental y revelación

La cabaña pertenece a un antiguo cuidador del predio. A través de registros, fotos, números de guardia y una grabación se insinúa que **algunas personas fueron llevadas al bosque deliberadamente**. El conductor podría ser parte de ese ciclo. No explicar por completo el fenómeno durante el MVP: mantener el misterio.

**Elementos narrativos mínimos:**

- Cartel exterior “KM 17 — Acceso restringido”.
- Registro de mantenimiento: fallos del generador y del mecanismo del portón.
- Croquis de la finca con la ubicación de las cuatro placas y registro de guardia con el orden de la ronda.
- Fotografía del portón en mejores tiempos, con la misma figura desconocida que aparece en un reflejo.
- Nota en el sótano: “No respondas cuando escuches tu nombre”.
- Grabación final opcional, cerca de la salida: el conductor pregunta por radio si “ya terminó”.

**Final MVP:** el jugador introduce el código, desbloquea el seguro y abre el portón. Se escucha una voz desde el bosque, idéntica a la suya. Puede cruzar y se funde a negro. Texto final breve: **«Kilómetro 17 — 00:18»**. Un solo final, sin elecciones irreversibles.

---

## 3. Mapa y diseño del nivel

### 3.1 Escala y distribución

**Área jugable tentativa:** hasta **180 × 180 m** como referencia provisional. La huella se ajusta según tiempos de marcha, orientación y regresos observados en G1. El perímetro visual puede simular un bosque mayor con siluetas, niebla y vegetación barata; **no construir un bosque abierto infinito**.

```text
                    [Bosque fuera de límites]
                             | 
               [Pozo y placa numérica]
                       /             \
                 [Cabaña]--------- [Cobertizo]
                 |  |                |  |
          [Interior][Sótano]      [Generador]
                 \                   /
                  \  Camino de tierra
                   \      /
                [Zona de llegada]
                         |
              [Portón / panel / manivela]
                         |
                 [Salida del nivel]
```

El croquis es topológico, **no un plano a escala**. Crear un plano métrico en la fase 1.

### 3.2 Zonas y propósito

| Zona | Apariencia | Uso jugable | Requisitos de producción |
|---|---|---|---|
| Llegada y camino | Tierra húmeda, charcos simulados, marcas de neumáticos | Tutorial integrado, primer reconocimiento | Terreno, decal simple, valla, audio |
| Portón | Metal corroído, cerradura de seguridad, caja de control | Meta visible desde el inicio; feedback del estado | Animación de puertas, panel, colisiones |
| Bosque principal | Pinos, helechos, troncos, rocas, niebla | Conectar las zonas y ocultar cuatro placas | Instancing por sectores, oclusión visual |
| Cabaña exterior | Madera deteriorada, porche, una luz amarilla | Punto de atracción | Modelo exterior, lightmap y luces |
| Cabaña interior | Entrada, sala, cocina, pequeña oficina | Notas, llave, mapa y lógica de código | Colisiones, interiores con narrativa |
| Sótano | Pasillo estrecho, tablero viejo, estanterías | Recuperar manivela del seguro mecánico | Una habitación compacta, audio/evento |
| Cobertizo | Herramientas, combustible, generador | Reparar alimentación eléctrica | Interacciones y animación del generador |
| Pozo | Pozo seco y señal numerada | Una de las pistas del código | Prop simple; sin sistema de caída |

### 3.3 Reglas de navegación

- El portón debe ser visible y examinable antes de entrar en la cabaña.
- La ventana iluminada de la cabaña y una lámpara del cobertizo funcionan como balizas.
- Utilizar camino principal y bifurcaciones cortas; evitar caminos idénticos y laberintos arbitrarios.
- Límites naturales: barrancos bajos, alambrados, maleza densa y rocas. No paredes invisibles evidentes.
- Zonas importantes identificables con silueta, composición y sonido.
- Distancia máxima de interacción: **2–2,5 m**, ajustable tras playtesting.
- Objetos importantes destacados mediante cambio sutil de retícula o mensaje contextual, sin outlines brillantes permanentes.

---

## 4. Bucle jugable y controles

### 4.1 Core loop

**Observar → Encontrar una pista → Investigar → Obtener/usar herramienta → Cambiar el estado del mundo → Desbloquear el siguiente objetivo.**

Cada 3–5 minutos debería ocurrir al menos uno: descubrimiento, cambio de escenario, revelación narrativa o interacción nueva. Evitar desplazamientos largos sin recompensa.

### 4.2 Mecánicas MVP

- Exploración FPS con rotación de cámara, andar y correr corto **sin barra de resistencia**.
- Colisiones contra suelo, paredes, muebles, árboles principales y puerta del portón.
- Linterna prendida/apagada; **sin consumo de batería** en MVP para evitar bloqueos y frustración.
- Inspección en primer plano de notas, mapa, placas y algunos objetos clave.
- Inventario mínimo de **objetos clave**; no grilla de cientos de ítems ni peso.
- Interacciones contextuales: agarrar, abrir, usar, instalar, activar, introducir código.
- Panel de objetivos discreto basado en hechos conocidos por el jugador.
- Pausa, sensibilidad del mouse, volumen, gráficos y opción de reanudar.
- Autoguardado local por hitos, con **Nuevo juego** y **Continuar**.

### 4.3 Tabla de entrada

| Acción | Teclado / mouse | Observaciones |
|---|---|---|
| Caminar | W A S D | Configurable en versión posterior |
| Mirar | Mouse | Pointer Lock solo tras clic voluntario |
| Correr | Shift | Velocidad moderada; no sprint arcade |
| Interactuar | E | Raycast central + feedback contextual |
| Linterna | F | Luz spot con coste limitado |
| Inventario | Tab | Overlay; suspende entrada FPS |
| Leer nota/inspeccionar | E y mouse | Esc permite volver |
| Pausa / liberación de cursor | Esc | Recuperar pointer lock al reanudar |
| Pantalla completa | Opción del menú | Nunca forzar sin gesto del usuario |

**Fuera de MVP:** saltar, agacharse, recoger físicamente cualquier prop, conducir, combate, controlador táctil y multijugador.

### 4.4 Feedback y accesibilidad

- Retícula mínima; al apuntar un objeto, aparecer `E — Examinar` o `E — Recoger`.
- Subtítulos para frases y sonidos narrativamente importantes, opcionales.
- Texto legible en notas; inspección 2D como alternativa a leer materiales 3D a oscuras.
- Ajuste de brillo con límites (no oscurecer hasta volver injugable).
- Reducir movimiento de cabeza, sacudidas de cámara y destellos desde opciones.
- Objetivos siempre visibles en el diario para que una pausa prolongada no haga perder el hilo.

---

## 5. Diseño integral de acertijos (solución canónica)

### 5.1 Objetivo mayor

El portón necesita **tres condiciones independientes**:

1. **Energía restaurada:** alimentar el panel desde el generador del cobertizo.
2. **Seguro mecánico liberado:** instalar y girar una manivela en la caja lateral del portón.
3. **Autorización de apertura:** introducir un código de cuatro cifras deducido de las señales del predio.

Pueden resolverse en el orden que el jugador elija, salvo las dependencias explícitas. El diseño debe **evitar secuencias rígidas artificiales**.

### 5.2 Cadena A — Restaurar la energía

**Pista:** panel del portón apagado: `SIN ALIMENTACIÓN`. En la cabaña, una hoja de mantenimiento dice: `Generador: revisar fusible y combustible`.

**Acciones:**

1. Encontrar la **llave del cobertizo** colgada en un gancho de la cocina de la cabaña.
2. Abrir el cobertizo.
3. Encontrar **fusible de repuesto** en un estante.
4. Encontrar **bidón de combustible** junto a la pila de leña exterior (muy cerca, señalizado).
5. Instalar fusible y cargar combustible en el generador.
6. Accionarlo; arranca, parpadea la iluminación exterior y el panel del portón queda energizado.

**Reglas:** combustible y fusible se usan una sola vez; orden de instalación indiferente; el generador no puede quedar irreparable; al guardar se registra `generatorRunning = true`.

### 5.3 Cadena B — El código de cuatro cifras

**Deducción:** el croquis ubica las placas y presenta cuatro nombres sin ordenarlos: Agua, Techo, Inicio y Luz. Junto al panel, una placa fija dice «El código sigue la ronda de guardia». En la cabaña, el registro describe la secuencia con esos nombres: «Salí por Inicio. Pasé por Luz antes de revisar Techo. Dejé Agua para el final». Al pie, otra anotación dice «23:47. El conductor volvió a dejar a alguien en el portón». Cruzar ambos documentos permite deducir el recorrido y vincula la llegada con un hecho anterior. La inspección muestra el texto con contraste y se puede abrir con la linterna apagada.

Cada lugar tiene una placa marcada, accesible **sin** resolver otra cadena:

| Lugar | Número visible | Cómo hacerlo reconocible |
|---|---:|---|
| Entrada | 2 | Placa junto al cartel del kilómetro |
| Cabaña | 4 | Chapa al lado de la puerta |
| Cobertizo | 7 | Número grande en el lateral, legible sin entrar |
| Pozo | 1 | Número grabado en soporte metálico |

**Código canónico de MVP:** `2471`.

**Reglas:** el panel del portón permite introducir 4 dígitos, limpiar y confirmar; sin corriente la pantalla queda apagada y el mensaje de inspección indica que falta energía; código erróneo produce un sonido suave sin penalización; el jugador puede acertar por deducción incluso si no leyó el croquis. Las placas no cambian aleatoriamente en el MVP: esto facilita pruebas y coherencia ambiental.

### 5.4 Cadena C — Seguro de apertura manual

**Pista:** una placa en el portón indica `DESBLOQUEO MANUAL OBLIGATORIO`. Falta la manivela.

**Acciones:**

1. Investigar la cabaña y encontrar la **llave del sótano** en un cajón de la oficina.
2. Abrir la puerta del sótano.
3. En el sótano, identificar una caja rotulada `REPUESTOS PORTÓN`.
4. Recoger la **manivela**; se activa un evento ambiental (golpe desde arriba, sin enemigo).
5. Volver al portón, instalar la manivela y accionarla para liberar el cerrojo mecánico.

**Reglas:** ninguna puerta se puede cerrar de manera que atrape al jugador; el cajón y la caja deben seguir accesibles tras recargas; la manivela no puede descartarse ni perderse.

### 5.5 Matriz de estado del portón

| Energía | Seguro manual | Código correcto | Resultado |
|---|---|---|---|
| No | Cualquiera | Cualquiera | Panel sin energía; no abre |
| Sí | No | Sí o no | Panel opera, pero informa `SEGURO ACTIVADO` |
| Sí | Sí | No | Solicita código válido |
| Sí | Sí | Sí | Reproduce apertura, desactiva colisión y permite escapar |

Con energía, el panel acepta y conserva un código correcto aunque el seguro esté puesto. La última condición cumplida inicia la apertura. Persistir la apertura lógica y, al recargar o si falla la animación, aplicar la pose abierta y retirar el bloqueo de colisión. Durante una animación normal, el paso queda bloqueado hasta que el hueco sea transitable. Registrar el escape por separado al cruzar la salida.

### 5.6 Modelo sugerido de estados

```ts
export interface GameProgress {
  saveVersion: 1;
  introCompleted: boolean;
  escaped: boolean;
  items: {
    shedKey: boolean;
    basementKey: boolean;
    fuse: boolean;
    fuelCan: boolean;
    gateCrank: boolean;
  };
  generator: {
    fuseInstalled: boolean;
    fuelAdded: boolean;
    running: boolean;
  };
  gate: {
    crankInstalled: boolean;
    mechanicalLockReleased: boolean;
    codeAccepted: boolean;
    open: boolean;
  };
  discoveredClues: string[];
  triggeredEvents: string[];
  checkpoints: string[];
}

export function canOpenGate(progress: GameProgress): boolean {
  return progress.generator.running
    && progress.gate.mechanicalLockReleased
    && progress.gate.codeAccepted;
}
```

**Aclaración:** es un contrato de dominio orientativo. Codex debe adaptar los tipos y los nombres al motor elegido y escribir tests antes de conectar la UI.

### 5.7 Anti-softlocks (prioridad alta)

- Ningún objeto de misión se puede lanzar, destruir ni salir del escenario.
- Recoger dos veces un ítem no duplica inventario.
- Una acción completada es idempotente y sobrevive a Guardar/Continuar.
- El usuario puede volver a examinar todas las pistas clave.
- El código nunca cambia entre partidas de una misma versión.
- Si falla el motor de audio o una animación, la lógica del acertijo sigue avanzando.
- Si un objeto quedó inaccesible tras carga, los tests deben detectarlo.
- La opción **Reiniciar desde último punto de control** no sobreescribe la partida completa sin avisar.

---

## 6. Eventos de tensión: terror de bajo coste técnico

**Regla:** tensión medida, no jumpscares constantes. Todas las escenas pueden implementarse con audio, luces y estados visuales, sin IA de personajes.

| Evento | Disparador | Implementación | Debe ocurrir... |
|---|---|---|---|
| E01 — Luces lejanas | Primera aproximación a la cabaña | Ventana que parpadea 2 veces | Una sola vez |
| E02 — Rama quebrada | Primera salida de la cabaña | Sonido 3D a un lado del camino | Una sola vez |
| E03 — La puerta | Entrada al sótano | Cierre brusco que se puede volver a abrir desde ambos lados | Una sola vez |
| E04 — El generador | Generador reparado | Apagón momentáneo y regreso de luces | Una sola vez |
| E05 — Susurro | Primera visita al área del portón con el generador encendido, incluida una activación estando ya en el área | Audio direccional + leve cámara reactiva opcional | Una sola vez |
| E06 — Tu voz | Portón abierto | Voz detrás del jugador; sin perseguir | Una sola vez |

**Director de tensión básico:** los eventos se registran en el estado y se disparan por condiciones explícitas, no por temporizadores impredecibles. No interrumpir lectura de notas ni romper el control del jugador. Opción `reducedEffects` quita destellos y sacudidas sin quitar pistas.

---

## 7. Dirección de arte y sonido

### 7.1 Referencia visual

**Estilo objetivo:** semi-realista / realista estilizado, no hiperrealismo. Una cabaña muy bien resuelta y un bosque oscuro creíble ofrecen mejor impacto que decenas de sistemas gráficos pesados.

**Paleta propuesta:**

- Exterior: azul petróleo, gris frío, verdes apagados.
- Interior: tungsteno ámbar, marrón madera, sombras cálidas.
- Objetos de interacción: contraste sutil por materiales, encuadre e iluminación.
- Portón: óxido, acero húmedo, panel apagado antes de reparar e indicador visible al energizar.
- Niebla: por capas perceptuales (fondo difuso), no necesariamente volumétrica real.

**Iluminación:** luna/ambiente muy bajo pero navegable, una luz principal por zona, lightmaps en estructuras estáticas y pocas luces dinámicas. Linterna como spot configurable; sombras costosas solo donde aporten al encuadre. Color grading moderado. Prohibido usar oscuridad extrema para ocultar mala geometría.

### 7.2 Assets mínimos de producción

| Grupo | Estimación inicial | Tratamiento |
|---|---:|---|
| Terreno y camino | 1–3 módulos | Geometría simple, materiales tileables |
| Árboles | 4–6 variantes | LOD, instancing y alternancia de escala |
| Vegetación baja | 5–8 variantes | Sprites/meshes planos con alfa recortado, sin transparencias caras |
| Rocas y troncos | 6–10 variantes | Instanciados, colisión solo en piezas relevantes |
| Cabaña | Exterior + 3 ambientes + sótano | GLB modulares, lightmaps y props importantes |
| Cobertizo y generador | 1 conjunto principal | Geometría interactiva separada |
| Portón | 1 conjunto animable | Hojas, panel, manivela y cerraduras separadas |
| Objetos interactivos | ~12–18 | Siluetas distintas y distancias de uso testeadas |
| Audio | ~15–25 clips + 3 capas ambiente | Mono para 3D, estéreo para paisaje sonoro |

Las cantidades son **presupuestos de diseño**, sujetos a un inventario real de assets.

### 7.3 Pipeline de modelado

1. Modelar prototipos de cajas en el código o en Blender; validar escala y recorrido.
2. Buscar modelos/escaneos adecuados en bancos con licencia válida. Registrar cada asset en `assets/ASSET_CREDITS.md`.
3. Preparar en Blender: pivotes correctos, escala métrica, UV, normales y geometría de colisión simplificada.
4. Exportar a **glTF 2.0 binario (`.glb`)**. No importar FBX/OBJ directamente en tiempo de ejecución.
5. Optimizar con **glTF Transform**: inspección, reducción de dimensiones, eliminación de nodos innecesarios, compresión meshopt cuando el loader lo soporte y texturas en WebP o KTX2/Basis cuando se configure su decoder.
6. Validar en WebGL2 y repetir en WebGPU si entra en el alcance de soporte; registrar tamaño transferido, VRAM estimada y tiempo de carga.
7. Conservar los `.blend`/originales fuera del paquete público. Publicar solo derivados optimizados y licencias exigibles.

> **Importante:** KTX2 y meshopt **no son gratis**: necesitan preparación y ruta de decodificación compatible. No prometer compresión sin verificar que el juego carga en ambos backends.

**Fuentes seguras para iniciar:** [Poly Haven](https://polyhaven.com/license) (modelos, HDRI, texturas CC0), [ambientCG](https://docs.ambientcg.com/license/) (materiales CC0). Otros modelos, sonidos y música requieren revisión individual de licencia. Los recursos encontrados en buscadores no se pueden reutilizar automáticamente.

### 7.4 Audio

- Ambiencia constante: viento, grillos, hojas y aire nocturno en capas con variación suave.
- Fuentes 3D: puerta, paso sobre grava/madera, generador, ramas, bisagras y susurros.
- Estado sonoro reactivo: antes/después del generador, dentro/fuera de la cabaña, final.
- Música mínima, preferiblemente drones de tensión en momentos específicos.
- El audio comienza **después** de que el usuario pulse `Comenzar` y habilite el contexto; respetar restricciones de autoplay.
- Mezcla con controles de volumen maestro / ambiente / efectos y subtítulos narrativos.

---

## 8. Investigación técnica y elección de motor

### 8.1 Evaluación

| Tecnología | Fortalezas | Riesgos para este juego | Decisión |
|---|---|---|---|
| **PlayCanvas Engine 2.x** | Nativo para web, PBR, WebGL2 + WebGPU, ECS, input, animación, audio, profiling, lightmaps | Menor familiaridad inicial que Three; aprender su modelo de entidades | **Elegido** |
| Three.js + React Three Fiber | Ecosistema enorme y familiaridad con React | Habría que ensamblar más sistemas de juego, colisión, escenas, lifecycle | Alternativa si se valora ecosistema React sobre motor |
| Babylon.js | Motor completo y buena física/gráficos, WebGL/WebGPU | Otra API amplia; sin ventaja decisiva para un mapa pequeño | Alternativa sólida |
| Godot Web | Editor y flujo tradicional de juegos | Peso/runtime web y restricciones de exportación a validar para este objetivo | No recomendado en MVP |
| Unity Web | Editor y pipeline de contenido potentes | Carga inicial y superficie técnica relativamente grandes para juego web liviano | No recomendado en MVP |

**Decisión arquitectónica:** **PlayCanvas Engine standalone + TypeScript + Vite**. Opcionalmente **React solo para menú, HUD y pantallas 2D** montadas encima del `<canvas>`; el loop 3D y las entidades permanecen en el engine, sin rerender React por frame.

PlayCanvas tiene tutorial FPS, física con ammo.js, optimización, recursos GLB y documentación para agentes de Codex; su API permite priorizar WebGPU y usar WebGL 2 como fallback. Aun así, **no hacer del WebGPU una dependencia de gameplay**. Validar WebGL2 como base. Comprobar WebGPU por separado si se incorpora al alcance de soporte. Ver fuentes [S1]–[S8].

**Alternativa de menor complejidad UI:** Vite + TypeScript + PlayCanvas + DOM/CSS convencional. Si incorporar React introduce acoplamiento o sobrepeso en fase 0, posponerlo; React no es obligatorio para el juego.

### 8.2 Tecnologías recomendadas

- **Base:** TypeScript estricto, Vite, PlayCanvas Engine, ESLint, Prettier.
- **UI:** React opcional y aislado de `GameRuntime`.
- **Física:** PlayCanvas/Ammo **solo si** el controlador necesita rigidbody/collision; comparar con un controlador cinemático simple y colisiones estáticas en fase 1. No crear una segunda física paralela.
- **Estado:** reducer/servicio tipado (`GameProgress`, eventos de dominio) desacoplado del motor. Evitar una dependencia de estado global innecesaria.
- **Pruebas:** Vitest para dominio; Playwright para flujos e interfaz real.
- **Assets:** Blender, GLB, glTF Transform, texturas comprimidas con decoders configurados.
- **Audio:** servicios del motor / Web Audio cuando corresponda.
- **Build/deploy:** salida estática `dist/`; hosting CDN estático en HTTPS; sin API ni base de datos.

**No integrar** Three.js/R3F y PlayCanvas para dibujar la misma escena: elegir un solo motor 3D. Tampoco implementar renderizador propio.

### 8.3 Compatibilidad inicial

**Objetivo de soporte:** versiones recientes de Chrome, Edge, Firefox y Safari de **escritorio** con WebGL2. Compatibilidad WebGPU progresiva y **fallback real** a WebGL2. Probar Windows y macOS; Linux como objetivo de prueba adicional. Móviles pueden mostrar una pantalla de “experiencia de escritorio recomendada” durante el MVP; no afirmar soporte táctil ni 60 FPS móviles.

**Al inicio:** detectar compatibilidad, ofrecer mensaje útil si WebGL2 falla, pantalla de carga, botón `Comenzar` (para audio/pointer lock) y opciones gráficas antes de iniciar.

### 8.4 Separación por capas

```text
DOM / UI (opcional React)
    ├─ MainMenu / HUD / Inventory / Inspect / Pause / Settings
    └─ suscripción a snapshots/eventos de aplicación
                  │
              GameRuntime
    ├─ GameState / Objectives / Inventory / PuzzleRules / SaveService
    ├─ InteractionSystem / EventDirector / AudioDirector
    └─ SceneCoordinator / AssetLoader / QualityManager
                  │
          PlayCanvas Adapter
    ├─ Camera / Player / Input / Raycast / Collision
    ├─ Level entities / Animation / Lights / Fog
    └─ GLB, textures, sound & renderer
```

El estado de una misión debe pertenecer a la capa de **dominio**, no esconderse en nombres mágicos de entidades o scripts de animación. Entidades usan IDs estables (`gate.panel`, `shed.generator`, `cabin.basement-door`) y tienen componentes pequeños.

### 8.5 Árbol de carpetas propuesto

```text
kilometro-17/
├── AGENTS.md
├── README.md
├── plan-km77-game.md
├── package.json
├── vite.config.ts
├── tsconfig.json
├── public/
│   └── assets/
│       ├── models/          # GLB optimizados para runtime
│       ├── textures/        # Texturas y lightmaps
│       ├── audio/           # Efectos y ambientación
│       └── ui/
├── assets/
│   ├── ASSET_CREDITS.md
│   └── manifest.json        # IDs, zonas, pesos, dependencias
├── src/
│   ├── main.ts
│   ├── game/
│   │   ├── bootstrap/       # Inicialización de dispositivo y motor
│   │   ├── runtime/         # Loop, servicios y lifecycle
│   │   ├── domain/          # Objetos, reglas, acertijos, eventos
│   │   ├── player/          # Cámara, input, colisión
│   │   ├── interaction/     # Raycast + acciones
│   │   ├── levels/          # Construcción/carga por sectores
│   │   ├── puzzles/         # Sistemas específicos de acertijos
│   │   ├── narrative/       # Director de eventos y pistas
│   │   ├── audio/
│   │   ├── rendering/       # Iluminación y perfiles gráficos
│   │   └── persistence/     # Save adapters y migraciones
│   ├── ui/                  # React o DOM: overlays y menús
│   ├── config/
│   └── shared/
├── scripts/
│   ├── assets/              # Validación/optimización
│   └── performance/         # Benchmarks repetibles
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── docs/
    ├── decisions/          # ADRs técnicos
    ├── design/             # Croquis, textos, lista de props
    ├── qa/                 # Bugs, matriz de pruebas
    └── perf/               # Datos por hardware/browser
```

La estructura no obliga a crear cientos de archivos vacíos: **crear carpetas cuando exista código que las use**.

---

## 9. Arquitectura funcional: contratos entre sistemas

### 9.1 Sistemas y responsabilidades

| Sistema | Responsabilidad | No debe conocer |
|---|---|---|
| `GameState` | Estado serializable, versión, transiciones | GPU, DOM, sonido |
| `ObjectiveSystem` | Objetivos derivados de evidencia y progreso | Posiciones de mallas |
| `InventorySystem` | Poseer, consumir e instalar objetos clave | Animaciones 3D |
| `InteractionSystem` | Raycast, selección, distancia, acción `E` | Reglas específicas del portón |
| `GatePuzzle` | Código, energía, seguro y apertura | UI de texto concreta |
| `GeneratorPuzzle` | Fusible, combustible, arranque | Renderer concreto |
| `EventDirector` | Unicidad y condiciones de eventos inquietantes | Guardado directo |
| `SceneCoordinator` | Cargar/descargar sectores, referencias de entidades | Reglas narrativas |
| `AudioDirector` | Canales, fuentes 3D, reproducción y subtítulos | Estado de inventario |
| `QualityManager` | Presets y ajuste de resolución | Guardado de historia |
| `SaveService` | Guardar/cargar, validar versión y migrar | Efectos de luz |

### 9.2 Comunicación y eventos

Preferir eventos de dominio tipados y observables, por ejemplo:

```ts
type GameEvent =
  | { type: 'ITEM_COLLECTED'; itemId: string }
  | { type: 'GENERATOR_FUSE_INSTALLED' }
  | { type: 'GENERATOR_FUEL_ADDED' }
  | { type: 'GENERATOR_STARTED' }
  | { type: 'GATE_CRANK_INSTALLED' }
  | { type: 'GATE_MANUAL_LOCK_RELEASED' }
  | { type: 'GATE_CODE_SUBMITTED'; code: string }
  | { type: 'GATE_OPENED' }
  | { type: 'PLAYER_ESCAPED' };
```

- La regla es **dominio primero, efectos después**: la transición determina qué animación/sonido disparar.
- No poner una función callback global distinta por cada objeto.
- Usar componentes reusables (`Inspectable`, `Pickup`, `Lockable`, `Door`, `Trigger`, `AudioEmitter`).
- Una máquina de estados simple basta para intro / gameplay / pausa / final. No introducir una librería compleja si no aporta valor.

### 9.3 Guardado

- **MVP:** `localStorage` con serialización pequeña y `saveVersion`, `timestamp`, `progress`, `playerTransform` seguro y `settings` separadas. **IndexedDB** si finalmente el tamaño o requisitos lo justifican.
- Autoguardar tras completar: llave, generador, manivela, código, apertura; también al pausar y cerrar voluntariamente cuando sea posible.
- No guardar durante animación intermedia: persistir **resultado lógico**, reconstruir estado visual al cargar.
- Migrar o descartar de forma controlada guardados incompatibles; nunca romper pantalla inicial por JSON corrupto.
- Guardado local puede perderse al borrar datos del navegador o cambiar de dispositivo: explicarlo en opciones.

### 9.4 Ciclo de vida del navegador

- `visibilitychange`: pausar entrada/simulación y silenciar o pausar audio según estado.
- Pérdida de `pointerlock`: abrir overlay de pausa sin trabar el juego.
- Resize y cambios de DPR: reconstruir tamaño del backbuffer de modo seguro.
- Pérdida de contexto gráfico (`webglcontextlost` cuando aplique): mensaje claro y opción de reiniciar/recuperar según soporte probado.
- No confiar en que `beforeunload` siempre ejecute un guardado.

---

## 10. Presupuesto de rendimiento (objetivos, no promesas)

### 10.1 Plataforma y perfiles de referencia

Definir el entorno de medición y medir **misma ruta, mismo perfil y mismo navegador**. Registrar segundos hasta el control desde caché fría y clic de inicio inmediato, con perfil de red explícito. Propuesta de aceptación:

| Perfil | Hardware orientativo | Resolución render | Objetivo |
|---|---|---|---|
| Alto | GPU dedicada equivalente o superior a GTX 1660 / RX 580, CPU 4+ núcleos moderno | 1920×1080 | 60 FPS estables en escenas representativas |
| Medio | GPU dedicada anterior o iGPU relativamente moderna | 1600×900 o 1080p con escala | 45–60 FPS según hardware |
| Bajo | Gráficos integrados aptos para WebGL2 | 1280×720 o escala equivalente | ≥30 FPS en escena principal |

**Son clases orientativas, no resultados medidos.** Documentar CPU, GPU, memoria, SO, versión de navegador, renderer, resolución y métricas; si la GTX 1660/RX 580 no alcanza 60 en la escena de peor caso, reducir coste o actualizar objetivo explícitamente. No exigir 60 FPS a todas las integradas.

### 10.2 Presupuesto técnico inicial

| Métrica | Meta provisional | Comentario |
|---|---|---|
| Carga jugable inicial (transferencia) | ≤20–30 MB | Intro + recursos indispensables; medir con throttling |
| Recursos totales transferidos | ≤100–150 MB | Carga diferida por zonas; ajustar tras inventario |
| Draw calls escena típica | Meta <300–500 en perfil alto | En móvil/bajo, mucho menos; medir por pases |
| Luces dinámicas con sombras | 0–2 simultáneas | Linterna es la más importante |
| Texturas principales | 512–2048 px según importancia | Evitar descargar mapas 4K para props menores |
| Fog | Simple/exp o variantes baratas | Volumétricas reales pospuestas |
| Memoria gráfica | Monitorizar y establecer máximo tras prototipo | No fijar VRAM rígida sin hardware real |
| Tiempo de cuadro | 16,7 ms para 60 FPS; 33,3 ms para 30 FPS | Registrar percentiles, no solo promedio |

**Estos números son presupuestos internos estimados**, no garantías basadas en benchmark del juego (todavía no existe). Documentar resultados y revisarlos en fase 2.

### 10.3 Técnicas obligatorias

1. **Culling por cámara y sectores:** no dibujar el sótano desde el exterior; activar ambientes según puerta/posición.
2. **Instancing con criterio:** árboles/rocas repetidos; dividir grupos por sector para no procesar instancias invisibles de todo el bosque.
3. **Batching selectivo:** geometría estática con materiales compartidos; evitar fusionar todo el mapa en un único batch que impida culling.
4. **Materiales compartidos:** atlas cuando convenga; limitar variantes de shaders.
5. **LOD de vegetación:** modelos próximos, simplificados a media distancia y siluetas/billboards al fondo si se ven aceptables.
6. **Lightmaps exteriores/interiores estáticos:** horneados para escenas fijas; luces dinámicas solo donde cambie el estado de juego.
7. **Fog de distancias moderadas:** esconder final de mapa y reducir distancia visual sin eliminar orientación.
8. **Texturas comprimidas y mipmaps:** validar web delivery, VRAM y decoders en cada backend.
9. **Postprocesado reducido:** color grading/vignette discreta; bloom/SSAO solo en `Alto` si pasa benchmark.
10. **Sin asignaciones por frame:** reutilizar vectores y estructuras; evitar actualización React por `requestAnimationFrame`.
11. **Colliders simplificados:** no usar malla de detalle renderizada como collider si no hace falta.
12. **Desactivar sistemas inactivos:** audio, scripts, partículas y sombras de sectores descargados.

### 10.4 Perfiles de calidad

| Opción | Bajo | Medio | Alto |
|---|---|---|---|
| Resolución interna | 0,65–0,75 × CSS / DPR capado | 0,8–1,0 | 1,0 con DPR máximo controlado |
| Distancia de vegetación | Corta | Media | Larga moderada |
| Sombras | Solo esenciales, baja res | Esenciales, media res | 1–2 dinámicas bien ajustadas |
| SSAO | Off | Off o bajo tras test | Solo si aporta y hay presupuesto |
| Bloom | Off | Muy leve | Muy leve y artístico |
| Niebla | Simple | Simple | Simple o variante medida |
| Partículas | Mínimas | Limitadas | Limitadas |

**Regla de escalado:** nunca cambiar reglas de acertijos según preset. Cambiar calidad gráfica, no contenido jugable.

### 10.5 Procedimiento de benchmark

Repetir 3 pasadas por perfil en: (a) entrada mirando al bosque, (b) camino con máxima vegetación visible, (c) interior cabaña mirando fuentes de luz, (d) generador encendido, (e) portón animándose.

Registrar FPS medio, percentil bajo 1% FPS o percentil 99 de frame time, draw calls, memoria estimada, carga transferida y errores. Usar herramientas **PlayCanvas MiniStats/AppStats, Chrome DevTools/Performance, Lighthouse para carga (no para FPS)**. Cualquier optimización debe ir acompañada de evidencia antes/después.

---

## 11. UX, menús y presentación

### Pantallas MVP

1. **Carga:** progreso real aproximado por assets, no spinner infinito; error reintentable.
2. **Inicio:** `Nuevo juego`, `Continuar` si hay save, `Opciones`, créditos.
3. **En juego:** retícula, prompt, objetivo breve discreto.
4. **Inventario:** llaves, fusible, combustible, manivela; si consumidos, marcar instalados o retirar.
5. **Inspección:** modelo/imagen/documento y texto accesible.
6. **Panel numérico:** 4 dígitos, borrar, confirmar, error y éxito.
7. **Pausa:** continuar, opciones, reiniciar al checkpoint, salir al menú.
8. **Final:** fundido, créditos breves y volver a menú.

**Estilo:** limpio, tipografía legible, UI monocroma con acentos ámbar/rojo desaturado. Localización preparada por claves (`i18n`), aunque MVP sea español. No usar texto incrustado en imágenes para pistas esenciales.

### Comportamientos de seguridad y accesibilidad

- Evitar flashes repetidos y ofrecer `reducedEffects`.
- Evitar motion blur agresivo, head bob obligatorio y FOV extremo.
- FOV ajustable (aprox. 70–90 grados horizontales como punto de partida; revisar cómo lo interpreta la cámara del motor).
- No forzar pantalla completa. No bloquear teclado/mouse fuera del canvas.
- Los cambios de volumen deben aplicar en tiempo real y persistir.

---

## 12. Plan de ejecución por fases, tareas y gates

**Horizonte provisional:** 10–12 semanas de trabajo parcial. Revisarlo con el inventario de assets, una importación GLB representativa y el resultado de G1. No es un compromiso de entrega. Mantener siempre la rama principal funcional.

### FASE 0 — Fundaciones y prueba del motor (semana 1)

**Meta:** escena mínima renderizando en navegador, con estructura y estándares.

- [x] Inicializar en la carpeta de trabajo el proyecto **PlayCanvas Engine + Vite + TS** utilizando el starter oficial, sin dependencias innecesarias.
- [x] Incorporar `plan-km77-game.md`, `README.md`, `.gitignore`, `AGENTS.md`, ESLint, formato, TS estricto.
- [x] Definir scripts `dev`, `build`, `typecheck`, `lint`, `test`, `test:e2e` (según herramientas finalmente instaladas).
- [x] Crear canvas con WebGL2 como ruta base y WebGPU como prueba optativa con fallback. Mostrar el backend efectivo.
- [x] Renderizar suelo, caja/cabaña temporal, luz nocturna y cámara FPS temporal.
- [x] Pantalla `Iniciar` que habilita audio y mouse mediante gesto del usuario.
- [x] Registrar ADR-001 (motor), ADR-002 (UI), ADR-003 (física), ADR-004 (targets de rendimiento).
- [x] Importar un GLB representativo de prueba. Medir carga fría, tiempo hasta el control y FPS de escena mínima en dos navegadores cuando estén disponibles. Registrar motor, backend y si la GPU es física o emulada.

**Gate G0:** build y checks pasan. En un navegador real con WebGL2 forzado se ve el GLB, se puede iniciar audio, mirar, caminar, liberar el mouse y reanudar sin errores de consola. Registrar el segundo navegador y el resultado de WebGPU por separado.

**Resultado:** G0 verificado en Chrome y Firefox en WebGL2. El ensayo optativo volvió a WebGL2 en ambos. Ver [informe de QA](docs/qa/fase-0.md) para las mediciones y pruebas manuales pendientes.

### FASE 1 — Graybox jugable de principio a fin (semanas 2–3)

**Meta:** juego completo **sin arte final**, usando formas primitivas. Ver [plano y guion de playtest](docs/design/fase-1-graybox.md).

- [x] Diseñar mapa topológico y métrico; definir spawn y límites.
- [x] Construir camino, cabaña, sótano, cobertizo, pozo y portón con cajas.
- [x] Implementar FPS definitivo, sensibilidad, colisión, caminar/correr.
- [x] Implementar interacción por raycast, prompt y objetos coleccionables.
- [x] Implementar puertas/llaves, estado de inventario, notas y progreso.
- [x] Implementar `GeneratorPuzzle` (fusible, combustible y activación).
- [x] Implementar `GatePuzzle` con panel y código `2471`.
- [x] Implementar manivela, cerrojo y apertura del portón.
- [x] Implementar zona de final + pantalla de cierre.
- [x] Crear pruebas unitarias de condiciones y orden alternativo de acertijos.
- [x] Registrar video de una partida en graybox sin usar consola para saltar estados.
- [x] Guardar con energía y código aceptado mientras el seguro sigue puesto. Recargar en un punto seguro, liberar el seguro y cruzar el portón.

**Gate G1 (vertical de mecánicas):** una persona puede comenzar en la entrada y terminar escapando sin trucos de desarrollador; ningún objeto clave se pierde. El orden alternativo sobrevive a la recarga y se registra la evidencia de aceptación antes de pasar a arte.

**G1 cerrado el 10/11/2026 por aprobación del titular tras probar el juego.** Recorrido y recarga verificados en navegador. Las 2–3 sesiones ciegas se mantienen como validación de orientación y ritmo para G2. Ver [informe de QA](docs/qa/fase-1.md).

### FASE 2 — Vertical slice visual (semanas 4–5)

**Meta:** una pequeña zona muestra el aspecto y sonido final, con mediciones.

- [x] Definir guía visual, escala, materiales y convención de assets. (Ver `docs/design/guia-visual.md`.)
- [ ] Probar el recorrido con 2–3 personas sin guion. Registrar orientación, pistas ignoradas, atascos, duración y tensión al volver al portón. Usar lo observado para ajustar la muestra. **Pendiente de validación humana (gate de playtest, no bloquea el cierre técnico de G2).**
- [x] Vestir un trayecto breve **portón → camino → interior de cabaña → regreso**. Incluir una pista que se pueda leer y validar el cambio de luz y sonido al cruzar el umbral. (Evidencia: `docs/qa/evidence/g2/`.)
- [x] Añadir 2–3 variantes de árbol de calidad definitiva, instancing por sector y fog. (`src/level-decoration.ts`, verificado en benchmark G2.)
- [x] Implementar linterna, composición nocturna y lightmaps representativas. (Lightmap horneado en porche; sombra de linterna en Alto.)
- [x] Audio de pasos en tierra/madera, viento, puerta y generador. (`src/ambience.ts`.)
- [ ] Probar texturas/GLB comprimidos en WebGL2 y, si está en alcance, WebGPU. (Pendiente: pipeline `glTF Transform` cuando se incorporen assets de mayor tamaño; GLB de prueba 4,8 KiB.)
- [x] Implementar presets Bajo/Medio/Alto y overlay MiniStats de desarrollo. (`src/game.ts`, `src/main.ts`.)
- [x] Ejecutar primera batería de benchmark y registrar métricas. (Ver `docs/qa/fase-2.md` § Benchmark G2: 60 FPS, p99 ~16,8 ms, 24–39 draw calls, iGPU Intel UHD 630.)
- [x] Validar capturas visuales con guía de arte y checklist de visibilidad. (`docs/qa/evidence/g2/*.png`.)

**G2 cerrado el 10/11/2026 (gate técnico).** Gate de playtest humano pendiente (2–3 sesiones ciegas + escucha del audio). No se avanzó a FASE 3. Ver `docs/qa/fase-2.md` § Estado del gate.

**Gate G2:** la escena elegida se parece razonablemente al objetivo artístico, los interactuables se ven y se miden Alto y Bajo en hardware de referencia. Si algún perfil queda fuera de presupuesto, registrar un plan correctivo cuantificado.

### FASE 3 — Arte y ambiente completo (semanas 6–7)

- [ ] Reemplazar toda la geometría gris por assets finales controlados.
- [ ] Completar cabaña: interior, cocina, oficina y sótano.
- [ ] Completar cobertizo, pozo, vegetación, camino y bordes del mapa.
- [ ] Organizar carga por zona e instancing/batching compatibles.
- [ ] Configurar iluminación horneada, linterna y estados del generador.
- [ ] Añadir documentos, texturas legibles, señales y sonidos 3D.
- [ ] Crear `ASSET_CREDITS.md` con licencia y origen de cada recurso.
- [ ] Revisar orientación y evitar sectores que parezcan iguales.

**Gate G3:** todos los caminos y acertijos son funcionales con arte definitivo, sin colisiones rotas ni notas ilegibles.

### FASE 4 — Narrativa, intro, UX y guardado (semanas 8–9)

- [ ] Implementar intro del automóvil como secuencia breve y robusta.
- [ ] Implementar menú principal, pausa, inventario, inspección, objetivos y final.
- [ ] Implementar eventos E01–E06 con condiciones e idempotencia.
- [ ] Añadir subtítulos y mezcla de audio con controles.
- [ ] Implementar persistencia local versionada y rehidratación visual.
- [ ] Añadir ajustes: sensibilidad, brillo, volumen, calidad y reducir efectos.
- [ ] Introducir tutorial contextual sin texto excesivo.
- [ ] Verificar pausa por pérdida de foco / bloqueo de puntero.

**Gate G4:** iniciar → restaurar energía y aceptar código → cerrar pestaña → continuar → liberar seguro → escapar funciona; no quedan estados imposibles.

### FASE 5 — QA, optimización y lanzamiento (semanas 10–12)

- [ ] Hacer 3 sesiones de prueba con personas sin acceso al documento de soluciones.
- [ ] Registrar lugares de atasco, tiempos, pistas ignoradas y bugs.
- [ ] Ejecutar tests unitarios, integraciones, Playwright y pruebas manuales de WebGL2.
- [ ] Medir todos los escenarios de benchmark y corregir cuellos de botella.
- [ ] Verificar transferencias, caché estática, compresión HTTP y CDN/hosting HTTPS.
- [ ] Probar 1080p Alto y 720p Bajo en los equipos de referencia.
- [ ] Probar guardado corrupto, refresco de página, pausa, cambio de calidad y audio bloqueado.
- [ ] Comprobar licencias y limpieza del bundle (sin assets fuente o credenciales).
- [ ] Publicar build beta en URL estática; verificar en incógnito sin caché.
- [ ] Ajustar menú final y documentar controles, navegador soportado y limitaciones.

**Gate G5 (release candidate):** partida completa sin errores críticos, sin softlocks y con perfil de rendimiento medido. Publicación como versión `v0.1.0` o `v1.0.0` según acabado.

### Priorización y reglas de reducción de alcance

Si un hito se retrasa: **primero eliminar** efectos volumétricos, SSAO, eventos adicionales, voces grabadas, cantidad de árboles variantes, animaciones secundarias o React si no es necesario. **Nunca eliminar** interacción fiable, accesibilidad básica, guardado coherente, objetivo claro ni salida funcional.

---

## 13. Backlog priorizado (IDs listos para tickets)

| ID | Prioridad | Historia | Dependencias | Criterio de aceptación |
|---|---|---|---|---|
| K17-001 | P0 | Como jugador puedo iniciar el juego en navegador | — | Canvas + botón + sin errores |
| K17-002 | P0 | Puedo caminar, mirar y colisionar | 001 | Movimiento sin atravesar muros |
| K17-003 | P0 | Puedo interactuar con E y ver indicación | 002 | Raycast estable, distancia y foco correctos |
| K17-004 | P0 | Puedo abrir puertas con llaves | 003 | Bloquea sin llave; abre con llave |
| K17-005 | P0 | Puedo recoger objetos y ver inventario | 003 | Sin duplicados ni ítems perdidos |
| K17-006 | P0 | Puedo reparar y activar el generador | 004–005 | Requiere fusible y combustible |
| K17-007 | P0 | Puedo consultar pistas y deducir `2471` | 003 | Cuatro placas legibles e inspeccionables |
| K17-008 | P0 | Puedo obtener la manivela en el sótano | 004–005 | Llave + acceso + retorno seguro |
| K17-009 | P0 | Puedo abrir el portón al cumplir 3 condiciones | 006–008 | Tabla de estados y apertura correctas |
| K17-010 | P0 | Puedo escapar y ver un final | 009 | Zona de salida y end screen |
| K17-011 | P0 | Puedo pausar y recuperar el mouse | 001–002 | Esc/blur consistentes |
| K17-012 | P0 | Puedo guardar y continuar | 004–010 | Rehidrata puzzle y posición segura |
| K17-013 | P1 | Veo bosque/cabaña/portón de calidad visual | 002 | Materiales y zonas legibles |
| K17-014 | P1 | Escucho audio espacial y eventos E01–E06 | 013 | Una vez por evento, sin bloqueos |
| K17-015 | P1 | Puedo seleccionar calidad gráfica | 001 | Preset cambia coste medido |
| K17-016 | P1 | Juego con instrucciones mínimas y opciones | 011 | Menú/diario/subtítulos/brillo |
| K17-017 | P1 | Carga progresiva de assets por sectores | 013 | Sin pantallas negras ni tirones grandes |
| K17-018 | P1 | Benchmark reproducible | 015–017 | Reporte con configuración y métricas |
| K17-019 | P1 | Intro del automóvil | 002,013 | 30–45 s, se puede omitir tras verla |
| K17-020 | P2 | Pequeños detalles cosméticos adicionales | G3 | No alteran FPS objetivo ni puzzles |

**Definición de terminado por ticket:** implementación revisable, pruebas donde corresponde, no regresión observable, changelog en el PR y evidencia de navegador si modifica gameplay o gráficos.

---

## 14. Estrategia de Codex y agentes especializados

### 14.1 Responsabilidades sugeridas

| Agente | Rol | Tipo de tarea |
|---|---|---|
| **Mr. Architect** | Arquitectura y límites del motor | ADR, lifecycle, contratos, estados, decisiones de dependencia |
| **Mr. Frontend** (especializado en videojuegos) | Gameplay/render + UI | Controlador FPS, interacciones, scenes, HUD, menús |
| **Mr. Backend** | Solo soporte técnico si surge necesidad | Persistencia, migración de formato, serialización; **no crear backend en MVP** |
| **Agente QA / revisor** | Calidad independiente | Tests, Playwright, evidencias, bugs, benchmark |
| **Agente de arte técnico** (si se crea) | Pipeline y optimización de recursos | Blender/export, GLB, materiales, lightmaps, culling |

No asignar cinco agentes simultáneamente al mismo archivo. Delegar contratos pequeños y revisar integraciones entre worktrees/branches.

### 14.2 Reglas para `AGENTS.md`

Codex deberá crear un `AGENTS.md` que incluya **como mínimo**:

```md
# AGENTS.md — Kilómetro 17

- Leer plan-km77-game.md antes de implementar una fase.
- Trabajar solo el ticket solicitado. No introducir funcionalidades futuras.
- TypeScript estricto. Sin `any` salvo justificación documentada.
- Motor 3D único: PlayCanvas Engine. No sumar Three.js.
- Backend fuera de alcance para MVP; guardar en navegador.
- Gameplay y estado independientes del renderer/UI.
- Mantener fallback WebGL2; no depender de WebGPU.
- No crear por código assets «finales» de baja calidad si se pidieron assets curados.
- No usar imágenes ni audios externos sin licencia registrada.
- No incluir secretos, claves o APIs pagas en el cliente.
- Para cerrar una tarea: typecheck, lint, tests, build, navegar, capturar evidencia.
- Registrar resultados de performance si cambia escena, render o carga.
- No declarar terminado si solo compila o muestra primitives sin gameplay pedido.
- Si un requisito requiere un asset faltante: usar placeholder explícito y reportarlo.
```

Añadir comandos reales cuando exista `package.json`; no inventar scripts.

### 14.3 Prompt inicial para Codex (copiar y pegar)

> Leé íntegramente `plan-km77-game.md`. Tu objetivo actual es **solo FASE 0 / G0**. Usá PlayCanvas Engine standalone, Vite y TypeScript estricto, basándote en documentación actual del proyecto y APIs instaladas, no en recuerdos de versiones anteriores. Priorizá un proyecto ejecutable y mantenible: canvas, WebGL2 como base y WebGPU optativo con fallback, suelo/cámara controlable, botón iniciar que maneje el audio y pointer lock, estructura mínima, scripts de verificación y README. Creá `AGENTS.md` con las reglas del documento y ADR-001 a ADR-004. No implementes cabaña completa ni puzzles aún. Ejecutá build, typecheck/lint/tests disponibles y **abrí el juego en un navegador real**. Entregame archivos modificados, decisiones, evidencia de pruebas, limitaciones y pasos de ejecución. Si algo no pudiste comprobar, indicá exactamente qué.

### 14.4 Plantilla de tarea de cada fase

```text
CONTEXTO: Kilómetro 17, plan-km77-game.md v1.1, fase [N], gate [GN].
OBJETIVO: [un resultado observable].
ALCANCE: [tickets exactos].
NO HACER: [features fuera de alcance].
ACEPTACIÓN: [pasos que un humano puede ejecutar y resultados esperados].
PRUEBAS: unitarias, build, consola, interacción real y FPS si aplica.
ENTREGA: diff, evidencia, riesgos, cambios al plan si se justifican.
```

### 14.5 Uso de herramientas para agentes

La documentación oficial de PlayCanvas recomienda skills para proyectos de Engine/React y verificación con navegador. Comenzar con el starter oficial `npm create playcanvas@latest` y, si faltan las skills, evaluar `npx skills add playcanvas/skills` (revisar contenido antes de instalar). Las skills solo orientan a los agentes: **no sustituyen pruebas reales**. Para test interactivo, Playwright; para perfiles de CPU/GPU, DevTools y herramientas de PlayCanvas. Fuente [S6].

---

## 15. QA: matriz mínima de pruebas

### 15.1 Pruebas unitarias

- [ ] Código incorrecto / correcto, con y sin energía.
- [ ] El portón no abre con una o dos condiciones satisfechas.
- [ ] El portón abre solo con las tres.
- [ ] Fusible y combustible en cualquier orden.
- [ ] Acciones repetidas no duplican inventario ni eventos.
- [ ] Llave ausente/presente en puerta bloqueada.
- [ ] Transiciones de objetivos al encontrar pistas.
- [ ] Guardado/carga preserva flags y no acepta estructura corrupta.
- [ ] Los eventos de tensión se disparan una sola vez.

### 15.2 Pruebas E2E y manuales

- [ ] Iniciar desde pestaña nueva sin save.
- [ ] Completar partida íntegra sin comandos de desarrollador.
- [ ] Deducir el código antes de reparar el generador e introducirlo después de energizar el panel.
- [ ] Reparar generador antes de descubrir el código.
- [ ] Entrar/salir del sótano después de recargar la página.
- [ ] Esc durante juego, al leer nota y al introducir código.
- [ ] Perder foco cambiando de pestaña y recuperarlo.
- [ ] Guardar justo después de recoger cada objeto relevante.
- [ ] Continuar después de abrir portón: no revivir cerraduras resueltas.
- [ ] Simular save inválido y verificar recuperación usable.
- [ ] Probar sin audio desbloqueado; UI no queda bloqueada.
- [ ] Cambiar calidad a mitad de partida.
- [ ] Ejecutar WebGL2 forzado aunque WebGPU esté disponible.
- [ ] Probar Chrome, Edge, Firefox y Safari recientes donde existan equipos.
- [ ] Revisar consola/network sin excepciones, 404 ni descargas inesperadas.

**Atención:** screenshots de Playwright pueden variar por GPU/OS. Comparaciones visuales solo en entorno controlado; tests lógicos no deben depender de píxeles exactos.

### 15.3 Playtest sin guion

Entregar solo controles básicos; pedir al jugador que verbalice qué cree que necesita para escapar. Registrar: tiempo a entender el portón, tiempo para entrar a la cabaña, si reconoció el mapa, dónde quedó atascado, objetos que no vio, si el ambiente genera tensión y si terminó. Objetivo de las primeras 2–3 sesiones: identificar atascos recurrentes y comprobar si la vuelta al portón genera tensión. Repetir en beta. Registrar cuántas personas terminan con y sin ayuda; usar una muestra mayor antes de interpretar porcentajes.

---

## 16. Riesgos y mitigación

| Riesgo | Probabilidad | Impacto | Acción preventiva |
|---|---|---|---|
| Intentar gráficos AAA en navegador | Alta | Alto | Semi-realismo, vertical slice, presupuestos medidos |
| Sobreproducción de assets y nivel | Alta | Alto | Un mapa compacto, lista cerrada de props y escala ajustada tras el playtest de G2 |
| IA genera código incompatible con engine actual | Media | Alto | Documentación oficial + APIs instaladas + verificación en browser |
| Interacciones que se bloquean tras save | Media | Alto | Dominio puro, estados idempotentes, tests de rehidratación |
| GPU baja rinde mal por transparencias/sombras | Alta | Medio/alto | Calidad escalable, sombras limitadas, culling, lightmaps |
| Pointer lock/autoplay falla en browsers | Media | Medio | Botón de inicio y pausa, tests multi-browser |
| Pistas ilegibles por oscuridad | Alta | Alto para experiencia | Inspección 2D, linterna y pruebas de usuario |
| Assets sin licencia clara | Media | Alto legal | CC0/atribución verificada; manifest de licencias |
| Pedir a un agente «hacer todo» | Alta | Alto | Tickets independientes, gates y PR pequeños |
| Guardados se pierden al borrar datos | Inevitable según usuario | Medio | Explicar almacenamiento local y evitar promesa de sincronización |

---

## 17. Qué NO construir en la primera versión

- Mundo abierto, clima dinámico completo, lluvia volumétrica o simulación física de barro.
- NPC completo, monstruo perseguidor, navegación con pathfinding, combate, armas o muerte/reaparecer.
- Conducción interactiva de vehículos.
- Multiplayer, cuentas, backend, compras, analíticas externas o guardados cloud.
- Generación procedimental de niveles y acertijos aleatorios.
- Múltiples finales, doblaje completo o cinemáticas largas.
- Versión móvil/táctil comprometida para el lanzamiento.
- Ray tracing, GI dinámica de alta carga o dependencia exclusiva de WebGPU.

**Iteraciones futuras posibles (solo después de validar MVP):** segundo recorrido con pistas variables; modo foto; más áreas de bosque; nuevas salas en cabaña; voces profesionales; mando/gamepad; multilenguaje; enemigos ambientales no letales; versión instalable PWA; guardado en nube opt-in; soporte móvil separado; campaña con más capítulos.

---

## 18. Checklist de lanzamiento del MVP

### Juego

- [ ] Puede empezar de cero sin tutorial externo.
- [ ] El portón presenta tres bloqueos que se pueden descubrir.
- [ ] Los tres acertijos son solucionables y persistentes.
- [ ] La cabaña, el cobertizo, el sótano y el pozo tienen propósito.
- [ ] Hay una apertura del portón y pantalla final.
- [ ] Se puede continuar una partida desde el mismo navegador.

### Calidad

- [ ] Sin errores críticos y sin softlocks conocidos.
- [ ] Interacciones visualmente reconocibles y texto legible.
- [ ] Menú, pausa, volumen, brillo, calidad y sensibilidad funcionan.
- [ ] FPS/frametimes medidos con metodologías documentadas.
- [ ] WebGL2 probado y fallback funcional.
- [ ] Recursos optimizados, créditos/licencias documentados.

### Entrega

- [ ] Build estático reproducible.
- [ ] HTTPS y cache policies correctas.
- [ ] README con instalación, comandos, controles y compatibilidad.
- [ ] QA report con bugs conocidos y casos probados.
- [ ] Publicación beta antes de etiquetar release final.

**Definición de éxito del proyecto:** una persona puede entrar a una URL, ver una noche de bosque con buen aspecto y audio convincente, investigar sin frustrarse, resolver lo necesario y abandonar el lugar en una sesión completa; el navegador mantiene rendimiento aceptable en equipos objetivo comprobados.

---

## 19. Fuentes de investigación y referencias oficiales

Las decisiones fueron contrastadas con documentación pública **consultada el 10/11/2026**. URLs para que Codex compruebe APIs antes de implementar; las versiones y compatibilidades cambian con el tiempo.

- **[S1] PlayCanvas — Engine (capacidad, arquitectura web y fallback):** https://developer.playcanvas.com/user-manual/engine/
- **[S2] PlayCanvas — Browsers soportados:** https://developer.playcanvas.com/user-manual/engine/supported-browsers/
- **[S3] PlayCanvas — Optimización general:** https://developer.playcanvas.com/user-manual/optimization/guidelines/
- **[S4] PlayCanvas — Profiling y mediciones:** https://developer.playcanvas.com/user-manual/optimization/
- **[S5] PlayCanvas — Lightmapping:** https://developer.playcanvas.com/user-manual/graphics/lighting/lightmapping/
- **[S6] PlayCanvas — Desarrollo con agentes de IA / Codex:** https://developer.playcanvas.com/user-manual/engine/developing-with-ai/
- **[S7] PlayCanvas — Motor standalone en código:** https://developer.playcanvas.com/user-manual/engine/standalone/
- **[S8] PlayCanvas — FPS movement y física:** https://developer.playcanvas.com/tutorials/first-person-movement/ · https://developer.playcanvas.com/user-manual/physics/
- **[S9] PlayCanvas — Formatos de assets:** https://developer.playcanvas.com/user-manual/assets/supported-formats/
- **[S10] Khronos — meshopt/glTF (compresión):** https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_meshopt_compression/README.md
- **[S11] glTF Transform — herramientas para assets:** https://github.com/donmccurdy/glTF-Transform
- **[S12] MDN — buenas prácticas WebGL:** https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices
- **[S13] MDN — Pointer Lock:** https://developer.mozilla.org/en-US/docs/Web/API/Pointer_Lock_API
- **[S14] MDN — autoplay/audio:** https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay
- **[S15] Playwright — comparación visual:** https://playwright.dev/docs/test-snapshots
- **[S16] Poly Haven — CC0:** https://polyhaven.com/license
- **[S17] ambientCG — CC0:** https://docs.ambientcg.com/license/
- **[S18] Babylon.js — capacidades (alternativa contrastada):** https://www.babylonjs.com/specifications/
- **[S19] Three.js — WebGPU/WebGL2 (alternativa contrastada):** https://threejs.org/manual/pages/webgpurenderer

### 19.1 Decisiones que requieren validación empírica

- Si PlayCanvas + física elegida alcanza sensación de movimiento deseada.
- Si WebGPU ofrece ventaja medible en este juego concreto frente a WebGL2.
- Si la carga inicial de 20–30 MB es suficiente para la intro y la zona inmediata.
- Si 60 FPS en 1080p Alto resulta posible en el hardware de referencia con el aspecto visual elegido.
- Si el código y las pistas se comprenden con jugadores reales.

No dar estas suposiciones por verificadas sin benchmarks ni playtesting.

---

## 20. Primer paso accionable

**Preparar la muestra visual y sonora de G2 en el trayecto portón → camino → interior de la cabaña → regreso.**

Usar el [guion de playtest](docs/design/fase-1-graybox.md) para contrastar orientación, legibilidad y tensión con personas que desconozcan la solución.
