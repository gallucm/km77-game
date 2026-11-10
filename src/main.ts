import { createAmbience } from './ambience';
import { labels, notes } from './field-notes';
import { createGame } from './game';
import { act, clearProgress, createProgress, loadProgress, saveProgress, visitZone } from './progress';
import type { Progress, TargetId } from './progress';
import './style.css';

const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas')!;
const menu = document.querySelector<HTMLElement>('#menu')!;
const start = document.querySelector<HTMLButtonElement>('#start-button')!;
const status = document.querySelector<HTMLParagraphElement>('#status')!;
const backend = document.querySelector<HTMLParagraphElement>('#backend')!;
const renderStats = document.querySelector<HTMLParagraphElement>('#render-stats')!;
const reticle = document.querySelector<HTMLElement>('#reticle')!;
const parameters = new URLSearchParams(location.search);
const preferWebGPU = parameters.get('renderer') === 'webgpu';
const diagnostics = parameters.get('diagnostics') === '1';

canvas.dataset.active = 'false';
canvas.dataset.audioState = 'suspended';

const newGame = document.querySelector<HTMLButtonElement>('#new-game')!;
const hud = document.querySelector<HTMLElement>('#hud')!;
const objective = document.querySelector<HTMLElement>('#objective')!;
const saveStatus = document.querySelector<HTMLElement>('#save-status')!;
const prompt = document.querySelector<HTMLElement>('#prompt')!;
const feedback = document.querySelector<HTMLElement>('#feedback')!;
const inspection = document.querySelector<HTMLDialogElement>('#inspection')!;
const inspectionTitle = document.querySelector<HTMLElement>('#inspection-title')!;
const inspectionBody = document.querySelector<HTMLElement>('#inspection-body')!;
const keypad = document.querySelector<HTMLFormElement>('#keypad')!;
const code = document.querySelector<HTMLInputElement>('#code')!;
const codeResult = document.querySelector<HTMLElement>('#code-result')!;
const closeInspection = document.querySelector<HTMLButtonElement>('#close-inspection')!;
const sensitivity = document.querySelector<HTMLInputElement>('#sensitivity')!;
const sensitivityControl = document.querySelector<HTMLElement>('#sensitivity-control')!;
const qualityControl = document.querySelector<HTMLElement>('#quality-control')!;
const qualitySelect = document.querySelector<HTMLSelectElement>('#quality')!;
const flashlight = document.querySelector<HTMLElement>('#flashlight')!;

type Quality = Parameters<Awaited<ReturnType<typeof createGame>>['setQuality']>[0];
const qualityKey = 'km77-game.quality';

function readQuality(value: string | null): Quality {
    return value === 'low' || value === 'high' ? value : 'medium';
}

function readStorage(): Storage | null {
    try {
        return localStorage;
    } catch {
        return null;
    }
}

function inventoryText(progress: Progress): string {
    const { items, generator, gate } = progress;
    const belongings = [
        items.shedKey && 'Llave del cobertizo',
        items.basementKey && 'Llave del sótano',
        items.fuse && !generator.fuseInstalled && 'Fusible',
        items.fuelCan && !generator.fuelAdded && 'Bidón',
        items.gateCrank && !gate.crankInstalled && 'Manivela'
    ].filter(Boolean);
    const discoveries = progress.clues.flatMap((clue) => {
        const note = notes[clue];
        return note ? [note.title + '\n' + note.text] : [];
    });
    return ['Objetos: ' + (belongings.join(', ') || 'ninguno'), ...discoveries].join('\n\n');
}

async function boot() {
    const game = await createGame(canvas, preferWebGPU);
    const storage = readStorage();
    const saved = storage ? loadProgress(storage) : null;
    let progress = saved ?? createProgress();
    let started = false;
    let active = false;
    let audio: ReturnType<typeof createAmbience> | undefined;
    let currentTarget: TargetId | null = null;
    let feedbackUntil = 0;
    let hasSave = saved !== null;
    let flashlightOn = false;

    const setFlashlight = (on: boolean) => {
        flashlightOn = on;
        game.setFlashlight(on);
        canvas.dataset.flashlight = String(on);
        flashlight.textContent = on ? 'F · Linterna encendida' : 'F · Linterna apagada';
    };

    const setQuality = (quality: Quality) => {
        game.setQuality(quality);
        qualitySelect.value = quality;
        canvas.dataset.quality = quality;
    };

    let savedQuality: string | null = null;
    try {
        savedQuality = storage?.getItem(qualityKey) ?? null;
    } catch {
        // El modo gráfico sigue disponible para esta sesión.
    }
    setQuality(readQuality(savedQuality));
    setFlashlight(false);

    backend.textContent = game.backend;
    start.disabled = false;
    sensitivityControl.hidden = false;
    qualityControl.hidden = false;
    game.setProgress(progress);
    game.setCheckpoint(progress.checkpoint);

    const syncMenu = () => {
        if (progress.escaped) {
            status.textContent = 'Escapaste del predio. Kilómetro 17 · 00:18.';
            start.hidden = true;
        } else {
            status.textContent = started ? 'En pausa' : 'Exploración nocturna';
            start.hidden = false;
            start.textContent = started ? 'Reanudar' : hasSave ? 'Continuar' : 'Iniciar';
        }
        newGame.hidden = !started && !hasSave && !progress.escaped;
    };
    syncMenu();

    const setActive = (next: boolean) => {
        if (next === active) return;
        active = next;
        game.setActive(next);
        canvas.dataset.active = String(next);
        menu.hidden = next || inspection.open;
        reticle.hidden = !next;
        hud.hidden = !next;
        audio?.setActive(next);
        if (next) {
            if (!started && diagnostics) performance.mark('km77:control');
            started = true;
        } else if (!inspection.open) {
            syncMenu();
            if (!document.hidden) (progress.escaped ? newGame : start).focus();
        }
    };

    const pause = () => {
        setActive(false);
        if (document.pointerLockElement === canvas) document.exitPointerLock();
    };

    const lockError = () => {
        status.textContent = 'No se pudo capturar el mouse. Volvé a intentarlo.';
    };

    const resume = () => {
        if (progress.escaped) return;
        try {
            audio ??= createAmbience();
            void audio.context.resume().then(
                () => {
                    canvas.dataset.audioState = audio?.context.state ?? 'unavailable';
                },
                () => {
                    canvas.dataset.audioState = 'unavailable';
                }
            );
        } catch {
            canvas.dataset.audioState = 'unavailable';
        }
        try {
            void canvas.requestPointerLock()?.catch(lockError);
        } catch {
            lockError();
        }
    };

    const announce = (message: string) => {
        feedback.textContent = message;
        feedbackUntil = performance.now() + 4500;
    };

    const commit = (next: Progress) => {
        if (next === progress) return;
        const returnEvent = next.tensionSeen && !progress.tensionSeen;
        const openedDoor =
            (next.doors.shed && !progress.doors.shed) ||
            (next.doors.basement && !progress.doors.basement) ||
            (next.gate.open && !progress.gate.open);
        const pickedUp = next.items !== progress.items;
        const startedGenerator = next.generator.running && !progress.generator.running;
        progress = next;
        game.setProgress(next);
        const savedNow = storage !== null && saveProgress(storage, next);
        if (savedNow) hasSave = true;
        saveStatus.textContent = savedNow ? '' : 'El navegador no pudo guardar el progreso.';
        if (openedDoor) audio?.door();
        if (pickedUp) audio?.pickup();
        if (startedGenerator) audio?.button();
        if (returnEvent) {
            audio?.returnSound();
            announce('Un golpe seco suena a tu izquierda.');
        }
        if (next.escaped) pause();
    };

    const showInspection = (title: string, text: string, useKeypad = false, documentStyle = false) => {
        inspection.toggleAttribute('data-document', documentStyle);
        inspectionTitle.textContent = title;
        inspectionBody.textContent = text;
        keypad.hidden = !useKeypad;
        keypad.reset();
        codeResult.textContent = '';
        inspection.showModal();
        pause();
        if (useKeypad) code.focus();
        else closeInspection.focus();
    };

    const closeNote = () => {
        inspection.close();
        menu.hidden = false;
        syncMenu();
        resume();
    };

    const handleInteraction = (target: TargetId) => {
        const outcome = act(progress, target);
        commit(outcome.progress);
        const note = notes[target];
        if (note) {
            showInspection(note.title, note.text, false, true);
        } else if (target === 'gate-panel') {
            showInspection(
                'Panel del portón',
                outcome.message + '\n\nPlaca fija: «El código sigue la ronda de guardia».',
                progress.generator.running && !progress.gate.codeAccepted
            );
        } else {
            announce(outcome.message);
        }
    };

    start.addEventListener('click', resume);
    newGame.addEventListener('click', () => {
        if (!progress.escaped && !window.confirm('¿Empezar de nuevo y reemplazar la partida guardada?')) return;
        if (storage) clearProgress(storage);
        progress = createProgress();
        game.setProgress(progress);
        game.setCheckpoint('spawn');
        setFlashlight(false);
        currentTarget = null;
        prompt.textContent = '';
        feedback.textContent = '';
        saveStatus.textContent = '';
        started = false;
        hasSave = false;
        syncMenu();
        start.focus();
    });
    sensitivity.addEventListener('input', () => game.setSensitivity(sensitivity.valueAsNumber));
    qualitySelect.addEventListener('change', () => {
        const quality = readQuality(qualitySelect.value);
        setQuality(quality);
        try {
            storage?.setItem(qualityKey, quality);
        } catch {
            // El ajuste aplicado sigue activo aunque falle la persistencia.
        }
    });
    closeInspection.addEventListener('click', closeNote);
    inspection.addEventListener('cancel', (event) => {
        event.preventDefault();
        closeNote();
    });
    keypad.addEventListener('submit', (event) => {
        event.preventDefault();
        const outcome = act(progress, 'gate-panel', code.value);
        commit(outcome.progress);
        audio?.button();
        codeResult.textContent = outcome.message;
        if (progress.gate.codeAccepted) {
            inspectionBody.textContent = outcome.message;
            keypad.hidden = true;
            closeInspection.focus();
        } else {
            code.select();
        }
    });
    keypad.addEventListener('reset', () => {
        codeResult.textContent = '';
    });
    keypad.querySelector('button[type="reset"]')?.addEventListener('click', () => audio?.button());
    window.addEventListener('keydown', (event) => {
        if (!active || event.repeat) return;
        if (event.code === 'Tab') {
            event.preventDefault();
            showInspection('Mochila y pistas', inventoryText(progress));
        } else if (event.code === 'KeyF') {
            setFlashlight(!flashlightOn);
        } else if (event.code === 'KeyE') {
            const target = game.getTarget();
            if (target) handleInteraction(target);
        }
    });

    document.addEventListener('pointerlockchange', () => {
        if (document.pointerLockElement === canvas && !document.hidden && !inspection.open && !progress.escaped) {
            setActive(true);
        } else {
            pause();
        }
    });
    document.addEventListener('pointerlockerror', lockError);
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) pause();
    });
    window.addEventListener('blur', pause);

    renderStats.hidden = !diagnostics;
    let statsStart = performance.now();
    let statsFrames = 0;
    const update = (time: number) => {
        if (active) {
            commit(visitZone(progress, game.getZone()));
            const target = game.getTarget();
            if (target !== currentTarget) {
                currentTarget = target;
                prompt.textContent = target ? 'E · ' + labels[target] : '';
            }
            const goal = progress.gate.open ? 'Cruzá el portón.' : 'Encontrá una forma de abrir el portón.';
            if (objective.textContent !== goal) objective.textContent = goal;
            if (feedback.textContent && time >= feedbackUntil) feedback.textContent = '';
        }
        const pose = diagnostics || (active && audio) ? game.getPose() : null;
        if (pose && active) audio?.update(pose, progress.generator.running);
        if (diagnostics && pose) {
            const { x, y, z, yaw, pitch } = pose;
            canvas.dataset.x = x.toFixed(3);
            canvas.dataset.z = z.toFixed(3);
            canvas.dataset.y = y.toFixed(3);
            canvas.dataset.pitch = pitch.toFixed(3);
            canvas.dataset.yaw = yaw.toFixed(3);
            canvas.dataset.target = active ? (currentTarget ?? '') : '';
            const { drawCalls, width, height } = game.getDiagnostics();
            canvas.dataset.drawCalls = String(drawCalls);
            canvas.dataset.renderWidth = String(width);
            canvas.dataset.renderHeight = String(height);
            statsFrames += 1;
            if (time - statsStart >= 500) {
                const fps = Math.round((statsFrames * 1000) / (time - statsStart));
                renderStats.textContent = `${width}×${height} · ${drawCalls} draw calls · ${fps} FPS`;
                statsStart = time;
                statsFrames = 0;
            }
        }
        requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
}

void boot().catch((error: unknown) => {
    console.error(error);
    status.textContent = 'No se pudo cargar la escena 3D. Verificá WebGL2 y recargá la página.';
});
