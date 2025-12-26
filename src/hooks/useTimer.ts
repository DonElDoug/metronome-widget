import { useState, useRef, useCallback } from 'react';

// Modes
export enum TimerMode {
    Idle = 0,
    Countdown = 1,
    Stopwatch = 2,
}

const MAX_COUNTDOWN_MS = 30 * 60 * 1000; // 30 minutes

export function useTimer() {
    const [mode, setMode] = useState<TimerMode>(TimerMode.Idle);
    const [timeMs, setTimeMs] = useState(0);
    const [isRunning, setIsRunning] = useState(false);

    // Refs for synchronous access in RAF loop
    const modeRef = useRef(TimerMode.Idle);
    const isRunningRef = useRef(false);

    const lastTimestamp = useRef<number | null>(null);
    const rafId = useRef<number | null>(null);

    const tick = useCallback((timestamp: number) => {
        if (!isRunningRef.current) return;

        if (lastTimestamp.current === null) {
            lastTimestamp.current = timestamp;
        }
        const delta = timestamp - lastTimestamp.current;
        lastTimestamp.current = timestamp;

        setTimeMs((prev) => {
            const currentMode = modeRef.current;
            if (currentMode === TimerMode.Countdown) {
                const nextTime = prev - delta;
                if (nextTime <= 0) {
                    // Timer Finished
                    stop();
                    setMode(TimerMode.Idle);
                    modeRef.current = TimerMode.Idle;
                    return 0;
                }
                return nextTime;
            } else if (currentMode === TimerMode.Stopwatch) {
                return prev + delta;
            }
            return prev;
        });

        rafId.current = requestAnimationFrame(tick);
    }, []);

    const start = useCallback(() => {
        if (isRunningRef.current) return;

        // Auto-detect mode if in Idle
        if (modeRef.current === TimerMode.Idle) {
            // Check current timeMs state via a functional update or just rely on the fact 
            // that if we are calling start, we likely set time before.
            // CAUTION: timeMs is state. We need to know if it's > 0.
            // Since we can't reliably read state inside a callback without dependency,
            // we'll assume the caller logic is correct or use the setTimeMs callback to check.
            // Actually, better: trust the current state 'timeMs' dependency which is stable enough for this check.
            if (timeMs > 0) {
                setMode(TimerMode.Countdown);
                modeRef.current = TimerMode.Countdown;
            } else {
                setMode(TimerMode.Stopwatch);
                modeRef.current = TimerMode.Stopwatch;
            }
        }

        setIsRunning(true);
        isRunningRef.current = true;
        lastTimestamp.current = null;
        rafId.current = requestAnimationFrame(tick);
    }, [timeMs, tick]);

    const stop = useCallback(() => {
        setIsRunning(false);
        isRunningRef.current = false;
        if (rafId.current) {
            cancelAnimationFrame(rafId.current);
            rafId.current = null;
        }
    }, []);

    const reset = useCallback(() => {
        stop();
        setTimeMs(0);
        setMode(TimerMode.Idle);
        modeRef.current = TimerMode.Idle;
    }, [stop]);

    const addTime = useCallback((ms: number) => {
        if (!isRunningRef.current && (modeRef.current === TimerMode.Idle || modeRef.current === TimerMode.Countdown)) {
            setTimeMs(prev => Math.min(prev + ms, MAX_COUNTDOWN_MS));
        }
    }, []);

    const setTime = useCallback((ms: number) => {
        if (!isRunningRef.current) {
            setTimeMs(ms);
            const newMode = ms > 0 ? TimerMode.Countdown : TimerMode.Stopwatch;
            setMode(newMode);
            modeRef.current = newMode;
        }
    }, []);

    return {
        timeMs,
        isRunning,
        mode,
        start,
        stop,
        reset,
        addTime,
        setTime
    };
}
