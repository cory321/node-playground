import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// CORS headers for browser requests
const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers":
		"authorization, x-client-info, apikey, content-type",
	"Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Firecrawl extraction schema for provider websites
const EXTRACTION_SCHEMA = {
	type: "object",
	properties: {
		services: {
			type: "array",
			items: { type: "string" },
			description: "List of services offered by the company",
		},
		serviceDescriptions: {
			type: "object",
			additionalProperties: { type: "string" },
			description: "Map of service name to detailed description",
		},
		pricing: {
			type: "object",
			properties: {
				listed: {
					type: "array",
					items: {
						type: "object",
						properties: {
							service: { type: "string" },
							price: { type: "string" },
						},
					},
				},
				freeEstimates: { type: "boolean" },
				financing: { type: "boolean" },
			},
		},
		about: {
			type: "object",
			properties: {
				companyStory: { type: "string", nullable: true },
				yearEstablished: { type: "number", nullable: true },
				ownerName: { type: "string", nullable: true },
				teamSize: { type: "string", nullable: true },
			},
		},
		credentials: {
			type: "object",
			properties: {
				licenseNumbers: { type: "array", items: { type: "string" } },
				certifications: { type: "array", items: { type: "string" } },
				insuranceMentioned: { type: "boolean" },
				associations: { type: "array", items: { type: "string" } },
			},
		},
		serviceArea: {
			type: "array",
			items: { type: "string" },
			description: "Cities, counties, or areas served",
		},
		hours: {
			type: "object",
			additionalProperties: { type: "string" },
			nullable: true,
			description: "Business hours by day of week",
		},
		emergencyService: {
			type: "boolean",
			description: "Whether 24/7 or emergency service is offered",
		},
		brands: {
			type: "array",
			items: { type: "string" },
			description: "Brand names mentioned (manufacturers, products)",
		},
		testimonials: {
			type: "array",
			items: {
				type: "object",
				properties: {
					text: { type: "string" },
					author: { type: "string" },
				},
			},
		},
		images: {
			type: "object",
			properties: {
				logo: { type: "string", nullable: true },
				teamPhotos: { type: "array", items: { type: "string" } },
				workPhotos: { type: "array", items: { type: "string" } },
			},
		},
		socialLinks: {
			type: "object",
			additionalProperties: { type: "string" },
			description: "Social media links (facebook, instagram, etc.)",
		},
	},
	required: ["services", "pricing", "about", "credentials"],
};

// Extraction prompt to guide Firecrawl's LLM
const EXTRACTION_PROMPT = `Extract detailed business information from this local service provider website.
Focus on:
- All services they offer with descriptions
- Any pricing information visible
- Company history, establishment year, owner info
- License numbers, certifications, insurance mentions
- Service area (cities/counties served)
- Business hours
- Whether they offer emergency/24-7 service
- Brand names they work with or sell
- Customer testimonials/reviews on the site
- Logo and team/work photos URLs
- Social media links

Be thorough but only include information actually present on the website.`;

interface RequestBody {
	url: string;
	providerName?: string;
}

interface FirecrawlResponse {
	success: boolean;
	data?: {
		extract?: Record<string, unknown>;
		markdown?: string;
	};
	error?: string;
}

Deno.serve(async (req: Request) => {
	// Handle CORS preflight
	if (req.method === "OPTIONS") {
		return new Response("ok", { headers: corsHeaders });
	}

	try {
		const firecrawlApiKey = Deno.env.get("FIRECRAWL_API_KEY");
		if (!firecrawlApiKey) {
			return new Response(
				JSON.stringify({ error: "FIRECRAWL_API_KEY not configured" }),
				{
					status: 500,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				}
			);
		}

		const { url, providerName } = (await req.json()) as RequestBody;

		if (!url) {
			return new Response(JSON.stringify({ error: "URL is required" }), {
				status: 400,
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			});
		}

		// Validate URL format
		try {
			new URL(url);
		} catch {
			return new Response(JSON.stringify({ error: "Invalid URL format" }), {
				status: 400,
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			});
		}

		console.log(`Scraping provider website: ${url} (${providerName || "unknown"})`);

		// Call Firecrawl scrape endpoint with extract format
		const firecrawlResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${firecrawlApiKey}`,
			},
			body: JSON.stringify({
				url,
				formats: ["extract"],
				extract: {
					schema: EXTRACTION_SCHEMA,
					prompt: EXTRACTION_PROMPT,
				},
				timeout: 30000, // 30 second timeout
			}),
		});

		if (!firecrawlResponse.ok) {
			const errorText = await firecrawlResponse.text();
			console.error(`Firecrawl API error: ${firecrawlResponse.status} - ${errorText}`);
			
			// Handle specific error cases
			if (firecrawlResponse.status === 429) {
				return new Response(
					JSON.stringify({ error: "Rate limit exceeded. Please wait and try again." }),
					{
						status: 429,
						headers: { ...corsHeaders, "Content-Type": "application/json" },
					}
				);
			}

			return new Response(
				JSON.stringify({ 
					error: `Firecrawl API error: ${firecrawlResponse.status}`,
					details: errorText 
				}),
				{
					status: firecrawlResponse.status,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				}
			);
		}

		const result = (await firecrawlResponse.json()) as FirecrawlResponse;

		if (!result.success) {
			console.error(`Firecrawl extraction failed: ${result.error}`);
			return new Response(
				JSON.stringify({ 
					error: result.error || "Extraction failed",
					data: createEmptyEnrichment(result.error)
				}),
				{
					status: 200, // Return 200 with empty data to allow partial results
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				}
			);
		}

		const extractedData = result.data?.extract || {};

		// Calculate confidence score based on how many fields were extracted
		const confidence = calculateConfidence(extractedData);

		// Normalize and validate the extracted data
		const enrichment = normalizeEnrichment(extractedData, confidence);

		console.log(`Successfully scraped ${url} - confidence: ${confidence}%`);

		return new Response(
			JSON.stringify({
				success: true,
				data: enrichment,
			}),
			{
				status: 200,
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			}
		);
	} catch (error) {
		console.error("Scraping error:", error);
		return new Response(
			JSON.stringify({
				error: error instanceof Error ? error.message : "Unknown error",
				data: createEmptyEnrichment(error instanceof Error ? error.message : "Unknown error"),
			}),
			{
				status: 200, // Return 200 with empty data
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			}
		);
	}
});

/**
 * Calculate confidence score based on extracted fields
 */
function calculateConfidence(data: Record<string, unknown>): number {
	let score = 0;
	const weights: Record<string, number> = {
		services: 20,
		serviceDescriptions: 10,
		pricing: 15,
		about: 15,
		credentials: 10,
		serviceArea: 5,
		hours: 5,
		emergencyService: 5,
		brands: 5,
		testimonials: 5,
		images: 3,
		socialLinks: 2,
	};

	for (const [field, weight] of Object.entries(weights)) {
		const value = data[field];
		if (value !== null && value !== undefined) {
			if (Array.isArray(value) && value.length > 0) {
				score += weight;
			} else if (typeof value === "object" && Object.keys(value as object).length > 0) {
				score += weight;
			} else if (typeof value === "boolean") {
				score += weight; // Boolean fields count even if false
			} else if (value) {
				score += weight;
			}
		}
	}

	return Math.min(100, score);
}

/**
 * Normalize extracted data to match our interface
 */
function normalizeEnrichment(
	data: Record<string, unknown>,
	confidence: number
): Record<string, unknown> {
	return {
		services: ensureArray(data.services),
		serviceDescriptions: ensureObject(data.serviceDescriptions),
		pricing: {
			listed: ensureArray((data.pricing as Record<string, unknown>)?.listed),
			freeEstimates: Boolean((data.pricing as Record<string, unknown>)?.freeEstimates),
			financing: Boolean((data.pricing as Record<string, unknown>)?.financing),
		},
		about: {
			companyStory: (data.about as Record<string, unknown>)?.companyStory ?? null,
			yearEstablished: (data.about as Record<string, unknown>)?.yearEstablished ?? null,
			ownerName: (data.about as Record<string, unknown>)?.ownerName ?? null,
			teamSize: (data.about as Record<string, unknown>)?.teamSize ?? null,
		},
		credentials: {
			licenseNumbers: ensureArray((data.credentials as Record<string, unknown>)?.licenseNumbers),
			certifications: ensureArray((data.credentials as Record<string, unknown>)?.certifications),
			insuranceMentioned: Boolean((data.credentials as Record<string, unknown>)?.insuranceMentioned),
			associations: ensureArray((data.credentials as Record<string, unknown>)?.associations),
		},
		serviceArea: ensureArray(data.serviceArea),
		hours: data.hours ?? null,
		emergencyService: Boolean(data.emergencyService),
		brands: ensureArray(data.brands),
		testimonials: ensureArray(data.testimonials),
		images: {
			logo: (data.images as Record<string, unknown>)?.logo ?? null,
			teamPhotos: ensureArray((data.images as Record<string, unknown>)?.teamPhotos),
			workPhotos: ensureArray((data.images as Record<string, unknown>)?.workPhotos),
		},
		socialLinks: ensureObject(data.socialLinks),
		lastScraped: new Date().toISOString(),
		scrapingConfidence: confidence,
		scrapingError: null,
	};
}

/**
 * Create empty enrichment for failed scrapes
 */
function createEmptyEnrichment(error?: string): Record<string, unknown> {
	return {
		services: [],
		serviceDescriptions: {},
		pricing: { listed: [], freeEstimates: false, financing: false },
		about: { companyStory: null, yearEstablished: null, ownerName: null, teamSize: null },
		credentials: { licenseNumbers: [], certifications: [], insuranceMentioned: false, associations: [] },
		serviceArea: [],
		hours: null,
		emergencyService: false,
		brands: [],
		testimonials: [],
		images: { logo: null, teamPhotos: [], workPhotos: [] },
		socialLinks: {},
		lastScraped: new Date().toISOString(),
		scrapingConfidence: 0,
		scrapingError: error || null,
	};
}

function ensureArray(value: unknown): unknown[] {
	if (Array.isArray(value)) return value;
	return [];
}

function ensureObject(value: unknown): Record<string, unknown> {
	if (value && typeof value === "object" && !Array.isArray(value)) {
		return value as Record<string, unknown>;
	}
	return {};
}
