import React from 'react';

interface AddCardButtonProps {
    onClick: () => void;
}

export const AddCardButton: React.FC<AddCardButtonProps> = ({ onClick }) => {
    return (
        <button
            onClick={onClick}
            className="flex flex-col items-center justify-center min-h-40 p-6 border-2 border-dashed border-zinc-200 rounded-2xl text-zinc-400 hover:border-zinc-400 hover:text-zinc-600 transition-all cursor-pointer bg-white/50"
        >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span className="mt-2 text-sm font-medium">Add Project</span>
        </button>
    );
};
