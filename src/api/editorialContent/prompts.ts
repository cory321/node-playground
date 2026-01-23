// Prompt templates for editorial content generation
// Each prompt is designed to generate specific, locally-relevant content

import { EditorialPageType, QualityLevel } from '@/types/editorialContent';
import { LocalKnowledgeOutput } from '@/types/localKnowledge';

// ============================================================================
// PROMPT CONTEXT TYPES
// ============================================================================

export interface PromptContext {
	service: string;
	city: string;
	state: string;
	region: string;
	keyword: string;
	localKnowledge: LocalKnowledgeOutput;
	qualityLevel: QualityLevel;
	sectionName?: string;
	targetWords?: number;
}

// ============================================================================
// LOCAL CONTEXT BUILDER
// ============================================================================

/**
 * Build local context string from LocalKnowledge for injection into prompts
 */
export function buildLocalContext(
	localKnowledge: LocalKnowledgeOutput
): string {
	const hooks = localKnowledge.contentHooks;
	const market = localKnowledge.marketContext;
	const identity = localKnowledge.regionalIdentity;

	const lines: string[] = [];

	if (hooks.localPhrases.length > 0) {
		lines.push(`Local phrases: ${hooks.localPhrases.slice(0, 3).join(', ')}`);
	}

	if (hooks.neighborhoodNames.length > 0) {
		lines.push(
			`Neighborhoods: ${hooks.neighborhoodNames.slice(0, 5).join(', ')}`
		);
	}

	if (hooks.climateContext.length > 0) {
		lines.push(`Climate factors: ${hooks.climateContext.join(', ')}`);
	}

	if (hooks.categorySpecificIssues.length > 0) {
		lines.push(
			`Common local issues: ${hooks.categorySpecificIssues.join(', ')}`
		);
	}

	if (market.pricePosition) {
		lines.push(`Price context: ${market.pricePosition}`);
	}

	if (market.seasonalPatterns.length > 0) {
		lines.push(`Seasonal patterns: ${market.seasonalPatterns.join(', ')}`);
	}

	if (identity.region) {
		lines.push(`Region: ${identity.region} (${identity.characterization})`);
	}

	if (identity.nearbyReference) {
		lines.push(`Location reference: ${identity.nearbyReference}`);
	}

	return lines.join('\n');
}

// ============================================================================
// INTRODUCTION PROMPTS
// ============================================================================

export function getIntroductionPrompt(ctx: PromptContext): string {
	const localContext = buildLocalContext(ctx.localKnowledge);
	const wordTarget = ctx.qualityLevel === 'polished' ? '150-200' : '100-150';

	return `Write a ${wordTarget}-word introduction for a page about ${ctx.service} in ${ctx.city}, ${ctx.state}.

Target keyword: "${ctx.keyword}"

Local context:
${localContext}

Requirements:
- Hook the reader immediately with a compelling opening
- Establish what the service is in clear terms
- Mention ${ctx.city} or the local area naturally (not forced)
- Preview what the page covers
- Must feel local-specific, NOT generic
- Use active voice
- No filler phrases like "In today's world..." or "It's important to note..."

Write the introduction now:`;
}

// ============================================================================
// SECTION PROMPTS
// ============================================================================

export function getSectionPrompt(ctx: PromptContext): string {
	const localContext = buildLocalContext(ctx.localKnowledge);
	const wordTarget = ctx.targetWords || 200;

	return `Write the "${ctx.sectionName}" section for a page about ${ctx.service} in ${ctx.city}, ${ctx.state}.

Target keyword: "${ctx.keyword}"
Target word count: ${wordTarget} words

Local context:
${localContext}

Requirements:
- Be specific with facts and numbers where relevant
- Include at least one local reference naturally
- Use active voice
- No filler content
- Make it genuinely useful to the reader
- Format with appropriate subheadings if the section is long

Write the section now:`;
}

// ============================================================================
// SERVICE PAGE PROMPTS
// ============================================================================

export function getServicePageSectionPrompt(
	ctx: PromptContext,
	sectionType:
		| 'what_is'
		| 'types'
		| 'when_needed'
		| 'local_considerations'
		| 'choosing_provider'
		| 'cost_overview'
		| 'diy_vs_pro'
): string {
	const localContext = buildLocalContext(ctx.localKnowledge);

	const sectionPrompts: Record<string, string> = {
		what_is: `Explain what ${ctx.service} is and why homeowners need it. Be clear and concise. Target: 150-200 words.`,

		types: `Describe the different types of ${ctx.service} available. List 3-5 main types with brief descriptions. Target: 200-250 words.`,

		when_needed: `Explain when homeowners typically need ${ctx.service}. Include warning signs and situations. Target: 150-200 words.`,

		local_considerations: `Explain ${ctx.region}-specific factors that affect ${ctx.service}. Include climate, local building codes, common issues in the area. This section MUST include multiple local references. Target: 200-250 words.`,

		choosing_provider: `Guide homeowners on how to choose a ${ctx.service} provider in ${ctx.city}. Include what to look for, red flags, and local tips. Target: 200-250 words.`,

		cost_overview: `Provide a cost overview for ${ctx.service} in ${ctx.city}. Include typical price ranges and factors affecting cost. Be specific with numbers. Target: 150-200 words.`,

		diy_vs_pro: `Compare DIY vs professional ${ctx.service}. When is DIY appropriate? When should you hire a pro? Target: 150-200 words.`,
	};

	return `Write content for a ${ctx.service} service page.

Section: ${sectionType.replace(/_/g, ' ')}
${sectionPrompts[sectionType]}

Location: ${ctx.city}, ${ctx.state}
Target keyword: "${ctx.keyword}"

Local context:
${localContext}

Requirements:
- Be specific, not generic
- Use active voice
- No filler phrases
- Include local references where natural

Write the section now:`;
}

// ============================================================================
// COST GUIDE PROMPTS
// ============================================================================

export function getCostGuideSectionPrompt(
	ctx: PromptContext,
	sectionType:
		| 'quick_answer'
		| 'detailed_pricing'
		| 'factors'
		| 'city_comparison'
		| 'examples'
		| 'save_money'
		| 'red_flags'
		| 'methodology'
): string {
	const localContext = buildLocalContext(ctx.localKnowledge);
	const market = ctx.localKnowledge.marketContext;

	const sectionPrompts: Record<string, string> = {
		quick_answer: `Write a featured snippet-optimized quick answer about ${ctx.service} costs in ${ctx.city}. Include a specific price range. Format as a concise paragraph that could appear in Google's featured snippet. Target: 50-75 words.`,

		detailed_pricing: `Create a detailed pricing breakdown for ${ctx.service} in ${ctx.city}. Include:
- Basic/standard/premium tiers
- Price ranges for each
- What's included at each level
Format as structured content suitable for a table. Target: 200-250 words.`,

		factors: `Explain the factors that affect ${ctx.service} pricing in ${ctx.city}. Include at least 5 factors with explanations. Local pricing context: ${market.pricePosition}. Target: 200-250 words.`,

		city_comparison: `Compare ${ctx.service} prices in ${ctx.city} to nearby areas and the national average. Include specific numbers. Target: 150-200 words.`,

		examples: `Provide 2-3 real-world pricing examples for ${ctx.service} in ${ctx.city}. Include:
- What the job entailed
- Final cost
- Why it cost that amount
Make examples feel realistic and local. Target: 200-250 words.`,

		save_money: `Provide actionable tips for saving money on ${ctx.service} in ${ctx.city}. Include 5-7 specific tips. Seasonal patterns: ${market.seasonalPatterns.join(', ')}. Target: 200-250 words.`,

		red_flags: `Warn about red flags and potential scams related to ${ctx.service} pricing. Include:
- Suspicious pricing tactics
- Common scams
- How to protect yourself
Target: 150-200 words.`,

		methodology: `Explain how this cost data was gathered and verified. Include data sources and date ranges. Target: 100-150 words.`,
	};

	return `Write content for a ${ctx.service} cost guide.

Section: ${sectionType.replace(/_/g, ' ')}
${sectionPrompts[sectionType]}

Location: ${ctx.city}, ${ctx.state}
Target keyword: "${ctx.keyword}"

Local context:
${localContext}

Requirements:
- Be SPECIFIC with numbers (not "varies" or "depends")
- Reference local pricing context
- Use active voice
- No filler content

Write the section now:`;
}

// ============================================================================
// TROUBLESHOOTING PROMPTS
// ============================================================================

export function getTroubleshootingSectionPrompt(
	ctx: PromptContext,
	sectionType:
		| 'problem_overview'
		| 'common_causes'
		| 'diy_diagnosis'
		| 'when_to_call'
		| 'repair_costs'
		| 'prevention'
): string {
	const localContext = buildLocalContext(ctx.localKnowledge);
	const issues = ctx.localKnowledge.contentHooks.categorySpecificIssues;

	const sectionPrompts: Record<string, string> = {
		problem_overview: `Describe the problem related to ${ctx.service} that this troubleshooting guide addresses. Help readers identify if this is their issue. Target: 100-150 words.`,

		common_causes: `List and explain the common causes of this ${ctx.service} problem. Include 4-6 causes with brief explanations. Local issues to mention: ${issues.join(', ')}. Target: 200-250 words.`,

		diy_diagnosis: `Provide step-by-step DIY diagnosis instructions. Include:
- What to check
- Tools needed (if any)
- What different findings mean
- Safety precautions
Target: 250-300 words.`,

		when_to_call: `Explain when homeowners should stop DIY and call a professional for this ${ctx.service} issue. Include clear indicators that professional help is needed. Target: 100-150 words.`,

		repair_costs: `Provide expected repair costs for this ${ctx.service} issue in ${ctx.city}. Include ranges for different scenarios. Target: 100-150 words.`,

		prevention: `Provide tips to prevent this ${ctx.service} problem from occurring. Include 4-6 actionable prevention tips. Target: 150-200 words.`,
	};

	return `Write content for a ${ctx.service} troubleshooting guide.

Section: ${sectionType.replace(/_/g, ' ')}
${sectionPrompts[sectionType]}

Location: ${ctx.city}, ${ctx.state}

Local context:
${localContext}

Requirements:
- Be practical and actionable
- Include safety warnings where appropriate
- Use clear, simple language
- Active voice

Write the section now:`;
}

// ============================================================================
// BUYING GUIDE PROMPTS
// ============================================================================

export function getBuyingGuideSectionPrompt(
	ctx: PromptContext,
	sectionType:
		| 'overview'
		| 'types_options'
		| 'features'
		| 'price_ranges'
		| 'brands'
		| 'installation'
		| 'local_factors'
		| 'maintenance'
): string {
	const localContext = buildLocalContext(ctx.localKnowledge);

	const sectionPrompts: Record<string, string> = {
		overview: `Introduce this ${ctx.service} buying guide. Explain why making the right choice matters. Target: 100-150 words.`,

		types_options: `Describe the different types and options available for ${ctx.service}. Include pros and cons of each type. Target: 250-300 words.`,

		features: `List and explain the key features to consider when buying ${ctx.service}. Include 5-7 features with explanations of why they matter. Target: 250-300 words.`,

		price_ranges: `Provide price ranges for different quality levels of ${ctx.service}. Include budget, mid-range, and premium options with what to expect at each level. Target: 200-250 words.`,

		brands: `Discuss top brands for ${ctx.service}. Include 4-6 brands with brief descriptions of their reputation and price positioning. Target: 200-250 words.`,

		installation: `Explain installation considerations for ${ctx.service}. Include:
- Professional vs DIY installation
- What to expect during installation
- Questions to ask installers
Target: 200-250 words.`,

		local_factors: `Explain local factors in ${ctx.city} that should influence your ${ctx.service} buying decision. Include climate, local codes, and regional preferences. This section MUST include multiple local references. Target: 200-250 words.`,

		maintenance: `Describe ongoing maintenance requirements for ${ctx.service}. Include what homeowners should do and when to schedule professional maintenance. Target: 150-200 words.`,
	};

	return `Write content for a ${ctx.service} buying guide.

Section: ${sectionType.replace(/_/g, ' ')}
${sectionPrompts[sectionType]}

Location: ${ctx.city}, ${ctx.state}

Local context:
${localContext}

Requirements:
- Be objective and helpful
- Include specific details and numbers
- Use active voice
- No filler content

Write the section now:`;
}

// ============================================================================
// FAQ PROMPTS
// ============================================================================

export function getFAQPrompt(
	ctx: PromptContext,
	questionCount: number
): string {
	const localContext = buildLocalContext(ctx.localKnowledge);

	return `Generate ${questionCount} FAQ questions and answers about ${ctx.service} in ${ctx.city}, ${ctx.state}.

Target keyword: "${ctx.keyword}"

Local context:
${localContext}

Requirements:
- Questions should be what real homeowners would ask
- Answers should be 50-100 words each
- Include at least one locally-specific Q&A
- Be specific and helpful
- Use natural language

Format as JSON array:
[
  {"question": "...", "answer": "..."},
  ...
]

Generate the FAQs now:`;
}

// ============================================================================
// KEY TAKEAWAYS PROMPT
// ============================================================================

export function getKeyTakeawaysPrompt(
	ctx: PromptContext,
	takeawayCount: number
): string {
	return `Generate ${takeawayCount} key takeaways summarizing the most important points about ${ctx.service} in ${ctx.city}.

Requirements:
- Each takeaway should be 1-2 sentences
- Be specific and actionable
- Include at least one local consideration
- Format as a bulleted list

Generate the key takeaways now:`;
}

// ============================================================================
// CTA PROMPTS
// ============================================================================

export function getCTAPrompt(
	ctx: PromptContext,
	ctaType: 'find_providers' | 'get_quote' | 'learn_more' | 'contact'
): string {
	const ctaInstructions: Record<string, string> = {
		find_providers: `Call-to-action to find trusted ${ctx.service} providers in ${ctx.city}`,
		get_quote: `Call-to-action to get free quotes for ${ctx.service}`,
		learn_more: `Call-to-action to explore more ${ctx.service} resources`,
		contact: `Call-to-action to contact the editorial team`,
	};

	return `Generate a compelling call-to-action section.

Purpose: ${ctaInstructions[ctaType]}

Requirements:
- Heading: 5-10 words
- Body text: 20-40 words
- Button text: 2-4 words
- Be encouraging but not pushy
- Mention ${ctx.city} if natural

Format as JSON:
{
  "heading": "...",
  "text": "...",
  "buttonText": "..."
}

Generate the CTA now:`;
}

// ============================================================================
// PROMPT SELECTOR
// ============================================================================

/**
 * Get the appropriate prompt for a content type and section
 */
export function getPromptForSection(
	contentType: EditorialPageType,
	sectionIndex: number,
	ctx: PromptContext
): string {
	// This is a simplified selector - in practice, you'd map section indices
	// to specific section types based on the content structure
	return getSectionPrompt({
		...ctx,
		sectionName: ctx.sectionName || `Section ${sectionIndex + 1}`,
	});
}
