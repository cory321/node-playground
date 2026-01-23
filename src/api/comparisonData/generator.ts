// Core Comparison Data Generator
import { EnrichedProvider } from '@/types/enrichedProvider';
import { LocalKnowledgeOutput } from '@/types/localKnowledge';
import { SitePlannerOutput } from '@/types/sitePlanner';
import {
	ComparisonPage,
	ComparisonPageContent,
	ComparisonPageSEO,
	ComparisonPageSchema,
	ComparisonTable,
	ComparisonTableRow,
	PricingPage,
	PricingPageContent,
	DetailedComparison,
	FAQItem,
	InternalLink,
	STANDARD_COMPARISON_COLUMNS,
	ItemListSchema,
	FAQPageSchema,
	BreadcrumbListSchema,
} from '@/types/comparisonPage';
import { selectWinners, calculateTrustScore } from './winnerSelector';
import {
	aggregatePricingData,
	generateQuickAnswer,
	generatePriceTable,
	generateCityComparison,
	generateCostFactors,
	generateRealExamples,
	generateSavingTips,
	generateRedFlags,
	generatePricingMethodology,
} from './pricingAnalyzer';
import { calculateMarketStats } from './marketStatsCalculator';

/**
 * Generate a URL-safe slug from a string
 */
function slugify(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

/**
 * Get years in business for a provider
 */
function getYearsInBusiness(provider: EnrichedProvider): string {
	const yearEstablished = provider.enrichment.about.yearEstablished;
	if (!yearEstablished) return 'N/A';
	const years = new Date().getFullYear() - yearEstablished;
	if (years === 0) return 'New';
	if (years === 1) return '1 year';
	return `${years} years`;
}

/**
 * Get price range display for a provider
 */
function getPriceRange(provider: EnrichedProvider): string {
	const listedPrices = provider.enrichment.pricing.listed;
	if (listedPrices.length === 0) {
		if (provider.enrichment.pricing.freeEstimates) {
			return 'Free estimates';
		}
		return 'Call for quote';
	}
	return 'See pricing';
}

/**
 * Build comparison table from providers
 */
export function buildComparisonTable(
	providers: EnrichedProvider[]
): ComparisonTable {
	const rows: ComparisonTableRow[] = providers.map((provider) => {
		const trustScore = calculateTrustScore(provider);
		const hasLicense = provider.enrichment.credentials.licenseNumbers.length > 0;
		const hasEmergency = provider.enrichment.emergencyService;

		return {
			providerId: provider.id,
			values: {
				name: provider.name,
				trustScore,
				rating: provider.googleRating || 0,
				reviewCount: provider.googleReviewCount || 0,
				yearsInBusiness: getYearsInBusiness(provider),
				priceRange: getPriceRange(provider),
				licenseStatus: hasLicense,
				emergency: hasEmergency,
			},
			featured: trustScore >= 80, // Feature top providers
		};
	});

	// Sort by trust score descending by default
	rows.sort((a, b) => {
		const aScore = (a.values.trustScore as number) || 0;
		const bScore = (b.values.trustScore as number) || 0;
		return bScore - aScore;
	});

	return {
		columns: STANDARD_COMPARISON_COLUMNS,
		rows,
		defaultSort: {
			column: 'trustScore',
			direction: 'desc',
		},
	};
}

/**
 * Generate detailed comparison analyses placeholders
 * These will be enhanced by LLM content
 */
export function generateDetailedComparisons(
	providers: EnrichedProvider[],
	category: string
): DetailedComparison[] {
	const comparisons: DetailedComparison[] = [];

	// Trust Score Analysis
	const trustScores = providers.map(calculateTrustScore);
	const avgTrust = trustScores.reduce((a, b) => a + b, 0) / trustScores.length;
	const minTrust = Math.min(...trustScores);
	const maxTrust = Math.max(...trustScores);

	comparisons.push({
		aspect: 'Trust & Reliability',
		analysis: `Among the ${providers.length} ${category.toLowerCase()} providers we analyzed, trust scores range from ${minTrust} to ${maxTrust} out of 100, with an average of ${Math.round(avgTrust)}. Trust scores are calculated based on licensing status, insurance verification, years in business, customer reviews, and digital presence. Providers with scores above 80 demonstrate consistently strong performance across these metrics.`,
		chartType: 'bar',
		chartData: {
			labels: providers.slice(0, 5).map((p) => p.name),
			values: providers.slice(0, 5).map(calculateTrustScore),
		},
	});

	// Reviews Analysis
	const reviewCounts = providers.map((p) => p.googleReviewCount || 0);
	const totalReviews = reviewCounts.reduce((a, b) => a + b, 0);
	const avgReviews = Math.round(totalReviews / providers.length);

	comparisons.push({
		aspect: 'Customer Reviews',
		analysis: `These providers have accumulated a combined ${totalReviews} customer reviews, averaging ${avgReviews} reviews per provider. Review volume helps establish social proof and gives you more data points to evaluate service quality. Higher review counts with strong ratings typically indicate consistent customer satisfaction over time.`,
		chartType: 'bar',
		chartData: {
			labels: providers.slice(0, 5).map((p) => p.name),
			values: providers.slice(0, 5).map((p) => p.googleReviewCount || 0),
		},
	});

	// Services Offered Analysis
	const allServices = new Set<string>();
	providers.forEach((p) => p.enrichment.services.forEach((s) => allServices.add(s.toLowerCase())));

	comparisons.push({
		aspect: 'Services Offered',
		analysis: `Across all providers, we identified ${allServices.size} distinct services. While most providers offer core ${category.toLowerCase()} services, some specialize in specific areas or offer additional services like emergency response, maintenance plans, or extended warranties. Review each provider's service list to ensure they can handle your specific needs.`,
		chartType: 'table',
	});

	// Credentials Analysis
	const licensedCount = providers.filter(
		(p) => p.enrichment.credentials.licenseNumbers.length > 0
	).length;
	const insuredCount = providers.filter(
		(p) => p.enrichment.credentials.insuranceMentioned
	).length;

	comparisons.push({
		aspect: 'Credentials & Licensing',
		analysis: `${licensedCount} out of ${providers.length} providers (${Math.round((licensedCount / providers.length) * 100)}%) have verified licenses on record. Additionally, ${insuredCount} providers explicitly mention insurance coverage on their websites. Always verify current licensing status and request proof of insurance before hiring any service provider.`,
	});

	return comparisons;
}

/**
 * Generate FAQ items for comparison page
 */
export function generateComparisonFAQ(
	providers: EnrichedProvider[],
	category: string,
	city: string
): FAQItem[] {
	const currentYear = new Date().getFullYear();

	return [
		{
			question: `Who is the best ${category.toLowerCase()} company in ${city}?`,
			answer: `Based on our analysis of ${providers.length} providers, the top-rated company is ${providers[0]?.name || 'varies'} based on trust score, customer reviews, and verified credentials. However, the "best" choice depends on your specific needs, budget, and timeline.`,
		},
		{
			question: `How much does ${category.toLowerCase()} service cost in ${city}?`,
			answer: `${category} costs in ${city} vary based on the specific service needed, materials, and scope of work. We recommend getting at least 3 quotes from different providers for accurate pricing.`,
		},
		{
			question: `How do you calculate trust scores for ${category.toLowerCase()} providers?`,
			answer: `Our trust scores (0-100) are based on: licensing verification, insurance status, years in business, customer review ratings and volume, website quality, and response to inquiries. Higher scores indicate better overall reliability.`,
		},
		{
			question: `Are all ${category.toLowerCase()} providers in ${city} licensed?`,
			answer: `Not all providers are equally licensed. In our research, ${providers.filter((p) => p.enrichment.credentials.licenseNumbers.length > 0).length} out of ${providers.length} providers have verifiable licenses. Always ask for license numbers and verify with local authorities.`,
		},
		{
			question: `What should I look for when hiring a ${category.toLowerCase()} company?`,
			answer: `Key factors include: valid licensing, insurance coverage, positive customer reviews, clear pricing or estimates, warranty offerings, and responsiveness. Our comparison table helps you evaluate these factors across providers.`,
		},
		{
			question: `How often is this ${city} ${category.toLowerCase()} comparison updated?`,
			answer: `We update our provider data regularly to ensure accuracy. This comparison was last updated in ${currentYear}. Provider details, ratings, and availability may change over time.`,
		},
	];
}

/**
 * Generate internal links for comparison page
 */
export function generateInternalLinks(
	blueprint: SitePlannerOutput,
	category: string,
	city: string
): InternalLink[] {
	const links: InternalLink[] = [];
	const baseUrl = blueprint.structure.baseUrl;

	// Link to provider profiles
	for (const page of blueprint.pages.filter((p) => p.type === 'provider_profile').slice(0, 3)) {
		links.push({
			text: `View full profile`,
			url: `${baseUrl}${page.url}`,
			context: 'provider-card',
		});
	}

	// Link to cost guide if exists
	const costGuide = blueprint.pages.find((p) => p.type === 'cost_guide');
	if (costGuide) {
		links.push({
			text: `${category} Cost Guide`,
			url: `${baseUrl}${costGuide.url}`,
			context: 'pricing-section',
		});
	}

	// Link to methodology
	const methodology = blueprint.pages.find((p) => p.type === 'methodology');
	if (methodology) {
		links.push({
			text: 'How We Vet Providers',
			url: `${baseUrl}${methodology.url}`,
			context: 'methodology-reference',
		});
	}

	// Link to service pages
	for (const page of blueprint.pages.filter((p) => p.type === 'service_hub').slice(0, 2)) {
		const pageTitle = page.seo?.title || 'Services';
		links.push({
			text: pageTitle.split(' - ')[0] || pageTitle,
			url: `${baseUrl}${page.url}`,
			context: 'service-navigation',
		});
	}

	return links;
}

/**
 * Generate ItemList schema markup
 */
export function generateItemListSchema(
	providers: EnrichedProvider[],
	title: string,
	description: string
): ItemListSchema {
	return {
		'@context': 'https://schema.org',
		'@type': 'ItemList',
		name: title,
		description,
		numberOfItems: providers.length,
		itemListElement: providers.map((provider, index) => ({
			'@type': 'ListItem',
			position: index + 1,
			item: {
				'@type': 'LocalBusiness',
				name: provider.name,
				...(provider.googleRating && provider.googleReviewCount
					? {
							aggregateRating: {
								'@type': 'AggregateRating',
								ratingValue: provider.googleRating,
								reviewCount: provider.googleReviewCount,
							},
					  }
					: {}),
			},
		})),
	};
}

/**
 * Generate FAQPage schema markup
 */
export function generateFAQSchema(faq: FAQItem[]): FAQPageSchema {
	return {
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: faq.map((item) => ({
			'@type': 'Question',
			name: item.question,
			acceptedAnswer: {
				'@type': 'Answer',
				text: item.answer,
			},
		})),
	};
}

/**
 * Generate BreadcrumbList schema markup
 */
export function generateBreadcrumbSchema(
	baseUrl: string,
	city: string,
	category: string
): BreadcrumbListSchema {
	return {
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
				item: `${baseUrl}/${slugify(city)}`,
			},
			{
				'@type': 'ListItem',
				position: 3,
				name: `Compare ${category} Providers`,
			},
		],
	};
}

/**
 * Generate SEO metadata for comparison page
 */
export function generateComparisonSEO(
	category: string,
	city: string,
	providerCount: number
): ComparisonPageSEO {
	const currentYear = new Date().getFullYear();

	return {
		title: `Best ${category} Companies in ${city} (${currentYear}) - Compare ${providerCount} Local Providers`,
		metaDescription: `Compare the top ${providerCount} ${category.toLowerCase()} companies in ${city}. See ratings, reviews, pricing, and trust scores to find the best provider for your needs.`,
		focusKeyword: `best ${category.toLowerCase()} ${city}`.toLowerCase(),
	};
}

/**
 * Generate methodology section (placeholder for LLM content)
 */
export function generateMethodology(providerCount: number, category: string): string {
	return `Our comparison methodology evaluates ${providerCount} ${category.toLowerCase()} providers across multiple factors. We verify licensing status through public records, check for insurance coverage, analyze customer review patterns across multiple platforms, assess digital presence and responsiveness, and calculate a composite trust score. Our goal is to give you objective, data-driven insights to make an informed hiring decision. We don't accept payment for placement or rankings—our assessments are based purely on publicly available data and our proprietary analysis.`;
}

/**
 * Build a complete comparison page
 */
export function buildComparisonPage(
	providers: EnrichedProvider[],
	blueprint: SitePlannerOutput,
	localKnowledge: LocalKnowledgeOutput
): ComparisonPage {
	const city = localKnowledge.meta.city;
	const category = localKnowledge.meta.category;
	const currentYear = new Date().getFullYear();

	// Generate all components
	const seo = generateComparisonSEO(category, city, providers.length);
	const comparisonTable = buildComparisonTable(providers);
	const winners = selectWinners(providers);
	const detailedComparisons = generateDetailedComparisons(providers, category);
	const faq = generateComparisonFAQ(providers, category, city);
	const internalLinks = generateInternalLinks(blueprint, category, city);

	const content: ComparisonPageContent = {
		headline: `Best ${category} Companies in ${city} (${currentYear})`,
		introduction: `Looking for a reliable ${category.toLowerCase()} provider in ${city}? We've analyzed ${providers.length} local companies to help you compare options and make an informed decision. Our rankings are based on verified credentials, customer reviews, pricing transparency, and overall trust scores—not paid placements.`,
		lastUpdated: new Date().toISOString().split('T')[0],
		methodology: 'See our full methodology below.',
		comparisonTable,
		winners,
		detailedComparisons,
		howWeCompared: generateMethodology(providers.length, category),
		faq,
	};

	const schema: ComparisonPageSchema = {
		itemList: generateItemListSchema(providers, seo.title, seo.metaDescription),
		faqPage: generateFAQSchema(faq),
		breadcrumbList: generateBreadcrumbSchema(blueprint.structure.baseUrl, city, category),
	};

	return {
		pageId: `comparison-${slugify(city)}-${slugify(category)}`,
		city,
		url: `/${slugify(city)}/compare-${slugify(category)}-providers`,
		seo,
		content,
		schema,
		internalLinks,
	};
}

/**
 * Build a pricing page
 */
export function buildPricingPage(
	providers: EnrichedProvider[],
	localKnowledge: LocalKnowledgeOutput,
	category: string
): PricingPage {
	const city = localKnowledge.meta.city;
	const aggregated = aggregatePricingData(providers);
	const currentYear = new Date().getFullYear();

	const content: PricingPageContent = {
		headline: `${category} Costs in ${city} (${currentYear}) - Price Guide`,
		quickAnswer: generateQuickAnswer(aggregated, category),
		priceTable: generatePriceTable(aggregated),
		cityComparison: generateCityComparison(providers, localKnowledge),
		costFactors: generateCostFactors(category),
		realExamples: generateRealExamples(aggregated, city),
		savingTips: generateSavingTips(),
		redFlags: generateRedFlags(),
		methodology: generatePricingMethodology(aggregated, category),
	};

	return {
		pageId: `pricing-${slugify(city)}-${slugify(category)}`,
		serviceType: category,
		url: `/${slugify(category)}/cost-guide-${slugify(city)}`,
		seo: {
			title: `How Much Does ${category} Cost in ${city}? (${currentYear} Prices)`,
			metaDescription: `${category} costs in ${city} range from ${content.quickAnswer.range.low} to ${content.quickAnswer.range.high}. See our detailed price guide with real examples and money-saving tips.`,
		},
		content,
		schema: {
			'@context': 'https://schema.org',
			'@type': 'Article',
			headline: content.headline,
			dateModified: new Date().toISOString(),
		},
	};
}
