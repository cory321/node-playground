// Local knowledge injection for editorial content
// Strategically injects local references into content to make it feel authentic

import { LocalKnowledgeOutput } from '@/types/localKnowledge';

// ============================================================================
// TYPES
// ============================================================================

export interface InjectionResult {
	content: string;
	references: string[];
}

export interface InjectionPoint {
	type: 'introduction' | 'local_section' | 'pricing' | 'faq' | 'general';
	targetCount: number;
}

// ============================================================================
// LOCAL HOOK SELECTORS
// ============================================================================

/**
 * Get available local hooks from LocalKnowledge, categorized by type
 */
export function getLocalHooks(localKnowledge: LocalKnowledgeOutput): {
	phrases: string[];
	neighborhoods: string[];
	climate: string[];
	issues: string[];
	market: string[];
	regional: string[];
} {
	const hooks = localKnowledge.contentHooks;
	const market = localKnowledge.marketContext;
	const identity = localKnowledge.regionalIdentity;

	return {
		phrases: hooks.localPhrases || [],
		neighborhoods: hooks.neighborhoodNames || [],
		climate: hooks.climateContext || [],
		issues: hooks.categorySpecificIssues || [],
		market: [
			market.pricePosition,
			market.competitionLevel,
			...(market.seasonalPatterns || []),
		].filter(Boolean),
		regional: [
			identity.region,
			identity.characterization,
			identity.nearbyReference,
		].filter(Boolean),
	};
}

/**
 * Select hooks appropriate for an injection point
 */
export function selectHooksForPoint(
	point: InjectionPoint,
	localKnowledge: LocalKnowledgeOutput,
	usedHooks: Set<string>
): string[] {
	const hooks = getLocalHooks(localKnowledge);
	const selected: string[] = [];

	// Different injection points prefer different types of hooks
	const priorities: Record<InjectionPoint['type'], (keyof typeof hooks)[]> = {
		introduction: ['regional', 'phrases', 'neighborhoods'],
		local_section: ['neighborhoods', 'climate', 'issues', 'phrases'],
		pricing: ['market', 'regional'],
		faq: ['issues', 'neighborhoods', 'climate'],
		general: ['phrases', 'neighborhoods', 'regional'],
	};

	const priorityOrder = priorities[point.type] || priorities.general;

	// Select hooks based on priority, avoiding duplicates
	for (const category of priorityOrder) {
		const available = hooks[category].filter((h) => !usedHooks.has(h));
		for (const hook of available) {
			if (selected.length >= point.targetCount) break;
			selected.push(hook);
		}
		if (selected.length >= point.targetCount) break;
	}

	return selected;
}

// ============================================================================
// INJECTION STRATEGIES
// ============================================================================

/**
 * Inject a local reference naturally into content
 * Returns the modified content with the reference woven in
 */
export function injectReference(
	content: string,
	reference: string,
	position: 'start' | 'middle' | 'end'
): string {
	const sentences = content.split(/(?<=[.!?])\s+/);

	if (sentences.length === 0) {
		return content;
	}

	// Different injection patterns based on reference type
	const injectionPatterns = [
		`In ${reference}, `,
		`For ${reference} homeowners, `,
		`Throughout ${reference}, `,
		`Here in ${reference}, `,
		`Residents of ${reference} know that `,
		`Given ${reference}'s `,
		`Due to ${reference}, `,
		`${reference} experiences `,
	];

	// Select a pattern that fits
	const pattern =
		injectionPatterns[Math.floor(Math.random() * injectionPatterns.length)];

	switch (position) {
		case 'start':
			// Prepend to first sentence with a connecting phrase
			if (sentences[0]) {
				sentences[0] = pattern + sentences[0].toLowerCase();
			}
			break;

		case 'middle':
			// Insert in the middle of the content
			const midIndex = Math.floor(sentences.length / 2);
			if (sentences[midIndex]) {
				sentences[midIndex] =
					pattern + sentences[midIndex].toLowerCase();
			}
			break;

		case 'end':
			// Add a concluding reference
			sentences.push(`This is particularly relevant for ${reference}.`);
			break;
	}

	return sentences.join(' ');
}

/**
 * Check if content already contains a reference
 */
export function contentContainsReference(
	content: string,
	reference: string
): boolean {
	const normalizedContent = content.toLowerCase();
	const normalizedRef = reference.toLowerCase();

	// Check for the reference or variations of it
	return (
		normalizedContent.includes(normalizedRef) ||
		normalizedContent.includes(normalizedRef.replace(/\s+/g, '-')) ||
		normalizedContent.includes(normalizedRef.replace(/-/g, ' '))
	);
}

// ============================================================================
// MAIN INJECTION FUNCTION
// ============================================================================

/**
 * Inject local knowledge into content strategically
 *
 * @param content - The content to inject references into
 * @param localKnowledge - LocalKnowledge output with hooks
 * @param targetCount - Target number of local references
 * @returns Modified content and list of references used
 */
export function injectLocalKnowledge(
	content: string,
	localKnowledge: LocalKnowledgeOutput,
	targetCount: number
): InjectionResult {
	if (targetCount <= 0 || !content) {
		return { content, references: [] };
	}

	const usedReferences: string[] = [];
	const usedHooksSet = new Set<string>();
	let modifiedContent = content;

	// Count existing local references in content
	const hooks = getLocalHooks(localKnowledge);
	const allHooks = [
		...hooks.phrases,
		...hooks.neighborhoods,
		...hooks.climate,
		...hooks.issues,
		...hooks.regional,
	];

	for (const hook of allHooks) {
		if (contentContainsReference(content, hook)) {
			usedReferences.push(hook);
			usedHooksSet.add(hook);
		}
	}

	// If we already have enough references, return as-is
	if (usedReferences.length >= targetCount) {
		return { content, references: usedReferences };
	}

	// Calculate how many more references we need
	const neededCount = targetCount - usedReferences.length;

	// Define injection points with distribution
	const injectionPoints: InjectionPoint[] = [];
	if (neededCount >= 1) {
		injectionPoints.push({ type: 'introduction', targetCount: 1 });
	}
	if (neededCount >= 2) {
		injectionPoints.push({ type: 'local_section', targetCount: 1 });
	}
	if (neededCount >= 3) {
		injectionPoints.push({ type: 'general', targetCount: neededCount - 2 });
	}

	// Split content into paragraphs for injection
	const paragraphs = modifiedContent.split(/\n\n+/);

	// Inject into different paragraphs
	let injectionIndex = 0;
	for (const point of injectionPoints) {
		const selectedHooks = selectHooksForPoint(
			point,
			localKnowledge,
			usedHooksSet
		);

		for (const hook of selectedHooks) {
			// Find a paragraph to inject into
			const paragraphIndex = Math.min(
				injectionIndex,
				paragraphs.length - 1
			);

			if (
				paragraphs[paragraphIndex] &&
				!contentContainsReference(paragraphs[paragraphIndex], hook)
			) {
				// Determine position based on paragraph index
				const position: 'start' | 'middle' | 'end' =
					paragraphIndex === 0
						? 'start'
						: paragraphIndex === paragraphs.length - 1
							? 'end'
							: 'middle';

				paragraphs[paragraphIndex] = injectReference(
					paragraphs[paragraphIndex],
					hook,
					position
				);

				usedReferences.push(hook);
				usedHooksSet.add(hook);
				injectionIndex++;
			}

			if (usedReferences.length >= targetCount) {
				break;
			}
		}

		if (usedReferences.length >= targetCount) {
			break;
		}
	}

	modifiedContent = paragraphs.join('\n\n');

	return {
		content: modifiedContent,
		references: usedReferences,
	};
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate that content meets local reference requirements
 */
export function validateLocalReferences(
	content: string,
	localKnowledge: LocalKnowledgeOutput,
	minimumRequired: number
): {
	valid: boolean;
	count: number;
	references: string[];
	missing: number;
} {
	const hooks = getLocalHooks(localKnowledge);
	const allHooks = [
		...hooks.phrases,
		...hooks.neighborhoods,
		...hooks.climate,
		...hooks.issues,
		...hooks.regional,
	];

	const foundReferences: string[] = [];

	for (const hook of allHooks) {
		if (contentContainsReference(content, hook)) {
			foundReferences.push(hook);
		}
	}

	// Deduplicate
	const uniqueReferences = [...new Set(foundReferences)];

	return {
		valid: uniqueReferences.length >= minimumRequired,
		count: uniqueReferences.length,
		references: uniqueReferences,
		missing: Math.max(0, minimumRequired - uniqueReferences.length),
	};
}

/**
 * Extract local references from content for tracking
 */
export function extractLocalReferences(
	content: string,
	localKnowledge: LocalKnowledgeOutput
): string[] {
	const hooks = getLocalHooks(localKnowledge);
	const allHooks = [
		...hooks.phrases,
		...hooks.neighborhoods,
		...hooks.climate,
		...hooks.issues,
		...hooks.market,
		...hooks.regional,
	];

	const found: string[] = [];

	for (const hook of allHooks) {
		if (contentContainsReference(content, hook)) {
			found.push(hook);
		}
	}

	return [...new Set(found)];
}
