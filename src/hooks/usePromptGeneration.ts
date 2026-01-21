import { useCallback, useState } from 'react';
import { callLLM } from '@/api/llm';
import {
	FOUNDATION_GOLDEN_PROMPT,
	CATEGORY_MODIFIER_PROMPT,
} from '@/api/prompts';
import {
	getLeadEconomics,
	getCategoryTier,
	detectCityProfile,
} from '@/api/serp/tiers';
import type { DemographicsData } from '@/types/nodes';

/**
 * Input data for prompt generation
 */
export interface PromptGenerationInput {
	city: string;
	state: string | null;
	category: string;
	serpScore?: number;
	serpQuality?: 'Weak' | 'Medium' | 'Strong';
	// Optional demographics for city profile detection
	demographics?: DemographicsData;
	lat?: number;
	lng?: number;
}

/**
 * Result from prompt generation
 */
export interface PromptGenerationResult {
	prompt: string;
	businessName: string | null;
}

/**
 * Hook for generating specialized landing page prompts using LLM
 */
export function usePromptGeneration() {
	const [isGenerating, setIsGenerating] = useState(false);
	const [error, setError] = useState<string | null>(null);

	/**
	 * Build the category modifier input with all context variables
	 */
	const buildCategoryModifierInput = useCallback(
		(input: PromptGenerationInput): string => {
			const {
				city,
				state,
				category,
				serpScore,
				serpQuality,
				demographics,
				lat,
				lng,
			} = input;

			// Get lead economics for the category
			const economics = getLeadEconomics(category);

			// Detect city profile for tier2 categories
			const cityProfile = detectCityProfile(demographics, lat, lng);

			// Get category tier
			const tier = getCategoryTier(category, cityProfile);

			// Format state abbreviation
			const stateAbbrev = state ? getStateAbbreviation(state) : '';

			// Build service area (just the city for now, could be expanded)
			const serviceArea = city;

			// Build the input context
			let context = `### Location

LOCATION_NAME: ${city}
LOCATION_TYPE: city
STATE: ${state || 'Unknown'}
STATE_ABBREV: ${stateAbbrev}
SERVICE_AREA: ${serviceArea}
COORDINATES: ${lat || 'unknown'}, ${lng || 'unknown'}

### Category

CATEGORY: ${category}
CATEGORY_TIER: ${tier}

### Lead Economics
`;

			if (economics) {
				context += `
AVG_JOB_VALUE: $${economics.avgJobValue.min} - $${economics.avgJobValue.max}
PROVIDER_PAYS: $${economics.providerPays.min} - $${economics.providerPays.max}
TYPICAL_CPL: $${economics.typicalCPL.min} - $${economics.typicalCPL.max}
URGENCY: ${economics.urgency}
COMPETITION_LEVEL: ${economics.competitionLevel}
SEASONALITY: ${economics.seasonality}
`;
			} else {
				context += `
AVG_JOB_VALUE: Unknown
PROVIDER_PAYS: Unknown
TYPICAL_CPL: Unknown
URGENCY: medium
COMPETITION_LEVEL: moderate
SEASONALITY: none
`;
			}

			// Add SERP data if available
			if (serpScore !== undefined || serpQuality) {
				context += `
### SERP Analysis

SERP_SCORE: ${serpScore ?? 'Unknown'}
SERP_QUALITY: ${serpQuality ?? 'Unknown'}
`;
			}

			return context;
		},
		[]
	);

	/**
	 * Generate a specialized prompt using the selected LLM provider
	 */
	const generateSpecializedPrompt = useCallback(
		async (
			input: PromptGenerationInput,
			provider: string,
			useReasoning: boolean
		): Promise<PromptGenerationResult> => {
			setIsGenerating(true);
			setError(null);

			try {
				// Build the context for the category modifier prompt
				const categoryContext = buildCategoryModifierInput(input);

				// Build the full prompt for the LLM
				const systemPrompt = `You are a specialized landing page specification generator. Your task is to take the Foundation Golden Prompt template and fill in ALL placeholders and sections with category-specific content for the given location and service category.

${CATEGORY_MODIFIER_PROMPT.replace('{{FOUNDATION_GOLDEN_PROMPT}}', FOUNDATION_GOLDEN_PROMPT)}

## CRITICAL OUTPUT REQUIREMENTS

Your output MUST be a COMPLETE, BUILD-READY specification document that a frontend developer can immediately use to build the landing page. This means:

1. **Complete Structure**: Output the FULL foundation prompt structure - every section must be included and filled in
2. **No Placeholders Left**: Replace ALL {{VARIABLE}} placeholders with actual content
3. **Actual Code Examples**: Include real CSS variables, real HTML examples, real schema JSON
4. **Specific Content**: Write actual headlines, taglines, FAQ answers - not placeholders
5. **Ready to Build**: A frontend developer should be able to read this and build the page without asking questions

## FRONTEND IMPLEMENTATION REQUIREMENTS

The output must include these implementation-ready specifications:

### FRONTEND DESIGN EXCELLENCE MANDATE

Create distinctive, production-grade interfaces that avoid generic "AI slop" aesthetics.

**Design Thinking:**
- Pick ONE EXTREME design direction and commit fully (Brutalist Confidence, Editorial Luxury, Warm Craft, Industrial Utility, or Retro-Modern)
- Intentionality matters more than intensity

**Typography Rules:**
- NEVER use: Arial, Inter, Roboto, Space Grotesk, system fonts
- Choose distinctive, characterful fonts (Fraunces, DM Serif Display, Clash Display, etc.)
- Pair a distinctive display font with a refined body font

**Color & Theme Rules:**
- Commit to a cohesive aesthetic with CSS custom properties
- Dominant colors with sharp accents > timid, evenly-distributed palettes
- NEVER: Purple gradients on white (cliché AI aesthetic)

**Motion Guidelines:**
- CSS-only animations (no JavaScript frameworks)
- Focus on HIGH-IMPACT moments: page load reveals, scroll-triggered effects, surprising hover states
- Quality over quantity

**Spatial Composition:**
- Unexpected layouts that break from the 3-column card grid
- Asymmetry where appropriate
- Generous negative space (luxury) OR controlled density (urgency)

**Anti-Patterns (NEVER BUILD):**
- Overused fonts (Inter, Roboto, Arial, Space Grotesk)
- Purple gradients on white
- Predictable 3-column card layouts
- Cookie-cutter hero sections
- Generic icon libraries
- Testimonial carousels
- "Trusted by" grayscale logo bars
- Floating geometric blob shapes

### Technical Stack Requirements
- Semantic HTML5 structure
- Modern CSS (Grid, Flexbox, Custom Properties, clamp() for fluid typography)
- Vanilla JavaScript with progressive enhancement
- Mobile-first responsive breakpoints: 640px, 1024px, 1280px
- WCAG 2.1 AA accessibility compliance

### Performance Requirements
- LCP (Largest Contentful Paint): < 2.5s
- FID (First Input Delay): < 100ms  
- CLS (Cumulative Layout Shift): < 0.1
- Critical CSS inlined in <head>
- Font preloading with preconnect to Google Fonts
- Lazy loading for below-fold images

### Component Specifications
For each major section, include:
- Semantic HTML structure
- CSS class naming conventions
- Responsive behavior at each breakpoint
- Accessibility requirements (ARIA, focus states)
- Animation/interaction specifications

### Form Implementation
- Field validation with inline feedback
- Accessible form labels and error messages
- Honeypot spam prevention
- Loading states for submission
- Success/error response handling`;

				const userPrompt = `Generate a COMPLETE, BUILD-READY landing page specification for:

${categoryContext}

## OUTPUT FORMAT

Start your response with the business name in this exact format:
BUSINESS_NAME: [Your Generated Name]

Then output the COMPLETE specialized prompt following the EXACT structure of the Foundation Golden Prompt, but with ALL sections filled in with specific content for "${input.category}" in "${input.city}${input.state ? `, ${input.state}` : ''}".

Include:
1. **GENERATED BUSINESS IDENTITY** - Complete with name, tagline, established year, service area, domain
2. **SEO TARGETS** - Actual title tag, meta description, H1, and complete keyword strategy
3. **DESIGN DIRECTION** - The specific design style with full color palette CSS and typography CSS
4. **PAGE ARCHITECTURE** - Every section fully specified with actual copy, not placeholders
5. **VALUE CONTENT SECTIONS** - FULL, COMPLETE content (400+ words each) for the required value sections
6. **LOCAL SEO REQUIREMENTS** - Complete schema.org JSON-LD examples with actual data
7. **TECHNICAL OUTPUT** - Complete HTML/CSS/JS specifications
8. **QUALITY CHECKLIST** - Filled in for this specific page

The output must be comprehensive enough that a frontend developer can build the complete landing page without asking any questions.

Write ALL content - headlines, subheadlines, FAQ answers, value content paragraphs, testimonials, service descriptions - as actual finished copy, not placeholders or instructions.`;

				// Call the LLM
				const response = await callLLM(
					provider,
					userPrompt,
					provider,
					systemPrompt,
					useReasoning
				);

				// Parse the business name from the response
				const businessName = extractBusinessName(response);

				return {
					prompt: response,
					businessName,
				};
			} catch (err) {
				const errorMessage =
					err instanceof Error
						? err.message
						: 'Unknown error generating prompt';
				setError(errorMessage);
				throw err;
			} finally {
				setIsGenerating(false);
			}
		},
		[buildCategoryModifierInput]
	);

	return {
		generateSpecializedPrompt,
		isGenerating,
		error,
	};
}

/**
 * Extract business name from LLM response
 */
function extractBusinessName(response: string): string | null {
	// Look for "BUSINESS_NAME: X" pattern
	const match = response.match(/BUSINESS_NAME:\s*([^\n]+)/i);
	if (match && match[1]) {
		return match[1].trim().replace(/^["']|["']$/g, ''); // Remove quotes if present
	}
	return null;
}

/**
 * Get state abbreviation from full state name
 */
function getStateAbbreviation(state: string): string {
	const abbreviations: Record<string, string> = {
		alabama: 'AL',
		alaska: 'AK',
		arizona: 'AZ',
		arkansas: 'AR',
		california: 'CA',
		colorado: 'CO',
		connecticut: 'CT',
		delaware: 'DE',
		florida: 'FL',
		georgia: 'GA',
		hawaii: 'HI',
		idaho: 'ID',
		illinois: 'IL',
		indiana: 'IN',
		iowa: 'IA',
		kansas: 'KS',
		kentucky: 'KY',
		louisiana: 'LA',
		maine: 'ME',
		maryland: 'MD',
		massachusetts: 'MA',
		michigan: 'MI',
		minnesota: 'MN',
		mississippi: 'MS',
		missouri: 'MO',
		montana: 'MT',
		nebraska: 'NE',
		nevada: 'NV',
		'new hampshire': 'NH',
		'new jersey': 'NJ',
		'new mexico': 'NM',
		'new york': 'NY',
		'north carolina': 'NC',
		'north dakota': 'ND',
		ohio: 'OH',
		oklahoma: 'OK',
		oregon: 'OR',
		pennsylvania: 'PA',
		'rhode island': 'RI',
		'south carolina': 'SC',
		'south dakota': 'SD',
		tennessee: 'TN',
		texas: 'TX',
		utah: 'UT',
		vermont: 'VT',
		virginia: 'VA',
		washington: 'WA',
		'west virginia': 'WV',
		wisconsin: 'WI',
		wyoming: 'WY',
		'district of columbia': 'DC',
	};

	// Check if already an abbreviation (2 chars)
	if (state.length === 2) {
		return state.toUpperCase();
	}

	return abbreviations[state.toLowerCase()] || state.slice(0, 2).toUpperCase();
}

export default usePromptGeneration;
