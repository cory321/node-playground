import { DemographicsData } from '@/types/nodes';

export type Grade = 'A' | 'B' | 'C' | 'D' | 'F';
export type Verdict = 'proceed' | 'caution' | 'skip';
export type CityType = 'major-metro' | 'mid-size' | 'small-city' | 'rural';
export type GeographyLevel = 'place' | 'county' | 'state';

// Score explanation for a single metric
export interface ScoreExplanation {
	metric: string;
	label: string;
	value: string;
	rawValue: number | null;
	score: number;
	maxScore: number;
	explanation: string;
	thresholds: { min: number; max: number | null; points: number }[];
}

// Market context based on demographics and geography
export interface MarketContext {
	cityType: CityType;
	isMajorMetro: boolean;
	geographyLevel: GeographyLevel;
	geographyWarning: string | null;
	recommendation: string;
	actionableAdvice: string;
	shouldSuggestSuburbs: boolean;
}

export interface ScorecardResult {
	populationScore: number;
	incomeScore: number;
	homeownershipScore: number;
	homeValueScore: number;
	totalScore: number;
	maxScore: number;
	grade: Grade;
	hasZeros: boolean;
	zeroCount: number;
	verdict: Verdict;
	// Enhanced fields
	explanations: ScoreExplanation[];
	marketContext: MarketContext;
}

/**
 * Score population based on rubric
 * Max: 3 points
 */
export function scorePopulation(population: number | null): number {
	if (population === null) return 0;

	if (population < 15000) return 0;
	if (population < 30000) return 1;
	if (population < 50000) return 2;
	if (population < 250000) return 3; // 50K-250K is sweet spot
	if (population < 500000) return 2;
	return 1; // > 500K
}

/**
 * Score median household income based on rubric
 * Max: 5 points
 */
export function scoreIncome(income: number | null): number {
	if (income === null) return 0;

	if (income < 40000) return 0;
	if (income < 50000) return 1;
	if (income < 60000) return 2;
	if (income < 80000) return 3;
	if (income < 100000) return 4;
	return 5; // > $100K
}

/**
 * Score homeownership rate based on rubric
 * Max: 5 points
 */
export function scoreHomeownership(rate: number | null): number {
	if (rate === null) return 0;

	if (rate < 40) return 0;
	if (rate < 50) return 1;
	if (rate < 55) return 2;
	if (rate < 65) return 3;
	if (rate < 75) return 4;
	return 5; // > 75%
}

/**
 * Score median home value based on rubric
 * Max: 5 points
 */
export function scoreHomeValue(value: number | null): number {
	if (value === null) return 0;

	if (value < 150000) return 0;
	if (value < 200000) return 1;
	if (value < 300000) return 2;
	if (value < 500000) return 3;
	if (value < 800000) return 4;
	return 5; // > $800K
}

/**
 * Calculate grade from total score
 */
export function calculateGrade(totalScore: number): Grade {
	if (totalScore >= 16) return 'A';
	if (totalScore >= 13) return 'B';
	if (totalScore >= 10) return 'C';
	if (totalScore >= 7) return 'D';
	return 'F';
}

/**
 * Calculate verdict from grade
 */
export function calculateVerdict(grade: Grade, zeroCount: number): Verdict {
	// Two+ zeros = skip regardless of score
	if (zeroCount >= 2) return 'skip';

	// One zero = caution
	if (zeroCount === 1) return 'caution';

	// Based on grade
	if (grade === 'A' || grade === 'B') return 'proceed';
	if (grade === 'C' || grade === 'D') return 'caution';
	return 'skip';
}

// Population thresholds for reference
const POPULATION_THRESHOLDS = [
	{ min: 0, max: 15000, points: 0 },
	{ min: 15000, max: 30000, points: 1 },
	{ min: 30000, max: 50000, points: 2 },
	{ min: 50000, max: 250000, points: 3 },
	{ min: 250000, max: 500000, points: 2 },
	{ min: 500000, max: null, points: 1 },
];

const INCOME_THRESHOLDS = [
	{ min: 0, max: 40000, points: 0 },
	{ min: 40000, max: 50000, points: 1 },
	{ min: 50000, max: 60000, points: 2 },
	{ min: 60000, max: 80000, points: 3 },
	{ min: 80000, max: 100000, points: 4 },
	{ min: 100000, max: null, points: 5 },
];

const HOMEOWNERSHIP_THRESHOLDS = [
	{ min: 0, max: 40, points: 0 },
	{ min: 40, max: 50, points: 1 },
	{ min: 50, max: 55, points: 2 },
	{ min: 55, max: 65, points: 3 },
	{ min: 65, max: 75, points: 4 },
	{ min: 75, max: null, points: 5 },
];

const HOME_VALUE_THRESHOLDS = [
	{ min: 0, max: 150000, points: 0 },
	{ min: 150000, max: 200000, points: 1 },
	{ min: 200000, max: 300000, points: 2 },
	{ min: 300000, max: 500000, points: 3 },
	{ min: 500000, max: 800000, points: 4 },
	{ min: 800000, max: null, points: 5 },
];

/**
 * Determine city type based on population
 */
export function determineCityType(population: number | null): CityType {
	if (population === null) return 'small-city';
	if (population >= 500000) return 'major-metro';
	if (population >= 50000) return 'mid-size';
	if (population >= 15000) return 'small-city';
	return 'rural';
}

/**
 * Check if population indicates a major metro
 */
export function isMajorMetro(population: number | null): boolean {
	return population !== null && population >= 500000;
}

/**
 * Format currency for display
 */
function formatCurrency(value: number | null): string {
	if (value === null) return 'N/A';
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		maximumFractionDigits: 0,
	}).format(value);
}

/**
 * Format number with commas
 */
function formatNumber(value: number | null): string {
	if (value === null) return 'N/A';
	return new Intl.NumberFormat('en-US').format(value);
}

/**
 * Format percentage
 */
function formatPercent(value: number | null): string {
	if (value === null) return 'N/A';
	return `${value.toFixed(1)}%`;
}

/**
 * Generate explanation for population score
 */
function getPopulationExplanation(population: number | null, score: number): ScoreExplanation {
	let explanation: string;
	
	if (population === null) {
		explanation = 'Population data unavailable.';
	} else if (population >= 500000) {
		explanation = 'Population over 500K indicates a major metro with high competition. Consider targeting suburbs instead.';
	} else if (population >= 250000) {
		explanation = 'Large city with moderate competition. Can work but may need niche focus.';
	} else if (population >= 50000) {
		explanation = 'Sweet spot! Enough demand without oversaturation. Ideal for lead generation.';
	} else if (population >= 30000) {
		explanation = 'Smaller market with limited volume. May work for specific niches.';
	} else if (population >= 15000) {
		explanation = 'Very small market. Limited search volume expected.';
	} else {
		explanation = 'Too small for sustainable lead generation. Not enough search volume.';
	}

	return {
		metric: 'population',
		label: 'Population',
		value: formatNumber(population),
		rawValue: population,
		score,
		maxScore: 3,
		explanation,
		thresholds: POPULATION_THRESHOLDS,
	};
}

/**
 * Generate explanation for income score
 */
function getIncomeExplanation(income: number | null, score: number): ScoreExplanation {
	let explanation: string;
	
	if (income === null) {
		explanation = 'Income data unavailable.';
	} else if (income >= 100000) {
		explanation = 'High-income market. Residents can easily afford premium services and don\'t DIY.';
	} else if (income >= 80000) {
		explanation = 'Strong income level. Good ability to hire services at fair prices.';
	} else if (income >= 60000) {
		explanation = 'Moderate income. Will hire services but may be price-conscious.';
	} else if (income >= 50000) {
		explanation = 'Below average income. Expect more price shopping and DIY tendency.';
	} else if (income >= 40000) {
		explanation = 'Low income area. High DIY rate, lower lead values.';
	} else {
		explanation = 'Very low income. Strong DIY culture, minimal service spending.';
	}

	return {
		metric: 'income',
		label: 'Median Income',
		value: formatCurrency(income),
		rawValue: income,
		score,
		maxScore: 5,
		explanation,
		thresholds: INCOME_THRESHOLDS,
	};
}

/**
 * Generate explanation for homeownership score
 */
function getHomeownershipExplanation(rate: number | null, score: number): ScoreExplanation {
	let explanation: string;
	
	if (rate === null) {
		explanation = 'Homeownership data unavailable.';
	} else if (rate >= 75) {
		explanation = 'Excellent homeownership rate. Most searches are from actual decision-makers.';
	} else if (rate >= 65) {
		explanation = 'Strong homeownership. Majority of leads will be homeowners who can hire directly.';
	} else if (rate >= 55) {
		explanation = 'Moderate homeownership. Some leads will be renters who call landlords instead.';
	} else if (rate >= 50) {
		explanation = 'Mixed market. About half your clicks may be renters who won\'t convert.';
	} else if (rate >= 40) {
		explanation = 'Renter-heavy market. Many leads won\'t convert. Higher cost per real lead.';
	} else {
		explanation = 'Very low homeownership. Most searches are renters. Poor lead quality expected.';
	}

	return {
		metric: 'homeownership',
		label: 'Homeownership',
		value: formatPercent(rate),
		rawValue: rate,
		score,
		maxScore: 5,
		explanation,
		thresholds: HOMEOWNERSHIP_THRESHOLDS,
	};
}

/**
 * Generate explanation for home value score
 */
function getHomeValueExplanation(value: number | null, score: number): ScoreExplanation {
	let explanation: string;
	
	if (value === null) {
		explanation = 'Home value data unavailable.';
	} else if (value >= 800000) {
		explanation = 'Premium market. Homeowners invest heavily in property maintenance and improvements.';
	} else if (value >= 500000) {
		explanation = 'High-value homes. Strong service demand and willingness to pay for quality.';
	} else if (value >= 300000) {
		explanation = 'Good home values. Regular maintenance spending expected.';
	} else if (value >= 200000) {
		explanation = 'Moderate home values. Basic services in demand.';
	} else if (value >= 150000) {
		explanation = 'Lower home values. Limited maintenance investment.';
	} else {
		explanation = 'Very low home values. Minimal property investment, high DIY rate.';
	}

	return {
		metric: 'homeValue',
		label: 'Home Value',
		value: formatCurrency(value),
		rawValue: value,
		score,
		maxScore: 5,
		explanation,
		thresholds: HOME_VALUE_THRESHOLDS,
	};
}

/**
 * Get geography level warning message
 */
function getGeographyWarning(level: GeographyLevel): string | null {
	switch (level) {
		case 'state':
			return 'Using STATE-level data. These scores are misleading — select a specific city or county for accurate scoring.';
		case 'county':
			return 'Using COUNTY-level data. This may not accurately reflect the specific city you\'re evaluating.';
		case 'place':
			return null; // City-level is accurate
	}
}

/**
 * Generate market context and recommendations
 */
function getMarketContext(
	demographics: DemographicsData,
	grade: Grade,
	cityType: CityType
): MarketContext {
	const isMetro = isMajorMetro(demographics.population);
	const geoLevel = demographics.geographyLevel;
	const geoWarning = getGeographyWarning(geoLevel);

	let recommendation: string;
	let actionableAdvice: string;
	let shouldSuggestSuburbs = false;

	// Context-aware recommendations based on the decision matrix
	if (isMetro) {
		shouldSuggestSuburbs = true;
		switch (grade) {
			case 'A':
			case 'B':
				recommendation = 'Major metro with good fundamentals. Suburbs will likely score even better.';
				actionableAdvice = 'You can proceed here, but evaluate suburbs first — they typically score higher with less competition.';
				break;
			case 'C':
				recommendation = 'Major metro core scoring C is expected. The opportunity is in the suburbs.';
				actionableAdvice = 'Find 5-10 suburbs with population 50K-200K and score those. Deploy to the ones scoring 13+.';
				break;
			case 'D':
				recommendation = 'Major metro core scoring D is normal — high competition, often renter-heavy.';
				actionableAdvice = 'Target suburbs instead. Major metro cores require more budget and longer timelines.';
				break;
			case 'F':
				recommendation = 'Major metro with structural problems. Skip the core entirely.';
				actionableAdvice = 'The suburbs may still be viable. Search for suburbs and evaluate each one.';
				break;
		}
	} else {
		// Non-metro cities
		switch (grade) {
			case 'A':
				recommendation = 'Excellent market! Strong fundamentals across all metrics.';
				actionableAdvice = 'Deploy immediately. This is an ideal market for lead generation.';
				break;
			case 'B':
				recommendation = 'Good market with solid fundamentals.';
				actionableAdvice = 'Proceed confidently. Standard playbook will work well here.';
				break;
			case 'C':
				recommendation = 'Viable market but may have some challenges.';
				actionableAdvice = 'Check competition first (search "[service] [city]"). If SERP is weak, proceed with caution.';
				break;
			case 'D':
				recommendation = 'Marginal market. Only pursue with specific advantages.';
				actionableAdvice = 'Only proceed if: you have local relationships, competition is very weak, or no better options exist.';
				break;
			case 'F':
				recommendation = 'Poor market with structural problems.';
				actionableAdvice = 'Skip this market. Find a better opportunity — the math won\'t work here.';
				break;
		}
	}

	// Override recommendation if geography data is unreliable
	if (geoLevel === 'state') {
		recommendation = 'Cannot accurately evaluate — using state-level data.';
		actionableAdvice = 'Search for a specific city or county to get accurate demographic data.';
		shouldSuggestSuburbs = false;
	}

	return {
		cityType,
		isMajorMetro: isMetro,
		geographyLevel: geoLevel,
		geographyWarning: geoWarning,
		recommendation,
		actionableAdvice,
		shouldSuggestSuburbs,
	};
}

/**
 * Calculate complete scorecard from demographics data
 */
export function calculateScorecard(
	demographics: DemographicsData
): ScorecardResult {
	const populationScore = scorePopulation(demographics.population);
	const incomeScore = scoreIncome(demographics.medianHouseholdIncome);
	const homeownershipScore = scoreHomeownership(
		demographics.homeownershipRate
	);
	const homeValueScore = scoreHomeValue(demographics.medianHomeValue);

	const scores = [
		populationScore,
		incomeScore,
		homeownershipScore,
		homeValueScore,
	];
	const zeroCount = scores.filter((s) => s === 0).length;
	const totalScore = scores.reduce((sum, s) => sum + s, 0);
	const grade = calculateGrade(totalScore);
	const verdict = calculateVerdict(grade, zeroCount);
	const cityType = determineCityType(demographics.population);

	// Generate explanations for each metric
	const explanations: ScoreExplanation[] = [
		getPopulationExplanation(demographics.population, populationScore),
		getIncomeExplanation(demographics.medianHouseholdIncome, incomeScore),
		getHomeownershipExplanation(demographics.homeownershipRate, homeownershipScore),
		getHomeValueExplanation(demographics.medianHomeValue, homeValueScore),
	];

	// Generate market context
	const marketContext = getMarketContext(demographics, grade, cityType);

	return {
		populationScore,
		incomeScore,
		homeownershipScore,
		homeValueScore,
		totalScore,
		maxScore: 18,
		grade,
		hasZeros: zeroCount > 0,
		zeroCount,
		verdict,
		explanations,
		marketContext,
	};
}
