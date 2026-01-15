import { useState, useEffect } from 'react';
import {
	Building2,
	MapPin,
	Loader2,
	Trophy,
	ChevronRight,
	X,
	RefreshCw,
	Navigation,
} from 'lucide-react';
import {
	SuburbResult,
	discoverSuburbs,
	loadSuburbDemographics,
	getGradeColorClass,
	getGradeBgClass,
} from '@/api/suburbs';
import { Grade } from './scoring';

interface SuburbSuggestionsProps {
	metroName: string;
	metroLat: number;
	metroLng: number;
	metroState: string;
	onSelectSuburb: (suburb: SuburbResult) => void;
	onClose: () => void;
}

type LoadingState = 'idle' | 'discovering' | 'loading-demographics' | 'complete' | 'error';

export function SuburbSuggestions({
	metroName,
	metroLat,
	metroLng,
	metroState,
	onSelectSuburb,
	onClose,
}: SuburbSuggestionsProps) {
	const [suburbs, setSuburbs] = useState<SuburbResult[]>([]);
	const [loadingState, setLoadingState] = useState<LoadingState>('idle');
	const [error, setError] = useState<string | null>(null);
	const [loadedCount, setLoadedCount] = useState(0);

	// Discover suburbs when component mounts
	useEffect(() => {
		discoverAndLoadSuburbs();
	}, [metroName, metroLat, metroLng, metroState]);

	const discoverAndLoadSuburbs = async () => {
		setLoadingState('discovering');
		setError(null);
		setLoadedCount(0);

		try {
			// Step 1: Discover suburbs
			const discovered = await discoverSuburbs(
				metroName,
				metroLat,
				metroLng,
				metroState,
				{
					radiusKm: 80,
					maxResults: 12,
				}
			);

			if (discovered.length === 0) {
				setError('No suburbs found within 80km. Try searching manually.');
				setLoadingState('error');
				return;
			}

			// Mark all as loading
			const withLoadingState = discovered.map((s) => ({
				...s,
				isLoading: true,
			}));
			setSuburbs(withLoadingState);
			setLoadingState('loading-demographics');

			// Step 2: Load demographics for each suburb
			// Do this incrementally so user sees progress
			const results: SuburbResult[] = [];
			for (let i = 0; i < discovered.length; i++) {
				const suburb = discovered[i];
				try {
					const loaded = await loadSuburbDemographics(suburb);
					results.push(loaded);
					setLoadedCount(i + 1);

					// Update state incrementally, sorted by score
					const sorted = [...results].sort((a, b) => {
						const scoreA = a.scorecard?.totalScore ?? 0;
						const scoreB = b.scorecard?.totalScore ?? 0;
						return scoreB - scoreA;
					});
					setSuburbs(sorted);
				} catch (err) {
					console.error(`Failed to load ${suburb.name}:`, err);
					results.push({ ...suburb, isLoading: false });
				}
			}

			setLoadingState('complete');
		} catch (err) {
			console.error('Failed to discover suburbs:', err);
			setError('Failed to discover suburbs. Please try again.');
			setLoadingState('error');
		}
	};

	const formatDistance = (km: number): string => {
		const miles = km * 0.621371;
		return `${miles.toFixed(0)} mi`;
	};

	const formatNumber = (value: number | null | undefined): string => {
		if (value == null) return 'N/A';
		return new Intl.NumberFormat('en-US').format(value);
	};

	return (
		<div className="bg-slate-900 border border-slate-700/50 rounded-lg overflow-hidden">
			{/* Header */}
			<div className="flex items-center justify-between px-3 py-2 border-b border-slate-700/50 bg-slate-800/50">
				<div className="flex items-center gap-2">
					<Building2 size={14} className="text-sky-400" />
					<span className="text-xs font-medium text-slate-200">
						Suburbs Near {metroName}
					</span>
				</div>
				<div className="flex items-center gap-1.5">
					{loadingState === 'complete' && (
						<button
							onClick={discoverAndLoadSuburbs}
							className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors"
							title="Refresh"
						>
							<RefreshCw size={12} />
						</button>
					)}
					<button
						onClick={onClose}
						className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors"
					>
						<X size={14} />
					</button>
				</div>
			</div>

			{/* Loading State */}
			{(loadingState === 'discovering' || loadingState === 'loading-demographics') && (
				<div className="px-3 py-4 flex flex-col items-center gap-2">
					<Loader2 size={20} className="animate-spin text-sky-400" />
					<span className="text-xs text-slate-400">
						{loadingState === 'discovering'
							? 'Discovering suburbs...'
							: `Loading demographics (${loadedCount}/${suburbs.length})...`}
					</span>
				</div>
			)}

			{/* Error State */}
			{loadingState === 'error' && error && (
				<div className="px-3 py-4 text-center">
					<p className="text-xs text-red-400 mb-2">{error}</p>
					<button
						onClick={discoverAndLoadSuburbs}
						className="text-xs text-sky-400 hover:text-sky-300 transition-colors"
					>
						Try Again
					</button>
				</div>
			)}

			{/* Suburb List */}
			{suburbs.length > 0 && (
				<div className="max-h-[300px] overflow-y-auto">
					{suburbs.map((suburb, index) => (
						<SuburbRow
							key={`${suburb.name}-${suburb.state}`}
							suburb={suburb}
							rank={index + 1}
							onClick={() => onSelectSuburb(suburb)}
							formatDistance={formatDistance}
							formatNumber={formatNumber}
						/>
					))}
				</div>
			)}

			{/* Footer */}
			{loadingState === 'complete' && suburbs.length > 0 && (
				<div className="px-3 py-2 border-t border-slate-700/50 bg-slate-800/30">
					<p className="text-[10px] text-slate-500 text-center">
						Click a suburb to evaluate it. Sorted by score (highest first).
					</p>
				</div>
			)}
		</div>
	);
}

interface SuburbRowProps {
	suburb: SuburbResult;
	rank: number;
	onClick: () => void;
	formatDistance: (km: number) => string;
	formatNumber: (value: number | null | undefined) => string;
}

function SuburbRow({
	suburb,
	rank,
	onClick,
	formatDistance,
	formatNumber,
}: SuburbRowProps) {
	const grade = suburb.scorecard?.grade;
	const score = suburb.scorecard?.totalScore;

	return (
		<button
			onClick={onClick}
			className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-800/50 transition-colors border-b border-slate-700/30 last:border-b-0 text-left"
		>
			{/* Rank */}
			<span className="text-[10px] text-slate-600 font-mono w-4">
				{rank}.
			</span>

			{/* Location Info */}
			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-1.5">
					<MapPin size={10} className="shrink-0 text-slate-500" />
					<span className="text-xs text-slate-200 font-medium truncate">
						{suburb.name}
					</span>
				</div>
				<div className="flex items-center gap-2 mt-0.5">
					<span className="text-[10px] text-slate-500 truncate">
						{suburb.state}
					</span>
					<span className="text-[10px] text-slate-600">•</span>
					<span className="text-[10px] text-slate-500 flex items-center gap-0.5">
						<Navigation size={8} className="rotate-45" />
						{formatDistance(suburb.distance)}
					</span>
					{suburb.demographics?.population && (
						<>
							<span className="text-[10px] text-slate-600">•</span>
							<span className="text-[10px] text-slate-500">
								Pop: {formatNumber(suburb.demographics.population)}
							</span>
						</>
					)}
				</div>
			</div>

			{/* Score Badge */}
			{suburb.isLoading ? (
				<div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-800/50 border border-slate-700/50">
					<Loader2 size={10} className="animate-spin text-slate-400" />
					<span className="text-[10px] text-slate-400">...</span>
				</div>
			) : grade && score !== undefined ? (
				<div
					className={`flex items-center gap-1.5 px-2 py-1 rounded border ${getGradeBgClass(grade)}`}
				>
					<Trophy size={10} className={getGradeColorClass(grade)} />
					<span className={`text-xs font-bold ${getGradeColorClass(grade)}`}>
						{grade}
					</span>
					<span className="text-[10px] text-slate-500">{score}/18</span>
				</div>
			) : (
				<div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-800/50 border border-slate-700/50">
					<span className="text-[10px] text-slate-500">No data</span>
				</div>
			)}

			{/* Arrow */}
			<ChevronRight size={14} className="text-slate-600" />
		</button>
	);
}

export default SuburbSuggestions;
