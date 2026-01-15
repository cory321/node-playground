import { useCallback, useState } from 'react';
import { callLLM } from '@/api/llm';
import { FOUNDATION_GOLDEN_PROMPT, CATEGORY_MODIFIER_PROMPT } from '@/api/prompts';
import { getLeadEconomics, getCategoryTier, detectCityProfile } from '@/api/serp/tiers';
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
  const buildCategoryModifierInput = useCallback((input: PromptGenerationInput): string => {
    const { city, state, category, serpScore, serpQuality, demographics, lat, lng } = input;

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
  }, []);

  /**
   * Generate a specialized prompt using the selected LLM provider
   */
  const generateSpecializedPrompt = useCallback(async (
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
      const systemPrompt = CATEGORY_MODIFIER_PROMPT
        .replace('{{FOUNDATION_GOLDEN_PROMPT}}', FOUNDATION_GOLDEN_PROMPT);

      const userPrompt = `Generate a Complete Specialized Golden Prompt for:

${categoryContext}

Output a complete, ready-to-use prompt that will generate a SERP-dominating landing page for "${input.category}" in "${input.city}${input.state ? `, ${input.state}` : ''}".

Include the generated BUSINESS_NAME at the start of your response in this exact format:
BUSINESS_NAME: [Your Generated Name]

Then provide the full specialized prompt.`;

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
      const errorMessage = err instanceof Error ? err.message : 'Unknown error generating prompt';
      setError(errorMessage);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, [buildCategoryModifierInput]);

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
    'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR',
    'california': 'CA', 'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE',
    'florida': 'FL', 'georgia': 'GA', 'hawaii': 'HI', 'idaho': 'ID',
    'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA', 'kansas': 'KS',
    'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
    'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS',
    'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV',
    'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
    'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK',
    'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
    'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT',
    'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV',
    'wisconsin': 'WI', 'wyoming': 'WY', 'district of columbia': 'DC',
  };

  // Check if already an abbreviation (2 chars)
  if (state.length === 2) {
    return state.toUpperCase();
  }

  return abbreviations[state.toLowerCase()] || state.slice(0, 2).toUpperCase();
}

export default usePromptGeneration;
