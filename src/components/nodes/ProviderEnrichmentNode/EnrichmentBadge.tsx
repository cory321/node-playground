import React from 'react';

interface EnrichmentBadgeProps {
	confidence: number;
	showValue?: boolean;
}

/**
 * Badge showing enrichment confidence level
 * Green (80-100), Yellow (50-79), Red (0-49)
 */
export function EnrichmentBadge({
	confidence,
	showValue = true,
}: EnrichmentBadgeProps) {
	let bgColor: string;
	let textColor: string;
	let label: string;

	if (confidence >= 80) {
		bgColor = 'bg-emerald-500/20';
		textColor = 'text-emerald-300';
		label = 'High';
	} else if (confidence >= 50) {
		bgColor = 'bg-amber-500/20';
		textColor = 'text-amber-300';
		label = 'Medium';
	} else if (confidence > 0) {
		bgColor = 'bg-red-500/20';
		textColor = 'text-red-300';
		label = 'Low';
	} else {
		bgColor = 'bg-slate-600/50';
		textColor = 'text-slate-400';
		label = 'None';
	}

	return (
		<span
			className={`shrink-0 px-1.5 py-0.5 text-[9px] font-medium ${bgColor} ${textColor} rounded`}
		>
			{showValue ? `${confidence}%` : label}
		</span>
	);
}

export default EnrichmentBadge;
