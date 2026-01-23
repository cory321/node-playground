import React from 'react';
import { Loader2, Database, Search } from 'lucide-react';
import { ProviderEnrichmentProgress as ProgressData } from '@/types/nodes';

interface EnrichmentProgressProps {
	progress: ProgressData;
	isDiscoveryPhase?: boolean;
}

/**
 * Progress indicator showing current enrichment/discovery status
 */
export function EnrichmentProgress({
	progress,
	isDiscoveryPhase = false,
}: EnrichmentProgressProps) {
	const {
		currentProvider,
		currentIndex,
		totalCount,
		completed,
		discoveredCount = 0,
	} = progress;

	if (completed) {
		return null;
	}

	const percentage =
		totalCount > 0 ? Math.round((currentIndex / totalCount) * 100) : 0;

	const phaseLabel = isDiscoveryPhase ? 'Discovering' : 'Enriching';
	const gradientClass = isDiscoveryPhase
		? 'from-cyan-500 to-teal-500'
		: 'from-purple-500 to-violet-500';
	const textClass = isDiscoveryPhase ? 'text-cyan-300' : 'text-purple-300';
	const iconClass = isDiscoveryPhase ? 'text-cyan-400' : 'text-purple-400';

	return (
		<div className="space-y-2">
			{/* Phase Indicator */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider font-mono">
					{isDiscoveryPhase ? (
						<>
							<Search size={10} className={iconClass} />
							<span className={textClass}>Discovery Phase</span>
						</>
					) : (
						<>
							<Database size={10} className={iconClass} />
							<span className={textClass}>Enrichment Phase</span>
						</>
					)}
				</div>
				{isDiscoveryPhase && discoveredCount > 0 && (
					<span className="text-[10px] text-cyan-400 font-mono">
						{discoveredCount} found
					</span>
				)}
			</div>

			{/* Progress Bar */}
			<div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
				<div
					className={`absolute inset-y-0 left-0 bg-gradient-to-r ${gradientClass} transition-all duration-300`}
					style={{ width: `${percentage}%` }}
				/>
			</div>

			{/* Status Text */}
			<div className="flex items-center justify-between text-[10px]">
				<div className={`flex items-center gap-2 ${textClass}`}>
					<Loader2 size={12} className="animate-spin" />
					<span className="font-mono">
						{phaseLabel} {currentIndex} of {totalCount}
					</span>
				</div>
				<span className="text-slate-500 font-mono">{percentage}%</span>
			</div>

			{/* Current Provider */}
			{currentProvider && (
				<div className="flex items-center gap-2 px-2 py-1.5 bg-slate-800/50 rounded text-[10px]">
					{isDiscoveryPhase ? (
						<Search size={10} className={iconClass} />
					) : (
						<Database size={10} className={iconClass} />
					)}
					<span className="text-slate-300 truncate">{currentProvider}</span>
				</div>
			)}
		</div>
	);
}

export default EnrichmentProgress;
