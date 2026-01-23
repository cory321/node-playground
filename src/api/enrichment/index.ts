import { ProviderData } from '@/types/nodes';
import {
	EnrichedProvider,
	ProviderEnrichment,
	WebsiteDiscovery,
	createEmptyEnrichment,
	createEmptyDiscovery,
} from '@/types/enrichedProvider';

// Rate limiting: 1 request per 2 seconds for Firecrawl standard tier
const RATE_LIMIT_DELAY_MS = 2000;
// Rate limiting for SERP discovery
const DISCOVERY_RATE_LIMIT_MS = 1500;

/**
 * Check if Supabase is configured
 */
function hasSupabase(): boolean {
	const url = import.meta.env.VITE_SUPABASE_URL;
	const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
	return Boolean(url && key);
}

/**
 * Get Supabase configuration
 */
function getSupabaseConfig() {
	return {
		url: import.meta.env.VITE_SUPABASE_URL as string,
		anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
	};
}

export interface EnrichmentResult {
	provider: EnrichedProvider;
	success: boolean;
	error: string | null;
}

export interface DiscoveryResult {
	discoveredUrl: string | null;
	discoverySource: 'serp_organic' | 'phone_lookup' | null;
	discoveryConfidence: number;
	candidatesChecked: number;
}

/**
 * Discover a provider's website using SERP search
 */
export async function discoverProviderWebsite(
	provider: ProviderData,
	city: string,
	state: string | null
): Promise<WebsiteDiscovery> {
	// If provider already has a website, return original discovery
	if (provider.website) {
		return {
			discoveredUrl: provider.website,
			discoverySource: 'original',
			discoveryConfidence: 100,
			discoveredAt: new Date().toISOString(),
		};
	}

	// Check Supabase configuration
	if (!hasSupabase()) {
		console.warn('Supabase not configured, skipping website discovery');
		return createEmptyDiscovery();
	}

	const { url, anonKey } = getSupabaseConfig();

	try {
		const response = await fetch(
			`${url}/functions/v1/discover-provider-website`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					apikey: anonKey,
					Authorization: `Bearer ${anonKey}`,
				},
				body: JSON.stringify({
					providerName: provider.name,
					phone: provider.phone,
					address: provider.address,
					city,
					state,
				}),
			}
		);

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			console.error(`Discovery failed for ${provider.name}:`, errorData.error);
			return createEmptyDiscovery();
		}

		const result = await response.json();

		if (!result.success || !result.data?.discoveredUrl) {
			return createEmptyDiscovery();
		}

		return {
			discoveredUrl: result.data.discoveredUrl,
			discoverySource: result.data.discoverySource || 'serp_organic',
			discoveryConfidence: result.data.discoveryConfidence || 0,
			discoveredAt: new Date().toISOString(),
		};
	} catch (error) {
		console.error(`Discovery error for ${provider.name}:`, error);
		return createEmptyDiscovery();
	}
}

export interface EnrichmentProgress {
	currentProvider: string;
	currentIndex: number;
	totalCount: number;
}

/**
 * Enrich a single provider by scraping their website
 */
export async function enrichProvider(
	provider: ProviderData
): Promise<EnrichmentResult> {
	// If no website, return with empty enrichment
	if (!provider.website) {
		return {
			provider: {
				...provider,
				enrichment: createEmptyEnrichment('No website URL available'),
			},
			success: false,
			error: 'No website URL available',
		};
	}

	// Check Supabase configuration
	if (!hasSupabase()) {
		console.warn('Supabase not configured, skipping enrichment');
		return {
			provider: {
				...provider,
				enrichment: createEmptyEnrichment('Supabase not configured'),
			},
			success: false,
			error: 'Supabase not configured',
		};
	}

	const { url, anonKey } = getSupabaseConfig();

	try {
		const response = await fetch(
			`${url}/functions/v1/scrape-provider-website`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					apikey: anonKey,
					Authorization: `Bearer ${anonKey}`,
				},
				body: JSON.stringify({
					url: provider.website,
					providerName: provider.name,
				}),
			}
		);

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			const errorMessage =
				errorData.error || `HTTP ${response.status}: ${response.statusText}`;
			console.error(`Enrichment failed for ${provider.name}:`, errorMessage);

			return {
				provider: {
					...provider,
					enrichment: createEmptyEnrichment(errorMessage),
				},
				success: false,
				error: errorMessage,
			};
		}

		const result = await response.json();

		if (!result.success && result.error) {
			return {
				provider: {
					...provider,
					enrichment: result.data || createEmptyEnrichment(result.error),
				},
				success: false,
				error: result.error,
			};
		}

		return {
			provider: {
				...provider,
				enrichment: result.data as ProviderEnrichment,
			},
			success: true,
			error: null,
		};
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : 'Unknown error';
		console.error(`Enrichment error for ${provider.name}:`, errorMessage);

		return {
			provider: {
				...provider,
				enrichment: createEmptyEnrichment(errorMessage),
			},
			success: false,
			error: errorMessage,
		};
	}
}

export interface EnrichmentProgressWithPhase extends EnrichmentProgress {
	phase: 'discovery' | 'enrichment';
	discoveredCount: number;
}

/**
 * Enrich multiple providers with rate limiting and progress tracking
 * Supports optional website discovery for providers without websites
 */
export async function enrichAllProviders(
	providers: ProviderData[],
	options?: {
		onProgress?: (progress: EnrichmentProgressWithPhase) => void;
		skipWithoutWebsite?: boolean;
		discoverMissingWebsites?: boolean;
		city?: string;
		state?: string | null;
		abortSignal?: { current: boolean };
	}
): Promise<EnrichedProvider[]> {
	const {
		onProgress,
		skipWithoutWebsite = true,
		discoverMissingWebsites = false,
		city,
		state,
		abortSignal,
	} = options || {};

	const results: EnrichedProvider[] = [];
	let discoveredCount = 0;

	// Separate providers with and without websites
	const providersWithWebsite = providers.filter((p) => p.website);
	const providersWithoutWebsite = providers.filter((p) => !p.website);

	// Phase 1: Website Discovery (if enabled)
	const discoveredProviders: Array<{
		provider: ProviderData;
		discovery: WebsiteDiscovery;
	}> = [];

	if (discoverMissingWebsites && city && providersWithoutWebsite.length > 0) {
		console.log(
			`Starting website discovery for ${providersWithoutWebsite.length} providers without websites`
		);

		for (let i = 0; i < providersWithoutWebsite.length; i++) {
			if (abortSignal?.current) {
				console.log('Discovery aborted by user');
				break;
			}

			const provider = providersWithoutWebsite[i];

			onProgress?.({
				currentProvider: provider.name,
				currentIndex: i + 1,
				totalCount: providersWithoutWebsite.length,
				phase: 'discovery',
				discoveredCount,
			});

			const discovery = await discoverProviderWebsite(provider, city, state);

			if (discovery.discoveredUrl) {
				discoveredCount++;
				// Create updated provider with discovered website
				const updatedProvider = {
					...provider,
					website: discovery.discoveredUrl,
				};
				discoveredProviders.push({
					provider: updatedProvider,
					discovery,
				});
			} else {
				// No website found - add with empty discovery
				discoveredProviders.push({
					provider,
					discovery: createEmptyDiscovery(),
				});
			}

			// Rate limiting delay
			if (
				i < providersWithoutWebsite.length - 1 &&
				!abortSignal?.current
			) {
				await delay(DISCOVERY_RATE_LIMIT_MS);
			}
		}

		console.log(
			`Discovery complete: found ${discoveredCount} websites out of ${providersWithoutWebsite.length} providers`
		);
	}

	// Build list of providers to enrich
	const allProvidersToProcess: Array<{
		provider: ProviderData;
		discovery?: WebsiteDiscovery;
	}> = [];

	// Add providers that already had websites (with 'original' discovery source)
	for (const provider of providersWithWebsite) {
		allProvidersToProcess.push({
			provider,
			discovery: {
				discoveredUrl: provider.website,
				discoverySource: 'original',
				discoveryConfidence: 100,
				discoveredAt: null,
			},
		});
	}

	// Add discovered providers
	allProvidersToProcess.push(...discoveredProviders);

	// Determine which providers to actually enrich
	const providersToEnrich = allProvidersToProcess.filter((item) => {
		if (skipWithoutWebsite && !discoverMissingWebsites) {
			// Legacy mode: only enrich those with original websites
			return item.provider.website !== null;
		}
		// With discovery enabled, enrich all that have a website (original or discovered)
		return item.provider.website !== null;
	});

	// Phase 2: Enrichment
	for (let i = 0; i < providersToEnrich.length; i++) {
		if (abortSignal?.current) {
			console.log('Enrichment aborted by user');
			break;
		}

		const { provider, discovery } = providersToEnrich[i];

		onProgress?.({
			currentProvider: provider.name,
			currentIndex: i + 1,
			totalCount: providersToEnrich.length,
			phase: 'enrichment',
			discoveredCount,
		});

		const result = await enrichProvider(provider);
		
		// Add discovery info to the enriched provider
		const enrichedWithDiscovery: EnrichedProvider = {
			...result.provider,
			websiteDiscovery: discovery,
		};
		results.push(enrichedWithDiscovery);

		// Rate limiting delay
		if (i < providersToEnrich.length - 1 && !abortSignal?.current) {
			await delay(RATE_LIMIT_DELAY_MS);
		}
	}

	// Add providers that couldn't be enriched (no website found)
	const unenrichableProviders = allProvidersToProcess.filter(
		(item) => item.provider.website === null
	);
	for (const { provider, discovery } of unenrichableProviders) {
		results.push({
			...provider,
			enrichment: createEmptyEnrichment('No website URL available'),
			websiteDiscovery: discovery || createEmptyDiscovery(),
		});
	}

	return results;
}

/**
 * Delay helper for rate limiting
 */
function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate overall enrichment statistics
 */
export function calculateEnrichmentStats(providers: EnrichedProvider[]) {
	const total = providers.length;
	const withWebsite = providers.filter((p) => p.website).length;
	const successful = providers.filter(
		(p) => p.enrichment.scrapingConfidence > 0
	).length;
	const avgConfidence =
		providers.length > 0
			? providers.reduce((sum, p) => sum + p.enrichment.scrapingConfidence, 0) /
			  providers.length
			: 0;

	const highConfidence = providers.filter(
		(p) => p.enrichment.scrapingConfidence >= 80
	).length;
	const mediumConfidence = providers.filter(
		(p) =>
			p.enrichment.scrapingConfidence >= 50 &&
			p.enrichment.scrapingConfidence < 80
	).length;
	const lowConfidence = providers.filter(
		(p) =>
			p.enrichment.scrapingConfidence > 0 &&
			p.enrichment.scrapingConfidence < 50
	).length;

	return {
		total,
		withWebsite,
		successful,
		avgConfidence: Math.round(avgConfidence),
		highConfidence,
		mediumConfidence,
		lowConfidence,
	};
}
