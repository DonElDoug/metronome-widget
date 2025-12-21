import React, { useRef, useState } from 'react';

interface DualSliderProps {
    label: string;
    value: [number, number]; // [start, end]
    min: number;
    max: number;
    step?: number;
    onChange: (value: [number, number]) => void;
    unit?: string;
}

export function DualSlider({ label, value, min, max, step = 1, onChange, unit = '' }: DualSliderProps) {
    const trackRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState<'start' | 'end' | null>(null);

    const getPercentage = (val: number) => ((val - min) / (max - min)) * 100;

    const handlePointerDown = (e: React.PointerEvent, handle: 'start' | 'end') => {
        setIsDragging(handle);
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging || !trackRef.current) return;

        const rect = trackRef.current.getBoundingClientRect();
        const percent = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100));
        const newValue = Math.round((percent * (max - min) / 100) / step) * step + min;

        // Clamping logic
        const clampedValue = Math.min(max, Math.max(min, newValue));

        if (isDragging === 'start') {
            const newStart = Math.min(clampedValue, value[1]);
            onChange([newStart, value[1]]);
        } else {
            const newEnd = Math.max(clampedValue, value[0]);
            onChange([value[0], newEnd]);
        }
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        setIsDragging(null);
        e.currentTarget.releasePointerCapture(e.pointerId);
    };

    const startPercent = getPercentage(value[0]);
    const endPercent = getPercentage(value[1]);

    return (
        <div className="space-y-2 group">
            <div className="flex justify-between items-end">
                <label className="text-sm text-text/60 uppercase tracking-widest font-bold group-hover:text-accent transition-colors duration-300">
                    {label}
                </label>
                <div className="font-mono text-xl tabular-nums text-text space-x-2">
                    <span>{value[0]}{unit}</span>
                    <span className="text-text/50">-</span>
                    <span>{value[1]}{unit}</span>
                </div>
            </div>

            <div
                className="relative w-full h-8 flex items-center cursor-pointer touch-none"
                ref={trackRef}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
            >
                {/* Track Background */}
                <div className="absolute w-full h-2 bg-neutral-850 rounded-full overflow-hidden">
                    {/* Active Range Fill */}
                    <div
                        className="absolute h-full opacity-50 transition-all duration-75"
                        style={{ left: `${startPercent}%`, width: `${endPercent - startPercent}%`, backgroundColor: 'var(--accent-color)' }}
                    />
                </div>

                {/* Start Handle */}
                <div
                    className="absolute h-5 w-5 bg-white rounded-full shadow-lg border-2 z-20 hover:scale-110 active:scale-110 transition-transform"
                    style={{ left: `calc(${startPercent}% - 10px)`, borderColor: 'var(--accent-color)' }}
                    onPointerDown={(e) => handlePointerDown(e, 'start')}
                />

                {/* End Handle */}
                <div
                    className="absolute h-5 w-5 bg-white rounded-full shadow-lg border-2 z-20 hover:scale-110 active:scale-110 transition-transform"
                    style={{ left: `calc(${endPercent}% - 10px)`, borderColor: 'var(--accent-color)' }}
                    onPointerDown={(e) => handlePointerDown(e, 'end')}
                />
            </div>
        </div>
    );
}
