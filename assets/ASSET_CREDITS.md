# Créditos de assets — Kilómetro 17: El Portón

Registro de origen y licencia de cada recurso usado por el juego.
Fuente de verdad para FASE 3 y para la limpieza del bundle previa al lanzamiento.

## Convención de registro

Cada entrada debe incluir, como mínimo:

- **ID**: identificador estable (`K17-<TIPO>-<NNN>`).
- **Archivo**: ruta relativa al repositorio.
- **Formato**: contenedor, tamaño.
- **Origen**: quién lo creó o de dónde se obtuvo.
- **Licencia**: texto de la licencia o "propio del proyecto".
- **Fecha de incorporación**: fecha y fase.
- **Uso**: dónde se usa.
- **Estado**: `verificado`, `pendiente de verificar`, `retirado`.
- **Notas**: observaciones relevantes (compresión, decoder, etc.).

Cuando un asset se reemplaza, la entrada anterior se marca `retirado` con fecha y se agrega la nueva. No borrar historial.

Fuentes seguras para iniciar (sección 7.3 del plan): Poly Haven (CC0), ambientCG (CC0). Otros modelos, sonidos y música requieren revisión individual de licencia. Los recursos encontrados en buscadores no se reutilizan automáticamente.

## Entradas

### K17-GLB-001 — Cabaña de prueba (G0)

- **Archivo**: `public/assets/cabana-g0.glb`
- **Formato**: glTF 2.0 binario, 4.860 bytes.
- **Origen**: generado por el equipo del proyecto como placeholder geométrico (`generator: "Kilómetro 17 G0"`). 24 nodos, 6 meshes, 6 materiales.
- **Licencia**: propio del proyecto; pendiente de verificar si se sustituye por un asset externo.
- **Fecha de incorporación**: 10/11/2026 (G0).
- **Uso**: referencia de carga GLB y visualización de cabaña en G0, G1 y G2; permanece como referencia en la muestra visual.
- **Estado**: verificado (firma binaria glTF, carga en Chrome 157 y Firefox 159 con WebGL2).
- **Notas**: no es asset final. Pipeline de compresión (meshopt / KTX2) pendiente de validar.

### K17-MAT-001 — Grava fina

- **Archivo**: generado en cliente (`src/level-decoration.ts`, función `tile`).
- **Formato**: textura procedimental 64 × 64 px, RGBA8, mipmaps.
- **Origen**: propio del proyecto.
- **Licencia**: propio del proyecto.
- **Fecha de incorporación**: 10/11/2026 (G2).
- **Uso**: suelo y camino.
- **Estado**: verificado.

### K17-MAT-002 — Tablones y veta

- **Archivo**: generado en cliente (`src/level-decoration.ts`).
- **Formato**: textura procedimental 64 × 64 px, RGBA8, mipmaps.
- **Origen**: propio del proyecto.
- **Licencia**: propio del proyecto.
- **Fecha de incorporación**: 10/11/2026 (G2).
- **Uso**: madera, porche, interior.
- **Estado**: verificado.

### K17-MAT-003 — Óxido sobre acero

- **Archivo**: generado en cliente (`src/level-decoration.ts`).
- **Formato**: textura procedimental 64 × 64 px, RGBA8, mipmaps.
- **Origen**: propio del proyecto.
- **Licencia**: propio del proyecto.
- **Fecha de incorporación**: 10/11/2026 (G2).
- **Uso**: portón y metal.
- **Estado**: verificado.

### K17-MAT-005 — Corteza de pino (procedural)

- **Archivo**: generado en cliente (`src/level-decoration.ts`, función `tile` / `normalTile`).
- **Formato**: textura procedimental 128 × 128 px RGBA8 (difusa + normal derivada), mipmaps.
- **Origen**: propio del proyecto (mejora visual FASE 3a, árboles semi-realistas).
- **Licencia**: propio del proyecto.
- **Fecha de incorporación**: 10/11/2026 (FASE 3a, árboles).
- **Uso**: Leña, soporte del pozo y bosque procedural de respaldo.
- **Estado**: verificado (typecheck, lint, build, unit, e2e G1+G2).
- **Notas**: Los GLB originales K17-GLB-002 y K17-GLB-003 son la ruta normal del bosque.

### K17-MAT-004 — Luz horneada del porche

- **Archivo**: generado en cliente (`src/level-decoration.ts`).
- **Formato**: textura procedimental 64 × 64 px, RGBA8, mipmaps.
- **Origen**: propio del proyecto.
- **Licencia**: propio del proyecto.
- **Fecha de incorporación**: 10/11/2026 (G2).
- **Uso**: lightmap del porche (canal UV 0).
- **Estado**: verificado.

### K17-GLB-002 y K17-GLB-003 — Pino alto y pino abierto

- **Archivos**: `public/assets/trees/pino-alto.glb` y `public/assets/trees/pino-abierto.glb`.
- **Formato**: glTF 2.0 binario, 339.996 bytes y 9.368 triángulos por variante, con dos materiales y color por vértice.
- **Origen y licencia**: geometría y materiales propios del proyecto, generados por Mr. Design con `scripts/generate-pines.py`.
- **Fecha de incorporación**: 10/11/2026 (FASE 3).
- **Uso**: árboles del camino y bosque perimetral, instanciados por sector.
- **Estado**: verificado mediante inspección del GLB. Sin texturas externas ni decodificador.

### K17-GLB-010 y K17-GLB-011 — Llaves antiguas

- **Archivos**: `public/assets/keys/cobertizo.glb` y `public/assets/keys/sotano.glb`.
- **Formato**: GLB 2.0, 47.724 y 47.720 bytes.
- **Origen y licencia**: originales del proyecto, generados por Mr. Design con `scripts/generate-keys.py`.
- **Fecha de incorporación**: 10/11/2026 (FASE 3).
- **Uso**: llaves recogibles en la cocina y la oficina de la cabaña.
- **Estado**: geometría y dimensiones verificadas con el inspector de GLB.

## Pendientes

- Registrar cada GLB, imagen, audio o fuente externa que se incorpore en FASE 3 con su licencia individual.
- Validar compresión (meshopt, KTX2/Basis) y registrar decoders necesarios antes de adoptarlos.
- Confirmar origen y licencia final del asset que reemplace `cabana-g0.glb` cuando exista.

## Assets pendientes (FASE 3)

Tabla de recursos futuros referenciados en `manifest.json`. Fuentes sugeridas según sección 7.3 del plan: Poly Haven (CC0) y ambientCG (CC0). Otros requieren revisión individual.

| ID          | Descripción                                  | Fuente sugerida                 | Licencia esperada   | Estado    |
| ----------- | -------------------------------------------- | ------------------------------- | ------------------- | --------- |
| K17-GLB-004 | Árbol variante 3 (bosque perimetral)         | Poly Haven / propio             | CC0 o propio        | pendiente |
| K17-GLB-005 | Interior de cabaña (cocina, oficina, sótano) | Poly Haven / propio             | CC0 o propio        | pendiente |
| K17-GLB-006 | Cobertizo                                    | Poly Haven / propio             | CC0 o propio        | pendiente |
| K17-GLB-007 | Pozo                                         | Poly Haven / propio             | CC0 o propio        | pendiente |
| K17-GLB-008 | Camino de tierra                             | Poly Haven / ambientCG / propio | CC0 o propio        | pendiente |
| K17-GLB-009 | Portón de hierro                             | Poly Haven / propio             | CC0 o propio        | pendiente |
| K17-TEX-001 | Documentos y notas legibles (set)            | propio (escaneo/diseño)         | propio del proyecto | pendiente |
| K17-AUD-001 | Sonidos 3D y ambientación                    | revisión individual             | por definir         | pendiente |

## Compresión y decoders (pendiente)

- Pipeline de compresión con **glTF Transform** (inspección, reducción de dimensiones, eliminación de nodos innecesarios) pendiente de validar cuando se incorporen assets de mayor tamaño.
- Compresión **meshopt** y texturas **KTX2/Basis** solo se adoptarán tras verificar carga en WebGL2 (y WebGPU si está en alcance) y registrar los decoders necesarios.
- El GLB de prueba actual (`cabana-g0.glb`, 4.860 bytes) no requiere compresión; el pipeline se valida al incorporar el primer asset definitivo.
