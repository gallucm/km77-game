import type { LevelContext } from '../types';

export function buildWell(ctx: LevelContext): Record<string, never> {
    const { root, stone, dark, bark } = ctx;

    const well = ctx.primitive(root, 'Pozo seco', stone, [-8, 0.45, -12], [2.25, 0.9, 2.25], 'cylinder');
    ctx.blockers.push({ center: [-8, 0.45, -12], size: [2.05, 0.9, 2.05], entity: well });
    ctx.primitive(root, 'Brocal oscuro', dark, [-8, 0.91, -12], [1.72, 0.04, 1.72], 'cylinder');
    ctx.solid('Soporte de la placa del pozo', bark, [-8, 0.75, -10.55], [0.17, 1.5, 0.17]);
    ctx.numberPlate('well-plate', -8, 1.5, -10.45, 1);

    return {};
}
