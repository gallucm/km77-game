import assert from 'node:assert/strict';
import { test } from 'node:test';

import { act, clearProgress, createProgress, loadProgress, saveProgress, visitZone } from '../src/progress.ts';
import type { Progress, TargetId } from '../src/progress.ts';

function apply(progress: Progress, ...targets: TargetId[]): Progress {
    return targets.reduce((current, target) => act(current, target).progress, progress);
}

function startGenerator(progress = createProgress()): Progress {
    return apply(progress, 'shed-key', 'shed-door', 'fuse', 'fuel', 'generator', 'generator', 'generator');
}

function getCrank(progress: Progress): Progress {
    return apply(progress, 'basement-key', 'basement-door', 'crank');
}

function createStorage(): Storage {
    const entries = new Map<string, string>();
    return {
        get length() {
            return entries.size;
        },
        clear: () => entries.clear(),
        getItem: (key) => entries.get(key) ?? null,
        key: (index) => [...entries.keys()][index] ?? null,
        removeItem: (key) => {
            entries.delete(key);
        },
        setItem: (key, value) => {
            entries.set(key, value);
        }
    };
}

test('las puertas cerradas bloquean repuestos y abrirlas dos veces no cambia el estado', () => {
    const initial = createProgress();
    assert.equal(apply(initial, 'shed-door', 'basement-door', 'fuse', 'crank', 'generator'), initial);
    const progress = apply(initial, 'shed-key', 'shed-door', 'basement-key', 'basement-door');
    assert.deepEqual(progress.doors, { shed: true, basement: true });
    assert.equal(apply(progress, 'shed-door', 'basement-door', 'shed-key', 'basement-key'), progress);
});

test('el generador admite combustible antes del fusible y se enciende una sola vez', () => {
    const fueled = apply(createProgress(), 'shed-key', 'shed-door', 'fuel', 'generator');
    assert.deepEqual(fueled.generator, { fuseInstalled: false, fuelAdded: true, running: false });
    assert.equal(apply(fueled, 'generator'), fueled);

    const started = apply(fueled, 'fuse', 'generator', 'generator');
    assert.deepEqual(started.generator, { fuseInstalled: true, fuelAdded: true, running: true });
    assert.equal(apply(started, 'generator'), started);
    assert.deepEqual(startGenerator().generator, started.generator);
});

test('el panel exige corriente y rechaza un código incorrecto sin perder progreso', () => {
    const initial = createProgress();
    assert.equal(act(initial, 'gate-panel', '2471').progress, initial);
    const powered = startGenerator();
    assert.equal(act(powered, 'gate-panel', '1234').progress, powered);
    assert.equal(act(powered, 'gate-panel', ' 2471').progress, powered);
    assert.equal(act(powered, 'gate-panel').progress, powered);
});

test('código antes del seguro sobrevive a recarga y el portón permite salir solo tras abrirse', () => {
    const storage = createStorage();
    const powered = startGenerator();
    const authorized = act(powered, 'gate-panel', '2471').progress;
    assert.equal(authorized.gate.codeAccepted, true);
    assert.equal(authorized.gate.open, false);
    assert.equal(authorized.checkpoint, 'gate');
    assert.equal(visitZone(authorized, 'exit'), authorized);
    assert.equal(saveProgress(storage, authorized), true);

    const loaded = loadProgress(storage);
    assert.deepEqual(loaded, authorized);
    assert.ok(loaded);
    const installed = apply(getCrank(loaded), 'gate-crank');
    assert.equal(installed.gate.crankInstalled, true);
    assert.equal(installed.gate.open, false);
    const opened = apply(installed, 'gate-crank');
    assert.equal(opened.gate.open, true);
    assert.equal(apply(opened, 'gate-crank', 'gate-panel'), opened);
    const escaped = visitZone(opened, 'exit');
    assert.equal(escaped.escaped, true);
    assert.equal(visitZone(escaped, 'exit'), escaped);
    assert.equal(saveProgress(storage, escaped), true);
    assert.deepEqual(loadProgress(storage), escaped);
});

test('el seguro puede liberarse antes de restaurar la corriente y aceptar el código', () => {
    const unlocked = apply(getCrank(createProgress()), 'gate-crank', 'gate-crank');
    assert.equal(unlocked.gate.mechanicalLockReleased, true);
    assert.equal(unlocked.gate.open, false);
    const powered = startGenerator(unlocked);
    assert.equal(powered.gate.open, false);
    assert.equal(act(powered, 'gate-panel', '2471').progress.gate.open, true);
});

test('las pistas y el evento de regreso al portón se registran una sola vez', () => {
    const initial = createProgress();
    assert.equal(visitZone(initial, 'gate'), initial);
    const discovered = apply(initial, 'entry-plate', 'map', 'log', 'entry-plate');
    assert.deepEqual(discovered.clues, ['entry-plate', 'map', 'log']);
    const powered = startGenerator(discovered);
    const firstVisit = visitZone(powered, 'gate');
    assert.equal(firstVisit.tensionSeen, true);
    assert.equal(visitZone(firstVisit, 'gate'), firstVisit);
});

test('guardados corruptos, incompatibles e imposibles se rechazan sin lanzar', () => {
    const storage = createStorage();
    assert.equal(saveProgress(storage, createProgress()), true);
    const key = storage.key(0);
    assert.ok(key);
    const invalidProgress = createProgress();
    invalidProgress.checkpoint = 'basement';
    for (const raw of [
        '{',
        JSON.stringify({ version: 2, progress: createProgress() }),
        JSON.stringify({ version: 1, progress: { ...createProgress(), gate: { open: true } } }),
        JSON.stringify({ version: 1, progress: invalidProgress })
    ]) {
        storage.setItem(key, raw);
        assert.equal(loadProgress(storage), null);
    }
    clearProgress(storage);
    assert.equal(storage.length, 0);
});

test('si el navegador bloquea el guardado, la partida todavía se puede jugar en memoria', () => {
    const storage = createStorage();
    const blocked = () => {
        throw new Error('Storage bloqueado');
    };
    storage.getItem = blocked;
    storage.setItem = blocked;
    storage.removeItem = blocked;

    assert.equal(loadProgress(storage), null);
    assert.equal(saveProgress(storage, createProgress()), false);
    assert.doesNotThrow(() => clearProgress(storage));
});
