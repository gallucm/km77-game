import type { AppBase, Color, Entity, StandardMaterial } from 'playcanvas';

import type { TargetId } from '../progress';

import type { Box, Point } from './common';

export interface LevelContext {
    app: AppBase;
    root: Entity;
    sky: Color;
    blockers: Box[];
    targets: Map<TargetId, Box>;
    ground: StandardMaterial;
    path: StandardMaterial;
    wood: StandardMaterial;
    dark: StandardMaterial;
    plaster: StandardMaterial;
    ceiling: StandardMaterial;
    metal: StandardMaterial;
    stone: StandardMaterial;
    bark: StandardMaterial;
    needles: StandardMaterial;
    fir: StandardMaterial;
    roof: StandardMaterial;
    trim: StandardMaterial;
    clue: StandardMaterial;
    digits: StandardMaterial;
    marker: StandardMaterial;
    red: StandardMaterial;
    green: StandardMaterial;
    amber: StandardMaterial;
    porchFloor: StandardMaterial;
    cabinFloor: StandardMaterial;
    basementFloor: StandardMaterial;
    basementEntities: Entity[];
    primitive: (
        parent: Entity,
        name: string,
        surface: StandardMaterial,
        position: Point,
        size: Point,
        type?: 'box' | 'cone' | 'cylinder'
    ) => Entity;
    solid: (name: string, surface: StandardMaterial, center: Point, size: Point) => Box;
    target: (id: TargetId, surface: StandardMaterial, center: Point, size: Point, blocks?: boolean) => Box;
    pointLight: (name: string, color: Color, position: Point, intensity: number, range: number) => Entity;
    numberPlate: (id: TargetId, x: number, y: number, z: number, digit: 1 | 2 | 4 | 7, facing?: number) => void;
}

export interface LevelRefs {
    shedDoor: Box;
    basementDoor: Box;
    shedKey: Box;
    basementKey: Box;
    fuse: Box;
    fuel: Box;
    crank: Box;
    crankIndicator: Entity;
    generatorLamp: Entity;
    gateLamp: Entity;
    gate: Box;
    gateLight: Entity;
}
