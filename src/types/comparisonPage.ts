// Comparison & Data Page types for generating comparison tables, pricing pages, and market statistics

import { EnrichedProvider } from './enrichedProvider';
import { LocalKnowledgeOutput } from './localKnowledge';
import { SitePlannerOutput } from './sitePlanner';

// ============================================================================
// COMPARISON TABLE TYPES
// ============================================================================

export type ComparisonColumnType = 'text' | 'number' | 'rating' | 'badge';

export interface ComparisonColumn {
	key: string;
	label: string;
	sortable: boolean;
	type: ComparisonColumnType;
}

export interface ComparisonTableRow {
	providerId: string;
	values: Record<string, string | number | boolean | null>;
	featured: boolean;
}

export interface ComparisonTable {
	columns: ComparisonColumn[];
	rows: ComparisonTableRow[];
	defaultSort: {
		column: string;
		direction: 'asc' | 'desc';
	};
}

// Standard columns for comparison tables
export const STANDARD_COMPARISON_COLUMNS: ComparisonColumn[] = [
	{ key: 'name', label: 'Company', sortable: true, type: 'text' },
	{ key: 'trustScore', label: 'Trust Score', sortable: true, type: 'number' },
	{ key: 'rating', label: 'Rating', sortable: true, type: 'rating' },
	{ key: 'reviewCount', label: 'Reviews', sortable: true, type: 'number' },
	{
		key: 'yearsInBusiness',
		label: 'Experience',
		sortable: true,
		type: 'text',
	},
	{ key: 'priceRange', label: 'Price', sortable: false, type: 'text' },
	{ key: 'licenseStatus', label: 'Licensed', sortable: false, type: 'badge' },
	{ key: 'emergency', label: '24/7', sortable: false, type: 'badge' },
];

// ============================================================================
// WINNER TYPES
// ============================================================================

export type WinnerCategory =
	| 'Best Overall'
	| 'Best Value'
	| 'Most Experienced'
	| 'Best for Emergency'
	| 'Most Reviewed';

export interface Winner {
	category: WinnerCategory;
	providerId: string;
	providerName: string;
	reason: string; // 2-3 sentences explaining the designation
	badge: string; // Icon/badge identifier
}

// ============================================================================
// DETAILED COMPARISON TYPES
// ============================================================================

export type ComparisonChartType = 'bar' | 'table';

export interface DetailedComparison {
	aspect: string; // "Pricing", "Reviews", "Services"
	analysis: string; // 150-200 words
	chartType?: ComparisonChartType;
	chartData?: Record<string, unknown>;
}

// ============================================================================
// INTERNAL LINK TYPES
// ============================================================================

export interface InternalLink {
	text: string;
	url: string;
	context: string; // Surrounding text or placement hint
}

// ============================================================================
// FAQ TYPES
// ============================================================================

export interface FAQItem {
	question: string;
	answer: string;
}

// ============================================================================
// SEO TYPES
// ============================================================================

export interface ComparisonPageSEO {
	title: string; // "Best Garage Door Companies in Tulare (2026)"
	metaDescription: string;
	focusKeyword: string;
}

export interface PricingPageSEO {
	title: string;
	metaDescription: string;
}

// ============================================================================
// SCHEMA MARKUP TYPES
// ============================================================================

export interface ItemListSchema {
	'@context': string;
	'@type': 'ItemList';
	name: string;
	description: string;
	numberOfItems: number;
	itemListElement: Array<{
		'@type': 'ListItem';
		position: number;
		item: {
			'@type': 'LocalBusiness';
			name: string;
			aggregateRating?: {
				'@type': 'AggregateRating';
				ratingValue: number;
				reviewCount: number;
			};
		};
	}>;
}

export interface FAQPageSchema {
	'@context': string;
	'@type': 'FAQPage';
	mainEntity: Array<{
		'@type': 'Question';
		name: string;
		acceptedAnswer: {
			'@type': 'Answer';
			text: string;
		};
	}>;
}

export interface BreadcrumbListSchema {
	'@context': string;
	'@type': 'BreadcrumbList';
	itemListElement: Array<{
		'@type': 'ListItem';
		position: number;
		name: string;
		item?: string;
	}>;
}

export interface ComparisonPageSchema {
	itemList: ItemListSchema;
	faqPage: FAQPageSchema;
	breadcrumbList: BreadcrumbListSchema;
}

// ============================================================================
// COMPARISON PAGE CONTENT
// ============================================================================

export interface ComparisonPageContent {
	headline: string;
	introduction: string; // 100-150 words
	lastUpdated: string;
	methodology: string; // Brief explanation
	comparisonTable: ComparisonTable;
	winners: Winner[];
	detailedComparisons: DetailedComparison[];
	howWeCompared: string; // Methodology section, 200-300 words
	faq: FAQItem[];
}

// ============================================================================
// COMPARISON PAGE
// ============================================================================

export interface ComparisonPage {
	pageId: string;
	city: string;
	url: string;
	seo: ComparisonPageSEO;
	content: ComparisonPageContent;
	schema: ComparisonPageSchema;
	internalLinks: InternalLink[];
}

// ============================================================================
// PRICING PAGE TYPES
// ============================================================================

export interface QuickAnswerPricing {
	averageCost: string;
	range: {
		low: string;
		high: string;
	};
	disclaimer: string;
}

export interface PriceTableRow {
	service: string;
	lowPrice: string;
	highPrice: string;
	average: string;
	notes: string;
}

export interface PriceTable {
	columns: string[];
	rows: PriceTableRow[];
}

export interface CityPriceComparison {
	city: string;
	averagePrice: string;
	vsRegionalAvg: string; // "+15%", "-10%"
	notes: string;
}

export interface CostFactor {
	factor: string;
	impact: string;
	explanation: string;
}

export interface RealPriceExample {
	description: string;
	price: string;
	city: string;
	date: string;
}

export interface PricingPageContent {
	headline: string;
	quickAnswer: QuickAnswerPricing;
	priceTable: PriceTable;
	cityComparison: CityPriceComparison[];
	costFactors: CostFactor[];
	realExamples: RealPriceExample[];
	savingTips: string[];
	redFlags: string[];
	methodology: string;
}

export interface PricingPage {
	pageId: string;
	serviceType: string;
	url: string;
	seo: PricingPageSEO;
	content: PricingPageContent;
	schema: Record<string, unknown>;
}

// ============================================================================
// MARKET STATISTICS
// ============================================================================

export interface MarketStatistics {
	totalProviders: number;
	byCity: Record<string, number>;
	averageRating: number;
	averageTrustScore: number;
	priceRanges: Record<string, { low: number; high: number }>;
	topRated: Array<{ id: string; name: string; rating: number }>;
	licenseComplianceRate: number;
}

// ============================================================================
// COMPLETE OUTPUT STRUCTURE
// ============================================================================

export interface GeneratedComparisonData {
	comparisonPages: ComparisonPage[];
	pricingPages: PricingPage[];
	marketStats: MarketStatistics;
	generatedAt: string;
}

// ============================================================================
// INPUT TYPES
// ============================================================================

export interface ComparisonDataInput {
	enrichedProviders: EnrichedProvider[];
	blueprint: SitePlannerOutput;
	localKnowledge: LocalKnowledgeOutput;
}

export interface ComparisonDataConfig {
	includePricing: boolean;
	includeWinnerBadges: boolean;
}

// ============================================================================
// PROGRESS TRACKING
// ============================================================================

export interface ComparisonDataGenerationProgress {
	phase:
		| 'preparing'
		| 'analyzing'
		| 'generating-comparisons'
		| 'generating-pricing'
		| 'generating-analysis'
		| 'complete';
	currentStep: string | null;
	completedSteps: number;
	totalSteps: number;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function createEmptyComparisonData(): GeneratedComparisonData {
	return {
		comparisonPages: [],
		pricingPages: [],
		marketStats: {
			totalProviders: 0,
			byCity: {},
			averageRating: 0,
			averageTrustScore: 0,
			priceRanges: {},
			topRated: [],
			licenseComplianceRate: 0,
		},
		generatedAt: new Date().toISOString(),
	};
}

export function createEmptyProgress(): ComparisonDataGenerationProgress {
	return {
		phase: 'preparing',
		currentStep: null,
		completedSteps: 0,
		totalSteps: 0,
	};
}
