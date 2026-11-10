import { BASEMENT_DEPTH, BASEMENT_END, BASEMENT_TOP, BASEMENT_WIDTH } from '../common';
import type { LevelContext } from '../types';

export function buildBasement(ctx: LevelContext): { crank: ReturnType<LevelContext['target']> } {
    const { root, wood, metal, stone, marker } = ctx;
    const rampLength = BASEMENT_TOP - BASEMENT_END;
    const ramp = ctx.primitive(
        root,
        'Rampa del sótano',
        stone,
        [0, -1.38, -17.6],
        [BASEMENT_WIDTH, 0.16, Math.hypot(rampLength, BASEMENT_DEPTH)]
    );
    ramp.setLocalEulerAngles(-Math.atan2(BASEMENT_DEPTH, rampLength) * (180 / Math.PI), 0, 0);
    ctx.basementEntities.push(ramp);

    const basementFloor = ctx.primitive(
        root,
        'Piso del sótano',
        ctx.basementFloor,
        [0, -2.7, -22.65],
        [BASEMENT_WIDTH, 0.2, 5.1]
    );
    ctx.basementEntities.push(basementFloor);

    const w = ctx.solid('Contención sótano oeste', wood, [-2.69, 0.04, -20.17], [0.18, 5.5, 10.15]);
    ctx.basementEntities.push(w.entity);
    const e = ctx.solid('Contención sótano este', wood, [2.69, 0.04, -20.17], [0.18, 5.5, 10.15]);
    ctx.basementEntities.push(e.entity);
    const f = ctx.solid('Fondo del sótano', wood, [0, 0.04, -25.24], [5.4, 5.5, 0.18]);
    ctx.basementEntities.push(f.entity);
    const t = ctx.solid('Techo del sótano', ctx.ceiling, [0, 2.75, -20.17], [5.6, 0.16, 10.35]);
    ctx.basementEntities.push(t.entity);
    const c = ctx.solid('Cajón de repuestos', wood, [0, -2.02, -23.2], [1.1, 1.16, 0.8]);
    ctx.basementEntities.push(c.entity);
    const crank = ctx.target('crank', marker, [0, -1.15, -23.2], [0.44, 0.3, 0.18]);
    ctx.basementEntities.push(crank.entity);

    const shelfW = ctx.solid('Estantería sótano oeste', wood, [-2.0, -1.85, -22.0], [0.5, 1.5, 2.4]);
    ctx.basementEntities.push(shelfW.entity);
    const shelfE = ctx.solid('Estantería sótano este', wood, [2.0, -1.85, -22.0], [0.5, 1.5, 2.4]);
    ctx.basementEntities.push(shelfE.entity);
    const board = ctx.primitive(root, 'Tablero eléctrico', metal, [0, -1.35, -25.05], [1.1, 1.0, 0.12]);
    ctx.basementEntities.push(board);

    return { crank };
}
