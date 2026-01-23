// Meta Tag Optimizer
// Optimizes title tags, meta descriptions, Open Graph, and Twitter cards

import {
	MetaTags,
	OpenGraphMeta,
	TwitterMeta,
	GeoMeta,
} from '@/types/seoPackage';
import { SitePlannerOutput, PageBrief } from '@/types/sitePlanner';

// ============================================================================
// TITLE OPTIMIZATION
// ============================================================================

/**
 * Optimize a title tag to be 50-60 characters
 * Includes primary keyword, location, and brand
 */
export function optimizeTitle(
	template: string,
	page: PageBrief,
	brandName: string,
	city: string,
	state: string,
): string {
	// Replace template variables
	let title = template
		.replace(/\[City\]/gi, city)
		.replace(/\[State\]/gi, state)
		.replace(/\[Brand\]/gi, brandName)
		.replace(/\[Category\]/gi, page.seo?.primaryKeyword || '')
		.replace(/\[Year\]/gi, new Date().getFullYear().toString());

	// Clean up any remaining brackets
	title = title.replace(/\[[^\]]*\]/g, '').trim();

	// Ensure title isn't too long
	if (title.length > 60) {
		title = truncateIntelligently(title, 60);
	}

	// Ensure title isn't too short
	if (title.length < 30 && brandName) {
		title = `${title} | ${brandName}`;
	}

	return title;
}

/**
 * Truncate title intelligently, avoiding cutting words
 */
function truncateIntelligently(text: string, maxLength: number): string {
	if (text.length <= maxLength) return text;

	// Try to cut at a natural break point
	const truncated = text.substring(0, maxLength);
	const lastSpace = truncated.lastIndexOf(' ');
	const lastPipe = truncated.lastIndexOf('|');
	const lastDash = truncated.lastIndexOf('-');

	// Find the best cut point
	const cutPoint = Math.max(lastSpace, lastPipe, lastDash);

	if (cutPoint > maxLength * 0.6) {
		return text.substring(0, cutPoint).trim();
	}

	// Fall back to simple truncation
	return truncated.trim();
}

// ============================================================================
// DESCRIPTION OPTIMIZATION
// ============================================================================

/**
 * Optimize meta description to be 150-160 characters
 * Includes keyword, value prop, and soft CTA
 */
export function optimizeDescription(
	template: string,
	page: PageBrief,
	city: string,
	state: string,
): string {
	// Replace template variables
	let description = template
		.replace(/\[City\]/gi, city)
		.replace(/\[State\]/gi, state)
		.replace(/\[Category\]/gi, page.seo?.primaryKeyword || '')
		.replace(/\[Year\]/gi, new Date().getFullYear().toString());

	// Clean up any remaining brackets
	description = description.replace(/\[[^\]]*\]/g, '').trim();

	// Ensure description is within range
	if (description.length > 160) {
		description = truncateDescription(description, 160);
	}

	// Pad if too short
	if (description.length < 120) {
		description = padDescription(description);
	}

	return description;
}

/**
 * Truncate description at sentence boundary if possible
 */
function truncateDescription(text: string, maxLength: number): string {
	if (text.length <= maxLength) return text;

	// Try to end at a sentence
	const truncated = text.substring(0, maxLength);
	const lastPeriod = truncated.lastIndexOf('.');
	const lastExclamation = truncated.lastIndexOf('!');

	const sentenceEnd = Math.max(lastPeriod, lastExclamation);

	if (sentenceEnd > maxLength * 0.7) {
		return text.substring(0, sentenceEnd + 1).trim();
	}

	// Fall back to word boundary
	const lastSpace = truncated.lastIndexOf(' ');
	if (lastSpace > maxLength * 0.8) {
		return text.substring(0, lastSpace).trim() + '...';
	}

	return truncated.trim();
}

/**
 * Pad a short description with a CTA
 */
function padDescription(text: string): string {
	const ctas = [
		'Get free quotes today.',
		'Compare options now.',
		'Find trusted pros.',
		'Read reviews and compare.',
	];

	for (const cta of ctas) {
		const padded = `${text} ${cta}`;
		if (padded.length >= 120 && padded.length <= 160) {
			return padded;
		}
	}

	return text;
}

// ============================================================================
// ROBOTS META
// ============================================================================

/**
 * Determine the robots meta value for a page
 */
export function determineRobots(pageType: string): string {
	// Most pages should be indexed
	const noIndexTypes = ['thank-you', 'confirmation', 'error', '404', '500'];

	if (noIndexTypes.includes(pageType)) {
		return 'noindex, nofollow';
	}

	// Legal pages can be indexed but not followed
	if (['privacy', 'terms', 'legal'].includes(pageType)) {
		return 'index, nofollow';
	}

	return 'index, follow';
}

// ============================================================================
// OPEN GRAPH
// ============================================================================

/**
 * Generate Open Graph meta tags
 */
export function generateOpenGraph(
	page: PageBrief,
	blueprint: SitePlannerOutput,
	optimizedTitle: string,
	optimizedDescription: string,
): OpenGraphMeta {
	const baseUrl = blueprint.structure.baseUrl;

	// Determine OG type based on page type
	let ogType = 'website';
	if (
		[
			'article',
			'guide',
			'cost_guide',
			'troubleshooting',
			'buying_guide',
		].includes(page.type)
	) {
		ogType = 'article';
	} else if (page.type === 'provider_profile') {
		ogType = 'profile';
	}

	return {
		title: optimizedTitle,
		description: optimizedDescription,
		type: ogType,
		url: `${baseUrl}${page.url}`,
		image: `${baseUrl}/og-image.png`, // Default OG image
		siteName: blueprint.brand.name,
	};
}

// ============================================================================
// TWITTER CARDS
// ============================================================================

/**
 * Generate Twitter Card meta tags
 */
export function generateTwitterCard(
	optimizedTitle: string,
	optimizedDescription: string,
	baseUrl: string,
): TwitterMeta {
	return {
		card: 'summary_large_image',
		title: optimizedTitle,
		description: optimizedDescription,
		image: `${baseUrl}/twitter-card.png`,
	};
}

// ============================================================================
// GEO META
// ============================================================================

/**
 * Generate geo meta tags for local pages
 */
export function generateGeoMeta(
	city: string,
	state: string,
	lat?: number,
	lng?: number,
): GeoMeta | undefined {
	if (!lat || !lng) return undefined;

	// Convert state name to abbreviation if needed
	const stateAbbrev = state.length > 2 ? getStateAbbreviation(state) : state;

	return {
		region: `US-${stateAbbrev}`,
		placename: city,
		position: `${lat};${lng}`,
	};
}

/**
 * Get state abbreviation from full name
 */
function getStateAbbreviation(stateName: string): string {
	const states: Record<string, string> = {
		alabama: 'AL',
		alaska: 'AK',
		arizona: 'AZ',
		arkansas: 'AR',
		california: 'CA',
		colorado: 'CO',
		connecticut: 'CT',
		delaware: 'DE',
		florida: 'FL',
		georgia: 'GA',
		hawaii: 'HI',
		idaho: 'ID',
		illinois: 'IL',
		indiana: 'IN',
		iowa: 'IA',
		kansas: 'KS',
		kentucky: 'KY',
		louisiana: 'LA',
		maine: 'ME',
		maryland: 'MD',
		massachusetts: 'MA',
		michigan: 'MI',
		minnesota: 'MN',
		mississippi: 'MS',
		missouri: 'MO',
		montana: 'MT',
		nebraska: 'NE',
		nevada: 'NV',
		'new hampshire': 'NH',
		'new jersey': 'NJ',
		'new mexico': 'NM',
		'new york': 'NY',
		'north carolina': 'NC',
		'north dakota': 'ND',
		ohio: 'OH',
		oklahoma: 'OK',
		oregon: 'OR',
		pennsylvania: 'PA',
		'rhode island': 'RI',
		'south carolina': 'SC',
		'south dakota': 'SD',
		tennessee: 'TN',
		texas: 'TX',
		utah: 'UT',
		vermont: 'VT',
		virginia: 'VA',
		washington: 'WA',
		'west virginia': 'WV',
		wisconsin: 'WI',
		wyoming: 'WY',
	};

	return (
		states[stateName.toLowerCase()] || stateName.substring(0, 2).toUpperCase()
	);
}

// ============================================================================
// MAIN OPTIMIZER
// ============================================================================

/**
 * Optimize all meta tags for a page
 */
export function optimizeMetaTags(
	page: PageBrief,
	blueprint: SitePlannerOutput,
): MetaTags {
	const city = blueprint.meta.city;
	const state = blueprint.meta.state;
	const brandName = blueprint.brand.name;
	const baseUrl = blueprint.structure.baseUrl;

	// Get templates from page SEO
	const titleTemplate =
		page.seo?.titleTemplate ||
		`${page.seo?.primaryKeyword || 'Page'} in [City]`;
	const descriptionTemplate =
		page.seo?.descriptionTemplate ||
		`Find the best ${page.seo?.primaryKeyword || 'services'} in [City], [State].`;

	// Optimize title and description
	const title = optimizeTitle(titleTemplate, page, brandName, city, state);
	const description = optimizeDescription(
		descriptionTemplate,
		page,
		city,
		state,
	);

	// Generate OG and Twitter cards
	const openGraph = generateOpenGraph(page, blueprint, title, description);
	const twitter = generateTwitterCard(title, description, baseUrl);

	// Generate geo meta for local pages
	const geo = generateGeoMeta(city, state);

	return {
		title,
		titleLength: title.length,
		description,
		descriptionLength: description.length,
		canonical: `${baseUrl}${page.url}`,
		robots: determineRobots(page.type),
		openGraph,
		twitter,
		geo,
	};
}
