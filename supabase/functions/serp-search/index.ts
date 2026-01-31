import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Headers':
		'authorization, x-client-info, apikey, content-type',
	'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface RequestBody {
	query: string;
	city: string;
	state?: string;
}

interface OrganicResult {
	position?: number;
	title?: string;
	link?: string;
	domain?: string;
	displayed_link?: string;
	snippet?: string;
	// SerpAPI may return source information
	source?: string;
}

interface LocalServiceAd {
	title: string;
	link?: string;
	rating?: number;
	reviews?: number;
	phone?: string;
}

interface Ad {
	position: number;
	title: string;
	link: string;
	displayed_link?: string;
	description?: string;
}

interface LocalPackPlace {
	position: number;
	title: string;
	rating?: number;
	reviews?: number;
	address?: string;
	phone?: string;
	website?: string;
	type?: string;
}

interface RelatedSearch {
	query: string;
	link?: string;
}

interface PeopleAlsoAsk {
	question: string;
	snippet?: string;
	link?: string;
}

interface SerpApiResponse {
	search_metadata?: {
		status: string;
		total_time_taken?: number;
	};
	search_information?: {
		total_results?: number;
		query_displayed?: string;
	};
	organic_results?: OrganicResult[];
	local_results?: {
		places?: LocalPackPlace[];
	};
	local_service_ads?: LocalServiceAd[];
	ads?: Ad[];
	related_searches?: RelatedSearch[];
	related_questions?: PeopleAlsoAsk[];
	error?: string;
}

interface SerpSearchResponse {
	organicResults: Array<{ position: number; domain: string; title: string }>;
	localServiceAds: Array<{ title: string; rating: number; reviews: number }>;
	ads: Array<{ position: number; title: string }>;
	relatedSearches: string[];
	peopleAlsoAsk: string[];
	localPack: Array<{ title: string; rating: number; reviews: number }>;
	totalResults: number;
	// Computed demand signals
	demandSignals: {
		lsaPresent: boolean;
		lsaCount: number;
		paidAdsCount: number;
		localPackCount: number;
		localPackTotalReviews: number;
		localPackAvgRating: number;
		establishedBusinesses: number;
		relatedSearchesCount: number;
		peopleAlsoAskCount: number;
		demandConfidence: 'high' | 'medium' | 'low' | 'unvalidated';
		organicResultsCount: number; // Count of organic search results found
	};
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
	try {
		const hostname = new URL(url).hostname;
		return hostname.replace(/^www\./, '').toLowerCase();
	} catch {
		return url.toLowerCase();
	}
}

/**
 * Expand state code to full name for SerpAPI location parameter
 * SerpAPI works better with full state names
 */
function expandStateCode(stateCode: string): string {
	const stateMap: Record<string, string> = {
		'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
		'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
		'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho',
		'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas',
		'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
		'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi',
		'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada',
		'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
		'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma',
		'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
		'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah',
		'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia',
		'WI': 'Wisconsin', 'WY': 'Wyoming', 'DC': 'District of Columbia',
	};
	const code = stateCode.toUpperCase().trim();
	return stateMap[code] || stateCode;
}

/**
 * Calculate demand confidence based on multiple signals
 */
function calculateDemandConfidence(
	lsaCount: number,
	adsCount: number,
	localPackCount: number,
	totalReviews: number,
	relatedSearchesCount: number,
	paaCount: number,
): 'high' | 'medium' | 'low' | 'unvalidated' {
	let score = 0;

	// LSAs are the strongest signal (providers paying = demand validated)
	if (lsaCount > 0) score += 30;

	// Paid ads indicate demand
	if (adsCount > 0) score += 20;

	// Local pack presence
	if (localPackCount >= 3) score += 15;

	// Review volume indicates market activity
	if (totalReviews > 100) score += 15;
	else if (totalReviews > 50) score += 10;

	// Related searches indicate search behavior
	if (relatedSearchesCount >= 5) score += 10;
	else if (relatedSearchesCount >= 3) score += 5;

	// People Also Ask indicates search intent depth
	if (paaCount >= 3) score += 10;
	else if (paaCount >= 1) score += 5;

	if (score >= 70) return 'high';
	if (score >= 40) return 'medium';
	if (score >= 20) return 'low';
	return 'unvalidated';
}

Deno.serve(async (req: Request) => {
	if (req.method === 'OPTIONS') {
		return new Response('ok', { headers: corsHeaders });
	}

	try {
		const serpApiKey = Deno.env.get('SERP_API_KEY');
		if (!serpApiKey) {
			return new Response(
				JSON.stringify({ error: 'SERP_API_KEY not configured' }),
				{
					status: 500,
					headers: { ...corsHeaders, 'Content-Type': 'application/json' },
				},
			);
		}

		const { query, city, state } = (await req.json()) as RequestBody;

		if (!query || !city) {
			return new Response(
				JSON.stringify({ error: 'query and city are required' }),
				{
					status: 400,
					headers: { ...corsHeaders, 'Content-Type': 'application/json' },
				},
			);
		}

		// Build location string - SerpAPI prefers "City, State, United States" format
		const stateExpanded = state ? expandStateCode(state) : null;
		const locationForApi = stateExpanded 
			? `${city}, ${stateExpanded}, United States` 
			: `${city}, United States`;
		const locationForQuery = state ? `${city}, ${state}` : city;
		const searchQuery = `${query} ${locationForQuery}`;

		console.log(`[SERP Debug] Location for API: ${locationForApi}, Query: ${searchQuery}`);

		// Use regular Google Search engine to get full SERP data
		const params = new URLSearchParams({
			api_key: serpApiKey,
			engine: 'google',
			q: searchQuery,
			location: locationForApi,
			google_domain: 'google.com',
			gl: 'us',
			hl: 'en',
			num: '20', // Request more results
		});

		console.log(`Fetching Google Search results for: ${searchQuery}`);

		const response = await fetch(
			`https://serpapi.com/search.json?${params.toString()}`,
		);

		if (!response.ok) {
			throw new Error(`SerpAPI error: ${response.status}`);
		}

		const data = (await response.json()) as SerpApiResponse;

		if (data.error) {
			throw new Error(`SerpAPI error: ${data.error}`);
		}

		// Debug: Log response structure to identify organic results location
		const responseKeys = Object.keys(data);
		console.log(`[SERP Debug] Response keys: ${responseKeys.join(', ')}`);
		console.log(`[SERP Debug] organic_results exists: ${!!data.organic_results}, count: ${data.organic_results?.length ?? 0}`);
		
		// Also check for alternative organic result locations (SerpAPI sometimes varies)
		const rawData = data as Record<string, unknown>;
		if (!data.organic_results || data.organic_results.length === 0) {
			// Check alternative keys that SerpAPI might use
			const alternativeKeys = ['results', 'web_results', 'search_results'];
			for (const key of alternativeKeys) {
				if (rawData[key] && Array.isArray(rawData[key])) {
					console.log(`[SERP Debug] Found results under alternative key: ${key}, count: ${(rawData[key] as unknown[]).length}`);
				}
			}
		}

		// Extract all SERP components
		// Handle both standard and alternative response structures
		let rawOrganic = data.organic_results || [];
		
		// Fallback: Check if organic results are nested differently
		if (rawOrganic.length === 0 && rawData.organic_results === undefined) {
			// SerpAPI might return results under different keys in some cases
			const alternativeResults = rawData.results || rawData.web_results;
			if (Array.isArray(alternativeResults)) {
				console.log(`[SERP Debug] Using alternative results array, count: ${alternativeResults.length}`);
				rawOrganic = alternativeResults as OrganicResult[];
			}
		}
		
		const organicResults = rawOrganic.slice(0, 10).map((r) => ({
			position: r.position ?? 0,
			domain: r.domain || (r.link ? extractDomain(r.link) : (r.displayed_link || 'unknown')),
			title: r.title || '',
		}));
		
		console.log(`[SERP Debug] Final organic results count: ${organicResults.length}`);
		
		// If we still have no organic results, dump partial response for debugging
		if (organicResults.length === 0) {
			const responsePreview = JSON.stringify(data).substring(0, 1000);
			console.warn(`[SERP Debug] ZERO organic results! Response preview: ${responsePreview}...`);
		}

		const localServiceAds = (data.local_service_ads || []).map((lsa) => ({
			title: lsa.title,
			rating: lsa.rating || 0,
			reviews: lsa.reviews || 0,
		}));

		const ads = (data.ads || []).map((ad) => ({
			position: ad.position,
			title: ad.title,
		}));

		const relatedSearches = (data.related_searches || []).map((rs) => rs.query);

		const peopleAlsoAsk = (data.related_questions || []).map((paa) => paa.question);

		const localPack = (data.local_results?.places || []).map((place) => ({
			title: place.title,
			rating: place.rating || 0,
			reviews: place.reviews || 0,
		}));

		// Calculate demand signals
		const totalReviews = localPack.reduce((sum, p) => sum + p.reviews, 0);
		const avgRating =
			localPack.length > 0
				? localPack.reduce((sum, p) => sum + p.rating, 0) / localPack.length
				: 0;
		const establishedBusinesses = localPack.filter((p) => p.reviews > 50).length;

		const demandConfidence = calculateDemandConfidence(
			localServiceAds.length,
			ads.length,
			localPack.length,
			totalReviews,
			relatedSearches.length,
			peopleAlsoAsk.length,
		);

		const result: SerpSearchResponse = {
			organicResults,
			localServiceAds,
			ads,
			relatedSearches,
			peopleAlsoAsk,
			localPack,
			totalResults: data.search_information?.total_results || 0,
			demandSignals: {
				lsaPresent: localServiceAds.length > 0,
				lsaCount: localServiceAds.length,
				paidAdsCount: ads.length,
				localPackCount: localPack.length,
				localPackTotalReviews: totalReviews,
				localPackAvgRating: Math.round(avgRating * 10) / 10,
				establishedBusinesses,
				relatedSearchesCount: relatedSearches.length,
				peopleAlsoAskCount: peopleAlsoAsk.length,
				demandConfidence,
				organicResultsCount: organicResults.length, // Track organic results count
			},
		};

		return new Response(JSON.stringify(result), {
			status: 200,
			headers: { ...corsHeaders, 'Content-Type': 'application/json' },
		});
	} catch (error) {
		console.error('SERP search error:', error);
		return new Response(
			JSON.stringify({
				error: error instanceof Error ? error.message : 'Unknown error',
			}),
			{
				status: 500,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			},
		);
	}
});
