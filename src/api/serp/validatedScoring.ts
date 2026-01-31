/**
 * Validated Gap Scoring System
 * Implements the 90-point scoring system with trend validation
 */

import type { TrendValidation, SerpDemandSignals } from './validation';

// ==================== Types ====================

export interface MarketValidation {
	serpSignals: SerpDemandSignals;
	trendValidation: TrendValidation;
	keywordData?: {
		volume?: string;
		cpc?: number;
		yoyChange?: number;
	};
	demographics?: {
		population?: number;
		medianIncome?: number;
		homeownershipRate?: number;
	};
}

export interface ValidatedGapScore {
	score: number;
	maxScore: number;
	grade: 'A' | 'B' | 'C' | 'D' | 'F';
	verdict:
		| 'STRONG_OPPORTUNITY'
		| 'OPPORTUNITY_WITH_CAVEATS'
		| 'VALIDATE_MANUALLY'
		| 'SKIP';
	flags: string[];
	breakdown: {
		demandValidation: number;
		competitionWeakness: number;
		monetizationPotential: number;
		marketQuality: number;
	};
	reasoning: string;
}

export interface ScoringContext {
	category: string;
	city: string;
	state?: string | null;
	tier: 'tier1' | 'tier2' | 'tier3' | 'conditional';
	aggregatorDominance?: number; // 0-100 percentage
	hasLSAs?: boolean;
}

// ==================== Constants ====================

// High-value categories (higher CPC, lead value)
const HIGH_VALUE_CATEGORIES = [
	'hvac',
	'roofing',
	'garage door',
	'appliance repair',
	'plumber',
	'electrician',
	'foundation repair',
	'water damage',
	'mold remediation',
];

// Emergency service categories
const EMERGENCY_CATEGORIES = [
	'emergency',
	'plumber',
	'electrician',
	'hvac',
	'locksmith',
	'towing',
	'water damage',
	'flood',
];

// ==================== Main Scoring Function ====================

/**
 * Calculate a validated gap score incorporating trend and demand signals
 * Max score: 90 points
 */
export function calculateValidatedGapScore(
	validation: MarketValidation,
	context: ScoringContext,
): ValidatedGapScore {
	let score = 0;
	const flags: string[] = [];
	const breakdown = {
		demandValidation: 0,
		competitionWeakness: 0,
		monetizationPotential: 0,
		marketQuality: 0,
	};

	// ===== DEMAND VALIDATION (0-35 points) =====
	const demandScore = calculateDemandValidationScore(
		validation.trendValidation,
		validation.serpSignals,
		flags,
	);
	breakdown.demandValidation = demandScore;
	score += demandScore;

	// ===== COMPETITION WEAKNESS (0-25 points) =====
	const competitionScore = calculateCompetitionWeaknessScore(
		validation.serpSignals,
		context,
		flags,
	);
	breakdown.competitionWeakness = competitionScore;
	score += competitionScore;

	// ===== MONETIZATION POTENTIAL (0-20 points) =====
	const monetizationScore = calculateMonetizationScore(
		validation.serpSignals,
		validation.keywordData,
		context,
		flags,
	);
	breakdown.monetizationPotential = monetizationScore;
	score += monetizationScore;

	// ===== MARKET QUALITY (0-10 points) =====
	const marketQualityScore = calculateMarketQualityScore(
		validation.demographics,
		flags,
	);
	breakdown.marketQuality = marketQualityScore;
	score += marketQualityScore;

	// ===== PENALTY MODIFIERS =====
	score = applyPenalties(score, validation, flags);

	// ===== FINAL SCORE CALCULATION =====
	const maxScore = 90;
	const grade = calculateGrade(score, maxScore);
	const verdict = determineVerdict(score, flags);
	const reasoning = generateReasoning(breakdown, flags, validation);

	return {
		score: Math.round(score),
		maxScore,
		grade,
		verdict,
		flags,
		breakdown,
		reasoning,
	};
}

// ==================== Scoring Components ====================

/**
 * Calculate demand validation score (0-35 points)
 * Trend stability is the PRIMARY signal
 */
function calculateDemandValidationScore(
	trend: TrendValidation,
	signals: SerpDemandSignals,
	flags: string[],
): number {
	let score = 0;

	// Trend stability is now the PRIMARY signal (0-25 points)
	if (trend.isStable && trend.averageInterest > 20) {
		score += 25;
	} else if (trend.spikeDetected) {
		// CRITICAL: Spike detected - major penalty
		score += 0;
		if (!flags.some((f) => f.includes('SPIKE_ANOMALY'))) {
			flags.push(
				`SPIKE_ANOMALY: Search volume inflated by single event (${trend.spikeRatio.toFixed(1)}x median) - demand unvalidated`,
			);
		}
	} else if (trend.averageInterest > 10) {
		score += 10;
	} else if (trend.confidenceScore === 0) {
		// No trend data available
		if (!flags.some((f) => f.includes('NO_TREND_DATA'))) {
			flags.push('NO_TREND_DATA: Unable to validate search demand');
		}
	} else {
		if (!flags.some((f) => f.includes('LOW_SEARCH_INTEREST'))) {
			flags.push(
				'LOW_SEARCH_INTEREST: Trend data shows minimal search activity',
			);
		}
	}

	// Cross-validate with SERP signals (0-10 points)
	if (signals.demandConfidence === 'high') {
		score += 10;
	} else if (signals.demandConfidence === 'medium') {
		score += 5;
	}

	return Math.min(35, score);
}

/**
 * Calculate competition weakness score (0-25 points)
 */
function calculateCompetitionWeaknessScore(
	signals: SerpDemandSignals,
	context: ScoringContext,
	flags: string[],
): number {
	let score = 0;

	// Aggregator dominance opportunity (0-15 points)
	const aggDominance = context.aggregatorDominance ?? 0;
	if (aggDominance >= 60) {
		score += 15; // High aggregator dominance = opportunity
	} else if (aggDominance >= 40) {
		score += 10;
	} else if (aggDominance >= 20) {
		score += 5;
	}

	// LSA opportunity (0-10 points)
	if (!signals.lsaPresent) {
		score += 10; // No LSAs = less competition
	} else if (signals.lsaCount < 3) {
		score += 5;
	} else if (signals.lsaCount >= 5) {
		// High LSA count means proven market but more competition
		if (!flags.some((f) => f.includes('HIGH_LSA_COMPETITION'))) {
			flags.push(
				`HIGH_LSA_COMPETITION: ${signals.lsaCount} LSAs active - competitive market`,
			);
		}
	}

	return Math.min(25, score);
}

/**
 * Calculate monetization potential score (0-20 points)
 */
function calculateMonetizationScore(
	signals: SerpDemandSignals,
	keywordData: MarketValidation['keywordData'],
	context: ScoringContext,
	flags: string[],
): number {
	let score = 0;

	// CPC indicates advertiser willingness to pay (0-15 points)
	const cpc = keywordData?.cpc ?? 0;
	if (cpc > 25) {
		score += 15;
	} else if (cpc > 15) {
		score += 10;
	} else if (cpc > 8) {
		score += 5;
	}

	// If no CPC data, use category heuristics
	if (!keywordData?.cpc) {
		const isHighValue = HIGH_VALUE_CATEGORIES.some((hv) =>
			context.category.toLowerCase().includes(hv),
		);
		if (isHighValue) {
			score += 8; // Assume reasonable CPC for high-value categories
		}
	}

	// Provider availability - established businesses to sell leads to (0-5 points)
	if (signals.establishedBusinesses >= 5) {
		score += 5;
	} else if (signals.establishedBusinesses >= 3) {
		score += 3;
	} else if (signals.establishedBusinesses === 0) {
		if (!flags.some((f) => f.includes('FEW_ESTABLISHED_PROVIDERS'))) {
			flags.push(
				'FEW_ESTABLISHED_PROVIDERS: Limited providers to sell leads to',
			);
		}
	}

	return Math.min(20, score);
}

/**
 * Calculate market quality score (0-10 points)
 */
function calculateMarketQualityScore(
	demographics: MarketValidation['demographics'],
	_flags: string[], // Reserved for future demographic-related flags
): number {
	if (!demographics) {
		return 0; // No demographics data
	}

	let score = 0;

	// Median income (0-5 points)
	const income = demographics.medianIncome ?? 0;
	if (income > 80000) {
		score += 5;
	} else if (income > 60000) {
		score += 3;
	} else if (income > 40000) {
		score += 1;
	}

	// Homeownership rate (0-5 points) - important for home services
	const homeownership = demographics.homeownershipRate ?? 0;
	if (homeownership > 0.65) {
		score += 5;
	} else if (homeownership > 0.5) {
		score += 3;
	} else if (homeownership > 0.4) {
		score += 1;
	}

	return Math.min(10, score);
}

/**
 * Apply penalty modifiers to the score
 */
function applyPenalties(
	score: number,
	validation: MarketValidation,
	flags: string[],
): number {
	let adjustedScore = score;

	// If trend data and SERP signals conflict, reduce confidence
	if (
		validation.trendValidation.spikeDetected &&
		validation.serpSignals.demandConfidence === 'high'
	) {
		if (!flags.some((f) => f.includes('DATA_CONFLICT'))) {
			flags.push(
				'DATA_CONFLICT: SERP shows activity but trend shows spike - investigate manually',
			);
		}
	}

	// YoY decline penalty
	const yoyChange = validation.keywordData?.yoyChange;
	if (yoyChange !== undefined && yoyChange < -30) {
		adjustedScore = Math.floor(adjustedScore * 0.7);
		if (!flags.some((f) => f.includes('SEVERE_DECLINE'))) {
			flags.push(`SEVERE_DECLINE: ${Math.abs(yoyChange)}% YoY decline`);
		}
	}

	// Declining trend penalty
	if (validation.trendValidation.trendDirection === 'declining') {
		adjustedScore = Math.floor(adjustedScore * 0.85);
	}

	// Spike detected caps score at 40
	if (validation.trendValidation.spikeDetected) {
		adjustedScore = Math.min(adjustedScore, 40);
	}

	return Math.max(0, adjustedScore);
}

// ==================== Helper Functions ====================

function calculateGrade(
	score: number,
	maxScore: number,
): 'A' | 'B' | 'C' | 'D' | 'F' {
	const percentage = (score / maxScore) * 100;
	if (percentage >= 78) return 'A'; // 70+ out of 90
	if (percentage >= 61) return 'B'; // 55+ out of 90
	if (percentage >= 44) return 'C'; // 40+ out of 90
	if (percentage >= 28) return 'D'; // 25+ out of 90
	return 'F';
}

function determineVerdict(
	score: number,
	flags: string[],
): ValidatedGapScore['verdict'] {
	const hasCriticalFlags = flags.some(
		(f) =>
			f.includes('SPIKE_ANOMALY') ||
			f.includes('SEVERE_DECLINE') ||
			f.includes('NO_TREND_DATA'),
	);

	if (score >= 55 && !hasCriticalFlags) {
		return 'STRONG_OPPORTUNITY';
	}
	if (score >= 55 && hasCriticalFlags) {
		return 'OPPORTUNITY_WITH_CAVEATS';
	}
	if (score >= 40) {
		return 'VALIDATE_MANUALLY';
	}
	return 'SKIP';
}

function generateReasoning(
	breakdown: ValidatedGapScore['breakdown'],
	flags: string[],
	validation: MarketValidation,
): string {
	const parts: string[] = [];

	// Demand assessment
	if (breakdown.demandValidation >= 25) {
		parts.push('Strong validated demand');
	} else if (breakdown.demandValidation >= 15) {
		parts.push('Moderate demand signals');
	} else if (validation.trendValidation.spikeDetected) {
		parts.push('Demand spike detected - may be inflated');
	} else {
		parts.push('Limited demand signals');
	}

	// Competition assessment
	if (breakdown.competitionWeakness >= 20) {
		parts.push('weak competition');
	} else if (breakdown.competitionWeakness >= 10) {
		parts.push('moderate competition');
	} else {
		parts.push('competitive market');
	}

	// Add critical warnings
	const criticalFlags = flags.filter(
		(f) =>
			f.includes('SPIKE_ANOMALY') ||
			f.includes('SEVERE_DECLINE') ||
			f.includes('DATA_CONFLICT'),
	);
	if (criticalFlags.length > 0) {
		parts.push('⚠️ requires manual validation');
	}

	return parts.join(', ') + '.';
}

// ==================== Exports for Integration ====================

/**
 * Quick check if a category should be skipped based on validation
 */
export function shouldSkipCategory(validation: MarketValidation): boolean {
	// Skip if spike detected with low average interest
	if (
		validation.trendValidation.spikeDetected &&
		validation.trendValidation.averageInterest < 20
	) {
		return true;
	}

	// Skip if no trend data and no SERP signals
	if (
		validation.trendValidation.confidenceScore === 0 &&
		validation.serpSignals.demandConfidence === 'unvalidated'
	) {
		return true;
	}

	return false;
}

/**
 * Get urgency level for a category based on validation
 */
export function getValidatedUrgency(
	category: string,
	validation: MarketValidation,
): 'Low' | 'Medium' | 'High' {
	// Check if it's an emergency category
	const isEmergency = EMERGENCY_CATEGORIES.some((em) =>
		category.toLowerCase().includes(em),
	);

	if (!isEmergency) return 'Low';

	// Even emergency categories need demand validation
	if (
		validation.trendValidation.isStable &&
		validation.serpSignals.lsaPresent
	) {
		return 'High';
	}

	if (validation.serpSignals.demandConfidence !== 'unvalidated') {
		return 'Medium';
	}

	return 'Low';
}

/**
 * Combine old SERP score with validated score
 * Allows gradual migration from old scoring to new
 */
export function combineWithLegacyScore(
	legacySerpScore: number,
	validatedScore: ValidatedGapScore,
): {
	finalScore: number;
	source: 'validated' | 'legacy' | 'blended';
} {
	// If we have good trend data, prefer validated score
	if (validatedScore.breakdown.demandValidation > 0) {
		// Convert validated score (0-90) to legacy scale (1-10)
		const normalizedValidated = Math.round(
			(validatedScore.score / validatedScore.maxScore) * 10,
		);

		// If scores are close, use validated
		if (Math.abs(normalizedValidated - legacySerpScore) <= 2) {
			return { finalScore: normalizedValidated, source: 'validated' };
		}

		// If there's a big discrepancy and we have warnings, trust validated more
		if (validatedScore.flags.length > 0) {
			return { finalScore: normalizedValidated, source: 'validated' };
		}

		// Blend the scores
		const blended = Math.round((normalizedValidated + legacySerpScore) / 2);
		return { finalScore: blended, source: 'blended' };
	}

	// Fall back to legacy score
	return { finalScore: legacySerpScore, source: 'legacy' };
}
