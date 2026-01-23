import React from 'react';
import { EditorialPageType } from '@/types/nodes';
import { getContentTypeLabel, getContentTypeCategory } from '@/types/editorialContent';

interface ContentTypeSelectorProps {
	selectedTypes: EditorialPageType[];
	onChange: (types: EditorialPageType[]) => void;
	disabled?: boolean;
}

// All available content types grouped by category
const CONTENT_TYPE_GROUPS: Record<
	'core' | 'guides' | 'supporting',
	{ label: string; types: EditorialPageType[] }
> = {
	core: {
		label: 'Core Pages',
		types: ['service_page', 'city_service_page'],
	},
	guides: {
		label: 'Guides & Articles',
		types: ['cost_guide', 'troubleshooting', 'buying_guide', 'diy_guide'],
	},
	supporting: {
		label: 'Supporting',
		types: ['local_expertise', 'about', 'methodology'],
	},
};

export function ContentTypeSelector({
	selectedTypes,
	onChange,
	disabled = false,
}: ContentTypeSelectorProps) {
	const handleToggle = (type: EditorialPageType) => {
		if (disabled) return;

		if (selectedTypes.includes(type)) {
			onChange(selectedTypes.filter((t) => t !== type));
		} else {
			onChange([...selectedTypes, type]);
		}
	};

	const handleSelectAll = (category: 'core' | 'guides' | 'supporting') => {
		if (disabled) return;

		const types = CONTENT_TYPE_GROUPS[category].types;
		const allSelected = types.every((t) => selectedTypes.includes(t));

		if (allSelected) {
			// Deselect all in category
			onChange(selectedTypes.filter((t) => !types.includes(t)));
		} else {
			// Select all in category
			const newTypes = [...new Set([...selectedTypes, ...types])];
			onChange(newTypes);
		}
	};

	const renderGroup = (category: 'core' | 'guides' | 'supporting') => {
		const group = CONTENT_TYPE_GROUPS[category];
		const allSelected = group.types.every((t) => selectedTypes.includes(t));
		const someSelected = group.types.some((t) => selectedTypes.includes(t));

		return (
			<div key={category} className="space-y-1.5">
				{/* Group header with select all */}
				<button
					onClick={() => handleSelectAll(category)}
					disabled={disabled}
					className={`flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider w-full text-left ${
						disabled
							? 'text-slate-600 cursor-not-allowed'
							: 'text-slate-400 hover:text-slate-300'
					}`}
				>
					<div
						className={`w-3 h-3 rounded border flex items-center justify-center transition-colors ${
							allSelected
								? 'bg-emerald-500 border-emerald-500'
								: someSelected
									? 'bg-emerald-500/50 border-emerald-500'
									: 'border-slate-600'
						}`}
					>
						{(allSelected || someSelected) && (
							<svg
								className="w-2 h-2 text-white"
								fill="currentColor"
								viewBox="0 0 12 12"
							>
								<path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" />
							</svg>
						)}
					</div>
					<span>{group.label}</span>
				</button>

				{/* Content type checkboxes */}
				<div className="grid grid-cols-2 gap-1 pl-5">
					{group.types.map((type) => {
						const isSelected = selectedTypes.includes(type);
						const label = getContentTypeLabel(type);

						return (
							<button
								key={type}
								onClick={() => handleToggle(type)}
								disabled={disabled}
								className={`flex items-center gap-1.5 px-2 py-1 rounded text-[11px] transition-colors ${
									disabled
										? 'text-slate-600 cursor-not-allowed'
										: isSelected
											? 'bg-emerald-500/20 text-emerald-400'
											: 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-300'
								}`}
							>
								<div
									className={`w-3 h-3 rounded border flex items-center justify-center transition-colors ${
										isSelected
											? 'bg-emerald-500 border-emerald-500'
											: 'border-slate-600'
									}`}
								>
									{isSelected && (
										<svg
											className="w-2 h-2 text-white"
											fill="currentColor"
											viewBox="0 0 12 12"
										>
											<path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" />
										</svg>
									)}
								</div>
								<span className="truncate">{label}</span>
							</button>
						);
					})}
				</div>
			</div>
		);
	};

	return (
		<div className="space-y-3">
			{renderGroup('core')}
			{renderGroup('guides')}
			{renderGroup('supporting')}

			{/* Selection summary */}
			<div className="text-[10px] text-slate-500 pt-1 border-t border-slate-700/50">
				{selectedTypes.length === 0 ? (
					<span className="text-amber-500">
						Select at least one content type
					</span>
				) : (
					<span>
						{selectedTypes.length} type
						{selectedTypes.length !== 1 ? 's' : ''} selected
					</span>
				)}
			</div>
		</div>
	);
}

export default ContentTypeSelector;
