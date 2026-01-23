import React, { useState } from 'react';
import {
	ChevronDown,
	ChevronUp,
	Star,
	Phone,
	Globe,
	MapPin,
	CheckSquare,
	Square,
} from 'lucide-react';
import { ProviderData } from '@/types/nodes';
import { ScoreBadge } from './ScoreBadge';
import { ContactToggle } from './ContactToggle';
import { SelectionCheckbox } from './SelectionCheckbox';

interface ProviderTableProps {
	providers: ProviderData[];
	onToggleContacted: (providerId: string) => void;
	selectedIds: string[];
	onToggleSelected: (providerId: string) => void;
	onSelectAll: () => void;
	onDeselectAll: () => void;
}

interface ProviderRowProps {
	provider: ProviderData;
	onToggleContacted: () => void;
	isExpanded: boolean;
	onToggleExpand: () => void;
	isSelected: boolean;
	onToggleSelected: () => void;
}

function ProviderRow({
	provider,
	onToggleContacted,
	isExpanded,
	onToggleExpand,
	isSelected,
	onToggleSelected,
}: ProviderRowProps) {
	return (
		<div className="border-b border-slate-700/30 last:border-b-0">
			{/* Main Row */}
			<div
				className="flex items-center gap-2 px-2 py-2 hover:bg-slate-800/30 cursor-pointer transition-colors"
				onClick={onToggleExpand}
			>
				{/* Selection Checkbox */}
				<SelectionCheckbox selected={isSelected} onToggle={onToggleSelected} />

				{/* Contact Toggle */}
				<ContactToggle
					contacted={provider.contacted}
					onToggle={onToggleContacted}
				/>

				{/* Priority Badge */}
				<ScoreBadge
					priority={provider.score.priority}
					score={provider.score.total}
				/>

				{/* Provider Name */}
				<div className="flex-1 min-w-0 flex items-center gap-1.5">
					<span
						className={`text-xs font-medium truncate ${
							provider.contacted
								? 'text-slate-400 line-through'
								: 'text-slate-200'
						}`}
					>
						{provider.name}
					</span>
					{/* Missing Website Badge - Business Opportunity */}
					{!provider.website && (
						<span className="shrink-0 px-1.5 py-0.5 text-[9px] font-medium bg-emerald-500/20 text-emerald-400 rounded border border-emerald-500/40">
							Missing GBP Website
						</span>
					)}
				</div>

				{/* Rating */}
				{provider.googleRating && (
					<div className="flex items-center gap-1 text-[10px] text-amber-400">
						<Star size={10} className="fill-current" />
						<span>{provider.googleRating.toFixed(1)}</span>
					</div>
				)}

				{/* Expand Icon */}
				<span className="text-slate-500">
					{isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
				</span>
			</div>

			{/* Expanded Details */}
			{isExpanded && (
				<div className="px-3 pb-3 pt-1 bg-slate-800/20 space-y-2">
					{/* Contact Info */}
					<div className="flex flex-wrap gap-3 text-[10px]">
						{provider.phone && (
							<a
								href={`tel:${provider.phone}`}
								onClick={(e) => e.stopPropagation()}
								className="flex items-center gap-1 text-teal-400 hover:text-teal-300"
							>
								<Phone size={10} />
								{provider.phone}
							</a>
						)}
						{provider.website && (
							<a
								href={provider.website}
								target="_blank"
								rel="noopener noreferrer"
								onClick={(e) => e.stopPropagation()}
								className="flex items-center gap-1 text-teal-400 hover:text-teal-300"
							>
								<Globe size={10} />
								Website
							</a>
						)}
						{provider.address && (
							<span className="flex items-center gap-1 text-slate-400">
								<MapPin size={10} />
								{provider.address}
							</span>
						)}
					</div>

					{/* Signals */}
					<div className="flex flex-wrap gap-2 text-[9px]">
						{provider.hasLSA && (
							<span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">
								LSA Active
							</span>
						)}
						{provider.hasGoogleAds && (
							<span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-300 rounded border border-blue-500/30">
								Google Ads
							</span>
						)}
						{provider.googleReviewCount && provider.googleReviewCount > 0 && (
							<span className="px-1.5 py-0.5 bg-slate-600/50 text-slate-300 rounded">
								{provider.googleReviewCount} reviews
							</span>
						)}
					</div>

					{/* Score Breakdown */}
					<div className="grid grid-cols-5 gap-1 text-[9px]">
						<div className="text-center">
							<div className="text-slate-500">Ads</div>
							<div className="text-slate-300 font-mono">
								{provider.score.advertising}/5
							</div>
						</div>
						<div className="text-center">
							<div className="text-slate-500">Digital</div>
							<div className="text-slate-300 font-mono">
								{provider.score.digitalPresence}/5
							</div>
						</div>
						<div className="text-center">
							<div className="text-slate-500">Reviews</div>
							<div className="text-slate-300 font-mono">
								{provider.score.reviewVelocity}/5
							</div>
						</div>
						<div className="text-center">
							<div className="text-slate-500">Size</div>
							<div className="text-slate-300 font-mono">
								{provider.score.sizeSignal}/5
							</div>
						</div>
						<div className="text-center">
							<div className="text-slate-500">Reach</div>
							<div className="text-slate-300 font-mono">
								{provider.score.reachability}/5
							</div>
						</div>
					</div>

					{/* Reasoning */}
					<p className="text-[10px] text-slate-400 italic">
						{provider.reasoning}
					</p>
				</div>
			)}
		</div>
	);
}

export function ProviderTable({
	providers,
	onToggleContacted,
	selectedIds,
	onToggleSelected,
	onSelectAll,
	onDeselectAll,
}: ProviderTableProps) {
	const [expandedId, setExpandedId] = useState<string | null>(null);

	if (providers.length === 0) {
		return (
			<div className="text-center py-4 text-slate-500 text-xs">
				No providers found
			</div>
		);
	}

	const allSelected =
		providers.length > 0 && selectedIds.length === providers.length;
	const someSelected =
		selectedIds.length > 0 && selectedIds.length < providers.length;

	return (
		<div className="bg-slate-800/30 border border-slate-700/50 rounded-lg overflow-hidden">
			{/* Header with select all/none controls */}
			<div className="flex items-center justify-between px-2 py-1.5 bg-slate-800/50 border-b border-slate-700/50">
				<div className="flex items-center gap-2">
					<button
						onClick={allSelected || someSelected ? onDeselectAll : onSelectAll}
						className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-cyan-400 transition-colors"
						title={allSelected || someSelected ? 'Deselect all' : 'Select all'}
					>
						{allSelected ? (
							<CheckSquare size={12} className="text-cyan-400" />
						) : someSelected ? (
							<Square size={12} className="text-cyan-400/50" />
						) : (
							<Square size={12} />
						)}
						<span className="font-mono uppercase tracking-wider">
							{selectedIds.length}/{providers.length} selected
						</span>
					</button>
				</div>
				<div className="flex items-center gap-2">
					<button
						onClick={onSelectAll}
						className="text-[9px] text-slate-500 hover:text-cyan-400 transition-colors font-mono uppercase tracking-wider"
					>
						All
					</button>
					<span className="text-slate-600">|</span>
					<button
						onClick={onDeselectAll}
						className="text-[9px] text-slate-500 hover:text-cyan-400 transition-colors font-mono uppercase tracking-wider"
					>
						None
					</button>
				</div>
			</div>

			{/* Provider list */}
			<div className="max-h-52 overflow-y-auto">
				{providers.map((provider) => (
					<ProviderRow
						key={provider.id}
						provider={provider}
						onToggleContacted={() => onToggleContacted(provider.id)}
						isExpanded={expandedId === provider.id}
						onToggleExpand={() =>
							setExpandedId(expandedId === provider.id ? null : provider.id)
						}
						isSelected={selectedIds.includes(provider.id)}
						onToggleSelected={() => onToggleSelected(provider.id)}
					/>
				))}
			</div>
		</div>
	);
}

export default ProviderTable;
