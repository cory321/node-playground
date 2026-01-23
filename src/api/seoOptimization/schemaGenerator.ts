// Schema Markup Generator
// Generates JSON-LD structured data for various page types

import { SchemaMarkup } from '@/types/seoPackage';
import { SitePlannerOutput, PageBrief } from '@/types/sitePlanner';
import { EnrichedProvider } from '@/types/enrichedProvider';

// ============================================================================
// SCHEMA TYPE HELPERS
// ============================================================================

function determineBusinessType(category: string): string {
	// Map category to appropriate LocalBusiness subtype
	const categoryMapping: Record<string, string> = {
		plumber: 'Plumber',
		plumbing: 'Plumber',
		electrician: 'Electrician',
		electrical: 'Electrician',
		hvac: 'HVACBusiness',
		'air conditioning': 'HVACBusiness',
		heating: 'HVACBusiness',
		roofing: 'RoofingContractor',
		roofer: 'RoofingContractor',
		landscaping: 'LandscapingBusiness',
		landscaper: 'LandscapingBusiness',
		locksmith: 'Locksmith',
		painter: 'HousePainter',
		painting: 'HousePainter',
		moving: 'MovingCompany',
		mover: 'MovingCompany',
		cleaning: 'HousekeepingService',
		'pest control': 'PestControlService',
		'garage door': 'HomeAndConstructionBusiness',
	};

	const lowerCategory = category?.toLowerCase() || '';
	for (const [key, value] of Object.entries(categoryMapping)) {
		if (lowerCategory.includes(key)) {
			return value;
		}
	}

	return 'LocalBusiness';
}

// ============================================================================
// SCHEMA GENERATORS
// ============================================================================

/**
 * Generate LocalBusiness schema for provider profiles
 */
export function generateProviderSchema(
	provider: EnrichedProvider,
	blueprint: SitePlannerOutput,
	pageUrl: string,
): SchemaMarkup {
	const baseUrl = blueprint.structure.baseUrl;
	const category = blueprint.meta.category;
	const businessType = determineBusinessType(category);

	const schema: Record<string, unknown> = {
		'@context': 'https://schema.org',
		'@type': businessType,
		'@id': `${baseUrl}${pageUrl}/#business`,
		name: provider.name,
		url: `${baseUrl}${pageUrl}`,
		telephone: provider.phone || undefined,
		priceRange: '$$', // Default price range
	};

	// Add address if available
	if (provider.address) {
		schema.address = {
			'@type': 'PostalAddress',
			streetAddress: provider.address,
			addressLocality: blueprint.meta.city,
			addressRegion: blueprint.meta.state,
			addressCountry: 'US',
		};
	}

	// Add service area from enrichment
	const serviceArea = provider.enrichment?.serviceArea;
	if (serviceArea && serviceArea.length > 0) {
		schema.areaServed = serviceArea.map((city: string) => ({
			'@type': 'City',
			name: city,
		}));
	}

	// Add aggregate rating if reviews exist
	if (
		provider.googleRating &&
		provider.googleReviewCount &&
		provider.googleReviewCount > 0
	) {
		schema.aggregateRating = {
			'@type': 'AggregateRating',
			ratingValue: provider.googleRating,
			reviewCount: provider.googleReviewCount,
			bestRating: '5',
			worstRating: '1',
		};
	}

	// Add image if available from enrichment
	const logo = provider.enrichment?.images?.logo;
	if (logo) {
		schema.image = logo;
	}

	// Add website
	if (provider.website) {
		schema.sameAs = [provider.website];
	}

	return {
		type: businessType,
		json: schema,
		valid: true,
	};
}

/**
 * Generate AggregateRating schema
 */
export function generateAggregateRatingSchema(
	provider: EnrichedProvider,
	baseUrl: string,
	pageUrl: string,
): SchemaMarkup | null {
	if (
		!provider.googleRating ||
		!provider.googleReviewCount ||
		provider.googleReviewCount === 0
	) {
		return null;
	}

	const schema = {
		'@context': 'https://schema.org',
		'@type': 'AggregateRating',
		'@id': `${baseUrl}${pageUrl}/#aggregateRating`,
		itemReviewed: {
			'@type': 'LocalBusiness',
			'@id': `${baseUrl}${pageUrl}/#business`,
		},
		ratingValue: provider.googleRating,
		reviewCount: provider.googleReviewCount,
		bestRating: '5',
		worstRating: '1',
	};

	return {
		type: 'AggregateRating',
		json: schema,
		valid: true,
	};
}

/**
 * Generate Article schema for editorial content
 */
export function generateArticleSchema(
	page: PageBrief,
	blueprint: SitePlannerOutput,
	publishDate?: string,
	modifiedDate?: string,
): SchemaMarkup {
	const baseUrl = blueprint.structure.baseUrl;

	const schema = {
		'@context': 'https://schema.org',
		'@type': 'Article',
		'@id': `${baseUrl}${page.url}/#article`,
		headline: page.seo?.titleTemplate || page.seo?.primaryKeyword || 'Article',
		image: `${baseUrl}/article-image.png`,
		datePublished: publishDate || new Date().toISOString(),
		dateModified: modifiedDate || new Date().toISOString(),
		author: {
			'@type': 'Person',
			name: blueprint.brand.name + ' Team',
		},
		publisher: {
			'@type': 'Organization',
			name: blueprint.brand.name,
			logo: {
				'@type': 'ImageObject',
				url: `${baseUrl}/logo.png`,
			},
		},
		mainEntityOfPage: {
			'@type': 'WebPage',
			'@id': `${baseUrl}${page.url}`,
		},
	};

	return {
		type: 'Article',
		json: schema,
		valid: true,
	};
}

/**
 * Generate FAQPage schema
 */
export function generateFAQPageSchema(
	faqs: Array<{ question: string; answer: string }>,
	baseUrl: string,
	pageUrl: string,
): SchemaMarkup {
	const schema = {
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		'@id': `${baseUrl}${pageUrl}/#faq`,
		mainEntity: faqs.map((faq) => ({
			'@type': 'Question',
			name: faq.question,
			acceptedAnswer: {
				'@type': 'Answer',
				text: faq.answer,
			},
		})),
	};

	return {
		type: 'FAQPage',
		json: schema,
		valid: true,
	};
}

/**
 * Generate BreadcrumbList schema
 */
export function generateBreadcrumbSchema(
	breadcrumbs: Array<{ name: string; url: string }>,
	baseUrl: string,
): SchemaMarkup {
	const schema = {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: breadcrumbs.map((crumb, index) => ({
			'@type': 'ListItem',
			position: index + 1,
			name: crumb.name,
			item: crumb.url.startsWith('http') ? crumb.url : `${baseUrl}${crumb.url}`,
		})),
	};

	return {
		type: 'BreadcrumbList',
		json: schema,
		valid: true,
	};
}

/**
 * Generate ItemList schema for comparison pages
 */
export function generateItemListSchema(
	providers: EnrichedProvider[],
	city: string,
	category: string,
	baseUrl: string,
	pageUrl: string,
): SchemaMarkup {
	const schema = {
		'@context': 'https://schema.org',
		'@type': 'ItemList',
		'@id': `${baseUrl}${pageUrl}/#itemList`,
		name: `Best ${category} Companies in ${city}`,
		description: `Compare the top ${providers.length} ${category} companies in ${city}`,
		numberOfItems: providers.length,
		itemListElement: providers.map((provider, index) => ({
			'@type': 'ListItem',
			position: index + 1,
			item: {
				'@type': 'LocalBusiness',
				name: provider.name,
				aggregateRating:
					provider.googleRating && provider.googleReviewCount
						? {
								'@type': 'AggregateRating',
								ratingValue: provider.googleRating,
								reviewCount: provider.googleReviewCount,
							}
						: undefined,
			},
		})),
	};

	return {
		type: 'ItemList',
		json: schema,
		valid: true,
	};
}

/**
 * Generate Organization schema (site-wide)
 */
export function generateOrganizationSchema(
	blueprint: SitePlannerOutput,
): Record<string, unknown> {
	const baseUrl = blueprint.structure.baseUrl;

	return {
		'@context': 'https://schema.org',
		'@type': 'Organization',
		'@id': `${baseUrl}/#organization`,
		name: blueprint.brand.name,
		url: baseUrl,
		logo: {
			'@type': 'ImageObject',
			'@id': `${baseUrl}/#logo`,
			url: `${baseUrl}/logo.png`,
		},
		sameAs: [], // Add social links if available
	};
}

/**
 * Generate WebSite schema (site-wide)
 */
export function generateWebsiteSchema(
	blueprint: SitePlannerOutput,
): Record<string, unknown> {
	const baseUrl = blueprint.structure.baseUrl;

	return {
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		'@id': `${baseUrl}/#website`,
		url: baseUrl,
		name: blueprint.brand.name,
		publisher: {
			'@id': `${baseUrl}/#organization`,
		},
		potentialAction: {
			'@type': 'SearchAction',
			target: {
				'@type': 'EntryPoint',
				urlTemplate: `${baseUrl}/search?q={search_term_string}`,
			},
			'query-input': 'required name=search_term_string',
		},
	};
}

// ============================================================================
// MAIN GENERATOR
// ============================================================================

/**
 * Generate all appropriate schema markup for a page
 */
export function generateSchemaMarkup(
	page: PageBrief,
	blueprint: SitePlannerOutput,
	provider?: EnrichedProvider,
	faqs?: Array<{ question: string; answer: string }>,
	breadcrumbs?: Array<{ name: string; url: string }>,
): SchemaMarkup[] {
	const schemas: SchemaMarkup[] = [];
	const baseUrl = blueprint.structure.baseUrl;

	// Always add breadcrumb schema
	const defaultBreadcrumbs = breadcrumbs || [
		{ name: 'Home', url: '/' },
		{ name: page.seo?.primaryKeyword || 'Page', url: page.url },
	];
	schemas.push(generateBreadcrumbSchema(defaultBreadcrumbs, baseUrl));

	// Provider profile pages
	if (page.type === 'provider_profile' && provider) {
		schemas.push(generateProviderSchema(provider, blueprint, page.url));

		const ratingSchema = generateAggregateRatingSchema(
			provider,
			baseUrl,
			page.url,
		);
		if (ratingSchema) {
			schemas.push(ratingSchema);
		}
	}

	// Article-type pages
	const articleTypes = [
		'cost_guide',
		'troubleshooting',
		'buying_guide',
		'diy_guide',
		'guide',
		'article',
		'local_expertise',
	];
	if (articleTypes.includes(page.type)) {
		schemas.push(generateArticleSchema(page, blueprint));
	}

	// FAQ schema
	if (faqs && faqs.length > 0) {
		schemas.push(generateFAQPageSchema(faqs, baseUrl, page.url));
	}

	// Comparison pages
	if (page.type === 'comparison' && blueprint.providers) {
		schemas.push(
			generateItemListSchema(
				blueprint.providers,
				blueprint.meta.city,
				blueprint.meta.category,
				baseUrl,
				page.url,
			),
		);
	}

	return schemas;
}

/**
 * Validate a schema object
 */
export function validateSchema(schema: SchemaMarkup): SchemaMarkup {
	const errors: string[] = [];

	// Check for required @context
	if (!schema.json['@context']) {
		errors.push('Missing @context property');
	}

	// Check for required @type
	if (!schema.json['@type']) {
		errors.push('Missing @type property');
	}

	// Type-specific validation
	switch (schema.type) {
		case 'LocalBusiness':
		case 'Plumber':
		case 'Electrician':
		case 'HVACBusiness':
			if (!schema.json['name']) {
				errors.push('LocalBusiness: Missing required name property');
			}
			break;

		case 'Article':
			if (!schema.json['headline']) {
				errors.push('Article: Missing required headline property');
			}
			if (!schema.json['author']) {
				errors.push('Article: Missing required author property');
			}
			break;

		case 'FAQPage':
			if (
				!schema.json['mainEntity'] ||
				!Array.isArray(schema.json['mainEntity'])
			) {
				errors.push('FAQPage: Missing or invalid mainEntity array');
			}
			break;

		case 'BreadcrumbList':
			if (
				!schema.json['itemListElement'] ||
				!Array.isArray(schema.json['itemListElement'])
			) {
				errors.push('BreadcrumbList: Missing or invalid itemListElement array');
			}
			break;
	}

	return {
		...schema,
		valid: errors.length === 0,
		errors: errors.length > 0 ? errors : undefined,
	};
}
