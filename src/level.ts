import { Color, Entity, FOG_LINEAR, StandardMaterial } from 'playcanvas';
import type { AppBase, Vec3 } from 'playcanvas';

import { addPineCanopies, gable, paintMaterials } from './level-decoration';
import type { Checkpoint, Progress, TargetId } from './progress';

type Point = [x: number, y: number, z: number];
export const checkpoints = {
    spawn: { x: 0, z: 4.5, yaw: 180 },
    gate: { x: 0, z: 5.7, yaw: 180 },
    cabin: { x: 0, z: -7.2, yaw: 0 },
    shed: { x: 9, z: -3.3, yaw: 0 },
    basement: { x: 0, z: -21.2, yaw: 0 }
} satisfies Record<Checkpoint, { x: number; z: number; yaw: number }>;

const GATE_Z = 8;
const PLAYER_RADIUS = 0.24;
const INTERACTION_RANGE = 2.5;
const AXES = ['x', 'y', 'z'] as const;
const BASEMENT_TOP = -15.1;
const BASEMENT_END = -20.1;
const BASEMENT_DEPTH = 2.6;
const BASEMENT_WIDTH = 5.2;

interface Box {
    center: Point;
    size: Point;
    entity: Entity;
}

function material(name: string, color: Color, glow = 0): StandardMaterial {
    const result = new StandardMaterial();
    result.name = name;
    result.diffuse.copy(color);
    if (glow) {
        result.emissive.copy(color);
        result.emissiveIntensity = glow;
    }
    result.update();
    return result;
}

function primitive(
    parent: Entity,
    name: string,
    surface: StandardMaterial,
    position: Point,
    size: Point,
    type: 'box' | 'cone' | 'cylinder' = 'box'
): Entity {
    const entity = new Entity(name);
    entity.addComponent('render', { type, material: surface });
    entity.setLocalPosition(...position);
    entity.setLocalScale(...size);
    parent.addChild(entity);
    return entity;
}

function rayDistance({ center, size }: Box, origin: Vec3, direction: Vec3): number {
    let near = 0;
    let far = INTERACTION_RANGE;
    for (let index = 0; index < AXES.length; index += 1) {
        const axis = AXES[index];
        const min = center[index] - size[index] / 2;
        const max = center[index] + size[index] / 2;
        if (Math.abs(direction[axis]) < 1e-6) {
            if (origin[axis] < min || origin[axis] > max) return Infinity;
        } else {
            const a = (min - origin[axis]) / direction[axis];
            const b = (max - origin[axis]) / direction[axis];
            near = Math.max(near, Math.min(a, b));
            far = Math.min(far, Math.max(a, b));
            if (near > far) return Infinity;
        }
    }
    return near;
}

export function floorAt(x: number, z: number): number {
    if (Math.abs(x) >= BASEMENT_WIDTH / 2 || z >= BASEMENT_TOP || z < -25.2) return 0;
    const descent = Math.min(1, (BASEMENT_TOP - z) / (BASEMENT_TOP - BASEMENT_END));
    return -descent * BASEMENT_DEPTH;
}

export const generatorPosition = { x: 10.5, y: 0.72, z: -8.5 };

export function isIndoors(x: number, z: number): boolean {
    const cabin = Math.abs(x) < 3.9 && z > -15.1 && z < -6;
    const basement = Math.abs(x) < BASEMENT_WIDTH / 2 && z >= -25.2 && z <= -15.1;
    const shed = x > 6.1 && x < 11.9 && z > -9.9 && z < -5;
    return cabin || basement || shed;
}

export function buildLevel(app: AppBase, sky = new Color(0.055, 0.103, 0.132)) {
    const root = app.root;
    const blockers: Box[] = [];
    const targets = new Map<TargetId, Box>();
    const ground = material('Tierra fría', new Color(0.23, 0.29, 0.27));
    const path = material('Camino', new Color(0.39, 0.35, 0.31));
    const wood = material('Tablas envejecidas', new Color(0.56, 0.42, 0.32));
    const dark = material('Madera oscura', new Color(0.29, 0.25, 0.22));
    const metal = material('Acero', new Color(0.46, 0.5, 0.52));
    const stone = material('Piedra', new Color(0.35, 0.38, 0.36));
    const bark = material('Tronco', new Color(0.2, 0.16, 0.13));
    const needles = material('Pino', new Color(0.18, 0.28, 0.25));
    const fir = material('Abeto', new Color(0.14, 0.22, 0.22));
    const roof = material('Chapa azul', new Color(0.2, 0.26, 0.3));
    const trim = material('Marcos de roble', new Color(0.47, 0.33, 0.25));
    const clue = material('Papel', new Color(0.85, 0.69, 0.42), 0.13);
    const digits = material('Cifras', new Color(0.88, 0.82, 0.67), 0.24);
    const marker = material('Herramientas', new Color(0.92, 0.48, 0.18), 0.2);
    const red = material('Sin alimentación', new Color(0.25, 0.19, 0.17));
    const green = material('Energía restaurada', new Color(0.25, 0.79, 0.44), 0.48);
    const amber = material('Baliza', new Color(0.96, 0.55, 0.25), 0.48);

    const porchFloor = wood.clone();
    porchFloor.name = 'Porche con luz horneada';
    porchFloor.lightMap = paintMaterials(app, { ground, path, wood, metal });
    porchFloor.diffuseMap = wood.diffuseMap;
    porchFloor.diffuseMapTiling.set(2, 1);
    porchFloor.lightMapUv = 0;
    porchFloor.update();

    function solid(name: string, surface: StandardMaterial, center: Point, size: Point): Box {
        const box = { center, size, entity: primitive(root, name, surface, center, size) };
        blockers.push(box);
        return box;
    }

    function target(id: TargetId, surface: StandardMaterial, center: Point, size: Point, blocks = false) {
        const box = blocks
            ? solid(id, surface, center, size)
            : { center, size, entity: primitive(root, id, surface, center, size) };
        targets.set(id, box);
        return box;
    }

    function pointLight(name: string, color: Color, position: Point, intensity: number, range: number) {
        const light = new Entity(name);
        light.addComponent('light', { type: 'omni', color, intensity, range });
        light.setPosition(...position);
        root.addChild(light);
        return light;
    }

    function numberPlate(id: TargetId, x: number, y: number, z: number, digit: 1 | 2 | 4 | 7, facing = 1) {
        target(id, dark, [x, y, z], [0.54, 0.65, 0.1]);
        const segments: [number, number, number, number][] = [
            [0, 0.24, 0.26, 0.042],
            [0.13, 0.12, 0.042, 0.21],
            [0.13, -0.12, 0.042, 0.21],
            [0, -0.24, 0.26, 0.042],
            [-0.13, -0.12, 0.042, 0.21],
            [-0.13, 0.12, 0.042, 0.21],
            [0, 0, 0.26, 0.042]
        ];
        const activeSegments = { 1: [1, 2], 2: [0, 1, 6, 4, 3], 4: [5, 6, 1, 2], 7: [0, 1, 2] };
        for (const index of activeSegments[digit]) {
            const [dx, dy, width, height] = segments[index];
            primitive(root, `${id} cifra`, digits, [x + dx * facing, y + dy, z + 0.06 * facing], [width, height, 0.02]);
        }
    }

    // Cuatro sectores dejan libre el hueco bajo la cabaña.
    primitive(root, 'Suelo sur', ground, [0, -0.16, 1.95], [42, 0.3, 34.1]);
    primitive(root, 'Suelo oeste', ground, [-11.8, -0.16, -20.1], [18.4, 0.3, 10.2]);
    primitive(root, 'Suelo este', ground, [11.8, -0.16, -20.1], [18.4, 0.3, 10.2]);
    primitive(root, 'Suelo norte', ground, [0, -0.16, -31.6], [42, 0.3, 12.8]);
    primitive(root, 'Camino al portón', path, [0, -0.006, 3.3], [3.9, 0.02, 18.4]);
    primitive(root, 'Desvío al cobertizo', path, [5.9, -0.006, -3.5], [8.2, 0.02, 2.2]);
    primitive(root, 'Desvío al pozo', path, [-6, -0.006, -7.8], [5.5, 0.02, 2.0]);

    solid('Valla oeste', dark, [-16, 0.75, -9], [0.18, 1.5, 34]);
    solid('Valla este', dark, [16, 0.75, -9], [0.18, 1.5, 34]);
    solid('Valla norte', dark, [0, 0.75, -26], [32, 1.5, 0.18]);
    solid('Valla del portón oeste', dark, [-9.2, 0.75, GATE_Z], [13.6, 1.5, 0.18]);
    solid('Valla del portón este', dark, [9.2, 0.75, GATE_Z], [13.6, 1.5, 0.18]);
    solid('Corredor de salida oeste', dark, [-2.35, 0.7, 10.5], [0.18, 1.4, 5]);
    solid('Corredor de salida este', dark, [2.35, 0.7, 10.5], [0.18, 1.4, 5]);

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
        solid(`Tronco ${index + 1}`, bark, [x, 0.9, z], [0.32, 1.8, 0.32]);
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
    for (const [x, z] of backdrop) {
        primitive(root, 'Tronco exterior', bark, [x, 0.85, z], [0.32, 1.7, 0.32], 'cylinder');
    }
    addPineCanopies(app, [...trees, ...backdrop], [needles, fir]);

    // Cabaña: porche sin puerta y una puerta interior que controla el sótano.
    solid('Cabaña lateral oeste', wood, [-4, 1.5, -10.5], [0.18, 3, 9]);
    solid('Cabaña lateral este', wood, [4, 1.5, -10.5], [0.18, 3, 9]);
    for (const x of [-2.55, 2.55]) {
        solid('Cabaña frente', wood, [x, 1.5, -6], [2.9, 3, 0.2]);
        solid('Cabaña fondo', wood, [x, 1.5, -15], [2.9, 3, 0.2]);
    }
    solid('Dintel del porche', wood, [0, 2.67, -6], [2.25, 0.66, 0.2]);
    solid('Dintel del sótano', wood, [0, 2.67, -15], [2.25, 0.66, 0.2]);
    solid('Techo cabaña', dark, [0, 3.05, -10.5], [8.5, 0.2, 9.4]);
    primitive(root, 'Ventana del porche', amber, [2.45, 1.7, -5.87], [1.28, 0.83, 0.05]);
    primitive(root, 'Alero del porche', dark, [0, 2.66, -5.26], [5.2, 0.15, 1.6]);
    for (const side of [-1, 1]) {
        const sheet = primitive(root, 'Chapa del tejado', roof, [side * 2.12, 3.63, -10.5], [4.53, 0.16, 9.86]);
        sheet.setLocalEulerAngles(0, 0, side * -15.9);
        primitive(root, 'Jamba del porche', trim, [side * 1.12, 1.24, -5.81], [0.18, 2.48, 0.17]);
        primitive(root, 'Pilar del alero', trim, [side * 2.16, 1.27, -4.55], [0.17, 2.54, 0.17]);
    }
    for (const z of [-5.96, -15.04]) {
        const front = new Entity('Testero triangular de la cabaña');
        front.setPosition(0, 3.04, z);
        gable(app, front, wood);
    }
    primitive(root, 'Viga de cumbrera', roof, [0, 4.29, -10.5], [0.21, 0.14, 9.9]);
    primitive(root, 'Chimenea', stone, [-1.75, 4.34, -12.3], [0.52, 1.36, 0.57]);
    primitive(root, 'Remate de chimenea', roof, [-1.75, 5.04, -12.3], [0.64, 0.14, 0.69]);
    primitive(root, 'Piso de porche', porchFloor, [0, 0.009, -5.15], [4.48, 0.02, 1.54]);
    primitive(root, 'Tarima interior', wood, [0, 0.008, -10.5], [7.8, 0.02, 8.8]);
    primitive(root, 'Dintel del marco exterior', trim, [0, 2.46, -5.81], [2.42, 0.16, 0.16]);
    primitive(root, 'Marco ventana horizontal', trim, [2.45, 1.7, -5.833], [1.29, 0.065, 0.06]);
    primitive(root, 'Marco ventana vertical', trim, [2.45, 1.7, -5.832], [0.07, 0.83, 0.065]);
    primitive(root, 'Alféizar', trim, [2.45, 1.24, -5.81], [1.38, 0.11, 0.15]);
    primitive(root, 'Lámpara del comedor', roof, [0, 2.86, -10.45], [0.47, 0.22, 0.47], 'cylinder');
    primitive(root, 'Difusor ámbar', amber, [0, 2.73, -10.45], [0.4, 0.06, 0.4], 'cylinder');
    numberPlate('cabin-plate', -2.5, 1.55, -5.82, 4);
    solid('Mesa de mapas', wood, [-2, 0.58, -9], [1.3, 1.16, 0.7]);
    solid('Mesa de registros', wood, [2, 0.58, -9], [1.3, 1.16, 0.7]);
    for (const [id, x] of [
        ['map', -2],
        ['log', 2]
    ] as const) {
        const note = target(id, clue, [x, 1.4, -9], [0.53, 0.45, 0.18]);
        note.entity.render!.enabled = false;
        primitive(root, 'Soporte del documento', trim, [x, 1.39, -9.04], [0.56, 0.46, 0.08]);
        primitive(root, 'Hoja del documento', clue, [x, 1.41, -8.985], [0.49, 0.39, 0.035]);
        for (const [line, length] of [0.27, 0.33, 0.24, 0.32].entries()) {
            const y = 1.49 - line * 0.052;
            primitive(root, 'Marca del documento', dark, [x - 0.18 + length / 2, y, -8.965], [length, 0.009, 0.004]);
        }
    }
    solid('Estante de cocina', wood, [-2.5, 0.55, -12], [1.12, 1.1, 0.58]);
    solid('Cajonera de oficina', wood, [2.5, 0.55, -12], [1.12, 1.1, 0.58]);
    const shedKey = target('shed-key', marker, [-2.5, 1.4, -12], [0.3, 0.27, 0.15]);
    const basementKey = target('basement-key', marker, [2.5, 1.4, -12], [0.3, 0.27, 0.15]);
    const basementDoor = target('basement-door', dark, [0, 1.1, -15], [2.2, 2.2, 0.18], true);

    const rampLength = BASEMENT_TOP - BASEMENT_END;
    const ramp = primitive(
        root,
        'Rampa del sótano',
        stone,
        [0, -1.38, -17.6],
        [BASEMENT_WIDTH, 0.16, Math.hypot(rampLength, BASEMENT_DEPTH)]
    );
    ramp.setLocalEulerAngles(-Math.atan2(BASEMENT_DEPTH, rampLength) * (180 / Math.PI), 0, 0);
    primitive(root, 'Piso del sótano', stone, [0, -2.7, -22.65], [BASEMENT_WIDTH, 0.2, 5.1]);
    solid('Contención sótano oeste', wood, [-2.69, 0.04, -20.17], [0.18, 5.5, 10.15]);
    solid('Contención sótano este', wood, [2.69, 0.04, -20.17], [0.18, 5.5, 10.15]);
    solid('Fondo del sótano', wood, [0, 0.04, -25.24], [5.4, 5.5, 0.18]);
    solid('Techo del sótano', dark, [0, 2.75, -20.17], [5.6, 0.16, 10.35]);
    solid('Cajón de repuestos', wood, [0, -2.02, -23.2], [1.1, 1.16, 0.8]);
    const crank = target('crank', marker, [0, -1.15, -23.2], [0.44, 0.3, 0.18]);

    solid('Cobertizo oeste', wood, [6, 1.4, -7.5], [0.18, 2.8, 5]);
    solid('Cobertizo este', wood, [12, 1.4, -7.5], [0.18, 2.8, 5]);
    solid('Cobertizo fondo', wood, [9, 1.4, -10], [6.18, 2.8, 0.18]);
    for (const x of [7, 11]) {
        solid('Cobertizo frente', wood, [x, 1.4, -5], [2, 2.8, 0.18]);
    }
    solid('Dintel del cobertizo', wood, [9, 2.52, -5], [2, 0.55, 0.18]);
    solid('Techo cobertizo', dark, [9, 2.85, -7.5], [6.5, 0.16, 5.5]);
    primitive(root, 'Baliza del cobertizo', amber, [9, 2.48, -4.86], [0.36, 0.27, 0.14]);
    numberPlate('shed-plate', 11, 1.55, -4.8, 7);
    const shedDoor = target('shed-door', dark, [9, 1.11, -5], [2, 2.22, 0.17], true);
    solid('Estante de fusibles', wood, [7.45, 0.55, -7.8], [0.95, 1.1, 0.58]);
    const fuse = target('fuse', marker, [7.45, 1.35, -7.8], [0.29, 0.23, 0.17]);
    target(
        'generator',
        metal,
        [generatorPosition.x, generatorPosition.y, generatorPosition.z],
        [1.3, 1.44, 1.04],
        true
    );
    const generatorLamp = primitive(root, 'Indicador del generador', red, [10.5, 1.15, -7.95], [0.25, 0.19, 0.04]);
    solid('Leña apilada', bark, [13.15, 0.32, -5.38], [1.25, 0.64, 0.68]);
    const fuel = target('fuel', marker, [12.75, 1.0, -4.5], [0.43, 0.59, 0.3]);

    const well = primitive(root, 'Pozo seco', stone, [-8, 0.45, -12], [2.25, 0.9, 2.25], 'cylinder');
    blockers.push({ center: [-8, 0.45, -12], size: [2.05, 0.9, 2.05], entity: well });
    primitive(root, 'Brocal oscuro', dark, [-8, 0.91, -12], [1.72, 0.04, 1.72], 'cylinder');
    solid('Soporte de la placa del pozo', bark, [-8, 0.75, -10.55], [0.17, 1.5, 0.17]);
    numberPlate('well-plate', -8, 1.5, -10.45, 1);

    solid('Pilar izquierdo', stone, [-2.65, 1.55, GATE_Z], [0.6, 3.1, 0.6]);
    solid('Pilar derecho', stone, [2.65, 1.55, GATE_Z], [0.6, 3.1, 0.6]);
    const gate = solid('Hoja de portón', metal, [0, 1.23, GATE_Z], [4.7, 2.46, 0.22]);
    target('gate-panel', red, [2.65, 1.55, 7.56], [0.46, 0.62, 0.28]);
    for (const y of [-0.42, 0.42]) {
        primitive(gate.entity, 'Travesaño', roof, [0, y, -0.57], [1.01, 0.065, 0.29]);
    }
    for (const x of [-0.4, -0.2, 0, 0.2, 0.4]) {
        primitive(gate.entity, 'Refuerzo de hoja', roof, [x, 0, -0.56], [0.028, 0.87, 0.3]);
    }
    primitive(root, 'Dintel de hormigón', stone, [0, 3.05, GATE_Z], [6.15, 0.26, 0.63]);
    primitive(root, 'Luminaria del portón', roof, [1.8, 2.87, 7.66], [0.54, 0.16, 0.37]);
    const gateLamp = primitive(root, 'Indicador del portón', red, [2.65, 1.73, 7.4], [0.27, 0.15, 0.05]);
    target('gate-crank', metal, [-2.65, 1.55, 7.56], [0.47, 0.5, 0.28]);
    const crankIndicator = primitive(root, 'Manivela instalada', marker, [-2.65, 1.55, 7.38], [0.31, 0.09, 0.13]);
    crankIndicator.enabled = false;
    solid('Cartel del kilómetro', dark, [4, 0.93, 6.8], [0.21, 1.86, 0.18]);
    // El cartel mira hacia la llegada, hacia el norte del portón.
    numberPlate('entry-plate', 4, 1.55, 6.6, 2, -1);

    app.scene.fog.type = FOG_LINEAR;
    app.scene.fog.color.copy(sky);
    app.scene.fog.start = 10;
    app.scene.fog.end = 37;
    app.scene.ambientLight = new Color(0.24, 0.3, 0.39);
    const moon = new Entity('Luz de luna');
    moon.addComponent('light', { type: 'directional', color: new Color(0.55, 0.73, 0.99), intensity: 0.73 });
    moon.setEulerAngles(47, -29, 20);
    root.addChild(moon);
    pointLight('Luz del porche', new Color(1, 0.55, 0.23), [0, 2.2, -5], 1.9, 7);
    pointLight('Luz interior', new Color(1, 0.66, 0.35), [0, 2.55, -10.5], 1.6, 7);
    pointLight('Luz del cobertizo', new Color(0.9, 0.82, 0.56), [9, 2.26, -6.5], 1.4, 7);
    pointLight('Luz del sótano', new Color(0.75, 0.76, 1), [0, -0.24, -23.4], 1.5, 7);
    const gateLight = pointLight('Luz del portón', new Color(0.58, 0.78, 0.95), [1.8, 2.65, 7.28], 0.23, 8);
    let generatorRunning = false;
    let gateOpen = false;
    let gateMotion = 0;
    let tensionSeen = false;
    let tensionTime = 0;
    let hasProgress = false;

    function update(dt: number) {
        if (gateOpen && gateMotion < 1) {
            gateMotion = Math.min(1, gateMotion + dt * 0.85);
            gate.entity.setLocalPosition(0, 1.23 + gateMotion * 3, GATE_Z);
            gate.center[1] = 1.23 + gateMotion * 3;
        }
        if (tensionTime > 0) tensionTime = Math.max(0, tensionTime - dt);
        if (gateLight.light) {
            const pulse = tensionTime > 0 ? Math.sin((tensionTime / 1.35) * Math.PI) * 0.85 : 0;
            gateLight.light.intensity = (generatorRunning ? 1.14 : 0.23) + pulse;
        }
    }

    function setProgress(progress: Progress) {
        shedDoor.entity.enabled = !progress.doors.shed;
        basementDoor.entity.enabled = !progress.doors.basement;
        shedKey.entity.enabled = !progress.items.shedKey;
        basementKey.entity.enabled = !progress.items.basementKey;
        fuse.entity.enabled = !progress.items.fuse;
        fuel.entity.enabled = !progress.items.fuelCan;
        crank.entity.enabled = !progress.items.gateCrank;
        crankIndicator.enabled = progress.gate.crankInstalled;
        generatorRunning = progress.generator.running;
        generatorLamp.render!.material = generatorRunning ? green : red;
        gateLamp.render!.material = generatorRunning ? green : red;
        if (hasProgress && progress.tensionSeen && !tensionSeen) tensionTime = 1.35;
        tensionSeen = progress.tensionSeen;
        gateOpen = progress.gate.open;
        if (!gateOpen || !hasProgress) {
            gateMotion = gateOpen ? 1 : 0;
            gate.center[1] = 1.23 + gateMotion * 3;
            gate.entity.setLocalPosition(0, gate.center[1], GATE_Z);
        }
        hasProgress = true;
        update(0);
    }

    function canWalkAt(x: number, z: number): boolean {
        if (Math.abs(x) > 15.8 || z < -25.8 || z > 12.6) return false;
        const feet = floorAt(x, z);
        return !blockers.some(
            ({ center, size, entity }) =>
                entity.enabled &&
                feet + 1.78 > center[1] - size[1] / 2 &&
                feet + 0.08 < center[1] + size[1] / 2 &&
                Math.abs(x - center[0]) < size[0] / 2 + PLAYER_RADIUS &&
                Math.abs(z - center[2]) < size[2] / 2 + PLAYER_RADIUS
        );
    }

    function getTarget(camera: Entity): TargetId | null {
        const origin = camera.getPosition();
        const direction = camera.forward;
        let best = INTERACTION_RANGE;
        for (const box of blockers) {
            if (box.entity.enabled) best = Math.min(best, rayDistance(box, origin, direction));
        }

        let id: TargetId | null = null;
        for (const [candidate, box] of targets) {
            if (!box.entity.enabled) continue;
            const hit = rayDistance(box, origin, direction);
            if (hit <= best) {
                best = hit;
                id = candidate;
            }
        }
        return id;
    }

    return {
        canWalkAt,
        getTarget,
        setProgress,
        update,
        settle() {
            tensionTime = 0;
            if (gateOpen) update(2);
        },
        basementAccessible: () => !basementDoor.entity.enabled
    };
}

export function getZone(x: number, z: number): 'gate' | 'exit' | null {
    if (Math.abs(x) < 2.1 && z >= 10) return 'exit';
    if (Math.abs(x) < 4.5 && z >= 5.25 && z < 8.4) return 'gate';
    return null;
}
