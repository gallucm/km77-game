import {
    ADDRESS_CLAMP_TO_EDGE,
    Color,
    FILTER_LINEAR,
    FILTER_LINEAR_MIPMAP_LINEAR,
    PIXELFORMAT_RGBA8,
    PIXELFORMAT_SRGBA8,
    StandardMaterial,
    Texture
} from 'playcanvas';
import type { AppBase } from 'playcanvas';

type RGB = [number, number, number];

function grain(x: number, y: number): number {
    let value = Math.imul(x, 374761393) + Math.imul(y, 668265263);
    value = Math.imul(value ^ (value >>> 13), 1274126177);
    return ((value ^ (value >>> 16)) >>> 0) / 4294967295;
}

function noise(u: number, v: number, columns: number, rows: number): number {
    const x = u * columns;
    const y = v * rows;
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const ax = x - ix;
    const ay = y - iy;
    const sx = ax * ax * (3 - 2 * ax);
    const sy = ay * ay * (3 - 2 * ay);
    const a = grain(ix, iy);
    const b = grain((ix + 1) % columns, iy);
    const c = grain(ix, (iy + 1) % rows);
    const d = grain((ix + 1) % columns, (iy + 1) % rows);
    return (a + (b - a) * sx) * (1 - sy) + (c + (d - c) * sx) * sy;
}

function texture(
    app: AppBase,
    name: string,
    size: number,
    pixels: Uint8Array,
    srgb: boolean,
    clamp = false
): Texture {
    const map = new Texture(app.graphicsDevice, {
        name,
        width: size,
        height: size,
        format: srgb ? PIXELFORMAT_SRGBA8 : PIXELFORMAT_RGBA8,
        minFilter: FILTER_LINEAR_MIPMAP_LINEAR,
        magFilter: FILTER_LINEAR,
        anisotropy: Math.min(4, app.graphicsDevice.maxAnisotropy),
        levels: [pixels]
    });
    if (clamp) {
        map.addressU = ADDRESS_CLAMP_TO_EDGE;
        map.addressV = ADDRESS_CLAMP_TO_EDGE;
    }
    app.once('destroy', () => map.destroy());
    return map;
}

function weathered(app: AppBase, name: string, base: RGB, deposit: RGB, concrete = false): StandardMaterial {
    const size = 256;
    const tones = new Uint8Array(size * size * 4);
    const detail = new Uint8Array(tones.length);
    const heights = new Float32Array(size * size);
    for (let y = 0; y < size; y += 1) {
        for (let x = 0; x < size; x += 1) {
            const index = y * size + x;
            const u = x / size;
            const v = y / size;
            const broad = noise(u, v, 5, 6);
            const spots = noise(u, v, 18, 24);
            const run = noise(u, v, 46, 5);
            const fine = grain(x + 29, y + 43);
            const stain = Math.min(1, Math.max(0, (0.58 * broad + 0.28 * spots + 0.14 * run - 0.48) * 4));
            const flake = stain > 0.28 && fine > 0.87 ? 14 * (fine - 0.87) / 0.13 : 0;
            const surface = (broad - 0.5) * 21 + (spots - 0.5) * 15 + (fine - 0.5) * 18 + flake;
            for (let channel = 0; channel < 3; channel += 1) {
                const tint = base[channel] + (deposit[channel] - base[channel]) * stain;
                tones[4 * index + channel] = Math.max(0, Math.min(255, tint + surface));
            }
            tones[4 * index + 3] = 255;
            heights[index] = 1 - stain * 0.32 + (spots - 0.5) * 0.28 + (fine - 0.5) * (concrete ? 0.33 : 0.16);
            detail[4 * index + 3] = concrete ? 39 : 141 - stain * 103;
        }
    }

    for (let y = 0; y < size; y += 1) {
        for (let x = 0; x < size; x += 1) {
            const index = (y * size + x) * 4;
            const left = heights[y * size + ((x + size - 1) % size)];
            const right = heights[y * size + ((x + 1) % size)];
            const top = heights[((y + size - 1) % size) * size + x];
            const bottom = heights[((y + 1) % size) * size + x];
            const dx = (left - right) * 0.45;
            const dy = (top - bottom) * 0.45;
            const length = Math.hypot(dx, dy, 1);
            detail[index] = 127.5 + (dx / length) * 127.5;
            detail[index + 1] = 127.5 + (dy / length) * 127.5;
            detail[index + 2] = 127.5 + 127.5 / length;
        }
    }

    const surface = new StandardMaterial();
    surface.name = name;
    surface.diffuseMap = texture(app, `${name} · color`, size, tones, true);
    surface.normalMap = texture(app, `${name} · normal y brillo`, size, detail, false);
    surface.bumpiness = concrete ? 0.95 : 0.75;
    surface.glossMap = surface.normalMap;
    surface.glossMapChannel = 'a';
    surface.gloss = 1;
    surface.useMetalness = true;
    surface.metalness = concrete ? 0 : 0.16;
    surface.update();
    app.once('destroy', () => surface.destroy());
    return surface;
}

export const gatePlates = {
    property: [0, 0.25],
    control: [0.25, 0.5],
    release: [0.5, 0.75]
} as const;

function signs(app: AppBase): StandardMaterial {
    const canvas = document.createElement('canvas');
    const size = 512;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const surface = new StandardMaterial();
    surface.name = 'Portón · señalética esmaltada';
    if (ctx) {
        for (const [row, title, detail, background, ink] of [
            [0, 'KM 17', 'PROPIEDAD FORESTAL', '#ddd1aa', '#2b3128'],
            [1, 'CONTROL DEL PORTÓN', 'CUADRO DE MANIOBRA', '#727c77', '#1e2826'],
            [2, 'LIBERACIÓN MANUAL', 'ACOPLE DE MANIVELA', '#c2a25f', '#332919']
        ] as const) {
            const y = row * 128;
            ctx.fillStyle = background;
            ctx.fillRect(0, y, 512, 128);
            ctx.strokeStyle = ink;
            ctx.lineWidth = 3;
            ctx.strokeRect(13, y + 12, 486, 104);
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = ink;
            ctx.font = row === 0 ? 'bold 57px sans-serif' : 'bold 37px sans-serif';
            ctx.fillText(title, 256, y + 52, 450);
            ctx.font = 'bold 20px sans-serif';
            ctx.fillText(detail, 256, y + 94);
            for (let i = 0; i < 150; i += 1) {
                const x = Math.floor(grain(i, 8 + row) * 512);
                const dy = Math.floor(grain(i, 19) * 128);
                const edge = Math.min(x, 511 - x, dy, 127 - dy);
                ctx.fillStyle = edge < 13 ? 'rgba(77, 51, 35, 0.46)' : 'rgba(41, 33, 26, 0.12)';
                ctx.fillRect(x, y + dy, 1 + grain(i, 25) * 7, 1 + grain(i, 42) * 3);
            }
        }
        const pixels = new Uint8Array(ctx.getImageData(0, 0, size, size).data);
        const map = texture(app, surface.name, size, pixels, true, true);
        surface.diffuseMap = map;
        surface.emissiveMap = map;
        surface.emissive = new Color(1, 1, 1);
        surface.emissiveIntensity = 0.055;
    }
    surface.gloss = 0.19;
    surface.update();
    app.once('destroy', () => surface.destroy());
    return surface;
}

export function gateSurfaces(app: AppBase) {
    return {
        sheet: weathered(app, 'Portón · galvanizado envejecido', [118, 129, 128], [130, 76, 46]),
        steel: weathered(app, 'Portón · esmalte azul grisáceo', [79, 93, 99], [122, 71, 43]),
        concrete: weathered(app, 'Portón · hormigón poroso', [150, 148, 132], [100, 109, 91], true),
        signs: signs(app)
    };
}
