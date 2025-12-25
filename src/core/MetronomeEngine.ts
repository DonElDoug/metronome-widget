export type ScheduledNote = {
    time: number;
    beat: number;
};

export type SoundType = 'click' | 'beep' | 'woodblock' | 'hihat' | 'woodblock-high' | 'warning';

export class MetronomeEngine {
    audioContext: AudioContext | null = null;
    isPlaying = false;
    bpm = 100;
    lookahead = 25.0;
    scheduleAheadTime = 0.1;
    nextNoteTime = 0.0;
    timerID: number | null = null;

    beatCount = 0;
    beatsPerBar = 4;
    soundType: SoundType = 'click';
    useAccent = true;

    // Callbacks
    onTick: ((beat: number, time: number) => void) | null = null;
    shouldPlayNote: ((beat: number) => boolean) | null = null;
    getSoundOverride: ((beat: number) => SoundType | null) | null = null;

    // Sound buffers
    clickBuffer: AudioBuffer | null = null;

    constructor() { }

    async init() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            await this.loadSound('./audio/click.wav');
        }

        if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
    }

    async loadSound(url: string) {
        if (!this.audioContext) return;
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            this.clickBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        } catch (error) {
            console.error('Error loading sound:', error);
        }
    }

    start() {
        if (this.isPlaying) return;
        if (!this.audioContext) {
            this.init().then(() => this.start());
            return;
        }

        this.isPlaying = true;
        this.beatCount = 0;
        this.nextNoteTime = this.audioContext.currentTime;
        this.scheduler();
    }

    stop() {
        this.isPlaying = false;
        if (this.timerID !== null) {
            window.clearTimeout(this.timerID);
            this.timerID = null;
        }
    }

    setBpm(bpm: number) {
        this.bpm = bpm;
    }

    setSoundType(type: SoundType) {
        this.soundType = type;
    }

    setBeatsPerBar(beats: number) {
        this.beatsPerBar = beats;
        // Don't reset beatCount here to avoid rhythmic disruption, 
        // but it will affect the next accent calculation.
    }

    setUseAccent(value: boolean) {
        this.useAccent = value;
    }

    private scheduler() {
        while (this.nextNoteTime < (this.audioContext?.currentTime || 0) + this.scheduleAheadTime) {
            this.scheduleNote(this.nextNoteTime);
            this.nextNote();
        }

        if (this.isPlaying) {
            this.timerID = window.setTimeout(() => this.scheduler(), this.lookahead);
        }
    }

    private nextNote() {
        const secondsPerBeat = 60.0 / this.bpm;
        this.nextNoteTime += secondsPerBeat;
        this.beatCount++;
    }

    private scheduleNote(time: number) {
        // Play sound if allowed
        if (!this.shouldPlayNote || this.shouldPlayNote(this.beatCount)) {
            const isAccent = this.useAccent && (this.beatCount % this.beatsPerBar === 0);

            const sound = (this.getSoundOverride ? this.getSoundOverride(this.beatCount) : null) || this.soundType;
            const isWarning = sound === 'warning';
            const effectiveSound = isWarning ? this.soundType : sound;

            const warningMultiplier = 1.08; // Very subtle 8% pitch increase

            if (effectiveSound === 'click') {
                this.playClick(time, isAccent, isWarning ? warningMultiplier : 1.0);
            } else if (effectiveSound === 'beep') {
                this.playBeep(time, isAccent, isWarning ? warningMultiplier : 1.0);
            } else if (effectiveSound === 'woodblock' || effectiveSound === 'woodblock-high') {
                const baseMultiplier = effectiveSound === 'woodblock-high' ? 1.5 : 1.0;
                this.playWoodblock(time, isAccent, baseMultiplier * (isWarning ? warningMultiplier : 1.0));
            } else if (effectiveSound === 'hihat') {
                this.playHiHat(time, isAccent, isWarning ? warningMultiplier : 1.0);
            }
        }

        if (this.onTick) {
            this.onTick(this.beatCount, time);
        }
    }

    private playClick(time: number, isAccent: boolean, pitchMultiplier: number = 1.0) {
        if (!this.audioContext || !this.clickBuffer) return;

        const source = this.audioContext.createBufferSource();
        source.buffer = this.clickBuffer;

        // Pitch shift for accent and warning
        source.playbackRate.value = (isAccent ? 1.5 : 1.0) * pitchMultiplier;

        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = isAccent ? 1.0 : 0.8;

        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        source.start(time);
    }

    private playBeep(time: number, isAccent: boolean, pitchMultiplier: number = 1.0) {
        if (!this.audioContext) return;

        const osc = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        osc.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        const freq = (isAccent ? 1200 : 800) * pitchMultiplier;
        osc.frequency.setValueAtTime(freq, time);
        osc.type = 'sine';

        gainNode.gain.setValueAtTime(isAccent ? 1.0 : 0.7, time);
        gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

        osc.start(time);
        osc.stop(time + 0.1);
    }

    private playWoodblock(time: number, isAccent: boolean, freqMultiplier: number = 1.0) {
        if (!this.audioContext) return;

        const osc = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        osc.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        const baseFreq = isAccent ? 1000 : 750;
        const freq = baseFreq * freqMultiplier;

        osc.frequency.setValueAtTime(freq, time);
        // Pitch envelope for "wood" sound
        osc.frequency.exponentialRampToValueAtTime(freq * 0.5, time + 0.05);
        osc.type = 'triangle';

        // Short percussive envelope
        gainNode.gain.setValueAtTime(isAccent ? 1.0 : 0.8, time);
        gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

        osc.start(time);
        osc.stop(time + 0.1);
    }
    private playHiHat(time: number, isAccent: boolean, pitchMultiplier: number = 1.0) {
        if (!this.audioContext) return;

        // Bandpass Filter for metallic sound
        const bandpass = this.audioContext.createBiquadFilter();
        bandpass.type = "bandpass";
        bandpass.frequency.value = 10000 * pitchMultiplier;

        // Highpass to remove low rumble
        const highpass = this.audioContext.createBiquadFilter();
        highpass.type = "highpass";
        highpass.frequency.value = 7000 * pitchMultiplier;

        // Gain (Envelope)
        const gainNode = this.audioContext.createGain();
        const volume = isAccent ? 0.6 : 0.4;

        // Setup White Noise buffer
        const bufferSize = this.audioContext.sampleRate * 0.1; // 0.1s noise clip
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.audioContext.createBufferSource();
        noise.buffer = buffer;

        // Graph: Noise -> Bandpass -> Highpass -> Gain -> Destination
        noise.connect(bandpass);
        bandpass.connect(highpass);
        highpass.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        // Envelope: Short sharp decay
        gainNode.gain.setValueAtTime(volume, time);
        gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.05);

        noise.start(time);
        // Clean up noise source automatically or slightly after
        // Note: noise buffer is short, but we can stop explicitely
        noise.stop(time + 0.1);
    }
}
