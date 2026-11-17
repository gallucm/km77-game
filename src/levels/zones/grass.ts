import { BoundingBox, Entity, Mat4, MeshInstance, Quat, Vec3, VertexBuffer, VertexFormat } from 'playcanvas';
import type { ContainerResource, Material, Mesh, RenderComponent } from 'playcanvas';

import type { LevelContext } from '../types';

export interface GroundStrip {
    name: string;
    x: number;
    z: number;
    width: number;
    depth: number;
}

const varieties = ['pasto_rastrero', 'pasto_mixto', 'pasto_espigado'] as const;
type Variety = (typeof varieties)[number];

interface GrassBatch {
    source: GrassSource;
    bounds: BoundingBox;
    matrices: number[];
}

interface GrassSource {
    name: string;
    mesh: Mesh;
    material: Material;
    transform: Mat4;
}

export function buildGrass(ctx: LevelContext, resource: ContainerResource, roads: GroundStrip[]): void {
    const template = resource.instantiateRenderEntity();
    const sources = new Map<string, GrassSource>();
    for (const render of template.findComponents('render') as RenderComponent[]) {
        const source = render.meshInstances[0];
        if (source?.mesh && source.material) {
            const { name } = render.entity;
            sources.set(name, { name, mesh: source.mesh, material: source.material, transform: source.node.getWorldTransform().clone() });
        }
    }
    const fallback = sources.values().next().value;
    if (!fallback) {
        template.destroy();
        return;
    }

    const device = ctx.app.graphicsDevice;
    const format = VertexFormat.getDefaultInstancingFormat(device);
    const pose = new Mat4();
    const transform = new Mat4();
    const position = new Vec3();
    const rotation = new Quat();
    const scale = new Vec3();
    const transformedBounds = new BoundingBox();
    let seed = 617;
    const random = () => {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        return seed / 4294967296;
    };
    const batches = new Map<string, GrassBatch>();
    const spacing = 0.81;

    for (let z = -26; z + spacing <= 13; z += spacing) {
        for (let x = -16; x + spacing <= 16; x += spacing) {
            const px = x + spacing * (0.05 + random() * 0.90);
            const pz = z + spacing * (0.05 + random() * 0.90);
            if (!isGroundClear(px, pz)) continue;
            const distance = distanceToRoad(px, pz, roads);
            if (distance < 0.06) continue;

            const broad = patchNoise(px * 0.21 + 13, pz * 0.21 + 13);
            const local = patchNoise(px * 0.58 + 41, pz * 0.58 + 41);
            const growth = 0.67 * broad + 0.33 * local;
            const verge = Math.min(1, distance / 0.92);
            const density = (0.20 + 0.78 * growth) * (0.64 + 0.36 * verge);
            if (random() > density) continue;

            const roll = random();
            const variety: Variety = distance < 0.62 || roll < 0.23
                ? 'pasto_rastrero'
                : roll > 0.84 && growth > 0.48
                  ? 'pasto_espigado'
                  : 'pasto_mixto';
            const source = sources.get(variety) ?? fallback;
            const width = (0.74 + random() * 0.55) * (0.64 + 0.36 * verge);
            const height = (0.65 + random() * 0.52 + growth * 0.19) * (0.60 + 0.40 * verge);
            pose.setTRS(
                position.set(px, -0.014, pz),
                rotation.setFromEulerAngles(0, random() * 360, 0),
                scale.set(width, height, width)
            );
            transform.mul2(pose, source.transform);
            transformedBounds.setFromTransformedAabb(source.mesh.aabb, transform);
            const column = Math.floor((px + 16) / 8);
            const row = Math.floor((pz + 26) / 8);
            const key = `${column}/${row} · ${source.name}`;
            let batch = batches.get(key);
            if (batch) {
                batch.bounds.add(transformedBounds);
            } else {
                batch = { source: source.instance, bounds: transformedBounds.clone(), matrices: [] };
                batches.set(key, batch);
            }
            batch.matrices.push(...transform.data);
        }
    }

    for (const [key, { source, matrices, bounds }] of batches) {
        const entity = new Entity(`Pasto · ${key}`);
        const buffer = new VertexBuffer(device, format, matrices.length / 16, { data: new Float32Array(matrices) });
        const instance = new MeshInstance(source.mesh, source.material, entity);
        instance.setInstancing(buffer, true);
        entity.addComponent('render', { meshInstances: [instance], castShadows: false });
        entity.render!.customAabb = bounds;
        ctx.root.addChild(entity);
        ctx.app.once('destroy', () => buffer.destroy());
    }
    template.destroy();
}

function patchNoise(x: number, z: number): number {
    const ix = Math.floor(x);
    const iz = Math.floor(z);
    const fx = x - ix;
    const fz = z - iz;
    const sx = fx * fx * (3 - 2 * fx);
    const sz = fz * fz * (3 - 2 * fz);
    const hash = (a: number, b: number) => {
        const h = Math.imul(a, 374761393) + Math.imul(b, 668265263);
        const n = Math.imul(h ^ (h >>> 13), 1274126177);
        return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
    };
    const a = hash(ix, iz) * (1 - sx) + hash(ix + 1, iz) * sx;
    const b = hash(ix, iz + 1) * (1 - sx) + hash(ix + 1, iz + 1) * sx;
    return a * (1 - sz) + b * sz;
}

function distanceToRoad(x: number, z: number, roads: GroundStrip[]): number {
    let distance = Infinity;
    for (const road of roads) {
        const dx = Math.abs(x - road.x) - road.width / 2;
        const dz = Math.abs(z - road.z) - road.depth / 2;
        distance = Math.min(distance, Math.hypot(Math.max(0, dx), Math.max(0, dz)) + Math.min(0, Math.max(dx, dz)));
    }
    return distance;
}

function isGroundClear(x: number, z: number): boolean {
    const cabin = Math.abs(x) < 4.55 && z > -15.5 && z < -4.3;
    const basement = Math.abs(x) < 3.02 && z >= -25.75 && z <= -14.9;
    const shed = x > 5.55 && x < 12.45 && z > -10.45 && z < -4.6;
    const well = Math.hypot(x + 8, z + 12) < 1.75;
    const gateAccess = Math.abs(x) < 2.85 && z > 7.1;
    return !cabin && !basement && !shed && !well && !gateAccess;
}
