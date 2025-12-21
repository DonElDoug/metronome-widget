// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MetronomeEngine } from './MetronomeEngine';

// Mock Web Audio API
const mockAudioContext = {
    state: 'suspended',
    resume: vi.fn(),
    createBufferSource: () => ({
        buffer: null,
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
    }),
    decodeAudioData: vi.fn().mockResolvedValue({}),
    currentTime: 0,
    destination: {},
};

// Start is protected by checking window.AudioContext.
// We need to mock window.AudioContext
const AudioContextMock = vi.fn(() => mockAudioContext);

describe('MetronomeEngine', () => {
    let engine: MetronomeEngine;

    beforeEach(() => {
        vi.stubGlobal('AudioContext', AudioContextMock);
        // Also stub fetch for loadSound
        global.fetch = vi.fn().mockResolvedValue({
            arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
        });
        engine = new MetronomeEngine();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should initialize with default values', () => {
        expect(engine.bpm).toBe(100);
        expect(engine.isPlaying).toBe(false);
    });

    it('should initialize AudioContext on init()', async () => {
        await engine.init();
        expect(engine.audioContext).toBeDefined();
        expect(global.fetch).toHaveBeenCalledWith('/audio/click.wav');
    });

    it('should start playing', async () => {
        await engine.init();
        engine.start();
        expect(engine.isPlaying).toBe(true);
        expect(mockAudioContext.resume).toHaveBeenCalled();
    });

    it('should stop playing', async () => {
        await engine.init();
        engine.start();
        engine.stop();
        expect(engine.isPlaying).toBe(false);
    });

    it('should update BPM', () => {
        engine.setBpm(120);
        expect(engine.bpm).toBe(120);
    });
});
