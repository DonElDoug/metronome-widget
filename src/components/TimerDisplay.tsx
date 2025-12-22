

interface TimerDisplayProps {
    timeMs: number;
    onAddFiveMinutes: () => void;
    onReset: () => void;
    showReset: boolean;
}

export function TimerDisplay({ timeMs, onAddFiveMinutes, onReset, showReset }: TimerDisplayProps) {

    const formatTime = (ms: number) => {
        if (ms < 0) ms = 0;
        const totalHundredths = Math.floor(ms / 10);
        const hundredths = totalHundredths % 100;
        const totalSeconds = Math.floor(totalHundredths / 100);
        const seconds = totalSeconds % 60;
        const minutes = Math.floor(totalSeconds / 60);

        return (
            <div className="flex items-baseline font-mono tabular-nums leading-none tracking-tight">
                <span className="text-[clamp(24px,6vmin,64px)] font-semibold text-white">
                    {String(minutes).padStart(2, '0')}
                </span>
                <span className="mx-1 opacity-5 font-thin text-[clamp(20px,5vmin,40px)]">:</span>
                <span className="text-[clamp(24px,6vmin,64px)] font-semibold text-white">
                    {String(seconds).padStart(2, '0')}
                </span>
                <span className="mx-0.5 opacity-5 text-[clamp(20px,5vmin,40px)] font-thin">.</span>
                <span className="text-[clamp(24px,6vmin,64px)] font-light text-white opacity-40">
                    {String(hundredths).padStart(2, '0')}
                </span>
            </div>
        );
    };

    return (
        <div className="flex flex-col items-center justify-center py-[0.5vh]" onClick={onAddFiveMinutes}>
            <div className="text-white transition-all duration-300 cursor-pointer select-none">
                {formatTime(timeMs)}
            </div>

            <div
                className={`mt-6 transition-all duration-300 ${showReset ? 'opacity-100 pointer-events-auto scale-100' : 'opacity-0 pointer-events-none scale-90'}`}
            >
                <button
                    onClick={(e) => { e.stopPropagation(); onReset(); }}
                    className="
                        group relative w-[ max(80px,10vmin) ] h-[ max(32px,4vmin) ] rounded-full 
                        flex items-center justify-center
                        transition-all duration-300 ease-out
                        overflow-hidden
                        neu-layered-raised active:neu-layered-pressed
                    "
                    style={{
                        backgroundColor: 'var(--card-bg)',
                        border: '1px solid rgba(255,255,255,0.03)',
                        color: 'var(--accent-color)'
                    }}
                    title="Reset Timer"
                >
                    {/* Inner Soft Glow (Matching Play Button Flow) */}
                    <div
                        className="absolute inset-0 transition-opacity duration-500 ease-in-out opacity-0 group-hover:opacity-60"
                        style={{
                            background: 'radial-gradient(circle at center, var(--accent-color), transparent 70%)',
                            filter: 'blur(8px)'
                        }}
                    />

                    <span
                        className="relative z-10 text-[max(11px,1.3vmin)] font-bold tracking-widest transition-colors duration-300"
                        style={{ color: 'currentcolor' }}
                    >
                        RESET
                    </span>
                </button>
            </div>
        </div>
    );
}
