import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

// CORS headers for browser requests
const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Headers':
		'authorization, x-client-info, apikey, content-type',
	'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface RequestBody {
	city: string;
	state: string;
	category: string;
	competition: 'low' | 'medium' | 'high';
	regionalCharacter?: string;
}

interface BrandIdentity {
	name: string;
	tagline: string;
	domain: string;
	voiceTone: {
		personality: string[];
		dos: string[];
		donts: string[];
	};
}

interface BrandGenerationResponse {
	brand: BrandIdentity;
	confidence: number;
	generatedAt: string;
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
 * Build the prompt for brand generation
 */
function buildPrompt(
	city: string,
	state: string,
	category: string,
	competition: 'low' | 'medium' | 'high',
	regionalCharacter?: string
): string {
	const competitionGuidance = {
		low: 'Simple, direct naming works well. Pattern: "[City] [Service]" or "[City] [Service] [Modifier]"',
		medium:
			'Add a trust modifier. Pattern: "[City] [Service] [Modifier]" where modifier = Pros, Co, Guide, Experts',
		high: 'Use a brandable approach. Pattern: "[Brandable Word] [Service] of [City]" or unique positioning',
	};

	const regionalContext = regionalCharacter
		? `\n\nRegional character: ${regionalCharacter}`
		: '';

	return `You are a brand naming expert creating a local service lead generation site brand.

## Context
- City: ${city}, ${state}
- Service Category: ${category}
- Competition Level: ${competition}${regionalContext}

## Naming Strategy
${competitionGuidance[competition]}

## CRITICAL: Names to NEVER Generate
- "Best [City] [Service]" - sounds spammy
- "#1 [Service] in [City]" - unverifiable claim
- "Cheap [Service] [City]" - low quality signal
- "Get 3 Free Quotes" - aggregator language
- "[Service] Near Me" - lazy SEO
- Names with 4+ terms (keyword stuffing)

## Trust Modifiers (pick one if using)
- "Pros" - good for trade services (plumbing, HVAC)
- "Co" - any service, sounds business-like
- "Guide" - directory-style sites
- "Experts" - technical services
- "Solutions" - restoration, complex services

## Your Task
Create a brand identity that:
1. Feels natural and local (not keyword-stuffed)
2. Builds trust immediately
3. Is memorable and professional
4. Works as a domain name

IMPORTANT: Respond ONLY with a valid JSON object (no markdown, no explanation):
{
  "name": "Business Name Here",
  "tagline": "Short value proposition (5-8 words)",
  "domain": "businessname.com",
  "voiceTone": {
    "personality": ["helpful", "local", "straightforward"],
    "dos": ["Use neighborhood names", "Be specific about services", "Mention local landmarks"],
    "donts": ["No hype language", "No fake urgency", "No 'best in city' claims"]
  }
}

Make the personality, dos, and donts specific to ${city} and ${category}.`;
}

/**
 * Parse Claude response and extract JSON
 */
function parseClaudeResponse(
	response: ClaudeResponse
): Partial<BrandIdentity> | null {
	// Find text content block
	const textBlock = response.content?.find((block) => block.type === 'text');
	if (!textBlock?.text) {
		console.error('No text content in Claude response');
		return null;
	}

	const text = textBlock.text.trim();

	// Try to extract JSON from the response
	try {
		return JSON.parse(text);
	} catch {
		// Try to find JSON in the response
		const jsonMatch = text.match(/\{[\s\S]*\}/);
		if (jsonMatch) {
			try {
				return JSON.parse(jsonMatch[0]);
			} catch (e) {
				console.error('Failed to parse extracted JSON:', e);
			}
		}
	}

	console.error('Could not parse JSON from Claude response');
	return null;
}

/**
 * Calculate confidence based on response completeness
 */
function calculateConfidence(data: Partial<BrandIdentity>): number {
	let score = 0;

	// Name (30%)
	if (data.name && data.name.length >= 3 && data.name.length <= 50) {
		score += 30;
	} else if (data.name && data.name.length > 0) {
		score += 15;
	}

	// Tagline (20%)
	if (data.tagline && data.tagline.length >= 10 && data.tagline.length <= 100) {
		score += 20;
	} else if (data.tagline && data.tagline.length > 0) {
		score += 10;
	}

	// Domain (20%)
	if (
		data.domain &&
		data.domain.includes('.') &&
		!data.domain.includes(' ')
	) {
		score += 20;
	} else if (data.domain && data.domain.length > 0) {
		score += 10;
	}

	// Voice/Tone (30%)
	const voice = data.voiceTone;
	if (voice) {
		if (voice.personality && voice.personality.length >= 2) score += 10;
		if (voice.dos && voice.dos.length >= 2) score += 10;
		if (voice.donts && voice.donts.length >= 2) score += 10;
	}

	return Math.min(100, score);
}

/**
 * Create fallback brand for error cases
 */
function createFallbackBrand(
	city: string,
	category: string
): BrandIdentity {
	const categorySlug = category
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
	const citySlug = city
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');

	return {
		name: `${city} ${category} Guide`,
		tagline: `Your trusted local resource for ${category.toLowerCase()}`,
		domain: `${citySlug}${categorySlug}guide.com`,
		voiceTone: {
			personality: ['helpful', 'local', 'straightforward'],
			dos: ['Use neighborhood names', 'Be specific about services'],
			donts: ['No hype language', 'No fake urgency'],
		},
	};
}

Deno.serve(async (req: Request) => {
	// Handle CORS preflight
	if (req.method === 'OPTIONS') {
		return new Response('ok', { headers: corsHeaders });
	}

	try {
		// Get environment variables
		const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');

		if (!anthropicApiKey) {
			return new Response(
				JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }),
				{
					status: 500,
					headers: { ...corsHeaders, 'Content-Type': 'application/json' },
				}
			);
		}

		// Parse request body
		const { city, state, category, competition, regionalCharacter } =
			(await req.json()) as RequestBody;

		if (!city || !state || !category || !competition) {
			return new Response(
				JSON.stringify({
					error:
						'Missing required fields: city, state, category, and competition are required',
				}),
				{
					status: 400,
					headers: { ...corsHeaders, 'Content-Type': 'application/json' },
				}
			);
		}

		console.log(
			`Generating brand for: ${city}, ${state} - ${category} (${competition} competition)`
		);

		// Build prompt
		const prompt = buildPrompt(
			city,
			state,
			category,
			competition,
			regionalCharacter
		);

		// Call Claude API
		const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
			method: 'POST',
			headers: {
				'x-api-key': anthropicApiKey,
				'anthropic-version': '2023-06-01',
				'content-type': 'application/json',
			},
			body: JSON.stringify({
				model: 'claude-sonnet-4-20250514',
				max_tokens: 1000,
				messages: [
					{
						role: 'user',
						content: prompt,
					},
				],
			}),
		});

		if (!claudeResponse.ok) {
			const errorText = await claudeResponse.text();
			console.error(`Claude API error: ${claudeResponse.status} - ${errorText}`);

			// Return fallback brand with low confidence
			const fallback = createFallbackBrand(city, category);
			const response: BrandGenerationResponse = {
				brand: fallback,
				confidence: 30,
				generatedAt: new Date().toISOString(),
			};

			return new Response(JSON.stringify(response), {
				status: 200,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			});
		}

		const claudeData: ClaudeResponse = await claudeResponse.json();

		// Parse the response
		const parsedData = parseClaudeResponse(claudeData);

		if (!parsedData) {
			console.error('Failed to parse Claude response');

			// Return fallback brand
			const fallback = createFallbackBrand(city, category);
			const response: BrandGenerationResponse = {
				brand: fallback,
				confidence: 30,
				generatedAt: new Date().toISOString(),
			};

			return new Response(JSON.stringify(response), {
				status: 200,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			});
		}

		// Calculate confidence
		const confidence = calculateConfidence(parsedData);

		// Build complete brand identity with fallbacks
		const fallback = createFallbackBrand(city, category);
		const brand: BrandIdentity = {
			name: parsedData.name || fallback.name,
			tagline: parsedData.tagline || fallback.tagline,
			domain: parsedData.domain || fallback.domain,
			voiceTone: {
				personality:
					parsedData.voiceTone?.personality || fallback.voiceTone.personality,
				dos: parsedData.voiceTone?.dos || fallback.voiceTone.dos,
				donts: parsedData.voiceTone?.donts || fallback.voiceTone.donts,
			},
		};

		const response: BrandGenerationResponse = {
			brand,
			confidence,
			generatedAt: new Date().toISOString(),
		};

		console.log(
			`Successfully generated brand: ${brand.name} (confidence: ${confidence}%)`
		);

		return new Response(JSON.stringify(response), {
			status: 200,
			headers: { ...corsHeaders, 'Content-Type': 'application/json' },
		});
	} catch (error) {
		console.error('Brand generation error:', error);
		return new Response(
			JSON.stringify({
				error: error instanceof Error ? error.message : 'Unknown error',
			}),
			{
				status: 500,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			}
		);
	}
});
