import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Headers':
		'authorization, x-client-info, apikey, content-type',
	'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Lead generation site patterns to filter out
const LEAD_GEN_PATTERNS = [
	// Common lead gen domain patterns
	/^(get|find|best|top|local|pro|pros|my|your|the|a|an)[\w]*\.(com|net|org|co)$/i,
	// Generic category + location domains
	/^[\w]+(repair|service|plumber|hvac|electric|roofing)[\w]*\.(com|net|org|co)$/i,
];

const LEAD_GEN_DOMAINS = [
	// Known lead gen sites
	'homeadvisor.com',
	'angieslist.com',
	'angi.com',
	'thumbtack.com',
	'porch.com',
	'houzz.com',
	'bark.com',
	'networx.com',
	'homeguide.com',
	'improvenet.com',
	'servicemagic.com',
	'houselogic.com',
	'fixr.com',
	'homewyse.com',
	'craftjack.com',
	'modernize.com',
	// Aggregators and directories
	'yelp.com',
	'yellowpages.com',
	'bbb.org',
	'manta.com',
	'superpages.com',
	'facebook.com',
	'linkedin.com',
	'nextdoor.com',
];

// Keywords that suggest lead gen in business name
const LEAD_GEN_NAME_PATTERNS = [
	/^(find|get|best|top|compare|free quotes?|local)\s/i,
	/\s(near you|in your area|quotes?|estimates?)$/i,
	/^\d+\s+best\s/i, // "10 Best Plumbers..."
];

interface RequestBody {
	query: string;
	city: string;
	state?: string;
	includeLocalPack?: boolean;
	limit?: number; // New: allow requesting more results
}

interface SerpApiMapsResult {
	position: number;
	title: string;
	place_id?: string;
	address?: string;
	phone?: string;
	rating?: number;
	reviews?: number;
	type?: string;
	website?: string;
	thumbnail?: string;
	extensions?: string[];
	gps_coordinates?: {
		latitude: number;
		longitude: number;
	};
}

interface SerpApiMapsResponse {
	local_results?: SerpApiMapsResult[];
	error?: string;
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
 * Check if a provider is likely a lead gen site (competitor)
 */
function isLikelyLeadGen(
	name: string,
	website: string | undefined,
): { isLeadGen: boolean; reason: string | null } {
	// Check business name patterns
	for (const pattern of LEAD_GEN_NAME_PATTERNS) {
		if (pattern.test(name)) {
			return {
				isLeadGen: true,
				reason: `Name matches lead gen pattern: ${name}`,
			};
		}
	}

	// Check website domain
	if (website) {
		const domain = extractDomain(website);

		// Check against known lead gen domains
		for (const leadGenDomain of LEAD_GEN_DOMAINS) {
			if (domain === leadGenDomain || domain.endsWith(`.${leadGenDomain}`)) {
				return { isLeadGen: true, reason: `Known lead gen domain: ${domain}` };
			}
		}

		// Check domain patterns
		for (const pattern of LEAD_GEN_PATTERNS) {
			if (pattern.test(domain)) {
				return {
					isLeadGen: true,
					reason: `Domain matches lead gen pattern: ${domain}`,
				};
			}
		}
	}

	return { isLeadGen: false, reason: null };
}

/**
 * Fetch providers using Google Maps engine (returns 20+ results vs 3 from Local Pack)
 */
async function fetchFromGoogleMaps(
	serpApiKey: string,
	query: string,
	city: string,
	state: string | undefined,
	limit: number,
): Promise<{ results: SerpApiMapsResult[]; filteredCount: number }> {
	const location = state ? `${city}, ${state}` : city;
	const searchQuery = `${query} in ${location}`;

	const params = new URLSearchParams({
		api_key: serpApiKey,
		engine: 'google_maps',
		q: searchQuery,
		type: 'search',
		ll: '', // Let SerpAPI determine from location
		hl: 'en',
	});

	console.log(`Fetching Google Maps results for: ${searchQuery}`);

	const response = await fetch(
		`https://serpapi.com/search.json?${params.toString()}`,
	);

	if (!response.ok) {
		throw new Error(`SerpAPI error: ${response.status}`);
	}

	const data = (await response.json()) as SerpApiMapsResponse;

	if (data.error) {
		throw new Error(`SerpAPI error: ${data.error}`);
	}

	const allResults = data.local_results || [];
	let filteredCount = 0;

	// Filter out lead gen sites
	const filteredResults = allResults.filter((result) => {
		const { isLeadGen, reason } = isLikelyLeadGen(result.title, result.website);
		if (isLeadGen) {
			console.log(`Filtered lead gen: ${result.title} - ${reason}`);
			filteredCount++;
			return false;
		}
		return true;
	});

	// Return up to the requested limit
	return {
		results: filteredResults.slice(0, limit),
		filteredCount,
	};
}

/**
 * Fetch providers using regular Google search Local Pack (limited to 3)
 */
async function fetchFromLocalPack(
	serpApiKey: string,
	query: string,
	city: string,
	state: string | undefined,
): Promise<{
	local_results: { places?: SerpApiMapsResult[] };
	ads: unknown[];
	local_service_ads: unknown[];
}> {
	const location = state ? `${city}, ${state}` : city;

	const params = new URLSearchParams({
		api_key: serpApiKey,
		engine: 'google',
		q: `${query} ${location}`,
		location: location,
		google_domain: 'google.com',
		gl: 'us',
		hl: 'en',
	});

	const response = await fetch(
		`https://serpapi.com/search.json?${params.toString()}`,
	);

	if (!response.ok) {
		throw new Error(`SerpAPI error: ${response.status}`);
	}

	const data = await response.json();

	if (data.error) {
		throw new Error(`SerpAPI error: ${data.error}`);
	}

	// Filter lead gen from local pack too
	const places = data.local_results?.places || [];
	const filteredPlaces = places.filter((result: SerpApiMapsResult) => {
		const { isLeadGen } = isLikelyLeadGen(result.title, result.website);
		return !isLeadGen;
	});

	return {
		local_results: { places: filteredPlaces },
		ads: data.ads || [],
		local_service_ads: data.local_service_ads || [],
	};
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

		const {
			query,
			city,
			state,
			includeLocalPack,
			limit = 10,
		} = (await req.json()) as RequestBody;

		if (!query || !city) {
			return new Response(
				JSON.stringify({ error: 'query and city are required' }),
				{
					status: 400,
					headers: { ...corsHeaders, 'Content-Type': 'application/json' },
				},
			);
		}

		// Use Google Maps engine for more results, or Local Pack for backward compatibility
		if (limit > 3 || !includeLocalPack) {
			// Use Google Maps engine - returns 20+ results
			const { results, filteredCount } = await fetchFromGoogleMaps(
				serpApiKey,
				query,
				city,
				state,
				limit,
			);

			return new Response(
				JSON.stringify({
					local_results: { places: results },
					ads: [],
					local_service_ads: [],
					meta: {
						engine: 'google_maps',
						totalReturned: results.length,
						filteredAsLeadGen: filteredCount,
					},
				}),
				{
					status: 200,
					headers: { ...corsHeaders, 'Content-Type': 'application/json' },
				},
			);
		}

		// Backward compatible: use regular Local Pack
		const data = await fetchFromLocalPack(serpApiKey, query, city, state);

		return new Response(JSON.stringify(data), {
			status: 200,
			headers: { ...corsHeaders, 'Content-Type': 'application/json' },
		});
	} catch (error) {
		console.error('SERP proxy error:', error);
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
