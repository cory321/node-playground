/**
 * Trend validation and demand signal extraction for Deep Research
 * Calls edge functions: serp-search and trend-validator
 */

// ==================== Types ====================

export interface TrendValidation {
	isStable: boolean;
	spikeDetected: boolean;
	spikeRatio: number;
	averageInterest: number;
	maxInterest: number;
	minInterest: number;
	medianInterest: number;
	trendDirection: 'growing' | 'declining' | 'flat' | 'volatile';
	confidenceScore: number;
	flags: string[];
	monthlyData: { date: string; value: number }[];
	fromCache: boolean;
}

export interface SerpDemandSignals {
	lsaPresent: boolean;
	lsaCount: number;
	paidAdsCount: number;
	localPackCount: number;
	localPackTotalReviews: number;
	localPackAvgRating: number;
	establishedBusinesses: number;
	relatedSearchesCount: number;
	relatedSearches: string[];
	peopleAlsoAskCount: number;
	peopleAlsoAsk: string[];
	demandConfidence: 'high' | 'medium' | 'low' | 'unvalidated';
	organicResultsCount: number; // Count of organic search results found
}

export interface SerpSearchResponse {
	organicResults: Array<{ position: number; domain: string; title: string }>;
	localServiceAds: Array<{ title: string; rating: number; reviews: number }>;
	ads: Array<{ position: number; title: string }>;
	relatedSearches: string[];
	peopleAlsoAsk: string[];
	localPack: Array<{ title: string; rating: number; reviews: number }>;
	totalResults: number;
	demandSignals: SerpDemandSignals;
}

// ==================== Helpers ====================

function getSupabaseUrl(): string | null {
	return import.meta.env.VITE_SUPABASE_URL || null;
}

function getSupabaseAnonKey(): string | null {
	return import.meta.env.VITE_SUPABASE_ANON_KEY || null;
}

/**
 * Check if validation APIs are configured
 */
export function hasValidationApi(): boolean {
	return getSupabaseUrl() !== null && getSupabaseAnonKey() !== null;
}

/**
 * DMA (Designated Market Area) codes for major US metros
 * Used for Google Trends geo filtering at metro level
 * Format: 'US-{STATE}-{DMA_CODE}'
 */
const METRO_DMA_CODES: Record<string, string> = {
	// DC Metro (includes Arlington, Alexandria, Fairfax VA, Bethesda MD, etc.)
	'arlington-va': 'US-DC-511',
	'alexandria-va': 'US-DC-511',
	'fairfax-va': 'US-DC-511',
	'mclean-va': 'US-DC-511',
	'bethesda-md': 'US-DC-511',
	'silver spring-md': 'US-DC-511',
	'washington-dc': 'US-DC-511',
	
	// New York Metro
	'new york-ny': 'US-NY-501',
	'brooklyn-ny': 'US-NY-501',
	'queens-ny': 'US-NY-501',
	'manhattan-ny': 'US-NY-501',
	'jersey city-nj': 'US-NY-501',
	'newark-nj': 'US-NY-501',
	
	// Los Angeles Metro
	'los angeles-ca': 'US-CA-803',
	'santa monica-ca': 'US-CA-803',
	'pasadena-ca': 'US-CA-803',
	'long beach-ca': 'US-CA-803',
	'glendale-ca': 'US-CA-803',
	
	// Chicago Metro
	'chicago-il': 'US-IL-602',
	'evanston-il': 'US-IL-602',
	'naperville-il': 'US-IL-602',
	
	// Dallas-Fort Worth Metro
	'dallas-tx': 'US-TX-623',
	'fort worth-tx': 'US-TX-623',
	'arlington-tx': 'US-TX-623',
	'plano-tx': 'US-TX-623',
	'irving-tx': 'US-TX-623',
	
	// Houston Metro
	'houston-tx': 'US-TX-618',
	'sugar land-tx': 'US-TX-618',
	'the woodlands-tx': 'US-TX-618',
	
	// Philadelphia Metro
	'philadelphia-pa': 'US-PA-504',
	'camden-nj': 'US-PA-504',
	
	// Phoenix Metro
	'phoenix-az': 'US-AZ-753',
	'scottsdale-az': 'US-AZ-753',
	'tempe-az': 'US-AZ-753',
	'mesa-az': 'US-AZ-753',
	
	// San Francisco Bay Area
	'san francisco-ca': 'US-CA-807',
	'oakland-ca': 'US-CA-807',
	'san jose-ca': 'US-CA-807',
	'palo alto-ca': 'US-CA-807',
	'fremont-ca': 'US-CA-807',
	
	// Boston Metro
	'boston-ma': 'US-MA-506',
	'cambridge-ma': 'US-MA-506',
	'somerville-ma': 'US-MA-506',
	
	// Atlanta Metro
	'atlanta-ga': 'US-GA-524',
	'marietta-ga': 'US-GA-524',
	'decatur-ga': 'US-GA-524',
	
	// Miami Metro
	'miami-fl': 'US-FL-528',
	'fort lauderdale-fl': 'US-FL-528',
	'boca raton-fl': 'US-FL-528',
	
	// Seattle Metro
	'seattle-wa': 'US-WA-819',
	'bellevue-wa': 'US-WA-819',
	'tacoma-wa': 'US-WA-819',
	
	// Denver Metro
	'denver-co': 'US-CO-751',
	'aurora-co': 'US-CO-751',
	'boulder-co': 'US-CO-751',
	
	// Minneapolis-St. Paul
	'minneapolis-mn': 'US-MN-613',
	'st. paul-mn': 'US-MN-613',
	'saint paul-mn': 'US-MN-613',
	
	// Detroit Metro
	'detroit-mi': 'US-MI-505',
	'ann arbor-mi': 'US-MI-505',
	
	// San Diego Metro
	'san diego-ca': 'US-CA-825',
	
	// Tampa Bay
	'tampa-fl': 'US-FL-539',
	'st. petersburg-fl': 'US-FL-539',
	'clearwater-fl': 'US-FL-539',
	
	// Orlando Metro
	'orlando-fl': 'US-FL-534',
	
	// Austin Metro
	'austin-tx': 'US-TX-635',
	'round rock-tx': 'US-TX-635',
	
	// Portland Metro
	'portland-or': 'US-OR-820',
	
	// Las Vegas Metro
	'las vegas-nv': 'US-NV-839',
	'henderson-nv': 'US-NV-839',
};

/**
 * Get DMA code for a city/state combination
 * Returns null if city is not in a known metro area
 */
function getDmaCode(city: string, state: string | null | undefined): string | null {
	if (!city) return null;
	const key = `${city.toLowerCase().trim()}-${(state || '').toLowerCase().trim()}`;
	return METRO_DMA_CODES[key] || null;
}

/**
 * Convert state code to Google Trends geo format
 * e.g., "VA" -> "US-VA"
 */
function stateToGeo(state: string | null | undefined): string {
	if (!state) return 'US';
	const stateCode = state.toUpperCase().trim();
	if (stateCode.length === 2) {
		return `US-${stateCode}`;
	}
	return 'US';
}

/**
 * Build geo levels for cascading fallback
 * Returns array of geo codes to try in order: metro -> state -> national
 */
function buildGeoLevels(city: string, state: string | null | undefined): string[] {
	const levels: string[] = [];
	
	// Try metro-level DMA code first (most specific)
	const dmaCode = getDmaCode(city, state);
	if (dmaCode) {
		levels.push(dmaCode);
	}
	
	// Try state-level
	if (state) {
		const stateGeo = stateToGeo(state);
		if (stateGeo !== 'US' && !levels.includes(stateGeo)) {
			levels.push(stateGeo);
		}
	}
	
	// Always include national as final fallback
	levels.push('US');
	
	return levels;
}

// ==================== API Calls ====================

/**
 * Fetch trend validation data from Google Trends via edge function (single geo level)
 */
async function fetchTrendValidationSingle(
	keyword: string,
	geo: string,
	skipCache: boolean = false,
): Promise<TrendValidation> {
	const supabaseUrl = getSupabaseUrl();
	const supabaseKey = getSupabaseAnonKey();

	if (!supabaseUrl || !supabaseKey) {
		return createEmptyTrendValidation('VALIDATION_NOT_CONFIGURED');
	}

	try {
		console.log(`[Trend Validation] Searching Google Trends for: "${keyword}" (geo: ${geo})`);
		
		const response = await fetch(
			`${supabaseUrl}/functions/v1/trend-validator`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					apikey: supabaseKey,
					Authorization: `Bearer ${supabaseKey}`,
				},
				body: JSON.stringify({
					keyword,
					geo,
					skipCache,
				}),
			},
		);

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(
				errorData.error || `Trend validator error: ${response.status}`,
			);
		}

		const data: TrendValidation = await response.json();
		console.log(`[Trend Validation] Result for "${keyword}" (${geo}): confidence=${data.confidenceScore}, direction=${data.trendDirection}, avg=${data.averageInterest}, flags=${data.flags.length > 0 ? data.flags.join(', ') : 'none'}`);
		return data;
	} catch (err) {
		console.error('Trend validation error:', err);
		return createEmptyTrendValidation(
			err instanceof Error ? err.message : 'TREND_FETCH_ERROR',
		);
	}
}

/**
 * Check if trend data is sparse (insufficient for validation)
 * 
 * Note: With 'today 12-m' date range, Google Trends returns weekly data points (~52 weeks).
 * We consider data sparse if we have less than 26 points (~6 months of weekly data).
 */
function isTrendDataSparse(validation: TrendValidation): boolean {
	// Consider data sparse if:
	// - No data at all
	// - Confidence score is 0
	// - Less than 26 weeks of data points (~6 months minimum for meaningful analysis)
	// - All values are zero
	const MIN_DATA_POINTS = 26; // ~6 months of weekly data
	
	return (
		validation.confidenceScore === 0 ||
		validation.monthlyData.length < MIN_DATA_POINTS ||
		validation.monthlyData.every((d) => d.value === 0) ||
		validation.flags.some(
			(f) =>
				f.includes('NO_TREND_DATA') ||
				f.includes('NO_SEARCH_INTEREST') ||
				f.includes('INSUFFICIENT_TREND_DATA')
		)
	);
}

/**
 * Fetch trend validation data with cascading geo fallback
 * Tries more specific geo (metro) first, falls back to state, then national
 */
export async function fetchTrendValidation(
	keyword: string,
	geo?: string,
	skipCache: boolean = false,
): Promise<TrendValidation> {
	// If a specific geo is provided, just use that (no fallback)
	if (geo) {
		return fetchTrendValidationSingle(keyword, geo, skipCache);
	}
	
	// Default to national
	return fetchTrendValidationSingle(keyword, 'US', skipCache);
}

/**
 * Fetch trend validation with cascading geo fallback
 * Tries metro -> state -> national until we get usable data
 */
export async function fetchTrendValidationWithFallback(
	keyword: string,
	city: string,
	state: string | null | undefined,
	skipCache: boolean = false,
): Promise<TrendValidation & { geoLevel: string }> {
	const geoLevels = buildGeoLevels(city, state);
	
	for (const geo of geoLevels) {
		const result = await fetchTrendValidationSingle(keyword, geo, skipCache);
		
		// If we have usable data at this level, return it
		if (!isTrendDataSparse(result)) {
			console.log(`[Trend Validation] Found usable data at geo level: ${geo}`);
			return { ...result, geoLevel: geo };
		}
		
		// If this is the last level (national), return whatever we got
		if (geo === 'US') {
			console.log(`[Trend Validation] Using national fallback data for "${keyword}"`);
			// Add a flag indicating we fell back to national
			if (geoLevels.length > 1 && geoLevels[0] !== 'US') {
				result.flags = [
					...result.flags,
					`GEO_FALLBACK: No regional data available, showing national trends`,
				];
			}
			return { ...result, geoLevel: geo };
		}
		
		console.log(`[Trend Validation] Sparse data at ${geo}, trying next level...`);
	}
	
	// Should never reach here, but just in case
	return { ...createEmptyTrendValidation('NO_GEO_LEVELS'), geoLevel: 'US' };
}

/**
 * Fetch demand signals from full Google Search via edge function
 */
export async function fetchDemandSignals(
	query: string,
	city: string,
	state?: string | null,
): Promise<SerpDemandSignals> {
	const supabaseUrl = getSupabaseUrl();
	const supabaseKey = getSupabaseAnonKey();

	if (!supabaseUrl || !supabaseKey) {
		return createEmptyDemandSignals();
	}

	try {
		console.log(`[Demand Signals] Searching Google for: "${query}" in ${city}${state ? `, ${state}` : ''}`);
		
		const response = await fetch(`${supabaseUrl}/functions/v1/serp-search`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				apikey: supabaseKey,
				Authorization: `Bearer ${supabaseKey}`,
			},
			body: JSON.stringify({
				query,
				city,
				state,
			}),
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(
				errorData.error || `SERP search error: ${response.status}`,
			);
		}

		const data: SerpSearchResponse = await response.json();
		console.log(`[Demand Signals] Result for "${query}": confidence=${data.demandSignals.demandConfidence}, LSAs=${data.demandSignals.lsaCount}, Ads=${data.demandSignals.paidAdsCount}`);
		return {
			...data.demandSignals,
			relatedSearches: data.relatedSearches,
			peopleAlsoAsk: data.peopleAlsoAsk,
		};
	} catch (err) {
		console.error('Demand signals error:', err);
		return createEmptyDemandSignals();
	}
}

/**
 * Fetch full SERP search response including all components
 */
export async function fetchFullSerpSearch(
	query: string,
	city: string,
	state?: string | null,
): Promise<SerpSearchResponse | null> {
	const supabaseUrl = getSupabaseUrl();
	const supabaseKey = getSupabaseAnonKey();

	if (!supabaseUrl || !supabaseKey) {
		console.warn('[SERP Search] Supabase not configured');
		return null;
	}

	try {
		console.log(`[SERP Search] Fetching: "${query}" in ${city}, ${state || 'N/A'}`);
		
		const response = await fetch(`${supabaseUrl}/functions/v1/serp-search`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				apikey: supabaseKey,
				Authorization: `Bearer ${supabaseKey}`,
			},
			body: JSON.stringify({
				query,
				city,
				state,
			}),
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			const errorMsg = errorData.error || `SERP search error: ${response.status}`;
			console.error(`[SERP Search] API error for "${query}": ${errorMsg}`);
			throw new Error(errorMsg);
		}

		const data = await response.json() as SerpSearchResponse;
		
		// Log what we received for debugging
		console.log(`[SERP Search] Response for "${query}": ${data.organicResults?.length ?? 0} organic results, ${data.demandSignals?.organicResultsCount ?? 'N/A'} in demandSignals`);
		
		// Validate that organic results count is set correctly
		if (data.demandSignals && data.organicResults) {
			// Ensure demandSignals.organicResultsCount matches actual results
			if (data.demandSignals.organicResultsCount === 0 && data.organicResults.length > 0) {
				console.warn(`[SERP Search] Data mismatch: organicResults has ${data.organicResults.length} items but demandSignals.organicResultsCount is 0. Fixing...`);
				data.demandSignals.organicResultsCount = data.organicResults.length;
			}
		}
		
		return data;
	} catch (err) {
		console.error('[SERP Search] Full SERP search error:', err);
		return null;
	}
}

/**
 * Validate a market keyword with both trend and demand signals
 * This is the main entry point for market validation
 * 
 * IMPORTANT: For Google Trends, we use the service category ONLY (e.g., "garage door repair")
 * and rely on the geo parameter for location filtering (e.g., "US-VA" for Virginia,
 * "US-DC-511" for Washington DC metro area).
 * 
 * This avoids the issue of appending city/state to keywords which returns no data
 * (e.g., "garage door repair Arlington County Virginia" has no search volume).
 */
export async function validateMarketKeyword(
	category: string,
	city: string,
	state?: string | null,
): Promise<{
	trendValidation: TrendValidation & { geoLevel?: string };
	demandSignals: SerpDemandSignals;
}> {
	// Use category ONLY as the keyword for Google Trends
	// The geo parameter handles location filtering
	const keyword = category.trim();

	// Fetch both in parallel
	// - Trend validation uses geo codes (metro DMA -> state -> national fallback)
	// - Demand signals uses city/state for localized SERP results
	const [trendValidation, demandSignals] = await Promise.all([
		fetchTrendValidationWithFallback(keyword, city, state),
		fetchDemandSignals(category, city, state),
	]);

	return {
		trendValidation,
		demandSignals,
	};
}

/**
 * Extended validation that also returns organic results for aggregator analysis
 * This is a single-call alternative to fetchSerpData + validateMarketKeyword
 * Returns everything needed for full SERP analysis in one API call
 */
export async function validateMarketKeywordWithSerpData(
	category: string,
	city: string,
	state?: string | null,
): Promise<{
	trendValidation: TrendValidation & { geoLevel?: string };
	demandSignals: SerpDemandSignals;
	organicResults: Array<{ position: number; domain: string; title: string }>;
	totalResults: number;
}> {
	const keyword = category.trim();

	// Fetch trend validation and full SERP data in parallel
	const [trendValidation, serpResponse] = await Promise.all([
		fetchTrendValidationWithFallback(keyword, city, state),
		fetchFullSerpSearch(category, city, state),
	]);

	if (!serpResponse) {
		// If SERP search failed, return empty data with a warning flag
		console.warn(`[Demand Signals] SERP search returned null for "${category}" - returning empty data. This may indicate the serp-search edge function is not deployed or there's an API error.`);
		const emptySignals = createEmptyDemandSignals();
		// Add a flag to help identify this case in the UI
		return {
			trendValidation: {
				...trendValidation,
				flags: [...trendValidation.flags, 'SERP_SEARCH_FAILED: Unable to fetch organic results - check edge function deployment'],
			},
			demandSignals: emptySignals,
			organicResults: [],
			totalResults: 0,
		};
	}

	// Extract demand signals with related searches and PAA
	const demandSignals: SerpDemandSignals = {
		...serpResponse.demandSignals,
		relatedSearches: serpResponse.relatedSearches,
		peopleAlsoAsk: serpResponse.peopleAlsoAsk,
	};

	// Log full organic results info for debugging
	console.log(`[Demand Signals] Result for "${category}": confidence=${demandSignals.demandConfidence}, LSAs=${demandSignals.lsaCount}, Ads=${demandSignals.paidAdsCount}, OrganicResults=${demandSignals.organicResultsCount}, ActualOrganicArray=${serpResponse.organicResults?.length ?? 0}`);

	return {
		trendValidation,
		demandSignals,
		organicResults: serpResponse.organicResults,
		totalResults: serpResponse.totalResults,
	};
}

// ==================== Empty/Default Constructors ====================

function createEmptyTrendValidation(flag?: string): TrendValidation {
	return {
		isStable: false,
		spikeDetected: false,
		spikeRatio: 0,
		averageInterest: 0,
		maxInterest: 0,
		minInterest: 0,
		medianInterest: 0,
		trendDirection: 'flat',
		confidenceScore: 0,
		flags: flag ? [flag] : [],
		monthlyData: [],
		fromCache: false,
	};
}

function createEmptyDemandSignals(): SerpDemandSignals {
	return {
		lsaPresent: false,
		lsaCount: 0,
		paidAdsCount: 0,
		localPackCount: 0,
		localPackTotalReviews: 0,
		localPackAvgRating: 0,
		establishedBusinesses: 0,
		relatedSearchesCount: 0,
		relatedSearches: [],
		peopleAlsoAskCount: 0,
		peopleAlsoAsk: [],
		demandConfidence: 'unvalidated',
		organicResultsCount: 0,
	};
}

// ==================== Utility Functions ====================

/**
 * Check if trend validation indicates a problematic market
 */
export function hasCriticalTrendFlags(validation: TrendValidation): boolean {
	return validation.flags.some(
		(f) =>
			f.includes('SPIKE_ANOMALY') ||
			f.includes('NO_TREND_DATA') ||
			f.includes('DECLINING_TREND') ||
			f.includes('INSUFFICIENT_TREND_DATA') ||
			f.includes('NO_SEARCH_INTEREST'),
	);
}

/**
 * Get a human-readable summary of validation status
 */
export function getValidationSummary(
	trendValidation: TrendValidation,
	demandSignals: SerpDemandSignals,
): {
	status: 'validated' | 'warning' | 'unvalidated';
	message: string;
} {
	if (trendValidation.flags.some((f) => f.includes('SPIKE_ANOMALY'))) {
		return {
			status: 'warning',
			message: `Spike detected (${trendValidation.spikeRatio}x median) - demand may be inflated by single event`,
		};
	}

	if (trendValidation.flags.some((f) => f.includes('DECLINING_TREND'))) {
		return {
			status: 'warning',
			message: 'Search interest declining - market may be shrinking',
		};
	}

	if (trendValidation.confidenceScore === 0) {
		return {
			status: 'unvalidated',
			message: 'No trend data available for validation',
		};
	}

	if (demandSignals.demandConfidence === 'high' && trendValidation.isStable) {
		return {
			status: 'validated',
			message: 'Strong demand signals with stable search trends',
		};
	}

	if (demandSignals.demandConfidence === 'medium') {
		return {
			status: 'validated',
			message: 'Moderate demand signals detected',
		};
	}

	return {
		status: 'unvalidated',
		message: 'Insufficient data for full validation',
	};
}
