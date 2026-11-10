import { FOG_LINEAR, StandardMaterial } from 'playcanvas';
import type { AppBase, Color, Entity, Vec3 } from 'playcanvas';

import type { Checkpoint, Progress, TargetId } from '../progress';

export type Point = [x: number, y: number, z: number];

export interface Box {
    center: Point;
    size: Point;
    entity: Entity;
}

export const checkpoints = {
    spawn: { x: 0, z: 4.5, yaw: 180 },
    gate: { x: 0, z: 5.7, yaw: 180 },
    cabin: { x: 0, z: -7.2, yaw: 0 },
    shed: { x: 9, z: -3.3, yaw: 0 },
    basement: { x: 0, z: -21.2, yaw: 0 }
} satisfies Record<Checkpoint, { x: number; z: number; yaw: number }>;

export const GATE_Z = 8;
export const PLAYER_RADIUS = 0.24;
export const INTERACTION_RANGE = 2.5;
export const AXES = ['x', 'y', 'z'] as const;
export const BASEMENT_TOP = -15.1;
export const BASEMENT_END = -20.1;
export const BASEMENT_DEPTH = 2.6;
export const BASEMENT_WIDTH = 5.2;

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

export function getZone(x: number, z: number): 'gate' | 'exit' | null {
    if (Math.abs(x) < 2.1 && z >= 10) return 'exit';
    if (Math.abs(x) < 4.5 && z >= 5.25 && z < 8.4) return 'gate';
    return null;
}

export function material(name: string, color: Color, glow = 0): StandardMaterial {
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

export { FOG_LINEAR };
export type { AppBase, Vec3 };
export type { TargetId, Progress };
