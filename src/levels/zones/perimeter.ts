import type { LevelContext, LevelRefs } from '../types';

export function buildPerimeter(ctx: LevelContext): Partial<LevelRefs> {
    const { root, ground, path, dark } = ctx;

    // Cuatro sectores dejan libre el hueco bajo la cabaña.
    ctx.primitive(root, 'Suelo sur', ground, [0, -0.16, 1.95], [42, 0.3, 34.1]);
    ctx.primitive(root, 'Suelo oeste', ground, [-11.8, -0.16, -20.1], [18.4, 0.3, 10.2]);
    ctx.primitive(root, 'Suelo este', ground, [11.8, -0.16, -20.1], [18.4, 0.3, 10.2]);
    ctx.primitive(root, 'Suelo norte', ground, [0, -0.16, -31.6], [42, 0.3, 12.8]);
    ctx.primitive(root, 'Camino al portón', path, [0, -0.006, 3.3], [3.9, 0.02, 18.4]);
    ctx.primitive(root, 'Desvío al cobertizo', path, [5.9, -0.006, -3.5], [8.2, 0.02, 2.2]);
    ctx.primitive(root, 'Desvío al pozo', path, [-6, -0.006, -7.8], [5.5, 0.02, 2.0]);

    ctx.solid('Valla oeste', dark, [-16, 0.75, -9], [0.18, 1.5, 34]);
    ctx.solid('Valla este', dark, [16, 0.75, -9], [0.18, 1.5, 34]);
    ctx.solid('Valla norte', dark, [0, 0.75, -26], [32, 1.5, 0.18]);
    ctx.solid('Valla del portón oeste', dark, [-9.2, 0.75, 8], [13.6, 1.5, 0.18]);
    ctx.solid('Valla del portón este', dark, [9.2, 0.75, 8], [13.6, 1.5, 0.18]);
    ctx.solid('Corredor de salida oeste', dark, [-2.35, 0.7, 10.5], [0.18, 1.4, 5]);
    ctx.solid('Corredor de salida este', dark, [2.35, 0.7, 10.5], [0.18, 1.4, 5]);

    return {};
}
