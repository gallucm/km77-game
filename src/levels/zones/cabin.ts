import { Entity } from 'playcanvas';
import type { ContainerResource } from 'playcanvas';

import { gable } from '../../level-decoration';
import type { LevelContext, LevelRefs } from '../types';

export interface CabinKeyModels {
    shed: ContainerResource;
    basement: ContainerResource;
}

export function buildCabin(ctx: LevelContext, keys?: CabinKeyModels): Partial<LevelRefs> {
    const { app, root, wood, dark, plaster, ceiling, stone, trim, clue, marker, amber, roof, porchFloor } = ctx;

    ctx.solid('Cabaña lateral oeste', wood, [-4, 1.5, -10.5], [0.18, 3, 9]);
    ctx.solid('Cabaña lateral este', wood, [4, 1.5, -10.5], [0.18, 3, 9]);
    for (const x of [-2.55, 2.55]) {
        ctx.solid('Cabaña frente', wood, [x, 1.5, -6], [2.9, 3, 0.2]);
        ctx.solid('Cabaña fondo', wood, [x, 1.5, -15], [2.9, 3, 0.2]);
    }
    ctx.solid('Dintel del porche', wood, [0, 2.67, -6], [2.25, 0.66, 0.2]);
    ctx.solid('Dintel del sótano', wood, [0, 2.67, -15], [2.25, 0.66, 0.2]);
    ctx.solid('Techo cabaña', ceiling, [0, 3.05, -10.5], [8.5, 0.2, 9.4]);
    ctx.primitive(root, 'Ventana del porche', amber, [2.45, 1.7, -5.87], [1.28, 0.83, 0.05]);
    ctx.primitive(root, 'Alero del porche', dark, [0, 2.66, -5.26], [5.2, 0.15, 1.6]);
    for (const side of [-1, 1]) {
        const sheet = ctx.primitive(root, 'Chapa del tejado', roof, [side * 2.12, 3.63, -10.5], [4.53, 0.16, 9.86]);
        sheet.setLocalEulerAngles(0, 0, side * -15.9);
        ctx.primitive(root, 'Jamba del porche', trim, [side * 1.12, 1.24, -5.81], [0.18, 2.48, 0.17]);
        ctx.primitive(root, 'Pilar del alero', trim, [side * 2.16, 1.27, -4.55], [0.17, 2.54, 0.17]);
    }
    for (const z of [-5.96, -15.04]) {
        const front = new Entity('Testero triangular de la cabaña');
        front.setPosition(0, 3.04, z);
        gable(app, front, wood);
    }
    ctx.primitive(root, 'Viga de cumbrera', roof, [0, 4.29, -10.5], [0.21, 0.14, 9.9]);
    ctx.primitive(root, 'Chimenea', stone, [-1.75, 4.34, -12.3], [0.52, 1.36, 0.57]);
    ctx.primitive(root, 'Remate de chimenea', roof, [-1.75, 5.04, -12.3], [0.64, 0.14, 0.69]);
    ctx.primitive(root, 'Piso de porche', porchFloor, [0, 0.009, -5.15], [4.48, 0.02, 1.54]);
    ctx.primitive(root, 'Tarima interior', ctx.cabinFloor, [0, 0.008, -10.5], [7.8, 0.02, 8.8]);
    ctx.primitive(root, 'Dintel del marco exterior', trim, [0, 2.46, -5.81], [2.42, 0.16, 0.16]);
    ctx.primitive(root, 'Marco ventana horizontal', trim, [2.45, 1.7, -5.833], [1.29, 0.065, 0.06]);
    ctx.primitive(root, 'Marco ventana vertical', trim, [2.45, 1.7, -5.832], [0.07, 0.83, 0.065]);
    ctx.primitive(root, 'Alféizar', trim, [2.45, 1.24, -5.81], [1.38, 0.11, 0.15]);
    ctx.primitive(root, 'Lámpara del comedor', roof, [0, 2.86, -10.45], [0.47, 0.22, 0.47], 'cylinder');
    ctx.primitive(root, 'Difusor ámbar', amber, [0, 2.73, -10.45], [0.4, 0.06, 0.4], 'cylinder');
    ctx.numberPlate('cabin-plate', -2.5, 1.55, -5.82, 4);
    ctx.solid('Mesa de mapas', wood, [-2, 0.58, -9], [1.3, 1.16, 0.7]);
    ctx.solid('Mesa de registros', wood, [2, 0.58, -9], [1.3, 1.16, 0.7]);
    for (const [id, x] of [
        ['map', -2],
        ['log', 2]
    ] as const) {
        const note = ctx.target(id, clue, [x, 1.4, -9], [0.53, 0.45, 0.18]);
        note.entity.render!.enabled = false;
        ctx.primitive(root, 'Soporte del documento', trim, [x, 1.39, -9.04], [0.56, 0.46, 0.08]);
        ctx.primitive(root, 'Hoja del documento', clue, [x, 1.41, -8.985], [0.49, 0.39, 0.035]);
        for (const [line, length] of [0.27, 0.33, 0.24, 0.32].entries()) {
            const y = 1.49 - line * 0.052;
            ctx.primitive(
                root,
                'Marca del documento',
                dark,
                [x - 0.18 + length / 2, y, -8.965],
                [length, 0.009, 0.004]
            );
        }
    }
    ctx.solid('Estante de cocina', wood, [-2.5, 0.55, -12], [1.12, 1.1, 0.58]);
    ctx.solid('Cajonera de oficina', wood, [2.5, 0.55, -12], [1.12, 1.1, 0.58]);

    // Sala: estufa, estantería y silla.
    ctx.solid('Estufa de sala', stone, [-3.15, 0.62, -8.1], [0.85, 1.24, 0.85]);
    ctx.primitive(root, 'Cañón de estufa', dark, [-3.15, 1.35, -8.1], [0.18, 0.35, 0.18], 'cylinder');
    ctx.solid('Estantería de sala', wood, [3.15, 0.95, -8.2], [0.55, 1.9, 1.35]);
    ctx.solid('Silla de sala', wood, [-0.9, 0.42, -8.0], [0.42, 0.84, 0.42]);
    ctx.solid('Mesa de sala', wood, [-1.25, 0.4, -7.6], [1.35, 0.8, 0.75]);

    // Cocina: mesada y alacena.
    ctx.solid('Mesada de cocina', stone, [-3.05, 0.52, -12.6], [1.25, 1.04, 0.62]);
    ctx.solid('Alacena de cocina', wood, [-3.05, 1.55, -12.6], [1.25, 1.1, 0.62]);

    // Oficina: escritorio y archivador, más mapa en la pared.
    ctx.solid('Escritorio de oficina', wood, [2.85, 0.45, -10.7], [1.2, 0.9, 0.72]);
    ctx.solid('Archivador de oficina', dark, [3.2, 0.82, -13.5], [0.58, 1.64, 0.58]);
    ctx.primitive(root, 'Mapa en pared', plaster, [3.9, 1.55, -11.2], [0.04, 0.95, 1.35]);
    ctx.primitive(root, 'Marco del mapa', trim, [3.88, 1.55, -11.2], [0.06, 1.05, 1.45]);
    const shedKey = ctx.target('shed-key', marker, [-2.5, 1.4, -12], [0.3, 0.27, 0.15]);
    const basementKey = ctx.target('basement-key', marker, [2.5, 1.4, -12], [0.3, 0.27, 0.15]);
    if (keys) {
        for (const [pickup, model] of [
            [shedKey, keys.shed],
            [basementKey, keys.basement]
        ] as const) {
            // El volumen de interacción conserva la escala de la caja original.
            const pivot = new Entity('Modelo de llave');
            pivot.setLocalScale(1 / pickup.size[0], 1 / pickup.size[1], 1 / pickup.size[2]);
            pivot.addChild(model.instantiateRenderEntity());
            pickup.entity.addChild(pivot);
            pickup.entity.render!.enabled = false;

            const [x, , z] = pickup.center;
            ctx.primitive(root, 'Soporte de llave', trim, [x, 1.26, z - 0.045], [0.21, 0.32, 0.04]);
        }
    }
    const basementDoor = ctx.target('basement-door', dark, [0, 1.1, -15], [2.2, 2.2, 0.18], true);

    return { shedKey, basementKey, basementDoor };
}
