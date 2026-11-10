import { BoundingBox, Entity, Mat4, MeshInstance, Quat, Vec3, VertexBuffer, VertexFormat } from 'playcanvas';
import type { ContainerResource, RenderComponent } from 'playcanvas';

import { addPineCanopies } from '../../level-decoration';
import type { LevelContext } from '../types';

type Tree = [x: number, z: number, height: number];

function addModelForest(ctx: LevelContext, forest: ContainerResource[], trees: Tree[]) {
    const device = ctx.app.graphicsDevice;
    const format = VertexFormat.getDefaultInstancingFormat(device);
    const groups = new Map<number, Tree[]>();
    for (const [index, tree] of trees.entries()) {
        const [x, z] = tree;
        const sector = Number(x >= 0) + 2 * Number(z >= -9);
        const key = sector * forest.length + (index % forest.length);
        const group = groups.get(key) ?? [];
        group.push(tree);
        groups.set(key, group);
    }

    const templates = forest.map((resource) => resource.instantiateRenderEntity());
    const pose = new Mat4();
    const transform = new Mat4();
    const rotation = new Quat();
    const position = new Vec3();
    const scale = new Vec3();
    for (const [key, group] of groups) {
        const sector = new Entity(`Bosque GLB · sector ${key}`);
        const template = templates[key % forest.length];
        const instances: MeshInstance[] = [];
        const bounds = new BoundingBox();
        let hasBounds = false;
        for (const render of template.findComponents('render') as RenderComponent[]) {
            for (const source of render.meshInstances) {
                const mesh = source.mesh;
                const material = source.material;
                if (!mesh || !material) continue;
                const data = new Float32Array(group.length * 16);
                const worldBounds = new BoundingBox();
                for (const [index, [x, z, height]] of group.entries()) {
                    rotation.setFromEulerAngles(0, (x * 29 + z * 17) % 360, 0);
                    pose.setTRS(position.set(x, 0, z), rotation, scale.set(height, height, height));
                    transform.mul2(pose, source.node.getWorldTransform());
                    data.set(transform.data, index * 16);
                    worldBounds.setFromTransformedAabb(mesh.aabb, transform);
                    if (hasBounds) bounds.add(worldBounds);
                    else bounds.copy(worldBounds);
                    hasBounds = true;
                }
                const buffer = new VertexBuffer(device, format, group.length, { data });
                const instance = new MeshInstance(mesh, material, sector);
                instance.setInstancing(buffer, true);
                instances.push(instance);
                ctx.app.once('destroy', () => buffer.destroy());
            }
        }
        sector.addComponent('render', { meshInstances: instances, castShadows: false });
        sector.render!.customAabb = bounds;
        ctx.root.addChild(sector);
    }
    for (const template of templates) template.destroy();
}

export function buildTrees(ctx: LevelContext, forest?: ContainerResource[]): Record<string, never> {
    const { root, bark, needles, fir } = ctx;

    const trees: [number, number, number][] = [
        [-5, 0, 5.4],
        [5.5, 0, 6.2],
        [-6.8, -5.4, 7.0],
        [6, -13.4, 5.8],
        [-9.9, -9.7, 6.4],
        [13.7, -10, 7.8],
        [-5.5, -17, 7.7],
        [6.5, -17, 6.5],
        [-4.1, -23.5, 8.4],
        [5.6, -24, 7.5],
        [-12.5, -19, 8.3],
        [12.5, -21, 8.5],
        [-12.5, 3.5, 6.7],
        [12, 3, 7.0]
    ];
    for (const [index, [x, z]] of trees.entries()) {
        const trunk = ctx.solid(`Tronco ${index + 1}`, bark, [x, 0.9, z], [0.32, 1.8, 0.32]);
        if (forest?.length) trunk.entity.render!.enabled = false;
    }
    const backdrop: [number, number, number][] = [
        [-18.6, 10, 8.1],
        [-16.2, 13.4, 7.7],
        [-11.7, 12.9, 7.2],
        [-7.9, 13.8, 6.1],
        [-4.2, 16.2, 6.5],
        [3.8, 16.3, 7.7],
        [8.8, 14.2, 8.5],
        [12.4, 13, 7.7],
        [17.6, 12.6, 9.2],
        [-17.9, 3.5, 7.4],
        [17.9, 5.5, 7.8],
        [-18.8, -5, 8.4],
        [18.6, -7.5, 9],
        [-19.3, -12, 8.9],
        [18.1, -14.5, 8.2],
        [-18.9, -19.6, 7.9],
        [19.5, -21, 9.3],
        [-15.4, -29, 10],
        [-10.3, -29.6, 7.6],
        [-6.7, -29, 7.9],
        [-2.3, -31.4, 8.7],
        [2.8, -32.7, 8.6],
        [6.8, -29.3, 9.3],
        [11.3, -28.6, 8.2],
        [16.1, -29.4, 7.6]
    ];
    if (forest?.length) {
        addModelForest(ctx, forest, [...trees, ...backdrop]);
    } else {
        for (const [x, z] of backdrop) {
            ctx.primitive(root, 'Tronco exterior', bark, [x, 0.85, z], [0.32, 1.7, 0.32], 'cylinder');
        }
        addPineCanopies(ctx.app, [...trees, ...backdrop], [needles, fir], bark);
    }

    return {};
}
