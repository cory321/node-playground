/**
 * Provider Profile Generation API
 * Orchestrates the generation of complete provider profiles
 */

import { EnrichedProvider } from '@/types/enrichedProvider';
import { LocalKnowledgeOutput } from '@/types/localKnowledge';
import { SitePlannerOutput } from '@/types/sitePlanner';
import {
	GeneratedProviderProfile,
	ProfileGenerationProgress,
	ProviderProfileGeneratorConfig,
	EditorialDepth,
} from '@/types/generatedProfile';
import {
	calculateTrustScore,
	getTrustScoreDisplay,
	generateProfileSEO,
	generateContactSection,
	generateServicesSection,
	generateCredentialsSection,
	generateServiceAreaSection,
	buildComparisonContext,
	generateProviderSchema,
	identifyInternalLinks,
	getLocalKnowledgeHooks,
	calculateAverageRating,
	getPricePosition,
	getLicenseStatus,
	callGenerateOurTake,
	callGenerateFAQs,
	callGenerateIntro,
	countWords,
	validateProfile,
} from './generator';

// Rate limit delay between API calls (ms)
const API_RATE_LIMIT_MS = 1500;

/**
 * Delay helper
 */
function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate a single provider profile
 */
async function generateSingleProfile(
	provider: EnrichedProvider,
	allProviders: EnrichedProvider[],
	blueprint: SitePlannerOutput,
	localKnowledge: LocalKnowledgeOutput,
	config: ProviderProfileGeneratorConfig,
	usedHooks: Set<string>
): Promise<GeneratedProviderProfile> {
	const city = localKnowledge.meta.city;
	const state = localKnowledge.meta.state;
	const category = localKnowledge.meta.category;

	// Get local knowledge hooks
	const allHooks = getLocalKnowledgeHooks(localKnowledge);

	// Select hooks that haven't been used much (for variety)
	const availableHooks = allHooks.filter((h) => !usedHooks.has(h));
	const selectedHooks =
		availableHooks.length >= 5 ? availableHooks.slice(0, 5) : allHooks.slice(0, 5);

	// Track used hooks
	selectedHooks.forEach((h) => usedHooks.add(h));

	// Calculate trust score
	const trustScore = calculateTrustScore(provider);
	const trustScoreDisplay = getTrustScoreDisplay(trustScore);

	// Calculate comparison context
	const avgRating = calculateAverageRating(allProviders);
	const comparison = buildComparisonContext(provider, allProviders);

	// Get provider-specific data
	const yearsInBusiness = provider.enrichment?.about?.yearEstablished
		? new Date().getFullYear() - provider.enrichment.about.yearEstablished
		: null;
	const specialties = provider.enrichment?.services?.slice(0, 5) || [];
	const pricePosition = getPricePosition(provider, localKnowledge);
	const licenseStatus = getLicenseStatus(provider);

	// Generate introduction via LLM
	const introResponse = await callGenerateIntro({
		providerName: provider.name,
		category,
		city,
		state,
		yearsInBusiness,
		specialties,
		localKnowledgeHooks: selectedHooks,
		editorialDepth: config.editorialDepth,
	});

	await delay(API_RATE_LIMIT_MS);

	// Generate "Our Take" via LLM
	const ourTakeResponse = await callGenerateOurTake({
		providerName: provider.name,
		category,
		city,
		state,
		trustScore,
		googleRating: provider.googleRating,
		reviewCount: provider.googleReviewCount,
		yearsInBusiness,
		licenseStatus,
		specialties,
		pricePosition,
		rank: comparison.rankInCity,
		totalProviders: comparison.totalInCity,
		avgRating,
		localKnowledgeHooks: selectedHooks,
		editorialDepth: config.editorialDepth,
	});

	await delay(API_RATE_LIMIT_MS);

	// Generate FAQs via LLM
	const faqResponse = await callGenerateFAQs({
		providerName: provider.name,
		category,
		city,
		state,
		services: specialties,
		serviceArea: provider.enrichment?.serviceArea || [city],
		credentials: {
			licenseNumbers: provider.enrichment?.credentials?.licenseNumbers || [],
			certifications: provider.enrichment?.credentials?.certifications || [],
			yearsInBusiness,
		},
		localKnowledgeHooks: selectedHooks,
	});

	// Generate deterministic sections
	const seo = generateProfileSEO(provider, city, state, category, blueprint);
	const contactSection = generateContactSection(provider);
	const servicesSection = generateServicesSection(provider, category);
	const credentialsSection = generateCredentialsSection(provider);
	const serviceAreaSection = generateServiceAreaSection(provider, city, state);
	const schema = generateProviderSchema(provider, blueprint, city, state);
	const internalLinks = config.includeComparison
		? identifyInternalLinks(provider, blueprint, category, city)
		: [];

	// Find the provider profile page in blueprint
	const profilePage = blueprint.pages.find(
		(p) => p.type === 'provider_profile' && p.data?.providers?.includes(provider.id)
	);
	const pageId = profilePage?.id || `provider-${provider.id}`;
	const url = profilePage?.url || `/providers/${provider.id}`;

	// Calculate word count
	const allText = [
		introResponse.introduction,
		ourTakeResponse.assessment,
		...faqResponse.faqs.map((f) => `${f.question} ${f.answer}`),
		servicesSection.intro,
		...servicesSection.services.map((s) => s.description),
		serviceAreaSection.description,
	].join(' ');
	const wordCount = countWords(allText);

	// Track local references used
	const localReferences = [
		...introResponse.localReferencesUsed,
		city,
		state,
		...selectedHooks.filter(
			(h) =>
				allText.toLowerCase().includes(h.toLowerCase().substring(0, 20))
		),
	].filter((v, i, a) => a.indexOf(v) === i); // dedupe

	// Build the complete profile
	const profile: GeneratedProviderProfile = {
		providerId: provider.id,
		pageId,
		url,
		seo,
		content: {
			headline: `${provider.name} - ${category} in ${city}`,
			introduction: introResponse.introduction,
			trustScore: {
				display: trustScoreDisplay,
				explanation: `Based on ${trustScoreDisplay.tier === 'excellent' || trustScoreDisplay.tier === 'good' ? 'strong' : 'available'} indicators including ratings, reviews, licensing, and experience.`,
			},
			contactSection,
			servicesSection,
			credentialsSection,
			ourTake: {
				heading: 'Our Assessment',
				assessment: ourTakeResponse.assessment,
				strengths: ourTakeResponse.strengths,
				considerations: ourTakeResponse.considerations,
				bestFor: ourTakeResponse.bestFor,
				pricePosition: ourTakeResponse.pricePosition,
				byline: {
					author: 'Local Expert Team',
					title: `${city} ${category} Specialists`,
					date: new Date().toLocaleDateString('en-US', {
						month: 'long',
						year: 'numeric',
					}),
				},
			},
			serviceAreaSection,
			faq: faqResponse.faqs,
			comparison: config.includeComparison ? comparison : {
				rankInCity: comparison.rankInCity,
				totalInCity: comparison.totalInCity,
				highlights: comparison.highlights,
				alternatives: [],
			},
		},
		schema,
		internalLinks,
		wordCount,
		localReferences,
		generatedAt: new Date().toISOString(),
	};

	return profile;
}

/**
 * Generate all provider profiles
 */
export async function generateAllProfiles(
	providers: EnrichedProvider[],
	blueprint: SitePlannerOutput,
	localKnowledge: LocalKnowledgeOutput,
	config: ProviderProfileGeneratorConfig,
	options?: {
		onProgress?: (progress: ProfileGenerationProgress) => void;
		abortSignal?: { current: boolean };
	}
): Promise<GeneratedProviderProfile[]> {
	const results: GeneratedProviderProfile[] = [];
	const usedHooks = new Set<string>();
	const totalCount = providers.length;

	// Initial progress
	options?.onProgress?.({
		currentProvider: null,
		currentIndex: 0,
		totalCount,
		phase: 'preparing',
		completedProfiles: 0,
	});

	for (let i = 0; i < providers.length; i++) {
		// Check for abort
		if (options?.abortSignal?.current) {
			break;
		}

		const provider = providers[i];

		// Update progress
		options?.onProgress?.({
			currentProvider: provider.name,
			currentIndex: i + 1,
			totalCount,
			phase: 'generating',
			completedProfiles: results.length,
		});

		try {
			const profile = await generateSingleProfile(
				provider,
				providers,
				blueprint,
				localKnowledge,
				config,
				usedHooks
			);

			results.push(profile);
		} catch (error) {
			console.error(`Failed to generate profile for ${provider.name}:`, error);
			// Continue with other providers
		}

		// Small delay between providers
		if (i < providers.length - 1) {
			await delay(500);
		}
	}

	// Validation phase
	options?.onProgress?.({
		currentProvider: null,
		currentIndex: totalCount,
		totalCount,
		phase: 'validating',
		completedProfiles: results.length,
	});

	// Validate all profiles
	for (const profile of results) {
		const validation = validateProfile(profile);
		if (!validation.valid) {
			console.warn(
				`Profile ${profile.providerId} has issues:`,
				validation.issues
			);
		}
	}

	// Complete
	options?.onProgress?.({
		currentProvider: null,
		currentIndex: totalCount,
		totalCount,
		phase: 'complete',
		completedProfiles: results.length,
	});

	return results;
}

/**
 * Check if Supabase is configured
 */
export function hasSupabase(): boolean {
	const url = import.meta.env.VITE_SUPABASE_URL;
	const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
	return Boolean(url && key);
}

// Re-export types and utilities
export type { GeneratedProviderProfile, ProfileGenerationProgress };
export { validateProfile, countWords } from './generator';
