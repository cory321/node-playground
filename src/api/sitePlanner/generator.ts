// Site Planner Generator - Algorithmic page brief generation
import { LocationData } from '@/types/nodes';
import { EnrichedProvider } from '@/types/enrichedProvider';
import { LocalKnowledgeOutput } from '@/types/localKnowledge';
import {
	PageBrief,
	PageType,
	SiteDepth,
	BrandIdentity,
	ContentCluster,
	InternalLinkingRules,
	LaunchPhase,
	PAGE_TEMPLATES,
	slugify,
	generatePageId,
} from '@/types/sitePlanner';
import {
	EEAT_TEMPLATES,
	UNIQUE_VALUE_TEMPLATES,
	getTroubleshootingTopics,
} from './templates';

// ============================================================================
// PAGE GENERATION FUNCTIONS
// ============================================================================

/**
 * Generate all pages for the site
 */
export function generatePages(
	location: LocationData,
	category: string,
	providers: EnrichedProvider[],
	localKnowledge: LocalKnowledgeOutput | null,
	depth: SiteDepth,
	brand: BrandIdentity
): PageBrief[] {
	const pages: PageBrief[] = [];
	const citySlug = slugify(location.name);

	// Extract unique cities from providers (including main location)
	const cities = extractCities(location, providers);
	const services = extractServices(category, providers);

	// Foundation pages (always created)
	pages.push(createHomepage(location, category, brand, providers.length));
	pages.push(createAboutPage(location, brand));
	pages.push(createMethodologyPage(location, category));
	pages.push(createContactPage(location));
	pages.push(...createLegalPages());

	// Service hub pages
	for (const service of services) {
		pages.push(createServiceHub(service, location, citySlug));
	}

	// City+Service pages (for each city × service)
	for (const city of cities) {
		for (const service of services) {
			pages.push(
				createCityServicePage(city, location.state, service, localKnowledge)
			);
		}

		// Provider listing per city
		const cityProviders = providers.filter(
			(p) =>
				slugify(p.enrichment?.serviceArea?.[0] || '') === slugify(city) ||
				city === location.name
		);
		pages.push(createProviderListing(city, location.state, cityProviders));
	}

	// Provider profiles
	for (const provider of providers) {
		pages.push(createProviderProfile(provider, location));
	}

	// Depth-dependent pages
	if (depth !== 'mvp') {
		// Cost guides (1 per service)
		for (const service of services) {
			pages.push(createCostGuide(service, location));
		}

		// Comparison page per city
		for (const city of cities) {
			const cityProviders = providers.filter(
				(p) =>
					slugify(p.enrichment?.serviceArea?.[0] || '') === slugify(city) ||
					city === location.name
			);
			if (cityProviders.length >= 2) {
				pages.push(createComparisonPage(city, location.state, category, cityProviders));
			}
		}

		// Troubleshooting articles (5 for standard)
		pages.push(...createTroubleshootingArticles(category, location, 5));
	}

	if (depth === 'comprehensive') {
		// Additional troubleshooting (3 more)
		pages.push(...createTroubleshootingArticles(category, location, 3, 5));
	}

	return pages;
}

/**
 * Extract unique cities from providers
 */
function extractCities(
	location: LocationData,
	providers: EnrichedProvider[]
): string[] {
	const cities = new Set<string>([location.name]);

	for (const provider of providers) {
		// Add cities from service areas
		if (provider.enrichment?.serviceArea) {
			for (const area of provider.enrichment.serviceArea.slice(0, 3)) {
				if (area && area.length > 0) {
					cities.add(area);
				}
			}
		}
	}

	return Array.from(cities).slice(0, 5); // Max 5 cities
}

/**
 * Extract services (main category + any sub-services from providers)
 */
function extractServices(
	mainCategory: string,
	_providers: EnrichedProvider[] // Could extract sub-services from enrichment data
): string[] {
	const services = new Set<string>([mainCategory]);
	// For now, keep it simple with just the main category
	return Array.from(services);
}

// ============================================================================
// INDIVIDUAL PAGE CREATORS
// ============================================================================

function createHomepage(
	location: LocationData,
	category: string,
	brand: BrandIdentity,
	_providerCount: number // Available for future use in trust indicators
): PageBrief {
	const template = PAGE_TEMPLATES.homepage;

	return {
		id: 'homepage',
		type: 'homepage',
		url: '/',
		priority: 1,
		seo: {
			titleTemplate: `${brand.name} | Trusted Local ${category}`,
			descriptionTemplate: `Find vetted ${category.toLowerCase()} professionals in ${location.name}. Compare verified pros, read real reviews, get fair pricing.`,
			primaryKeyword: `${location.name.toLowerCase()} ${category.toLowerCase()}`,
			secondaryKeywords: [
				`${category.toLowerCase()} ${location.name.toLowerCase()}`,
				`${location.name.toLowerCase()} ${category.toLowerCase()} companies`,
				`best ${category.toLowerCase()} near ${location.name.toLowerCase()}`,
			],
		},
		content: {
			purpose: 'Establish as the trusted local resource for services',
			targetWordCount: template.targetWordCount,
			requiredSections: template.requiredSections,
			localMentionsMin: template.localMentionsMin,
			eeat: EEAT_TEMPLATES.homepage,
			uniqueValue: UNIQUE_VALUE_TEMPLATES.homepage,
		},
		reviews: {
			required: true,
			minimumCount: 3,
			sources: ['google', 'direct'],
		},
		data: {
			city: location.name,
			providers: [], // Will be populated with featured provider IDs
		},
		internalLinks: {
			required: [
				{ toPageId: 'methodology', anchorPattern: 'how we vet providers' },
			],
		},
		schema: template.schemaTypes,
	};
}

function createAboutPage(
	location: LocationData,
	brand: BrandIdentity
): PageBrief {
	const template = PAGE_TEMPLATES.about;

	return {
		id: 'about',
		type: 'about',
		url: '/about',
		priority: 1,
		seo: {
			titleTemplate: `About ${brand.name} | Our Story`,
			descriptionTemplate: `Learn about ${brand.name} and our mission to connect ${location.name} homeowners with trusted local professionals.`,
			primaryKeyword: `about ${brand.name.toLowerCase()}`,
			secondaryKeywords: [],
		},
		content: {
			purpose: 'Establish local credibility and trust',
			targetWordCount: template.targetWordCount,
			requiredSections: template.requiredSections,
			localMentionsMin: template.localMentionsMin,
			eeat: EEAT_TEMPLATES.about,
			uniqueValue: UNIQUE_VALUE_TEMPLATES.about,
		},
		data: {
			city: location.name,
		},
		internalLinks: {
			required: [
				{ toPageId: 'methodology', anchorPattern: 'our vetting process' },
			],
		},
		schema: template.schemaTypes,
	};
}

function createMethodologyPage(
	location: LocationData,
	category: string
): PageBrief {
	const template = PAGE_TEMPLATES.methodology;

	return {
		id: 'methodology',
		type: 'methodology',
		url: '/how-we-vet-providers',
		priority: 1,
		seo: {
			titleTemplate: `How We Vet ${category} Providers | Our Process`,
			descriptionTemplate: `Learn how we verify and vet ${category.toLowerCase()} professionals in ${location.name}. Our rigorous process ensures you only see trusted providers.`,
			primaryKeyword: `how we vet ${category.toLowerCase()} providers`,
			secondaryKeywords: [],
		},
		content: {
			purpose: 'Build trust by showing rigorous vetting process',
			targetWordCount: template.targetWordCount,
			requiredSections: template.requiredSections,
			localMentionsMin: template.localMentionsMin,
			eeat: EEAT_TEMPLATES.methodology,
			uniqueValue: UNIQUE_VALUE_TEMPLATES.methodology,
		},
		data: {
			city: location.name,
		},
		internalLinks: {
			required: [],
		},
		schema: template.schemaTypes,
	};
}

function createContactPage(location: LocationData): PageBrief {
	const template = PAGE_TEMPLATES.contact;

	return {
		id: 'contact',
		type: 'contact',
		url: '/contact',
		priority: 1,
		seo: {
			titleTemplate: 'Contact Us',
			descriptionTemplate: `Get in touch with us. We're here to help ${location.name} homeowners find trusted service providers.`,
			primaryKeyword: 'contact us',
			secondaryKeywords: [],
		},
		content: {
			purpose: 'Easy access to help',
			targetWordCount: template.targetWordCount,
			requiredSections: template.requiredSections,
			localMentionsMin: template.localMentionsMin,
			eeat: EEAT_TEMPLATES.contact,
			uniqueValue: UNIQUE_VALUE_TEMPLATES.contact,
		},
		data: {
			city: location.name,
		},
		internalLinks: {
			required: [],
		},
		schema: template.schemaTypes,
	};
}

function createLegalPages(): PageBrief[] {
	const template = PAGE_TEMPLATES.legal;
	const legalPages = ['privacy', 'terms', 'disclosure'];

	return legalPages.map((legalType) => ({
		id: `legal-${legalType}`,
		type: 'legal' as PageType,
		url: `/${legalType}`,
		priority: 1,
		seo: {
			titleTemplate:
				legalType === 'privacy'
					? 'Privacy Policy'
					: legalType === 'terms'
						? 'Terms of Service'
						: 'Affiliate Disclosure',
			descriptionTemplate: '',
			primaryKeyword: '',
			secondaryKeywords: [],
		},
		content: {
			purpose: `Provide ${legalType} information`,
			targetWordCount: template.targetWordCount,
			requiredSections: template.requiredSections,
			localMentionsMin: 0,
			eeat: EEAT_TEMPLATES.legal,
			uniqueValue: UNIQUE_VALUE_TEMPLATES.legal,
		},
		data: {},
		internalLinks: {
			required: [],
		},
		schema: [],
	}));
}

function createServiceHub(
	service: string,
	location: LocationData,
	_citySlug: string // Reserved for city-specific service hubs
): PageBrief {
	const template = PAGE_TEMPLATES.service_hub;
	const serviceSlug = slugify(service);

	return {
		id: generatePageId('service_hub', service),
		type: 'service_hub',
		url: `/${serviceSlug}`,
		priority: 1,
		seo: {
			titleTemplate: `${service} Services in ${location.name} Area`,
			descriptionTemplate: `Find trusted ${service.toLowerCase()} services in the ${location.name} area. Compare vetted professionals, read reviews, and get fair quotes.`,
			primaryKeyword: `${service.toLowerCase()} ${location.name.toLowerCase()}`,
			secondaryKeywords: [
				`${service.toLowerCase()} services`,
				`${service.toLowerCase()} near me`,
			],
		},
		content: {
			purpose: `Comprehensive overview of ${service} services`,
			targetWordCount: template.targetWordCount,
			requiredSections: template.requiredSections,
			localMentionsMin: template.localMentionsMin,
			eeat: EEAT_TEMPLATES.service_hub,
			uniqueValue: UNIQUE_VALUE_TEMPLATES.service_hub,
		},
		data: {
			services: [service],
			city: location.name,
		},
		internalLinks: {
			required: [
				{
					toPageId: generatePageId('city_service', location.name, service),
					anchorPattern: `${service} in ${location.name}`,
				},
			],
		},
		schema: template.schemaTypes,
	};
}

function createCityServicePage(
	city: string,
	state: string,
	service: string,
	localKnowledge: LocalKnowledgeOutput | null
): PageBrief {
	const template = PAGE_TEMPLATES.city_service;
	const citySlug = slugify(city);
	const serviceSlug = slugify(service);

	// Customize E-E-A-T with local knowledge if available
	const eeat = { ...EEAT_TEMPLATES.city_service };
	if (localKnowledge?.contentHooks?.categorySpecificIssues) {
		eeat.experienceSignals = [
			...eeat.experienceSignals,
			...localKnowledge.contentHooks.categorySpecificIssues.slice(0, 2),
		];
	}

	return {
		id: generatePageId('city_service', city, service),
		type: 'city_service',
		url: `/${citySlug}/${serviceSlug}`,
		priority: 1,
		seo: {
			titleTemplate: `${service} in ${city}, ${state}`,
			descriptionTemplate: `Need ${service.toLowerCase()} in ${city}? Compare vetted local pros, see pricing, read verified reviews.`,
			primaryKeyword: `${service.toLowerCase()} ${city.toLowerCase()}`,
			secondaryKeywords: [
				`${city.toLowerCase()} ${service.toLowerCase()}`,
				`${service.toLowerCase()} service ${city.toLowerCase()} ${state.toLowerCase()}`,
			],
		},
		content: {
			purpose: `Help ${city} homeowners find reliable ${service.toLowerCase()}`,
			targetWordCount: template.targetWordCount,
			requiredSections: template.requiredSections,
			localMentionsMin: template.localMentionsMin,
			eeat,
			uniqueValue: UNIQUE_VALUE_TEMPLATES.city_service,
		},
		reviews: {
			required: true,
			minimumCount: 2,
			sources: ['google'],
		},
		data: {
			services: [service],
			city,
		},
		internalLinks: {
			required: [
				{
					toPageId: generatePageId('provider_listing', city),
					anchorPattern: `view all ${city} providers`,
				},
				{
					toPageId: generatePageId('cost_guide', service),
					anchorPattern: `${service.toLowerCase()} costs`,
				},
			],
		},
		schema: template.schemaTypes,
	};
}

function createProviderListing(
	city: string,
	state: string,
	providers: EnrichedProvider[]
): PageBrief {
	const template = PAGE_TEMPLATES.provider_listing;
	const citySlug = slugify(city);

	return {
		id: generatePageId('provider_listing', city),
		type: 'provider_listing',
		url: `/${citySlug}/providers`,
		priority: 2,
		seo: {
			titleTemplate: `Top Verified Providers in ${city}, ${state}`,
			descriptionTemplate: `Browse vetted service providers in ${city}. All providers verified for licensing, insurance, and quality.`,
			primaryKeyword: `${city.toLowerCase()} service providers`,
			secondaryKeywords: [`providers in ${city.toLowerCase()}`],
		},
		content: {
			purpose: `List verified providers serving ${city}`,
			targetWordCount: template.targetWordCount,
			requiredSections: template.requiredSections,
			localMentionsMin: template.localMentionsMin,
			eeat: EEAT_TEMPLATES.provider_listing,
			uniqueValue: UNIQUE_VALUE_TEMPLATES.provider_listing,
		},
		reviews: {
			required: true,
			minimumCount: providers.length,
			sources: ['google'],
		},
		data: {
			city,
			providers: providers.map((p) => p.id),
		},
		internalLinks: {
			required: providers.slice(0, 5).map((p) => ({
				toPageId: generatePageId('provider_profile', p.name),
				anchorPattern: p.name,
			})),
		},
		schema: template.schemaTypes,
	};
}

function createProviderProfile(
	provider: EnrichedProvider,
	location: LocationData
): PageBrief {
	const template = PAGE_TEMPLATES.provider_profile;
	const providerSlug = slugify(provider.name);

	return {
		id: generatePageId('provider_profile', provider.name),
		type: 'provider_profile',
		url: `/providers/${providerSlug}`,
		priority: 2,
		seo: {
			titleTemplate: `${provider.name} | Verified Provider`,
			descriptionTemplate: `Learn about ${provider.name}, a verified service provider in ${location.name}. See credentials, reviews, and service areas.`,
			primaryKeyword: provider.name.toLowerCase(),
			secondaryKeywords: [],
		},
		content: {
			purpose: `Help users evaluate ${provider.name}`,
			targetWordCount: template.targetWordCount,
			requiredSections: template.requiredSections,
			localMentionsMin: template.localMentionsMin,
			eeat: EEAT_TEMPLATES.provider_profile,
			uniqueValue: UNIQUE_VALUE_TEMPLATES.provider_profile,
		},
		reviews: {
			required: true,
			minimumCount: 3,
			sources: ['google', 'direct'],
		},
		data: {
			providers: [provider.id],
			city: location.name,
		},
		internalLinks: {
			required: [
				{
					toPageId: generatePageId('provider_listing', location.name),
					anchorPattern: `all ${location.name} providers`,
				},
			],
		},
		schema: template.schemaTypes,
	};
}

function createCostGuide(service: string, location: LocationData): PageBrief {
	const template = PAGE_TEMPLATES.cost_guide;
	const serviceSlug = slugify(service);

	return {
		id: generatePageId('cost_guide', service),
		type: 'cost_guide',
		url: `/${serviceSlug}/cost-guide`,
		priority: 2,
		seo: {
			titleTemplate: `${service} Cost Guide | ${location.name} Pricing`,
			descriptionTemplate: `How much does ${service.toLowerCase()} cost in ${location.name}? Get local pricing data, cost factors, and what to expect.`,
			primaryKeyword: `${service.toLowerCase()} cost ${location.name.toLowerCase()}`,
			secondaryKeywords: [
				`${service.toLowerCase()} pricing`,
				`how much does ${service.toLowerCase()} cost`,
			],
		},
		content: {
			purpose: 'Answer pricing questions with local data',
			targetWordCount: template.targetWordCount,
			requiredSections: template.requiredSections,
			localMentionsMin: template.localMentionsMin,
			eeat: EEAT_TEMPLATES.cost_guide,
			uniqueValue: UNIQUE_VALUE_TEMPLATES.cost_guide,
		},
		data: {
			services: [service],
			city: location.name,
		},
		internalLinks: {
			required: [
				{
					toPageId: generatePageId('provider_listing', location.name),
					anchorPattern: 'get quotes from verified providers',
				},
			],
		},
		schema: template.schemaTypes,
	};
}

function createComparisonPage(
	city: string,
	_state: string, // Available for future state-specific content
	_service: string, // Available for service-specific comparisons
	providers: EnrichedProvider[]
): PageBrief {
	const template = PAGE_TEMPLATES.comparison;
	const citySlug = slugify(city);

	return {
		id: generatePageId('comparison', city),
		type: 'comparison',
		url: `/${citySlug}/compare-providers`,
		priority: 3,
		seo: {
			titleTemplate: `Compare ${city} Providers | Side-by-Side`,
			descriptionTemplate: `Compare verified providers in ${city}. See credentials, reviews, and services side-by-side.`,
			primaryKeyword: `compare ${city.toLowerCase()} providers`,
			secondaryKeywords: [],
		},
		content: {
			purpose: 'Help users compare and choose providers',
			targetWordCount: template.targetWordCount,
			requiredSections: template.requiredSections,
			localMentionsMin: template.localMentionsMin,
			eeat: EEAT_TEMPLATES.comparison,
			uniqueValue: UNIQUE_VALUE_TEMPLATES.comparison,
		},
		reviews: {
			required: true,
			minimumCount: providers.length,
			sources: ['google'],
		},
		data: {
			city,
			providers: providers.map((p) => p.id),
		},
		internalLinks: {
			required: providers.slice(0, 3).map((p) => ({
				toPageId: generatePageId('provider_profile', p.name),
				anchorPattern: p.name,
			})),
		},
		schema: template.schemaTypes,
	};
}

function createTroubleshootingArticles(
	category: string,
	location: LocationData,
	count: number,
	startIndex: number = 0
): PageBrief[] {
	const template = PAGE_TEMPLATES.troubleshooting;

	// Common troubleshooting topics by category type
	const topics = getTroubleshootingTopics(category);

	return topics.slice(startIndex, startIndex + count).map((topic) => {
		const topicSlug = slugify(topic);

		return {
			id: generatePageId('troubleshooting', topic),
			type: 'troubleshooting' as PageType,
			url: `/guides/${topicSlug}`,
			priority: 3,
			seo: {
				titleTemplate: topic,
				descriptionTemplate: `${topic} - step-by-step guide for ${location.name} homeowners. When to DIY and when to call a professional.`,
				primaryKeyword: topic.toLowerCase(),
				secondaryKeywords: [],
			},
			content: {
				purpose: `Help homeowners troubleshoot: ${topic}`,
				targetWordCount: template.targetWordCount,
				requiredSections: template.requiredSections,
				localMentionsMin: template.localMentionsMin,
				eeat: EEAT_TEMPLATES.troubleshooting,
				uniqueValue: UNIQUE_VALUE_TEMPLATES.troubleshooting,
			},
			data: {
				city: location.name,
			},
			internalLinks: {
				required: [
					{
						toPageId: generatePageId('provider_listing', location.name),
						anchorPattern: 'find a professional',
					},
				],
			},
			schema: template.schemaTypes,
		};
	});
}

// ============================================================================
// CONTENT CLUSTER BUILDER
// ============================================================================

export function buildContentClusters(
	pages: PageBrief[],
	mainCategory: string
): ContentCluster[] {
	const clusters: ContentCluster[] = [];

	// Main category cluster
	const serviceHubId = generatePageId('service_hub', mainCategory);
	const serviceHub = pages.find((p) => p.id === serviceHubId);

	if (serviceHub) {
		const supportingPages = pages.filter(
			(p) =>
				p.type === 'city_service' ||
				p.type === 'cost_guide' ||
				p.type === 'troubleshooting'
		);

		clusters.push({
			name: mainCategory,
			pillarPageId: serviceHubId,
			supportingPageIds: supportingPages.map((p) => p.id),
		});
	}

	return clusters;
}

// ============================================================================
// INTERNAL LINKING RULES BUILDER
// ============================================================================

export function buildInternalLinkingRules(): InternalLinkingRules {
	return {
		rules: [
			{
				fromType: 'homepage',
				toType: 'service_hub',
				anchorPattern: '[Service] in [Region]',
				required: true,
			},
			{
				fromType: 'service_hub',
				toType: 'city_service',
				anchorPattern: '[Service] in [City]',
				required: true,
			},
			{
				fromType: 'city_service',
				toType: 'provider_listing',
				anchorPattern: 'Top providers in [City]',
				required: true,
			},
			{
				fromType: 'city_service',
				toType: 'cost_guide',
				anchorPattern: '[Service] cost guide',
				required: true,
			},
			{
				fromType: 'provider_listing',
				toType: 'provider_profile',
				anchorPattern: '[Provider Name]',
				required: true,
			},
			{
				fromType: 'provider_listing',
				toType: 'comparison',
				anchorPattern: 'Compare [City] providers',
				required: true,
			},
			{
				fromType: 'cost_guide',
				toType: 'provider_listing',
				anchorPattern: 'Get quotes from verified providers',
				required: true,
			},
			{
				fromType: 'troubleshooting',
				toType: 'provider_listing',
				anchorPattern: 'Find a professional',
				required: true,
			},
		],
	};
}

// ============================================================================
// LAUNCH PHASE ASSIGNMENT
// ============================================================================

export function assignLaunchPhases(pages: PageBrief[]): LaunchPhase[] {
	const phase1: string[] = [];
	const phase2: string[] = [];
	const phase3: string[] = [];

	for (const page of pages) {
		if (page.priority === 1) {
			phase1.push(page.id);
		} else if (page.priority === 2) {
			phase2.push(page.id);
		} else {
			phase3.push(page.id);
		}
	}

	return [
		{
			phase: 1,
			name: 'Foundation',
			pageIds: phase1,
		},
		{
			phase: 2,
			name: 'Core Pages',
			pageIds: phase2,
		},
		{
			phase: 3,
			name: 'Authority',
			pageIds: phase3,
		},
	];
}
