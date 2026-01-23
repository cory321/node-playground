// Site Planner Templates - E-E-A-T and Unique Value requirements by page type
// Based on the Site Planner Golden Prompt specification

import {
	PageType,
	EEATRequirements,
	UniqueValueRequirements,
} from '@/types/sitePlanner';

// ============================================================================
// E-E-A-T TEMPLATES BY PAGE TYPE
// These templates define what Experience, Expertise, Authoritativeness, and
// Trustworthiness signals each page type must include.
// ============================================================================

export const EEAT_TEMPLATES: Record<PageType, EEATRequirements> = {
	homepage: {
		experienceSignals: [
			'Founder story with local connection',
			'Years serving this area',
		],
		expertiseSignals: ['Knowledge of local conditions affecting services'],
		authoritySignals: [
			'Total verified reviews across network',
			'Number of vetted providers',
		],
		trustSignals: ['Clear contact info', 'Link to methodology page'],
	},
	about: {
		experienceSignals: [
			'Team bios with relevant background',
			'Why we started this narrative',
		],
		expertiseSignals: ['Industry knowledge demonstrated'],
		authoritySignals: ['Industry affiliations', 'Local business partnerships'],
		trustSignals: ['Real team photos', 'Verifiable company history'],
	},
	methodology: {
		experienceSignals: [
			'Specific examples of providers rejected and why',
			'Real vetting process stories',
		],
		expertiseSignals: [
			'Industry standards referenced',
			'Technical criteria explained',
		],
		authoritySignals: [
			'Third-party verification partnerships',
			'Standards we follow',
		],
		trustSignals: ['Transparent criteria', 'Rejection rate disclosed'],
	},
	contact: {
		experienceSignals: ['Local presence indicated'],
		expertiseSignals: ['Professional communication channels'],
		authoritySignals: ['Established business address'],
		trustSignals: ['Multiple contact methods', 'Response time expectations'],
	},
	legal: {
		experienceSignals: [],
		expertiseSignals: ['Proper legal language'],
		authoritySignals: ['Attorney reviewed (if applicable)'],
		trustSignals: ['Clear disclosure of business model', 'FTC compliance'],
	},
	service_hub: {
		experienceSignals: ['Service experience stories', 'Common project examples'],
		expertiseSignals: ['Industry terminology used correctly', 'Technical accuracy'],
		authoritySignals: ['Comprehensive coverage of service types'],
		trustSignals: ['Balanced presentation', 'Link to methodology'],
	},
	service_detail: {
		experienceSignals: ['Detailed process knowledge', 'Real scenario descriptions'],
		expertiseSignals: ['Technical specifications', 'Industry best practices'],
		authoritySignals: ['Referenced standards and codes'],
		trustSignals: ['Honest about limitations', 'When to seek alternatives'],
	},
	city_service: {
		experienceSignals: [
			'Common local problems specific to housing age and climate',
			'Real repair scenarios from local homes',
		],
		expertiseSignals: [
			'Local codes and permit requirements',
			'Climate-specific considerations',
		],
		authoritySignals: [
			'Number of local providers in network',
			'Total area reviews',
		],
		trustSignals: [
			'Verified license numbers displayed',
			'Insurance confirmation',
		],
	},
	provider_listing: {
		experienceSignals: ['Personal vetting experience shared'],
		expertiseSignals: ['Clear criteria for inclusion explained'],
		authoritySignals: ['Rejection rate disclosed', 'Selection process'],
		trustSignals: ['Disclaimer: Rankings based on our criteria'],
	},
	provider_profile: {
		experienceSignals: ['Real project photos', 'Verified customer testimonials'],
		expertiseSignals: ['Explanation of credentials and what they mean'],
		authoritySignals: ['Years in business', 'Service area coverage'],
		trustSignals: ['License numbers displayed', 'Insurance confirmation'],
	},
	comparison: {
		experienceSignals: ['Hands-on evaluation described'],
		expertiseSignals: ['Objective comparison methodology'],
		authoritySignals: ['Clear criteria for comparison'],
		trustSignals: ['Disclaimer about methodology', 'Not pay-to-play rankings'],
	},
	cost_guide: {
		experienceSignals: [
			'Actual quotes gathered from local providers',
			'Real project cost examples',
		],
		expertiseSignals: [
			'Breakdown of labor vs materials',
			'Understanding of pricing factors',
		],
		authoritySignals: ['Local market data referenced', 'Multiple sources cited'],
		trustSignals: ['Disclaimer: Prices are estimates', 'Get actual quotes advised'],
	},
	troubleshooting: {
		experienceSignals: [
			'Step-by-step from someone who has done this work',
			'Real problem scenarios',
		],
		expertiseSignals: ['Safety warnings where appropriate', 'When to call a pro'],
		authoritySignals: ['Referenced manufacturer guidelines'],
		trustSignals: ['Honest about DIY limitations', 'Professional advice emphasized'],
	},
};

// ============================================================================
// UNIQUE VALUE TEMPLATES BY PAGE TYPE
// These templates define the anti-thin content requirements that ensure each
// page provides genuine value beyond what aggregators offer.
// ============================================================================

export const UNIQUE_VALUE_TEMPLATES: Record<PageType, UniqueValueRequirements> = {
	homepage: {
		dataPointsMin: 5,
		requiresOriginalAnalysis: false,
		differentiatorVsAggregators:
			'Clear value prop vs Thumbtack/Yelp - personally vetted local pros',
	},
	about: {
		dataPointsMin: 4,
		requiresOriginalAnalysis: false,
		differentiatorVsAggregators: 'Real team, real local story, not anonymous platform',
	},
	methodology: {
		dataPointsMin: 8,
		requiresOriginalAnalysis: true,
		differentiatorVsAggregators: 'Transparent vetting process vs black box rankings',
	},
	contact: {
		dataPointsMin: 2,
		requiresOriginalAnalysis: false,
		differentiatorVsAggregators: 'Direct human contact vs automated forms',
	},
	legal: {
		dataPointsMin: 0,
		requiresOriginalAnalysis: false,
		differentiatorVsAggregators: 'Clear business model disclosure',
	},
	service_hub: {
		dataPointsMin: 6,
		requiresOriginalAnalysis: false,
		differentiatorVsAggregators: 'Comprehensive local service coverage',
	},
	service_detail: {
		dataPointsMin: 6,
		requiresOriginalAnalysis: true,
		differentiatorVsAggregators: 'Deep expertise vs generic descriptions',
	},
	city_service: {
		dataPointsMin: 8,
		requiresOriginalAnalysis: true,
		differentiatorVsAggregators:
			'City-specific problems and solutions vs generic national content',
	},
	provider_listing: {
		dataPointsMin: 5,
		requiresOriginalAnalysis: false,
		differentiatorVsAggregators: 'Curated vetted list vs anyone-can-list model',
	},
	provider_profile: {
		dataPointsMin: 6,
		requiresOriginalAnalysis: false,
		differentiatorVsAggregators:
			'Deeper than Yelp - credentials, service area map, verified info',
	},
	comparison: {
		dataPointsMin: 10,
		requiresOriginalAnalysis: true,
		differentiatorVsAggregators: 'Objective criteria vs pay-to-play rankings',
	},
	cost_guide: {
		dataPointsMin: 12,
		requiresOriginalAnalysis: true,
		differentiatorVsAggregators: 'Local pricing data vs national averages',
	},
	troubleshooting: {
		dataPointsMin: 8,
		requiresOriginalAnalysis: true,
		differentiatorVsAggregators: 'Practical local steps vs generic advice',
	},
};

// ============================================================================
// TROUBLESHOOTING TOPICS BY CATEGORY
// These are common troubleshooting topics that help capture informational
// queries and establish authority in the niche.
// ============================================================================

export function getTroubleshootingTopics(category: string): string[] {
	const categoryLower = category.toLowerCase();

	if (categoryLower.includes('garage door')) {
		return [
			"Garage Door Won't Open",
			'Garage Door Makes Grinding Noise',
			'Garage Door Remote Not Working',
			'Garage Door Opens Partially Then Stops',
			'Garage Door Spring Replacement Signs',
			'Garage Door Off Track Fix',
			'Garage Door Opener Troubleshooting',
			'Garage Door Weather Seal Replacement',
		];
	}

	if (categoryLower.includes('hvac') || categoryLower.includes('air condition')) {
		return [
			'AC Not Cooling Properly',
			'HVAC Making Strange Noises',
			'Thermostat Not Working',
			'Air Conditioner Freezing Up',
			"Furnace Won't Turn On",
			'Uneven Heating or Cooling',
			'High Energy Bills Troubleshooting',
			'HVAC Maintenance Checklist',
		];
	}

	if (categoryLower.includes('plumb')) {
		return [
			'Clogged Drain Solutions',
			'Low Water Pressure Causes',
			'Leaky Faucet Repair',
			'Running Toilet Fix',
			'Water Heater Not Heating',
			'Frozen Pipe Prevention',
			'Garbage Disposal Not Working',
			'Sewer Line Warning Signs',
		];
	}

	if (categoryLower.includes('roof')) {
		return [
			'Signs You Need a New Roof',
			'Roof Leak Detection',
			'Missing Shingles Repair',
			'Ice Dam Prevention',
			'Gutter Maintenance Guide',
			'Storm Damage Assessment',
			'Attic Ventilation Problems',
			'Roof Inspection Checklist',
		];
	}

	if (categoryLower.includes('electric')) {
		return [
			'Tripped Circuit Breaker',
			'Flickering Lights Causes',
			'Outlet Not Working',
			'GFCI Keeps Tripping',
			'Electrical Panel Upgrade Signs',
			'Light Switch Replacement',
			'Power Surge Protection',
			'When to Call an Electrician',
		];
	}

	// Generic topics for any category
	return [
		`Common ${category} Problems`,
		`When to Call a ${category} Professional`,
		`${category} Maintenance Tips`,
		`DIY ${category} Safety Guide`,
		`${category} Emergency Response`,
		`Seasonal ${category} Checklist`,
		`Choosing the Right ${category} Provider`,
		`${category} Warning Signs`,
	];
}

// ============================================================================
// REVIEW REQUIREMENTS BY PAGE TYPE
// Default review integration requirements for each page type
// ============================================================================

export const REVIEW_REQUIREMENTS: Partial<
	Record<
		PageType,
		{
			required: boolean;
			minimumCount: number;
			sources: string[];
		}
	>
> = {
	homepage: {
		required: true,
		minimumCount: 3,
		sources: ['google', 'direct'],
	},
	provider_listing: {
		required: true,
		minimumCount: 1, // Per provider
		sources: ['google'],
	},
	provider_profile: {
		required: true,
		minimumCount: 3,
		sources: ['google', 'direct'],
	},
	city_service: {
		required: true,
		minimumCount: 2,
		sources: ['google'],
	},
	comparison: {
		required: true,
		minimumCount: 1, // Per provider
		sources: ['google'],
	},
};

// ============================================================================
// SEO TITLE TEMPLATES BY PAGE TYPE
// Default title patterns for each page type
// ============================================================================

export const SEO_TITLE_TEMPLATES: Record<PageType, string> = {
	homepage: '[Brand] | Trusted Local [Category]',
	about: 'About [Brand] | Our Story',
	methodology: 'How We Vet [Category] Providers | Our Process',
	contact: 'Contact Us | [Brand]',
	legal: '[Legal Type]',
	service_hub: '[Category] Services in [Location] Area',
	service_detail: '[Service] | [Location] [Category]',
	city_service: '[Category] in [City], [State]',
	provider_listing: 'Top Verified Providers in [City], [State]',
	provider_profile: '[Provider Name] | Verified Provider',
	comparison: 'Compare [City] Providers | Side-by-Side',
	cost_guide: '[Category] Cost Guide | [Location] Pricing',
	troubleshooting: '[Topic] | [Brand]',
};
