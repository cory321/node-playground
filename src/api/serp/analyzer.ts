import { callLLM } from '@/api/llm';
import { SerpSignals } from './cache';
import { AGGREGATOR_DOMAINS } from './tiers';
import type { TrendValidation, SerpDemandSignals } from './validation';
import {
  calculateValidatedGapScore,
  type ValidatedGapScore,
  type MarketValidation,
} from './validatedScoring';

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
  // New validation fields
  validationFlags?: string[];
  trendConfidence?: number;
  demandConfidence?: 'high' | 'medium' | 'low' | 'unvalidated';
  spikeDetected?: boolean;
  trendDirection?: 'growing' | 'declining' | 'flat' | 'volatile';
  validatedScore?: ValidatedGapScore;
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

// Enhanced prompt with trend validation signals
const VALIDATED_CATEGORY_ANALYSIS_PROMPT = `You are a local service market analyst. Analyze the following SERP and TREND signals for a service category. Pay special attention to trend validation warnings.

## Category: {category}
## Location: {city}, {state}

## SERP Signals
- Top 5 Organic Domains: {topDomains}
- Aggregator Positions (1-5): {aggregatorPositions}
- Local Service Ads: {hasLSAs} (Count: {lsaCount})
- Local Pack Results: {localPackCount}
- Paid Ads: {adCount}
- Total Results: {totalResults}

## Trend Validation Signals
- Trend Stable: {trendStable}
- Spike Detected: {spikeDetected} (Ratio: {spikeRatio}x median)
- Average Interest: {avgInterest}/100
- Trend Direction: {trendDirection}
- Trend Confidence: {trendConfidence}%
- Trend Flags: {trendFlags}

## Demand Signals
- Organic Results Found: {organicResultsCount}
- LSAs Present: {demandLsaPresent} (Count: {demandLsaCount})
- Paid Ads: {demandAdsCount}
- Local Pack Reviews (total): {localPackReviews}
- Established Businesses (50+ reviews): {establishedBusinesses}
- Related Searches: {relatedSearchesCount}
- People Also Ask: {paaCount}
- Demand Confidence: {demandConfidence}

## CRITICAL: If spike is detected or trend is declining, be skeptical of the opportunity.

## Analysis Task
Based on ALL signals (SERP + Trend + Demand), provide:

1. **SERP Quality** (Weak/Medium/Strong)
2. **Competition** (Low/Medium/High)
3. **Lead Value** estimate
4. **Urgency** (Low/Medium/High)
5. **Verdict**: 
   - strong: Validated demand with weak competition
   - maybe: Some signals positive but needs validation
   - skip: Spike detected, declining trend, or unvalidated demand

Respond with ONLY this JSON format:
{
  "serpQuality": "Weak|Medium|Strong",
  "serpScore": 1-10,
  "competition": "Low|Medium|High",
  "leadValue": "$XX-YY",
  "urgency": "Low|Medium|High",
  "verdict": "strong|maybe|skip",
  "reasoning": "1-2 sentence explanation including any validation concerns"
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

/**
 * Analyze SERP signals with trend validation using Claude
 * This is the enhanced version that incorporates trend and demand signals
 */
export async function analyzeSerpWithValidation(
  category: string,
  city: string,
  state: string | null,
  signals: SerpSignals,
  trendValidation: TrendValidation,
  demandSignals: SerpDemandSignals,
  tier: 'tier1' | 'tier2' | 'tier3' | 'conditional' = 'tier1'
): Promise<CategoryAnalysis> {
  // Build the enhanced prompt with all validation signals
  // IMPORTANT: Use demandSignals (fresh data from serp-search) for overlapping fields
  // to avoid contradictions with stale cached data from signals (legacy serp-proxy)
  const prompt = VALIDATED_CATEGORY_ANALYSIS_PROMPT
    .replace('{category}', category)
    .replace('{city}', city)
    .replace('{state}', state || 'Unknown')
    .replace('{topDomains}', signals.topOrganicDomains.join(', ') || 'None')
    .replace(
      '{aggregatorPositions}',
      signals.aggregatorPositions.length > 0
        ? signals.aggregatorPositions.join(', ')
        : 'None'
    )
    // Use demandSignals for these fields to ensure consistency with Demand Signals section
    .replace('{hasLSAs}', demandSignals.lsaPresent ? 'Yes' : 'No')
    .replace('{lsaCount}', demandSignals.lsaCount.toString())
    .replace('{localPackCount}', demandSignals.localPackCount.toString())
    .replace('{adCount}', demandSignals.paidAdsCount.toString())
    .replace('{totalResults}', signals.totalResults.toString())
    // Trend validation signals
    .replace('{trendStable}', trendValidation.isStable ? 'Yes' : 'No')
    .replace('{spikeDetected}', trendValidation.spikeDetected ? 'YES ⚠️' : 'No')
    .replace('{spikeRatio}', trendValidation.spikeRatio.toFixed(1))
    .replace('{avgInterest}', trendValidation.averageInterest.toFixed(0))
    .replace('{trendDirection}', trendValidation.trendDirection.toUpperCase())
    .replace('{trendConfidence}', trendValidation.confidenceScore.toString())
    .replace('{trendFlags}', trendValidation.flags.join('; ') || 'None')
    // Demand signals
    .replace('{organicResultsCount}', (demandSignals.organicResultsCount ?? 0).toString())
    .replace('{demandLsaPresent}', demandSignals.lsaPresent ? 'Yes' : 'No')
    .replace('{demandLsaCount}', demandSignals.lsaCount.toString())
    .replace('{demandAdsCount}', demandSignals.paidAdsCount.toString())
    .replace('{localPackReviews}', demandSignals.localPackTotalReviews.toString())
    .replace('{establishedBusinesses}', demandSignals.establishedBusinesses.toString())
    .replace('{relatedSearchesCount}', demandSignals.relatedSearchesCount.toString())
    .replace('{paaCount}', demandSignals.peopleAlsoAskCount.toString())
    .replace('{demandConfidence}', demandSignals.demandConfidence.toUpperCase());

  try {
    const response = await callLLM('claude-haiku', prompt);

    // Parse JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Calculate validated gap score
    const validation: MarketValidation = {
      serpSignals: demandSignals,
      trendValidation,
    };

    const validatedScore = calculateValidatedGapScore(validation, {
      category,
      city,
      state,
      tier,
      aggregatorDominance: calculateAggregatorDominance(signals),
      hasLSAs: demandSignals.lsaPresent, // Use fresh data from demandSignals
    });

    // Override verdict based on validation
    let finalVerdict = parsed.verdict || 'maybe';
    if (trendValidation.spikeDetected) {
      // If spike detected, never return 'strong'
      if (finalVerdict === 'strong') {
        finalVerdict = 'maybe';
      }
    }
    if (validatedScore.verdict === 'SKIP') {
      finalVerdict = 'skip';
    }

    return {
      category,
      tier,
      serpQuality: parsed.serpQuality || 'Medium',
      serpScore: parsed.serpScore || 5,
      competition: parsed.competition || 'Medium',
      leadValue: parsed.leadValue || '$25-50',
      urgency: parsed.urgency || 'Medium',
      verdict: finalVerdict,
      reasoning: parsed.reasoning || 'Unable to determine',
      fromCache: false,
      // New validation fields
      validationFlags: validatedScore.flags,
      trendConfidence: trendValidation.confidenceScore,
      demandConfidence: demandSignals.demandConfidence,
      spikeDetected: trendValidation.spikeDetected,
      trendDirection: trendValidation.trendDirection,
      validatedScore,
    };
  } catch (err) {
    console.error('Validated Claude analysis error:', err);

    // Fallback to heuristic-based analysis with validation overlay
    const baseAnalysis = analyzeWithHeuristics(category, signals, tier);

    // Calculate validated score even in fallback
    const validation: MarketValidation = {
      serpSignals: demandSignals,
      trendValidation,
    };

    const validatedScore = calculateValidatedGapScore(validation, {
      category,
      city,
      state,
      tier,
      aggregatorDominance: calculateAggregatorDominance(signals),
      hasLSAs: demandSignals.lsaPresent, // Use fresh data from demandSignals
    });

    // Override verdict based on validation
    let finalVerdict = baseAnalysis.verdict;
    if (trendValidation.spikeDetected && finalVerdict === 'strong') {
      finalVerdict = 'maybe';
    }
    if (validatedScore.verdict === 'SKIP') {
      finalVerdict = 'skip';
    }

    return {
      ...baseAnalysis,
      verdict: finalVerdict,
      reasoning: `${baseAnalysis.reasoning} ${validatedScore.flags.length > 0 ? '⚠️ ' + validatedScore.flags[0] : ''}`,
      validationFlags: validatedScore.flags,
      trendConfidence: trendValidation.confidenceScore,
      demandConfidence: demandSignals.demandConfidence,
      spikeDetected: trendValidation.spikeDetected,
      trendDirection: trendValidation.trendDirection,
      validatedScore,
    };
  }
}

/**
 * Helper to calculate aggregator dominance percentage
 */
function calculateAggregatorDominance(signals: SerpSignals): number {
  if (signals.topOrganicDomains.length === 0) return 0;
  return (signals.aggregatorPositions.length / signals.topOrganicDomains.length) * 100;
}
