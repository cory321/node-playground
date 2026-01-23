import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

// CORS headers for browser requests
const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Headers':
		'authorization, x-client-info, apikey, content-type',
	'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Request types
type EditorialDepth = 'brief' | 'standard' | 'detailed';
type GenerationType = 'our-take' | 'faq' | 'intro';

interface OurTakeRequest {
	providerName: string;
	category: string;
	city: string;
	state: string;
	trustScore: number;
	googleRating: number | null;
	reviewCount: number | null;
	yearsInBusiness: number | null;
	licenseStatus: string;
	specialties: string[];
	pricePosition: string;
	rank: number;
	totalProviders: number;
	avgRating: number;
	localKnowledgeHooks: string[];
	editorialDepth: EditorialDepth;
}

interface FAQRequest {
	providerName: string;
	category: string;
	city: string;
	state: string;
	services: string[];
	serviceArea: string[];
	credentials: {
		licenseNumbers: string[];
		certifications: string[];
		yearsInBusiness: number | null;
	};
	localKnowledgeHooks: string[];
}

interface IntroRequest {
	providerName: string;
	category: string;
	city: string;
	state: string;
	yearsInBusiness: number | null;
	specialties: string[];
	localKnowledgeHooks: string[];
	editorialDepth: EditorialDepth;
}

interface RequestBody {
	type: GenerationType;
	data: OurTakeRequest | FAQRequest | IntroRequest;
}

interface OurTakeResponse {
	assessment: string;
	strengths: string[];
	considerations: string[];
	bestFor: string;
	pricePosition: string;
}

interface FAQItem {
	question: string;
	answer: string;
}

interface FAQResponse {
	faqs: FAQItem[];
}

interface IntroResponse {
	introduction: string;
	localReferencesUsed: string[];
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
 * Get word count target based on editorial depth
 */
function getWordTarget(depth: EditorialDepth): { min: number; max: number } {
	switch (depth) {
		case 'brief':
			return { min: 100, max: 150 };
		case 'standard':
			return { min: 150, max: 200 };
		case 'detailed':
			return { min: 200, max: 300 };
	}
}

/**
 * Build the "Our Take" editorial prompt
 */
function buildOurTakePrompt(data: OurTakeRequest): string {
	const wordTarget = getWordTarget(data.editorialDepth);
	const comparisonToAvg =
		data.trustScore > 70 ? 'above' : data.trustScore > 50 ? 'near' : 'below';

	return `You are a trusted local service expert writing an editorial assessment for a provider directory.

Write a ${wordTarget.min}-${wordTarget.max} word editorial assessment of ${data.providerName}, 
a ${data.category} company in ${data.city}, ${data.state}.

## Data About This Provider
- Trust Score: ${data.trustScore}/100
- Google Rating: ${data.googleRating || 'Not available'} (${data.reviewCount || 0} reviews)
- Years in Business: ${data.yearsInBusiness || 'Unknown'}
- License Status: ${data.licenseStatus}
- Specialties: ${data.specialties.length > 0 ? data.specialties.join(', ') : 'General services'}
- Price Position: ${data.pricePosition}

## Comparison Context
- Ranks #${data.rank} of ${data.totalProviders} providers in ${data.city}
- Average provider rating in area: ${data.avgRating.toFixed(1)}
- This provider's Trust Score is ${comparisonToAvg} average

## Local Context (use at least one)
${data.localKnowledgeHooks.map((hook) => `- ${hook}`).join('\n')}

## Requirements
Write an honest, balanced assessment that:
1. Opens with an objective summary of the provider (who they are, what they do)
2. Highlights 2-3 genuine strengths based on the data
3. Notes 1-2 honest considerations (not dealbreakers, just things to know)
4. States what type of customer they're best suited for
5. Comments on their pricing relative to the market

## Tone
- Professional, helpful, honest
- NOT salesy or promotional
- Include at least one specific local reference
- Sound like a knowledgeable local, not AI

IMPORTANT: Respond ONLY with valid JSON (no markdown, no explanation):
{
  "assessment": "The full editorial text here...",
  "strengths": ["Strength 1", "Strength 2", "Strength 3"],
  "considerations": ["Consideration 1", "Consideration 2"],
  "bestFor": "Best for homeowners who...",
  "pricePosition": "Mid-range pricing for the area"
}`;
}

/**
 * Build the FAQ generation prompt
 */
function buildFAQPrompt(data: FAQRequest): string {
	return `You are a helpful local service expert creating FAQs for a provider profile page.

Generate 4 unique FAQs specific to ${data.providerName}, a ${data.category} company in ${data.city}, ${data.state}.

## Provider Information
- Services: ${data.services.join(', ') || 'General services'}
- Service Area: ${data.serviceArea.join(', ') || data.city}
- License Numbers: ${data.credentials.licenseNumbers.join(', ') || 'Not available'}
- Certifications: ${data.credentials.certifications.join(', ') || 'None listed'}
- Years in Business: ${data.credentials.yearsInBusiness || 'Unknown'}

## Local Context (incorporate where natural)
${data.localKnowledgeHooks.map((hook) => `- ${hook}`).join('\n')}

## FAQ Requirements
1. Question about their specific services/specialties
2. Question about their pricing or service area
3. Question about their credentials or experience
4. Question a local homeowner would ask (using local context)

## Rules
- Make questions sound natural, like a real customer would ask
- Answers should be 50-100 words each
- Be specific to this provider, not generic
- Include at least one local reference

IMPORTANT: Respond ONLY with valid JSON (no markdown):
{
  "faqs": [
    {"question": "Question 1?", "answer": "Answer 1..."},
    {"question": "Question 2?", "answer": "Answer 2..."},
    {"question": "Question 3?", "answer": "Answer 3..."},
    {"question": "Question 4?", "answer": "Answer 4..."}
  ]
}`;
}

/**
 * Build the introduction generation prompt
 */
function buildIntroPrompt(data: IntroRequest): string {
	const wordTarget = getWordTarget(data.editorialDepth);
	// Intro is roughly 2/3 of the assessment length
	const introWords = {
		min: Math.round(wordTarget.min * 0.67),
		max: Math.round(wordTarget.max * 0.67),
	};

	return `You are writing the introduction paragraph for a service provider profile page.

Write a ${introWords.min}-${introWords.max} word introduction for ${data.providerName}, 
a ${data.category} company serving ${data.city}, ${data.state}.

## Provider Information
- Years in Business: ${data.yearsInBusiness || 'Unknown'}
- Specialties: ${data.specialties.length > 0 ? data.specialties.join(', ') : 'General services'}

## Local Context (use at least one)
${data.localKnowledgeHooks.map((hook) => `- ${hook}`).join('\n')}

## Requirements
- Start with who they are and what they do
- Mention their experience or time in business if known
- Reference at least one local element
- Set up why a reader should keep reading
- Sound authoritative but friendly

## Tone
- Professional and informative
- Local and knowledgeable
- NOT salesy or promotional

IMPORTANT: Respond ONLY with valid JSON (no markdown):
{
  "introduction": "The introduction paragraph text...",
  "localReferencesUsed": ["reference 1", "reference 2"]
}`;
}

/**
 * Parse Claude response and extract JSON
 */
function parseClaudeResponse<T>(response: ClaudeResponse): T | null {
	const textBlock = response.content?.find((block) => block.type === 'text');
	if (!textBlock?.text) {
		console.error('No text content in Claude response');
		return null;
	}

	const text = textBlock.text.trim();

	try {
		return JSON.parse(text) as T;
	} catch {
		// Try to find JSON in the response
		const jsonMatch = text.match(/\{[\s\S]*\}/);
		if (jsonMatch) {
			try {
				return JSON.parse(jsonMatch[0]) as T;
			} catch (e) {
				console.error('Failed to parse extracted JSON:', e);
			}
		}
	}

	console.error('Could not parse JSON from Claude response');
	return null;
}

/**
 * Create fallback "Our Take" response
 */
function createFallbackOurTake(data: OurTakeRequest): OurTakeResponse {
	const rating = data.googleRating ? `${data.googleRating} star` : '';
	const reviews = data.reviewCount ? ` with ${data.reviewCount} reviews` : '';
	const years = data.yearsInBusiness
		? `With ${data.yearsInBusiness} years of experience, `
		: '';

	return {
		assessment: `${years}${data.providerName} is a ${data.category.toLowerCase()} company serving the ${data.city} area. ${rating ? `They maintain a ${rating} rating on Google${reviews}.` : ''} Based on our research, they appear to be a reliable option for local homeowners seeking ${data.category.toLowerCase()} services.`,
		strengths: [
			`Serves the ${data.city} area`,
			data.googleRating
				? `${data.googleRating} star Google rating`
				: 'Established local presence',
		],
		considerations: ['Contact them directly for specific pricing'],
		bestFor: `Homeowners in ${data.city} looking for ${data.category.toLowerCase()} services`,
		pricePosition: data.pricePosition || 'Contact for pricing',
	};
}

/**
 * Create fallback FAQ response
 */
function createFallbackFAQ(data: FAQRequest): FAQResponse {
	return {
		faqs: [
			{
				question: `What services does ${data.providerName} offer?`,
				answer: `${data.providerName} provides ${data.category.toLowerCase()} services to the ${data.city} area. ${data.services.length > 0 ? `Their services include ${data.services.slice(0, 3).join(', ')}.` : 'Contact them directly for a full list of services.'}`,
			},
			{
				question: `What areas does ${data.providerName} serve?`,
				answer: `${data.providerName} primarily serves ${data.city}, ${data.state}${data.serviceArea.length > 1 ? ` and surrounding areas including ${data.serviceArea.slice(0, 3).join(', ')}` : ''}.`,
			},
			{
				question: `Is ${data.providerName} licensed and insured?`,
				answer: `${data.credentials.licenseNumbers.length > 0 ? `Yes, ${data.providerName} is licensed (${data.credentials.licenseNumbers[0]}).` : `Contact ${data.providerName} directly to verify their licensing and insurance status.`}`,
			},
			{
				question: `How do I get a quote from ${data.providerName}?`,
				answer: `You can contact ${data.providerName} directly by phone to request a quote. They serve the ${data.city} area and can typically provide estimates for ${data.category.toLowerCase()} work.`,
			},
		],
	};
}

/**
 * Create fallback intro response
 */
function createFallbackIntro(data: IntroRequest): IntroResponse {
	const years = data.yearsInBusiness
		? `With ${data.yearsInBusiness} years of experience, `
		: '';

	return {
		introduction: `${years}${data.providerName} is a trusted ${data.category.toLowerCase()} company serving homeowners and businesses throughout ${data.city}, ${data.state}. They specialize in ${data.specialties.length > 0 ? data.specialties.slice(0, 2).join(' and ') : `quality ${data.category.toLowerCase()} services`}.`,
		localReferencesUsed: [data.city],
	};
}

/**
 * Call Claude API
 */
async function callClaude(
	prompt: string,
	apiKey: string
): Promise<ClaudeResponse | null> {
	const response = await fetch('https://api.anthropic.com/v1/messages', {
		method: 'POST',
		headers: {
			'x-api-key': apiKey,
			'anthropic-version': '2023-06-01',
			'content-type': 'application/json',
		},
		body: JSON.stringify({
			model: 'claude-sonnet-4-20250514',
			max_tokens: 1500,
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
		console.error(`Claude API error: ${response.status} - ${errorText}`);
		return null;
	}

	return await response.json();
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
		const { type, data } = (await req.json()) as RequestBody;

		if (!type || !data) {
			return new Response(
				JSON.stringify({
					error: 'Missing required fields: type and data are required',
				}),
				{
					status: 400,
					headers: { ...corsHeaders, 'Content-Type': 'application/json' },
				}
			);
		}

		console.log(`Processing ${type} generation request`);

		let prompt: string;
		let result: OurTakeResponse | FAQResponse | IntroResponse;

		switch (type) {
			case 'our-take': {
				const ourTakeData = data as OurTakeRequest;
				prompt = buildOurTakePrompt(ourTakeData);

				const claudeResponse = await callClaude(prompt, anthropicApiKey);
				if (!claudeResponse) {
					result = createFallbackOurTake(ourTakeData);
				} else {
					const parsed = parseClaudeResponse<OurTakeResponse>(claudeResponse);
					result = parsed || createFallbackOurTake(ourTakeData);
				}
				break;
			}

			case 'faq': {
				const faqData = data as FAQRequest;
				prompt = buildFAQPrompt(faqData);

				const claudeResponse = await callClaude(prompt, anthropicApiKey);
				if (!claudeResponse) {
					result = createFallbackFAQ(faqData);
				} else {
					const parsed = parseClaudeResponse<FAQResponse>(claudeResponse);
					result = parsed || createFallbackFAQ(faqData);
				}
				break;
			}

			case 'intro': {
				const introData = data as IntroRequest;
				prompt = buildIntroPrompt(introData);

				const claudeResponse = await callClaude(prompt, anthropicApiKey);
				if (!claudeResponse) {
					result = createFallbackIntro(introData);
				} else {
					const parsed = parseClaudeResponse<IntroResponse>(claudeResponse);
					result = parsed || createFallbackIntro(introData);
				}
				break;
			}

			default:
				return new Response(
					JSON.stringify({
						error: `Unknown generation type: ${type}`,
					}),
					{
						status: 400,
						headers: { ...corsHeaders, 'Content-Type': 'application/json' },
					}
				);
		}

		console.log(`Successfully generated ${type} content`);

		return new Response(
			JSON.stringify({
				type,
				result,
				generatedAt: new Date().toISOString(),
			}),
			{
				status: 200,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			}
		);
	} catch (error) {
		console.error('Profile content generation error:', error);
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
