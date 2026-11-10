import { Color, Entity } from 'playcanvas';
import type { AppBase, ContainerResource, StandardMaterial, Vec3 } from 'playcanvas';

import { bakeBasementLightmap, bakeInteriorLightmap, paintMaterials } from '../level-decoration';
import type { Progress, TargetId } from '../progress';

import { AXES, GATE_Z, INTERACTION_RANGE, PLAYER_RADIUS, floorAt, material } from './common';
import type { Box, Point } from './common';
import type { LevelContext, LevelRefs } from './types';
import { buildBasement } from './zones/basement';
import { buildCabin } from './zones/cabin';
import type { CabinKeyModels } from './zones/cabin';
import { buildGate } from './zones/gate';
import { buildLighting } from './zones/lighting';
import { buildPerimeter } from './zones/perimeter';
import { buildShed } from './zones/shed';
import { buildTrees } from './zones/trees';
import { buildWell } from './zones/well';

export * from './common';
export type { LevelContext, LevelRefs } from './types';

export interface LevelHandle {
    canWalkAt(x: number, z: number): boolean;
    getTarget(camera: Entity): TargetId | null;
    setProgress(progress: Progress): void;
    update(dt: number): void;
    settle(): void;
    basementAccessible(): boolean;
    zones: { basement: { enabled: boolean } };
}

export function buildLevel(
    app: AppBase,
    sky = new Color(0.055, 0.103, 0.132),
    forest?: ContainerResource[],
    keys?: CabinKeyModels,
    grass?: ContainerResource,
    fuel?: ContainerResource,
    equipment?: { generator?: ContainerResource; fuse?: ContainerResource }
): LevelHandle {
    const root = app.root;
    const blockers: Box[] = [];
    const targets = new Map<TargetId, Box>();

    const ground = material('Tierra fría', grass ? new Color(0.19, 0.23, 0.16) : new Color(0.23, 0.29, 0.27));
    const path = material('Camino', new Color(0.39, 0.35, 0.31));
    const wood = material('Tablas envejecidas', new Color(0.56, 0.42, 0.32));
    const dark = material('Madera oscura', new Color(0.29, 0.25, 0.22));
    const plaster = material('Yeso desgastado', new Color(0.72, 0.7, 0.66));
    const ceiling = material('Madera oscura techo', new Color(0.24, 0.2, 0.17));
    const metal = material('Acero', new Color(0.46, 0.5, 0.52));
    const stone = material('Piedra', new Color(0.35, 0.38, 0.36));
    const bark = material('Tronco', new Color(0.2, 0.16, 0.13));
    const needles = material('Pino', new Color(0.18, 0.28, 0.25));
    const fir = material('Abeto', new Color(0.14, 0.22, 0.22));
    const roof = material('Chapa azul', new Color(0.2, 0.26, 0.3));
    const trim = material('Marcos de roble', new Color(0.47, 0.33, 0.25));
    const clue = material('Papel', new Color(0.85, 0.69, 0.42), 0.22);
    const digits = material('Cifras', new Color(0.88, 0.82, 0.67), 0.24);
    const marker = material('Herramientas', new Color(0.92, 0.48, 0.18), 0.2);
    const red = material('Sin alimentación', new Color(0.25, 0.19, 0.17));
    const green = material('Energía restaurada', new Color(0.25, 0.79, 0.44), 0.48);
    const amber = material('Baliza', new Color(0.96, 0.55, 0.25), 0.48);

    const porchFloor = wood.clone();
    porchFloor.name = 'Porche con luz horneada';
    porchFloor.lightMap = paintMaterials(app, { ground, path, wood, metal, stone, plaster, ceiling, bark });
    porchFloor.diffuseMap = wood.diffuseMap;
    porchFloor.diffuseMapTiling.set(2, 1);
    porchFloor.lightMapUv = 0;
    porchFloor.update();

    const interiorLightmap = bakeInteriorLightmap(app);
    const basementLightmap = bakeBasementLightmap(app);
    const cabinFloor = wood.clone();
    cabinFloor.name = 'Tarima interior con luz horneada';
    cabinFloor.lightMap = interiorLightmap;
    cabinFloor.diffuseMap = wood.diffuseMap;
    cabinFloor.diffuseMapTiling.set(2, 2);
    cabinFloor.lightMapUv = 0;
    cabinFloor.update();
    const basementFloor = stone.clone();
    basementFloor.name = 'Piso del sótano con luz horneada';
    basementFloor.lightMap = basementLightmap;
    basementFloor.diffuseMap = stone.diffuseMap;
    basementFloor.diffuseMapTiling.set(2, 2);
    basementFloor.lightMapUv = 0;
    basementFloor.update();

    const basementEntities: Entity[] = [];

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

    function solid(name: string, surface: StandardMaterial, center: Point, size: Point): Box {
        const box = { center, size, entity: primitive(root, name, surface, center, size) };
        blockers.push(box);
        return box;
    }

    function target(id: TargetId, surface: StandardMaterial, center: Point, size: Point, blocks = false): Box {
        const box = blocks
            ? solid(id, surface, center, size)
            : { center, size, entity: primitive(root, id, surface, center, size) };
        targets.set(id, box);
        return box;
    }

    function pointLight(name: string, color: Color, position: Point, intensity: number, range: number): Entity {
        const light = new Entity(name);
        light.addComponent('light', { type: 'omni', color, intensity, range });
        light.setPosition(...position);
        root.addChild(light);
        return light;
    }

    function numberPlate(id: TargetId, x: number, y: number, z: number, digit: 1 | 2 | 4 | 7, facing = 1): void {
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
        const activeSegments = { 1: [1, 2], 2: [0, 1, 6, 4, 3], 4: [5, 6, 1, 2], 7: [0, 1, 2] } as const;
        for (const index of activeSegments[digit]) {
            const [dx, dy, width, height] = segments[index];
            primitive(root, `${id} cifra`, digits, [x + dx * facing, y + dy, z + 0.06 * facing], [width, height, 0.02]);
        }
    }

    const ctx: LevelContext = {
        app,
        root,
        sky,
        blockers,
        targets,
        ground,
        path,
        wood,
        dark,
        plaster,
        ceiling,
        metal,
        stone,
        bark,
        needles,
        fir,
        roof,
        trim,
        clue,
        digits,
        marker,
        red,
        green,
        amber,
        porchFloor,
        cabinFloor,
        basementFloor,
        basementEntities,
        primitive,
        solid,
        target,
        pointLight,
        numberPlate
    };

    const refs: Partial<LevelRefs> = {};
    Object.assign(refs, buildPerimeter(ctx, grass));
    Object.assign(refs, buildCabin(ctx, keys));
    Object.assign(refs, buildBasement(ctx));
    Object.assign(refs, buildShed(ctx, fuel, equipment));
    Object.assign(refs, buildWell(ctx));
    Object.assign(refs, buildGate(ctx));
    Object.assign(refs, buildTrees(ctx, forest));
    Object.assign(refs, buildLighting(ctx));

    // Disable basement entities initially (lazy activation).
    for (const entity of basementEntities) entity.enabled = false;

    const r = refs as LevelRefs;

    const zones = { basement: { enabled: false } };

    let generatorRunning = false;
    let gateOpen = false;
    let gateMotion = 0;
    let tensionSeen = false;
    let tensionTime = 0;
    let hasProgress = false;
    let basementEnabled = false;

    function enableBasement(): void {
        if (basementEnabled) return;
        for (const entity of basementEntities) entity.enabled = true;
        basementEnabled = true;
        zones.basement.enabled = true;
    }

    function rayDistance(box: Box, origin: Vec3, direction: Vec3): number {
        let near = 0;
        let far = INTERACTION_RANGE;
        for (let index = 0; index < AXES.length; index += 1) {
            const axis = AXES[index];
            const min = box.center[index] - box.size[index] / 2;
            const max = box.center[index] + box.size[index] / 2;
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

    function update(dt: number): void {
        if (gateOpen && gateMotion < 1) {
            gateMotion = Math.min(1, gateMotion + dt * 0.85);
            r.gate.entity.setLocalPosition(0, 1.23 + gateMotion * 3, GATE_Z);
            r.gate.center[1] = 1.23 + gateMotion * 3;
        }
        if (tensionTime > 0) tensionTime = Math.max(0, tensionTime - dt);
        if (r.gateLight.light) {
            const pulse = tensionTime > 0 ? Math.sin((tensionTime / 1.35) * Math.PI) * 0.85 : 0;
            r.gateLight.light.intensity = (generatorRunning ? 1.14 : 0.23) + pulse;
        }
    }

    function setProgress(progress: Progress): void {
        if (progress.doors.basement) enableBasement();
        r.shedDoor.entity.enabled = !progress.doors.shed;
        r.basementDoor.entity.enabled = !progress.doors.basement;
        r.shedKey.entity.enabled = !progress.items.shedKey;
        r.basementKey.entity.enabled = !progress.items.basementKey;
        r.fuse.entity.enabled = !progress.items.fuse;
        r.fuel.entity.enabled = !progress.items.fuelCan;
        r.crank.entity.enabled = !progress.items.gateCrank;
        r.crankIndicator.enabled = progress.gate.crankInstalled;
        generatorRunning = progress.generator.running;
        r.generatorLamp.render!.material = generatorRunning ? green : red;
        r.gateLamp.render!.material = generatorRunning ? green : red;
        if (hasProgress && progress.tensionSeen && !tensionSeen) tensionTime = 1.35;
        tensionSeen = progress.tensionSeen;
        gateOpen = progress.gate.open;
        if (!gateOpen || !hasProgress) {
            gateMotion = gateOpen ? 1 : 0;
            r.gate.center[1] = 1.23 + gateMotion * 3;
            r.gate.entity.setLocalPosition(0, r.gate.center[1], GATE_Z);
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
        basementAccessible: () => !r.basementDoor.entity.enabled,
        zones
    };
}
