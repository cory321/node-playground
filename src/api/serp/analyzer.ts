import { callLLM } from '@/api/llm';
import { SerpSignals } from './cache';
import { AGGREGATOR_DOMAINS } from './tiers';

// Category analysis result
export interface CategoryAnalysis {
  category: string;
  tier: 'tier1' | 'tier2' | 'tier3' | 'conditional';
  serpQuality: 'Weak' | 'Medium' | 'Strong';
  serpScore: number; // 1-10
  competition: 'Low' | 'Medium' | 'High';
  leadValue: string; // "$50-100"
  urgency: 'Low' | 'Medium' | 'High';
  verdict: 'strong' | 'maybe' | 'skip';
  reasoning: string; // 1-2 sentence explanation
  fromCache: boolean;
}

// Quick triage result
export interface TriageResult {
  city: string;
  state: string | null;
  overallSignal: 'promising' | 'neutral' | 'saturated';
  lsaPresent: boolean;
  aggregatorDominance: 'high' | 'medium' | 'low';
  adDensity: 'high' | 'medium' | 'low';
  recommendation: string;
  worthFullScan: boolean;
}

// Analysis prompt for Claude
const CATEGORY_ANALYSIS_PROMPT = `You are a local service market analyst. Analyze the following SERP signals for a service category and provide a structured assessment.

## SERP Signals
Category: {category}
City: {city}, {state}

Organic Results Top 5 Domains: {topDomains}
Aggregator Positions in Top 5: {aggregatorPositions}
Local Service Ads (LSAs) Present: {hasLSAs} (Count: {lsaCount})
Local Pack Results: {localPackCount}
Ad Count: {adCount}
Total Results: {totalResults}

## Known Aggregators
These domains indicate weak local competition when dominating: ${AGGREGATOR_DOMAINS.slice(0, 6).join(', ')}

## Your Analysis Task
Based on these signals, provide:

1. **SERP Quality** (Weak/Medium/Strong)
   - Weak: Aggregators in positions 1-3, template sites, thin content
   - Medium: Mix of aggregators and quality locals
   - Strong: Quality local specialists with good sites

2. **Competition** (Low/Medium/High)
   - Use ad count, LSA presence, and local pack density as signals

3. **Lead Value** (estimate $X-Y per lead)
   - Consider: job value (~10% = lead fee), LSA presence indicates proven market

4. **Urgency** (Low/Medium/High)
   - Emergency services = High, planning services = Low

5. **Verdict**: strong (✅), maybe (⚠️), or skip (❌)

Respond with ONLY this JSON format:
{
  "serpQuality": "Weak|Medium|Strong",
  "serpScore": 1-10,
  "competition": "Low|Medium|High",
  "leadValue": "$XX-YY",
  "urgency": "Low|Medium|High",
  "verdict": "strong|maybe|skip",
  "reasoning": "1-2 sentence explanation"
}`;

const TRIAGE_ANALYSIS_PROMPT = `You are a local service market analyst. Analyze these quick triage signals for a city to determine if it's worth a full market scan.

## City: {city}, {state}

## SERP Signals for "home services near me"
LSAs Present: {hasLSAs} (Count: {lsaCount})
Top 5 Organic Domains: {topDomains}
Aggregator Positions: {aggregatorPositions}
Ad Count: {adCount}
Local Pack Count: {localPackCount}

## Analysis Task
Determine if this market is worth a full scan:

- **Promising**: Aggregators dominating = opportunity, LSAs present = validated market
- **Saturated**: Many quality local sites, high competition
- **Neutral**: Mixed signals, worth exploring specific categories

Respond with ONLY this JSON format:
{
  "overallSignal": "promising|neutral|saturated",
  "aggregatorDominance": "high|medium|low",
  "adDensity": "high|medium|low",
  "recommendation": "1 sentence recommendation",
  "worthFullScan": true|false
}`;

/**
 * Analyze SERP signals for a category using Claude
 */
export async function analyzeSerpWithClaude(
  category: string,
  city: string,
  state: string | null,
  signals: SerpSignals,
  tier: 'tier1' | 'tier2' | 'tier3' | 'conditional' = 'tier1'
): Promise<CategoryAnalysis> {
  const prompt = CATEGORY_ANALYSIS_PROMPT.replace('{category}', category)
    .replace('{city}', city)
    .replace('{state}', state || 'Unknown')
    .replace('{topDomains}', signals.topOrganicDomains.join(', ') || 'None')
    .replace(
      '{aggregatorPositions}',
      signals.aggregatorPositions.length > 0
        ? signals.aggregatorPositions.join(', ')
        : 'None'
    )
    .replace('{hasLSAs}', signals.hasLSAs ? 'Yes' : 'No')
    .replace('{lsaCount}', signals.lsaCount.toString())
    .replace('{localPackCount}', signals.localPackCount.toString())
    .replace('{adCount}', signals.adCount.toString())
    .replace('{totalResults}', signals.totalResults.toString());

  try {
    const response = await callLLM('claude-haiku', prompt);

    // Parse JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      category,
      tier,
      serpQuality: parsed.serpQuality || 'Medium',
      serpScore: parsed.serpScore || 5,
      competition: parsed.competition || 'Medium',
      leadValue: parsed.leadValue || '$25-50',
      urgency: parsed.urgency || 'Medium',
      verdict: parsed.verdict || 'maybe',
      reasoning: parsed.reasoning || 'Unable to determine',
      fromCache: false,
    };
  } catch (err) {
    console.error('Claude analysis error:', err);

    // Fallback to heuristic-based analysis
    return analyzeWithHeuristics(category, signals, tier);
  }
}

/**
 * Fallback heuristic-based analysis when Claude is unavailable
 */
function analyzeWithHeuristics(
  category: string,
  signals: SerpSignals,
  tier: 'tier1' | 'tier2' | 'tier3' | 'conditional'
): CategoryAnalysis {
  // SERP Quality based on aggregator positions
  let serpQuality: 'Weak' | 'Medium' | 'Strong' = 'Medium';
  let serpScore = 5;

  const aggInTop3 = signals.aggregatorPositions.filter((p) => p <= 3).length;
  if (aggInTop3 >= 2) {
    serpQuality = 'Weak';
    serpScore = 3;
  } else if (aggInTop3 === 0 && signals.topOrganicDomains.length >= 3) {
    serpQuality = 'Strong';
    serpScore = 8;
  }

  // Competition based on ads and LSAs
  let competition: 'Low' | 'Medium' | 'High' = 'Medium';
  if (signals.adCount >= 4 && signals.hasLSAs) {
    competition = 'High';
  } else if (signals.adCount <= 1 && !signals.hasLSAs) {
    competition = 'Low';
  }

  // Lead value based on category type
  const highValueCategories = [
    'hvac',
    'roofing',
    'garage door',
    'appliance',
    'plumber',
    'electrician',
  ];
  const isHighValue = highValueCategories.some((hv) =>
    category.toLowerCase().includes(hv)
  );
  const leadValue = isHighValue ? '$50-100' : '$25-50';

  // Urgency based on category
  const emergencyCategories = [
    'emergency',
    'plumber',
    'electrician',
    'hvac',
    'locksmith',
    'towing',
  ];
  const isEmergency = emergencyCategories.some((em) =>
    category.toLowerCase().includes(em)
  );
  const urgency: 'Low' | 'Medium' | 'High' = isEmergency ? 'High' : 'Medium';

  // Verdict
  let verdict: 'strong' | 'maybe' | 'skip' = 'maybe';
  if (serpQuality === 'Weak' && competition !== 'High') {
    verdict = 'strong';
    serpScore = Math.min(10, serpScore + 2);
  } else if (serpQuality === 'Strong' && competition === 'High') {
    verdict = 'skip';
    serpScore = Math.max(1, serpScore - 2);
  }

  return {
    category,
    tier,
    serpQuality,
    serpScore,
    competition,
    leadValue,
    urgency,
    verdict,
    reasoning: `${serpQuality} SERP with ${competition.toLowerCase()} competition. ${signals.hasLSAs ? 'LSAs present indicate proven market.' : 'No LSAs detected.'}`,
    fromCache: false,
  };
}

/**
 * Generate quick triage analysis for a city
 */
export async function generateTriageAnalysis(
  city: string,
  state: string | null,
  signals: SerpSignals
): Promise<TriageResult> {
  const prompt = TRIAGE_ANALYSIS_PROMPT.replace('{city}', city)
    .replace('{state}', state || 'Unknown')
    .replace('{hasLSAs}', signals.hasLSAs ? 'Yes' : 'No')
    .replace('{lsaCount}', signals.lsaCount.toString())
    .replace('{topDomains}', signals.topOrganicDomains.join(', ') || 'None')
    .replace(
      '{aggregatorPositions}',
      signals.aggregatorPositions.length > 0
        ? signals.aggregatorPositions.join(', ')
        : 'None'
    )
    .replace('{adCount}', signals.adCount.toString())
    .replace('{localPackCount}', signals.localPackCount.toString());

  try {
    const response = await callLLM('claude-haiku', prompt);

    // Parse JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      city,
      state,
      overallSignal: parsed.overallSignal || 'neutral',
      lsaPresent: signals.hasLSAs,
      aggregatorDominance: parsed.aggregatorDominance || 'medium',
      adDensity: parsed.adDensity || 'medium',
      recommendation: parsed.recommendation || 'Consider running a full scan.',
      worthFullScan: parsed.worthFullScan ?? true,
    };
  } catch (err) {
    console.error('Triage analysis error:', err);

    // Fallback heuristic
    const aggCount = signals.aggregatorPositions.length;
    const worthFullScan = aggCount >= 2 || signals.hasLSAs;

    return {
      city,
      state,
      overallSignal: aggCount >= 3 ? 'promising' : 'neutral',
      lsaPresent: signals.hasLSAs,
      aggregatorDominance: aggCount >= 3 ? 'high' : aggCount >= 1 ? 'medium' : 'low',
      adDensity: signals.adCount >= 4 ? 'high' : signals.adCount >= 2 ? 'medium' : 'low',
      recommendation: worthFullScan
        ? 'Market shows opportunity signals. Run full scan.'
        : 'Limited signals. May want to skip or test specific categories.',
      worthFullScan,
    };
  }
}
