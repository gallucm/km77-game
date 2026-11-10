const checkpoints = ['spawn', 'gate', 'cabin', 'shed', 'basement'] as const;
const clueTargets = ['entry-plate', 'cabin-plate', 'shed-plate', 'well-plate', 'map', 'log'] as const;
const pickups = {
    'shed-key': { item: 'shedKey', checkpoint: 'cabin', message: 'Recogiste la llave del cobertizo.' },
    'basement-key': { item: 'basementKey', checkpoint: 'cabin', message: 'Recogiste la llave del sótano.' },
    fuse: { item: 'fuse', checkpoint: 'shed', message: 'Recogiste el fusible.' },
    fuel: { item: 'fuelCan', checkpoint: 'cabin', message: 'Recogiste el bidón de combustible.' },
    crank: { item: 'gateCrank', checkpoint: 'basement', message: 'Recogiste la manivela.' }
} as const;

export type Checkpoint = (typeof checkpoints)[number];
export type TargetId =
    | (typeof clueTargets)[number]
    | keyof typeof pickups
    | 'shed-door'
    | 'basement-door'
    | 'generator'
    | 'gate-panel'
    | 'gate-crank';

export interface Progress {
    items: { shedKey: boolean; basementKey: boolean; fuse: boolean; fuelCan: boolean; gateCrank: boolean };
    doors: { shed: boolean; basement: boolean };
    generator: { fuseInstalled: boolean; fuelAdded: boolean; running: boolean };
    gate: { crankInstalled: boolean; mechanicalLockReleased: boolean; codeAccepted: boolean; open: boolean };
    escaped: boolean;
    tensionSeen: boolean;
    clues: TargetId[];
    checkpoint: Checkpoint;
}

interface ActionResult {
    progress: Progress;
    message: string;
}

const saveKey = 'km77-game.progress';
const saveVersion = 1;
const gateCode = '2471';

export function createProgress(): Progress {
    return {
        items: { shedKey: false, basementKey: false, fuse: false, fuelCan: false, gateCrank: false },
        doors: { shed: false, basement: false },
        generator: { fuseInstalled: false, fuelAdded: false, running: false },
        gate: { crankInstalled: false, mechanicalLockReleased: false, codeAccepted: false, open: false },
        escaped: false,
        tensionSeen: false,
        clues: [],
        checkpoint: 'spawn'
    };
}

function isClue(target: unknown): target is (typeof clueTargets)[number] {
    return clueTargets.some((clue) => clue === target);
}

function isPickup(target: TargetId): target is keyof typeof pickups {
    return Object.hasOwn(pickups, target);
}

function canOpenGate(progress: Progress): boolean {
    return progress.generator.running && progress.gate.mechanicalLockReleased && progress.gate.codeAccepted;
}

function updateGate(progress: Progress, updates: Partial<Progress['gate']>, message: string): ActionResult {
    const next: Progress = {
        ...progress,
        gate: { ...progress.gate, ...updates },
        checkpoint: 'gate'
    };
    if (canOpenGate(next)) {
        next.gate.open = true;
        return { progress: next, message: `${message} El portón se abrió.` };
    }
    return { progress: next, message };
}

function actOnGenerator(progress: Progress): ActionResult {
    const { generator, items } = progress;
    if (generator.running) return { progress, message: 'El generador está funcionando.' };

    const update = (changes: Partial<Progress['generator']>, message: string): ActionResult => ({
        progress: { ...progress, generator: { ...generator, ...changes }, checkpoint: 'shed' },
        message
    });

    if (!generator.fuseInstalled && items.fuse) return update({ fuseInstalled: true }, 'Instalaste el fusible.');
    if (!generator.fuelAdded && items.fuelCan) return update({ fuelAdded: true }, 'Cargaste combustible.');
    if (generator.fuseInstalled && generator.fuelAdded) {
        return update({ running: true }, 'Encendiste el generador. El portón tiene corriente.');
    }
    return {
        progress,
        message: generator.fuseInstalled
            ? 'Falta combustible.'
            : generator.fuelAdded
              ? 'Falta el fusible.'
              : 'Faltan un fusible y combustible.'
    };
}

function actOnPanel(progress: Progress, code?: string): ActionResult {
    if (!progress.generator.running) return { progress, message: 'El panel está sin alimentación.' };
    if (progress.gate.open) return { progress, message: 'El portón ya está abierto.' };
    if (progress.gate.codeAccepted) return { progress, message: 'Código aceptado. El seguro manual sigue puesto.' };
    if (code === undefined) return { progress, message: 'Ingresá el código de la ronda de guardia.' };
    if (code !== gateCode) return { progress, message: 'Código incorrecto.' };
    return updateGate(
        progress,
        { codeAccepted: true },
        progress.gate.mechanicalLockReleased ? 'Código aceptado.' : 'Código aceptado. Liberá el seguro manual.'
    );
}

function actOnCrank(progress: Progress): ActionResult {
    if (progress.gate.mechanicalLockReleased) return { progress, message: 'El seguro manual ya está liberado.' };
    if (progress.gate.crankInstalled) {
        return updateGate(progress, { mechanicalLockReleased: true }, 'Liberaste el seguro manual.');
    }
    if (!progress.items.gateCrank) return { progress, message: 'Falta la manivela del seguro.' };
    return updateGate(progress, { crankInstalled: true }, 'Instalaste la manivela. Volvé a interactuar para girarla.');
}

export function act(progress: Progress, target: TargetId, code?: string): ActionResult {
    if (progress.escaped) return { progress, message: 'Ya saliste del predio.' };

    if (isClue(target)) {
        return {
            progress: progress.clues.includes(target) ? progress : { ...progress, clues: [...progress.clues, target] },
            message: ''
        };
    }
    if (isPickup(target)) {
        const pickup = pickups[target];
        if (progress.items[pickup.item]) return { progress, message: 'Ya recogiste este objeto.' };
        if ((target === 'fuse' && !progress.doors.shed) || (target === 'crank' && !progress.doors.basement)) {
            return { progress, message: 'Todavía no podés acceder a este objeto.' };
        }
        return {
            progress: { ...progress, items: { ...progress.items, [pickup.item]: true }, checkpoint: pickup.checkpoint },
            message: pickup.message
        };
    }

    switch (target) {
        case 'shed-door':
            if (progress.doors.shed) return { progress, message: 'El cobertizo ya está abierto.' };
            if (!progress.items.shedKey) return { progress, message: 'Necesitás la llave del cobertizo.' };
            return {
                progress: { ...progress, doors: { ...progress.doors, shed: true } },
                message: 'Abriste el cobertizo.'
            };
        case 'basement-door':
            if (progress.doors.basement) return { progress, message: 'El sótano ya está abierto.' };
            if (!progress.items.basementKey) return { progress, message: 'Necesitás la llave del sótano.' };
            return {
                progress: { ...progress, doors: { ...progress.doors, basement: true } },
                message: 'Abriste el sótano.'
            };
        case 'generator':
            if (!progress.doors.shed) return { progress, message: 'El generador está en el cobertizo cerrado.' };
            return actOnGenerator(progress);
        case 'gate-panel':
            return actOnPanel(progress, code);
        case 'gate-crank':
            return actOnCrank(progress);
    }
}

export function visitZone(progress: Progress, zone: 'gate' | 'exit' | null): Progress {
    if (progress.escaped) return progress;
    if (zone === 'exit' && progress.gate.open) return { ...progress, escaped: true, checkpoint: 'gate' };
    if (zone === 'gate' && progress.generator.running && !progress.tensionSeen) {
        return { ...progress, tensionSeen: true, checkpoint: 'gate' };
    }
    return progress;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasFlags<T extends Record<string, boolean>>(value: unknown, defaults: T): value is T {
    const keys = Object.keys(defaults);
    return (
        isRecord(value) &&
        Object.keys(value).length === keys.length &&
        keys.every((key) => typeof value[key] === 'boolean')
    );
}

function hasProgressShape(value: unknown): value is Progress {
    const defaults = createProgress();
    return (
        isRecord(value) &&
        Object.keys(value).length === Object.keys(defaults).length &&
        hasFlags(value.items, defaults.items) &&
        hasFlags(value.doors, defaults.doors) &&
        hasFlags(value.generator, defaults.generator) &&
        hasFlags(value.gate, defaults.gate) &&
        typeof value.escaped === 'boolean' &&
        typeof value.tensionSeen === 'boolean' &&
        Array.isArray(value.clues) &&
        value.clues.length <= clueTargets.length &&
        value.clues.every(isClue) &&
        new Set(value.clues).size === value.clues.length &&
        checkpoints.some((checkpoint) => checkpoint === value.checkpoint)
    );
}

function isConsistent(progress: Progress): boolean {
    const { items, doors, generator, gate, checkpoint } = progress;
    return (
        (!doors.shed || items.shedKey) &&
        (!doors.basement || items.basementKey) &&
        (!items.fuse || doors.shed) &&
        (!items.gateCrank || doors.basement) &&
        (!generator.fuseInstalled || items.fuse) &&
        (!generator.fuelAdded || (doors.shed && items.fuelCan)) &&
        (!generator.running || (generator.fuseInstalled && generator.fuelAdded)) &&
        (!gate.crankInstalled || items.gateCrank) &&
        (!gate.mechanicalLockReleased || gate.crankInstalled) &&
        (!gate.codeAccepted || generator.running) &&
        gate.open === canOpenGate(progress) &&
        (!progress.escaped || gate.open) &&
        (!progress.tensionSeen || generator.running) &&
        (checkpoint !== 'shed' || doors.shed) &&
        (checkpoint !== 'basement' || doors.basement)
    );
}

export function loadProgress(storage: Storage): Progress | null {
    try {
        const raw = storage.getItem(saveKey);
        if (!raw || raw.length > 4096) return null;
        const data: unknown = JSON.parse(raw);
        if (
            !isRecord(data) ||
            data.version !== saveVersion ||
            !hasProgressShape(data.progress) ||
            !isConsistent(data.progress)
        ) {
            return null;
        }
        return data.progress;
    } catch {
        return null;
    }
}

export function saveProgress(storage: Storage, progress: Progress): boolean {
    try {
        storage.setItem(saveKey, JSON.stringify({ version: saveVersion, timestamp: Date.now(), progress }));
        return true;
    } catch {
        return false;
    }
}

export function clearProgress(storage: Storage): void {
    try {
        storage.removeItem(saveKey);
    } catch {
        // Playing in memory is still possible if storage is unavailable.
    }
}
