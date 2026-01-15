import { DemographicsData } from '@/types/nodes';

// =============================================================================
// INTERFACES
// =============================================================================

/**
 * City profile detected from demographics
 */
export interface CityProfile {
	isCollegeTown: boolean;
	isRetirement: boolean;
	isHighIncome: boolean;
	isCoastal: boolean;
	isTourism: boolean;
	traits: string[];
	tier2Categories: string[];
}

/**
 * Market signals detected from SERP analysis
 * Used to determine category viability on a per-market basis
 */
export interface MarketSignals {
	lsaPresent: boolean;
	paidAdCount: number;
	aggregatorDominance: number; // 0-100, % of top 10 results
	localSpecialistCount: number; // Quality local sites in top 10
	avgReviewCount: number; // Average reviews on map pack
	gbpIssues: GBPIssue[]; // Provider outreach opportunities
}

/**
 * GBP issues that represent provider outreach opportunities
 */
export interface GBPIssue {
	businessName: string;
	issues: (
		| 'missing_website'
		| 'missing_photos'
		| 'incomplete_hours'
		| 'no_services_listed'
		| 'low_reviews'
	)[];
	phone?: string;
	estimatedRevenue: 'low' | 'medium' | 'high'; // Based on position + reviews
}

/**
 * Category viability assessment result
 */
export interface CategoryViability {
	viable: boolean;
	confidence: 'high' | 'medium' | 'low';
	reason: string;
	opportunities: {
		leadGen: boolean;
		gbpServices: boolean;
		websiteServices: boolean;
	};
	estimatedCPL: { min: number; max: number };
	providerLeadValue: { min: number; max: number };
}

/**
 * Lead economics data for a category
 */
export interface LeadEconomics {
	avgJobValue: { min: number; max: number };
	providerPays: { min: number; max: number };
	typicalCPL: { min: number; max: number };
	urgency: 'extreme' | 'high' | 'medium' | 'low';
	competitionLevel: 'low' | 'moderate' | 'high' | 'extreme';
	seasonality: 'none' | 'mild' | 'strong';
}

/**
 * Scan configuration
 */
export interface ScanConfig {
	maxSearchesPerCity: number;
	deepDiveThreshold: number;
	cacheExpiryDays: number;
	enableDeepDive: boolean;
	delayBetweenSearchesMs: number;
	detectGBPOpportunities: boolean;
}

// =============================================================================
// CONFIGURATION CONSTANTS
// =============================================================================

export const DEFAULT_SCAN_CONFIG: ScanConfig = {
	maxSearchesPerCity: 15,
	deepDiveThreshold: 7,
	cacheExpiryDays: 7,
	enableDeepDive: true,
	delayBetweenSearchesMs: 200,
	detectGBPOpportunities: true,
};

/**
 * Known aggregator domains to detect weak SERPs
 */
export const AGGREGATOR_DOMAINS = [
	'yelp.com',
	'angi.com',
	'thumbtack.com',
	'homeadvisor.com',
	'houzz.com',
	'bark.com',
	'porch.com',
	'networx.com',
	'homeservices.com',
	'angieslist.com',
	'taskrabbit.com',
	'handy.com',
	'homeserve.com',
	'servicemagic.com',
];

// =============================================================================
// TIER 1: CORE CATEGORIES (Always Scan)
// =============================================================================

/**
 * Tier 1 categories with validated lead economics
 * These have the best combination of urgency, margin, and competition
 */
export const TIER1_CATEGORIES: string[] = [
	'garage door repair',
	'appliance repair',
	'junk removal',
	'emergency plumber',
	'locksmith',
	'water damage restoration',
];

/**
 * Lead economics data for Tier 1 categories
 * Source: First Page Sage, LocaliQ, Service Direct, WebFX 2024-2025
 */
export const LEAD_ECONOMICS: Record<string, LeadEconomics> = {
	'garage door repair': {
		avgJobValue: { min: 200, max: 600 },
		providerPays: { min: 80, max: 120 },
		typicalCPL: { min: 25, max: 45 },
		urgency: 'high',
		competitionLevel: 'low',
		seasonality: 'none',
	},
	'appliance repair': {
		avgJobValue: { min: 150, max: 400 },
		providerPays: { min: 50, max: 100 },
		typicalCPL: { min: 30, max: 50 },
		urgency: 'high',
		competitionLevel: 'moderate',
		seasonality: 'none',
	},
	'junk removal': {
		avgJobValue: { min: 150, max: 400 },
		providerPays: { min: 40, max: 80 },
		typicalCPL: { min: 25, max: 40 },
		urgency: 'medium',
		competitionLevel: 'low',
		seasonality: 'mild',
	},
	'emergency plumber': {
		avgJobValue: { min: 200, max: 500 },
		providerPays: { min: 50, max: 100 },
		typicalCPL: { min: 40, max: 60 },
		urgency: 'extreme',
		competitionLevel: 'moderate',
		seasonality: 'none',
	},
	locksmith: {
		avgJobValue: { min: 100, max: 300 },
		providerPays: { min: 40, max: 80 },
		typicalCPL: { min: 20, max: 35 },
		urgency: 'extreme',
		competitionLevel: 'low',
		seasonality: 'none',
	},
	'water damage restoration': {
		avgJobValue: { min: 2000, max: 10000 },
		providerPays: { min: 100, max: 200 },
		typicalCPL: { min: 60, max: 100 },
		urgency: 'extreme',
		competitionLevel: 'moderate',
		seasonality: 'mild',
	},
	// Conditional categories (viable in low-competition markets)
	'hvac repair': {
		avgJobValue: { min: 300, max: 2500 },
		providerPays: { min: 75, max: 150 },
		typicalCPL: { min: 50, max: 150 }, // Wide range - market dependent
		urgency: 'high',
		competitionLevel: 'high', // Default assumption
		seasonality: 'strong',
	},
	'pest control': {
		avgJobValue: { min: 150, max: 500 },
		providerPays: { min: 30, max: 60 },
		typicalCPL: { min: 25, max: 40 },
		urgency: 'high',
		competitionLevel: 'low',
		seasonality: 'mild',
	},
	'vacation rental cleaning': {
		avgJobValue: { min: 100, max: 250 },
		providerPays: { min: 40, max: 80 },
		typicalCPL: { min: 30, max: 50 },
		urgency: 'high', // Turnover deadlines
		competitionLevel: 'low',
		seasonality: 'strong',
	},
};

// =============================================================================
// TIER 2: MARKET-CONDITIONAL CATEGORIES
// =============================================================================

export const TIER2_CONDITIONS: {
	condition: keyof CityProfile | 'always';
	categories: string[];
	trait: string;
}[] = [
	{
		condition: 'isCoastal',
		categories: ['vacation rental cleaning', 'boat detailing'],
		trait: 'Coastal',
	},
	{
		condition: 'isRetirement',
		categories: ['senior home care', 'estate cleanout'],
		trait: 'Retirement Community',
	},
	{
		condition: 'isHighIncome',
		categories: ['pool service'],
		trait: 'High Income',
	},
	{
		condition: 'isCollegeTown',
		categories: ['move out cleaning', 'moving service'],
		trait: 'College Town',
	},
	{
		condition: 'isTourism',
		categories: ['event catering'],
		trait: 'Tourism Hub',
	},
	// Universal Tier 2 - always scan
	{
		condition: 'always',
		categories: ['pest control'],
		trait: 'Universal',
	},
];

// =============================================================================
// TIER 3: DEEP DIVE EXPANSIONS
// =============================================================================

export const TIER3_EXPANSIONS: Record<string, string[]> = {
	'garage door repair': [
		'garage door opener repair',
		'garage door spring repair',
		'garage door installation',
		'garage door cable repair',
	],
	'appliance repair': [
		'refrigerator repair',
		'washer repair',
		'dryer repair',
		'dishwasher repair',
		'oven repair',
		'freezer repair',
	],
	'junk removal': [
		'furniture removal',
		'appliance hauling',
		'estate cleanout',
		'construction debris removal',
		'hoarding cleanup',
		'garage cleanout',
	],
	'emergency plumber': [
		'drain cleaning',
		'water heater repair',
		'leak repair',
		'sewer line repair',
		'toilet repair',
		'clogged drain',
	],
	'water damage restoration': [
		'flood cleanup',
		'mold remediation',
		'sewage cleanup',
		'basement flooding',
		'storm damage repair',
	],
	locksmith: [
		'car lockout',
		'house lockout',
		'lock rekey',
		'lock replacement',
		'emergency locksmith',
	],
	'hvac repair': [
		'ac repair',
		'furnace repair',
		'heating repair',
		'air conditioning repair',
		'hvac installation',
	],
	'pest control': [
		'bed bug treatment',
		'termite inspection',
		'rodent control',
		'wasp removal',
		'ant exterminator',
	],
	'vacation rental cleaning': [
		'airbnb cleaning',
		'vrbo cleaning',
		'turnover cleaning',
	],
	'senior home care': [
		'in home care',
		'elderly care',
		'companion care',
		'respite care',
	],
};

// =============================================================================
// CONDITIONAL CATEGORIES (Market-Signal Dependent)
// =============================================================================

/**
 * Categories that are viable ONLY when market signals indicate low competition.
 * These have high national CPL averages but can be goldmines in underserved markets.
 */
export const CONDITIONAL_CATEGORIES: Record<
	string,
	{
		defaultViable: boolean;
		overrideConditions: {
			noLSAs: boolean;
			maxPaidAds: number;
			maxAggregatorDominance: number;
			minLocalSpecialists: number;
		};
	}
> = {
	'hvac repair': {
		defaultViable: false, // Skip by default due to high national CPL
		overrideConditions: {
			noLSAs: true, // Must have no LSAs
			maxPaidAds: 1, // 0-1 paid ads max
			maxAggregatorDominance: 40, // Less than 40% aggregators
			minLocalSpecialists: 2, // At least 2 local specialists ranking
		},
	},
	roofing: {
		defaultViable: false,
		overrideConditions: {
			noLSAs: true,
			maxPaidAds: 0,
			maxAggregatorDominance: 30,
			minLocalSpecialists: 3,
		},
	},
	'house cleaning': {
		defaultViable: false, // Low urgency, app competition
		overrideConditions: {
			noLSAs: false, // LSAs okay for this category
			maxPaidAds: 2,
			maxAggregatorDominance: 50,
			minLocalSpecialists: 2,
		},
	},
};

// =============================================================================
// CORE FUNCTIONS
// =============================================================================

/**
 * Detect city profile from demographics data
 */
export function detectCityProfile(
	demographics: DemographicsData | null | undefined,
	lat?: number,
	lng?: number
): CityProfile {
	const profile: CityProfile = {
		isCollegeTown: false,
		isRetirement: false,
		isHighIncome: false,
		isCoastal: false,
		isTourism: false,
		traits: [],
		tier2Categories: [],
	};

	if (!demographics) {
		return profile;
	}

	// High income detection
	if (
		demographics.medianHouseholdIncome &&
		demographics.medianHouseholdIncome > 100000
	) {
		profile.isHighIncome = true;
		profile.traits.push('High Income');
	}

	// Coastal detection
	if (lat !== undefined && lng !== undefined) {
		const isEastCoast = lng > -82 && lng < -66 && lat > 24 && lat < 48;
		const isWestCoast = lng > -130 && lng < -117 && lat > 32 && lat < 49;
		const isGulfCoast = lng > -98 && lng < -80 && lat > 24 && lat < 32;

		if (isEastCoast || isWestCoast || isGulfCoast) {
			profile.isCoastal = true;
			profile.traits.push('Coastal');
		}
	}

	// Retirement community heuristic
	if (
		demographics.population &&
		demographics.homeownershipRate &&
		demographics.population > 20000 &&
		demographics.population < 100000 &&
		demographics.homeownershipRate > 70
	) {
		profile.isRetirement = true;
		profile.traits.push('Retirement Community');
	}

	// Compute Tier 2 categories
	for (const condition of TIER2_CONDITIONS) {
		if (
			condition.condition === 'always' ||
			profile[condition.condition as keyof CityProfile]
		) {
			profile.tier2Categories.push(...condition.categories);
		}
	}

	profile.tier2Categories = [...new Set(profile.tier2Categories)];

	return profile;
}

/**
 * Assess category viability based on market signals
 * This is the key function that implements market-specific logic
 */
export function assessCategoryViability(
	category: string,
	signals: MarketSignals
): CategoryViability {
	const normalizedCategory = category.toLowerCase();
	const economics = LEAD_ECONOMICS[normalizedCategory];
	const conditionalConfig = CONDITIONAL_CATEGORIES[normalizedCategory];

	// Default result structure
	const result: CategoryViability = {
		viable: true,
		confidence: 'medium',
		reason: '',
		opportunities: {
			leadGen: true,
			gbpServices: signals.gbpIssues.length > 0,
			websiteServices: signals.gbpIssues.some((i) =>
				i.issues.includes('missing_website')
			),
		},
		estimatedCPL: economics?.typicalCPL || { min: 30, max: 60 },
		providerLeadValue: economics?.providerPays || { min: 40, max: 80 },
	};

	// Check if this is a conditional category
	if (conditionalConfig) {
		const conditions = conditionalConfig.overrideConditions;

		// Check each override condition
		const passesLSA = !conditions.noLSAs || !signals.lsaPresent;
		const passesPaidAds = signals.paidAdCount <= conditions.maxPaidAds;
		const passesAggregator =
			signals.aggregatorDominance <= conditions.maxAggregatorDominance;
		const passesLocalSpecialists =
			signals.localSpecialistCount >= conditions.minLocalSpecialists;

		if (
			passesLSA &&
			passesPaidAds &&
			passesAggregator &&
			passesLocalSpecialists
		) {
			result.viable = true;
			result.confidence = 'high';
			result.reason = `Underserved market: No LSAs, ${signals.paidAdCount} paid ads, ${signals.localSpecialistCount} local specialists ranking`;

			// Adjust CPL estimate down for underserved markets
			result.estimatedCPL = {
				min: Math.round(result.estimatedCPL.min * 0.6),
				max: Math.round(result.estimatedCPL.max * 0.7),
			};
		} else {
			result.viable = conditionalConfig.defaultViable;
			result.confidence = 'low';
			result.reason = `Standard competitive market: ${signals.lsaPresent ? 'LSAs present' : ''} ${signals.paidAdCount} paid ads`;

			// Lead gen may not be viable, but services might be
			result.opportunities.leadGen = false;
		}
	} else {
		// Standard Tier 1 category
		if (signals.aggregatorDominance > 60) {
			result.confidence = 'high';
			result.reason = `Weak SERP: ${signals.aggregatorDominance}% aggregator dominance - easy to outrank`;
		} else if (signals.localSpecialistCount >= 3 && !signals.lsaPresent) {
			result.confidence = 'high';
			result.reason = `Provider-rich market with no LSAs - high demand, low ad competition`;
		} else {
			result.confidence = 'medium';
			result.reason = `Standard opportunity`;
		}
	}

	// GBP services opportunity assessment
	if (signals.gbpIssues.length >= 3) {
		result.opportunities.gbpServices = true;
		result.reason += ` | ${signals.gbpIssues.length} providers with GBP optimization opportunities`;
	}

	return result;
}

/**
 * Detect GBP optimization opportunities from SERP data
 * Returns providers who could benefit from your services
 */
export function detectGBPOpportunities(
	serpResults: Array<{
		businessName: string;
		hasWebsite: boolean;
		photoCount: number;
		reviewCount: number;
		hasHours: boolean;
		hasServices: boolean;
		phone?: string;
		position: number;
	}>
): GBPIssue[] {
	return serpResults
		.filter((r) => {
			// Only consider providers with some presence (not spam)
			return r.reviewCount > 5 || r.position <= 5;
		})
		.map((r) => {
			const issues: GBPIssue['issues'] = [];

			if (!r.hasWebsite) issues.push('missing_website');
			if (r.photoCount < 3) issues.push('missing_photos');
			if (!r.hasHours) issues.push('incomplete_hours');
			if (!r.hasServices) issues.push('no_services_listed');
			if (r.reviewCount < 20) issues.push('low_reviews');

			// Estimate revenue potential based on position and reviews
			let estimatedRevenue: GBPIssue['estimatedRevenue'] = 'low';
			if (r.position <= 3 && r.reviewCount > 50) {
				estimatedRevenue = 'high';
			} else if (r.position <= 5 || r.reviewCount > 20) {
				estimatedRevenue = 'medium';
			}

			return {
				businessName: r.businessName,
				issues,
				phone: r.phone,
				estimatedRevenue,
			};
		})
		.filter((r) => r.issues.length > 0); // Only return those with opportunities
}

/**
 * Get all categories to scan for a city
 */
export function getCategoriesToScan(
	profile: CityProfile,
	config: ScanConfig = DEFAULT_SCAN_CONFIG
): {
	tier1: string[];
	tier2: string[];
	conditional: string[];
	total: number;
} {
	const tier1 = [...TIER1_CATEGORIES];
	const tier2 = [...new Set(profile.tier2Categories)];
	const conditional = Object.keys(CONDITIONAL_CATEGORIES);

	const total = Math.min(
		tier1.length + tier2.length + conditional.length,
		config.maxSearchesPerCity
	);

	return {
		tier1: tier1.slice(0, Math.min(tier1.length, config.maxSearchesPerCity)),
		tier2: tier2.slice(
			0,
			Math.max(0, config.maxSearchesPerCity - tier1.length)
		),
		conditional: conditional.slice(
			0,
			Math.max(0, config.maxSearchesPerCity - tier1.length - tier2.length)
		),
		total,
	};
}

/**
 * Get Tier 3 expansion categories
 */
export function getTier3Categories(
	category: string,
	score: number,
	config: ScanConfig = DEFAULT_SCAN_CONFIG
): string[] {
	if (!config.enableDeepDive || score < config.deepDiveThreshold) {
		return [];
	}

	const normalizedCategory = category.toLowerCase();
	return TIER3_EXPANSIONS[normalizedCategory] || [];
}

/**
 * Check if a domain is a known aggregator
 */
export function isAggregatorDomain(domain: string): boolean {
	const normalized = domain.toLowerCase().replace(/^www\./, '');
	return AGGREGATOR_DOMAINS.some(
		(agg) => normalized === agg || normalized.endsWith(`.${agg}`)
	);
}

/**
 * Calculate aggregator dominance percentage from SERP results
 */
export function calculateAggregatorDominance(
	domains: string[],
	topN: number = 10
): number {
	const relevant = domains.slice(0, topN);
	const aggregatorCount = relevant.filter((d) => isAggregatorDomain(d)).length;
	return Math.round((aggregatorCount / relevant.length) * 100);
}

/**
 * Get the tier label for a category
 */
export function getCategoryTier(
	category: string,
	profile: CityProfile
): 'tier1' | 'tier2' | 'tier3' | 'conditional' {
	const normalized = category.toLowerCase();

	if (TIER1_CATEGORIES.includes(normalized)) {
		return 'tier1';
	}
	if (Object.keys(CONDITIONAL_CATEGORIES).includes(normalized)) {
		return 'conditional';
	}
	if (profile.tier2Categories.includes(normalized)) {
		return 'tier2';
	}
	return 'tier3';
}

/**
 * Get lead economics for a category
 */
export function getLeadEconomics(category: string): LeadEconomics | null {
	return LEAD_ECONOMICS[category.toLowerCase()] || null;
}

/**
 * Calculate expected margin for a category
 */
export function calculateExpectedMargin(
	category: string,
	estimatedCPL?: number
): { min: number; max: number; viable: boolean } {
	const economics = getLeadEconomics(category);
	if (!economics) {
		return { min: 0, max: 0, viable: false };
	}

	const cpl =
		estimatedCPL || (economics.typicalCPL.min + economics.typicalCPL.max) / 2;

	return {
		min: economics.providerPays.min - cpl,
		max: economics.providerPays.max - cpl,
		viable: economics.providerPays.min > cpl,
	};
}

// =============================================================================
// PROVIDER OUTREACH HELPERS
// =============================================================================

/**
 * Generate outreach priority list from GBP issues
 * Prioritizes providers with:
 * 1. Missing website (highest value service)
 * 2. High estimated revenue
 * 3. Multiple fixable issues
 */
export function prioritizeProviderOutreach(issues: GBPIssue[]): GBPIssue[] {
	return issues.sort((a, b) => {
		// Missing website is highest priority
		const aHasMissingWebsite = a.issues.includes('missing_website') ? 1 : 0;
		const bHasMissingWebsite = b.issues.includes('missing_website') ? 1 : 0;
		if (aHasMissingWebsite !== bHasMissingWebsite) {
			return bHasMissingWebsite - aHasMissingWebsite;
		}

		// Then by estimated revenue
		const revenueOrder = { high: 3, medium: 2, low: 1 };
		if (a.estimatedRevenue !== b.estimatedRevenue) {
			return (
				revenueOrder[b.estimatedRevenue] - revenueOrder[a.estimatedRevenue]
			);
		}

		// Then by number of issues (more issues = more services to sell)
		return b.issues.length - a.issues.length;
	});
}

/**
 * Estimate service value for a provider based on their issues
 */
export function estimateServiceValue(issues: GBPIssue): {
	oneTime: number;
	recurring: number;
	services: string[];
} {
	const services: string[] = [];
	let oneTime = 0;
	let recurring = 0;

	if (issues.issues.includes('missing_website')) {
		services.push('Website Creation');
		oneTime += 800; // $500-1500 range
	}

	if (
		issues.issues.includes('missing_photos') ||
		issues.issues.includes('incomplete_hours') ||
		issues.issues.includes('no_services_listed')
	) {
		services.push('GBP Optimization');
		oneTime += 300; // $200-500 range
	}

	if (issues.issues.includes('low_reviews')) {
		services.push('Review Management');
		recurring += 150; // $100-200/mo
	}

	// Always offer lead gen as upsell
	services.push('Lead Generation');
	recurring += 750; // $500-1000/mo average

	return { oneTime, recurring, services };
}
