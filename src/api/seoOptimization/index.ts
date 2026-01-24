// SEO Optimization API
// Main orchestrator for SEO optimization

import {
	SEOOptimizedPackage,
	SEOOptimizedPage,
	SEOOptimizationInput,
	SEOOptimizationConfig,
	SEOOptimizationProgress,
	HeadingStructure,
	Breadcrumb,
	calculateSEOScore,
} from '@/types/seoPackage';
import { PageBrief, SitePlannerOutput } from '@/types/sitePlanner';
import { EnrichedProvider } from '@/types/enrichedProvider';
import { GeneratedContentPage } from '@/types/editorialContent';
import { ComparisonPage } from '@/types/comparisonPage';

import { optimizeMetaTags } from './metaTagOptimizer';
import {
	generateSchemaMarkup,
	validateSchema,
	generateOrganizationSchema,
	generateWebsiteSchema,
} from './schemaGenerator';
import { optimizeInternalLinks } from './linkOptimizer';
import { generateSitemap, generateRobotsTxt } from './sitemapGenerator';
import {
	validatePage,
	validateSEOPackage,
	generateSuggestions,
} from './validator';

// Re-export individual modules
export * from './metaTagOptimizer';
export * from './schemaGenerator';
export * from './linkOptimizer';
export * from './sitemapGenerator';
export * from './validator';

// ============================================================================
// HEADING EXTRACTION
// ============================================================================

/**
 * Extract headings from page content
 */
function extractHeadings(
	page: PageBrief,
	editorialPage?: GeneratedContentPage,
): HeadingStructure {
	// If we have editorial content, use it
	if (editorialPage) {
		const h2s = editorialPage.content.sections?.map((s) => s.heading) || [];
		const h3s: string[] = [];
		for (const section of editorialPage.content.sections || []) {
			if (section.subsections) {
				h3s.push(...section.subsections.map((s) => s.heading));
			}
		}

		return {
			h1: editorialPage.content.headline,
			h2s,
			h3s,
			hierarchy: [
				{
					level: 1,
					text: editorialPage.content.headline,
					children: h2s.map((h2) => ({
						level: 2,
						text: h2,
					})),
				},
			],
			valid: true,
		};
	}

	// Default heading structure from page brief
	return {
		h1: page.seo?.titleTemplate || page.seo?.primaryKeyword || 'Page',
		h2s: [],
		h3s: [],
		hierarchy: [],
		valid: !!page.seo?.titleTemplate,
	};
}

/**
 * Generate breadcrumbs for a page
 */
function generateBreadcrumbs(page: PageBrief): Breadcrumb[] {
	const breadcrumbs: Breadcrumb[] = [{ name: 'Home', url: '/' }];

	// Add intermediate crumbs based on page type
	switch (page.type) {
		case 'provider_profile':
			breadcrumbs.push({ name: 'Providers', url: '/providers' });
			break;
		case 'cost_guide':
		case 'troubleshooting':
			breadcrumbs.push({ name: 'Guides', url: '/guides' });
			break;
		case 'comparison':
			breadcrumbs.push({ name: 'Compare', url: '/compare' });
			break;
		case 'service_hub':
			breadcrumbs.push({ name: 'Services', url: '/services' });
			break;
	}

	// Add current page
	breadcrumbs.push({
		name: page.seo?.primaryKeyword || 'Page',
		url: page.url,
	});

	return breadcrumbs;
}

// ============================================================================
// PAGE OPTIMIZATION
// ============================================================================

/**
 * Optimize a single page
 */
function optimizePage(
	page: PageBrief,
	blueprint: SitePlannerOutput,
	provider?: EnrichedProvider,
	editorialPage?: GeneratedContentPage,
	comparisonPage?: ComparisonPage,
	linkMap?: Map<string, import('@/types/seoPackage').InternalLink[]>,
): SEOOptimizedPage {
	const city = blueprint.meta.city;
	const category = blueprint.meta.category;

	// 1. Optimize meta tags
	const meta = optimizeMetaTags(page, blueprint);

	// 2. Extract/generate headings
	const headings = extractHeadings(page, editorialPage);

	// 3. Generate breadcrumbs
	const breadcrumbs = generateBreadcrumbs(page);

	// 4. Generate schema markup
	const faqs = editorialPage?.content.faq || comparisonPage?.content.faq;
	const schemas = generateSchemaMarkup(
		page,
		blueprint,
		provider,
		faqs,
		breadcrumbs,
	).map(validateSchema);

	// 5. Get internal links from link map
	const internalLinks = linkMap?.get(page.id) || [];

	// 6. Create optimized page
	const optimizedPage: SEOOptimizedPage = {
		pageId: page.id,
		url: page.url,
		type: page.type,
		meta,
		schema: schemas,
		headings,
		internalLinks,
		externalLinks: [],
		breadcrumbs,
		content: editorialPage?.content || comparisonPage?.content || page.content,
		seoScore: 0,
		issues: [],
		suggestions: [],
	};

	// 7. Validate page and collect issues
	optimizedPage.issues = validatePage(optimizedPage, undefined, category, city);

	// 8. Calculate SEO score
	optimizedPage.seoScore = calculateSEOScore(optimizedPage);

	// 9. Generate suggestions
	optimizedPage.suggestions = generateSuggestions(optimizedPage);

	return optimizedPage;
}

// ============================================================================
// MAIN OPTIMIZER
// ============================================================================

/**
 * Optimize SEO for all content
 */
export async function optimizeSEO(
	input: SEOOptimizationInput,
	config: SEOOptimizationConfig,
	onProgress?: (progress: SEOOptimizationProgress) => void,
): Promise<SEOOptimizedPackage> {
	const { blueprint, editorialContent, comparisonData } = input;

	// Use providers from blueprint (pass-through from site planner)
	const enrichedProviders = blueprint.providers || [];

	// Create provider lookup map
	const providerMap = new Map<string, EnrichedProvider>();
	for (const provider of enrichedProviders) {
		providerMap.set(provider.id, provider);
	}

	// Create editorial content lookup map
	const editorialMap = new Map<string, GeneratedContentPage>();
	if (editorialContent?.pages) {
		for (const page of editorialContent.pages) {
			editorialMap.set(page.pageId, page);
		}
	}

	// Create comparison page lookup map
	const comparisonMap = new Map<string, ComparisonPage>();
	if (comparisonData?.comparisonPages) {
		for (const page of comparisonData.comparisonPages) {
			comparisonMap.set(page.pageId, page);
		}
	}

	// Get all pages from blueprint
	const allPages = blueprint.pages || [];
	const totalPages = allPages.length;

	// Report initial progress
	onProgress?.({
		phase: 'preparing',
		currentPage: null,
		completedPages: 0,
		totalPages,
		currentStep: 'Preparing pages...',
	});

	// 1. Optimize internal links first (needs all pages)
	onProgress?.({
		phase: 'optimizing-links',
		currentPage: null,
		completedPages: 0,
		totalPages,
		currentStep: 'Building internal link structure...',
	});

	const linkMap = optimizeInternalLinks(
		allPages,
		blueprint,
		config.linkDensityTarget,
	);

	// 2. Optimize each page
	const optimizedPages: SEOOptimizedPage[] = [];

	for (let i = 0; i < allPages.length; i++) {
		const page = allPages[i];

		onProgress?.({
			phase: 'optimizing-meta',
			currentPage: page.id,
			completedPages: i,
			totalPages,
			currentStep: `Optimizing ${page.type}: ${page.url}`,
		});

		// Find associated provider if this is a provider profile
		let provider: EnrichedProvider | undefined;
		if (
			page.type === 'provider_profile' &&
			page.data?.providers &&
			page.data.providers.length > 0
		) {
			// Use the first provider ID from the providers array
			provider = providerMap.get(page.data.providers[0]);
		}

		// Find associated editorial content
		const editorialPage = editorialMap.get(page.id);

		// Find associated comparison page
		const comparisonPage = comparisonMap.get(page.id);

		// Optimize the page
		const optimizedPage = optimizePage(
			page,
			blueprint,
			provider,
			editorialPage,
			comparisonPage,
			linkMap,
		);

		optimizedPages.push(optimizedPage);
	}

	// 3. Generate schema markup phase
	onProgress?.({
		phase: 'generating-schema',
		currentPage: null,
		completedPages: totalPages,
		totalPages,
		currentStep: 'Validating schema markup...',
	});

	// Validate all schemas if enabled
	if (config.schemaValidation) {
		for (const page of optimizedPages) {
			page.schema = page.schema.map(validateSchema);
		}
	}

	// 4. Generate sitemap
	onProgress?.({
		phase: 'generating-sitemap',
		currentPage: null,
		completedPages: totalPages,
		totalPages,
		currentStep: 'Generating sitemap...',
	});

	const baseUrl = blueprint.structure.baseUrl;
	const sitemap = generateSitemap(optimizedPages, baseUrl);
	const robotsTxt = generateRobotsTxt(baseUrl);

	// 5. Generate site-wide schemas
	const organizationSchema = generateOrganizationSchema(blueprint);
	const websiteSchema = generateWebsiteSchema(blueprint);

	// 6. Final validation
	onProgress?.({
		phase: 'validating',
		currentPage: null,
		completedPages: totalPages,
		totalPages,
		currentStep: 'Running final validation...',
	});

	// Build the package
	const pkg: SEOOptimizedPackage = {
		pages: optimizedPages,
		siteWide: {
			organizationSchema,
			websiteSchema,
			sitemap,
			robotsTxt,
		},
		validation: {
			allPagesHaveTitle: true,
			allPagesHaveDescription: true,
			allPagesHaveCanonical: true,
			allPagesHaveSchema: true,
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
		// Pass-through source data for downstream nodes (e.g., Code Generation)
		// This allows Code Generation to access editorial/comparison data
		// without needing separate connections to those nodes
		sourceData: {
			editorialContent: editorialContent || null,
			comparisonData: comparisonData || null,
		},
	};

	// Run package validation
	pkg.validation = validateSEOPackage(pkg);

	// Calculate stats
	pkg.stats = calculateStats(pkg);

	// Report completion
	onProgress?.({
		phase: 'complete',
		currentPage: null,
		completedPages: totalPages,
		totalPages,
		currentStep: 'SEO optimization complete!',
	});

	return pkg;
}

/**
 * Calculate package statistics
 */
function calculateStats(
	pkg: SEOOptimizedPackage,
): SEOOptimizedPackage['stats'] {
	const totalPages = pkg.pages.length;
	let totalLinks = 0;
	let totalScore = 0;
	const schemaTypes = new Set<string>();
	const pagesByType: Record<string, number> = {};
	const issuesByType: Record<string, number> = {};

	for (const page of pkg.pages) {
		// Count links
		totalLinks += page.internalLinks.length;

		// Sum scores
		totalScore += page.seoScore;

		// Collect schema types
		for (const schema of page.schema) {
			schemaTypes.add(schema.type);
		}

		// Count page types
		pagesByType[page.type] = (pagesByType[page.type] || 0) + 1;

		// Count issues by type
		for (const issue of page.issues) {
			issuesByType[issue.type] = (issuesByType[issue.type] || 0) + 1;
		}
	}

	return {
		totalPages,
		totalInternalLinks: totalLinks,
		avgLinksPerPage: totalPages > 0 ? Math.round(totalLinks / totalPages) : 0,
		schemaTypesUsed: Array.from(schemaTypes),
		pagesByType,
		avgSeoScore: totalPages > 0 ? Math.round(totalScore / totalPages) : 0,
		issuesByType,
	};
}

/**
 * Check if Supabase is configured (for future edge function support)
 */
export function hasSupabaseConfig(): boolean {
	const url = import.meta.env.VITE_SUPABASE_URL;
	const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
	return !!(url && key);
}
