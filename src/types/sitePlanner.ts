// Site Planner types for generating site blueprints
// Based on the Site Planner Golden Prompt specification

import { LocationData } from './nodes';
import { EnrichedProvider } from './enrichedProvider';
import { LocalKnowledgeOutput } from './localKnowledge';

// ============================================================================
// PAGE TYPES
// ============================================================================

export type PageType =
	| 'homepage'
	| 'service_hub'
	| 'service_detail'
	| 'city_service'
	| 'provider_listing'
	| 'provider_profile'
	| 'comparison'
	| 'cost_guide'
	| 'troubleshooting'
	| 'about'
	| 'methodology'
	| 'contact'
	| 'legal';

// ============================================================================
// BRAND IDENTITY
// ============================================================================

export interface VoiceTone {
	personality: string[]; // ["helpful", "local", "straightforward"]
	dos: string[]; // ["Use neighborhood names", "Be specific"]
	donts: string[]; // ["No hype", "No fake urgency"]
}

export interface BrandIdentity {
	name: string; // "Phoenix Garage Door Guide"
	tagline: string; // "Your trusted local resource"
	domain: string; // "phoenixgaragedoorguide.com"
	voiceTone: VoiceTone;
}

// ============================================================================
// E-E-A-T REQUIREMENTS
// ============================================================================

export interface EEATRequirements {
	experienceSignals: string[]; // First-hand knowledge indicators
	expertiseSignals: string[]; // Subject matter knowledge
	authoritySignals: string[]; // Recognition by others
	trustSignals: string[]; // Reliability and transparency
}

// ============================================================================
// UNIQUE VALUE REQUIREMENTS (Anti-Thin Content)
// ============================================================================

export interface UniqueValueRequirements {
	dataPointsMin: number; // Minimum unique facts/stats
	requiresOriginalAnalysis: boolean;
	differentiatorVsAggregators: string; // What makes this better than Yelp/Thumbtack
}

// ============================================================================
// PAGE CONTENT REQUIREMENTS
// ============================================================================

export interface PageContent {
	purpose: string; // "Help homeowners find repair services"
	targetWordCount: number; // 1500
	requiredSections: string[]; // ["Service overview", "Pricing", "FAQ"]
	localMentionsMin: number; // 5
	eeat: EEATRequirements;
	uniqueValue: UniqueValueRequirements;
}

// ============================================================================
// REVIEW REQUIREMENTS
// ============================================================================

export interface ReviewRequirements {
	required: boolean;
	minimumCount: number;
	sources: string[]; // ["google", "yelp", "direct"]
}

// ============================================================================
// PAGE DATA REQUIREMENTS
// ============================================================================

export interface PageDataRequirements {
	providers?: string[]; // Provider IDs to feature
	services?: string[]; // Service types to cover
	city?: string; // City for local content
}

// ============================================================================
// INTERNAL LINK REQUIREMENT
// ============================================================================

export interface InternalLinkRequirement {
	toPageId: string; // "provider-listing-phoenix"
	anchorPattern: string; // "view all Phoenix providers"
}

// ============================================================================
// SEO CONFIGURATION
// ============================================================================

export interface PageSEO {
	titleTemplate: string; // "[City] Garage Door Repair | [Brand]"
	descriptionTemplate: string; // "Find trusted garage door repair..."
	primaryKeyword: string; // "phoenix garage door repair"
	secondaryKeywords: string[]; // ["garage door service phoenix", ...]
}

// ============================================================================
// PAGE BRIEF (Core Deliverable)
// ============================================================================

export interface PageBrief {
	id: string; // "city-phoenix-garage-door-repair"
	type: PageType;
	url: string; // "/phoenix/garage-door-repair"
	priority: 1 | 2 | 3; // Launch phase priority

	// SEO targets
	seo: PageSEO;

	// Content requirements
	content: PageContent;

	// Review integration
	reviews?: ReviewRequirements;

	// Data this page needs
	data: PageDataRequirements;

	// Linking requirements
	internalLinks: {
		required: InternalLinkRequirement[];
	};

	// Schema types to generate
	schema: string[]; // ["LocalBusiness", "FAQPage"]
}

// ============================================================================
// CONTENT CLUSTERS
// ============================================================================

export interface ContentCluster {
	name: string; // "Garage Door Repair"
	pillarPageId: string; // "service-garage-door-repair"
	supportingPageIds: string[]; // Related pages
}

// ============================================================================
// INTERNAL LINKING RULES
// ============================================================================

export interface InternalLinkingRule {
	fromType: PageType;
	toType: PageType;
	anchorPattern: string; // "top providers in [City]"
	required: boolean;
}

export interface InternalLinkingRules {
	rules: InternalLinkingRule[];
}

// ============================================================================
// LAUNCH PHASES
// ============================================================================

export interface LaunchPhase {
	phase: 1 | 2 | 3;
	name: string; // "Foundation", "Core Pages", "Authority"
	pageIds: string[];
}

// ============================================================================
// SITE STRUCTURE
// ============================================================================

export interface SiteStructure {
	baseUrl: string; // "https://phoenixgaragedoorguide.com"
	urlPatterns: Record<PageType, string>; // Templates for each page type
}

// ============================================================================
// SITE PLANNER OUTPUT (Complete Deliverable)
// ============================================================================

export interface SitePlannerOutput {
	// 1. Brand Identity
	brand: BrandIdentity;

	// 2. Site Structure
	structure: SiteStructure;

	// 3. Page Inventory (Core deliverable)
	pages: PageBrief[];

	// 4. Content Organization
	contentClusters: ContentCluster[];

	// 5. Internal Linking Rules
	internalLinking: InternalLinkingRules;

	// 6. Build Order
	launchPhases: LaunchPhase[];

	// Metadata
	meta: {
		generatedAt: string;
		depth: SiteDepth;
		pageCount: number;
		city: string;
		state: string;
		category: string;
	};
}

// ============================================================================
// CONFIGURATION
// ============================================================================

export type SiteDepth = 'mvp' | 'standard' | 'comprehensive';

export type CompetitionLevel = 'low' | 'medium' | 'high';

// ============================================================================
// INPUT AGGREGATION (from upstream nodes)
// ============================================================================

export interface SitePlannerInput {
	location: LocationData;
	serp: {
		serpQuality: 'Weak' | 'Medium' | 'Strong';
		serpScore: number;
		category: string;
	};
	providers: EnrichedProvider[];
	localKnowledge: LocalKnowledgeOutput;
}

// ============================================================================
// BRAND GENERATION (LLM-powered)
// ============================================================================

export interface BrandGenerationRequest {
	city: string;
	state: string;
	category: string;
	competition: CompetitionLevel;
	regionalCharacter?: string; // From local knowledge
}

export interface BrandGenerationResponse {
	brand: BrandIdentity;
	confidence: number;
	generatedAt: string;
}

// ============================================================================
// URL PATTERNS (Constants)
// ============================================================================

export const URL_PATTERNS: Record<PageType, string> = {
	homepage: '/',
	about: '/about',
	methodology: '/how-we-vet-providers',
	contact: '/contact',
	legal: '/[legal-type]', // privacy, terms, disclosure
	service_hub: '/[service-slug]',
	service_detail: '/[service-slug]/[detail-slug]',
	city_service: '/[city]/[service-slug]',
	provider_listing: '/[city]/providers',
	provider_profile: '/providers/[provider-slug]',
	comparison: '/[city]/compare-providers',
	cost_guide: '/[service-slug]/cost-guide',
	troubleshooting: '/guides/[topic-slug]',
};

// ============================================================================
// PAGE TEMPLATES (Content Requirements by Type)
// ============================================================================

export const PAGE_TEMPLATES: Record<
	PageType,
	{
		targetWordCount: number;
		localMentionsMin: number;
		requiredSections: string[];
		schemaTypes: string[];
	}
> = {
	homepage: {
		targetWordCount: 1500,
		localMentionsMin: 8,
		requiredSections: [
			'Hero with clear value proposition',
			'Service categories overview',
			'Service area with specific cities',
			'Trust indicators (reviews, years, providers)',
			'Featured providers preview',
			'Why choose us vs aggregators',
		],
		schemaTypes: ['WebSite', 'LocalBusiness', 'Organization'],
	},
	about: {
		targetWordCount: 800,
		localMentionsMin: 5,
		requiredSections: [
			'Team story',
			'Mission statement',
			'Local connection',
			'Why we started',
		],
		schemaTypes: ['AboutPage', 'Organization'],
	},
	methodology: {
		targetWordCount: 1200,
		localMentionsMin: 5,
		requiredSections: [
			'Our vetting criteria',
			'License and insurance verification',
			'Background check process',
			'Review verification',
			'Why we reject some providers',
			'Ongoing monitoring',
			'Our local expertise',
		],
		schemaTypes: ['Article'],
	},
	contact: {
		targetWordCount: 300,
		localMentionsMin: 2,
		requiredSections: ['Contact form', 'Phone number', 'Hours of operation'],
		schemaTypes: ['ContactPage'],
	},
	legal: {
		targetWordCount: 500,
		localMentionsMin: 0,
		requiredSections: ['Standard legal requirements'],
		schemaTypes: [],
	},
	service_hub: {
		targetWordCount: 2000,
		localMentionsMin: 8,
		requiredSections: [
			'Service overview',
			'Types of services offered',
			'Why this service matters',
			'How to choose a provider',
			'Service areas covered',
			'FAQ',
		],
		schemaTypes: ['Service', 'FAQPage'],
	},
	service_detail: {
		targetWordCount: 1200,
		localMentionsMin: 5,
		requiredSections: [
			'Detailed service description',
			'Process overview',
			'Pricing factors',
			'FAQ',
		],
		schemaTypes: ['Service', 'FAQPage'],
	},
	city_service: {
		targetWordCount: 1500,
		localMentionsMin: 10,
		requiredSections: [
			'Service overview for this area',
			'Common problems in [city]',
			'Cost factors and typical pricing',
			'How to choose a provider',
			'Featured local providers',
			'FAQ specific to area',
		],
		schemaTypes: ['Service', 'LocalBusiness', 'FAQPage'],
	},
	provider_listing: {
		targetWordCount: 1000,
		localMentionsMin: 5,
		requiredSections: [
			'Provider list with ratings',
			'Filtering/sorting options',
			'Selection criteria explanation',
			'Disclaimer about rankings',
		],
		schemaTypes: ['ItemList', 'LocalBusiness'],
	},
	provider_profile: {
		targetWordCount: 800,
		localMentionsMin: 3,
		requiredSections: [
			'Provider overview',
			'Services offered',
			'Service area',
			'Credentials and certifications',
			'Customer reviews',
			'Contact information',
		],
		schemaTypes: ['LocalBusiness', 'AggregateRating', 'Review'],
	},
	comparison: {
		targetWordCount: 1200,
		localMentionsMin: 5,
		requiredSections: [
			'Comparison criteria',
			'Side-by-side comparison table',
			'Detailed analysis per provider',
			'Disclaimer about methodology',
		],
		schemaTypes: ['Article', 'ItemList'],
	},
	cost_guide: {
		targetWordCount: 1500,
		localMentionsMin: 5,
		requiredSections: [
			'Typical price ranges',
			'Factors that affect cost',
			'Cost by project type',
			'Questions for accurate quotes',
			'Red flags in pricing',
			'When to spend more vs save',
		],
		schemaTypes: ['Article', 'FAQPage'],
	},
	troubleshooting: {
		targetWordCount: 1000,
		localMentionsMin: 3,
		requiredSections: [
			'Problem description',
			'Step-by-step diagnosis',
			'DIY solutions (if safe)',
			'When to call a professional',
			'Safety warnings',
		],
		schemaTypes: ['HowTo', 'Article', 'FAQPage'],
	},
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create a URL-friendly slug from text
 */
export function slugify(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

/**
 * Generate a page ID from type and identifiers
 */
export function generatePageId(
	type: PageType,
	...identifiers: string[]
): string {
	return [type, ...identifiers.map(slugify)].join('-');
}

/**
 * Create an empty site plan for initialization
 */
export function createEmptySitePlan(
	city: string,
	state: string,
	category: string,
	depth: SiteDepth
): SitePlannerOutput {
	return {
		brand: {
			name: '',
			tagline: '',
			domain: '',
			voiceTone: {
				personality: [],
				dos: [],
				donts: [],
			},
		},
		structure: {
			baseUrl: '',
			urlPatterns: URL_PATTERNS,
		},
		pages: [],
		contentClusters: [],
		internalLinking: { rules: [] },
		launchPhases: [],
		meta: {
			generatedAt: new Date().toISOString(),
			depth,
			pageCount: 0,
			city,
			state,
			category,
		},
	};
}
