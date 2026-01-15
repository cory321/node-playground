import { useState } from 'react';
import {
	Trophy,
	AlertTriangle,
	CheckCircle,
	Copy,
	Check,
	ChevronDown,
	ChevronUp,
	AlertCircle,
	Building2,
	Info,
	Lightbulb,
} from 'lucide-react';
import { DemographicsData } from '@/types/nodes';
import { calculateScorecard, Grade, Verdict, ScoreExplanation } from './scoring';

interface ScorecardProps {
	demographics: DemographicsData;
	locationName?: string;
	locationState?: string;
	onFindSuburbs?: () => void;
	onSaveToCompare?: () => void;
}

// Grade color classes
const gradeColors: Record<Grade, { bg: string; text: string; border: string }> =
	{
		A: {
			bg: 'bg-emerald-500/20',
			text: 'text-emerald-400',
			border: 'border-emerald-500/30',
		},
		B: {
			bg: 'bg-emerald-500/20',
			text: 'text-emerald-400',
			border: 'border-emerald-500/30',
		},
		C: {
			bg: 'bg-amber-500/20',
			text: 'text-amber-400',
			border: 'border-amber-500/30',
		},
		D: {
			bg: 'bg-amber-500/20',
			text: 'text-amber-400',
			border: 'border-amber-500/30',
		},
		F: {
			bg: 'bg-red-500/20',
			text: 'text-red-400',
			border: 'border-red-500/30',
		},
	};

// Verdict display config
const verdictConfig: Record<
	Verdict,
	{ label: string; emoji: string; color: string }
> = {
	proceed: { label: 'Proceed', emoji: '🟢', color: 'text-emerald-400' },
	caution: { label: 'Caution', emoji: '🟡', color: 'text-amber-400' },
	skip: { label: 'Skip', emoji: '🔴', color: 'text-red-400' },
};

export function Scorecard({
	demographics,
	locationName,
	locationState,
	onFindSuburbs,
	onSaveToCompare,
}: ScorecardProps) {
	const [copied, setCopied] = useState(false);
	const [showExplanations, setShowExplanations] = useState(false);
	const scorecard = calculateScorecard(demographics);
	const gradeStyle = gradeColors[scorecard.grade];
	const verdictStyle = verdictConfig[scorecard.verdict];
	const { marketContext } = scorecard;

	// Score bar percentage
	const scorePercent = (scorecard.totalScore / scorecard.maxScore) * 100;

	// Format helpers
	const formatCurrency = (value: number | null) => {
		if (value === null) return 'N/A';
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			maximumFractionDigits: 0,
		}).format(value);
	};

	const formatNumber = (value: number | null) => {
		if (value === null) return 'N/A';
		return new Intl.NumberFormat('en-US').format(value);
	};

	const formatPercent = (value: number | null) => {
		if (value === null) return 'N/A';
		return `${value.toFixed(1)}%`;
	};

	// Copy formatted data to clipboard
	const handleCopy = async () => {
		const locationLabel =
			[locationName, locationState].filter(Boolean).join(', ') ||
			demographics.geographyName;
		const verdictEmoji =
			scorecard.verdict === 'proceed'
				? '🟢'
				: scorecard.verdict === 'caution'
					? '🟡'
					: '🔴';
		const verdictLabel =
			scorecard.verdict.charAt(0).toUpperCase() + scorecard.verdict.slice(1);
		const cityTypeLabel = marketContext.isMajorMetro
			? ' (Major Metro)'
			: '';

		const formattedText = `📍 ${locationLabel}${cityTypeLabel}
━━━━━━━━━━━━━━━━━━━━━━━

📊 DEMOGRAPHICS (${marketContext.geographyLevel}-level data)
   Population:    ${formatNumber(demographics.population)}
   Median Income: ${formatCurrency(demographics.medianHouseholdIncome)}
   Homeownership: ${formatPercent(demographics.homeownershipRate)}
   Home Value:    ${formatCurrency(demographics.medianHomeValue)}

🏆 SCORECARD
   Grade: ${scorecard.grade}  |  Score: ${scorecard.totalScore}/${scorecard.maxScore}
   ├─ Population:    ${scorecard.populationScore}/3
   ├─ Income:        ${scorecard.incomeScore}/5
   ├─ Homeownership: ${scorecard.homeownershipScore}/5
   └─ Home Value:    ${scorecard.homeValueScore}/5

${verdictEmoji} Verdict: ${verdictLabel}${scorecard.hasZeros ? ` (${scorecard.zeroCount} zero${scorecard.zeroCount > 1 ? 's' : ''})` : ''}

💡 ${marketContext.recommendation}
📋 ${marketContext.actionableAdvice}`;

		try {
			await navigator.clipboard.writeText(formattedText);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (err) {
			console.error('Failed to copy:', err);
		}
	};

	return (
		<div className="mt-px bg-slate-900/50 px-3 py-3 space-y-3">
			{/* Geography Warning */}
			{marketContext.geographyWarning && (
				<div
					className={`flex items-start gap-2 p-2 rounded-lg border ${
						marketContext.geographyLevel === 'state'
							? 'bg-red-500/10 border-red-500/30'
							: 'bg-amber-500/10 border-amber-500/30'
					}`}
				>
					<AlertCircle
						size={14}
						className={`shrink-0 mt-0.5 ${
							marketContext.geographyLevel === 'state'
								? 'text-red-400'
								: 'text-amber-400'
						}`}
					/>
					<span
						className={`text-[11px] leading-relaxed ${
							marketContext.geographyLevel === 'state'
								? 'text-red-300'
								: 'text-amber-300'
						}`}
					>
						{marketContext.geographyWarning}
					</span>
				</div>
			)}

			{/* Major Metro Indicator */}
			{marketContext.isMajorMetro && !marketContext.geographyWarning && (
				<div className="flex items-start gap-2 p-2 rounded-lg border bg-sky-500/10 border-sky-500/30">
					<Building2 size={14} className="shrink-0 mt-0.5 text-sky-400" />
					<div className="space-y-1">
						<span className="text-[11px] text-sky-300 font-medium">
							Major Metro Detected
						</span>
						<p className="text-[10px] text-sky-300/70 leading-relaxed">
							Population over 500K. Core cities often score lower due to
							competition. Consider evaluating suburbs.
						</p>
					</div>
				</div>
			)}

			{/* Score Bar */}
			<div className="space-y-1.5">
				<div className="flex items-center justify-between">
					<span className="text-[10px] text-slate-500 uppercase tracking-wider">
						Total Score
					</span>
					<span className="text-xs font-mono font-medium text-slate-200">
						{scorecard.totalScore} / {scorecard.maxScore}
					</span>
				</div>
				<div className="h-2 bg-slate-800 rounded-full overflow-hidden">
					<div
						className={`h-full rounded-full transition-all duration-500 ${
							scorecard.grade === 'A' || scorecard.grade === 'B'
								? 'bg-gradient-to-r from-emerald-600 to-emerald-400'
								: scorecard.grade === 'C' || scorecard.grade === 'D'
									? 'bg-gradient-to-r from-amber-600 to-amber-400'
									: 'bg-gradient-to-r from-red-600 to-red-400'
						}`}
						style={{ width: `${scorePercent}%` }}
					/>
				</div>
			</div>

			{/* Grade & Verdict Row */}
			<div className="flex items-center gap-2 flex-wrap">
				{/* Grade Badge */}
				<div
					className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border ${gradeStyle.bg} ${gradeStyle.border}`}
				>
					<Trophy size={12} className={gradeStyle.text} />
					<span className={`text-sm font-bold ${gradeStyle.text}`}>
						{scorecard.grade}
					</span>
				</div>

				{/* Any Zeros Indicator */}
				<div
					className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border ${
						scorecard.hasZeros
							? 'bg-red-500/10 border-red-500/30'
							: 'bg-slate-800/50 border-slate-700/50'
					}`}
				>
					{scorecard.hasZeros ? (
						<>
							<AlertTriangle size={11} className="text-red-400" />
							<span className="text-[10px] text-red-400 font-medium">
								{scorecard.zeroCount} Zero{scorecard.zeroCount > 1 ? 's' : ''}
							</span>
						</>
					) : (
						<>
							<CheckCircle size={11} className="text-slate-500" />
							<span className="text-[10px] text-slate-500">No Zeros</span>
						</>
					)}
				</div>

				{/* Verdict */}
				<div className="flex items-center gap-1.5">
					<span className="text-sm">{verdictStyle.emoji}</span>
					<span className={`text-xs font-medium ${verdictStyle.color}`}>
						{verdictStyle.label}
					</span>
				</div>

				{/* Actions */}
				<div className="ml-auto flex items-center gap-1.5">
					{/* Save to Compare Button */}
					{onSaveToCompare && (
						<button
							onClick={onSaveToCompare}
							className="flex items-center gap-1 px-2 py-1 rounded border transition-all duration-200 bg-slate-800/50 border-slate-700/50 text-slate-400 hover:text-slate-200 hover:border-slate-600"
							title="Save to compare"
						>
							<Check size={11} />
							<span className="text-[10px] font-medium">Save</span>
						</button>
					)}

					{/* Copy Button */}
					<button
						onClick={handleCopy}
						className={`flex items-center gap-1 px-2 py-1 rounded border transition-all duration-200 ${
							copied
								? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
								: 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:text-slate-200 hover:border-slate-600'
						}`}
						title="Copy demographics & score"
					>
						{copied ? (
							<>
								<Check size={11} />
								<span className="text-[10px] font-medium">Copied</span>
							</>
						) : (
							<>
								<Copy size={11} />
								<span className="text-[10px] font-medium">Copy</span>
							</>
						)}
					</button>
				</div>
			</div>

			{/* Individual Scores with Expandable Explanations */}
			<div className="space-y-1.5">
				<button
					onClick={() => setShowExplanations(!showExplanations)}
					className="flex items-center gap-1.5 text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
				>
					{showExplanations ? (
						<ChevronUp size={12} />
					) : (
						<ChevronDown size={12} />
					)}
					<span className="uppercase tracking-wider">
						{showExplanations ? 'Hide' : 'Show'} Score Breakdown
					</span>
				</button>

				{showExplanations ? (
					<div className="space-y-2 pt-1">
						{scorecard.explanations.map((exp) => (
							<ScoreExplanationRow key={exp.metric} explanation={exp} />
						))}
					</div>
				) : (
					<div className="grid grid-cols-4 gap-1.5">
						<ScoreChip
							label="Pop"
							score={scorecard.populationScore}
							max={3}
						/>
						<ScoreChip label="Inc" score={scorecard.incomeScore} max={5} />
						<ScoreChip
							label="Own"
							score={scorecard.homeownershipScore}
							max={5}
						/>
						<ScoreChip
							label="Val"
							score={scorecard.homeValueScore}
							max={5}
						/>
					</div>
				)}
			</div>

			{/* Market Guidance */}
			<div className="space-y-2 pt-1 border-t border-slate-700/50">
				<div className="flex items-start gap-2 pt-2">
					<Lightbulb size={12} className="shrink-0 mt-0.5 text-slate-500" />
					<div className="space-y-1 flex-1">
						<p className="text-[11px] text-slate-300 leading-relaxed">
							{marketContext.recommendation}
						</p>
						<p className="text-[10px] text-slate-500 leading-relaxed">
							{marketContext.actionableAdvice}
						</p>
					</div>
				</div>

				{/* Find Suburbs Button */}
				{marketContext.shouldSuggestSuburbs && onFindSuburbs && (
					<button
						onClick={onFindSuburbs}
						className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border bg-sky-500/10 border-sky-500/30 text-sky-400 hover:bg-sky-500/20 transition-colors"
					>
						<Building2 size={14} />
						<span className="text-xs font-medium">Find Nearby Suburbs</span>
					</button>
				)}
			</div>
		</div>
	);
}

interface ScoreChipProps {
	label: string;
	score: number;
	max: number;
}

function ScoreChip({ label, score, max }: ScoreChipProps) {
	const isZero = score === 0;
	const isFull = score === max;

	return (
		<div
			className={`flex flex-col items-center py-1.5 px-1 rounded border ${
				isZero
					? 'bg-red-500/10 border-red-500/30'
					: isFull
						? 'bg-emerald-500/10 border-emerald-500/30'
						: 'bg-slate-800/50 border-slate-700/50'
			}`}
		>
			<span className="text-[9px] text-slate-500 uppercase">{label}</span>
			<span
				className={`text-xs font-mono font-medium ${
					isZero
						? 'text-red-400'
						: isFull
							? 'text-emerald-400'
							: 'text-slate-300'
				}`}
			>
				{score}/{max}
			</span>
		</div>
	);
}

interface ScoreExplanationRowProps {
	explanation: ScoreExplanation;
}

function ScoreExplanationRow({ explanation }: ScoreExplanationRowProps) {
	const isZero = explanation.score === 0;
	const isFull = explanation.score === explanation.maxScore;

	return (
		<div
			className={`p-2 rounded-lg border ${
				isZero
					? 'bg-red-500/5 border-red-500/20'
					: isFull
						? 'bg-emerald-500/5 border-emerald-500/20'
						: 'bg-slate-800/30 border-slate-700/30'
			}`}
		>
			<div className="flex items-center justify-between mb-1">
				<span className="text-[10px] text-slate-400 font-medium">
					{explanation.label}
				</span>
				<div className="flex items-center gap-2">
					<span className="text-[10px] text-slate-500">
						{explanation.value}
					</span>
					<span
						className={`text-xs font-mono font-medium ${
							isZero
								? 'text-red-400'
								: isFull
									? 'text-emerald-400'
									: 'text-slate-300'
						}`}
					>
						{explanation.score}/{explanation.maxScore}
					</span>
				</div>
			</div>
			<p className="text-[10px] text-slate-500 leading-relaxed">
				{explanation.explanation}
			</p>
		</div>
	);
}

export default Scorecard;
