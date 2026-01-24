// SEO Optimization Package types
// For comprehensive technical SEO: meta tags, schema markup, internal linking, and validation

import { SitePlannerOutput } from './sitePlanner';
import { GeneratedEditorialContent } from './editorialContent';
import { GeneratedComparisonData } from './comparisonPage';

// ============================================================================
// META TAG TYPES
// ============================================================================

export interface OpenGraphMeta {
	title: string;
	description: string;
	type: string; // 'website', 'article', 'profile'
	url: string;
	image?: string;
	siteName: string;
}

export interface TwitterMeta {
	card: string; // 'summary', 'summary_large_image'
	title: string;
	description: string;
	image?: string;
}

export interface GeoMeta {
	region: string; // 'US-CA'
	placename: string; // 'Los Angeles'
	position: string; // '34.0522;-118.2437'
}

export interface MetaTags {
	title: string;
	titleLength: number;
	description: string;
	descriptionLength: number;
	canonical: string;
	robots: string; // 'index, follow'
	openGraph: OpenGraphMeta;
	twitter: TwitterMeta;
	geo?: GeoMeta;
}

// ============================================================================
// SCHEMA MARKUP TYPES
// ============================================================================

export interface SchemaMarkup {
	type: string; // 'LocalBusiness', 'Article', 'FAQPage', etc.
	json: Record<string, unknown>;
	valid: boolean;
	errors?: string[];
}

export interface SchemaError {
	schemaType: string;
	property: string;
	message: string;
	severity: 'error' | 'warning';
}

// ============================================================================
// HEADING TYPES
// ============================================================================

export interface HeadingNode {
	level: number; // 1, 2, 3
	text: string;
	children?: HeadingNode[];
}

export interface HeadingStructure {
	h1: string;
	h2s: string[];
	h3s: string[];
	hierarchy: HeadingNode[];
	valid: boolean;
	issues?: string[];
}

// ============================================================================
// LINK TYPES
// ============================================================================

export interface InternalLink {
	targetUrl: string;
	targetPageId: string;
	anchorText: string;
	context: 'body' | 'sidebar' | 'footer' | 'nav';
	rel?: string;
}

export interface ExternalLink {
	url: string;
	anchorText: string;
	rel: string; // 'nofollow' or ''
}

export interface Breadcrumb {
	name: string;
	url: string;
}

// ============================================================================
// SEO ISSUE TYPES
// ============================================================================

export type SEOIssueSeverity = 'error' | 'warning' | 'info';

export interface SEOIssue {
	type: string; // 'title_too_long', 'missing_h1', etc.
	severity: SEOIssueSeverity;
	message: string;
	field?: string;
	value?: string | number;
	suggestion?: string;
}

export interface SEOWarning {
	type: string;
	message: string;
	affectedPages: string[];
}

// ============================================================================
// SITEMAP TYPES
// ============================================================================

export interface SitemapUrl {
	loc: string;
	lastmod: string;
	changefreq:
		| 'always'
		| 'hourly'
		| 'daily'
		| 'weekly'
		| 'monthly'
		| 'yearly'
		| 'never';
	priority: number; // 0.0 - 1.0
}

export interface SitemapData {
	xml: string;
	urls: SitemapUrl[];
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

export interface ValidationResult {
	valid: boolean;
	errors: string[];
	warnings: string[];
}

export interface PageValidation {
	allPagesHaveTitle: boolean;
	allPagesHaveDescription: boolean;
	allPagesHaveCanonical: boolean;
	allPagesHaveSchema: boolean;
	internalLinkCoverage: number; // Percentage 0-100
	orphanPages: string[];
	schemaErrors: SchemaError[];
	warnings: SEOWarning[];
}

// ============================================================================
// SEO OPTIMIZED PAGE
// ============================================================================

export interface SEOOptimizedPage {
	pageId: string;
	url: string;
	type: string; // 'homepage', 'provider_profile', 'service_hub', etc.

	meta: MetaTags;

	schema: SchemaMarkup[];

	headings: HeadingStructure;

	internalLinks: InternalLink[];

	externalLinks: ExternalLink[];

	breadcrumbs: Breadcrumb[];

	// Original content reference (unchanged)
	content: unknown;

	seoScore: number; // 0-100

	issues: SEOIssue[];

	suggestions: string[];
}

// ============================================================================
// SITE-WIDE SEO
// ============================================================================

export interface SiteWideSEO {
	organizationSchema: Record<string, unknown>;
	websiteSchema: Record<string, unknown>;
	sitemap: SitemapData;
	robotsTxt: string;
}

// ============================================================================
// SEO PACKAGE STATS
// ============================================================================

export interface SEOPackageStats {
	totalPages: number;
	totalInternalLinks: number;
	avgLinksPerPage: number;
	schemaTypesUsed: string[];
	pagesByType: Record<string, number>;
	avgSeoScore: number;
	issuesByType: Record<string, number>;
}

// ============================================================================
// MAIN OUTPUT STRUCTURE
// ============================================================================

export interface SEOOptimizedPackage {
	pages: SEOOptimizedPage[];

	siteWide: SiteWideSEO;

	validation: PageValidation;

	stats: SEOPackageStats;

	generatedAt: string;

	// Pass-through source data for downstream nodes (e.g., Code Generation)
	// This allows nodes that consume SEO package to access the original content
	// without requiring separate connections to Editorial/Comparison nodes
	sourceData?: {
		editorialContent: GeneratedEditorialContent | null;
		comparisonData: GeneratedComparisonData | null;
	};
}

// ============================================================================
// INPUT TYPES
// ============================================================================

export interface SEOOptimizationInput {
	blueprint: SitePlannerOutput;
	// Note: enrichedProviders are accessed via blueprint.providers (pass-through from site planner)
	editorialContent: GeneratedEditorialContent | null;
	comparisonData: GeneratedComparisonData | null;
}

export interface SEOOptimizationConfig {
	schemaValidation: boolean;
	linkDensityTarget: number; // Target links per page (e.g., 10)
}

// ============================================================================
// PROGRESS TRACKING
// ============================================================================

export type SEOOptimizationPhase =
	| 'preparing'
	| 'optimizing-meta'
	| 'generating-schema'
	| 'optimizing-links'
	| 'generating-sitemap'
	| 'validating'
	| 'complete';

export interface SEOOptimizationProgress {
	phase: SEOOptimizationPhase;
	currentPage: string | null;
	completedPages: number;
	totalPages: number;
	currentStep: string | null;
}

// ============================================================================
// VALIDATION RULES
// ============================================================================

export interface TitleValidationRules {
	minLength: number;
	maxLength: number;
	mustInclude: string[];
	mustNotInclude: string[];
}

export interface DescriptionValidationRules {
	minLength: number;
	maxLength: number;
	mustInclude: string[];
}

export interface H1ValidationRules {
	required: boolean;
	maxCount: number;
	mustInclude: string[];
}

export interface SchemaValidationRules {
	required: string[];
	providerRequired: string[];
	articleRequired: string[];
}

export interface LinkValidationRules {
	homepage: { min: number };
	service: { min: number };
	provider: { min: number };
	guide: { min: number };
	[key: string]: { min: number };
}

export interface SEOValidationRules {
	title: TitleValidationRules;
	description: DescriptionValidationRules;
	h1: H1ValidationRules;
	schema: SchemaValidationRules;
	internalLinks: LinkValidationRules;
}

export const DEFAULT_VALIDATION_RULES: SEOValidationRules = {
	title: {
		minLength: 30,
		maxLength: 60,
		mustInclude: ['keyword', 'location'],
		mustNotInclude: ['|', ' - ', 'best'],
	},
	description: {
		minLength: 120,
		maxLength: 160,
		mustInclude: ['keyword'],
	},
	h1: {
		required: true,
		maxCount: 1,
		mustInclude: ['keyword'],
	},
	schema: {
		required: ['BreadcrumbList'],
		providerRequired: ['LocalBusiness', 'AggregateRating'],
		articleRequired: ['Article', 'FAQPage'],
	},
	internalLinks: {
		homepage: { min: 20 },
		service: { min: 15 },
		service_hub: { min: 15 },
		provider: { min: 8 },
		provider_profile: { min: 8 },
		guide: { min: 10 },
		cost_guide: { min: 10 },
		comparison: { min: 12 },
		article: { min: 10 },
	},
};

// ============================================================================
// SITEMAP PRIORITY MAPPING
// ============================================================================

export const SITEMAP_PRIORITIES: Record<string, number> = {
	homepage: 1.0,
	service_hub: 0.9,
	comparison: 0.8,
	provider_profile: 0.7,
	provider_listing: 0.7,
	cost_guide: 0.6,
	guide: 0.6,
	troubleshooting: 0.6,
	buying_guide: 0.6,
	diy_guide: 0.5,
	about: 0.4,
	methodology: 0.4,
	contact: 0.4,
	legal: 0.3,
	privacy: 0.2,
	terms: 0.2,
};

export const SITEMAP_CHANGEFREQ: Record<string, SitemapUrl['changefreq']> = {
	homepage: 'weekly',
	service_hub: 'weekly',
	comparison: 'weekly',
	provider_profile: 'monthly',
	provider_listing: 'weekly',
	cost_guide: 'monthly',
	guide: 'monthly',
	troubleshooting: 'monthly',
	buying_guide: 'monthly',
	diy_guide: 'monthly',
	about: 'yearly',
	methodology: 'yearly',
	contact: 'yearly',
	legal: 'yearly',
	privacy: 'yearly',
	terms: 'yearly',
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function createEmptySEOPackage(): SEOOptimizedPackage {
	return {
		pages: [],
		siteWide: {
			organizationSchema: {},
			websiteSchema: {},
			sitemap: { xml: '', urls: [] },
			robotsTxt: '',
		},
		validation: {
			allPagesHaveTitle: false,
			allPagesHaveDescription: false,
			allPagesHaveCanonical: false,
			allPagesHaveSchema: false,
			internalLinkCoverage: 0,
			orphanPages: [],
			schemaErrors: [],
			warnings: [],
		},
		stats: {
			totalPages: 0,
			totalInternalLinks: 0,
			avgLinksPerPage: 0,
			schemaTypesUsed: [],
			pagesByType: {},
			avgSeoScore: 0,
			issuesByType: {},
		},
		generatedAt: new Date().toISOString(),
	};
}

export function createEmptyProgress(): SEOOptimizationProgress {
	return {
		phase: 'preparing',
		currentPage: null,
		completedPages: 0,
		totalPages: 0,
		currentStep: null,
	};
}

export function calculateSEOScore(page: SEOOptimizedPage): number {
	let score = 100;

	// Deduct for issues
	for (const issue of page.issues) {
		if (issue.severity === 'error') {
			score -= 15;
		} else if (issue.severity === 'warning') {
			score -= 5;
		} else {
			score -= 2;
		}
	}

	// Bonus for good practices
	if (page.meta.titleLength >= 30 && page.meta.titleLength <= 60) {
		score += 5;
	}
	if (
		page.meta.descriptionLength >= 120 &&
		page.meta.descriptionLength <= 160
	) {
		score += 5;
	}
	if (page.schema.length >= 2) {
		score += 5;
	}
	if (page.internalLinks.length >= 5) {
		score += 5;
	}

	return Math.max(0, Math.min(100, score));
}

export function getSeverityColor(severity: SEOIssueSeverity): string {
	switch (severity) {
		case 'error':
			return 'red';
		case 'warning':
			return 'amber';
		case 'info':
			return 'blue';
	}
}
