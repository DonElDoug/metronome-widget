

interface SliderProps {
    label: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    onChange: (value: number) => void;
    unit?: string;
}

export function Slider({ label, value, min, max, step = 1, onChange, unit = '' }: SliderProps) {
    const percentage = ((value - min) / (max - min)) * 100;

    return (
        <div className="space-y-2 group">
            <div className="flex justify-between items-end">
                <label className="text-sm text-text/60 uppercase tracking-widest font-bold group-hover:text-accent transition-colors duration-300">
                    {label}
                </label>
                <span className="font-mono text-xl tabular-nums text-text">
                    {value}{unit}
                </span>
            </div>
            <div className="relative w-full h-6 flex items-center cursor-pointer">
                {/* Track Background */}
                <div className="absolute w-full h-2 bg-neutral-850 rounded-full overflow-hidden">
                    {/* Fill */}
                    <div
                        className="h-full transition-all duration-100 ease-out"
                        style={{ width: `${percentage}%`, backgroundColor: 'var(--accent-color)' }}
                    />
                </div>

                {/* Thumb (invisible native input for interaction, visible styled thumb for looks) */}
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />

                {/* Custom Thumb Visual */}
                <div
                    className="absolute h-5 w-5 bg-white rounded-full shadow-lg border-2 transition-all duration-100 ease-out pointer-events-none"
                    style={{ left: `calc(${percentage}% - 10px)`, borderColor: 'var(--accent-color)' }}
                />
            </div>
        </div>
    );
}
