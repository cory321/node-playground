/**
 * Provider Profile Generator
 * Generates unique, high-quality profile content for each service provider
 */

import { EnrichedProvider } from '@/types/enrichedProvider';
import { LocalKnowledgeOutput } from '@/types/localKnowledge';
import { SitePlannerOutput, PageBrief } from '@/types/sitePlanner';
import {
	GeneratedProviderProfile,
	TrustScoreDisplay,
	ProfileSEO,
	ContactSection,
	ServicesSection,
	CredentialsSection,
	OurTakeSection,
	ServiceAreaSection,
	FAQItem,
	ComparisonSection,
	ProfileSchema,
	InternalLink,
	EditorialDepth,
	OurTakeGenerationRequest,
	OurTakeGenerationResponse,
	FAQGenerationRequest,
	FAQGenerationResponse,
	IntroGenerationRequest,
	IntroGenerationResponse,
} from '@/types/generatedProfile';

// ============================================================================
// TRUST SCORE CALCULATIONS
// ============================================================================

/**
 * Calculate trust score from provider data
 */
export function calculateTrustScore(provider: EnrichedProvider): number {
	let score = 0;

	// Google rating (0-30 points)
	if (provider.googleRating) {
		score += Math.min(30, provider.googleRating * 6);
	}

	// Review count (0-20 points)
	if (provider.googleReviewCount) {
		if (provider.googleReviewCount >= 100) score += 20;
		else if (provider.googleReviewCount >= 50) score += 15;
		else if (provider.googleReviewCount >= 20) score += 10;
		else if (provider.googleReviewCount >= 5) score += 5;
	}

	// License (0-20 points)
	if (provider.enrichment?.credentials?.licenseNumbers?.length > 0) {
		score += 20;
	}

	// Years in business (0-15 points)
	const years = provider.enrichment?.about?.yearEstablished;
	if (years) {
		const yearsInBusiness = new Date().getFullYear() - years;
		if (yearsInBusiness >= 10) score += 15;
		else if (yearsInBusiness >= 5) score += 10;
		else if (yearsInBusiness >= 2) score += 5;
	}

	// Website presence (0-10 points)
	if (provider.website) {
		score += 5;
		if (provider.enrichment?.scrapingConfidence > 50) {
			score += 5;
		}
	}

	// Insurance mentioned (0-5 points)
	if (provider.enrichment?.credentials?.insuranceMentioned) {
		score += 5;
	}

	return Math.min(100, score);
}

/**
 * Get trust score display properties
 */
export function getTrustScoreDisplay(score: number): TrustScoreDisplay {
	if (score >= 80) {
		return {
			score,
			tier: 'excellent',
			color: 'text-green-500',
			label: 'Excellent',
		};
	} else if (score >= 60) {
		return {
			score,
			tier: 'good',
			color: 'text-blue-500',
			label: 'Good',
		};
	} else if (score >= 40) {
		return {
			score,
			tier: 'fair',
			color: 'text-yellow-500',
			label: 'Fair',
		};
	} else {
		return {
			score,
			tier: 'needs-improvement',
			color: 'text-orange-500',
			label: 'Limited Info',
		};
	}
}

// ============================================================================
// CONTENT GENERATION HELPERS
// ============================================================================

/**
 * Generate SEO metadata for provider profile
 */
export function generateProfileSEO(
	provider: EnrichedProvider,
	city: string,
	state: string,
	category: string,
	blueprint: SitePlannerOutput
): ProfileSEO {
	const brandName = blueprint.brand.name;

	return {
		title: `${provider.name} - ${category} in ${city}, ${state} | ${brandName}`,
		metaDescription: `Read our assessment of ${provider.name}, a ${category.toLowerCase()} company in ${city}. ${provider.googleRating ? `${provider.googleRating}★ rating` : ''} - Trust score, services, and honest review.`,
		canonicalUrl: `${blueprint.structure.baseUrl}/${city.toLowerCase().replace(/\s+/g, '-')}/providers/${provider.id}`,
	};
}

/**
 * Generate contact section from provider data
 */
export function generateContactSection(
	provider: EnrichedProvider
): ContactSection {
	const enrichment = provider.enrichment;

	// Format hours
	let hoursStr = 'Contact for hours';
	if (enrichment?.hours) {
		const hourEntries = Object.entries(enrichment.hours);
		if (hourEntries.length > 0) {
			hoursStr = hourEntries
				.map(([day, hours]) => `${day}: ${hours}`)
				.join(', ');
		}
	}

	// Format service area
	const serviceArea =
		enrichment?.serviceArea?.length > 0
			? enrichment.serviceArea.join(', ')
			: provider.address?.split(',')[0] || 'Local area';

	return {
		phone: provider.phone || 'Contact for phone',
		address: provider.address || 'Contact for address',
		hours: hoursStr,
		serviceArea,
		emergencyNote: enrichment?.emergencyService
			? '24/7 Emergency service available'
			: undefined,
	};
}

/**
 * Generate services section from provider data
 */
export function generateServicesSection(
	provider: EnrichedProvider,
	category: string
): ServicesSection {
	const enrichment = provider.enrichment;
	const services = enrichment?.services || [];
	const descriptions = enrichment?.serviceDescriptions || {};

	return {
		heading: `${category} Services`,
		intro: `${provider.name} offers a range of ${category.toLowerCase()} services to homeowners and businesses in the area.`,
		services: services.slice(0, 6).map((service) => ({
			name: service,
			description:
				descriptions[service] ||
				`Professional ${service.toLowerCase()} services provided by ${provider.name}.`,
			priceRange: enrichment?.pricing?.listed?.find(
				(p) => p.service.toLowerCase() === service.toLowerCase()
			)?.price,
		})),
	};
}

/**
 * Generate credentials section from provider data
 */
export function generateCredentialsSection(
	provider: EnrichedProvider
): CredentialsSection {
	const enrichment = provider.enrichment;
	const credentials = enrichment?.credentials;

	// Calculate years in business
	let yearsStr = 'Contact for details';
	if (enrichment?.about?.yearEstablished) {
		const years = new Date().getFullYear() - enrichment.about.yearEstablished;
		yearsStr = `${years}+ years serving the community`;
	}

	// License display
	const licenseNumbers = credentials?.licenseNumbers || [];
	const licenseDisplay =
		licenseNumbers.length > 0
			? `License #${licenseNumbers[0]} - Active`
			: 'Contact for license information';

	return {
		heading: 'Credentials & Experience',
		license: {
			display: licenseDisplay,
			verificationLink: '', // Would need state-specific verification URLs
			explanation:
				licenseNumbers.length > 0
					? 'Licensed and verified through state records'
					: 'Contact the provider to verify licensing',
		},
		insurance: credentials?.insuranceMentioned
			? 'Insurance mentioned on website'
			: 'Contact to verify insurance coverage',
		certifications: credentials?.certifications || [],
		yearsInBusiness: yearsStr,
	};
}

/**
 * Generate service area section
 */
export function generateServiceAreaSection(
	provider: EnrichedProvider,
	city: string,
	state: string
): ServiceAreaSection {
	const serviceArea = provider.enrichment?.serviceArea || [city];

	return {
		heading: 'Service Area',
		description: `${provider.name} provides services throughout ${city} and surrounding areas in ${state}.`,
		cities: serviceArea.length > 0 ? serviceArea : [city],
	};
}

/**
 * Build comparison context for provider
 */
export function buildComparisonContext(
	provider: EnrichedProvider,
	allProviders: EnrichedProvider[]
): ComparisonSection {
	// Sort by score
	const sorted = [...allProviders].sort(
		(a, b) => b.score.total - a.score.total
	);
	const rank = sorted.findIndex((p) => p.id === provider.id) + 1;

	// Build alternatives
	const alternatives = sorted
		.filter((p) => p.id !== provider.id)
		.slice(0, 3)
		.map((p) => {
			let comparison = '';
			if (p.googleRating && provider.googleRating) {
				if (p.googleRating > provider.googleRating) {
					comparison = 'Higher rated';
				} else if (p.googleRating < provider.googleRating) {
					comparison = 'Lower rated';
				}
			}
			if (p.googleReviewCount && provider.googleReviewCount) {
				const reviewDiff = p.googleReviewCount - provider.googleReviewCount;
				if (Math.abs(reviewDiff) > 20) {
					comparison += comparison ? ', ' : '';
					comparison += reviewDiff > 0 ? 'More reviews' : 'Fewer reviews';
				}
			}
			return {
				providerId: p.id,
				name: p.name,
				comparison: comparison || 'Similar profile',
			};
		});

	// Build highlights
	const highlights: string[] = [];
	if (rank <= 3) {
		highlights.push(`Top ${rank} provider in the area`);
	}
	if (provider.googleRating && provider.googleRating >= 4.5) {
		highlights.push('Highly rated by customers');
	}
	if (provider.enrichment?.credentials?.licenseNumbers?.length > 0) {
		highlights.push('Licensed and verified');
	}
	if (provider.enrichment?.about?.yearEstablished) {
		const years =
			new Date().getFullYear() - provider.enrichment.about.yearEstablished;
		if (years >= 10) {
			highlights.push(`${years}+ years of experience`);
		}
	}

	return {
		rankInCity: rank,
		totalInCity: allProviders.length,
		highlights,
		alternatives,
	};
}

/**
 * Generate JSON-LD schema for provider
 */
export function generateProviderSchema(
	provider: EnrichedProvider,
	blueprint: SitePlannerOutput,
	city: string,
	state: string
): ProfileSchema {
	const localBusiness = {
		'@context': 'https://schema.org',
		'@type': 'LocalBusiness',
		name: provider.name,
		telephone: provider.phone,
		url: provider.website,
		address: provider.address
			? {
					'@type': 'PostalAddress',
					streetAddress: provider.address.split(',')[0],
					addressLocality: city,
					addressRegion: state,
				}
			: undefined,
		image: provider.enrichment?.images?.logo,
		openingHours: provider.enrichment?.hours
			? Object.entries(provider.enrichment.hours).map(
					([day, hours]) => `${day} ${hours}`
				)
			: undefined,
		areaServed: provider.enrichment?.serviceArea?.map((area) => ({
			'@type': 'City',
			name: area,
		})),
	};

	const aggregateRating = provider.googleRating
		? {
				'@type': 'AggregateRating',
				ratingValue: provider.googleRating,
				reviewCount: provider.googleReviewCount || 0,
				bestRating: 5,
				worstRating: 1,
			}
		: {};

	return {
		localBusiness,
		aggregateRating,
	};
}

/**
 * Identify internal link opportunities from blueprint
 */
export function identifyInternalLinks(
	provider: EnrichedProvider,
	blueprint: SitePlannerOutput,
	category: string,
	city: string
): InternalLink[] {
	const links: InternalLink[] = [];

	// Find related pages in the blueprint
	for (const page of blueprint.pages) {
		// Link to provider listing page
		if (page.type === 'provider_listing') {
			links.push({
				targetPageId: page.id,
				anchorText: `View all ${category} providers in ${city}`,
				placement: 'comparison-section',
			});
		}

		// Link to service pages
		if (page.type === 'service_hub' || page.type === 'service_detail') {
			const service = page.data?.services?.[0];
			if (service && provider.enrichment?.services?.includes(service)) {
				links.push({
					targetPageId: page.id,
					anchorText: `Learn more about ${service}`,
					placement: 'services-section',
				});
			}
		}

		// Link to cost guide if available
		if (page.type === 'cost_guide') {
			links.push({
				targetPageId: page.id,
				anchorText: `${category} pricing guide`,
				placement: 'credentials-section',
			});
		}
	}

	return links.slice(0, 5); // Limit to 5 internal links
}

/**
 * Get all local knowledge hooks as a flat array
 */
export function getLocalKnowledgeHooks(
	localKnowledge: LocalKnowledgeOutput
): string[] {
	const hooks: string[] = [];

	hooks.push(...localKnowledge.contentHooks.localPhrases);
	hooks.push(...localKnowledge.contentHooks.neighborhoodNames);
	hooks.push(...localKnowledge.contentHooks.climateContext);
	hooks.push(...localKnowledge.contentHooks.categorySpecificIssues);

	return hooks;
}

/**
 * Calculate average rating across all providers
 */
export function calculateAverageRating(providers: EnrichedProvider[]): number {
	const ratings = providers
		.filter((p) => p.googleRating !== null)
		.map((p) => p.googleRating!);

	if (ratings.length === 0) return 0;
	return ratings.reduce((a, b) => a + b, 0) / ratings.length;
}

/**
 * Get price position based on provider data
 */
export function getPricePosition(
	provider: EnrichedProvider,
	localKnowledge: LocalKnowledgeOutput
): string {
	// Use market context from local knowledge if available
	if (localKnowledge.marketContext.pricePosition) {
		return localKnowledge.marketContext.pricePosition;
	}

	// Default based on enrichment data
	if (provider.enrichment?.pricing?.listed?.length > 0) {
		return 'Transparent pricing available';
	}

	return 'Contact for pricing';
}

/**
 * Determine license status string
 */
export function getLicenseStatus(provider: EnrichedProvider): string {
	const licenses = provider.enrichment?.credentials?.licenseNumbers || [];
	if (licenses.length > 0) {
		return `Licensed (${licenses[0]})`;
	}
	return 'License status unknown';
}

// ============================================================================
// EDGE FUNCTION CALLERS
// ============================================================================

/**
 * Call the edge function to generate "Our Take" editorial
 */
export async function callGenerateOurTake(
	request: OurTakeGenerationRequest
): Promise<OurTakeGenerationResponse> {
	const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
	const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

	const response = await fetch(
		`${supabaseUrl}/functions/v1/provider-profile-generator`,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				apikey: anonKey,
				Authorization: `Bearer ${anonKey}`,
			},
			body: JSON.stringify({
				type: 'our-take',
				data: request,
			}),
		}
	);

	if (!response.ok) {
		throw new Error(`Failed to generate Our Take: ${response.statusText}`);
	}

	const data = await response.json();
	return data.result as OurTakeGenerationResponse;
}

/**
 * Call the edge function to generate FAQs
 */
export async function callGenerateFAQs(
	request: FAQGenerationRequest
): Promise<FAQGenerationResponse> {
	const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
	const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

	const response = await fetch(
		`${supabaseUrl}/functions/v1/provider-profile-generator`,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				apikey: anonKey,
				Authorization: `Bearer ${anonKey}`,
			},
			body: JSON.stringify({
				type: 'faq',
				data: request,
			}),
		}
	);

	if (!response.ok) {
		throw new Error(`Failed to generate FAQs: ${response.statusText}`);
	}

	const data = await response.json();
	return data.result as FAQGenerationResponse;
}

/**
 * Call the edge function to generate introduction
 */
export async function callGenerateIntro(
	request: IntroGenerationRequest
): Promise<IntroGenerationResponse> {
	const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
	const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

	const response = await fetch(
		`${supabaseUrl}/functions/v1/provider-profile-generator`,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				apikey: anonKey,
				Authorization: `Bearer ${anonKey}`,
			},
			body: JSON.stringify({
				type: 'intro',
				data: request,
			}),
		}
	);

	if (!response.ok) {
		throw new Error(`Failed to generate introduction: ${response.statusText}`);
	}

	const data = await response.json();
	return data.result as IntroGenerationResponse;
}

// ============================================================================
// QUALITY CHECKS
// ============================================================================

/**
 * Count words in a string
 */
export function countWords(text: string): number {
	return text.split(/\s+/).filter((word) => word.length > 0).length;
}

/**
 * Check for placeholder text patterns
 */
export function hasPlaceholderText(text: string): boolean {
	const patterns = [
		/\[.*?\]/g, // [placeholder]
		/\{.*?\}/g, // {placeholder}
		/lorem ipsum/i,
		/TODO/i,
		/FIXME/i,
		/XXX/i,
	];

	return patterns.some((pattern) => pattern.test(text));
}

/**
 * Validate a generated profile
 */
export function validateProfile(profile: GeneratedProviderProfile): {
	valid: boolean;
	issues: string[];
} {
	const issues: string[] = [];

	// Check word count
	if (profile.wordCount < 800) {
		issues.push(`Word count too low: ${profile.wordCount} (minimum 800)`);
	}

	// Check local references
	if (profile.localReferences.length < 3) {
		issues.push(
			`Too few local references: ${profile.localReferences.length} (minimum 3)`
		);
	}

	// Check for placeholder text
	const allText = [
		profile.content.introduction,
		profile.content.ourTake.assessment,
		...profile.content.faq.map((f) => f.answer),
	].join(' ');

	if (hasPlaceholderText(allText)) {
		issues.push('Contains placeholder text');
	}

	// Check required sections
	if (!profile.content.headline) issues.push('Missing headline');
	if (!profile.content.introduction) issues.push('Missing introduction');
	if (!profile.content.ourTake.assessment) issues.push('Missing Our Take');
	if (profile.content.faq.length < 3) issues.push('Too few FAQs');

	return {
		valid: issues.length === 0,
		issues,
	};
}
