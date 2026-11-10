import type { ContainerResource } from 'playcanvas';

import type { LevelContext, LevelRefs } from '../types';

import { buildGrass } from './grass';
import type { GroundStrip } from './grass';

const roads: GroundStrip[] = [
    { name: 'Camino al portón', x: 0, z: 3.3, width: 3.9, depth: 18.4 },
    { name: 'Desvío al cobertizo', x: 5.9, z: -3.5, width: 8.2, depth: 2.2 },
    { name: 'Desvío al pozo', x: -6, z: -7.8, width: 5.5, depth: 2 }
];

export function buildPerimeter(ctx: LevelContext, grass?: ContainerResource): Partial<LevelRefs> {
    const { root, ground, path, dark } = ctx;

    // Cuatro sectores dejan libre el hueco bajo la cabaña.
    ctx.primitive(root, 'Suelo sur', ground, [0, -0.16, 1.95], [42, 0.3, 34.1]);
    ctx.primitive(root, 'Suelo oeste', ground, [-11.8, -0.16, -20.1], [18.4, 0.3, 10.2]);
    ctx.primitive(root, 'Suelo este', ground, [11.8, -0.16, -20.1], [18.4, 0.3, 10.2]);
    ctx.primitive(root, 'Suelo norte', ground, [0, -0.16, -31.6], [42, 0.3, 12.8]);
    for (const { name, x, z, width, depth } of roads) {
        ctx.primitive(root, name, path, [x, -0.006, z], [width, 0.02, depth]);
    }
    if (grass) buildGrass(ctx, grass, roads);

    ctx.solid('Valla oeste', dark, [-16, 0.75, -9], [0.18, 1.5, 34]);
    ctx.solid('Valla este', dark, [16, 0.75, -9], [0.18, 1.5, 34]);
    ctx.solid('Valla norte', dark, [0, 0.75, -26], [32, 1.5, 0.18]);
    ctx.solid('Valla del portón oeste', dark, [-9.2, 0.75, 8], [13.6, 1.5, 0.18]);
    ctx.solid('Valla del portón este', dark, [9.2, 0.75, 8], [13.6, 1.5, 0.18]);
    ctx.solid('Corredor de salida oeste', dark, [-2.35, 0.7, 10.5], [0.18, 1.4, 5]);
    ctx.solid('Corredor de salida este', dark, [2.35, 0.7, 10.5], [0.18, 1.4, 5]);

    return {};
}
