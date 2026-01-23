// Editorial Content Generator types
// For generating service pages, cost guides, troubleshooting articles, and other editorial content

// ============================================================================
// CONTENT TYPE DEFINITIONS
// ============================================================================

export type EditorialPageType =
	| 'service_page'
	| 'city_service_page'
	| 'cost_guide'
	| 'troubleshooting'
	| 'buying_guide'
	| 'diy_guide'
	| 'local_expertise'
	| 'about'
	| 'methodology';

export type QualityLevel = 'draft' | 'polished';

// ============================================================================
// SEO METADATA
// ============================================================================

export interface EditorialSEO {
	title: string;
	metaDescription: string;
	canonicalUrl: string;
	focusKeyword: string;
}

// ============================================================================
// AUTHOR INFORMATION
// ============================================================================

export interface ContentAuthor {
	name: string;
	title: string;
	bio: string;
}

// ============================================================================
// CONTENT METADATA
// ============================================================================

export interface ContentMetadata {
	publishDate: string;
	lastUpdated: string;
	readTime: string;
	category: string;
}

// ============================================================================
// CONTENT SECTIONS
// ============================================================================

export interface ContentSubsection {
	heading: string; // H3
	content: string;
}

export interface ContentSection {
	id: string;
	heading: string; // H2
	content: string;
	subsections?: ContentSubsection[];
	localReference?: string; // Track local mentions
}

// ============================================================================
// FAQ
// ============================================================================

export interface FAQItem {
	question: string;
	answer: string;
}

// ============================================================================
// CALL TO ACTION
// ============================================================================

export interface CallToAction {
	heading: string;
	text: string;
	buttonText: string;
	buttonLink: string;
}

// ============================================================================
// SOURCES
// ============================================================================

export interface ContentSource {
	title: string;
	url: string;
	accessDate: string;
}

// ============================================================================
// PAGE CONTENT (Main content structure)
// ============================================================================

export interface EditorialPageContent {
	headline: string; // H1

	author: ContentAuthor;

	metadata: ContentMetadata;

	tableOfContents: string[];

	introduction: string; // 100-200 words

	sections: ContentSection[];

	keyTakeaways: string[]; // 3-5 bullet summary

	faq: FAQItem[];

	callToAction: CallToAction;

	sources?: ContentSource[];
}

// ============================================================================
// SCHEMA MARKUP
// ============================================================================

export interface EditorialSchema {
	article: Record<string, unknown>;
	faqPage?: Record<string, unknown>;
	howTo?: Record<string, unknown>;
	breadcrumbList: Record<string, unknown>;
}

// ============================================================================
// INTERNAL LINKS
// ============================================================================

export interface EditorialInternalLink {
	targetPageId: string;
	anchorText: string;
	placement: string;
}

// ============================================================================
// IMAGE REQUIREMENTS
// ============================================================================

export interface EditorialImage {
	description: string;
	altText: string;
	placement: string;
	generated: boolean;
}

// ============================================================================
// GENERATED CONTENT PAGE (Core output per page)
// ============================================================================

export interface GeneratedContentPage {
	pageId: string; // Reference to SitePage from blueprint
	type: EditorialPageType;
	url: string;

	seo: EditorialSEO;

	content: EditorialPageContent;

	schema: EditorialSchema;

	internalLinks: EditorialInternalLink[];

	images: EditorialImage[];

	wordCount: number;
	localReferences: string[];
	qualityScore: number;
}

// ============================================================================
// MAIN OUTPUT
// ============================================================================

export interface GeneratedEditorialContent {
	pages: GeneratedContentPage[];
	totalWordCount: number;
	totalLocalReferences: number;
	generatedAt: string;
}

// ============================================================================
// GENERATION PROGRESS
// ============================================================================

export interface EditorialGenerationProgress {
	currentPage: string | null;
	currentIndex: number;
	totalCount: number;
	phase:
		| 'preparing'
		| 'generating'
		| 'injecting-local'
		| 'validating'
		| 'complete';
	completedPages: number;
	currentSection: string | null;
}

// ============================================================================
// GENERATION CONFIG
// ============================================================================

export interface EditorialGeneratorConfig {
	contentTypes: EditorialPageType[];
	qualityLevel: QualityLevel;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create empty editorial content for error cases
 */
export function createEmptyEditorialContent(): GeneratedEditorialContent {
	return {
		pages: [],
		totalWordCount: 0,
		totalLocalReferences: 0,
		generatedAt: new Date().toISOString(),
	};
}

/**
 * Get display name for content type
 */
export function getContentTypeLabel(type: EditorialPageType): string {
	const labels: Record<EditorialPageType, string> = {
		service_page: 'Service Page',
		city_service_page: 'City Service Page',
		cost_guide: 'Cost Guide',
		troubleshooting: 'Troubleshooting',
		buying_guide: 'Buying Guide',
		diy_guide: 'DIY Guide',
		local_expertise: 'Local Expertise',
		about: 'About Page',
		methodology: 'Methodology',
	};
	return labels[type];
}

/**
 * Get content type category for grouping in UI
 */
export function getContentTypeCategory(
	type: EditorialPageType
): 'core' | 'guides' | 'supporting' {
	switch (type) {
		case 'service_page':
		case 'city_service_page':
			return 'core';
		case 'cost_guide':
		case 'troubleshooting':
		case 'buying_guide':
		case 'diy_guide':
			return 'guides';
		case 'local_expertise':
		case 'about':
		case 'methodology':
			return 'supporting';
	}
}

/**
 * Calculate quality score based on content metrics
 */
export function calculateQualityScore(
	wordCount: number,
	targetWordCount: number,
	localReferences: number,
	targetLocalReferences: number,
	sectionCount: number,
	targetSectionCount: number
): number {
	// Word count score (0-40 points)
	const wordRatio = Math.min(wordCount / targetWordCount, 1.2);
	const wordScore = Math.min(wordRatio * 33, 40);

	// Local references score (0-30 points)
	const localRatio = Math.min(localReferences / targetLocalReferences, 1.5);
	const localScore = Math.min(localRatio * 20, 30);

	// Section completeness score (0-30 points)
	const sectionRatio = Math.min(sectionCount / targetSectionCount, 1);
	const sectionScore = sectionRatio * 30;

	return Math.round(wordScore + localScore + sectionScore);
}
