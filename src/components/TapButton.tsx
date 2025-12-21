import { MouseEvent, useRef, useState } from 'react';

interface TapButtonProps {
    onTempoChange: (bpm: number) => void;
}

export function TapButton({ onTempoChange }: TapButtonProps) {
    const [taps, setTaps] = useState<number[]>([]);
    const lastTapTime = useRef<number>(0);
    const [isPulsing, setIsPulsing] = useState(false);

    const handleTap = (e: MouseEvent) => {
        // Prevent focus to avoid keyboard triggering if using Space for play/pause
        e.preventDefault();
        (e.target as HTMLElement).blur();

        // Trigger animation
        setIsPulsing(true);
        setTimeout(() => setIsPulsing(false), 150);

        const now = performance.now();
        const timeSinceLastTap = now - lastTapTime.current;

        // Reset if pause is too long (> 2 seconds)
        if (timeSinceLastTap > 2000) {
            setTaps([now]);
            lastTapTime.current = now;
            return;
        }

        const newTaps = [...taps, now];
        // Keep last 4 taps for average
        if (newTaps.length > 4) {
            newTaps.shift();
        }

        setTaps(newTaps);
        lastTapTime.current = now;

        if (newTaps.length >= 2) {
            // Calculate BPM
            const intervals = [];
            for (let i = 1; i < newTaps.length; i++) {
                intervals.push(newTaps[i] - newTaps[i - 1]);
            }
            const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
            const newBpm = Math.round(60000 / avgInterval);

            // Constrain BPM
            const clamped = Math.max(30, Math.min(300, newBpm));
            onTempoChange(clamped);
        }
    };

    return (
        <button
            onMouseDown={handleTap}
            className={`relative group outline-none isolate rounded-full ${isPulsing ? 'animate-tap-pulse' : ''}`}
            title="Tap Tempo"
            style={{
                // Screen lighting effect (refined subtle bloom)
                boxShadow: isPulsing ? '0 0 60px 10px rgba(var(--accent-rgb), 0.12)' : 'none',
                transition: 'box-shadow 0.2s ease-out'
            }}
        >
            {/* Main Button (Flat Minimal) */}
            <div
                className={`
                    relative z-20 w-[8vmin] h-[8vmin] rounded-full border-2 flex items-center justify-center
                    transition-all duration-150 font-bold tracking-[0.2em] text-sm pl-[0.2em]
                    uppercase
                `}
                style={{
                    borderColor: 'var(--accent-color)',
                    color: isPulsing ? 'var(--bg-color)' : 'var(--accent-color)',
                    backgroundColor: isPulsing ? 'var(--accent-color)' : 'transparent',
                }}
            >
                TAP
            </div>
        </button>
    );
}
