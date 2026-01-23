// Internal Link Optimizer
// Builds and optimizes internal link structure

import { InternalLink } from '@/types/seoPackage';
import { SitePlannerOutput, PageBrief } from '@/types/sitePlanner';

// ============================================================================
// LINK DENSITY TARGETS
// ============================================================================

const MIN_LINKS_BY_TYPE: Record<string, number> = {
	homepage: 20,
	service_hub: 15,
	service_page: 12,
	city_service_page: 10,
	comparison: 12,
	provider_listing: 10,
	provider_profile: 8,
	cost_guide: 10,
	troubleshooting: 8,
	buying_guide: 10,
	diy_guide: 8,
	guide: 10,
	local_expertise: 8,
	about: 6,
	methodology: 6,
	contact: 4,
	legal: 2,
	privacy: 2,
	terms: 2,
};

/**
 * Get minimum link count for a page type
 */
export function getMinLinks(pageType: string): number {
	return MIN_LINKS_BY_TYPE[pageType] || 5;
}

// ============================================================================
// ANCHOR TEXT GENERATION
// ============================================================================

/**
 * Generate anchor text for a link
 */
export function generateAnchorText(
	pattern: string | undefined,
	targetPage: PageBrief,
	city: string,
	category: string,
): string {
	if (pattern) {
		return pattern
			.replace(/\[City\]/gi, city)
			.replace(/\[Category\]/gi, category)
			.replace(/\[Provider\]/gi, targetPage.seo?.primaryKeyword || '')
			.replace(/\[[^\]]*\]/g, '')
			.trim();
	}

	// Generate based on page type
	switch (targetPage.type) {
		case 'homepage':
			return `${category} services`;
		case 'service_hub':
			return `${category} in ${city}`;
		case 'comparison':
			return `compare ${category} companies`;
		case 'provider_profile':
			return targetPage.seo?.primaryKeyword || 'view profile';
		case 'cost_guide':
			return `${category} cost guide`;
		case 'troubleshooting':
			return `${category} troubleshooting`;
		default:
			return targetPage.seo?.primaryKeyword || 'learn more';
	}
}

// ============================================================================
// LINK OPPORTUNITIES
// ============================================================================

/**
 * Find contextual link opportunities based on content mentions
 */
export function findContextualLinkOpportunities(
	sourcePage: PageBrief,
	allPages: PageBrief[],
	city: string,
	category: string,
): InternalLink[] {
	const links: InternalLink[] = [];
	const sourceContent = sourcePage.seo?.primaryKeyword?.toLowerCase() || '';

	for (const targetPage of allPages) {
		if (targetPage.id === sourcePage.id) continue;

		const targetTopic = targetPage.seo?.primaryKeyword?.toLowerCase() || '';

		// Check if source mentions target topic
		if (
			sourceContent.includes(targetTopic) ||
			shouldLink(sourcePage, targetPage)
		) {
			links.push({
				targetUrl: targetPage.url,
				targetPageId: targetPage.id,
				anchorText: generateAnchorText(undefined, targetPage, city, category),
				context: 'body',
			});
		}
	}

	return links;
}

/**
 * Determine if source should link to target based on page types
 */
function shouldLink(source: PageBrief, target: PageBrief): boolean {
	// Define natural linking relationships
	const linkRelationships: Record<string, string[]> = {
		homepage: ['service_hub', 'comparison', 'cost_guide', 'about'],
		service_hub: [
			'provider_listing',
			'comparison',
			'cost_guide',
			'provider_profile',
		],
		service_page: ['cost_guide', 'troubleshooting', 'provider_listing'],
		city_service_page: ['provider_listing', 'cost_guide', 'comparison'],
		comparison: ['provider_profile', 'cost_guide', 'service_hub'],
		provider_listing: ['provider_profile', 'comparison'],
		provider_profile: ['comparison', 'service_hub', 'provider_profile'],
		cost_guide: ['service_hub', 'provider_listing', 'troubleshooting'],
		troubleshooting: ['cost_guide', 'diy_guide', 'provider_listing'],
		buying_guide: ['comparison', 'cost_guide', 'provider_listing'],
		diy_guide: ['troubleshooting', 'buying_guide', 'cost_guide'],
		local_expertise: ['service_hub', 'provider_listing', 'about'],
		about: ['methodology', 'contact', 'service_hub'],
		methodology: ['about', 'comparison'],
	};

	const targetTypes = linkRelationships[source.type] || [];
	return targetTypes.includes(target.type);
}

/**
 * Suggest additional links to meet minimum density
 */
export function suggestAdditionalLinks(
	sourcePage: PageBrief,
	allPages: PageBrief[],
	existingLinks: InternalLink[],
	count: number,
	city: string,
	category: string,
): InternalLink[] {
	const additionalLinks: InternalLink[] = [];
	const existingTargets = new Set(existingLinks.map((l) => l.targetPageId));

	// Priority order for suggestions
	const priorityOrder = [
		'homepage',
		'service_hub',
		'comparison',
		'cost_guide',
		'provider_listing',
		'provider_profile',
		'troubleshooting',
		'buying_guide',
		'about',
	];

	// Sort pages by priority
	const sortedPages = [...allPages]
		.filter((p) => p.id !== sourcePage.id && !existingTargets.has(p.id))
		.sort((a, b) => {
			const aIndex = priorityOrder.indexOf(a.type);
			const bIndex = priorityOrder.indexOf(b.type);
			return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
		});

	for (const page of sortedPages) {
		if (additionalLinks.length >= count) break;

		additionalLinks.push({
			targetUrl: page.url,
			targetPageId: page.id,
			anchorText: generateAnchorText(undefined, page, city, category),
			context: 'sidebar', // Suggested links go in sidebar
		});
	}

	return additionalLinks;
}

// ============================================================================
// ORPHAN PAGE DETECTION
// ============================================================================

/**
 * Find pages with no incoming links
 */
export function findOrphanPages(
	allPages: PageBrief[],
	linkMap: Map<string, InternalLink[]>,
): string[] {
	// Collect all linked-to page IDs
	const linkedPageIds = new Set<string>();

	for (const links of linkMap.values()) {
		for (const link of links) {
			linkedPageIds.add(link.targetPageId);
		}
	}

	// Find pages not linked to (excluding homepage and special pages)
	const orphans: string[] = [];
	const excludedTypes = ['homepage', 'legal', 'privacy', 'terms', 'contact'];

	for (const page of allPages) {
		if (!linkedPageIds.has(page.id) && !excludedTypes.includes(page.type)) {
			orphans.push(page.id);
		}
	}

	return orphans;
}

/**
 * Fix orphan pages by adding links to them
 */
export function fixOrphanPages(
	orphanIds: string[],
	allPages: PageBrief[],
	linkMap: Map<string, InternalLink[]>,
	city: string,
	category: string,
): Map<string, InternalLink[]> {
	const updatedMap = new Map(linkMap);
	const orphanPages = allPages.filter((p) => orphanIds.includes(p.id));

	for (const orphan of orphanPages) {
		// Find best page to link from
		const linkerPage = findBestLinker(orphan, allPages, updatedMap);
		if (linkerPage) {
			const existingLinks = updatedMap.get(linkerPage.id) || [];
			existingLinks.push({
				targetUrl: orphan.url,
				targetPageId: orphan.id,
				anchorText: generateAnchorText(undefined, orphan, city, category),
				context: 'body',
			});
			updatedMap.set(linkerPage.id, existingLinks);
		}
	}

	return updatedMap;
}

/**
 * Find the best page to add a link from
 */
function findBestLinker(
	targetPage: PageBrief,
	allPages: PageBrief[],
	linkMap: Map<string, InternalLink[]>,
): PageBrief | null {
	// Prefer pages of related types with fewer links
	const relatedTypes: Record<string, string[]> = {
		provider_profile: ['comparison', 'provider_listing', 'service_hub'],
		cost_guide: ['service_hub', 'service_page', 'comparison'],
		troubleshooting: ['service_hub', 'diy_guide', 'cost_guide'],
		comparison: ['service_hub', 'homepage'],
	};

	const preferredTypes = relatedTypes[targetPage.type] || [
		'homepage',
		'service_hub',
	];

	// Find best candidate
	let bestCandidate: PageBrief | null = null;
	let lowestLinkCount = Infinity;

	for (const page of allPages) {
		if (page.id === targetPage.id) continue;
		if (!preferredTypes.includes(page.type)) continue;

		const linkCount = (linkMap.get(page.id) || []).length;
		if (linkCount < lowestLinkCount) {
			lowestLinkCount = linkCount;
			bestCandidate = page;
		}
	}

	// Fall back to homepage if no candidate found
	if (!bestCandidate) {
		bestCandidate = allPages.find((p) => p.type === 'homepage') || null;
	}

	return bestCandidate;
}

// ============================================================================
// MAIN OPTIMIZER
// ============================================================================

/**
 * Optimize internal links for all pages
 */
export function optimizeInternalLinks(
	pages: PageBrief[],
	blueprint: SitePlannerOutput,
	linkDensityTarget: number = 10,
): Map<string, InternalLink[]> {
	const linkMap = new Map<string, InternalLink[]>();
	const city = blueprint.meta.city;
	const category = blueprint.meta.category;

	for (const page of pages) {
		const links: InternalLink[] = [];

		// 1. Add required links from blueprint if defined
		const requiredLinks = page.internalLinks?.required || [];
		for (const req of requiredLinks) {
			const targetPage = pages.find((p) => p.id === req.toPageId);
			if (targetPage) {
				links.push({
					targetUrl: targetPage.url,
					targetPageId: req.toPageId,
					anchorText: generateAnchorText(
						req.anchorPattern,
						targetPage,
						city,
						category,
					),
					context: 'body',
				});
			}
		}

		// 2. Find contextual link opportunities
		const contextualLinks = findContextualLinkOpportunities(
			page,
			pages,
			city,
			category,
		);
		links.push(...contextualLinks.slice(0, 5)); // Limit contextual links

		// 3. Ensure minimum link density
		const minLinks = Math.max(getMinLinks(page.type), linkDensityTarget);
		if (links.length < minLinks) {
			const additional = suggestAdditionalLinks(
				page,
				pages,
				links,
				minLinks - links.length,
				city,
				category,
			);
			links.push(...additional);
		}

		// Remove duplicates
		const uniqueLinks = links.filter(
			(link, index, self) =>
				index === self.findIndex((l) => l.targetPageId === link.targetPageId),
		);

		linkMap.set(page.id, uniqueLinks);
	}

	// 4. Fix orphan pages
	const orphans = findOrphanPages(pages, linkMap);
	if (orphans.length > 0) {
		return fixOrphanPages(orphans, pages, linkMap, city, category);
	}

	return linkMap;
}

/**
 * Calculate internal link coverage percentage
 */
export function calculateLinkCoverage(
	allPages: PageBrief[],
	linkMap: Map<string, InternalLink[]>,
): number {
	const linkedPageIds = new Set<string>();

	for (const links of linkMap.values()) {
		for (const link of links) {
			linkedPageIds.add(link.targetPageId);
		}
	}

	// Exclude special pages from calculation
	const countablePages = allPages.filter(
		(p) => !['legal', 'privacy', 'terms', '404', '500'].includes(p.type),
	);

	const linkedCount = countablePages.filter((p) =>
		linkedPageIds.has(p.id),
	).length;
	return Math.round((linkedCount / countablePages.length) * 100);
}
