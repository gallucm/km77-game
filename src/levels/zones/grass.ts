import { BoundingBox, Entity, Mat4, MeshInstance, Quat, Vec3, VertexBuffer, VertexFormat } from 'playcanvas';
import type { ContainerResource, RenderComponent } from 'playcanvas';

import type { LevelContext } from '../types';

export interface GroundStrip {
    name: string;
    x: number;
    z: number;
    width: number;
    depth: number;
}

export function buildGrass(ctx: LevelContext, resource: ContainerResource, roads: GroundStrip[]): void {
    const template = resource.instantiateRenderEntity();
    const render = template.findComponent('render') as RenderComponent | undefined;
    const source = render?.meshInstances[0];
    if (!source?.mesh || !source.material) {
        template.destroy();
        return;
    }

    const { mesh, material } = source;
    const sourceTransform = source.node.getWorldTransform().clone();
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

    for (let startZ = -26; startZ < 13; startZ += 7) {
        for (let startX = -16; startX < 16; startX += 8) {
            const matrices: number[] = [];
            const bounds = new BoundingBox();
            for (let z = startZ; z < Math.min(startZ + 7, 13) - 0.4; z += 1.03) {
                for (let x = startX; x < Math.min(startX + 8, 16) - 0.4; x += 1.03) {
                    const px = x + 0.32 + random() * 0.62;
                    const pz = z + 0.32 + random() * 0.62;
                    if (!isGroundClear(px, pz, roads)) continue;
                    const patch = Math.sin(px * 0.64 + pz * 0.22) * Math.cos(pz * 0.51);
                    if (random() > 0.78 + patch * 0.22) continue;

                    const width = 0.75 + random() * 0.52;
                    const height = 0.62 + random() * 0.72;
                    pose.setTRS(
                        position.set(px, -0.012, pz),
                        rotation.setFromEulerAngles(0, random() * 360, 0),
                        scale.set(width, height, width)
                    );
                    transform.mul2(pose, sourceTransform);
                    transformedBounds.setFromTransformedAabb(mesh.aabb, transform);
                    if (matrices.length) bounds.add(transformedBounds);
                    else bounds.copy(transformedBounds);
                    matrices.push(...transform.data);
                }
            }
            if (!matrices.length) continue;

            const entity = new Entity('Pasto · sector exterior');
            const buffer = new VertexBuffer(device, format, matrices.length / 16, { data: new Float32Array(matrices) });
            const instance = new MeshInstance(mesh, material, entity);
            instance.setInstancing(buffer, true);
            entity.addComponent('render', { meshInstances: [instance], castShadows: false });
            entity.render!.customAabb = bounds;
            ctx.root.addChild(entity);
            ctx.app.once('destroy', () => buffer.destroy());
        }
    }
    template.destroy();
}

function isGroundClear(x: number, z: number, roads: GroundStrip[]): boolean {
    const pathMargin = 0.38;
    if (
        roads.some(
            (road) =>
                Math.abs(x - road.x) < road.width / 2 + pathMargin && Math.abs(z - road.z) < road.depth / 2 + pathMargin
        )
    )
        return false;

    const cabin = Math.abs(x) < 4.55 && z > -15.5 && z < -4.3;
    const basement = Math.abs(x) < 3.02 && z >= -25.75 && z <= -14.9;
    const shed = x > 5.55 && x < 12.45 && z > -10.45 && z < -4.6;
    const well = Math.hypot(x + 8, z + 12) < 1.75;
    const gateAccess = Math.abs(x) < 2.85 && z > 7.1;
    return !cabin && !basement && !shed && !well && !gateAccess;
}
