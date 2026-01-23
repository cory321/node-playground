import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// CORS headers for browser requests
const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers":
		"authorization, x-client-info, apikey, content-type",
	"Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Cache TTL: 30 days in seconds
const CACHE_TTL_SECONDS = 30 * 24 * 60 * 60;

interface RequestBody {
	city: string;
	county?: string;
	state: string;
	category: string;
	bypassCache?: boolean;
}

interface LocalKnowledgeOutput {
	contentHooks: {
		localPhrases: string[];
		neighborhoodNames: string[];
		climateContext: string[];
		categorySpecificIssues: string[];
	};
	marketContext: {
		pricePosition: string;
		competitionLevel: string;
		seasonalPatterns: string[];
	};
	regionalIdentity: {
		region: string;
		characterization: string;
		nearbyReference: string;
	};
	meta: {
		city: string;
		state: string;
		category: string;
		confidence: number;
		generatedAt: string;
		cached: boolean;
	};
}

interface ClaudeContentBlock {
	type: string;
	text?: string;
}

interface ClaudeResponse {
	content?: ClaudeContentBlock[];
	error?: { message: string };
}

/**
 * Create a cache key from city, state, and category
 */
function createCacheKey(city: string, state: string, category: string): string {
	return `${city}-${state}-${category}`
		.toLowerCase()
		.replace(/\s+/g, "-")
		.replace(/[^a-z0-9-]/g, "");
}

/**
 * Build the prompt for local knowledge generation
 */
function buildPrompt(city: string, county: string | undefined, state: string, category: string): string {
	const countyContext = county ? ` (${county} County)` : "";
	
	return `You are a local market researcher helping create authentic, locally-relevant content for a ${category} service website targeting ${city}${countyContext}, ${state}.

Your goal is to provide specific local details that would make content feel like it was written by someone who actually lives and works in this area - NOT generic content that could apply to any city.

Research and provide the following:

## 1. LOCAL PHRASES & TERMINOLOGY (5-10 items)
What terms, phrases, or references would a local use? Think about:
- Regional names (e.g., "Central Valley" not just "California")
- Local weather phenomena (e.g., "tule fog", "Santa Ana winds")
- Local landmarks or reference points
- How locals describe their area

## 2. NEIGHBORHOOD & AREA NAMES (5-10 items)
List specific neighborhoods, subdivisions, or areas within or near ${city} that:
- A local ${category} company would service
- Could be referenced in content ("serving homes in [neighborhood]")
- Include a mix of established and newer areas

## 3. CLIMATE IMPACT ON ${category.toUpperCase()} (3-5 items)
How does the local climate specifically affect ${category} services? Consider:
- Temperature extremes and their effects
- Humidity, rain, or drought impacts
- Seasonal patterns
- Weather-related wear and tear

## 4. COMMON LOCAL ISSUES (3-5 items)
What ${category} problems are particularly common in ${city} or this region? Think about:
- Age/style of local housing stock
- Local environmental factors (dust, salt air, etc.)
- Regional building practices
- Common complaints locals would have

## 5. MARKET CONTEXT
Briefly describe:
- How prices compare to nearby cities
- Competition level (many local providers? mostly regional companies?)
- Seasonal busy/slow periods

## 6. REGIONAL IDENTITY
- What larger region is ${city} part of?
- How would you characterize this community in one phrase?
- What major city is it near and how far?

IMPORTANT: Respond ONLY with a valid JSON object matching this exact structure (no markdown, no explanation, just JSON):
{
  "contentHooks": {
    "localPhrases": ["phrase1", "phrase2", ...],
    "neighborhoodNames": ["name1", "name2", ...],
    "climateContext": ["impact1", "impact2", ...],
    "categorySpecificIssues": ["issue1", "issue2", ...]
  },
  "marketContext": {
    "pricePosition": "description",
    "competitionLevel": "description",
    "seasonalPatterns": ["pattern1", "pattern2"]
  },
  "regionalIdentity": {
    "region": "region name",
    "characterization": "one phrase description",
    "nearbyReference": "X miles from [major city]"
  }
}

Be specific and authentic. Generic responses that could apply to any city are not useful.`;
}

/**
 * Calculate confidence score based on completeness of the response
 */
function calculateConfidence(data: Partial<LocalKnowledgeOutput>): number {
	let score = 0;

	// Content hooks (60% of score)
	const hooks = data.contentHooks;
	if (hooks) {
		if (hooks.localPhrases && hooks.localPhrases.length >= 5) score += 15;
		else if (hooks.localPhrases && hooks.localPhrases.length >= 3) score += 10;
		else if (hooks.localPhrases && hooks.localPhrases.length >= 1) score += 5;

		if (hooks.neighborhoodNames && hooks.neighborhoodNames.length >= 5) score += 15;
		else if (hooks.neighborhoodNames && hooks.neighborhoodNames.length >= 3) score += 10;
		else if (hooks.neighborhoodNames && hooks.neighborhoodNames.length >= 1) score += 5;

		if (hooks.climateContext && hooks.climateContext.length >= 3) score += 15;
		else if (hooks.climateContext && hooks.climateContext.length >= 2) score += 10;
		else if (hooks.climateContext && hooks.climateContext.length >= 1) score += 5;

		if (hooks.categorySpecificIssues && hooks.categorySpecificIssues.length >= 3) score += 15;
		else if (hooks.categorySpecificIssues && hooks.categorySpecificIssues.length >= 2) score += 10;
		else if (hooks.categorySpecificIssues && hooks.categorySpecificIssues.length >= 1) score += 5;
	}

	// Market context (20% of score)
	const market = data.marketContext;
	if (market) {
		if (market.pricePosition && market.pricePosition.length > 10) score += 7;
		if (market.competitionLevel && market.competitionLevel.length > 10) score += 7;
		if (market.seasonalPatterns && market.seasonalPatterns.length >= 1) score += 6;
	}

	// Regional identity (20% of score)
	const regional = data.regionalIdentity;
	if (regional) {
		if (regional.region && regional.region.length > 2) score += 7;
		if (regional.characterization && regional.characterization.length > 5) score += 7;
		if (regional.nearbyReference && regional.nearbyReference.length > 5) score += 6;
	}

	return Math.min(100, score);
}

/**
 * Parse Claude response and extract JSON
 */
function parseClaudeResponse(response: ClaudeResponse): Partial<LocalKnowledgeOutput> | null {
	// Find text content block
	const textBlock = response.content?.find((block) => block.type === "text");
	if (!textBlock?.text) {
		console.error("No text content in Claude response");
		return null;
	}

	const text = textBlock.text.trim();

	// Try to extract JSON from the response
	// First try to parse the whole response as JSON
	try {
		return JSON.parse(text);
	} catch {
		// Try to find JSON in the response (in case there's extra text)
		const jsonMatch = text.match(/\{[\s\S]*\}/);
		if (jsonMatch) {
			try {
				return JSON.parse(jsonMatch[0]);
			} catch (e) {
				console.error("Failed to parse extracted JSON:", e);
			}
		}
	}

	console.error("Could not parse JSON from Claude response");
	return null;
}

/**
 * Create empty output for error cases
 */
function createEmptyOutput(
	city: string,
	state: string,
	category: string
): LocalKnowledgeOutput {
	return {
		contentHooks: {
			localPhrases: [],
			neighborhoodNames: [],
			climateContext: [],
			categorySpecificIssues: [],
		},
		marketContext: {
			pricePosition: "",
			competitionLevel: "",
			seasonalPatterns: [],
		},
		regionalIdentity: {
			region: "",
			characterization: "",
			nearbyReference: "",
		},
		meta: {
			city,
			state,
			category,
			confidence: 0,
			generatedAt: new Date().toISOString(),
			cached: false,
		},
	};
}

Deno.serve(async (req: Request) => {
	// Handle CORS preflight
	if (req.method === "OPTIONS") {
		return new Response("ok", { headers: corsHeaders });
	}

	try {
		// Get environment variables
		const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");
		const supabaseUrl = Deno.env.get("SUPABASE_URL");
		const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

		if (!anthropicApiKey) {
			return new Response(
				JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }),
				{
					status: 500,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				}
			);
		}

		if (!supabaseUrl || !supabaseServiceKey) {
			return new Response(
				JSON.stringify({ error: "Supabase configuration missing" }),
				{
					status: 500,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				}
			);
		}

		// Parse request body
		const { city, county, state, category, bypassCache } =
			(await req.json()) as RequestBody;

		if (!city || !state || !category) {
			return new Response(
				JSON.stringify({
					error: "Missing required fields: city, state, and category are required",
				}),
				{
					status: 400,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				}
			);
		}

		console.log(`Generating local knowledge for: ${city}, ${state} - ${category}`);

		// Create Supabase client
		const supabase = createClient(supabaseUrl, supabaseServiceKey);

		// Generate cache key
		const cacheKey = createCacheKey(city, state, category);

		// Check cache first (unless bypassing)
		if (!bypassCache) {
			const { data: cached } = await supabase
				.from("local_knowledge_cache")
				.select("data, expires_at")
				.eq("cache_key", cacheKey)
				.single();

			if (cached && new Date(cached.expires_at) > new Date()) {
				console.log(`Cache hit for: ${cacheKey}`);
				const cachedData = cached.data as LocalKnowledgeOutput;
				return new Response(
					JSON.stringify({
						...cachedData,
						meta: {
							...cachedData.meta,
							cached: true,
						},
					}),
					{
						status: 200,
						headers: { ...corsHeaders, "Content-Type": "application/json" },
					}
				);
			}
		}

		// Build prompt
		const prompt = buildPrompt(city, county, state, category);

		// Call Claude API with web search enabled
		const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
			method: "POST",
			headers: {
				"x-api-key": anthropicApiKey,
				"anthropic-version": "2023-06-01",
				"content-type": "application/json",
			},
			body: JSON.stringify({
				model: "claude-sonnet-4-20250514",
				max_tokens: 2000,
				tools: [
					{
						type: "web_search_20250305",
						name: "web_search",
					},
				],
				messages: [
					{
						role: "user",
						content: prompt,
					},
				],
			}),
		});

		if (!claudeResponse.ok) {
			const errorText = await claudeResponse.text();
			console.error(`Claude API error: ${claudeResponse.status} - ${errorText}`);
			return new Response(
				JSON.stringify({
					error: `Claude API error: ${claudeResponse.status}`,
					data: createEmptyOutput(city, state, category),
				}),
				{
					status: 200, // Return 200 with empty data for graceful degradation
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				}
			);
		}

		const claudeData: ClaudeResponse = await claudeResponse.json();

		// Parse the response
		const parsedData = parseClaudeResponse(claudeData);

		if (!parsedData) {
			console.error("Failed to parse Claude response");
			return new Response(
				JSON.stringify({
					error: "Failed to parse AI response",
					data: createEmptyOutput(city, state, category),
				}),
				{
					status: 200,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				}
			);
		}

		// Calculate confidence
		const confidence = calculateConfidence(parsedData);

		// Build complete output
		const output: LocalKnowledgeOutput = {
			contentHooks: {
				localPhrases: parsedData.contentHooks?.localPhrases || [],
				neighborhoodNames: parsedData.contentHooks?.neighborhoodNames || [],
				climateContext: parsedData.contentHooks?.climateContext || [],
				categorySpecificIssues: parsedData.contentHooks?.categorySpecificIssues || [],
			},
			marketContext: {
				pricePosition: parsedData.marketContext?.pricePosition || "",
				competitionLevel: parsedData.marketContext?.competitionLevel || "",
				seasonalPatterns: parsedData.marketContext?.seasonalPatterns || [],
			},
			regionalIdentity: {
				region: parsedData.regionalIdentity?.region || "",
				characterization: parsedData.regionalIdentity?.characterization || "",
				nearbyReference: parsedData.regionalIdentity?.nearbyReference || "",
			},
			meta: {
				city,
				state,
				category,
				confidence,
				generatedAt: new Date().toISOString(),
				cached: false,
			},
		};

		// Cache the result
		const expiresAt = new Date(Date.now() + CACHE_TTL_SECONDS * 1000);
		await supabase
			.from("local_knowledge_cache")
			.upsert(
				{
					cache_key: cacheKey,
					data: output,
					expires_at: expiresAt.toISOString(),
				},
				{ onConflict: "cache_key" }
			);

		console.log(`Successfully generated local knowledge for ${city}, ${state} - confidence: ${confidence}%`);

		return new Response(JSON.stringify(output), {
			status: 200,
			headers: { ...corsHeaders, "Content-Type": "application/json" },
		});
	} catch (error) {
		console.error("Local knowledge generation error:", error);
		return new Response(
			JSON.stringify({
				error: error instanceof Error ? error.message : "Unknown error",
			}),
			{
				status: 500,
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			}
		);
	}
});
