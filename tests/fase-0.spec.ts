import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

function captureErrors(page: Page): string[] {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
        if (message.type() === 'error') {
            errors.push(message.text());
        }
    });
    page.on('requestfailed', (request) => {
        errors.push(`${request.method()} ${request.url()}: ${request.failure()?.errorText}`);
    });
    page.on('response', (response) => {
        if (response.status() >= 400) {
            errors.push(`${response.status()} ${response.url()}`);
        }
    });
    return errors;
}

function pointerIsLocked(page: Page): Promise<boolean> {
    return page.evaluate(() => document.pointerLockElement?.id === 'game-canvas');
}

function readPose(canvas: Locator) {
    return canvas.evaluate(({ dataset }) => ({
        x: Number(dataset.x),
        z: Number(dataset.z),
        yaw: Number(dataset.yaw)
    }));
}

async function measureScene(page: Page, timeToControlMs: number) {
    return page.evaluate(async (controlMs) => {
        const frameTimes = await new Promise<number[]>((resolve) => {
            const samples: number[] = [];
            let previous: number | undefined;

            function tick(time: number) {
                if (previous !== undefined) {
                    samples.push(time - previous);
                }
                previous = time;
                if (samples.length === 90) {
                    resolve(samples);
                } else {
                    requestAnimationFrame(tick);
                }
            }

            requestAnimationFrame(tick);
        });
        const ordered = [...frameTimes].sort((a, b) => a - b);
        const totalFrameTime = frameTimes.reduce((sum, time) => sum + time, 0);
        const transfer = ['navigation', 'resource']
            .flatMap((type) => performance.getEntriesByType(type) as PerformanceResourceTiming[])
            .reduce((bytes, entry) => bytes + entry.transferSize, 0);
        const probe = document.createElement('canvas').getContext('webgl2');
        const debug = probe?.getExtension('WEBGL_debug_renderer_info');
        const renderer = debug ? probe?.getParameter(debug.UNMASKED_RENDERER_WEBGL) : null;
        probe?.getExtension('WEBGL_lose_context')?.loseContext();

        return {
            renderer,
            userAgent: navigator.userAgent,
            viewport: [innerWidth, innerHeight],
            timeToControlMs: Math.round(controlMs),
            transferBytes: transfer,
            frameSamples: frameTimes.length,
            meanFps: Math.round((1_000 * frameTimes.length) / totalFrameTime),
            p99FrameMs: ordered[Math.ceil(ordered.length * 0.99) - 1]
        };
    }, timeToControlMs);
}

test('G0 · WebGL2 carga la escena y permite controlar, pausar y reanudar', async ({ page }, testInfo) => {
    const errors = captureErrors(page);
    const assetResponse = page.waitForResponse((response) => new URL(response.url()).pathname.endsWith('.glb'));
    await page.goto('/?renderer=webgl2&diagnostics=1');

    const canvas = page.locator('#game-canvas');
    const start = page.locator('#start-button');
    await expect(page.locator('#backend')).toContainText('WebGL2');
    await expect(start).toHaveText('Iniciar');
    await start.click();
    await expect.poll(() => pointerIsLocked(page)).toBe(true);
    await expect(canvas).toHaveAttribute('data-active', 'true');
    await expect(canvas).toHaveAttribute('data-audio-state', 'running');
    const timeToControlMs = await page.evaluate(() => {
        const mark = performance.getEntriesByName('km77:control', 'mark')[0];
        if (!mark) throw new Error('No se registró el primer instante con control.');
        return mark.startTime;
    });
    expect(timeToControlMs).toBeGreaterThan(0);
    const model = await assetResponse;
    expect(model.ok()).toBe(true);
    expect((await model.body()).subarray(0, 4).toString()).toBe('glTF');

    await testInfo.attach('G0 · escena desde la llegada', {
        body: await page.screenshot(),
        contentType: 'image/png'
    });

    const initial = await readPose(canvas);
    expect(Object.values(initial).every(Number.isFinite)).toBe(true);
    await page.mouse.move(600, 350);
    await page.mouse.move(720, 350, { steps: 4 });
    await expect.poll(async () => Math.abs((await readPose(canvas)).yaw - initial.yaw)).toBeGreaterThan(0.1);

    await page.keyboard.down('KeyW');
    try {
        await expect
            .poll(async () => {
                const { x, z } = await readPose(canvas);
                return Math.hypot(x - initial.x, z - initial.z);
            })
            .toBeGreaterThan(0.2);
    } finally {
        await page.keyboard.up('KeyW');
    }

    const scene = await measureScene(page, timeToControlMs);
    await testInfo.attach('G0 · WebGL2 · caché fría, localhost sin limitar', {
        body: JSON.stringify(scene, null, 2),
        contentType: 'application/json'
    });

    await page.evaluate(() => document.exitPointerLock());
    await expect.poll(() => pointerIsLocked(page)).toBe(false);
    await expect(canvas).toHaveAttribute('data-active', 'false');
    await expect(start).toHaveText('Reanudar');
    await start.click();
    await expect.poll(() => pointerIsLocked(page)).toBe(true);
    await expect(canvas).toHaveAttribute('data-active', 'true');

    await page.evaluate(() => window.dispatchEvent(new Event('blur')));
    await expect(canvas).toHaveAttribute('data-active', 'false');
    await expect.poll(() => pointerIsLocked(page)).toBe(false);
    await expect(start).toHaveText('Reanudar');
    await start.click();
    await expect(canvas).toHaveAttribute('data-active', 'true');
    expect(errors).toEqual([]);
});

test('G0 · WebGPU optativo inicializa o recurre a WebGL2', async ({ page }, testInfo) => {
    const errors = captureErrors(page);
    await page.goto('/?renderer=webgpu');
    const backend = page.locator('#backend');
    await expect(backend).toContainText(/WebGPU|WebGL2/);
    const start = page.locator('#start-button');
    await start.click();
    await expect.poll(() => pointerIsLocked(page)).toBe(true);
    await expect(page.locator('#game-canvas')).toHaveAttribute('data-active', 'true');
    const result = await page.evaluate(() => ({
        webGPUExposed: 'gpu' in navigator,
        backend: document.querySelector('#backend')?.textContent
    }));
    await testInfo.attach('G0 · resultado de WebGPU optativo', {
        body: JSON.stringify(result, null, 2),
        contentType: 'application/json'
    });
    expect(errors).toEqual([]);
});
