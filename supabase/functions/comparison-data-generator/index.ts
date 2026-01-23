import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

// CORS headers for browser requests
const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Headers':
		'authorization, x-client-info, apikey, content-type',
	'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Action types
type ActionType =
	| 'enhance-winners'
	| 'generate-analysis'
	| 'generate-methodology';

interface WinnerData {
	category: string;
	providerId: string;
	providerName: string;
	reason: string;
	badge: string;
}

interface ProviderSnapshot {
	id: string;
	name: string;
	rating: number | null;
	reviewCount: number | null;
	services: string[];
	yearEstablished: number | null;
	emergencyService: boolean;
}

interface EnhanceWinnersRequest {
	action: 'enhance-winners';
	winners: WinnerData[];
	providerData: ProviderSnapshot[];
	city: string;
	category: string;
}

interface GenerateAnalysisRequest {
	action: 'generate-analysis';
	aspect: string;
	providerCount: number;
	city: string;
	category: string;
	dataSnapshot: {
		avgRating: number;
		totalReviews: number;
		licensedCount: number;
		emergencyCount: number;
	};
}

interface GenerateMethodologyRequest {
	action: 'generate-methodology';
	providerCount: number;
	category: string;
	city: string;
}

type RequestBody =
	| EnhanceWinnersRequest
	| GenerateAnalysisRequest
	| GenerateMethodologyRequest;

interface ClaudeContentBlock {
	type: string;
	text?: string;
}

interface ClaudeResponse {
	content?: ClaudeContentBlock[];
	error?: { message: string };
}

/**
 * Build prompt for enhancing winner reasons
 */
function buildWinnerEnhancementPrompt(
	winners: WinnerData[],
	providerData: ProviderSnapshot[],
	city: string,
	category: string,
): string {
	const providerMap = new Map(providerData.map((p) => [p.id, p]));

	const winnerDetails = winners
		.map((w) => {
			const provider = providerMap.get(w.providerId);
			const yearsInBusiness = provider?.yearEstablished
				? new Date().getFullYear() - provider.yearEstablished
				: 0;

			return `
- **${w.category}**: ${w.providerName}
  - Rating: ${provider?.rating || 'N/A'}/5 (${provider?.reviewCount || 0} reviews)
  - Years in business: ${yearsInBusiness || 'Unknown'}
  - Services: ${provider?.services.slice(0, 3).join(', ') || 'Various'}
  - Emergency service: ${provider?.emergencyService ? 'Yes' : 'No'}`;
		})
		.join('\n');

	return `You are writing brief winner descriptions for a ${category} provider comparison page in ${city}.

## Winners to Describe
${winnerDetails}

## Guidelines
- Each reason should be 2-3 sentences (40-60 words)
- Be specific and factual - use the provided data
- Avoid superlatives and marketing language
- Explain WHY they earned the designation
- Don't make claims you can't verify

## Output Format
Respond ONLY with a valid JSON object:
{
  "winners": [
    {
      "category": "Best Overall",
      "providerId": "provider-id",
      "providerName": "Provider Name",
      "reason": "Detailed 2-3 sentence explanation...",
      "badge": "trophy"
    }
  ]
}

Return the same structure with enhanced reasons for each winner.`;
}

/**
 * Build prompt for generating analysis content
 */
function buildAnalysisPrompt(
	aspect: string,
	providerCount: number,
	city: string,
	category: string,
	dataSnapshot: GenerateAnalysisRequest['dataSnapshot'],
): string {
	return `Write a 150-200 word analysis comparing ${providerCount} ${category} providers in ${city} on the dimension of "${aspect}".

## Data Available
- Average rating: ${dataSnapshot.avgRating.toFixed(1)}/5
- Total reviews: ${dataSnapshot.totalReviews}
- Licensed providers: ${dataSnapshot.licensedCount}/${providerCount}
- Emergency service providers: ${dataSnapshot.emergencyCount}/${providerCount}

## Guidelines
- Be objective and data-driven
- State the range or spread where relevant
- Note any significant patterns or outliers
- Explain what this means for consumers
- Do NOT explicitly recommend one provider
- No marketing language or superlatives

## Output Format
Respond ONLY with a valid JSON object:
{
  "analysis": "Your 150-200 word analysis here..."
}`;
}

/**
 * Build prompt for generating methodology section
 */
function buildMethodologyPrompt(
	providerCount: number,
	category: string,
	city: string,
): string {
	return `Write a 200-300 word methodology section explaining how we evaluated ${providerCount} ${category} providers in ${city}.

## What to Include
1. What data we collect (licensing, insurance, reviews, digital presence)
2. How we calculate trust scores
3. How we determine rankings
4. What we don't consider (paid placements, etc.)
5. How often we update data
6. Disclaimer about getting multiple quotes

## Guidelines
- Be transparent and build trust
- Avoid technical jargon
- Be concise but thorough
- First person plural ("we")
- No marketing language

## Output Format
Respond ONLY with a valid JSON object:
{
  "methodology": "Your 200-300 word methodology here..."
}`;
}

/**
 * Extract text from Claude response
 */
function extractClaudeText(response: ClaudeResponse): string | null {
	const textBlock = response.content?.find((block) => block.type === 'text');
	return textBlock?.text?.trim() || null;
}

/**
 * Parse JSON from text, handling markdown code blocks
 */
function parseJsonFromText(text: string): unknown | null {
	// Try direct parse first
	try {
		return JSON.parse(text);
	} catch {
		// Try to extract JSON from markdown code block or response
		const jsonMatch = text.match(/\{[\s\S]*\}/);
		if (jsonMatch) {
			try {
				return JSON.parse(jsonMatch[0]);
			} catch (e) {
				console.error('Failed to parse extracted JSON:', e);
			}
		}
	}
	return null;
}

/**
 * Call Claude API
 */
async function callClaude(
	prompt: string,
	apiKey: string,
): Promise<ClaudeResponse> {
	const response = await fetch('https://api.anthropic.com/v1/messages', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'x-api-key': apiKey,
			'anthropic-version': '2023-06-01',
		},
		body: JSON.stringify({
			model: 'claude-3-haiku-20240307',
			max_tokens: 1024,
			messages: [
				{
					role: 'user',
					content: prompt,
				},
			],
		}),
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Claude API error: ${response.status} - ${errorText}`);
	}

	return response.json();
}

/**
 * Handle enhance-winners action
 */
async function handleEnhanceWinners(
	request: EnhanceWinnersRequest,
	apiKey: string,
): Promise<Response> {
	const { winners, providerData, city, category } = request;

	const prompt = buildWinnerEnhancementPrompt(
		winners,
		providerData,
		city,
		category,
	);
	const claudeResponse = await callClaude(prompt, apiKey);
	const text = extractClaudeText(claudeResponse);

	if (!text) {
		return new Response(
			JSON.stringify({ winners, error: 'No response from Claude' }),
			{
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
				status: 200,
			},
		);
	}

	const parsed = parseJsonFromText(text) as { winners?: WinnerData[] } | null;

	if (parsed?.winners) {
		return new Response(JSON.stringify({ winners: parsed.winners }), {
			headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			status: 200,
		});
	}

	// Return original winners if parsing failed
	return new Response(JSON.stringify({ winners }), {
		headers: { ...corsHeaders, 'Content-Type': 'application/json' },
		status: 200,
	});
}

/**
 * Handle generate-analysis action
 */
async function handleGenerateAnalysis(
	request: GenerateAnalysisRequest,
	apiKey: string,
): Promise<Response> {
	const { aspect, providerCount, city, category, dataSnapshot } = request;

	const prompt = buildAnalysisPrompt(
		aspect,
		providerCount,
		city,
		category,
		dataSnapshot,
	);
	const claudeResponse = await callClaude(prompt, apiKey);
	const text = extractClaudeText(claudeResponse);

	if (!text) {
		return new Response(
			JSON.stringify({ analysis: null, error: 'No response from Claude' }),
			{
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
				status: 200,
			},
		);
	}

	const parsed = parseJsonFromText(text) as { analysis?: string } | null;

	return new Response(JSON.stringify({ analysis: parsed?.analysis || null }), {
		headers: { ...corsHeaders, 'Content-Type': 'application/json' },
		status: 200,
	});
}

/**
 * Handle generate-methodology action
 */
async function handleGenerateMethodology(
	request: GenerateMethodologyRequest,
	apiKey: string,
): Promise<Response> {
	const { providerCount, category, city } = request;

	const prompt = buildMethodologyPrompt(providerCount, category, city);
	const claudeResponse = await callClaude(prompt, apiKey);
	const text = extractClaudeText(claudeResponse);

	if (!text) {
		return new Response(
			JSON.stringify({ methodology: null, error: 'No response from Claude' }),
			{
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
				status: 200,
			},
		);
	}

	const parsed = parseJsonFromText(text) as { methodology?: string } | null;

	return new Response(
		JSON.stringify({ methodology: parsed?.methodology || null }),
		{
			headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			status: 200,
		},
	);
}

// Main handler
Deno.serve(async (req: Request) => {
	// Handle CORS preflight
	if (req.method === 'OPTIONS') {
		return new Response('ok', { headers: corsHeaders });
	}

	try {
		// Check for Anthropic API key
		const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
		if (!anthropicApiKey) {
			return new Response(
				JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }),
				{
					headers: { ...corsHeaders, 'Content-Type': 'application/json' },
					status: 500,
				},
			);
		}

		// Parse request body
		const body: RequestBody = await req.json();
		const { action } = body;

		// Route to appropriate handler
		switch (action) {
			case 'enhance-winners':
				return handleEnhanceWinners(
					body as EnhanceWinnersRequest,
					anthropicApiKey,
				);

			case 'generate-analysis':
				return handleGenerateAnalysis(
					body as GenerateAnalysisRequest,
					anthropicApiKey,
				);

			case 'generate-methodology':
				return handleGenerateMethodology(
					body as GenerateMethodologyRequest,
					anthropicApiKey,
				);

			default:
				return new Response(
					JSON.stringify({ error: `Unknown action: ${action}` }),
					{
						headers: { ...corsHeaders, 'Content-Type': 'application/json' },
						status: 400,
					},
				);
		}
	} catch (error) {
		console.error('Error in comparison-data-generator:', error);
		return new Response(
			JSON.stringify({
				error: error instanceof Error ? error.message : 'Unknown error',
			}),
			{
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
				status: 500,
			},
		);
	}
});
