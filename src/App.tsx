import { useEffect, useRef, useState } from 'react';
import { MetronomeEngine, SoundType } from './core/MetronomeEngine';
import { Play, Minus, Plus, Settings, Gauge, Shuffle } from 'lucide-react';
import { TapButton } from './components/TapButton';
import { SpeedSettings, SpeedSettingsData } from './components/SpeedSettings';
import { RandomSettings, RandomSettingsData } from './components/RandomSettings';
import { useTimer, TimerMode } from './hooks/useTimer';
import { TimerDisplay } from './components/TimerDisplay';
import { SettingsModal } from './components/SettingsModal';

function App() {
    const [engine] = useState(() => new MetronomeEngine());
    const [isPlaying, setIsPlaying] = useState(false);
    const [bpm, setBpm] = useState(100);

    // Modals
    const [showSpeedSettings, setShowSpeedSettings] = useState(false);
    const [showRandomSettings, setShowRandomSettings] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    const timer = useTimer();

    // Mode States
    const [speedConfig, setSpeedConfig] = useState<SpeedSettingsData | null>(null);
    const [randomConfig, setRandomConfig] = useState<RandomSettingsData | null>(null);
    const [soundType, setSoundType] = useState<SoundType>('click');
    const [timeSignature, setTimeSignature] = useState<{ numerator: number, denominator: number } | null>({ numerator: 4, denominator: 4 });

    // Visual Sync Queue
    const visualQueueRef = useRef<{ time: number; beat: number }[]>([]);
    const animationFrameRef = useRef<number>();
    const reactorRef = useRef<HTMLButtonElement>(null);
    const tapHandlerRef = useRef<((newBpm: number) => void) | null>(null);

    const stateRef = useRef({
        bpm: 100,
        speedConfig: null as SpeedSettingsData | null,
        randomConfig: null as RandomSettingsData | null,
        speedBarCounter: 0,
        randomBarCounter: 0,
        randomPattern: [] as boolean[],
        lastBeatTime: 0,
        timeSignature: { numerator: 4, denominator: 4 }, // Default 4/4
    });

    // Sync refs
    useEffect(() => {
        stateRef.current.bpm = bpm;
        stateRef.current.speedConfig = speedConfig;
        stateRef.current.randomConfig = randomConfig;
    }, [bpm, speedConfig, randomConfig]);

    useEffect(() => {
        engine.init();

        // Logic to determine if a note should play (Random Mode)
        engine.shouldPlayNote = (beatTotal) => {
            const { randomConfig } = stateRef.current;
            if (!randomConfig || !randomConfig.enabled) return true;

            const beatsPerBar = 4;
            const barIndex = Math.floor(beatTotal / beatsPerBar);
            const beatInBar = beatTotal % beatsPerBar;

            return getBarVisibility(barIndex, randomConfig.percentage, randomConfig.bars, beatInBar);
        };

        const barVisibilityCache = new Map<number, boolean>();

        function getBarVisibility(barIdx: number, percentage: number, _patternLength: number, _beatInBar: number) {
            if (barVisibilityCache.has(barIdx)) return barVisibilityCache.get(barIdx)!;

            const isSilent = Math.random() * 100 < percentage;
            const result = (barIdx === 0) ? true : !isSilent; // First bar always audible

            barVisibilityCache.set(barIdx, result);

            if (barVisibilityCache.size > 20) {
                const keys = Array.from(barVisibilityCache.keys()).sort((a, b) => a - b);
                if (keys.length > 0) barVisibilityCache.delete(keys[0]);
            }

            return result;
        }

        engine.onTick = (beat, time) => {
            // Push to visual queue for precise sync
            visualQueueRef.current.push({ beat, time });
        };

        // Visual Sync Loop (High Priority)
        const syncLoop = () => {
            const currentTime = engine.audioContext?.currentTime || 0;
            const queue = visualQueueRef.current;
            const state = stateRef.current;

            // 1. Process Queue (Trigger Beat Events)
            while (queue.length > 0 && queue[0].time <= currentTime + 0.03) {
                const event = queue.shift();
                if (event) {
                    state.lastBeatTime = event.time; // Record Sync Point
                    handleVisualTick(event.beat);
                }
            }

            // 2. Continuous Visualizer Updates (Speed Mode Only)
            // Normal Mode is now STATIC (Glassy Flash Only), no circulation.
            if (visualizerRef.current && currentTime > state.lastBeatTime) {
                const { speedConfig } = state;

                if (speedConfig) {
                    // Keep logic for Speed Mode (if meaningful) or refactor
                }
            } else if (visualizerRef.current && !state.speedConfig) {
                // Force static full ring in Normal Mode (Glassy Base)
                visualizerRef.current.style.strokeDashoffset = '0';
            }

            animationFrameRef.current = requestAnimationFrame(syncLoop);
        };

        if (isPlaying) {
            visualQueueRef.current = []; // Clear queue on start
            syncLoop();
        } else {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        }

        return () => {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
    }, [isPlaying, engine]); // Removed bpm/timer dep to avoid re-running init logic unnecessarily

    const handleVisualTick = (_beatIndex: number) => {
        const { speedConfig, timeSignature } = stateRef.current; // Get timeSignature

        // Glassy Flash Logic (Normal Mode)
        if (!speedConfig && visualizerRef.current && isPlaying) {
            const isNoAccent = !timeSignature;
            const currentBeat = isNoAccent ? 2 : (stateRef.current.speedBarCounter % timeSignature.numerator) + 1; // 1-based beat
            stateRef.current.speedBarCounter++; // Use counter as beat tracker for Normal Mode too

            // Reset any residual animations
            visualizerRef.current.classList.remove('glass-flash-strong', 'glass-flash-weak');
            void visualizerRef.current.getBoundingClientRect(); // Force reflow (safely cast if needed, or use BCR)

            // Beat 1 = Strong Flash, Others = Weak Flash
            if (currentBeat === 1) {
                visualizerRef.current.classList.add('glass-flash-strong');
            } else {
                visualizerRef.current.classList.add('glass-flash-weak');
            }

            // Remove class after short duration for "Flash" feel
            setTimeout(() => {
                if (visualizerRef.current) {
                    visualizerRef.current.classList.remove('glass-flash-strong', 'glass-flash-weak');
                }
            }, 100);

            // Ensure ring is FULL (visible) for flash, not empty
            visualizerRef.current.style.strokeDashoffset = '0';
        }

        if (speedConfig && speedConfig.enabled) {
            handleSpeedModeTick();
        }
    };

    const handleSpeedModeTick = () => {
        const { speedConfig, bpm } = stateRef.current;
        if (!speedConfig) return;

        const beatsPerBar = 4;
        const totalBeatsInStep = speedConfig.bars * beatsPerBar;

        stateRef.current.speedBarCounter++;
        const currentStepBeat = stateRef.current.speedBarCounter;

        // Visualizer Update (Layered Ripple Style)
        if (visualizerRef.current) {
            // Speed Mode: Fill the Orb based on progress
            const progress = Math.min(currentStepBeat / totalBeatsInStep, 1);
            const circumference = 2 * Math.PI * 56;
            const offset = circumference * (1 - progress);
            visualizerRef.current.style.strokeDashoffset = offset.toString();
            // Remove pulse animation in speed mode to focus on progress
        }

        if (currentStepBeat >= totalBeatsInStep) {
            stateRef.current.speedBarCounter = 0;
            if (bpm >= speedConfig.endBpm) {
                engine.stop();
                timer.stop();
                setIsPlaying(false);
                setSpeedConfig(null);
                // Flute play...
                const flute = new Audio('./audio/flute_japan.mp3');
                flute.play().catch(e => console.error("Flute play error", e));
            } else {
                let newBpm = bpm + speedConfig.increment;
                if (newBpm > speedConfig.endBpm) newBpm = speedConfig.endBpm;
                engine.setBpm(newBpm);
                setBpm(newBpm);
                if (visualizerRef.current) {
                    visualizerRef.current.style.strokeDashoffset = (2 * Math.PI * 56).toString();
                }
            }
        }
    };

    const togglePlay = () => {
        if (isPlaying) {
            engine.stop();
            timer.stop();
            setIsPlaying(false);
        } else {
            engine.start();
            timer.start();
            setIsPlaying(true);
        }
    };

    // Auto-stop if timer finishes (Countdown)
    useEffect(() => {
        if (timer.mode === TimerMode.Idle && isPlaying && timer.timeMs === 0) {
            // Timer finished naturally (countdown hit 0)
            // Stop engine
            engine.stop();
            setIsPlaying(false);
        }
    }, [timer.mode, timer.timeMs, isPlaying, engine]);

    const updateBpm = (newBpm: number, manual = false) => {
        let finalBpm = newBpm;

        // Smart Rounding for Manual Controls
        if (manual) {
            // Find nearest multiple of 5
            // If we are increasing (e.g. 102 -> 103), snap forward to next 5
            const diff = newBpm - bpm;
            if (diff > 0) {
                finalBpm = Math.ceil(newBpm / 5) * 5;
            } else {
                finalBpm = Math.floor(newBpm / 5) * 5;
            }
        }

        const clamped = Math.max(30, Math.min(300, finalBpm));
        setBpm(clamped);
        engine.setBpm(clamped);
    };

    const handleSoundChange = (type: SoundType) => {
        setSoundType(type);
        engine.setSoundType(type);
    };

    const handleSpeedSave = (data: SpeedSettingsData) => {
        setSpeedConfig(data);
        setRandomConfig(null);
        setBpm(data.startBpm);
        engine.setBpm(data.startBpm);
        stateRef.current.speedBarCounter = 0; // Start fresh

        if (data.estimatedDuration) {
            timer.setTime(data.estimatedDuration * 1000); // Convert seconds to ms
        }
    };

    const handleRandomSave = (data: RandomSettingsData) => {
        setRandomConfig(data);
        setSpeedConfig(null);
    };

    const visualizerRef = useRef<SVGCircleElement>(null);

    // Deprecated handleTick removed



    // Determine active accent color
    const getActiveAccentColor = () => {
        if (speedConfig) return 'var(--speed-color)';
        if (randomConfig) return 'var(--random-color)';
        return null; // Return null to indicate no override needed (use global)
    };

    const activeAccentOverride = getActiveAccentColor();
    const activeAccentRgb = speedConfig ? 'var(--speed-rgb)' : randomConfig ? 'var(--random-rgb)' : 'var(--accent-rgb)';

    const appStyle = {
        backgroundColor: 'var(--bg-color)',
        color: 'var(--text-color)',
        // Apply override only if we are in a special mode
        ...(activeAccentOverride ? {
            '--accent-color': activeAccentOverride,
            '--accent-rgb': activeAccentRgb
        } : {})
    };

    // Tap tempo logic
    const tapTimesRef = useRef<number[]>([]);
    const lastTapTimeRef = useRef<number>(0);

    const handleBackgroundTap = (e: React.MouseEvent) => {
        // Only trigger if clicking the background directly (not child elements)
        if (e.target !== e.currentTarget) return;

        const now = performance.now();
        const timeSinceLastTap = now - lastTapTimeRef.current;

        // Reset if pause is too long (> 2 seconds)
        if (timeSinceLastTap > 2000) {
            tapTimesRef.current = [now];
            lastTapTimeRef.current = now;
            return;
        }

        // Add new tap
        const newTaps = [...tapTimesRef.current, now].slice(-8); // Keep last 8 taps
        tapTimesRef.current = newTaps;
        lastTapTimeRef.current = now;

        // Calculate BPM if we have enough taps
        if (newTaps.length >= 2) {
            const intervals = [];
            for (let i = 1; i < newTaps.length; i++) {
                intervals.push(newTaps[i] - newTaps[i - 1]);
            }
            const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
            const newBpm = Math.round(60000 / avgInterval);

            // Clamp to reasonable range
            const clampedBpm = Math.max(30, Math.min(300, newBpm));
            updateBpm(clampedBpm, false);
        }
    };

    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center font-mono select-none overflow-hidden transition-colors duration-300"
            // @ts-ignore
            style={appStyle}
        >
            {/* 
               Main Container
               CARD SIZE LOCATION:
               - max-w-2xl: Controls the width (~672px)
               - min-h-[...]: Controls the minimum height
            */}
            <div
                className="relative w-auto h-[85vh] max-w-[95vw] aspect-[3/5] p-[2vmin] rounded-[5vmin] shadow-2xl flex flex-col items-center justify-between gap-[1vh] transition-colors duration-300 overflow-hidden"
                style={{
                    backgroundColor: 'var(--card-bg)',
                    '--beat-duration': `${60 / Math.max(1, bpm)}s`
                } as React.CSSProperties}
            >

                {/* Top Bar Icons - Elegant & Discreet */}
                <div className="absolute top-[3%] left-[6%] right-[6%] flex items-center justify-between z-20">
                    <div className="flex items-center gap-10">
                        <div
                            className="cursor-pointer transition-all duration-300 opacity-30 hover:opacity-100 hover:scale-110 active:scale-95"
                            style={{ color: speedConfig ? 'var(--accent-color)' : undefined, opacity: speedConfig ? 1 : undefined }}
                            onClick={() => {
                                if (speedConfig) {
                                    setSpeedConfig(null);
                                    stateRef.current.speedBarCounter = 0;
                                    timer.reset();
                                } else {
                                    setShowSpeedSettings(true);
                                }
                            }}
                        >
                            <Gauge size={26} strokeWidth={1.2} />
                        </div>

                        <div
                            className="cursor-pointer transition-all duration-300 opacity-30 hover:opacity-100 hover:scale-110 active:scale-95"
                            style={{ color: randomConfig ? 'var(--accent-color)' : undefined, opacity: randomConfig ? 1 : undefined }}
                            onClick={() => {
                                if (randomConfig) {
                                    setRandomConfig(null);
                                } else {
                                    setShowRandomSettings(true);
                                }
                            }}
                        >
                            <Shuffle size={26} strokeWidth={1.2} />
                        </div>
                    </div>

                    {/* Active Mode Header */}
                    {(speedConfig || randomConfig) && (
                        <div
                            className="font-medium uppercase tracking-[0.5em] text-[10px] pointer-events-none opacity-20 ml-4"
                            style={{ color: 'var(--accent-color)' }}
                        >
                            {speedConfig ? 'Speed' : 'Random'}
                        </div>
                    )}

                    <div
                        className="cursor-pointer opacity-30 hover:opacity-100 transition-all duration-300 hover:scale-110 active:scale-95"
                        onClick={() => setShowSettings(true)}
                    >
                        <Settings size={26} strokeWidth={1.2} />
                    </div>
                </div>

                {/* Center Group: Timer & BPM */}
                <div className="flex flex-col items-center justify-center w-full gap-[0.5vh] z-10 flex-1">

                    {/* Timer */}
                    <div className="mb-[2vh]">
                        <TimerDisplay
                            timeMs={timer.timeMs}
                            onAddFiveMinutes={() => timer.addTime(5 * 60 * 1000)}
                            onReset={() => {
                                timer.reset();
                                setIsPlaying(false);
                                stateRef.current.speedBarCounter = 0; // Reset beat counter
                                timer.stop();
                                engine.stop();
                                if (visualizerRef.current) {
                                    visualizerRef.current.classList.remove('glass-flash-strong', 'glass-flash-weak');
                                    // Reset to "waiting" state (e.g. Empty or Dim?) logic says "Static"
                                }
                                setIsPlaying(false);
                            }
                            }
                            showReset={!isPlaying && timer.timeMs > 0}
                        />
                    </div>

                    <div className="flex flex-col items-center justify-center w-full">
                        <div className="flex items-center justify-center gap-[4vw] w-full" style={{ color: 'var(--accent-color)' }}>
                            <button
                                onClick={() => updateBpm(bpm - 1, true)}
                                className="p-[1.5vmin] hover:scale-110 active:scale-95 transition-all duration-300 opacity-30 hover:opacity-100 group"
                            >
                                <Minus size={48} strokeWidth={1} className="transition-all" />
                            </button>

                            <div className="flex flex-col items-center justify-center select-none py-[1vh]">
                                <div className="text-[12vh] font-bold tabular-nums tracking-tighter leading-none transition-all duration-500">
                                    {bpm}
                                </div>
                                <div className="text-[1.2vh] tracking-[0.2em] font-bold mt-[0.5vh] uppercase text-[var(--accent-color)] opacity-80">BPM</div>
                            </div>

                            <button
                                onClick={() => updateBpm(bpm + 1, true)}
                                className="p-[1.5vmin] hover:scale-110 active:scale-95 transition-all duration-300 opacity-30 hover:opacity-100 group"
                            >
                                <Plus size={48} strokeWidth={1} className="transition-all" />
                            </button>
                        </div>

                        {/* Tap Button - Hidden but functional via background tap */}
                        <div className="mt-[2vh] flex justify-center hidden">
                            <TapButton onTempoChange={(newBpm) => {
                                tapHandlerRef.current = () => updateBpm(newBpm, false);
                                updateBpm(newBpm, false);
                            }} />
                        </div>
                    </div>
                </div>





                {/* Layered Ripple Play Button (Minimalist & Organic) */}
                <div className="relative group z-10 mb-[8vh] flex items-center justify-center">

                    {/* Invisible Tap Zone - Covers play button area for tap tempo */}
                    <div
                        onClick={handleBackgroundTap}
                        className="absolute inset-0 -m-[10vh] z-30 cursor-pointer"
                        style={{ pointerEvents: 'auto' }}
                    />

                    {/* The Ripple Orb (Interactive) - Progress Ring */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <svg className="w-[21vmin] h-[21vmin] rotate-[-90deg]" viewBox="0 0 200 200">
                            {/* Base Ring (Track - Neutral Dark) */}
                            <circle cx="100" cy="100" r="56" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" className="opacity-100" />

                            {/* Active Ring (Breathing/Progress) */}
                            <circle
                                ref={visualizerRef}
                                cx="100" cy="100" r="56"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="10"
                                strokeLinecap="round"
                                style={{
                                    stroke: 'var(--accent-color)',
                                    strokeDasharray: 2 * Math.PI * 56,
                                    strokeDashoffset: speedConfig ? 2 * Math.PI * 56 : 0,
                                    opacity: speedConfig ? 1 : 0.8,
                                    transition: 'all 0.1s ease-out',
                                    filter: 'drop-shadow(0 0 8px var(--accent-color))'
                                }}
                                className={`chrono-ring glass-ring-base ${isPlaying && speedConfig ? 'animate-ring-heartbeat' : ''}`}
                            />
                        </svg>
                    </div>

                    {/* Play/Pause Button */}


                    {/* The Core Button (Pure & Tactile) */}
                    <button
                        ref={reactorRef}
                        onClick={togglePlay}
                        // Fluid sizing
                        className={`relative w-[max(64px,13vmin)] h-[max(64px,13vmin)] rounded-full flex items-center justify-center transition-all duration-300 z-40 overflow-hidden group ${isPlaying ? 'neu-layered-pressed' : 'neu-layered-raised'}`}
                        style={{
                            backgroundColor: 'var(--card-bg)',
                            color: 'var(--accent-color)',
                            border: '1px solid rgba(255,255,255,0.03)'
                        }}
                    >
                        {/* Inner Soft Glow */}


                        {isPlaying ? (
                            <div className="flex gap-2.5 z-10 transition-transform duration-300 scale-90">
                                <div className="w-2 h-8 bg-current rounded-full opacity-90 shadow-[0_0_10px_currentColor]" />
                                <div className="w-2 h-8 bg-current rounded-full opacity-90 shadow-[0_0_10px_currentColor]" />
                            </div>
                        ) : (
                            <Play size={48} className="ml-1.5 z-10 text-current opacity-100 transition-transform duration-300 hover:scale-110" fill="currentColor" style={{ filter: 'drop-shadow(0 0 8px currentColor)' }} />
                        )}
                    </button>
                </div>

                <div className="flex z-30 justify-center gap-2 pb-[4%]">
                    {[
                        { n: 4, d: 4, label: '4/4' },
                        { n: 3, d: 4, label: '3/4' },
                        { n: 2, d: 4, label: '2/4' },
                        { n: 6, d: 8, label: '6/8' },
                        { n: 0, d: 0, label: 'None' }
                    ].map((sig) => (
                        <button
                            key={sig.label}
                            onClick={() => {
                                if (sig.label === 'None') {
                                    setTimeSignature(null);
                                    engine.setUseAccent(false);
                                } else {
                                    setTimeSignature({ numerator: sig.n, denominator: sig.d });
                                    stateRef.current.timeSignature = { numerator: sig.n, denominator: sig.d };
                                    engine.setBeatsPerBar(sig.n);
                                    engine.setUseAccent(true);
                                }
                                stateRef.current.speedBarCounter = 0;
                            }}
                            className={`text-[10px] font-bold px-3 py-1.5 rounded-full transition-all border ${(sig.label === 'None' && timeSignature === null) ||
                                    (timeSignature && timeSignature.numerator === sig.n && timeSignature.denominator === sig.d)
                                    ? 'bg-neutral-800 text-[var(--accent-color)] border-[var(--accent-color)]'
                                    : 'text-neutral-500 border-transparent hover:text-neutral-300 hover:bg-neutral-800/50'
                                }`}
                        >
                            {sig.label}
                        </button>
                    ))}
                </div>
            </div>

            <SpeedSettings
                isOpen={showSpeedSettings}
                onClose={() => setShowSpeedSettings(false)}
                onSave={handleSpeedSave}
            />

            <RandomSettings
                isOpen={showRandomSettings}
                onClose={() => setShowRandomSettings(false)}
                onSave={handleRandomSave}
            />

            <SettingsModal
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
                onSoundChange={handleSoundChange}
                currentSound={soundType}
            />

        </div >
    );
}

export default App;
