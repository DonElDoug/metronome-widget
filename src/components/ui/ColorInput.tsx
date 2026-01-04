

interface ColorInputProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
}

export function ColorInput({ label, value, onChange }: ColorInputProps) {
    return (
        <div className="group flex items-center justify-between w-full">
            <label
                className="text-sm font-medium tracking-wide transition-colors duration-300"
                style={{ color: 'var(--text-color)', opacity: 0.8 }}
            >
                {label}
            </label>

            <div className="flex items-center gap-2 sm:gap-3">
                <span className="font-mono text-[10px] sm:text-xs opacity-50 uppercase" style={{ color: 'var(--text-color)' }}>
                    {value}
                </span>

                <div
                    className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden shadow-lg border-2 border-white/10 group-hover:scale-110 transition-transform duration-300"
                    style={{ backgroundColor: value }}
                >
                    <input
                        type="color"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="absolute inset-0 w-[200%] h-[200%] -top-1/2 -left-1/2 cursor-pointer opacity-0"
                    />
                </div>
            </div>
        </div>
    );
}
