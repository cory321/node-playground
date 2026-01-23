import React from 'react';
import {
	Trophy,
	DollarSign,
	Award,
	Clock,
	Star,
	LucideIcon,
} from 'lucide-react';
import { Winner, WinnerCategory } from '@/types/comparisonPage';

// Map winner categories to icons
const CATEGORY_ICONS: Record<WinnerCategory, LucideIcon> = {
	'Best Overall': Trophy,
	'Best Value': DollarSign,
	'Most Experienced': Award,
	'Best for Emergency': Clock,
	'Most Reviewed': Star,
};

// Map winner categories to colors
const CATEGORY_COLORS: Record<
	WinnerCategory,
	{ bg: string; text: string; border: string }
> = {
	'Best Overall': {
		bg: 'bg-amber-500/10',
		text: 'text-amber-400',
		border: 'border-amber-500/30',
	},
	'Best Value': {
		bg: 'bg-green-500/10',
		text: 'text-green-400',
		border: 'border-green-500/30',
	},
	'Most Experienced': {
		bg: 'bg-blue-500/10',
		text: 'text-blue-400',
		border: 'border-blue-500/30',
	},
	'Best for Emergency': {
		bg: 'bg-red-500/10',
		text: 'text-red-400',
		border: 'border-red-500/30',
	},
	'Most Reviewed': {
		bg: 'bg-purple-500/10',
		text: 'text-purple-400',
		border: 'border-purple-500/30',
	},
};

interface WinnerBadgeProps {
	winner: Winner;
	compact?: boolean;
}

/**
 * WinnerBadge - Displays a winner badge for a provider
 */
export function WinnerBadge({ winner, compact = false }: WinnerBadgeProps) {
	const Icon = CATEGORY_ICONS[winner.category] || Trophy;
	const colors =
		CATEGORY_COLORS[winner.category] || CATEGORY_COLORS['Best Overall'];

	if (compact) {
		return (
			<div
				className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text} border ${colors.border}`}
				title={`${winner.category}: ${winner.providerName}`}
			>
				<Icon size={10} />
				<span>{winner.category}</span>
			</div>
		);
	}

	return (
		<div
			className={`flex flex-col gap-1.5 p-3 rounded-lg ${colors.bg} border ${colors.border}`}
		>
			<div className="flex items-center gap-2">
				<div className={`p-1.5 rounded-full ${colors.bg} ${colors.text}`}>
					<Icon size={14} />
				</div>
				<div className="flex-1 min-w-0">
					<div className={`text-xs font-semibold ${colors.text}`}>
						{winner.category}
					</div>
					<div className="text-sm text-white truncate">
						{winner.providerName}
					</div>
				</div>
			</div>
			<p className="text-xs text-slate-400 line-clamp-2">{winner.reason}</p>
		</div>
	);
}

interface WinnerBadgeListProps {
	winners: Winner[];
}

/**
 * WinnerBadgeList - Displays a list of winner badges
 */
export function WinnerBadgeList({ winners }: WinnerBadgeListProps) {
	if (winners.length === 0) {
		return (
			<div className="text-xs text-slate-500 text-center py-2">
				No winners selected
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-2">
			{winners.map((winner) => (
				<WinnerBadge key={winner.category} winner={winner} />
			))}
		</div>
	);
}

export default WinnerBadge;
