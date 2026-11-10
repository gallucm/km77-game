import {
    BoundingBox,
    ConeGeometry,
    CylinderGeometry,
    Entity,
    FILTER_LINEAR,
    FILTER_LINEAR_MIPMAP_LINEAR,
    Geometry,
    Mat4,
    Mesh,
    MeshInstance,
    PIXELFORMAT_SRGBA8,
    Quat,
    Texture,
    Vec3,
    VertexBuffer,
    VertexFormat
} from 'playcanvas';
import type { AppBase, StandardMaterial } from 'playcanvas';

type Tree = [x: number, z: number, height: number];
type Paint = (x: number, y: number, grain: number) => [number, number, number];

function tile(app: AppBase, name: string, paint: Paint, size = 64): Texture {
    const pixels = new Uint8Array(size * size * 4);
    let seed = 48141;
    for (let y = 0; y < size; y += 1) {
        for (let x = 0; x < size; x += 1) {
            seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
            const [r, g, b] = paint(x, y, seed / 4294967296);
            const index = (y * size + x) * 4;
            pixels[index] = r;
            pixels[index + 1] = g;
            pixels[index + 2] = b;
            pixels[index + 3] = 255;
        }
    }

    const texture = new Texture(app.graphicsDevice, {
        name,
        width: size,
        height: size,
        format: PIXELFORMAT_SRGBA8,
        mipmaps: true,
        minFilter: FILTER_LINEAR_MIPMAP_LINEAR,
        magFilter: FILTER_LINEAR,
        anisotropy: Math.min(4, app.graphicsDevice.maxAnisotropy),
        levels: [pixels]
    });
    app.once('destroy', () => texture.destroy());
    return texture;
}

function normalTile(
    app: AppBase,
    name: string,
    height: (x: number, y: number) => number,
    size = 64,
    strength = 4
): Texture {
    const pixels = new Uint8Array(size * size * 4);
    let seed = 91237;
    for (let y = 0; y < size; y += 1) {
        for (let x = 0; x < size; x += 1) {
            seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
            const hL = height((x - 1 + size) % size, y);
            const hR = height((x + 1) % size, y);
            const hD = height(x, (y - 1 + size) % size);
            const hU = height(x, (y + 1) % size);
            const dx = (hR - hL) * strength;
            const dy = (hU - hD) * strength;
            let nx = -dx;
            let ny = -dy;
            let nz = 1;
            const length = Math.hypot(nx, ny, nz);
            nx /= length;
            ny /= length;
            nz /= length;
            const index = (y * size + x) * 4;
            pixels[index] = Math.round((nx * 0.5 + 0.5) * 255);
            pixels[index + 1] = Math.round((ny * 0.5 + 0.5) * 255);
            pixels[index + 2] = Math.round((nz * 0.5 + 0.5) * 255);
            pixels[index + 3] = 255;
        }
    }

    const texture = new Texture(app.graphicsDevice, {
        name,
        width: size,
        height: size,
        format: PIXELFORMAT_SRGBA8,
        mipmaps: true,
        minFilter: FILTER_LINEAR_MIPMAP_LINEAR,
        magFilter: FILTER_LINEAR,
        anisotropy: Math.min(4, app.graphicsDevice.maxAnisotropy),
        levels: [pixels]
    });
    app.once('destroy', () => texture.destroy());
    return texture;
}

export function paintMaterials(
    app: AppBase,
    surfaces: {
        ground: StandardMaterial;
        path: StandardMaterial;
        wood: StandardMaterial;
        metal: StandardMaterial;
        stone?: StandardMaterial;
        plaster?: StandardMaterial;
        ceiling?: StandardMaterial;
        bark?: StandardMaterial;
    }
): Texture {
    const dirt = tile(
        app,
        'Grava fina',
        (x, y, grain) => {
            const fleck = grain > 0.9 ? 42 : -8 + grain * 20;
            const wave = 12 * Math.sin(x * 0.37 + y * 0.29);
            const value = 196 + fleck + wave;
            return [value - 2, value - 4, value - 8];
        },
        128
    );
    const boards = tile(
        app,
        'Tablones y veta',
        (x, y, grain) => {
            const seam = y % 20 === 0 ? 92 : 0;
            const grainLine = 16 * Math.sin(y * 0.82 + Math.sin(x * 0.22) * 0.4);
            const noise = (grain - 0.5) * 24;
            const value = 206 - seam - grainLine + noise;
            return [value, value - 6, value - 14];
        },
        128
    );
    const oxidation = tile(
        app,
        'Óxido sobre acero',
        (x, y, grain) => {
            const patch = Math.max(0, Math.sin(x * (Math.PI / 8)) * Math.cos(y * (Math.PI / 16)) + (grain - 0.5) * 0.6);
            return [211 + patch * 24, 216 - patch * 75, 217 - patch * 107];
        },
        128
    );
    const stoneTex = tile(
        app,
        'Piedra',
        (x, y, grain) => {
            const blotch = Math.sin(x * 0.17) * Math.cos(y * 0.21);
            const noise = (grain - 0.5) * 28;
            const value = 152 + blotch * 20 + noise;
            return [value - 2, value, value + 2];
        },
        128
    );
    const plasterTex = tile(
        app,
        'Yeso desgastado',
        (x, y, grain) => {
            const stain = Math.max(0, Math.sin(x * 0.31) * Math.cos(y * 0.27));
            const noise = (grain - 0.5) * 20;
            const value = 208 + noise - stain * 34;
            return [value, value - 2, value - 6];
        },
        64
    );
    const ceilingTex = tile(
        app,
        'Madera oscura techo',
        (_x, y, grain) => {
            const seam = y % 18 === 0 ? 84 : 0;
            const value = 96 - seam + (grain - 0.5) * 18;
            return [value, value - 3, value - 7];
        },
        64
    );

    const woodNormal = normalTile(app, 'Normal madera', (x, y) => Math.sin(y * 0.79 + Math.sin(x * 0.2) * 0.35), 64, 3);
    const stoneNormal = normalTile(app, 'Normal piedra', (x, y) => Math.sin(x * 0.17) * Math.cos(y * 0.21), 64, 4);
    const barkTex = tile(
        app,
        'Corteza de pino',
        (x, y, grain) => {
            const groove = Math.sin(y * 0.45 + Math.sin(x * 0.18) * 0.6);
            const blotch = Math.sin(x * 0.23) * Math.cos(y * 0.19);
            const noise = (grain - 0.5) * 18;
            const base = 78 + groove * 16 + blotch * 10 + noise;
            return [base + 6, base - 2, base - 10];
        },
        128
    );
    const barkNormal = normalTile(
        app,
        'Normal corteza',
        (x, y) => Math.sin(y * 0.45 + Math.sin(x * 0.18) * 0.6) + Math.sin(x * 0.23) * 0.4,
        64,
        5
    );

    surfaces.ground.diffuseMap = dirt;
    surfaces.ground.diffuseMapTiling.set(16, 16);
    surfaces.path.diffuseMap = dirt;
    surfaces.path.diffuseMapTiling.set(4, 10);
    surfaces.wood.diffuseMap = boards;
    surfaces.wood.diffuseMapTiling.set(1, 2);
    surfaces.wood.normalMap = woodNormal;
    surfaces.wood.bumpiness = 0.8;
    surfaces.wood.normalMapTiling.set(1, 2);
    surfaces.metal.diffuseMap = oxidation;
    surfaces.metal.diffuseMapTiling.set(1, 1);
    if (surfaces.stone) {
        surfaces.stone.diffuseMap = stoneTex;
        surfaces.stone.diffuseMapTiling.set(2, 2);
        surfaces.stone.normalMap = stoneNormal;
        surfaces.stone.bumpiness = 0.9;
        surfaces.stone.normalMapTiling.set(2, 2);
    }
    if (surfaces.plaster) {
        surfaces.plaster.diffuseMap = plasterTex;
        surfaces.plaster.diffuseMapTiling.set(2, 3);
    }
    if (surfaces.bark) {
        surfaces.bark.diffuseMap = barkTex;
        surfaces.bark.diffuseMapTiling.set(1, 4);
        surfaces.bark.normalMap = barkNormal;
        surfaces.bark.bumpiness = 1.1;
        surfaces.bark.normalMapTiling.set(1, 4);
    }
    if (surfaces.ceiling) {
        surfaces.ceiling.diffuseMap = ceilingTex;
        surfaces.ceiling.diffuseMapTiling.set(1, 2);
    }
    for (const surface of Object.values(surfaces)) {
        if (surface) surface.update();
    }

    // Muestra horneada fija para el piso del porche. No se recalcula al encender la linterna.
    return tile(app, 'Luz horneada del porche', (x, y) => {
        const distance = Math.hypot((x - 31.5) / 30, (y - 31.5) / 28);
        const pool = Math.max(0, 1 - distance) ** 1.4;
        return [5 + 97 * pool, 5 + 53 * pool, 5 + 24 * pool];
    });
}

export function bakeInteriorLightmap(app: AppBase): Texture {
    return tile(
        app,
        'Luz horneada interior',
        (x, y) => {
            const pool1 = Math.max(0, 1 - Math.hypot((x - 32) / 24, (y - 32) / 20)) ** 1.6;
            const pool2 = Math.max(0, 1 - Math.hypot((x - 16) / 12, (y - 40) / 12)) ** 1.4;
            const value = 8 + 70 * pool1 + 45 * pool2;
            return [value + 20, value + 8, value];
        },
        64
    );
}

export function bakeBasementLightmap(app: AppBase): Texture {
    return tile(
        app,
        'Luz horneada sótano',
        (x, y) => {
            const pool = Math.max(0, 1 - Math.hypot((x - 32) / 26, (y - 32) / 24)) ** 1.5;
            const value = 6 + 60 * pool;
            return [value + 10, value + 12, value + 25];
        },
        64
    );
}

export function addPineCanopies(
    app: AppBase,
    trees: Tree[],
    surfaces: StandardMaterial[],
    barkSurface?: StandardMaterial
): void {
    const device = app.graphicsDevice;
    const coneMesh = Mesh.fromGeometry(device, new ConeGeometry({ capSegments: 10, heightSegments: 1 }));
    const format = VertexFormat.getDefaultInstancingFormat(device);
    const matrix = new Mat4();
    const position = new Vec3();
    const scale = new Vec3();
    const rotation = new Quat();

    // Cuatro siluetas distintas: estrecha/alta, media, ancha/baja, copa redondeada.
    const silhouettes = [
        {
            tiers: [
                [0.46, 0.5, 2.6],
                [0.62, 0.46, 2.05],
                [0.76, 0.36, 1.35],
                [0.88, 0.26, 0.85]
            ],
            scale: 0.9,
            lean: 1.2
        },
        {
            tiers: [
                [0.4, 0.6, 3.4],
                [0.58, 0.52, 2.75],
                [0.74, 0.4, 1.95],
                [0.86, 0.28, 1.2]
            ],
            scale: 1.0,
            lean: 0.9
        },
        {
            tiers: [
                [0.34, 0.7, 4.2],
                [0.52, 0.58, 3.2],
                [0.68, 0.44, 2.3],
                [0.8, 0.32, 1.45],
                [0.9, 0.22, 0.85]
            ],
            scale: 1.06,
            lean: 1.4
        },
        {
            tiers: [
                [0.44, 0.56, 2.9],
                [0.6, 0.5, 2.35],
                [0.76, 0.38, 1.6],
                [0.88, 0.26, 0.95]
            ],
            scale: 0.96,
            lean: 1.0
        }
    ];

    for (const half of [-1, 1]) {
        for (const band of [-1, 1]) {
            for (const species of [0, 1, 2, 3]) {
                const surface = surfaces[species % surfaces.length];
                const groupTrees = trees.filter(
                    ([x, z], index) => (x < 0 ? -1 : 1) === half && (z < -9 ? -1 : 1) === band && index % 4 === species
                );
                if (!groupTrees.length) continue;

                const silhouette = silhouettes[species];
                const tiers = silhouette.tiers;
                const count = groupTrees.length * tiers.length;
                const transforms = new Float32Array(count * 16);
                let offset = 0;
                let minX = Infinity;
                let maxX = -Infinity;
                let minZ = Infinity;
                let maxZ = -Infinity;
                let maxY = 0;

                for (const [x, z, height] of groupTrees) {
                    minX = Math.min(minX, x - 2.6);
                    maxX = Math.max(maxX, x + 2.6);
                    minZ = Math.min(minZ, z - 2.6);
                    maxZ = Math.max(maxZ, z + 2.6);
                    maxY = Math.max(maxY, height * 1.08);
                    for (const [rise, depth, width] of tiers) {
                        // Pequeña variación horizontal para romper simetría.
                        const jitterX = Math.sin(x * 13.7 + z * 7.3 + rise * 5.1) * 0.18;
                        const jitterZ = Math.cos(x * 9.1 + z * 11.3 + rise * 3.7) * 0.18;
                        position.set(x + jitterX, height * rise, z + jitterZ);
                        const wScale = width * (0.82 + height * 0.018) * silhouette.scale;
                        scale.set(wScale, height * depth, wScale * 0.9);
                        rotation.setFromEulerAngles(
                            Math.sin(x + rise) * 2 * silhouette.lean,
                            (x + z + rise * 3) * 19,
                            Math.cos(z + rise) * 2 * silhouette.lean
                        );
                        matrix.setTRS(position, rotation, scale);
                        transforms.set(matrix.data, offset);
                        offset += 16;
                    }
                }

                const buffer = new VertexBuffer(device, format, count, { data: transforms });
                const sector = new Entity(`Copas ${half} ${band} variedad ${species + 1}`);
                const instance = new MeshInstance(coneMesh, surface, sector);
                instance.setInstancing(buffer, true);
                sector.addComponent('render', { meshInstances: [instance], castShadows: false });
                sector.render!.customAabb = new BoundingBox(
                    new Vec3((minX + maxX) / 2, maxY / 2, (minZ + maxZ) / 2),
                    new Vec3((maxX - minX) / 2, maxY / 2, (maxZ - minZ) / 2)
                );
                app.root.addChild(sector);
                app.once('destroy', () => buffer.destroy());
            }
        }
    }

    // Ramas y raíces instanciadas por sector (semi-realismo, mantiene instancing).
    const branchMesh = Mesh.fromGeometry(
        device,
        new CylinderGeometry({ radius: 0.5, height: 1, capSegments: 6, heightSegments: 1 })
    );
    const rootMesh = Mesh.fromGeometry(
        device,
        new CylinderGeometry({ radius: 0.5, height: 1, capSegments: 6, heightSegments: 1 })
    );
    const barkMat = barkSurface ?? surfaces[surfaces.length - 1];

    for (const half of [-1, 1]) {
        for (const band of [-1, 1]) {
            const sectorTrees = trees.filter(([x, z]) => (x < 0 ? -1 : 1) === half && (z < -9 ? -1 : 1) === band);
            if (!sectorTrees.length) continue;

            // Ramas: 5 por árbol, a distintas alturas y ángulos.
            const branchCount = sectorTrees.length * 5;
            const branchTransforms = new Float32Array(branchCount * 16);
            let bo = 0;
            let minX = Infinity,
                maxX = -Infinity,
                minZ = Infinity,
                maxZ = -Infinity,
                maxY = 0;
            for (const [x, z, height] of sectorTrees) {
                minX = Math.min(minX, x - 2.6);
                maxX = Math.max(maxX, x + 2.6);
                minZ = Math.min(minZ, z - 2.6);
                maxZ = Math.max(maxZ, z + 2.6);
                maxY = Math.max(maxY, height * 1.08);
                for (let b = 0; b < 5; b++) {
                    const t = 0.45 + b * 0.12;
                    const angle = (b * 73 + x * 11 + z * 17) % 360;
                    const rad = (angle * Math.PI) / 180;
                    const outward = 0.35 + (b % 3) * 0.12;
                    const bx = x + Math.cos(rad) * outward;
                    const bz = z + Math.sin(rad) * outward;
                    const by = height * t;
                    position.set(bx, by, bz);
                    scale.set(0.07, height * 0.42, 0.07);
                    rotation.setFromEulerAngles(60 + (b % 3) * 8, angle, 0);
                    matrix.setTRS(position, rotation, scale);
                    branchTransforms.set(matrix.data, bo);
                    bo += 16;
                }
            }
            const branchBuffer = new VertexBuffer(device, format, branchCount, { data: branchTransforms });
            const branchSector = new Entity(`Ramas ${half} ${band}`);
            const branchInstance = new MeshInstance(branchMesh, barkMat, branchSector);
            branchInstance.setInstancing(branchBuffer, true);
            branchSector.addComponent('render', { meshInstances: [branchInstance], castShadows: false });
            branchSector.render!.customAabb = new BoundingBox(
                new Vec3((minX + maxX) / 2, maxY / 2, (minZ + maxZ) / 2),
                new Vec3((maxX - minX) / 2, maxY / 2, (maxZ - minZ) / 2)
            );
            app.root.addChild(branchSector);
            app.once('destroy', () => branchBuffer.destroy());

            // Raíces: 3 por árbol, en la base.
            const rootCount = sectorTrees.length * 3;
            const rootTransforms = new Float32Array(rootCount * 16);
            let ro = 0;
            for (const [x, z] of sectorTrees) {
                for (let r = 0; r < 3; r++) {
                    const angle = r * 120 + (x + z) * 7;
                    const rad = (angle * Math.PI) / 180;
                    const rx = x + Math.cos(rad) * 0.22;
                    const rz = z + Math.sin(rad) * 0.22;
                    position.set(rx, 0.06, rz);
                    scale.set(0.08, 0.18, 0.08);
                    rotation.setFromEulerAngles(70, angle, 0);
                    matrix.setTRS(position, rotation, scale);
                    rootTransforms.set(matrix.data, ro);
                    ro += 16;
                }
            }
            const rootBuffer = new VertexBuffer(device, format, rootCount, { data: rootTransforms });
            const rootSector = new Entity(`Raíces ${half} ${band}`);
            const rootInstance = new MeshInstance(rootMesh, barkMat, rootSector);
            rootInstance.setInstancing(rootBuffer, true);
            rootSector.addComponent('render', { meshInstances: [rootInstance], castShadows: false });
            rootSector.render!.customAabb = new BoundingBox(
                new Vec3((minX + maxX) / 2, 0.1, (minZ + maxZ) / 2),
                new Vec3((maxX - minX) / 2, 0.1, (maxZ - minZ) / 2)
            );
            app.root.addChild(rootSector);
            app.once('destroy', () => rootBuffer.destroy());
        }
    }
}

export function gable(app: AppBase, entity: Entity, surface: StandardMaterial): void {
    const geometry = new Geometry();
    geometry.positions = [-4.15, 0, 0, 4.15, 0, 0, 0, 1.18, 0, -4.15, 0, 0, 0, 1.18, 0, 4.15, 0, 0];
    geometry.normals = [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1];
    geometry.uvs = [0, 0, 1, 0, 0.5, 1, 0, 0, 0.5, 1, 1, 0];
    const mesh = Mesh.fromGeometry(app.graphicsDevice, geometry);
    entity.addComponent('render', { meshInstances: [new MeshInstance(mesh, surface, entity)] });
    app.root.addChild(entity);
}
