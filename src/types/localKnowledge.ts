// Local Knowledge types for qualitative local context generation

/**
 * Content hooks for injection into generated content
 */
export interface ContentHooks {
	/** Phrases that signal local knowledge (5-10 items) */
	localPhrases: string[];
	/** Specific neighborhood/area names to reference (5-10 items) */
	neighborhoodNames: string[];
	/** Climate/weather references relevant to the category (3-5 items) */
	climateContext: string[];
	/** Common problems locals face with this service category (3-5 items) */
	categorySpecificIssues: string[];
}

/**
 * Market positioning context
 */
export interface MarketContext {
	/** Price position relative to nearby areas */
	pricePosition: string;
	/** Competition level description */
	competitionLevel: string;
	/** Seasonal busy/slow patterns */
	seasonalPatterns: string[];
}

/**
 * Regional identity for brand voice
 */
export interface RegionalIdentity {
	/** Larger region name (e.g., "Central Valley", "Bay Area") */
	region: string;
	/** One phrase characterization (e.g., "agricultural community") */
	characterization: string;
	/** Nearby reference (e.g., "45 minutes south of Fresno") */
	nearbyReference: string;
}

/**
 * Metadata about the generation
 */
export interface LocalKnowledgeMeta {
	city: string;
	state: string;
	category: string;
	/** Confidence score 0-100 based on data completeness */
	confidence: number;
	/** ISO timestamp of generation */
	generatedAt: string;
	/** Whether this result came from cache */
	cached: boolean;
}

/**
 * Complete output from local knowledge generation
 */
export interface LocalKnowledgeOutput {
	contentHooks: ContentHooks;
	marketContext: MarketContext;
	regionalIdentity: RegionalIdentity;
	meta: LocalKnowledgeMeta;
}

/**
 * Input for local knowledge generation
 */
export interface LocalKnowledgeInput {
	location: {
		city: string;
		county?: string;
		state: string;
		coordinates?: { lat: number; lng: number };
	};
	category: string;
}

/**
 * Progress tracking for generation
 */
export interface LocalKnowledgeProgress {
	status: 'idle' | 'checking-cache' | 'generating' | 'complete';
	message?: string;
}

/**
 * Create empty local knowledge output for error cases
 */
export function createEmptyLocalKnowledge(
	city: string,
	state: string,
	category: string,
	error?: string
): LocalKnowledgeOutput {
	return {
		contentHooks: {
			localPhrases: [],
			neighborhoodNames: [],
			climateContext: [],
			categorySpecificIssues: [],
		},
		marketContext: {
			pricePosition: '',
			competitionLevel: '',
			seasonalPatterns: [],
		},
		regionalIdentity: {
			region: '',
			characterization: '',
			nearbyReference: '',
		},
		meta: {
			city,
			state,
			category,
			confidence: 0,
			generatedAt: new Date().toISOString(),
			cached: false,
		},
	};
}
