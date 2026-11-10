import { Color } from 'playcanvas';

import { GATE_Z } from '../common';
import type { LevelContext } from '../types';

export function buildGate(ctx: LevelContext): {
    gate: ReturnType<LevelContext['solid']>;
    gateLamp: ReturnType<LevelContext['primitive']>;
    gateLight: ReturnType<LevelContext['pointLight']>;
    crankIndicator: ReturnType<LevelContext['primitive']>;
} {
    const { root, stone, metal, dark, roof, red } = ctx;

    ctx.solid('Pilar izquierdo', stone, [-2.65, 1.55, GATE_Z], [0.6, 3.1, 0.6]);
    ctx.solid('Pilar derecho', stone, [2.65, 1.55, GATE_Z], [0.6, 3.1, 0.6]);
    const gate = ctx.solid('Hoja de portón', metal, [0, 1.23, GATE_Z], [4.7, 2.46, 0.22]);
    ctx.target('gate-panel', red, [2.65, 1.55, 7.56], [0.46, 0.62, 0.28]);
    for (const y of [-0.42, 0.42]) {
        ctx.primitive(gate.entity, 'Travesaño', roof, [0, y, -0.57], [1.01, 0.065, 0.29]);
    }
    for (const x of [-0.4, -0.2, 0, 0.2, 0.4]) {
        ctx.primitive(gate.entity, 'Refuerzo de hoja', roof, [x, 0, -0.56], [0.028, 0.87, 0.3]);
    }
    ctx.primitive(root, 'Dintel de hormigón', stone, [0, 3.05, GATE_Z], [6.15, 0.26, 0.63]);
    ctx.primitive(root, 'Luminaria del portón', roof, [1.8, 2.87, 7.66], [0.54, 0.16, 0.37]);
    const gateLamp = ctx.primitive(root, 'Indicador del portón', red, [2.65, 1.73, 7.4], [0.27, 0.15, 0.05]);
    ctx.target('gate-crank', metal, [-2.65, 1.55, 7.56], [0.47, 0.5, 0.28]);
    const crankIndicator = ctx.primitive(
        root,
        'Manivela instalada',
        ctx.marker,
        [-2.65, 1.55, 7.38],
        [0.31, 0.09, 0.13]
    );
    crankIndicator.enabled = false;
    ctx.solid('Cartel del kilómetro', dark, [4, 0.93, 6.8], [0.21, 1.86, 0.18]);
    ctx.numberPlate('entry-plate', 4, 1.55, 6.6, 2, -1);

    const gateLight = ctx.pointLight('Luz del portón', new Color(0.58, 0.78, 0.95), [1.8, 2.65, 7.28], 0.23, 8);

    return { gate, gateLamp, gateLight, crankIndicator };
}
