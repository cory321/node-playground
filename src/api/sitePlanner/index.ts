// Site Planner API - Orchestrates brand generation and page brief creation
import { hasSupabase } from '../supabase/client';
import {
	SitePlannerOutput,
	SitePlannerInput,
	BrandIdentity,
	BrandGenerationResponse,
	SiteDepth,
	CompetitionLevel,
} from '@/types/sitePlanner';
import { generatePages, buildContentClusters, buildInternalLinkingRules, assignLaunchPhases } from './generator';

/**
 * Check if Supabase is configured
 */
export function hasSupabaseConfig(): boolean {
	return hasSupabase();
}

/**
 * Generate brand identity using LLM (via edge function)
 */
export async function generateBrand(
	city: string,
	state: string,
	category: string,
	competition: CompetitionLevel,
	regionalCharacter?: string
): Promise<BrandGenerationResponse> {
	const { supabaseUrl, anonKey } = getSupabaseConfig();

	if (!supabaseUrl || !anonKey) {
		throw new Error('Supabase configuration missing');
	}

	const response = await fetch(
		`${supabaseUrl}/functions/v1/site-planner-brand`,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				apikey: anonKey,
				Authorization: `Bearer ${anonKey}`,
			},
			body: JSON.stringify({
				city,
				state,
				category,
				competition,
				regionalCharacter,
			}),
		}
	);

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Brand generation failed: ${response.status} - ${errorText}`);
	}

	return response.json();
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
 * Map SERP analysis to competition level
 */
export function mapCompetitionLevel(
	serpQuality: 'Weak' | 'Medium' | 'Strong',
	serpScore: number
): CompetitionLevel {
	// Weak SERP = low competition (aggregators dominating = opportunity)
	// Strong SERP = high competition (quality locals = harder to compete)
	if (serpQuality === 'Weak' || serpScore <= 3) {
		return 'low';
	} else if (serpQuality === 'Strong' || serpScore >= 7) {
		return 'high';
	}
	return 'medium';
}

/**
 * Generate complete site plan
 */
export async function generateSitePlan(
	input: SitePlannerInput,
	depth: SiteDepth
): Promise<SitePlannerOutput> {
	const { location, serp, providers, localKnowledge } = input;

	// Map competition level from SERP data
	const competition = mapCompetitionLevel(serp.serpQuality, serp.serpScore);

	// Get regional character from local knowledge (if available)
	const regionalCharacter = localKnowledge?.regionalIdentity?.characterization;

	// 1. Generate brand using LLM
	let brand: BrandIdentity;
	try {
		const brandResponse = await generateBrand(
			location.name,
			location.state,
			serp.category,
			competition,
			regionalCharacter
		);
		brand = brandResponse.brand;
	} catch (error) {
		console.error('Brand generation failed, using fallback:', error);
		// Fallback brand
		const categorySlug = serp.category
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '');
		const citySlug = location.name
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '');

		brand = {
			name: `${location.name} ${serp.category} Guide`,
			tagline: `Your trusted local resource for ${serp.category.toLowerCase()}`,
			domain: `${citySlug}${categorySlug}guide.com`,
			voiceTone: {
				personality: ['helpful', 'local', 'straightforward'],
				dos: ['Use neighborhood names', 'Be specific about services'],
				donts: ['No hype language', 'No fake urgency'],
			},
		};
	}

	// 2. Generate pages algorithmically
	const pages = generatePages(
		location,
		serp.category,
		providers,
		localKnowledge,
		depth,
		brand
	);

	// 3. Build content clusters
	const contentClusters = buildContentClusters(pages, serp.category);

	// 4. Build internal linking rules
	const internalLinking = buildInternalLinkingRules();

	// 5. Assign launch phases
	const launchPhases = assignLaunchPhases(pages);

	// 6. Build site structure
	const structure = {
		baseUrl: `https://${brand.domain}`,
		urlPatterns: {
			homepage: '/',
			about: '/about',
			methodology: '/how-we-vet-providers',
			contact: '/contact',
			legal: '/[legal-type]',
			service_hub: '/[service-slug]',
			service_detail: '/[service-slug]/[detail-slug]',
			city_service: '/[city]/[service-slug]',
			provider_listing: '/[city]/providers',
			provider_profile: '/providers/[provider-slug]',
			comparison: '/[city]/compare-providers',
			cost_guide: '/[service-slug]/cost-guide',
			troubleshooting: '/guides/[topic-slug]',
		},
	};

	return {
		brand,
		structure,
		pages,
		contentClusters,
		internalLinking,
		launchPhases,
		meta: {
			generatedAt: new Date().toISOString(),
			depth,
			pageCount: pages.length,
			city: location.name,
			state: location.state,
			category: serp.category,
		},
	};
}
