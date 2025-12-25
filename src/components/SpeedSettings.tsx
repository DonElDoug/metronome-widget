import { useState } from 'react';
import { Modal } from './Modal';
import { Slider } from './ui/Slider';
import { DualSlider } from './ui/DualSlider';

interface SpeedSettingsProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (settings: SpeedSettingsData) => void;
    currentTimeSignature?: { numerator: number; denominator: number } | null;
}

export interface SpeedSettingsData {
    enabled: boolean;
    startBpm: number;
    endBpm: number;
    increment: number;
    bars: number;
    estimatedDuration?: number; // In seconds
}

export function SpeedSettings({ isOpen, onClose, onSave, currentTimeSignature }: SpeedSettingsProps) {
    const [startBpm, setStartBpm] = useState(100);
    const [endBpm, setEndBpm] = useState(180);
    const [increment, setIncrement] = useState(5);
    const [bars, setBars] = useState(4);

    const beatsPerBar = currentTimeSignature?.numerator || 4;

    const snapToEndBpm = (start: number, end: number, inc: number) => {
        if (end <= start) return start + inc;
        const diff = end - start;
        const steps = Math.floor(diff / inc);
        return start + (steps * inc);
    };

    const calculateEstimatedTime = (initial: number, fin: number, inc: number, barCount: number, clicks = beatsPerBar) => {
        if (initial >= fin) return (barCount * clicks * 60) / initial;
        let totalSeconds = 0;
        let currentBpm = initial;
        while (currentBpm < fin) {
            totalSeconds += (barCount * clicks * 60) / currentBpm;
            currentBpm += inc;
        }
        totalSeconds += (barCount * clicks * 60) / fin;
        return totalSeconds;
    };

    const formatTime = (totalSeconds: number) => {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = Math.round(totalSeconds % 60);
        return `${minutes} min ${seconds} sec`;
    };

    const handleSave = () => {
        const estimatedDuration = calculateEstimatedTime(startBpm, endBpm, increment, bars);
        onSave({ enabled: true, startBpm, endBpm, increment, bars, estimatedDuration });
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Speed Trainer">
            <div className="space-y-6" style={{ '--accent-color': 'var(--speed-color)' } as React.CSSProperties}>
                <DualSlider
                    label="BPM Range"
                    value={[startBpm, endBpm]}
                    min={30}
                    max={300}
                    onChange={([newStart, newEnd]) => {
                        setStartBpm(newStart);
                        // Snap endBpm based on newStart and increment
                        setEndBpm(snapToEndBpm(newStart, newEnd, increment));
                    }}
                />

                <Slider
                    label="Increase By (BPM)"
                    value={increment}
                    min={1}
                    max={20}
                    onChange={(val) => {
                        setIncrement(val);
                        setEndBpm(prev => snapToEndBpm(startBpm, prev, val));
                    }}
                />

                <Slider
                    label="Every (Bars)"
                    value={bars}
                    min={1}
                    max={32}
                    onChange={setBars}
                    unit=" bars"
                />

                <div
                    className="p-4 rounded-xl text-sm font-mono text-center transition-colors duration-300"
                    style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                >
                    Estimated time: <span style={{ color: 'var(--accent-color)' }}>{formatTime(calculateEstimatedTime(startBpm, endBpm, increment, bars))}</span>
                </div>

                <button
                    onClick={handleSave}
                    className="w-full hover:brightness-110 text-white font-bold py-3 rounded-xl transition-all mt-8 shadow-lg"
                    style={{
                        backgroundColor: 'var(--accent-color)',
                        boxShadow: '0 10px 15px -3px color-mix(in srgb, var(--accent-color), transparent 80%)'
                    }}
                >
                    Start Speed Mode
                </button>
            </div>
        </Modal>
    );
}
