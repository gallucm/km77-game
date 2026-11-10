import {
    AppBase,
    AppOptions,
    CameraComponentSystem,
    Color,
    ContainerHandler,
    DEVICETYPE_WEBGL2,
    DEVICETYPE_WEBGPU,
    Entity,
    FILLMODE_FILL_WINDOW,
    LightComponentSystem,
    RESOLUTION_AUTO,
    RenderComponentSystem,
    TextureHandler,
    TONEMAP_NEUTRAL,
    createGraphicsDevice
} from 'playcanvas';
import type { ContainerResource } from 'playcanvas';

import { buildLevel, checkpoints, floorAt, getZone } from './levels';
import type { Checkpoint, Progress, TargetId } from './progress';

export type Quality = 'low' | 'medium' | 'high';

export interface Game {
    backend: string;
    setActive(active: boolean): void;
    getPose(): { x: number; y: number; z: number; yaw: number; pitch: number };
    setProgress(progress: Progress): void;
    getTarget(): TargetId | null;
    getZone(): 'gate' | 'exit' | null;
    setCheckpoint(id: Checkpoint): void;
    setSensitivity(value: number): void;
    setFlashlight(on: boolean): void;
    setQuality(quality: Quality): void;
    getDiagnostics(): { drawCalls: number; width: number; height: number };
}

const CAMERA_HEIGHT = 1.68;
const WALK_SPEED = 3.2;
const RUN_SPEED = 5;
const MOUSE_SENSITIVITY = 0.14;
const QUALITY_PIXEL_RATIO: Record<Quality, number> = { low: 0.62, medium: 0.82, high: 1.5 };
const NIGHT_SKY = new Color(0.055, 0.103, 0.132);
const MOVEMENT_KEYS = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ShiftLeft', 'ShiftRight']);

function loadModel(app: AppBase, path: string): Promise<ContainerResource> {
    const url = `${import.meta.env.BASE_URL}assets/${path}`;
    return new Promise<ContainerResource>((resolve, reject) => {
        app.assets.loadFromUrl(url, 'container', (error, asset) => {
            if (error || !asset?.resource) {
                reject(new Error(`No se pudo cargar ${path}.`, { cause: error }));
                return;
            }

            resolve(asset.resource as ContainerResource);
        });
    });
}

function addCabin(app: AppBase, resource: ContainerResource): void {
    const cabin = new Entity('Referencia GLB fuera del recorrido');
    cabin.setLocalPosition(-20, 0, -13);
    cabin.addChild(resource.instantiateRenderEntity());
    app.root.addChild(cabin);
}

function constrain(value: number, low: number, high: number): number {
    return Math.max(low, Math.min(high, value));
}

export async function createGame(canvas: HTMLCanvasElement, preferWebGPU: boolean): Promise<Game> {
    const device = await createGraphicsDevice(canvas, {
        deviceTypes: preferWebGPU ? [DEVICETYPE_WEBGPU, DEVICETYPE_WEBGL2] : [DEVICETYPE_WEBGL2],
        antialias: true
    });
    device.maxPixelRatio = QUALITY_PIXEL_RATIO.medium;

    const options = new AppOptions();
    options.graphicsDevice = device;
    options.componentSystems = [RenderComponentSystem, CameraComponentSystem, LightComponentSystem];
    options.resourceHandlers = [TextureHandler, ContainerHandler];

    const app = new AppBase(canvas);
    app.init(options);
    app.setCanvasFillMode(FILLMODE_FILL_WINDOW);
    app.setCanvasResolution(RESOLUTION_AUTO);

    const camera = new Entity('Cámara FPS');
    camera.addComponent('camera', {
        clearColor: NIGHT_SKY,
        farClip: 46,
        toneMapping: TONEMAP_NEUTRAL
    });
    camera.setPosition(checkpoints.spawn.x, CAMERA_HEIGHT, checkpoints.spawn.z);
    camera.setEulerAngles(0, checkpoints.spawn.yaw, 0);
    app.root.addChild(camera);

    const flashlight = new Entity('Linterna');
    flashlight.addComponent('light', {
        type: 'spot',
        color: new Color(1, 0.92, 0.77),
        intensity: 2.45,
        range: 15,
        innerConeAngle: 17,
        outerConeAngle: 29,
        shadowResolution: 512,
        normalOffsetBias: 0.035
    });
    flashlight.setLocalPosition(0.18, -0.16, -0.11);
    // Los focos de PlayCanvas apuntan a -Y. La cámara mira a -Z.
    flashlight.setLocalEulerAngles(90, 0, 0);
    flashlight.enabled = false;
    camera.addChild(flashlight);

    const trees = Promise.all([loadModel(app, 'trees/pino-alto.glb'), loadModel(app, 'trees/pino-abierto.glb')]).catch(
        (error: unknown) => {
            console.warn('Se usará el bosque procedural de respaldo.', error);
            return undefined;
        }
    );
    const keyAssets = Promise.all([loadModel(app, 'keys/cobertizo.glb'), loadModel(app, 'keys/sotano.glb')])
        .then(([shed, basement]) => ({ shed, basement }))
        .catch((error: unknown) => {
            console.warn('Se usarán los indicadores de llave de respaldo.', error);
            return undefined;
        });
    const grassAsset = loadModel(app, 'grass/pasto-del-bosque.glb').catch((error: unknown) => {
        console.warn('Se usará el suelo exterior sin pasto 3D.', error);
        return undefined;
    });
    const fuelAsset = loadModel(app, 'props/bidon-fuel.glb').catch((error: unknown) => {
        console.warn('Se usará el indicador de combustible de respaldo.', error);
        return undefined;
    });
    let level: ReturnType<typeof buildLevel>;
    try {
        const [cabin, forest, keyModels, grass, fuel] = await Promise.all([
            loadModel(app, 'cabana-g0.glb'),
            trees,
            keyAssets,
            grassAsset,
            fuelAsset
        ]);
        level = buildLevel(app, NIGHT_SKY, forest, keyModels, grass, fuel);
        addCabin(app, cabin);
    } catch (error) {
        app.destroy();
        throw error;
    }

    let active = false;
    let yaw = checkpoints.spawn.yaw;
    let pitch = 0;
    let sensitivity = 1;
    const keys = new Set<string>();

    const onKeyDown = (event: KeyboardEvent): void => {
        if (active && MOVEMENT_KEYS.has(event.code)) keys.add(event.code);
    };
    const onKeyUp = (event: KeyboardEvent): void => {
        keys.delete(event.code);
    };
    const onMouseMove = (event: MouseEvent): void => {
        if (!active || document.pointerLockElement !== canvas) return;

        yaw = (yaw - event.movementX * MOUSE_SENSITIVITY * sensitivity) % 360;
        pitch = constrain(pitch - event.movementY * MOUSE_SENSITIVITY * sensitivity, -85, 85);
        camera.setEulerAngles(pitch, yaw, 0);
    };
    const resize = (): void => {
        app.resizeCanvas();
    };

    window.addEventListener('resize', resize);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousemove', onMouseMove);

    app.on('destroy', () => {
        window.removeEventListener('resize', resize);
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keyup', onKeyUp);
        document.removeEventListener('mousemove', onMouseMove);
    });

    app.on('update', (dt: number) => {
        level.update(dt);
        if (!active || keys.size === 0 || document.pointerLockElement !== canvas) return;

        const side = Number(keys.has('KeyD')) - Number(keys.has('KeyA'));
        const forward = Number(keys.has('KeyW')) - Number(keys.has('KeyS'));
        const speed = keys.has('ShiftLeft') || keys.has('ShiftRight') ? RUN_SPEED : WALK_SPEED;
        const distance = (speed * Math.min(dt, 0.05)) / Math.max(1, Math.hypot(side, forward));
        const angle = (yaw * Math.PI) / 180;
        const { x, z } = camera.getPosition();
        const nextX = x + (side * Math.cos(angle) - forward * Math.sin(angle)) * distance;
        const nextZ = z - (side * Math.sin(angle) + forward * Math.cos(angle)) * distance;
        const resolvedX = level.canWalkAt(nextX, z) ? nextX : x;
        const resolvedZ = level.canWalkAt(resolvedX, nextZ) ? nextZ : z;

        camera.setPosition(resolvedX, floorAt(resolvedX, resolvedZ) + CAMERA_HEIGHT, resolvedZ);
    });

    app.start();

    return {
        backend: device.deviceType === DEVICETYPE_WEBGPU ? 'WebGPU' : 'WebGL2',
        setActive(value) {
            active = value;
            if (!active) keys.clear();
        },
        getPose() {
            const { x, y, z } = camera.getPosition();
            return { x, y, z, yaw, pitch };
        },
        setProgress: level.setProgress,
        getTarget() {
            return active ? level.getTarget(camera) : null;
        },
        getZone() {
            const { x, z } = camera.getPosition();
            return getZone(x, z);
        },
        setCheckpoint(id) {
            level.settle();
            const checkpoint = checkpoints[id === 'basement' && !level.basementAccessible() ? 'cabin' : id];
            yaw = checkpoint.yaw;
            pitch = 0;
            keys.clear();
            camera.setPosition(checkpoint.x, floorAt(checkpoint.x, checkpoint.z) + CAMERA_HEIGHT, checkpoint.z);
            camera.setEulerAngles(pitch, yaw, 0);
        },
        setSensitivity(value) {
            if (Number.isFinite(value)) sensitivity = constrain(value, 0.25, 3);
        },
        setFlashlight(on) {
            flashlight.enabled = on;
        },
        setQuality(quality) {
            device.maxPixelRatio = QUALITY_PIXEL_RATIO[quality];
            flashlight.light!.castShadows = quality === 'high';
            app.resizeCanvas();
        },
        getDiagnostics() {
            return { drawCalls: app.stats.drawCalls.total, width: device.width, height: device.height };
        }
    };
}
