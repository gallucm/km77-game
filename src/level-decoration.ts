import {
    BoundingBox,
    ConeGeometry,
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

function tile(app: AppBase, name: string, paint: Paint): Texture {
    const size = 64;
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

export function paintMaterials(
    app: AppBase,
    surfaces: { ground: StandardMaterial; path: StandardMaterial; wood: StandardMaterial; metal: StandardMaterial }
): Texture {
    const dirt = tile(app, 'Grava fina', (x, y, grain) => {
        const fleck = grain > 0.92 ? 33 : -11 + grain * 24;
        const value = 204 + fleck + 11 * Math.sin((x + y) * (Math.PI / 8));
        return [value, value, value];
    });
    const boards = tile(app, 'Tablones y veta', (x, y, grain) => {
        const seam = y % 16 === 0 ? 102 : 0;
        const value = 215 - seam - 13 * Math.sin(y * 0.79 + Math.sin(x * 0.2) * 0.35) + 18 * grain;
        return [value, value - 5, value - 10];
    });
    const oxidation = tile(app, 'Óxido sobre acero', (x, y, grain) => {
        const patch = Math.max(0, Math.sin(x * (Math.PI / 8)) * Math.cos(y * (Math.PI / 16)) + (grain - 0.5) * 0.6);
        return [211 + patch * 24, 216 - patch * 75, 217 - patch * 107];
    });

    surfaces.ground.diffuseMap = dirt;
    surfaces.ground.diffuseMapTiling.set(16, 16);
    surfaces.path.diffuseMap = dirt;
    surfaces.path.diffuseMapTiling.set(4, 10);
    surfaces.wood.diffuseMap = boards;
    surfaces.wood.diffuseMapTiling.set(1, 2);
    surfaces.metal.diffuseMap = oxidation;
    for (const surface of Object.values(surfaces)) surface.update();

    // Muestra horneada fija para el piso del porche. No se recalcula al encender la linterna.
    return tile(app, 'Luz horneada del porche', (x, y) => {
        const distance = Math.hypot((x - 31.5) / 30, (y - 31.5) / 28);
        const pool = Math.max(0, 1 - distance) ** 1.4;
        return [5 + 97 * pool, 5 + 53 * pool, 5 + 24 * pool];
    });
}

export function addPineCanopies(app: AppBase, trees: Tree[], surfaces: StandardMaterial[]): void {
    const device = app.graphicsDevice;
    const mesh = Mesh.fromGeometry(device, new ConeGeometry({ capSegments: 8, heightSegments: 1 }));
    const format = VertexFormat.getDefaultInstancingFormat(device);
    const matrix = new Mat4();
    const position = new Vec3();
    const scale = new Vec3();
    const rotation = new Quat();

    for (const half of [-1, 1]) {
        for (const band of [-1, 1]) {
            for (const [species, surface] of surfaces.entries()) {
                const groupTrees = trees.filter(
                    ([x, z], index) => (x < 0 ? -1 : 1) === half && (z < -9 ? -1 : 1) === band && index % 2 === species
                );
                if (!groupTrees.length) continue;

                // Vecinos estrechos de tres capas y ejemplares más abiertos de dos capas.
                const tiers =
                    species === 0
                        ? [
                              [0.49, 0.54, 2.75],
                              [0.68, 0.48, 2.2],
                              [0.83, 0.38, 1.38]
                          ]
                        : [
                              [0.48, 0.59, 3.8],
                              [0.72, 0.59, 2.6]
                          ];
                const count = groupTrees.length * tiers.length;
                const transforms = new Float32Array(count * 16);
                let offset = 0;
                let minX = Infinity;
                let maxX = -Infinity;
                let minZ = Infinity;
                let maxZ = -Infinity;
                let maxY = 0;

                for (const [x, z, height] of groupTrees) {
                    minX = Math.min(minX, x - 2.4);
                    maxX = Math.max(maxX, x + 2.4);
                    minZ = Math.min(minZ, z - 2.4);
                    maxZ = Math.max(maxZ, z + 2.4);
                    maxY = Math.max(maxY, height * 1.05);
                    for (const [rise, depth, width] of tiers) {
                        position.set(x + (species === 0 ? 0 : rise * 0.38), height * rise, z);
                        scale.set(width * (0.85 + height * 0.022), height * depth, width * 0.86);
                        rotation.setFromEulerAngles(0, (x + z + rise * 3) * 19, 0);
                        matrix.setTRS(position, rotation, scale);
                        transforms.set(matrix.data, offset);
                        offset += 16;
                    }
                }

                const buffer = new VertexBuffer(device, format, count, { data: transforms });
                const sector = new Entity(`Copas ${half} ${band} variedad ${species + 1}`);
                const instance = new MeshInstance(mesh, surface, sector);
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
