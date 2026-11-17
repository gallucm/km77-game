import { Entity, Geometry, Mesh, MeshInstance, Vec3 } from 'playcanvas';
import type { AppBase, StandardMaterial } from 'playcanvas';

import type { Point } from '../common';
import { gatePlates, gateSurfaces } from './gate-surfaces';

type UV = [number, number];
type Plate = (typeof gatePlates)[keyof typeof gatePlates];

class GateMesh {
    private readonly batches = new Map<
        StandardMaterial,
        { positions: number[]; normals: number[]; uvs: number[]; indices: number[] }
    >();

    private face(surface: StandardMaterial, points: Point[], coordinates?: UV[]): void {
        let batch = this.batches.get(surface);
        if (!batch) {
            batch = { positions: [], normals: [], uvs: [], indices: [] };
            this.batches.set(surface, batch);
        }
        const [a, b, c] = points;
        const ab = new Vec3(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
        const ac = new Vec3(c[0] - a[0], c[1] - a[1], c[2] - a[2]);
        const normal = new Vec3().cross(ab, ac).normalize();
        const [nx, ny, nz] = [Math.abs(normal.x), Math.abs(normal.y), Math.abs(normal.z)];
        const start = batch.positions.length / 3;
        for (const [i, point] of points.entries()) {
            const [x, y, z] = point;
            const uv = coordinates?.[i] ?? (nx > ny && nx > nz ? [z, y] : ny > nz ? [x, z] : [x, y]);
            batch.positions.push(...point);
            batch.normals.push(normal.x, normal.y, normal.z);
            batch.uvs.push(...uv);
        }
        for (let i = 1; i < points.length - 1; i += 1) batch.indices.push(start, start + i, start + i + 1);
    }

    private shell(surface: StandardMaterial, rings: Point[][]): void {
        const first = rings[0];
        this.face(surface, [...first].reverse());
        for (let s = 1; s < rings.length; s += 1) {
            const previous = rings[s - 1];
            const ring = rings[s];
            for (let i = 0; i < ring.length; i += 1) {
                const j = (i + 1) % ring.length;
                this.face(surface, [previous[i], previous[j], ring[j], ring[i]]);
            }
        }
        this.face(surface, rings[rings.length - 1]);
    }

    box(surface: StandardMaterial, center: Point, size: Point, bevel: number, angle = 0): void {
        const [x, y, z] = center;
        const [w, h, d] = size.map((value) => value * 0.5);
        const inset = Math.min(bevel, w * 0.4, h * 0.4, d * 0.4);
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const rings = [
            [-d, inset],
            [-d + inset, 0],
            [d - inset, 0],
            [d, inset]
        ].map(([depth, edge]) => {
            const l = -w + edge;
            const r = w - edge;
            const b = -h + edge;
            const t = h - edge;
            const corner = inset * (edge ? 0.5 : 1);
            const outline = [[l + corner, b], [r - corner, b], [r, b + corner], [r, t - corner],
                [r - corner, t], [l + corner, t], [l, t - corner], [l, b + corner]];
            return outline.map<Point>(([u, v]) => [x + u * cos - v * sin, y + u * sin + v * cos, z + depth]);
        });
        this.shell(surface, rings);
    }

    bar(surface: StandardMaterial, start: Point, end: Point, width: number, depth: number): void {
        const [x, y, z] = start;
        const [tx, ty] = end;
        this.box(surface, [(x + tx) / 2, (y + ty) / 2, z], [Math.hypot(tx - x, ty - y), width, depth],
            Math.min(width, depth) / 6, Math.atan2(ty - y, tx - x));
    }

    pin(surface: StandardMaterial, [x, y, z]: Point, radius: number, depth: number, sides = 12, alongX = false): void {
        const rings = [
            [-depth * 0.5, radius * 0.82],
            [-depth * 0.36, radius],
            [depth * 0.36, radius],
            [depth * 0.5, radius * 0.82]
        ].map(([offset, r]) => Array.from({ length: sides }, (_, index): Point => {
            const angle = index * 2 * Math.PI / sides;
            const u = Math.cos(angle) * r;
            const v = Math.sin(angle) * r;
            return alongX ? [x + offset, y + u, z + v] : [x + u, y + v, z + offset];
        }));
        this.shell(surface, rings);
    }

    corrugation(surface: StandardMaterial): void {
        const pitch = 4.48 / 22;
        for (let i = 0; i < 22; i += 1) {
            const x = -2.24 + i * pitch;
            const profile = [[x, 0.043], [x + pitch * 0.20, -0.036],
                [x + pitch * 0.80, -0.036], [x + pitch, 0.043]];
            for (let j = 1; j < profile.length; j += 1) {
                const [left, a] = profile[j - 1];
                const [right, b] = profile[j];
                this.face(surface, [[right, -1.15, b], [left, -1.15, a], [left, 1.15, a], [right, 1.15, b]]);
                this.face(surface, [[left, -1.15, a + 0.018], [right, -1.15, b + 0.018],
                    [right, 1.15, b + 0.018], [left, 1.15, a + 0.018]]);
            }
        }
    }

    plaque(surface: StandardMaterial, [x, y, z]: Point, width: number, height: number, [top, bottom]: Plate): void {
        const right = x + width / 2;
        const left = x - width / 2;
        const high = y + height / 2;
        const low = y - height / 2;
        const margin = 2 / 512;
        this.face(surface, [[right, low, z], [left, low, z], [left, high, z], [right, high, z]],
            [[margin, bottom - margin], [1 - margin, bottom - margin], [1 - margin, top + margin], [margin, top + margin]]);
    }

    attach(app: AppBase, root: Entity): void {
        const instances: MeshInstance[] = [];
        for (const [surface, batch] of this.batches) {
            const geometry = Object.assign(new Geometry(), batch);
            if (surface.normalMap) geometry.calculateTangents();
            const mesh = Mesh.fromGeometry(app.graphicsDevice, geometry);
            instances.push(new MeshInstance(mesh, surface, root));
        }
        root.addComponent('render', { meshInstances: instances });
    }
}

export function buildGateModel(
    app: AppBase,
    fixed: Entity,
    leaf: Entity,
    crank: Entity,
    iron: StandardMaterial,
    rubber: StandardMaterial
): void {
    const { sheet, steel, concrete, signs } = gateSurfaces(app);
    const moving = new GateMesh();
    moving.corrugation(sheet);
    for (const y of [-1.16, 1.16]) {
        moving.box(steel, [0, y, 0], [4.68, 0.14, 0.206], 0.012);
    }
    for (const x of [-2.265, 2.265]) {
        moving.box(steel, [x, 0, 0], [0.15, 2.32, 0.206], 0.012);
        for (const y of [-0.87, 0.87]) {
            moving.box(iron, [x, y, 0], [0.15, 0.17, 0.19], 0.008);
            moving.pin(rubber, [x, y, -0.099], 0.025, 0.014, 8);
        }
    }
    for (const y of [-0.69, -0.23, 0.23, 0.69]) {
        moving.box(steel, [0, y, -0.069], [4.45, 0.044, 0.065], 0.007);
        for (let x = -2; x <= 2; x += 0.5) moving.pin(iron, [x, y, -0.102], 0.012, 0.012, 6);
    }
    for (const side of [-1, 1]) {
        moving.bar(steel, [0, -1.073, 0.083], [side * 2.19, 1.085, 0.083], 0.072, 0.045);
    }
    moving.box(steel, [0, 0.45, -0.071], [0.98, 0.26, 0.076], 0.012);
    moving.plaque(signs, [0, 0.45, -0.111], 0.95, 0.235, gatePlates.property);
    for (const x of [-0.448, 0.448]) {
        moving.pin(iron, [x, 0.45, -0.119], 0.012, 0.012, 6);
    }
    moving.attach(app, leaf);

    const frame = new GateMesh();
    for (const side of [-1, 1]) {
        const x = side * 2.65;
        const track = side * 2.4;
        frame.box(concrete, [x, 1.55, 0], [0.6, 3.1, 0.6], 0.028);
        frame.box(concrete, [x + side * 0.035, 0.13, 0], [0.67, 0.26, 0.60], 0.025);
        frame.box(steel, [x, 4.36, 0.05], [0.36, 2.56, 0.40], 0.025);
        frame.box(steel, [track, 2.77, 0.012], [0.15, 5.54, 0.26], 0.012);
        frame.box(iron, [track, 2.77, -0.151], [0.10, 5.48, 0.088], 0.009);
        frame.box(iron, [track, 2.77, 0.174], [0.10, 5.48, 0.088], 0.009);
        for (const y of [0.27, 0.9, 2.08, 2.7, 3.57, 4.27, 5.04]) {
            frame.box(steel, [track + side * 0.085, y, -0.182], [0.183, 0.125, 0.084], 0.012);
            frame.pin(iron, [track + side * 0.135, y, -0.224], 0.024, 0.025, 6);
        }
        frame.box(steel, [x, 3.108, 0.05], [0.50, 0.075, 0.51], 0.012);
        for (const offset of [-0.215, 0.215]) frame.box(iron, [x + offset, 3.16, -0.137], [0.056, 0.095, 0.056], 0.006);
        frame.box(rubber, [side * 2.345, 2.82, -0.095], [0.022, 5.50, 0.025], 0.004);
    }
    frame.box(steel, [0, 5.64, 0.05], [5.78, 0.29, 0.42], 0.019);
    frame.box(steel, [0, 5.82, 0.05], [5.88, 0.085, 0.49], 0.012);
    frame.pin(iron, [0, 5.65, -0.292], 0.045, 4.89, 12, true);
    for (const x of [-2.345, 2.345]) {
        frame.box(steel, [x, 5.66, -0.175], [0.28, 0.33, 0.28], 0.022);
        frame.pin(iron, [x, 5.65, -0.297], 0.127, 0.17, 20, true);
    }
    frame.box(steel, [0, 5.67, -0.29], [0.33, 0.31, 0.29], 0.035);
    frame.pin(steel, [0.30, 5.67, -0.30], 0.128, 0.36, 20, true);
    for (let i = 0; i < 5; i += 1) frame.pin(iron, [0.171 + 0.063 * i, 5.67, -0.30], 0.135, 0.021, 20, true);
    frame.pin(iron, [0.49, 5.67, -0.30], 0.112, 0.047, 20, true);
    frame.box(steel, [1.8, 2.87, -0.305], [0.51, 0.14, 0.30], 0.024);
    frame.box(iron, [1.8, 2.855, -0.454], [0.414, 0.095, 0.035], 0.010);

    frame.box(steel, [2.65, 1.55, -0.442], [0.46, 0.62, 0.25], 0.027);
    frame.box(iron, [2.65, 1.55, -0.574], [0.402, 0.565, 0.052], 0.017);
    frame.box(rubber, [2.65, 1.728, -0.605], [0.137, 0.073, 0.033], 0.007);
    frame.plaque(signs, [2.65, 1.822, -0.602], 0.33, 0.0825, gatePlates.control);
    for (let row = 0; row < 4; row += 1) {
        for (let column = -1; column <= 1; column += 1) {
            frame.box(steel, [2.65 + column * 0.071, 1.40 + row * 0.064, -0.610], [0.053, 0.048, 0.022], 0.005);
        }
    }
    frame.box(rubber, [2.65, 0.65, -0.304], [0.033, 1.21, 0.033], 0.005);

    frame.box(steel, [-2.65, 1.55, -0.415], [0.466, 0.492, 0.216], 0.028);
    frame.box(iron, [-2.65, 1.543, -0.534], [0.409, 0.405, 0.039], 0.010);
    frame.plaque(signs, [-2.65, 1.708, -0.557], 0.35, 0.0875, gatePlates.release);
    frame.pin(steel, [-2.65, 1.54, -0.58], 0.081, 0.063, 20);
    frame.pin(rubber, [-2.65, 1.54, -0.615], 0.049, 0.017, 8);
    for (const x of [-2.805, -2.495, 2.492, 2.808]) {
        const depth = x > 0 ? -0.604 : -0.564;
        for (const y of [1.37, 1.761]) frame.pin(steel, [x, y, depth], 0.013, 0.016, 6);
    }
    frame.attach(app, fixed);

    const handle = new GateMesh();
    handle.pin(iron, [0, 0, -0.037], 0.032, 0.106, 12);
    handle.bar(steel, [0, 0, -0.087], [0.16, -0.113, -0.087], 0.046, 0.044);
    handle.pin(iron, [0.16, -0.113, -0.146], 0.019, 0.133, 10);
    handle.pin(rubber, [0.16, -0.113, -0.199], 0.030, 0.108, 12);
    handle.attach(app, crank);
}
