import { ProviderData } from './nodes';

/**
 * Enrichment data extracted from a provider's website
 */
export interface ProviderEnrichment {
	// Services offered
	services: string[];
	serviceDescriptions: Record<string, string>;

	// Pricing information
	pricing: {
		listed: Array<{ service: string; price: string }>;
		freeEstimates: boolean;
		financing: boolean;
	};

	// About the company
	about: {
		companyStory: string | null;
		yearEstablished: number | null;
		ownerName: string | null;
		teamSize: string | null;
	};

	// Credentials and certifications
	credentials: {
		licenseNumbers: string[];
		certifications: string[];
		insuranceMentioned: boolean;
		associations: string[];
	};

	// Service area coverage
	serviceArea: string[];

	// Business hours
	hours: Record<string, string> | null;

	// Emergency/24-7 service
	emergencyService: boolean;

	// Brands worked with or sold
	brands: string[];

	// Customer testimonials from website
	testimonials: Array<{
		text: string;
		author?: string;
	}>;

	// Images found on site
	images: {
		logo: string | null;
		teamPhotos: string[];
		workPhotos: string[];
	};

	// Social media links
	socialLinks: Record<string, string>;

	// Metadata
	lastScraped: string; // ISO timestamp
	scrapingConfidence: number; // 0-100
	scrapingError: string | null;
}

/**
 * Website discovery result from SERP search
 */
export interface WebsiteDiscovery {
	discoveredUrl: string | null;
	discoverySource: 'serp_organic' | 'phone_lookup' | 'original' | null;
	discoveryConfidence: number; // 0-100
	discoveredAt: string | null; // ISO timestamp
}

/**
 * Create empty website discovery data
 */
export function createEmptyDiscovery(): WebsiteDiscovery {
	return {
		discoveredUrl: null,
		discoverySource: null,
		discoveryConfidence: 0,
		discoveredAt: null,
	};
}

/**
 * Provider data enriched with website scraping results
 */
export interface EnrichedProvider extends ProviderData {
	enrichment: ProviderEnrichment;
	websiteDiscovery?: WebsiteDiscovery;
}

/**
 * Create empty enrichment data for providers without websites
 */
export function createEmptyEnrichment(error?: string): ProviderEnrichment {
	return {
		services: [],
		serviceDescriptions: {},
		pricing: {
			listed: [],
			freeEstimates: false,
			financing: false,
		},
		about: {
			companyStory: null,
			yearEstablished: null,
			ownerName: null,
			teamSize: null,
		},
		credentials: {
			licenseNumbers: [],
			certifications: [],
			insuranceMentioned: false,
			associations: [],
		},
		serviceArea: [],
		hours: null,
		emergencyService: false,
		brands: [],
		testimonials: [],
		images: {
			logo: null,
			teamPhotos: [],
			workPhotos: [],
		},
		socialLinks: {},
		lastScraped: new Date().toISOString(),
		scrapingConfidence: 0,
		scrapingError: error || null,
	};
}

/**
 * Firecrawl extraction schema for provider websites
 * This schema is sent to Firecrawl's /scrape endpoint with extract format
 */
export const FIRECRAWL_EXTRACTION_SCHEMA = {
	type: 'object',
	properties: {
		services: {
			type: 'array',
			items: { type: 'string' },
			description: 'List of services offered by the company',
		},
		serviceDescriptions: {
			type: 'object',
			additionalProperties: { type: 'string' },
			description: 'Map of service name to detailed description',
		},
		pricing: {
			type: 'object',
			properties: {
				listed: {
					type: 'array',
					items: {
						type: 'object',
						properties: {
							service: { type: 'string' },
							price: { type: 'string' },
						},
					},
				},
				freeEstimates: { type: 'boolean' },
				financing: { type: 'boolean' },
			},
		},
		about: {
			type: 'object',
			properties: {
				companyStory: { type: 'string', nullable: true },
				yearEstablished: { type: 'number', nullable: true },
				ownerName: { type: 'string', nullable: true },
				teamSize: { type: 'string', nullable: true },
			},
		},
		credentials: {
			type: 'object',
			properties: {
				licenseNumbers: { type: 'array', items: { type: 'string' } },
				certifications: { type: 'array', items: { type: 'string' } },
				insuranceMentioned: { type: 'boolean' },
				associations: { type: 'array', items: { type: 'string' } },
			},
		},
		serviceArea: {
			type: 'array',
			items: { type: 'string' },
			description: 'Cities, counties, or areas served',
		},
		hours: {
			type: 'object',
			additionalProperties: { type: 'string' },
			nullable: true,
			description: 'Business hours by day of week',
		},
		emergencyService: {
			type: 'boolean',
			description: 'Whether 24/7 or emergency service is offered',
		},
		brands: {
			type: 'array',
			items: { type: 'string' },
			description: 'Brand names mentioned (manufacturers, products)',
		},
		testimonials: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					text: { type: 'string' },
					author: { type: 'string' },
				},
			},
		},
		images: {
			type: 'object',
			properties: {
				logo: { type: 'string', nullable: true },
				teamPhotos: { type: 'array', items: { type: 'string' } },
				workPhotos: { type: 'array', items: { type: 'string' } },
			},
		},
		socialLinks: {
			type: 'object',
			additionalProperties: { type: 'string' },
			description: 'Social media links (facebook, instagram, etc.)',
		},
	},
	required: ['services', 'pricing', 'about', 'credentials'],
};
