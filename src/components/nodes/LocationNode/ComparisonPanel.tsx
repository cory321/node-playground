import { useState } from 'react';
import {
	X,
	Trash2,
	Trophy,
	MapPin,
	ChevronUp,
	ChevronDown,
	BarChart3,
	Copy,
	Check,
	Users,
	DollarSign,
	Home,
	TrendingUp,
} from 'lucide-react';
import { useComparison, SavedLocation } from '@/contexts';
import { Grade } from './scoring';

type SortField = 'score' | 'population' | 'income' | 'homeownership' | 'homeValue' | 'name' | 'savedAt';
type SortOrder = 'asc' | 'desc';

interface ComparisonPanelProps {
	onSelectLocation?: (location: SavedLocation) => void;
}

export function ComparisonPanel({ onSelectLocation }: ComparisonPanelProps) {
	const { locations, removeLocation, clearLocations, closePanel, isOpen } = useComparison();
	const [sortField, setSortField] = useState<SortField>('score');
	const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
	const [copied, setCopied] = useState(false);

	if (!isOpen) return null;

	// Sort locations
	const sortedLocations = [...locations].sort((a, b) => {
		let comparison = 0;

		switch (sortField) {
			case 'score':
				comparison = a.scorecard.totalScore - b.scorecard.totalScore;
				break;
			case 'population':
				comparison = (a.demographics.population ?? 0) - (b.demographics.population ?? 0);
				break;
			case 'income':
				comparison = (a.demographics.medianHouseholdIncome ?? 0) - (b.demographics.medianHouseholdIncome ?? 0);
				break;
			case 'homeownership':
				comparison = (a.demographics.homeownershipRate ?? 0) - (b.demographics.homeownershipRate ?? 0);
				break;
			case 'homeValue':
				comparison = (a.demographics.medianHomeValue ?? 0) - (b.demographics.medianHomeValue ?? 0);
				break;
			case 'name':
				comparison = a.name.localeCompare(b.name);
				break;
			case 'savedAt':
				comparison = a.savedAt - b.savedAt;
				break;
		}

		return sortOrder === 'desc' ? -comparison : comparison;
	});

	const handleSort = (field: SortField) => {
		if (sortField === field) {
			setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
		} else {
			setSortField(field);
			setSortOrder('desc');
		}
	};

	const SortIcon = ({ field }: { field: SortField }) => {
		if (sortField !== field) return null;
		return sortOrder === 'desc' ? (
			<ChevronDown size={10} className="text-sky-400" />
		) : (
			<ChevronUp size={10} className="text-sky-400" />
		);
	};

	// Copy all locations to clipboard
	const handleCopyAll = async () => {
		const lines = sortedLocations.map((loc) => {
			const grade = loc.scorecard.grade;
			const score = loc.scorecard.totalScore;
			const pop = formatNumber(loc.demographics.population);
			const income = formatCurrency(loc.demographics.medianHouseholdIncome);
			const own = formatPercent(loc.demographics.homeownershipRate);
			const value = formatCurrency(loc.demographics.medianHomeValue);
			const verdict = loc.scorecard.verdict.charAt(0).toUpperCase() + loc.scorecard.verdict.slice(1);
			const verdictEmoji = loc.scorecard.verdict === 'proceed' ? '🟢' : loc.scorecard.verdict === 'caution' ? '🟡' : '🔴';

			return `${loc.name}, ${loc.state}
   Grade: ${grade} (${score}/18) ${verdictEmoji} ${verdict}
   Pop: ${pop} | Income: ${income} | Own: ${own} | Value: ${value}`;
		});

		const text = `📊 Location Comparison (${locations.length} cities)
${'═'.repeat(50)}

${lines.join('\n\n')}`;

		try {
			await navigator.clipboard.writeText(text);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (err) {
			console.error('Failed to copy:', err);
		}
	};

	return (
		<div className="fixed right-4 top-16 bottom-4 w-[420px] bg-slate-900 border border-slate-700/50 rounded-lg shadow-2xl flex flex-col z-50 overflow-hidden">
			{/* Header */}
			<div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50 bg-slate-800/50">
				<div className="flex items-center gap-2">
					<BarChart3 size={16} className="text-sky-400" />
					<span className="text-sm font-medium text-slate-200">
						Compare Locations
					</span>
					<span className="text-xs text-slate-500">
						({locations.length} saved)
					</span>
				</div>
				<div className="flex items-center gap-1.5">
					{locations.length > 0 && (
						<>
							<button
								onClick={handleCopyAll}
								className={`p-1.5 rounded transition-colors ${
									copied
										? 'text-emerald-400 bg-emerald-500/20'
										: 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
								}`}
								title="Copy all to clipboard"
							>
								{copied ? <Check size={14} /> : <Copy size={14} />}
							</button>
							<button
								onClick={clearLocations}
								className="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-slate-700/50 transition-colors"
								title="Clear all"
							>
								<Trash2 size={14} />
							</button>
						</>
					)}
					<button
						onClick={closePanel}
						className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors"
					>
						<X size={16} />
					</button>
				</div>
			</div>

			{/* Content */}
			{locations.length === 0 ? (
				<div className="flex-1 flex items-center justify-center p-8">
					<div className="text-center">
						<MapPin size={32} className="mx-auto mb-3 text-slate-600" />
						<p className="text-sm text-slate-400 mb-1">No locations saved</p>
						<p className="text-xs text-slate-500">
							Click "Save" on a location's scorecard to add it here
						</p>
					</div>
				</div>
			) : (
				<div className="flex-1 overflow-auto">
					{/* Table Header */}
					<div className="sticky top-0 bg-slate-800/90 backdrop-blur-sm border-b border-slate-700/50 z-10">
						<div className="grid grid-cols-[1fr_60px_70px_50px_70px_32px] gap-2 px-3 py-2 text-[10px] text-slate-500 uppercase tracking-wider">
							<button
								onClick={() => handleSort('name')}
								className="flex items-center gap-1 hover:text-slate-300 transition-colors text-left"
							>
								Location
								<SortIcon field="name" />
							</button>
							<button
								onClick={() => handleSort('score')}
								className="flex items-center gap-1 hover:text-slate-300 transition-colors"
							>
								<Trophy size={10} />
								<SortIcon field="score" />
							</button>
							<button
								onClick={() => handleSort('population')}
								className="flex items-center gap-1 hover:text-slate-300 transition-colors"
							>
								<Users size={10} />
								<SortIcon field="population" />
							</button>
							<button
								onClick={() => handleSort('homeownership')}
								className="flex items-center gap-1 hover:text-slate-300 transition-colors"
							>
								<Home size={10} />
								<SortIcon field="homeownership" />
							</button>
							<button
								onClick={() => handleSort('homeValue')}
								className="flex items-center gap-1 hover:text-slate-300 transition-colors"
							>
								<TrendingUp size={10} />
								<SortIcon field="homeValue" />
							</button>
							<span></span>
						</div>
					</div>

					{/* Table Rows */}
					<div className="divide-y divide-slate-700/30">
						{sortedLocations.map((location) => (
							<LocationRow
								key={location.id}
								location={location}
								onRemove={() => removeLocation(location.id)}
								onSelect={onSelectLocation ? () => onSelectLocation(location) : undefined}
							/>
						))}
					</div>
				</div>
			)}

			{/* Footer Stats */}
			{locations.length > 0 && (
				<div className="px-4 py-2.5 border-t border-slate-700/50 bg-slate-800/30">
					<div className="grid grid-cols-4 gap-3 text-center">
						<div>
							<span className="text-[9px] text-slate-600 block">A/B Markets</span>
							<span className="text-xs text-emerald-400 font-medium">
								{locations.filter((l) => l.scorecard.grade === 'A' || l.scorecard.grade === 'B').length}
							</span>
						</div>
						<div>
							<span className="text-[9px] text-slate-600 block">C/D Markets</span>
							<span className="text-xs text-amber-400 font-medium">
								{locations.filter((l) => l.scorecard.grade === 'C' || l.scorecard.grade === 'D').length}
							</span>
						</div>
						<div>
							<span className="text-[9px] text-slate-600 block">F Markets</span>
							<span className="text-xs text-red-400 font-medium">
								{locations.filter((l) => l.scorecard.grade === 'F').length}
							</span>
						</div>
						<div>
							<span className="text-[9px] text-slate-600 block">Avg Score</span>
							<span className="text-xs text-slate-300 font-medium">
								{(locations.reduce((sum, l) => sum + l.scorecard.totalScore, 0) / locations.length).toFixed(1)}
							</span>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

interface LocationRowProps {
	location: SavedLocation;
	onRemove: () => void;
	onSelect?: () => void;
}

function LocationRow({ location, onRemove, onSelect }: LocationRowProps) {
	const { scorecard, demographics } = location;
	const grade = scorecard.grade;

	return (
		<div
			className={`grid grid-cols-[1fr_60px_70px_50px_70px_32px] gap-2 px-3 py-2.5 hover:bg-slate-800/30 transition-colors ${
				onSelect ? 'cursor-pointer' : ''
			}`}
			onClick={onSelect}
		>
			{/* Location Name */}
			<div className="min-w-0">
				<div className="flex items-center gap-1.5">
					<MapPin size={10} className="shrink-0 text-slate-500" />
					<span className="text-xs text-slate-200 font-medium truncate">
						{location.name}
					</span>
				</div>
				<span className="text-[10px] text-slate-500 truncate block ml-3.5">
					{location.state}
				</span>
			</div>

			{/* Grade */}
			<div className="flex items-center justify-center">
				<div
					className={`flex items-center gap-1 px-1.5 py-0.5 rounded border ${getGradeBgClass(grade)}`}
				>
					<span className={`text-xs font-bold ${getGradeColorClass(grade)}`}>
						{grade}
					</span>
					<span className="text-[9px] text-slate-500">
						{scorecard.totalScore}
					</span>
				</div>
			</div>

			{/* Population */}
			<div className="text-[10px] text-slate-400 flex items-center justify-center">
				{formatCompactNumber(demographics.population)}
			</div>

			{/* Homeownership */}
			<div className="text-[10px] text-slate-400 flex items-center justify-center">
				{demographics.homeownershipRate
					? `${demographics.homeownershipRate.toFixed(0)}%`
					: 'N/A'}
			</div>

			{/* Home Value */}
			<div className="text-[10px] text-slate-400 flex items-center justify-center">
				{formatCompactCurrency(demographics.medianHomeValue)}
			</div>

			{/* Remove Button */}
			<div className="flex items-center justify-center">
				<button
					onClick={(e) => {
						e.stopPropagation();
						onRemove();
					}}
					className="p-1 rounded text-slate-600 hover:text-red-400 hover:bg-slate-700/50 transition-colors"
					title="Remove"
				>
					<X size={12} />
				</button>
			</div>
		</div>
	);
}

// Helper functions
function getGradeColorClass(grade: Grade): string {
	switch (grade) {
		case 'A':
		case 'B':
			return 'text-emerald-400';
		case 'C':
		case 'D':
			return 'text-amber-400';
		case 'F':
			return 'text-red-400';
	}
}

function getGradeBgClass(grade: Grade): string {
	switch (grade) {
		case 'A':
		case 'B':
			return 'bg-emerald-500/20 border-emerald-500/30';
		case 'C':
		case 'D':
			return 'bg-amber-500/20 border-amber-500/30';
		case 'F':
			return 'bg-red-500/20 border-red-500/30';
	}
}

function formatNumber(value: number | null): string {
	if (value === null) return 'N/A';
	return new Intl.NumberFormat('en-US').format(value);
}

function formatCompactNumber(value: number | null): string {
	if (value === null) return 'N/A';
	if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
	if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
	return value.toString();
}

function formatCurrency(value: number | null): string {
	if (value === null) return 'N/A';
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		maximumFractionDigits: 0,
	}).format(value);
}

function formatCompactCurrency(value: number | null): string {
	if (value === null) return 'N/A';
	if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
	if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
	return `$${value}`;
}

function formatPercent(value: number | null): string {
	if (value === null) return 'N/A';
	return `${value.toFixed(1)}%`;
}

export default ComparisonPanel;
