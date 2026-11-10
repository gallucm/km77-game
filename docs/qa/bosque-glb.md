# Bosque GLB · Verificación

Los dos pinos originales se cargan en paralelo y se instancian por variante y sector. Las 39 posiciones y alturas del bosque se conservan. Los 14 troncos transitables conservan sus cajas de colisión. Si falla la carga de un GLB, se usa el bosque procedural.

La inspección de los modelos confirmó pivote al suelo, altura normalizada a una unidad y dos materiales con color por vértice. Cada GLB contiene 9.368 triángulos. Juntos pesan 679.992 bytes.

## Comparación

Chrome con WebGL2, ANGLE Vulkan sobre Intel UHD 630 física, perfil Alto y 1280 × 720. Cámara en la aparición apuntando por el camino hacia la cabaña. Se tomaron tres muestras de 60 intervalos por versión. Para el control se bloquearon los GLB por red, activando el bosque anterior. Ambos modelos devolvieron HTTP 200 en la prueba GLB.

| Bosque     | FPS medio | p99 de cuadro | Draw calls de la escena | Transferencia de los modelos |
| ---------- | --------: | ------------: | ----------------------: | ---------------------------: |
| Procedural |        60 |       16,8 ms |                     128 |                          0 B |
| GLB        |        60 |       16,8 ms |                     107 |                    680.592 B |

La prueba se limita a esa vista. También se inspeccionaron capturas con la linterna apuntando al primer pino junto al camino. Las ramas, raíces y copas tienen volumen desde esa posición. El follaje conserva una silueta estilizada de cerca.
