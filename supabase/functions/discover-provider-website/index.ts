import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

// CORS headers for browser requests
const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Headers':
		'authorization, x-client-info, apikey, content-type',
	'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Aggregator and directory domains to filter out
const EXCLUDED_DOMAINS = [
	// Review sites
	'yelp.com',
	'yellowpages.com',
	'bbb.org',
	'manta.com',
	'superpages.com',
	'citysearch.com',
	'merchantcircle.com',
	'judysbook.com',
	// Lead gen platforms
	'angieslist.com',
	'angi.com',
	'homeadvisor.com',
	'thumbtack.com',
	'porch.com',
	'houzz.com',
	'bark.com',
	'networx.com',
	'homeguide.com',
	'improvenet.com',
	// Social media
	'facebook.com',
	'linkedin.com',
	'instagram.com',
	'twitter.com',
	'x.com',
	'nextdoor.com',
	'pinterest.com',
	'tiktok.com',
	// Maps and directories
	'google.com',
	'maps.google.com',
	'bing.com',
	'mapquest.com',
	'apple.com',
	// Other aggregators
	'chamberofcommerce.com',
	'dandb.com',
	'dnb.com',
	'bizapedia.com',
	'buzzfile.com',
	'opencorporates.com',
	'crunchbase.com',
];

interface RequestBody {
	providerName: string;
	phone?: string;
	address?: string;
	city: string;
	state?: string;
}

interface SerpApiOrganicResult {
	position: number;
	title: string;
	link: string;
	domain?: string;
	displayed_link?: string;
	snippet?: string;
}

interface SerpApiResponse {
	organic_results?: SerpApiOrganicResult[];
	error?: string;
}

interface DiscoveryResult {
	discoveredUrl: string | null;
	discoverySource: 'serp_organic' | 'phone_lookup' | null;
	discoveryConfidence: number;
	candidatesChecked: number;
}

/**
 * Extract domain from URL, removing www prefix
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
 * Check if a domain is an excluded aggregator/directory
 */
function isExcludedDomain(domain: string): boolean {
	const normalizedDomain = domain.toLowerCase();
	return EXCLUDED_DOMAINS.some(
		(excluded) =>
			normalizedDomain === excluded ||
			normalizedDomain.endsWith(`.${excluded}`),
	);
}

/**
 * Normalize business name for comparison
 */
function normalizeName(name: string): string {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9\s]/g, '') // Remove special chars
		.replace(/\s+/g, ' ') // Normalize whitespace
		.replace(
			/\b(llc|inc|corp|co|ltd|company|services|service|pros?|solutions?)\b/g,
			'',
		)
		.trim();
}

/**
 * Calculate how well a title matches the business name
 */
function calculateTitleMatchScore(title: string, businessName: string): number {
	const normalizedTitle = normalizeName(title);
	const normalizedBusiness = normalizeName(businessName);

	// Exact match (after normalization)
	if (normalizedTitle.includes(normalizedBusiness)) {
		return 100;
	}

	// Check for word overlap
	const titleWords = normalizedTitle.split(' ').filter((w) => w.length > 2);
	const businessWords = normalizedBusiness
		.split(' ')
		.filter((w) => w.length > 2);

	if (businessWords.length === 0) return 0;

	const matchingWords = businessWords.filter((word) =>
		titleWords.some(
			(tw) =>
				tw.includes(word) ||
				word.includes(tw) ||
				levenshteinSimilarity(tw, word) > 0.8,
		),
	);

	return Math.round((matchingWords.length / businessWords.length) * 80);
}

/**
 * Calculate Levenshtein similarity (0-1)
 */
function levenshteinSimilarity(a: string, b: string): number {
	if (a === b) return 1;
	if (a.length === 0 || b.length === 0) return 0;

	const matrix: number[][] = [];

	for (let i = 0; i <= a.length; i++) {
		matrix[i] = [i];
	}
	for (let j = 0; j <= b.length; j++) {
		matrix[0][j] = j;
	}

	for (let i = 1; i <= a.length; i++) {
		for (let j = 1; j <= b.length; j++) {
			const cost = a[i - 1] === b[j - 1] ? 0 : 1;
			matrix[i][j] = Math.min(
				matrix[i - 1][j] + 1,
				matrix[i][j - 1] + 1,
				matrix[i - 1][j - 1] + cost,
			);
		}
	}

	const distance = matrix[a.length][b.length];
	return 1 - distance / Math.max(a.length, b.length);
}

/**
 * Check if domain contains business name elements
 */
function domainContainsBusinessName(
	domain: string,
	businessName: string,
): boolean {
	const normalizedDomain = domain.toLowerCase().replace(/[^a-z0-9]/g, '');
	const businessWords = normalizeName(businessName)
		.split(' ')
		.filter((w) => w.length > 2);

	// Check if at least one significant word from business name is in domain
	return businessWords.some(
		(word) => word.length > 3 && normalizedDomain.includes(word),
	);
}

/**
 * Check if snippet contains phone number
 */
function snippetContainsPhone(snippet: string, phone: string): boolean {
	if (!phone || !snippet) return false;

	// Normalize phone to just digits
	const phoneDigits = phone.replace(/\D/g, '');
	if (phoneDigits.length < 10) return false;

	// Check various phone formats in snippet
	const snippetDigits = snippet.replace(/\D/g, '');

	// Check for last 10 digits match (handles country codes)
	const phoneLast10 = phoneDigits.slice(-10);
	return snippetDigits.includes(phoneLast10);
}

/**
 * Normalize phone number and generate search variants
 * Returns array of phone formats to try in order of preference
 */
function getPhoneSearchVariants(phone: string): string[] {
	if (!phone) return [];

	// Extract digits only, strip country code
	let digits = phone.replace(/\D/g, '');
	if (digits.length === 11 && digits.startsWith('1')) {
		digits = digits.slice(1); // Remove US country code
	}
	if (digits.length !== 10) return [];

	const areaCode = digits.slice(0, 3);
	const prefix = digits.slice(3, 6);
	const line = digits.slice(6, 10);

	return [
		`${areaCode}-${prefix}-${line}`, // 555-123-4567 (most common)
		`(${areaCode}) ${prefix}-${line}`, // (555) 123-4567
		digits, // 5551234567
	];
}

/**
 * Check if snippet or URL contains the address
 */
function snippetContainsAddress(
	snippet: string,
	displayedLink: string | undefined,
	address: string,
): boolean {
	if (!address || (!snippet && !displayedLink)) return false;

	// Normalize address - lowercase, remove extra spaces
	const normalizedAddress = address.toLowerCase().replace(/\s+/g, ' ').trim();

	// Extract street number and street name (first two parts)
	const addressParts = normalizedAddress.split(/[,\s]+/).filter(Boolean);
	if (addressParts.length < 2) return false;

	// Get street number and first word of street name
	const streetNumber = addressParts[0];
	const streetName = addressParts[1];

	// Check if street number and name appear in snippet or URL
	const textToCheck = `${snippet || ''} ${displayedLink || ''}`.toLowerCase();

	// Street number must be present
	if (!textToCheck.includes(streetNumber)) return false;

	// Street name (or abbreviation) should be nearby
	// Handle common abbreviations
	const streetVariants = [
		streetName,
		streetName.replace(/street/i, 'st'),
		streetName.replace(/st$/i, 'street'),
		streetName.replace(/avenue/i, 'ave'),
		streetName.replace(/ave$/i, 'avenue'),
		streetName.replace(/road/i, 'rd'),
		streetName.replace(/rd$/i, 'road'),
		streetName.replace(/drive/i, 'dr'),
		streetName.replace(/dr$/i, 'drive'),
		streetName.replace(/boulevard/i, 'blvd'),
		streetName.replace(/blvd$/i, 'boulevard'),
		streetName.replace(/lane/i, 'ln'),
		streetName.replace(/ln$/i, 'lane'),
	];

	return streetVariants.some((variant) => textToCheck.includes(variant));
}

/**
 * Score a search result for how likely it is the provider's official website
 * Enhanced with phone and address matching
 */
function scoreResult(
	result: SerpApiOrganicResult,
	businessName: string,
	phone?: string,
	address?: string,
	searchStrategy?: 'phone' | 'address' | 'name',
): { score: number; reasons: string[] } {
	const domain = result.domain || extractDomain(result.link);
	const reasons: string[] = [];
	let score = 0;

	// Check if excluded domain
	if (isExcludedDomain(domain)) {
		return { score: 0, reasons: ['Excluded aggregator domain'] };
	}

	// Phone number match in snippet (50 points - highest priority)
	const hasPhoneMatch =
		phone && result.snippet && snippetContainsPhone(result.snippet, phone);
	if (hasPhoneMatch) {
		score += 50;
		reasons.push('Phone number found in snippet');
	}

	// Address match in snippet (40 points)
	const hasAddressMatch =
		address &&
		snippetContainsAddress(
			result.snippet || '',
			result.displayed_link,
			address,
		);
	if (hasAddressMatch) {
		score += 40;
		reasons.push('Address found in snippet');
	}

	// Combined phone + address match bonus (20 points)
	if (hasPhoneMatch && hasAddressMatch) {
		score += 20;
		reasons.push('Both phone and address match');
	}

	// Title match scoring (up to 40 points)
	const titleScore = calculateTitleMatchScore(result.title, businessName);
	if (titleScore > 0) {
		score += Math.round(titleScore * 0.4);
		if (titleScore >= 80) {
			reasons.push('Strong title match');
		} else if (titleScore >= 50) {
			reasons.push('Partial title match');
		}
	}

	// Domain contains business name (25 points)
	if (domainContainsBusinessName(domain, businessName)) {
		score += 25;
		reasons.push('Domain contains business name');
	}

	// Position bonus (up to 10 points for top positions)
	if (result.position <= 3) {
		const positionBonus = 10 - (result.position - 1) * 3;
		score += positionBonus;
		reasons.push(`Position ${result.position} in results`);
	}

	// Snippet mentions location-relevant terms (5 points)
	if (
		result.snippet &&
		/\b(local|serving|service area|located in)\b/i.test(result.snippet)
	) {
		score += 5;
		reasons.push('Snippet mentions local service');
	}

	// Strategy-specific bonus: if we searched by phone and found phone match, extra confidence
	if (searchStrategy === 'phone' && hasPhoneMatch) {
		score += 15;
		reasons.push('Phone search found phone match');
	}
	if (searchStrategy === 'address' && hasAddressMatch) {
		score += 15;
		reasons.push('Address search found address match');
	}

	return { score, reasons };
}

// Search strategy types
type SearchStrategy = 'phone_only' | 'phone_location' | 'address' | 'name';

/**
 * Perform a SerpAPI search with the given query
 */
async function performSearch(
	serpApiKey: string,
	query: string,
	city: string,
	state: string | undefined,
): Promise<SerpApiOrganicResult[]> {
	const serpParams = new URLSearchParams({
		api_key: serpApiKey,
		engine: 'google',
		q: query,
		location: `${city}, ${state || 'United States'}`,
		google_domain: 'google.com',
		gl: 'us',
		hl: 'en',
		num: '10',
	});

	const serpResponse = await fetch(
		`https://serpapi.com/search.json?${serpParams.toString()}`,
	);

	if (!serpResponse.ok) {
		console.error(`SerpAPI error: ${serpResponse.status}`);
		return [];
	}

	const serpData = (await serpResponse.json()) as SerpApiResponse;

	if (serpData.error) {
		console.error(`SerpAPI returned error: ${serpData.error}`);
		return [];
	}

	return serpData.organic_results || [];
}

/**
 * Score and pick best result from search results
 */
function pickBestResult(
	results: SerpApiOrganicResult[],
	businessName: string,
	phone: string | undefined,
	address: string | undefined,
	strategy: SearchStrategy,
	minConfidence: number,
): { url: string; score: number; reasons: string[] } | null {
	if (results.length === 0) return null;

	const searchType =
		strategy === 'phone_only' || strategy === 'phone_location'
			? 'phone'
			: strategy === 'address'
				? 'address'
				: 'name';

	const scoredResults = results.map((result) => {
		const { score, reasons } = scoreResult(
			result,
			businessName,
			phone,
			address,
			searchType,
		);
		return {
			url: result.link,
			domain: result.domain || extractDomain(result.link),
			title: result.title,
			score,
			reasons,
		};
	});

	// Sort by score descending
	scoredResults.sort((a, b) => b.score - a.score);

	const best = scoredResults[0];
	if (best && best.score >= minConfidence) {
		return { url: best.url, score: best.score, reasons: best.reasons };
	}

	return null;
}

/**
 * Multi-strategy website discovery
 * Tries strategies in order: phone (unquoted) -> phone (quoted) -> phone+location -> address -> name
 */
async function discoverWithMultipleStrategies(
	serpApiKey: string,
	providerName: string,
	phone: string | undefined,
	address: string | undefined,
	city: string,
	state: string | undefined,
): Promise<DiscoveryResult> {
	const MINIMUM_CONFIDENCE = 30;
	const location = state ? `${city}, ${state}` : city;
	let totalCandidatesChecked = 0;

	// Phone-based strategies (most effective for unique identification)
	if (phone) {
		const phoneVariants = getPhoneSearchVariants(phone);
		if (phoneVariants.length > 0) {
			// Strategy 1: Unquoted phone search (allows Google fuzzy matching of formats)
			// This is how users typically search and works best
			const digitsOnly = phoneVariants[2]; // e.g. "5551234567"
			console.log(`Strategy 1: Unquoted phone search with ${digitsOnly}`);

			const unquotedResults = await performSearch(
				serpApiKey,
				digitsOnly,
				city,
				state,
			);
			totalCandidatesChecked += unquotedResults.length;

			const unquotedBest = pickBestResult(
				unquotedResults,
				providerName,
				phone,
				address,
				'phone_only',
				MINIMUM_CONFIDENCE,
			);

			if (unquotedBest) {
				console.log(
					`Unquoted phone search found: ${unquotedBest.url} (score: ${unquotedBest.score})`,
				);
				return {
					discoveredUrl: unquotedBest.url,
					discoverySource: 'phone_lookup',
					discoveryConfidence: Math.min(100, unquotedBest.score),
					candidatesChecked: totalCandidatesChecked,
				};
			}

			// Strategy 2: Quoted phone search with dash format (exact match)
			console.log(`Strategy 2: Quoted phone search with "${phoneVariants[0]}"`);
			const quotedQuery = `"${phoneVariants[0]}"`;
			const quotedResults = await performSearch(
				serpApiKey,
				quotedQuery,
				city,
				state,
			);
			totalCandidatesChecked += quotedResults.length;

			const quotedBest = pickBestResult(
				quotedResults,
				providerName,
				phone,
				address,
				'phone_only',
				MINIMUM_CONFIDENCE,
			);

			if (quotedBest) {
				console.log(
					`Quoted phone search found: ${quotedBest.url} (score: ${quotedBest.score})`,
				);
				return {
					discoveredUrl: quotedBest.url,
					discoverySource: 'phone_lookup',
					discoveryConfidence: Math.min(100, quotedBest.score),
					candidatesChecked: totalCandidatesChecked,
				};
			}

			// Strategy 3: Phone + location (add location context)
			console.log(
				`Strategy 3: Phone + location search: ${digitsOnly} ${location}`,
			);
			const phoneLocationQuery = `${digitsOnly} ${location}`;
			const locationResults = await performSearch(
				serpApiKey,
				phoneLocationQuery,
				city,
				state,
			);
			totalCandidatesChecked += locationResults.length;

			const locationBest = pickBestResult(
				locationResults,
				providerName,
				phone,
				address,
				'phone_location',
				MINIMUM_CONFIDENCE,
			);

			if (locationBest) {
				console.log(
					`Phone+location search found: ${locationBest.url} (score: ${locationBest.score})`,
				);
				return {
					discoveredUrl: locationBest.url,
					discoverySource: 'phone_lookup',
					discoveryConfidence: Math.min(100, locationBest.score),
					candidatesChecked: totalCandidatesChecked,
				};
			}
		}
	}

	// Strategy 4: Address search
	if (address) {
		console.log(`Strategy 4: Address search: "${address}" ${location}`);
		const addressQuery = `"${address}" ${location}`;
		const addressResults = await performSearch(
			serpApiKey,
			addressQuery,
			city,
			state,
		);
		totalCandidatesChecked += addressResults.length;

		const addressBest = pickBestResult(
			addressResults,
			providerName,
			phone,
			address,
			'address',
			MINIMUM_CONFIDENCE,
		);

		if (addressBest) {
			console.log(
				`Address search found: ${addressBest.url} (score: ${addressBest.score})`,
			);
			return {
				discoveredUrl: addressBest.url,
				discoverySource: 'serp_organic',
				discoveryConfidence: Math.min(100, addressBest.score),
				candidatesChecked: totalCandidatesChecked,
			};
		}
	}

	// Strategy 5: Name-based search (fallback)
	console.log(`Strategy 5: Name search: "${providerName}" ${location}`);
	const nameQuery = `"${providerName}" ${location}`;
	const nameResults = await performSearch(serpApiKey, nameQuery, city, state);
	totalCandidatesChecked += nameResults.length;

	const nameBest = pickBestResult(
		nameResults,
		providerName,
		phone,
		address,
		'name',
		MINIMUM_CONFIDENCE,
	);

	if (nameBest) {
		console.log(
			`Name search found: ${nameBest.url} (score: ${nameBest.score})`,
		);
		return {
			discoveredUrl: nameBest.url,
			discoverySource: 'serp_organic',
			discoveryConfidence: Math.min(100, nameBest.score),
			candidatesChecked: totalCandidatesChecked,
		};
	}

	// No confident match found with any strategy
	console.log(
		`No confident match found for "${providerName}" after all strategies`,
	);
	return {
		discoveredUrl: null,
		discoverySource: null,
		discoveryConfidence: 0,
		candidatesChecked: totalCandidatesChecked,
	};
}

Deno.serve(async (req: Request) => {
	// Handle CORS preflight
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

		const { providerName, phone, address, city, state } =
			(await req.json()) as RequestBody;

		if (!providerName || !city) {
			return new Response(
				JSON.stringify({ error: 'providerName and city are required' }),
				{
					status: 400,
					headers: { ...corsHeaders, 'Content-Type': 'application/json' },
				},
			);
		}

		console.log(
			`Discovering website for: "${providerName}" in ${city}${state ? `, ${state}` : ''}`,
		);
		if (phone) console.log(`  Phone: ${phone}`);
		if (address) console.log(`  Address: ${address}`);

		// Use multi-strategy discovery
		const result = await discoverWithMultipleStrategies(
			serpApiKey,
			providerName,
			phone,
			address,
			city,
			state,
		);

		return new Response(
			JSON.stringify({
				success: true,
				data: result,
			}),
			{
				status: 200,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			},
		);
	} catch (error) {
		console.error('Website discovery error:', error);
		return new Response(
			JSON.stringify({
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
				data: {
					discoveredUrl: null,
					discoverySource: null,
					discoveryConfidence: 0,
					candidatesChecked: 0,
				},
			}),
			{
				status: 200,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			},
		);
	}
});
