import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Headers':
		'authorization, x-client-info, apikey, content-type',
	'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface RequestBody {
	keyword: string;
	geo?: string; // e.g., "US-VA" for Virginia, "US" for nationwide
	skipCache?: boolean;
}

interface TimelineDataPoint {
	date: string;
	timestamp?: string;
	values: Array<{
		query?: string;
		value?: string;
		extracted_value?: number;
	}>;
}

interface GoogleTrendsResponse {
	search_metadata?: {
		status: string;
	};
	interest_over_time?: {
		timeline_data?: TimelineDataPoint[];
		averages?: Array<{ query: string; value: number }>;
	};
	error?: string;
}

interface TrendValidationResponse {
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

/**
 * Calculate median of an array of numbers
 */
function calculateMedian(values: number[]): number {
	if (values.length === 0) return 0;
	const sorted = [...values].sort((a, b) => a - b);
	const mid = Math.floor(sorted.length / 2);
	return sorted.length % 2 !== 0
		? sorted[mid]
		: (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Calculate standard deviation
 */
function calculateStdDev(values: number[], avg: number): number {
	if (values.length === 0) return 0;
	const squaredDiffs = values.map((v) => Math.pow(v - avg, 2));
	const avgSquaredDiff =
		squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
	return Math.sqrt(avgSquaredDiff);
}

/**
 * Generate cache key for trend data
 */
function getCacheKey(keyword: string, geo: string): string {
	return `trend:${keyword.toLowerCase().trim()}:${geo.toLowerCase()}`;
}

Deno.serve(async (req: Request) => {
	if (req.method === 'OPTIONS') {
		return new Response('ok', { headers: corsHeaders });
	}

	try {
		const serpApiKey = Deno.env.get('SERP_API_KEY');
		const supabaseUrl = Deno.env.get('SUPABASE_URL');
		const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

		if (!serpApiKey) {
			return new Response(
				JSON.stringify({ error: 'SERP_API_KEY not configured' }),
				{
					status: 500,
					headers: { ...corsHeaders, 'Content-Type': 'application/json' },
				},
			);
		}

		const { keyword, geo = 'US', skipCache = false } = (await req.json()) as RequestBody;

		if (!keyword) {
			return new Response(
				JSON.stringify({ error: 'keyword is required' }),
				{
					status: 400,
					headers: { ...corsHeaders, 'Content-Type': 'application/json' },
				},
			);
		}

		// Check cache first
		if (!skipCache && supabaseUrl && supabaseKey) {
			const supabase = createClient(supabaseUrl, supabaseKey);
			const cacheKey = getCacheKey(keyword, geo);

			const { data: cached } = await supabase
				.from('trend_cache')
				.select('*')
				.eq('cache_key', cacheKey)
				.single();

			if (cached) {
				// Check if cache is still valid (30 days)
				const cachedAt = new Date(cached.created_at);
				const now = new Date();
				const daysDiff = (now.getTime() - cachedAt.getTime()) / (1000 * 60 * 60 * 24);

				if (daysDiff < 30) {
					console.log(`Cache hit for trend: ${keyword} (${geo})`);
					return new Response(
						JSON.stringify({ ...cached.data, fromCache: true }),
						{
							status: 200,
							headers: { ...corsHeaders, 'Content-Type': 'application/json' },
						},
					);
				}
			}
		}

		// Call SerpAPI Google Trends endpoint
		// date: 'today 12-m' = last 12 months (returns weekly data points, ~52 weeks)
		const params = new URLSearchParams({
			api_key: serpApiKey,
			engine: 'google_trends',
			q: keyword,
			geo: geo,
			data_type: 'TIMESERIES',
			date: 'today 12-m',
		});

		console.log(`[Trend Validator] Fetching: keyword="${keyword}", geo="${geo}", date="today 12-m"`);

		const response = await fetch(
			`https://serpapi.com/search.json?${params.toString()}`,
		);

		if (!response.ok) {
			throw new Error(`SerpAPI error: ${response.status}`);
		}

		const data = (await response.json()) as GoogleTrendsResponse;

		// Handle "no results" as a valid case (low/no search volume), not an error
		if (data.error) {
			const noResultsPatterns = [
				'hasn\'t returned any results',
				'no results',
				'not enough search volume',
			];
			const isNoResults = noResultsPatterns.some((pattern) =>
				data.error?.toLowerCase().includes(pattern.toLowerCase())
			);

			if (isNoResults) {
				console.log(`No Google Trends data for: ${keyword} (${geo}) - treating as low interest`);
				const emptyResult: TrendValidationResponse = {
					isStable: false,
					spikeDetected: false,
					spikeRatio: 0,
					averageInterest: 0,
					maxInterest: 0,
					minInterest: 0,
					medianInterest: 0,
					trendDirection: 'flat',
					confidenceScore: 0,
					flags: ['NO_TREND_DATA: Google Trends has no data for this keyword - likely very low search volume'],
					monthlyData: [],
					fromCache: false,
				};

				return new Response(JSON.stringify(emptyResult), {
					status: 200,
					headers: { ...corsHeaders, 'Content-Type': 'application/json' },
				});
			}

			throw new Error(`SerpAPI error: ${data.error}`);
		}

		// Extract interest over time data
		// With 'today 12-m', we expect ~52 weekly data points
		const timelineData = data.interest_over_time?.timeline_data || [];
		const values = timelineData.map(
			(d) => d.values[0]?.extracted_value || 0,
		);

		console.log(`[Trend Validator] Received ${values.length} data points for "${keyword}" (${geo})`);

		// Handle case with no data
		if (values.length === 0) {
			console.log(`[Trend Validator] No timeline data returned for "${keyword}" (${geo})`);
			const emptyResult: TrendValidationResponse = {
				isStable: false,
				spikeDetected: false,
				spikeRatio: 0,
				averageInterest: 0,
				maxInterest: 0,
				minInterest: 0,
				medianInterest: 0,
				trendDirection: 'flat',
				confidenceScore: 0,
				flags: ['NO_TREND_DATA: Google Trends returned no data points'],
				monthlyData: [],
				fromCache: false,
			};

			return new Response(JSON.stringify(emptyResult), {
				status: 200,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			});
		}

		// Check for sparse data (less than 26 weeks = ~6 months of data)
		if (values.length < 26) {
			console.log(`[Trend Validator] Sparse data: only ${values.length} data points (expected ~52 for 12 months)`);
		}

		// Calculate stability metrics
		const avg = values.reduce((a, b) => a + b, 0) / values.length;
		const max = Math.max(...values);
		const min = Math.min(...values);
		const median = calculateMedian(values);
		const stdDev = calculateStdDev(values, avg);

		// Detect spikes: max value > 3x median indicates anomaly
		const spikeRatio = median > 0 ? max / median : 0;
		const spikeDetected = spikeRatio > 3;

		// Calculate volatility (coefficient of variation)
		const volatility = avg > 0 ? stdDev / avg : 0;

		// Determine trend direction
		const firstHalf = values.slice(0, Math.floor(values.length / 2));
		const secondHalf = values.slice(Math.floor(values.length / 2));
		const firstAvg =
			firstHalf.length > 0
				? firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
				: 0;
		const secondAvg =
			secondHalf.length > 0
				? secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length
				: 0;
		const changeRatio = firstAvg > 0 ? (secondAvg - firstAvg) / firstAvg : 0;

		let trendDirection: 'growing' | 'declining' | 'flat' | 'volatile';
		if (volatility > 0.5) {
			trendDirection = 'volatile';
		} else if (changeRatio > 0.2) {
			trendDirection = 'growing';
		} else if (changeRatio < -0.2) {
			trendDirection = 'declining';
		} else {
			trendDirection = 'flat';
		}

		// Generate flags
		const flags: string[] = [];
		
		// Check data sufficiency first
		// With 12-month range, we expect ~52 weekly data points
		// Require at least 26 points (~6 months) for meaningful analysis
		const MIN_DATA_POINTS = 26;
		const nonZeroPoints = values.filter((v) => v > 0).length;
		
		if (values.every((v) => v === 0)) {
			flags.push('NO_SEARCH_INTEREST: Zero search interest indicates no market demand');
		} else if (nonZeroPoints < MIN_DATA_POINTS) {
			flags.push(`INSUFFICIENT_TREND_DATA: Only ${nonZeroPoints} weeks of meaningful data (expected 26+ for 6 months)`);
		}
		
		if (spikeDetected) {
			flags.push(`SPIKE_ANOMALY: Peak ${spikeRatio.toFixed(1)}x median - single event may be inflating averages`);
		}
		if (avg < 10) {
			flags.push('LOW_SEARCH_INTEREST: Average interest below 10/100');
		}
		if (trendDirection === 'declining') {
			flags.push(`DECLINING_TREND: ${Math.abs(changeRatio * 100).toFixed(0)}% decrease in recent months`);
		}
		if (trendDirection === 'volatile') {
			flags.push('HIGH_VOLATILITY: Inconsistent search patterns');
		}

		// Calculate confidence score
		let confidenceScore = 100;
		// Penalize insufficient data
		if (values.every((v) => v === 0)) {
			confidenceScore = 0; // No confidence when zero interest
		} else if (nonZeroPoints < MIN_DATA_POINTS) {
			confidenceScore -= 30; // Significant penalty for sparse data
		}
		if (spikeDetected) confidenceScore -= 40;
		if (avg < 20) confidenceScore -= 20;
		if (volatility > 0.3) confidenceScore -= 20;
		if (trendDirection === 'declining') confidenceScore -= 10;
		confidenceScore = Math.max(0, confidenceScore);

		const isStable = !spikeDetected && volatility < 0.3;

		const result: TrendValidationResponse = {
			isStable,
			spikeDetected,
			spikeRatio: Math.round(spikeRatio * 10) / 10,
			averageInterest: Math.round(avg * 10) / 10,
			maxInterest: max,
			minInterest: min,
			medianInterest: median,
			trendDirection,
			confidenceScore,
			flags,
			monthlyData: timelineData.map((d) => ({
				date: d.date,
				value: d.values[0]?.extracted_value || 0,
			})),
			fromCache: false,
		};

		// Cache the result
		if (supabaseUrl && supabaseKey) {
			try {
				const supabase = createClient(supabaseUrl, supabaseKey);
				const cacheKey = getCacheKey(keyword, geo);

				await supabase
					.from('trend_cache')
					.upsert(
						{
							cache_key: cacheKey,
							keyword,
							geo,
							data: result,
							created_at: new Date().toISOString(),
						},
						{ onConflict: 'cache_key' },
					);

				console.log(`Cached trend data for: ${keyword} (${geo})`);
			} catch (cacheError) {
				console.error('Failed to cache trend data:', cacheError);
				// Don't fail the request if caching fails
			}
		}

		return new Response(JSON.stringify(result), {
			status: 200,
			headers: { ...corsHeaders, 'Content-Type': 'application/json' },
		});
	} catch (error) {
		console.error('Trend validator error:', error);
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
