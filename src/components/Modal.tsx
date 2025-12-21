import { X } from 'lucide-react';
import { ReactNode } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-[1.5vmin] bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-neutral-900 border border-neutral-800 p-[3vmin] rounded-[2.5rem] w-full max-w-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] scale-100 animate-in zoom-in-95 duration-200 max-h-[96vh] overflow-y-auto scrollbar-hide m-2">
                <div className="flex justify-between items-center mb-6 px-1">
                    <h2 className="text-xl font-bold text-white">{title}</h2>
                    <button onClick={onClose} className="text-neutral-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>
                <div>{children}</div>
            </div>
        </div>
    );
}
