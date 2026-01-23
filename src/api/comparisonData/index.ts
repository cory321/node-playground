// Comparison Data API - Orchestrates comparison page generation
import { hasSupabase } from '../supabase/client';
import { EnrichedProvider } from '@/types/enrichedProvider';
import { LocalKnowledgeOutput } from '@/types/localKnowledge';
import { SitePlannerOutput } from '@/types/sitePlanner';
import {
	GeneratedComparisonData,
	ComparisonDataInput,
	ComparisonDataConfig,
	ComparisonDataGenerationProgress,
	Winner,
} from '@/types/comparisonPage';
import { buildComparisonPage, buildPricingPage } from './generator';
import { calculateMarketStats } from './marketStatsCalculator';
import { selectWinners } from './winnerSelector';

/**
 * Check if Supabase is configured
 */
export function hasSupabaseConfig(): boolean {
	return hasSupabase();
}

/**
 * Get Supabase configuration
 */
function getSupabaseConfig(): { supabaseUrl: string | null; anonKey: string | null } {
	const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || null;
	const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || null;
	return { supabaseUrl, anonKey };
}

/**
 * Call LLM to enhance winner reasons with more detailed content
 */
export async function enhanceWinnerReasons(
	winners: Winner[],
	providers: EnrichedProvider[],
	city: string,
	category: string,
	abortSignal?: AbortSignal
): Promise<Winner[]> {
	const { supabaseUrl, anonKey } = getSupabaseConfig();

	if (!supabaseUrl || !anonKey) {
		// Return original winners without enhancement
		return winners;
	}

	try {
		const response = await fetch(
			`${supabaseUrl}/functions/v1/comparison-data-generator`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					apikey: anonKey,
					Authorization: `Bearer ${anonKey}`,
				},
				body: JSON.stringify({
					action: 'enhance-winners',
					winners,
					providerData: providers.map((p) => ({
						id: p.id,
						name: p.name,
						rating: p.googleRating,
						reviewCount: p.googleReviewCount,
						services: p.enrichment.services.slice(0, 5),
						yearEstablished: p.enrichment.about.yearEstablished,
						emergencyService: p.enrichment.emergencyService,
					})),
					city,
					category,
				}),
				signal: abortSignal,
			}
		);

		if (!response.ok) {
			console.warn('Winner enhancement failed, using defaults');
			return winners;
		}

		const result = await response.json();
		return result.winners || winners;
	} catch (error) {
		if ((error as Error).name === 'AbortError') {
			throw error;
		}
		console.warn('Winner enhancement failed:', error);
		return winners;
	}
}

/**
 * Call LLM to generate detailed comparison analysis
 */
export async function generateAnalysisContent(
	aspect: string,
	providers: EnrichedProvider[],
	city: string,
	category: string,
	abortSignal?: AbortSignal
): Promise<string | null> {
	const { supabaseUrl, anonKey } = getSupabaseConfig();

	if (!supabaseUrl || !anonKey) {
		return null;
	}

	try {
		const response = await fetch(
			`${supabaseUrl}/functions/v1/comparison-data-generator`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					apikey: anonKey,
					Authorization: `Bearer ${anonKey}`,
				},
				body: JSON.stringify({
					action: 'generate-analysis',
					aspect,
					providerCount: providers.length,
					city,
					category,
					dataSnapshot: {
						avgRating:
							providers.reduce((sum, p) => sum + (p.googleRating || 0), 0) /
							providers.length,
						totalReviews: providers.reduce(
							(sum, p) => sum + (p.googleReviewCount || 0),
							0
						),
						licensedCount: providers.filter(
							(p) => p.enrichment.credentials.licenseNumbers.length > 0
						).length,
						emergencyCount: providers.filter(
							(p) => p.enrichment.emergencyService
						).length,
					},
				}),
				signal: abortSignal,
			}
		);

		if (!response.ok) {
			return null;
		}

		const result = await response.json();
		return result.analysis || null;
	} catch (error) {
		if ((error as Error).name === 'AbortError') {
			throw error;
		}
		console.warn('Analysis generation failed:', error);
		return null;
	}
}

/**
 * Call LLM to generate methodology section
 */
export async function generateMethodologyContent(
	providerCount: number,
	category: string,
	city: string,
	abortSignal?: AbortSignal
): Promise<string | null> {
	const { supabaseUrl, anonKey } = getSupabaseConfig();

	if (!supabaseUrl || !anonKey) {
		return null;
	}

	try {
		const response = await fetch(
			`${supabaseUrl}/functions/v1/comparison-data-generator`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					apikey: anonKey,
					Authorization: `Bearer ${anonKey}`,
				},
				body: JSON.stringify({
					action: 'generate-methodology',
					providerCount,
					category,
					city,
				}),
				signal: abortSignal,
			}
		);

		if (!response.ok) {
			return null;
		}

		const result = await response.json();
		return result.methodology || null;
	} catch (error) {
		if ((error as Error).name === 'AbortError') {
			throw error;
		}
		console.warn('Methodology generation failed:', error);
		return null;
	}
}

/**
 * Progress callback type
 */
export type ProgressCallback = (progress: ComparisonDataGenerationProgress) => void;

/**
 * Generate complete comparison data
 */
export async function generateComparisonData(
	input: ComparisonDataInput,
	config: ComparisonDataConfig,
	options?: {
		onProgress?: ProgressCallback;
		abortSignal?: AbortSignal;
	}
): Promise<GeneratedComparisonData> {
	const { enrichedProviders, blueprint, localKnowledge } = input;
	const { includePricing, includeWinnerBadges } = config;
	const { onProgress, abortSignal } = options || {};

	// Validate required inputs
	if (!localKnowledge?.meta) {
		throw new Error('Local knowledge data is missing or invalid. Please re-run the Site Planner to refresh the data.');
	}
	if (!blueprint) {
		throw new Error('Blueprint is missing. Please connect the Site Planner node.');
	}

	const city = localKnowledge.meta.city;
	const category = localKnowledge.meta.category;

	// Calculate total steps
	let totalSteps = 3; // Base: comparison page + market stats + finalize
	if (includePricing) totalSteps += 1;
	if (includeWinnerBadges) totalSteps += 1;
	let completedSteps = 0;

	// Helper to update progress
	const updateProgress = (phase: ComparisonDataGenerationProgress['phase'], currentStep: string) => {
		onProgress?.({
			phase,
			currentStep,
			completedSteps,
			totalSteps,
		});
	};

	// Check for abort
	const checkAbort = () => {
		if (abortSignal?.aborted) {
			throw new DOMException('Generation aborted', 'AbortError');
		}
	};

	try {
		// Step 1: Build comparison page
		updateProgress('generating-comparisons', 'Building comparison table...');
		checkAbort();

		let comparisonPage = buildComparisonPage(
			enrichedProviders,
			blueprint,
			localKnowledge
		);
		completedSteps++;

		// Step 2: Enhance winners with LLM (if enabled)
		if (includeWinnerBadges) {
			updateProgress('generating-analysis', 'Enhancing winner descriptions...');
			checkAbort();

			const enhancedWinners = await enhanceWinnerReasons(
				comparisonPage.content.winners,
				enrichedProviders,
				city,
				category,
				abortSignal
			);
			comparisonPage = {
				...comparisonPage,
				content: {
					...comparisonPage.content,
					winners: enhancedWinners,
				},
			};
			completedSteps++;
		}

		// Step 3: Build pricing page (if enabled)
		const pricingPages = [];
		if (includePricing) {
			updateProgress('generating-pricing', 'Building pricing page...');
			checkAbort();

			const pricingPage = buildPricingPage(
				enrichedProviders,
				localKnowledge,
				category
			);
			pricingPages.push(pricingPage);
			completedSteps++;
		}

		// Step 4: Calculate market stats
		updateProgress('analyzing', 'Calculating market statistics...');
		checkAbort();

		const marketStats = calculateMarketStats(enrichedProviders, city);
		completedSteps++;

		// Step 5: Finalize
		updateProgress('complete', 'Generation complete');
		completedSteps++;

		return {
			comparisonPages: [comparisonPage],
			pricingPages,
			marketStats,
			generatedAt: new Date().toISOString(),
		};
	} catch (error) {
		if ((error as Error).name === 'AbortError') {
			throw error;
		}
		console.error('Comparison data generation failed:', error);
		throw error;
	}
}

// Re-export useful functions
export { selectWinners, calculateTrustScore } from './winnerSelector';
export { calculateMarketStats, calculateMarketInsights } from './marketStatsCalculator';
export { buildComparisonTable, buildComparisonPage, buildPricingPage } from './generator';
export {
	aggregatePricingData,
	generateQuickAnswer,
	generatePriceTable,
} from './pricingAnalyzer';
