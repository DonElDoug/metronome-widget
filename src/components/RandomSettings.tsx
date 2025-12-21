import { useState } from 'react';
import { Modal } from './Modal';
import { Slider } from './ui/Slider';

interface RandomSettingsProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (settings: RandomSettingsData) => void;
}

export interface RandomSettingsData {
    enabled: boolean;
    percentage: number; // 0-100
    bars: number;
}

export function RandomSettings({ isOpen, onClose, onSave }: RandomSettingsProps) {
    const [percentage, setPercentage] = useState(50);
    const [bars, setBars] = useState(10);

    const handleSave = () => {
        onSave({ enabled: true, percentage, bars });
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Random Mute">
            <div className="space-y-6" style={{ '--accent-color': 'var(--random-color)' } as React.CSSProperties}>
                <Slider
                    label="Silence Percentage"
                    value={percentage}
                    min={0}
                    max={100}
                    onChange={setPercentage}
                    unit="%"
                />

                <Slider
                    label="Pattern Length (Bars)"
                    value={bars}
                    min={1}
                    max={16}
                    onChange={setBars}
                    unit=" bars"
                />

                <div className="bg-neutral-850 p-4 rounded-xl text-sm text-neutral-400">
                    <p>Randomly silences bars to help you test your internal clock.</p>
                </div>

                <button
                    onClick={handleSave}
                    className="w-full hover:brightness-110 text-white font-bold py-3 rounded-xl transition-all mt-8 shadow-lg"
                    style={{
                        backgroundColor: 'var(--accent-color)',
                        boxShadow: '0 10px 15px -3px color-mix(in srgb, var(--accent-color), transparent 80%)'
                    }}
                >
                    Start Random Mute
                </button>
            </div>
        </Modal>
    );
}
