import { generatorPosition, isIndoors } from './levels';

interface ListenerPose {
    x: number;
    z: number;
    yaw: number;
}

export function createAmbience() {
    const context = new AudioContext();
    const length = 3 * context.sampleRate;
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const samples = buffer.getChannelData(0);
    let wind = 0;
    for (let i = 0; i < length; i += 1) {
        wind = wind * 0.99 + (Math.random() - 0.5) * 0.02;
        samples[i] = wind * Math.min(1, i / 600, (length - i - 1) / 600);
    }

    const master = context.createGain();
    master.gain.value = 0;
    master.connect(context.destination);

    const windSource = context.createBufferSource();
    const windGain = context.createGain();
    windGain.gain.value = 0.45;
    windSource.buffer = buffer;
    windSource.loop = true;
    windSource.connect(windGain).connect(master);
    windSource.start();

    const motor = context.createOscillator();
    const motorFilter = context.createBiquadFilter();
    const motorGain = context.createGain();
    const motorPan = context.createStereoPanner();
    motor.type = 'sawtooth';
    motor.frequency.value = 52;
    motorFilter.frequency.value = 160;
    motorGain.gain.value = 0;
    motor.connect(motorFilter).connect(motorGain).connect(motorPan).connect(master);
    motor.start();

    let lastPose: ListenerPose | undefined;
    let stepDistance = 0;
    let indoors = false;

    function noise(frequency: number, volume: number, duration: number) {
        const now = context.currentTime;
        const source = context.createBufferSource();
        const filter = context.createBiquadFilter();
        const gain = context.createGain();
        source.buffer = buffer;
        filter.type = 'bandpass';
        filter.frequency.value = frequency;
        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        source.connect(filter).connect(gain).connect(master);
        source.start(now, Math.random() * (buffer.duration - duration), duration);
        source.onended = () => {
            source.disconnect();
            filter.disconnect();
            gain.disconnect();
        };
    }

    function door() {
        if (context.state === 'running') noise(190, 0.7, 0.3);
    }

    function returnSound() {
        if (context.state !== 'running') return;
        const now = context.currentTime;
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const pan = context.createStereoPanner();
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(122, now);
        oscillator.frequency.exponentialRampToValueAtTime(49, now + 0.45);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(0.16, now + 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
        pan.pan.value = -0.7;
        oscillator.connect(gain).connect(pan).connect(master);
        oscillator.start(now);
        oscillator.stop(now + 0.67);
        oscillator.onended = () => {
            oscillator.disconnect();
            gain.disconnect();
            pan.disconnect();
        };
    }

    function update(pose: ListenerPose, running: boolean) {
        if (context.state !== 'running') return;
        const now = context.currentTime;
        const inside = isIndoors(pose.x, pose.z);
        if (!lastPose || inside !== indoors) {
            indoors = inside;
            windGain.gain.setTargetAtTime(indoors ? 0.15 : 0.45, now, 0.18);
        }
        if (lastPose) {
            const distance = Math.hypot(pose.x - lastPose.x, pose.z - lastPose.z);
            if (distance < 1) stepDistance += distance;
            if (stepDistance >= 0.9) {
                stepDistance -= 0.9;
                noise(indoors ? 290 : 620, indoors ? 0.64 : 0.54, indoors ? 0.13 : 0.21);
            }
        }
        lastPose = pose;

        const dx = generatorPosition.x - pose.x;
        const dz = generatorPosition.z - pose.z;
        const distance = Math.hypot(dx, dz);
        const heading = (pose.yaw * Math.PI) / 180;
        const pan = (dx * Math.cos(heading) - dz * Math.sin(heading)) / Math.max(1, distance);
        motorPan.pan.value = pan;
        motorGain.gain.value = running ? 0.042 * Math.max(0, 1 - distance / 13) ** 2 : 0;
    }

    return {
        context,
        door,
        returnSound,
        update,
        setActive(active: boolean) {
            master.gain.setTargetAtTime(active ? 1 : 0, context.currentTime, 0.04);
            lastPose = undefined;
            stepDistance = 0;
        }
    };
}
