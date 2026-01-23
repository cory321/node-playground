// Content generation logic for editorial pages
// Generates full content pages using LLM calls

import { callLLM } from '@/api/llm';
import { LocalKnowledgeOutput } from '@/types/localKnowledge';
import { PageBrief, SitePlannerOutput } from '@/types/sitePlanner';
import {
	EditorialPageType,
	QualityLevel,
	GeneratedContentPage,
	ContentSection,
	FAQItem,
	EditorialSEO,
	EditorialSchema,
	EditorialInternalLink,
	EditorialImage,
	CallToAction,
	calculateQualityScore,
} from '@/types/editorialContent';
import {
	getContentTypeStructure,
	getSectionTemplates,
	getTargetWordCount,
} from './structures';
import {
	getIntroductionPrompt,
	getSectionPrompt,
	getFAQPrompt,
	getKeyTakeawaysPrompt,
	getCTAPrompt,
	PromptContext,
} from './prompts';
import {
	injectLocalKnowledge,
	extractLocalReferences,
} from './localInjector';
import { getAuthorForContentType } from '@/data/authorPersonas';

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_MODEL_KEY = 'claude-haiku'; // Default model for content generation (must match key in models.ts)
const RATE_LIMIT_MS = 1000; // Delay between LLM calls

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Delay helper for rate limiting
 */
function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Count words in a string
 */
function countWords(text: string): number {
	return text
		.trim()
		.split(/\s+/)
		.filter((word) => word.length > 0).length;
}

/**
 * Generate a unique section ID
 */
function generateSectionId(heading: string, index: number): string {
	return `section-${index}-${heading.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}

/**
 * Parse JSON from LLM response, with fallback
 */
function parseJsonResponse<T>(response: string, fallback: T): T {
	try {
		// Try to extract JSON from response
		const jsonMatch = response.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
		if (jsonMatch) {
			return JSON.parse(jsonMatch[0]);
		}
		return fallback;
	} catch {
		return fallback;
	}
}

// ============================================================================
// CONTENT GENERATION HELPERS
// ============================================================================

/**
 * Generate introduction for a page
 */
async function generateIntroduction(
	ctx: PromptContext,
	abortSignal?: { current: boolean },
	modelKey: string = DEFAULT_MODEL_KEY
): Promise<string> {
	if (abortSignal?.current) return '';

	const prompt = getIntroductionPrompt(ctx);

	try {
		const response = await callLLM(modelKey, prompt);
		return response.trim();
	} catch (error) {
		console.error('Error generating introduction:', error);
		return `Welcome to our guide about ${ctx.service} in ${ctx.city}, ${ctx.state}. This comprehensive resource will help you understand your options and make informed decisions.`;
	}
}

/**
 * Generate a single section
 */
async function generateSection(
	ctx: PromptContext,
	sectionHeading: string,
	targetWords: number,
	abortSignal?: { current: boolean },
	modelKey: string = DEFAULT_MODEL_KEY
): Promise<ContentSection> {
	if (abortSignal?.current) {
		return {
			id: generateSectionId(sectionHeading, 0),
			heading: sectionHeading,
			content: '',
		};
	}

	const sectionCtx: PromptContext = {
		...ctx,
		sectionName: sectionHeading,
		targetWords,
	};

	const prompt = getSectionPrompt(sectionCtx);

	try {
		const response = await callLLM(modelKey, prompt);

		return {
			id: generateSectionId(sectionHeading, 0),
			heading: sectionHeading,
			content: response.trim(),
		};
	} catch (error) {
		console.error(`Error generating section "${sectionHeading}":`, error);
		return {
			id: generateSectionId(sectionHeading, 0),
			heading: sectionHeading,
			content: `Content for ${sectionHeading} is being generated...`,
		};
	}
}

/**
 * Generate FAQ items
 */
async function generateFAQs(
	ctx: PromptContext,
	count: number,
	abortSignal?: { current: boolean },
	modelKey: string = DEFAULT_MODEL_KEY
): Promise<FAQItem[]> {
	if (abortSignal?.current || count === 0) return [];

	const prompt = getFAQPrompt(ctx, count);

	try {
		const response = await callLLM(modelKey, prompt);

		const faqs = parseJsonResponse<FAQItem[]>(response, []);
		return faqs.slice(0, count);
	} catch (error) {
		console.error('Error generating FAQs:', error);
		// Return placeholder FAQs
		return [
			{
				question: `How much does ${ctx.service} cost in ${ctx.city}?`,
				answer: `The cost of ${ctx.service} in ${ctx.city} varies based on several factors. Contact local providers for accurate quotes.`,
			},
			{
				question: `How do I find a reliable ${ctx.service} provider?`,
				answer: `Look for licensed, insured providers with good reviews. Check references and get multiple quotes before making a decision.`,
			},
		].slice(0, count);
	}
}

/**
 * Generate key takeaways
 */
async function generateKeyTakeaways(
	ctx: PromptContext,
	count: number,
	abortSignal?: { current: boolean },
	modelKey: string = DEFAULT_MODEL_KEY
): Promise<string[]> {
	if (abortSignal?.current || count === 0) return [];

	const prompt = getKeyTakeawaysPrompt(ctx, count);

	try {
		const response = await callLLM(modelKey, prompt);

		// Parse bullet points from response
		const lines = response.split('\n').filter((line) => line.trim());
		const takeaways = lines
			.map((line) => line.replace(/^[-•*]\s*/, '').trim())
			.filter((line) => line.length > 10);

		return takeaways.slice(0, count);
	} catch (error) {
		console.error('Error generating key takeaways:', error);
		return [
			`Get multiple quotes from ${ctx.city} providers`,
			`Check licenses and reviews before hiring`,
			`Consider local factors when making decisions`,
		].slice(0, count);
	}
}

/**
 * Generate call-to-action
 */
async function generateCTA(
	ctx: PromptContext,
	ctaType: 'find_providers' | 'get_quote' | 'learn_more' | 'contact',
	abortSignal?: { current: boolean },
	modelKey: string = DEFAULT_MODEL_KEY
): Promise<CallToAction> {
	if (abortSignal?.current) {
		return {
			heading: 'Get Started Today',
			text: `Find trusted ${ctx.service} providers in ${ctx.city}.`,
			buttonText: 'Find Providers',
			buttonLink: '/providers',
		};
	}

	const prompt = getCTAPrompt(ctx, ctaType);

	try {
		const response = await callLLM(modelKey, prompt);

		const cta = parseJsonResponse<Partial<CallToAction>>(response, {});

		return {
			heading: cta.heading || 'Get Started Today',
			text:
				cta.text ||
				`Find trusted ${ctx.service} providers in ${ctx.city}.`,
			buttonText: cta.buttonText || 'Find Providers',
			buttonLink: '/providers',
		};
	} catch (error) {
		console.error('Error generating CTA:', error);
		return {
			heading: 'Get Started Today',
			text: `Find trusted ${ctx.service} providers in ${ctx.city}.`,
			buttonText: 'Find Providers',
			buttonLink: '/providers',
		};
	}
}

// ============================================================================
// SEO & SCHEMA GENERATION
// ============================================================================

/**
 * Generate SEO metadata
 */
function generateSEO(
	pageBrief: PageBrief,
	city: string,
	brand: string
): EditorialSEO {
	return {
		title:
			pageBrief.seo?.titleTemplate
				?.replace('[City]', city)
				.replace('[Brand]', brand) || `${pageBrief.type} | ${brand}`,
		metaDescription:
			pageBrief.seo?.descriptionTemplate?.replace('[City]', city) ||
			`Learn about ${pageBrief.type} in ${city}.`,
		canonicalUrl: pageBrief.url,
		focusKeyword: pageBrief.seo?.primaryKeyword || '',
	};
}

/**
 * Generate schema markup
 */
function generateSchema(
	pageBrief: PageBrief,
	content: { headline: string; introduction: string; faq: FAQItem[] },
	city: string,
	brand: string
): EditorialSchema {
	const baseUrl = `https://${brand.toLowerCase().replace(/\s+/g, '')}.com`;

	// Article schema
	const articleSchema = {
		'@context': 'https://schema.org',
		'@type': 'Article',
		headline: content.headline,
		description: content.introduction.substring(0, 160),
		author: {
			'@type': 'Organization',
			name: brand,
		},
		publisher: {
			'@type': 'Organization',
			name: brand,
		},
		datePublished: new Date().toISOString(),
		dateModified: new Date().toISOString(),
	};

	// FAQ schema if applicable
	const faqSchema =
		content.faq.length > 0
			? {
					'@context': 'https://schema.org',
					'@type': 'FAQPage',
					mainEntity: content.faq.map((item) => ({
						'@type': 'Question',
						name: item.question,
						acceptedAnswer: {
							'@type': 'Answer',
							text: item.answer,
						},
					})),
				}
			: undefined;

	// Breadcrumb schema
	const breadcrumbSchema = {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: [
			{
				'@type': 'ListItem',
				position: 1,
				name: 'Home',
				item: baseUrl,
			},
			{
				'@type': 'ListItem',
				position: 2,
				name: city,
				item: `${baseUrl}/${city.toLowerCase().replace(/\s+/g, '-')}`,
			},
			{
				'@type': 'ListItem',
				position: 3,
				name: content.headline,
				item: `${baseUrl}${pageBrief.url}`,
			},
		],
	};

	return {
		article: articleSchema,
		faqPage: faqSchema,
		breadcrumbList: breadcrumbSchema,
	};
}

// ============================================================================
// INTERNAL LINKS & IMAGES
// ============================================================================

/**
 * Generate internal link suggestions
 */
function generateInternalLinks(
	pageBrief: PageBrief,
	allPages: PageBrief[]
): EditorialInternalLink[] {
	const links: EditorialInternalLink[] = [];

	// Use required links from the brief
	if (pageBrief.internalLinks?.required) {
		for (const required of pageBrief.internalLinks.required) {
			links.push({
				targetPageId: required.toPageId,
				anchorText: required.anchorPattern,
				placement: 'body',
			});
		}
	}

	// Add links to related pages
	const relatedTypes: Record<string, string[]> = {
		service_page: ['cost_guide', 'provider_listing', 'troubleshooting'],
		cost_guide: ['service_page', 'provider_listing'],
		troubleshooting: ['service_page', 'diy_guide'],
		buying_guide: ['service_page', 'cost_guide'],
	};

	const related = relatedTypes[pageBrief.type] || [];
	for (const relatedType of related) {
		const relatedPage = allPages.find((p) => p.type === relatedType);
		if (relatedPage && !links.some((l) => l.targetPageId === relatedPage.id)) {
			links.push({
				targetPageId: relatedPage.id,
				anchorText: `Learn more about ${relatedType.replace(/_/g, ' ')}`,
				placement: 'body',
			});
		}
	}

	return links.slice(0, 5); // Limit to 5 internal links
}

/**
 * Generate image requirements
 */
function generateImageRequirements(
	contentType: EditorialPageType,
	service: string,
	city: string
): EditorialImage[] {
	const images: EditorialImage[] = [];

	// Hero image for all pages
	images.push({
		description: `Hero image for ${service} in ${city}`,
		altText: `${service} services in ${city}`,
		placement: 'hero',
		generated: false,
	});

	// Additional images based on content type
	if (
		contentType === 'buying_guide' ||
		contentType === 'diy_guide'
	) {
		images.push({
			description: `Product comparison for ${service}`,
			altText: `Comparing ${service} options`,
			placement: 'body',
			generated: false,
		});
	}

	if (contentType === 'troubleshooting') {
		images.push({
			description: `Troubleshooting diagram for ${service}`,
			altText: `How to diagnose ${service} issues`,
			placement: 'body',
			generated: false,
		});
	}

	return images;
}

// ============================================================================
// MAIN PAGE GENERATION
// ============================================================================

export interface PageGenerationOptions {
	onProgress?: (section: string) => void;
	abortSignal?: { current: boolean };
	modelKey?: string; // e.g. 'claude-haiku', 'claude-sonnet', 'claude-opus'
}

/**
 * Generate a complete editorial content page
 */
export async function generateContentPage(
	pageBrief: PageBrief,
	contentType: EditorialPageType,
	blueprint: SitePlannerOutput,
	localKnowledge: LocalKnowledgeOutput,
	qualityLevel: QualityLevel,
	options?: PageGenerationOptions
): Promise<GeneratedContentPage> {
	const { onProgress, abortSignal, modelKey = DEFAULT_MODEL_KEY } = options || {};

	// Get structure for this content type
	const structure = getContentTypeStructure(contentType);
	const targetWordCount = getTargetWordCount(contentType, qualityLevel);

	// Build context
	const ctx: PromptContext = {
		service: blueprint.meta.category,
		city: blueprint.meta.city,
		state: blueprint.meta.state,
		region: localKnowledge.regionalIdentity?.region || blueprint.meta.state,
		keyword: pageBrief.seo?.primaryKeyword || blueprint.meta.category,
		localKnowledge,
		qualityLevel,
	};

	// Get section templates
	const sectionHeadings = getSectionTemplates(contentType, {
		service: ctx.service,
		city: ctx.city,
		region: ctx.region,
	});

	// Calculate words per section
	const wordsPerSection = Math.floor(targetWordCount / sectionHeadings.length);

	// Generate content components
	onProgress?.('Generating introduction...');
	const introduction = await generateIntroduction(ctx, abortSignal, modelKey);
	await delay(RATE_LIMIT_MS);

	// Generate sections
	const sections: ContentSection[] = [];
	for (let i = 0; i < sectionHeadings.length; i++) {
		if (abortSignal?.current) break;

		const heading = sectionHeadings[i];
		onProgress?.(`Generating section: ${heading}`);

		const section = await generateSection(
			ctx,
			heading,
			wordsPerSection,
			abortSignal,
			modelKey
		);
		section.id = generateSectionId(heading, i);
		sections.push(section);

		await delay(RATE_LIMIT_MS);
	}

	// Generate FAQs
	onProgress?.('Generating FAQs...');
	const faq = await generateFAQs(ctx, structure.faqCount, abortSignal, modelKey);
	await delay(RATE_LIMIT_MS);

	// Generate key takeaways
	onProgress?.('Generating key takeaways...');
	const keyTakeaways = await generateKeyTakeaways(
		ctx,
		structure.keyTakeawaysCount,
		abortSignal,
		modelKey
	);
	await delay(RATE_LIMIT_MS);

	// Generate CTA
	onProgress?.('Generating call-to-action...');
	const callToAction = await generateCTA(ctx, structure.ctaType, abortSignal, modelKey);

	// Get author
	const author = getAuthorForContentType(contentType, blueprint.brand.name);

	// Build headline
	const headline =
		pageBrief.seo?.titleTemplate
			?.replace('[City]', ctx.city)
			.replace('[Brand]', '') ||
		`${ctx.service} in ${ctx.city}`;

	// Combine all content for local reference injection
	const allContent = [
		introduction,
		...sections.map((s) => s.content),
		...faq.map((f) => f.answer),
	].join('\n\n');

	// Inject local knowledge
	onProgress?.('Injecting local references...');
	const injectionResult = injectLocalKnowledge(
		allContent,
		localKnowledge,
		structure.localReferencesMin
	);

	// Extract local references for tracking
	const localReferences = extractLocalReferences(
		injectionResult.content,
		localKnowledge
	);

	// Calculate word count
	const wordCount = countWords(injectionResult.content);

	// Calculate quality score
	const qualityScore = calculateQualityScore(
		wordCount,
		targetWordCount,
		localReferences.length,
		structure.localReferencesMin,
		sections.length,
		sectionHeadings.length
	);

	// Generate metadata
	const now = new Date().toISOString();
	const readTime = `${Math.ceil(wordCount / 200)} min read`;

	// Generate SEO
	const seo = generateSEO(pageBrief, ctx.city, blueprint.brand.name);

	// Generate schema
	const schema = generateSchema(
		pageBrief,
		{ headline, introduction, faq },
		ctx.city,
		blueprint.brand.name
	);

	// Generate internal links
	const internalLinks = generateInternalLinks(pageBrief, blueprint.pages);

	// Generate image requirements
	const images = generateImageRequirements(contentType, ctx.service, ctx.city);

	return {
		pageId: pageBrief.id,
		type: contentType,
		url: pageBrief.url,
		seo,
		content: {
			headline,
			author: {
				name: author.name,
				title: author.title,
				bio: author.bio,
			},
			metadata: {
				publishDate: now,
				lastUpdated: now,
				readTime,
				category: ctx.service,
			},
			tableOfContents: sectionHeadings,
			introduction,
			sections,
			keyTakeaways,
			faq,
			callToAction,
		},
		schema,
		internalLinks,
		images,
		wordCount,
		localReferences,
		qualityScore,
	};
}

/**
 * Map PageBrief type to EditorialPageType
 */
export function mapPageTypeToEditorialType(
	pageType: string
): EditorialPageType | null {
	const mapping: Record<string, EditorialPageType> = {
		service_detail: 'service_page',
		service_hub: 'service_page',
		city_service: 'city_service_page',
		cost_guide: 'cost_guide',
		troubleshooting: 'troubleshooting',
		about: 'about',
		methodology: 'methodology',
	};

	return mapping[pageType] || null;
}
