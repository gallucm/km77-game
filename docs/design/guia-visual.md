# Guía visual — Kilómetro 17: El Portón

Documento de referencia para la muestra visual de G2 y para el arte definitivo de FASE 3.
Complementa `docs/design/fase-2-muestra.md` y el apartado 7 del plan maestro.

## 1. Dirección de arte

- Estilo semi-realista / realista estilizado. Una cabaña bien resuelta y un bosque oscuro creíble rinden más que un gran número de sistemas gráficos.
- No hiperrealismo. Priorizar legibilidad de acertijos, orientación y atmósfera.
- La geometría gris del graybox se sustituye por assets GLB controlados, sin cambiar reglas ni colisiones jugables.
- La información de acertijos no depende del preset gráfico ni del estado de la linterna.

## 2. Paleta

### Exterior (noche fría)

| Rol                          | Color aproximado | Origen en código                         |
| ---------------------------- | ---------------- | ---------------------------------------- |
| Cielo / fog                  | `#0e1a22`        | `sky = Color(0.055, 0.103, 0.132)`       |
| Ambiente                     | `#3d4d64`        | `ambientLight = Color(0.24, 0.30, 0.39)` |
| Suelo (tierra fría)          | `#3b4a45`        | material `Tierra fría`                   |
| Camino (grava)               | `#64594f`        | material `Camino`                        |
| Acero / portón               | `#758085`        | material `Acero`                         |
| Corteza                      | `#332921`        | material `Tronco`                        |
| Acículas (pino)              | `#2e4840`        | material `Pino`                          |
| Abeto                        | `#243838`        | material `Abeto`                         |
| Chapa del techo              | `#33424d`        | material `Chapa azul`                    |
| Luz de luna                  | `#8cbaff`        | luz direccional, intensidad 0.73         |
| Luz del portón (sin energía) | `#94c7f2`        | omni, intensidad 0.23                    |

### Interior (tungsteno ámbar)

| Rol                | Color aproximado | Origen en código                |
| ------------------ | ---------------- | ------------------------------- |
| Tablas envejecidas | `#8f6b52`        | material `Tablas envejecidas`   |
| Marcos de roble    | `#785440`        | material `Marcos de roble`      |
| Baliza / difusor   | `#f58c40`        | material `Baliza`, emisiva      |
| Luz del porche     | `#ff8c3b`        | omni, intensidad 1.9            |
| Luz interior       | `#ffa859`        | omni, intensidad 1.6            |
| Luz del cobertizo  | `#e6d18f`        | omni, intensidad 1.4            |
| Papel / notas      | `#d9b06b`        | material `Papel`, emisiva 0.13  |
| Cifras del panel   | `#e0d1ab`        | material `Cifras`, emisiva 0.24 |

### Portón (óxido y acero)

- Base de acero `#758085` con textura procedural de óxido (`Óxido sobre acero`, 64 × 64).
- Parches de óxido desaturan el azul del acero hacia marrón rojizo; el indicador cambia de rojo (`Sin alimentación`) a verde (`Energía restaurada`) al restaurar la energía.
- Panel apagado antes de reparar; indicador visible al energizar.

### Vegetación y piedra

- `Piedra` `#59615c`, `Sin alimentación` `#40302c`, `Energía restaurada` `#40ca70`.

## 3. Niebla e iluminación

- `FOG_LINEAR`, color igual al cielo, `start = 10 m`, `end = 37 m`.
- Niebla por capas perceptuales (fondo difuso), no volumétrica real.
- Ambiente muy bajo pero navegable; una luz principal por zona.
- Lightmaps en estructuras estáticas (porche). Pocas luces dinámicas (linterna es la más importante).
- Linterna: spot child de la cámara, sombras solo en perfil Alto.
- Color grading moderado. Prohibido usar oscuridad extrema para ocultar mala geometría.

### Presets (no cambian reglas de juego)

| Parámetro           | Bajo                        | Medio                        | Alto                             |
| ------------------- | --------------------------- | ---------------------------- | -------------------------------- |
| Escala interna      | 0,62 × CSS (cap DPR)        | 0,82 × CSS                   | 1,0 × CSS, DPR máx. 1,5          |
| Sombras             | Esenciales, baja resolución | Esenciales, media resolución | 1–2 dinámicas bien ajustadas     |
| SSAO                | Off                         | Off o bajo tras test         | Solo si aporta y hay presupuesto |
| Bloom               | Off                         | Muy leve                     | Muy leve y artístico             |
| Niebla              | Simple                      | Simple                       | Simple o variante medida         |
| Partículas          | Mínimas                     | Limitadas                    | Limitadas                        |
| Linterna con sombra | No                          | No                           | Sí                               |

## 4. Materiales procedurales (G2)

Generados en cliente, 64 × 64 px, mipmaps, filtro lineal con mipmaps lineales, anisotropía `min(4, maxAnisotropy)`.

| Textura                 | Nombre                    | Uso                        | Tiling                           |
| ----------------------- | ------------------------- | -------------------------- | -------------------------------- |
| Grava fina              | `Grava fina`              | Suelo y camino             | 16 × 16 (suelo), 4 × 10 (camino) |
| Tablones y veta         | `Tablones y veta`         | Madera / porche / interior | 1 × 2                            |
| Óxido sobre acero       | `Óxido sobre acero`       | Portón y metal             | 1 × 1                            |
| Luz horneada del porche | `Luz horneada del porche` | Lightmap del porche        | UV canal 0                       |

La luz horneada del porche es una muestra fija (`pool` cálido) y no se recalcula al encender la linterna.

## 5. Instancing por sector

- Copas de pino: un `MeshInstance` instanciado por cuadrante (`half` × `band`) y especie (2), con `VertexBuffer` de matrices. `customAabb` por sector para culling.
- Dos siluetas de pino (`Pino`, `Abeto`) con 3 y 2 capas respectivamente.
- Troncos: primitivas individuales en G2; candidatos a instancing en FASE 3.
- Suelo dividido en 4 bloques para culling por sector.
- Regla: dividir grupos por sector para no procesar instancias invisibles de todo el bosque.

## 6. Escala métrica (referencias)

Escala 1 unidad = 1 metro. Cámara a altura de ojos.

| Referencia                       | Medida                      |
| -------------------------------- | --------------------------- |
| Altura de ojos (cámara)          | 1,68 m                      |
| Radio del jugador                | 0,24 m                      |
| Rango de interacción             | 2,5 m                       |
| Camino al portón (ancho × largo) | 3,9 × 18,4 m                |
| Hueco de salida entre pilares    | 4,7 m                       |
| Hoja del portón                  | 4,7 × 2,46 × 0,22 m         |
| Pilares del portón               | 0,6 × 3,1 × 0,6 m           |
| Dintel del portón                | 6,15 × 0,26 × 0,63 m        |
| Cabaña (ancho × profundo × alto) | 8,5 × 9,4 × 3,05 m          |
| Porche (ancho × profundo)        | 4,48 × 1,54 m               |
| Tarima interior                  | 7,8 × 8,8 m                 |
| Cobertizo                        | 6,5 × 5,5 × 2,85 m          |
| Pozo (diámetro × alto)           | 2,25 × 0,9 m                |
| Troncos (diámetro × alto)        | 0,32 × 1,7–1,8 m            |
| Copas (altura máxima)            | hasta 8,5 m                 |
| Niebla (inicio / fin)            | 10 / 37 m                   |
| Área jugable (X / Z)             | ±15,8 m / −25,8 a 12,6 m    |
| Sótano (ancho × profundo)        | 5,2 × 5,1 m, descenso 2,6 m |

## 7. Convención de assets

- Formato de runtime único: **glTF 2.0 binario (`.glb`)**. No importar FBX/OBJ en tiempo de ejecución.
- Escala métrica en metros; 1 unidad = 1 m.
- Pivotes: origen en la base para props de suelo; centrado para piezas simétricas; eje Y hacia arriba.
- UV: lightmap en canal 0 para el porche (`lightMapUv = 0`); texturas tileables con tiling documentado; evitar solapamientos en lightmaps.
- Colisiones simplificadas: cajas y cilindros; no usar la malla de render como collider.
- Nombres: descriptivos en español, IDs estables para interactuables (`gate.panel`, `cabin-plate`, `log`).
- Optimización: glTF Transform; meshopt y KTX2/Basis solo con decoder verificado en WebGL2/WebGPU.
- Texturas: 64 px para tiles de detalle, 512–2048 px para hero props.
- Registrar cada asset en `assets/ASSET_CREDITS.md` (ID, origen, licencia, fecha, uso, estado).

## 8. Checklist de visibilidad (G2)

- [x] Portón: hueco de salida, hoja, panel e indicador distinguibles con linterna apagada (captura `porton-bajo.png`).
- [x] Porche ámbar reconocible antes de llegar y como baliza en perfil Bajo (captura `porche.png`).
- [x] Registro de guardia legible sin linterna; nota en UI con contraste 12,71:1 (capturas `registro-sin-linterna.png`, `lectura-registro.png`).
- [x] Contraste del panel de inspección ≥ 4,5:1 (medido 12,71:1, `#251f16` sobre `#eee2c8`).
- [x] Exterior frío vs. interior cálido perceptible (capturas `camino-cabana.png`, `porche.png`).
- [x] Niebla no oculta referencias de orientación (camino, cabaña).
- [x] Instancing por sector sin pop-in visible en la muestra.
- [x] Presets Bajo/Alto mantienen la información de acertijos (test G2).
- [x] Sin errores de consola en el recorrido G2.

Validado por `tests/fase-1.spec.ts` (caso `G2 · compara calidad y permite leer la pista con o sin linterna`, líneas 242–315) en Chrome 157 con GPU física (Intel UHD 630) el 10/11/2026.
