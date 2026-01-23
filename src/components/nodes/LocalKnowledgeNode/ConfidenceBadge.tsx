import React from 'react';

interface ConfidenceBadgeProps {
	confidence: number;
}

export function ConfidenceBadge({ confidence }: ConfidenceBadgeProps) {
	// Determine color based on confidence level
	const getColorClasses = () => {
		if (confidence >= 80) {
			return 'bg-green-500/20 text-green-400 border-green-500/30';
		} else if (confidence >= 50) {
			return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
		} else {
			return 'bg-red-500/20 text-red-400 border-red-500/30';
		}
	};

	return (
		<div
			className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getColorClasses()}`}
			title={`Confidence: ${confidence}%`}
		>
			{confidence}%
		</div>
	);
}

export default ConfidenceBadge;
