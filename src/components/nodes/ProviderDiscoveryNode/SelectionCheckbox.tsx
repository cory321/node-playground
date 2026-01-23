import React from 'react';
import { Check, Square } from 'lucide-react';

interface SelectionCheckboxProps {
	selected: boolean;
	onToggle: () => void;
	disabled?: boolean;
}

export function SelectionCheckbox({
	selected,
	onToggle,
	disabled = false,
}: SelectionCheckboxProps) {
	return (
		<button
			onClick={(e) => {
				e.stopPropagation();
				if (!disabled) {
					onToggle();
				}
			}}
			disabled={disabled}
			className={`w-4 h-4 rounded-sm flex items-center justify-center transition-all ${
				selected
					? 'bg-cyan-500/40 border border-cyan-400/70 text-cyan-200'
					: 'bg-slate-800/60 border border-slate-600/50 text-transparent hover:border-cyan-500/50'
			} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
			title={selected ? 'Deselect for export' : 'Select for export'}
		>
			{selected && <Check size={10} strokeWidth={3} />}
		</button>
	);
}

export default SelectionCheckbox;
