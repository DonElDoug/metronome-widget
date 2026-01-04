import { Modal } from "./Modal";
import { useEffect, useState } from "react";
import { ColorInput } from "./ui/ColorInput";

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSoundChange: (sound: 'click' | 'beep' | 'woodblock' | 'hihat' | 'woodblock-high' | 'warning') => void;
    currentSound: 'click' | 'beep' | 'woodblock' | 'hihat' | 'woodblock-high' | 'warning';
}

type ThemePreset = {
    name: string;
    colors: {
        bg: string;
        card: string;
        accent: string;
        text: string;
    }
};

const PRESETS: ThemePreset[] = [
    {
        name: 'Default',
        colors: { bg: '#191919', card: '#262626', accent: '#29be6f', text: '#ffffff' }
    },
    {
        name: 'Ocean',
        colors: { bg: '#0f172a', card: '#1e293b', accent: '#38bdf8', text: '#f8fafc' }
    },
    {
        name: 'Midnight',
        colors: { bg: '#000000', card: '#111111', accent: '#6366f1', text: '#e2e8f0' }
    },
    {
        name: 'Forest',
        colors: { bg: '#052e16', card: '#064e3b', accent: '#34d399', text: '#ecfdf5' }
    },
    {
        name: 'Sunset',
        colors: { bg: '#4a0404', card: '#7f1d1d', accent: '#fca5a5', text: '#fff1f2' }
    }
];

export function SettingsModal({ isOpen, onClose, onSoundChange, currentSound }: SettingsModalProps) {
    const getVar = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

    // Helper to determine best text color (black/white) based on background
    const getContrastColor = (hexColor: string) => {
        // Convert hex to RGB
        const r = parseInt(hexColor.substr(1, 2), 16);
        const g = parseInt(hexColor.substr(3, 2), 16);
        const b = parseInt(hexColor.substr(5, 2), 16);

        // Calculate YIQ brightness
        const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;

        // Return black for bright colors, white for dark colors
        return (yiq >= 128) ? '#000000' : '#ffffff';
    };

    const [bgColor, setBgColor] = useState('#191919');
    const [cardColor, setCardColor] = useState('#262626');
    const [accentColor, setAccentColor] = useState('#29be6f');
    const [textColor, setTextColor] = useState('#ffffff');
    const [speedColor, setSpeedColor] = useState('#0ea5e9');
    const [randomColor, setRandomColor] = useState('#d946ef');

    useEffect(() => {
        if (isOpen) {
            setBgColor(getVar('--bg-color') || '#191919');
            setCardColor(getVar('--card-bg') || '#262626');
            setAccentColor(getVar('--accent-color') || '#29be6f');
            setTextColor(getVar('--text-color') || '#ffffff');
            setSpeedColor(getVar('--speed-color') || '#0ea5e9');
            setRandomColor(getVar('--random-color') || '#d946ef');
        }
    }, [isOpen]);

    const updateTheme = (variable: string, value: string) => {
        document.documentElement.style.setProperty(variable, value);
        if (variable === '--accent-color') {
            document.documentElement.style.setProperty('--accent-hover', value);
        }
    };

    const applyPreset = (preset: ThemePreset) => {
        setBgColor(preset.colors.bg);
        setCardColor(preset.colors.card);
        setAccentColor(preset.colors.accent);
        setTextColor(preset.colors.text);

        updateTheme('--bg-color', preset.colors.bg);
        updateTheme('--card-bg', preset.colors.card);
        updateTheme('--accent-color', preset.colors.accent);
        updateTheme('--text-color', preset.colors.text);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Settings">
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10">

                {/* Presets */}
                <div className="bg-white/5 p-4 rounded-3xl border border-white/5">
                    <h3 className="text-[10px] text-neutral-500 font-bold mb-3 uppercase tracking-widest pl-1">Theme Presets</h3>
                    <div className="grid grid-cols-5 gap-3">
                        {PRESETS.map(preset => (
                            <button
                                key={preset.name}
                                onClick={() => applyPreset(preset)}
                                className="group relative aspect-square rounded-xl border-2 border-transparent hover:scale-105 transition-all duration-200"
                                style={{ backgroundColor: preset.colors.bg }}
                            >
                                <div
                                    className="absolute inset-0 m-auto w-3 h-3 rounded-full shadow-lg group-hover:w-6 group-hover:h-6 transition-all duration-300"
                                    style={{ backgroundColor: preset.colors.accent }}
                                />
                            </button>
                        ))}
                    </div>
                </div>

                {/* 2-Column Grid for Colors - Stacked on Mobile */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Mode Colors */}
                    <div className="space-y-4 bg-white/5 p-4 rounded-3xl border border-white/5">
                        <h3 className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                            Mode Colors
                        </h3>
                        <div className="space-y-3">
                            <ColorInput
                                label="Speed"
                                value={speedColor}
                                onChange={(val) => { setSpeedColor(val); updateTheme('--speed-color', val); }}
                            />
                            <ColorInput
                                label="Random"
                                value={randomColor}
                                onChange={(val) => { setRandomColor(val); updateTheme('--random-color', val); }}
                            />
                        </div>
                    </div>

                    {/* Global Theme */}
                    <div className="space-y-4 bg-white/5 p-4 rounded-3xl border border-white/5">
                        <h3 className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Global Theme
                        </h3>
                        <div className="grid grid-cols-1 gap-3">
                            <ColorInput
                                label="Accent"
                                value={accentColor}
                                onChange={(val) => { setAccentColor(val); updateTheme('--accent-color', val); }}
                            />
                            <ColorInput
                                label="Background"
                                value={bgColor}
                                onChange={(val) => {
                                    setBgColor(val);
                                    updateTheme('--bg-color', val);
                                    const contrastColor = getContrastColor(val);
                                    setTextColor(contrastColor);
                                    updateTheme('--text-color', contrastColor);
                                }}
                            />
                            <ColorInput
                                label="Card"
                                value={cardColor}
                                onChange={(val) => { setCardColor(val); updateTheme('--card-bg', val); }}
                            />
                            <ColorInput
                                label="Text"
                                value={textColor}
                                onChange={(val) => { setTextColor(val); updateTheme('--text-color', val); }}
                            />
                        </div>
                    </div>
                </div>

                {/* Bottom Bar: Sound & Done - Responsive Wrap */}
                <div className="flex flex-col sm:flex-row items-center gap-4 bg-white/5 p-4 rounded-3xl border border-white/5">
                    <div className="flex-1 w-full">
                        <select
                            value={currentSound}
                            onChange={(e) => onSoundChange(e.target.value as any)}
                            className="w-full bg-neutral-800 border border-white/10 text-white rounded-xl p-3 focus:outline-none focus:border-accent appearance-none text-sm transition-colors"
                        >
                            <option value="click">Mechanical Click</option>
                            <option value="beep">Digital Beep</option>
                            <option value="woodblock">Woodblock</option>
                            <option value="hihat">Closed Hi-Hat</option>
                        </select>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full sm:w-auto min-w-[120px] bg-white text-black hover:bg-neutral-200 font-bold py-3 px-6 rounded-xl transition-all shadow-lg active:scale-95"
                    >
                        Done
                    </button>
                </div>
            </div>
        </Modal>
    );
}

