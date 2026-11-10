import { Color, Entity } from 'playcanvas';
import type { ContainerResource } from 'playcanvas';

import { generatorPosition } from '../common';
import type { LevelContext } from '../types';

function replaceModel(target: ReturnType<LevelContext['target']>, asset: ContainerResource, name: string): void {
    const visual = new Entity(name);
    visual.setLocalScale(1 / target.size[0], 1 / target.size[1], 1 / target.size[2]);
    visual.addChild(asset.instantiateRenderEntity());
    target.entity.addChild(visual);
    target.entity.render!.enabled = false;
}

export function buildShed(
    ctx: LevelContext,
    fuelModel?: ContainerResource,
    equipment?: { generator?: ContainerResource; fuse?: ContainerResource }
): {
    shedDoor: ReturnType<LevelContext['target']>;
    fuse: ReturnType<LevelContext['target']>;
    fuel: ReturnType<LevelContext['target']>;
    generatorLamp: ReturnType<LevelContext['primitive']>;
} {
    const { root, wood, dark, metal, marker, amber } = ctx;

    ctx.solid('Cobertizo oeste', wood, [6, 1.4, -7.5], [0.18, 2.8, 5]);
    ctx.solid('Cobertizo este', wood, [12, 1.4, -7.5], [0.18, 2.8, 5]);
    ctx.solid('Cobertizo fondo', wood, [9, 1.4, -10], [6.18, 2.8, 0.18]);
    for (const x of [7, 11]) {
        ctx.solid('Cobertizo frente', wood, [x, 1.4, -5], [2, 2.8, 0.18]);
    }
    ctx.solid('Dintel del cobertizo', wood, [9, 2.52, -5], [2, 0.55, 0.18]);
    ctx.solid('Techo cobertizo', dark, [9, 2.85, -7.5], [6.5, 0.16, 5.5]);
    ctx.primitive(root, 'Baliza del cobertizo', amber, [9, 2.48, -4.86], [0.36, 0.27, 0.14]);
    ctx.numberPlate('shed-plate', 11, 1.55, -4.8, 7);
    const shedDoor = ctx.target('shed-door', dark, [9, 1.11, -5], [2, 2.22, 0.17], true);
    ctx.solid('Estante de fusibles', wood, [7.45, 0.55, -7.8], [0.95, 1.1, 0.58]);
    ctx.solid('Estante de herramientas', wood, [10.55, 0.6, -9.2], [1.1, 1.2, 0.55]);
    ctx.primitive(root, 'Herramientas colgadas', metal, [10.55, 1.35, -9.45], [0.9, 0.45, 0.08]);
    const fuse = ctx.target('fuse', marker, [7.45, 1.35, -7.8], [0.29, 0.23, 0.17]);
    const generator = ctx.target(
        'generator',
        metal,
        [generatorPosition.x, generatorPosition.y, generatorPosition.z],
        [1.3, 1.44, 1.04],
        true
    );
    const generatorLamp = ctx.primitive(
        root,
        'Indicador del generador',
        ctx.red,
        equipment?.generator ? [10.5, 1.1, -8] : [10.5, 1.15, -7.95],
        equipment?.generator ? [0.07, 0.05, 0.034] : [0.25, 0.19, 0.04]
    );
    ctx.solid('Leña apilada', ctx.bark, [13.15, 0.32, -5.38], [1.25, 0.64, 0.68]);
    const fuel = ctx.target('fuel', marker, [12.75, 1.0, -4.5], [0.43, 0.59, 0.3]);

    if (equipment?.generator) replaceModel(generator, equipment.generator, 'Generador portátil');
    if (equipment?.fuse) {
        replaceModel(fuse, equipment.fuse, 'Fusible cerámico');
        ctx.primitive(root, 'Caja de repuestos', wood, [7.45, 1.206, -7.8], [0.39, 0.212, 0.22]);
    }

    if (fuelModel) {
        replaceModel(fuel, fuelModel, 'Modelo del bidón FUEL');
        ctx.pointLight('Luz exterior de la leñera', new Color(1, 0.78, 0.56), [12.55, 2.05, -3.95], 1.6, 3.1);
        ctx.primitive(root, 'Cajón de combustible', wood, [12.75, 0.35, -4.5], [0.59, 0.7, 0.45]);
    }

    return { shedDoor, fuse, fuel, generatorLamp };
}
