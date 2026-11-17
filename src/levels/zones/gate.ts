import { Color, Entity } from 'playcanvas';

import { GATE_Z } from '../common';
import type { LevelContext } from '../types';
import { buildGateModel } from './gate-model';

export function buildGate(ctx: LevelContext): {
    gate: ReturnType<LevelContext['solid']>;
    gateLamp: ReturnType<LevelContext['primitive']>;
    gateLight: ReturnType<LevelContext['pointLight']>;
    crankIndicator: ReturnType<LevelContext['primitive']>;
} {
    const { app, root, stone, metal, dark, red } = ctx;

    const leftPillar = ctx.solid('Pilar izquierdo', stone, [-2.65, 1.55, GATE_Z], [0.6, 3.1, 0.6]);
    const rightPillar = ctx.solid('Pilar derecho', stone, [2.65, 1.55, GATE_Z], [0.6, 3.1, 0.6]);
    const gate = ctx.solid('Hoja de portón', metal, [0, 1.23, GATE_Z], [4.7, 2.46, 0.22]);
    const panel = ctx.target('gate-panel', red, [2.65, 1.55, 7.56], [0.46, 0.62, 0.28]);
    const release = ctx.target('gate-crank', metal, [-2.65, 1.55, 7.56], [0.47, 0.5, 0.28]);
    for (const box of [leftPillar, rightPillar, gate, panel, release]) box.entity.render!.enabled = false;

    const frame = new Entity('Marco fijo y mecanismos del portón');
    frame.setLocalPosition(0, 0, GATE_Z);
    root.addChild(frame);
    const leaf = new Entity('Hoja de acero del portón');
    const [width, height, depth] = gate.size;
    // El padre conserva la escala de la caja de colisión. La malla está modelada en metros.
    leaf.setLocalScale(1 / width, 1 / height, 1 / depth);
    gate.entity.addChild(leaf);
    const crankIndicator = new Entity('Manivela instalada');
    crankIndicator.setLocalPosition(-2.65, 1.54, -0.62);
    frame.addChild(crankIndicator);
    buildGateModel(app, frame, leaf, crankIndicator, metal, dark);
    crankIndicator.enabled = false;
    const gateLamp = ctx.primitive(frame, 'Indicador del portón', red, [2.65, 1.728, -0.624], [0.10, 0.036, 0.025]);

    ctx.solid('Cartel del kilómetro', dark, [4, 0.93, 6.8], [0.21, 1.86, 0.18]);
    ctx.numberPlate('entry-plate', 4, 1.55, 6.6, 2, -1);

    const gateLight = ctx.pointLight('Luz del portón', new Color(0.58, 0.78, 0.95), [1.8, 2.65, 7.28], 0.23, 8);

    return { gate, gateLamp, gateLight, crankIndicator };
}
