import { writeFile } from 'node:fs/promises';

import { expect, test } from '@playwright/test';
import type { Page, TestInfo } from '@playwright/test';

const url = '/?renderer=webgl2&diagnostics=1';
const degrees = 180 / Math.PI;
const sensitivity = 0.14;

function pose(page: Page) {
    return page.locator('#game-canvas').evaluate(({ dataset }) => ({
        x: Number(dataset.x),
        y: Number(dataset.y),
        z: Number(dataset.z),
        yaw: Number(dataset.yaw),
        pitch: Number(dataset.pitch)
    }));
}

async function look(page: Page, yaw: number, pitch: number) {
    const current = await pose(page);
    const turn = ((((yaw - current.yaw) % 360) + 540) % 360) - 180;
    await page.evaluate(
        ({ movementX, movementY }) => {
            document.dispatchEvent(new MouseEvent('mousemove', { movementX, movementY }));
        },
        { movementX: Math.round(-turn / sensitivity), movementY: Math.round((current.pitch - pitch) / sensitivity) }
    );
    await expect
        .poll(
            async () => {
                const updated = await pose(page);
                return Math.abs(((((updated.yaw - yaw + 540) % 360) + 360) % 360) - 180);
            },
            { intervals: [20, 30] }
        )
        .toBeLessThan(0.3);
}

async function walk(page: Page, x: number, z: number, tolerance = 0.22) {
    const from = await pose(page);
    const dx = x - from.x;
    const dz = z - from.z;
    const distance = Math.hypot(dx, dz);
    if (distance <= tolerance) return;
    await look(page, Math.atan2(-dx, -dz) * degrees, 0);
    await page.keyboard.down('KeyW');
    try {
        await page.waitForFunction(
            ({ x, z, dx, dz, distance }) => {
                const { dataset } = document.querySelector<HTMLCanvasElement>('#game-canvas')!;
                const remaining = (x - Number(dataset.x)) * dx + (z - Number(dataset.z)) * dz;
                return remaining / distance <= 0.1;
            },
            { x, z, dx, dz, distance },
            { timeout: 5_000 + distance * 2_000 }
        );
    } catch (error) {
        throw new Error(
            `Caminar hacia (${x}, ${z}) desde (${from.x}, ${from.z}). Pose actual: ${JSON.stringify(await pose(page))}`,
            { cause: error }
        );
    } finally {
        await page.keyboard.up('KeyW');
    }
    const current = await pose(page);
    expect(Math.hypot(x - current.x, z - current.z)).toBeLessThan(tolerance + 0.2);
}

async function target(page: Page, id: string, x: number, y: number, z: number) {
    const current = await pose(page);
    const yaw = Math.atan2(current.x - x, current.z - z) * degrees;
    const pitch = Math.atan2(y - current.y, Math.hypot(x - current.x, z - current.z)) * degrees;
    await look(page, yaw, pitch);
    await expect(page.locator('#game-canvas')).toHaveAttribute('data-target', id);
}

async function use(page: Page, id: string, x: number, y: number, z: number) {
    await target(page, id, x, y, z);
    await page.keyboard.press('KeyE');
}

async function backToGame(page: Page) {
    await page.getByRole('button', { name: 'Volver al predio' }).click();
    await expect(page.locator('#game-canvas')).toHaveAttribute('data-active', 'true');
}

async function capture(page: Page, testInfo: TestInfo, name: string) {
    const path = testInfo.outputPath(name + '.png');
    await page.screenshot({ path });
    await testInfo.attach(name, { path, contentType: 'image/png' });
}

test.use({ viewport: { width: 800, height: 450 } });

test('G1 · deduce el código, guarda con el seguro puesto y escapa al continuar', async ({ page }, testInfo) => {
    test.setTimeout(220_000);
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
    });
    await page.goto(url);
    await page.getByRole('button', { name: 'Iniciar' }).click();
    await expect(page.locator('#game-canvas')).toHaveAttribute('data-active', 'true');

    await walk(page, 2.65, 6.1);
    await use(page, 'gate-panel', 2.65, 1.55, 7.65);
    await expect(page.locator('#inspection-body')).toContainText('sin alimentación');
    await backToGame(page);
    await use(page, 'entry-plate', 4, 1.55, 6.6);
    await expect(page.locator('#inspection-body')).toContainText('2');
    await backToGame(page);

    await walk(page, -0.65, -4.7);
    await use(page, 'cabin-plate', -2.5, 1.55, -5.82);
    await expect(page.locator('#inspection-body')).toContainText('4');
    await backToGame(page);
    await walk(page, 0, -8.2);
    await use(page, 'map', -2, 1.4, -9);
    await expect(page.locator('#inspection-title')).toHaveText('Croquis de la finca');
    await backToGame(page);
    await use(page, 'log', 2, 1.4, -9);
    await expect(page.locator('#inspection-body')).toContainText('23:47');
    await backToGame(page);
    await walk(page, 0, -11.5);
    await walk(page, -0.65, -11.5);
    await use(page, 'shed-key', -2.5, 1.4, -12);
    await walk(page, 0.65, -11.5);
    await use(page, 'basement-key', 2.5, 1.4, -12);
    await page.keyboard.press('Tab');
    await expect(page.locator('#inspection-body')).toContainText('Llave del sótano');
    await backToGame(page);

    await walk(page, 0, -13.3);
    await use(page, 'basement-door', 0, 1.3, -15);
    await walk(page, 0, -21.8);
    await use(page, 'crank', 0, -1.15, -23.2);
    await expect(page.locator('#feedback')).toContainText('manivela');
    await walk(page, 0, -4.4);
    await walk(page, -5.3, -4.4);
    await walk(page, -8, -8.9);
    await use(page, 'well-plate', -8, 1.5, -10.45);
    await expect(page.locator('#inspection-body')).toContainText('1');
    await backToGame(page);

    await walk(page, -5, -4.1);
    await walk(page, 9, -3.5);
    await use(page, 'shed-plate', 11, 1.55, -4.8);
    await expect(page.locator('#inspection-body')).toContainText('7');
    await backToGame(page);
    await walk(page, 11.7, -3.6);
    await use(page, 'fuel', 12.75, 1, -4.5);
    await walk(page, 9, -3.6);
    await use(page, 'shed-door', 9, 1.35, -5);
    await walk(page, 9, -6.8);
    await use(page, 'fuse', 7.45, 1.35, -7.8);
    await target(page, 'generator', 10.5, 1.25, -8.5);
    await page.keyboard.press('KeyE');
    await expect(page.locator('#feedback')).toContainText('fusible');
    await page.keyboard.press('KeyE');
    await expect(page.locator('#feedback')).toContainText('combustible');
    await page.keyboard.press('KeyE');
    await expect(page.locator('#feedback')).toContainText('corriente');

    await walk(page, 9, -3.4);
    await walk(page, 2.65, 6.1);
    await expect(page.locator('#feedback')).toContainText('golpe seco');
    await look(page, 180, 0);
    await testInfo.attach('G2 · vuelta al portón con corriente', {
        body: await page.screenshot(),
        contentType: 'image/png'
    });
    await use(page, 'gate-panel', 2.65, 1.55, 7.65);
    await page.getByLabel('Código de cuatro cifras').fill('0000');
    await page.getByRole('button', { name: 'Confirmar' }).click();
    await expect(page.locator('#code-result')).toContainText('incorrecto');
    await page.getByLabel('Código de cuatro cifras').fill('2471');
    await page.getByRole('button', { name: 'Confirmar' }).click();
    await expect(page.locator('#inspection-body')).toContainText('Liberá el seguro');

    await page.reload();
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page.locator('#game-canvas')).toHaveAttribute('data-active', 'true');
    await walk(page, 2.65, 6.1);
    await use(page, 'gate-panel', 2.65, 1.55, 7.65);
    await expect(page.locator('#inspection-body')).toContainText('seguro manual sigue puesto');
    await backToGame(page);

    await walk(page, -2.65, 6.1);
    await target(page, 'gate-crank', -2.65, 1.55, 7.65);
    await page.keyboard.press('KeyE');
    await expect(page.locator('#feedback')).toContainText('Instalaste');
    await page.keyboard.press('KeyE');
    await expect(page.locator('#feedback')).toContainText('portón se abrió');
    await walk(page, 0, 6.2);
    const towardExit = await pose(page);
    await look(page, Math.atan2(towardExit.x, towardExit.z - 11) * degrees, 0);
    await page.keyboard.down('KeyW');
    try {
        await expect(page.locator('#status')).toContainText('Escapaste del predio', { timeout: 15_000 });
    } finally {
        await page.keyboard.up('KeyW');
    }
    await page.reload();
    await expect(page.locator('#status')).toContainText('Escapaste del predio');
    expect(errors).toEqual([]);
});

async function sampleRendering(page: Page) {
    return page.locator('#game-canvas').evaluate(async (canvas) => {
        const times: number[] = [];
        let previous: number | undefined;
        await new Promise<void>((resolve) => {
            function sample(now: number) {
                if (previous !== undefined) times.push(now - previous);
                previous = now;
                if (times.length < 45) requestAnimationFrame(sample);
                else resolve();
            }
            requestAnimationFrame(sample);
        });
        const sorted = [...times].sort((a, b) => a - b);
        const elapsed = times.reduce((sum, duration) => sum + duration, 0);
        const { dataset } = canvas;
        const gl = (canvas as HTMLCanvasElement).getContext('webgl2');
        const debug = gl?.getExtension('WEBGL_debug_renderer_info');
        const renderer = debug ? String(gl?.getParameter(debug.UNMASKED_RENDERER_WEBGL)) : null;
        return {
            renderer,
            quality: dataset.quality,
            drawCalls: Number(dataset.drawCalls),
            width: Number(dataset.renderWidth),
            height: Number(dataset.renderHeight),
            frames: times.length,
            fps: (times.length * 1000) / elapsed,
            p99: sorted[Math.ceil(sorted.length * 0.99) - 1]
        };
    });
}

test('G2 · compara calidad y permite leer la pista con o sin linterna', async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
    });
    const hardware = process.env.KM77_HARDWARE === '1' && testInfo.project.name === 'chrome';
    await page.setViewportSize(hardware ? { width: 1920, height: 1080 } : { width: 1280, height: 720 });
    await page.goto(url);
    const canvas = page.locator('#game-canvas');
    const quality = page.locator('#quality');
    const start = page.locator('#start-button');
    await expect(start).toBeEnabled();
    await quality.selectOption('low');
    await start.click();
    await expect(canvas).toHaveAttribute('data-active', 'true');
    await expect(canvas).toHaveAttribute('data-quality', 'low');
    await expect(canvas).toHaveAttribute('data-flashlight', 'false');
    const repeats = hardware ? 3 : 1;
    const low = [await sampleRendering(page)];
    for (let i = 1; i < repeats; i += 1) low.push(await sampleRendering(page));
    await capture(page, testInfo, 'porton-bajo');

    await page.evaluate(() => document.exitPointerLock());
    await expect(start).toHaveText('Reanudar');
    await quality.selectOption('high');
    await start.click();
    await expect(canvas).toHaveAttribute('data-quality', 'high');
    const high = [await sampleRendering(page)];
    for (let i = 1; i < repeats; i += 1) high.push(await sampleRendering(page));
    expect(high[0].width).toBeGreaterThan(low[0].width);
    expect(high[0].height).toBeGreaterThan(low[0].height);
    expect(low[0].drawCalls).toBeGreaterThan(0);
    expect(high[0].drawCalls).toBeGreaterThan(0);
    await capture(page, testInfo, 'porton-alto');
    await page.keyboard.press('KeyF');
    await expect(canvas).toHaveAttribute('data-flashlight', 'true');
    const highWithFlashlight = await sampleRendering(page);
    await capture(page, testInfo, 'porton-alto-con-linterna');
    await page.keyboard.press('KeyF');
    await expect(canvas).toHaveAttribute('data-flashlight', 'false');
    const metrics = testInfo.outputPath('metricas-porton.json');
    await writeFile(metrics, JSON.stringify({ low, high, highWithFlashlight }, null, 2));
    await testInfo.attach('G2 · métricas comparables del portón', { path: metrics, contentType: 'application/json' });

    await page.evaluate(() => document.exitPointerLock());
    await expect(start).toHaveText('Reanudar');
    await quality.selectOption('low');
    await start.click();
    await expect(canvas).toHaveAttribute('data-active', 'true');
    await walk(page, 0, 0);
    await look(page, 0, 0);
    await capture(page, testInfo, 'camino-cabana');
    await walk(page, 0, -4.6);
    await look(page, 0, 0);
    await capture(page, testInfo, 'porche');
    await walk(page, 0, -8.2);
    await target(page, 'log', 2, 1.4, -9);
    await capture(page, testInfo, 'registro-sin-linterna');
    await page.keyboard.press('KeyF');
    await expect(canvas).toHaveAttribute('data-flashlight', 'true');
    await capture(page, testInfo, 'registro-con-linterna');
    await page.keyboard.press('KeyF');
    await expect(canvas).toHaveAttribute('data-flashlight', 'false');
    await page.keyboard.press('KeyE');
    await expect(page.locator('#inspection-title')).toHaveText('Registro de guardia');
    await expect(page.locator('#inspection-body')).toContainText('23:47');
    await capture(page, testInfo, 'lectura-registro');
    await page.reload();
    await expect(quality).toHaveValue('low');
    await expect(page.getByRole('button', { name: 'Continuar' })).toBeEnabled();
    expect(errors).toEqual([]);
});
