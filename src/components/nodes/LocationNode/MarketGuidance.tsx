import {
	TrendingUp,
	TrendingDown,
	Minus,
	Target,
	AlertTriangle,
	CheckCircle,
	XCircle,
	Building2,
	Map,
	DollarSign,
} from 'lucide-react';
import { MarketContext, Grade, CityType } from './scoring';

interface MarketGuidanceProps {
	marketContext: MarketContext;
	grade: Grade;
	totalScore: number;
	onFindSuburbs?: () => void;
}

// Decision matrix based on the conversation framework
const DECISION_MATRIX: Record<
	CityType,
	Record<Grade, { action: string; effort: string; timeline: string }>
> = {
	'major-metro': {
		A: {
			action: 'Proceed, but suburbs are likely better',
			effort: 'High (competitive market)',
			timeline: 'Month 2-3 for traction',
		},
		B: {
			action: 'Evaluate suburbs first',
			effort: 'Medium-High',
			timeline: 'Month 2-4 for profitability',
		},
		C: {
			action: 'Target suburbs instead',
			effort: 'High if pursuing core',
			timeline: 'Month 3-6 if core, Month 1-2 if suburbs',
		},
		D: {
			action: 'Skip core, find suburbs',
			effort: 'Very high if pursuing core',
			timeline: 'Likely never profitable in core',
		},
		F: {
			action: 'Skip entirely or find suburbs',
			effort: 'Not worth the effort',
			timeline: 'N/A',
		},
	},
	'mid-size': {
		A: {
			action: 'Deploy immediately',
			effort: 'Low',
			timeline: 'Month 1 profitability possible',
		},
		B: {
			action: 'Proceed confidently',
			effort: 'Low-Medium',
			timeline: 'Month 1-2 for profitability',
		},
		C: {
			action: 'Check competition first',
			effort: 'Medium',
			timeline: 'Month 2-3 for profitability',
		},
		D: {
			action: 'Only with specific advantage',
			effort: 'Medium-High',
			timeline: 'Month 3-4, uncertain',
		},
		F: {
			action: 'Skip this market',
			effort: 'Not recommended',
			timeline: 'Unlikely to profit',
		},
	},
	'small-city': {
		A: {
			action: 'Proceed if volume sufficient',
			effort: 'Low',
			timeline: 'Month 1-2',
		},
		B: {
			action: 'Viable with niche focus',
			effort: 'Low',
			timeline: 'Month 2-3',
		},
		C: {
			action: 'Consider if no competition',
			effort: 'Medium',
			timeline: 'Month 2-4',
		},
		D: {
			action: 'Likely not enough volume',
			effort: 'High relative to reward',
			timeline: 'Uncertain',
		},
		F: {
			action: 'Skip',
			effort: 'N/A',
			timeline: 'N/A',
		},
	},
	rural: {
		A: {
			action: 'Rare opportunity, proceed',
			effort: 'Low',
			timeline: 'Month 1-2',
		},
		B: {
			action: 'Viable for specific niches',
			effort: 'Low',
			timeline: 'Month 2-3',
		},
		C: {
			action: 'Usually not enough volume',
			effort: 'Medium',
			timeline: 'Uncertain',
		},
		D: {
			action: 'Skip',
			effort: 'N/A',
			timeline: 'N/A',
		},
		F: {
			action: 'Skip',
			effort: 'N/A',
			timeline: 'N/A',
		},
	},
};

// Estimated monthly economics by grade
const ECONOMICS_BY_GRADE: Record<
	Grade,
	{ leads: string; revenue: string; profit: string }
> = {
	A: { leads: '8-12/month', revenue: '$600-900', profit: '$400-600' },
	B: { leads: '5-8/month', revenue: '$300-500', profit: '$150-350' },
	C: { leads: '3-5/month', revenue: '$150-300', profit: '$0-150' },
	D: { leads: '1-3/month', revenue: '$50-150', profit: '-$50 to $50' },
	F: { leads: '0-1/month', revenue: '$0-50', profit: '-$100+' },
};

export function MarketGuidance({
	marketContext,
	grade,
	totalScore,
	onFindSuburbs,
}: MarketGuidanceProps) {
	const decision = DECISION_MATRIX[marketContext.cityType][grade];
	const economics = ECONOMICS_BY_GRADE[grade];

	const getGradeIcon = () => {
		switch (grade) {
			case 'A':
			case 'B':
				return <CheckCircle size={14} className="text-emerald-400" />;
			case 'C':
			case 'D':
				return <AlertTriangle size={14} className="text-amber-400" />;
			case 'F':
				return <XCircle size={14} className="text-red-400" />;
		}
	};

	const getCityTypeLabel = () => {
		switch (marketContext.cityType) {
			case 'major-metro':
				return 'Major Metro';
			case 'mid-size':
				return 'Mid-Size City';
			case 'small-city':
				return 'Small City';
			case 'rural':
				return 'Rural Area';
		}
	};

	const getEffortIcon = () => {
		if (decision.effort.includes('Low')) {
			return <TrendingDown size={12} className="text-emerald-400" />;
		} else if (decision.effort.includes('High')) {
			return <TrendingUp size={12} className="text-red-400" />;
		}
		return <Minus size={12} className="text-amber-400" />;
	};

	return (
		<div className="space-y-3">
			{/* Market Type Header */}
			<div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50">
				<Map size={12} className="text-slate-400" />
				<span className="text-[10px] text-slate-400 uppercase tracking-wider">
					{getCityTypeLabel()}
				</span>
				<span className="text-[10px] text-slate-600">|</span>
				<span className="text-[10px] text-slate-400">
					Grade {grade} ({totalScore}/18)
				</span>
			</div>

			{/* Decision */}
			<div className="p-2.5 rounded-lg bg-slate-800/30 border border-slate-700/30 space-y-2">
				<div className="flex items-start gap-2">
					<Target size={14} className="shrink-0 mt-0.5 text-sky-400" />
					<div className="space-y-0.5">
						<span className="text-[10px] text-slate-500 uppercase tracking-wider">
							Recommendation
						</span>
						<p className="text-xs text-slate-200 font-medium">
							{decision.action}
						</p>
					</div>
				</div>

				<div className="grid grid-cols-2 gap-2 pt-1">
					<div className="flex items-center gap-1.5">
						{getEffortIcon()}
						<div>
							<span className="text-[9px] text-slate-600 block">Effort</span>
							<span className="text-[10px] text-slate-400">
								{decision.effort}
							</span>
						</div>
					</div>
					<div className="flex items-center gap-1.5">
						<DollarSign size={12} className="text-slate-500" />
						<div>
							<span className="text-[9px] text-slate-600 block">Timeline</span>
							<span className="text-[10px] text-slate-400">
								{decision.timeline}
							</span>
						</div>
					</div>
				</div>
			</div>

			{/* Estimated Economics */}
			<div className="p-2.5 rounded-lg bg-slate-800/30 border border-slate-700/30">
				<div className="flex items-center gap-1.5 mb-2">
					<DollarSign size={12} className="text-slate-500" />
					<span className="text-[10px] text-slate-500 uppercase tracking-wider">
						Estimated Monthly Economics
					</span>
				</div>
				<div className="grid grid-cols-3 gap-2">
					<div className="text-center">
						<span className="text-[9px] text-slate-600 block">Leads</span>
						<span className="text-[10px] text-slate-300 font-medium">
							{economics.leads}
						</span>
					</div>
					<div className="text-center">
						<span className="text-[9px] text-slate-600 block">Revenue</span>
						<span className="text-[10px] text-slate-300 font-medium">
							{economics.revenue}
						</span>
					</div>
					<div className="text-center">
						<span className="text-[9px] text-slate-600 block">Profit</span>
						<span
							className={`text-[10px] font-medium ${
								grade === 'A' || grade === 'B'
									? 'text-emerald-400'
									: grade === 'C'
										? 'text-amber-400'
										: 'text-red-400'
							}`}
						>
							{economics.profit}
						</span>
					</div>
				</div>
			</div>

			{/* Suburb CTA for Major Metros */}
			{marketContext.shouldSuggestSuburbs && onFindSuburbs && (
				<button
					onClick={onFindSuburbs}
					className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border bg-sky-500/10 border-sky-500/30 text-sky-400 hover:bg-sky-500/20 transition-colors"
				>
					<Building2 size={14} />
					<span className="text-xs font-medium">
						Find Suburbs to Evaluate
					</span>
				</button>
			)}

			{/* Quick Reference */}
			<div className="p-2 rounded-lg bg-slate-900/50 border border-slate-700/30">
				<div className="flex items-center gap-1.5 mb-1.5">
					{getGradeIcon()}
					<span className="text-[10px] text-slate-400 font-medium">
						What Grade {grade} Means
					</span>
				</div>
				<p className="text-[10px] text-slate-500 leading-relaxed">
					{getGradeDescription(grade, marketContext.isMajorMetro)}
				</p>
			</div>
		</div>
	);
}

function getGradeDescription(grade: Grade, isMajorMetro: boolean): string {
	if (isMajorMetro) {
		switch (grade) {
			case 'A':
				return "Excellent fundamentals for a major metro. Still, suburbs typically offer better ROI with less competition.";
			case 'B':
				return "Good market, but major metros require more effort. Suburbs in this area likely score even higher.";
			case 'C':
				return "Expected for a major metro core. This isn't a red flag—it's a signal to target suburbs instead.";
			case 'D':
				return "Low score is normal for competitive metro cores. The real opportunity is in the surrounding suburbs.";
			case 'F':
				return "Structural problems beyond typical metro competition. Consider skipping this area entirely.";
		}
	}

	switch (grade) {
		case 'A':
			return "Excellent market with strong fundamentals. You'll likely make money here with standard execution.";
		case 'B':
			return "Good market where the math works in your favor. Proceed with confidence.";
		case 'C':
			return "Viable market but may require more effort. Check competition before committing.";
		case 'D':
			return "Marginal market where you'll struggle. Only pursue with specific advantages or relationships.";
		case 'F':
			return "Poor market with structural problems. The math doesn't work here—find a better opportunity.";
	}
}

export default MarketGuidance;
