// Editorial Content Generator API
// Main orchestration for generating editorial content pages

import { LocalKnowledgeOutput } from '@/types/localKnowledge';
import { SitePlannerOutput, PageBrief } from '@/types/sitePlanner';
import { CategoryAnalysisResult } from '@/types/nodes';
import {
	EditorialPageType,
	QualityLevel,
	GeneratedEditorialContent,
	GeneratedContentPage,
	EditorialGenerationProgress,
	createEmptyEditorialContent,
} from '@/types/editorialContent';
import {
	generateContentPage,
	mapPageTypeToEditorialType,
} from './generator';

// ============================================================================
// TYPES
// ============================================================================

export interface EditorialGeneratorConfig {
	contentTypes: EditorialPageType[];
	qualityLevel: QualityLevel;
	modelKey?: string; // e.g. 'claude-haiku', 'claude-sonnet', 'claude-opus'
}

export interface GenerationOptions {
	onProgress?: (progress: EditorialGenerationProgress) => void;
	abortSignal?: { current: boolean };
}

// ============================================================================
// PAGE FILTERING
// ============================================================================

/**
 * Filter pages from blueprint that match selected content types
 */
function filterPagesForGeneration(
	blueprint: SitePlannerOutput,
	contentTypes: EditorialPageType[]
): Array<{ brief: PageBrief; editorialType: EditorialPageType }> {
	const result: Array<{ brief: PageBrief; editorialType: EditorialPageType }> =
		[];

	for (const page of blueprint.pages) {
		const editorialType = mapPageTypeToEditorialType(page.type);

		if (editorialType && contentTypes.includes(editorialType)) {
			result.push({ brief: page, editorialType });
		}
	}

	return result;
}

/**
 * Check if we have the required inputs for generation
 */
export function hasRequiredInputs(
	blueprint: SitePlannerOutput | null,
	localKnowledge: LocalKnowledgeOutput | null
): { valid: boolean; missing: string[] } {
	const missing: string[] = [];

	if (!blueprint) {
		missing.push('Site Blueprint');
	} else if (!blueprint.pages || blueprint.pages.length === 0) {
		missing.push('Site Blueprint pages');
	}

	if (!localKnowledge) {
		missing.push('Local Knowledge');
	}

	return {
		valid: missing.length === 0,
		missing,
	};
}

// ============================================================================
// MAIN GENERATION FUNCTION
// ============================================================================

/**
 * Generate all editorial content based on selected content types
 */
export async function generateAllEditorialContent(
	blueprint: SitePlannerOutput,
	localKnowledge: LocalKnowledgeOutput,
	_serpData: CategoryAnalysisResult | null, // Reserved for future use
	config: EditorialGeneratorConfig,
	options?: GenerationOptions
): Promise<GeneratedEditorialContent> {
	const { onProgress, abortSignal } = options || {};

	// Validate inputs
	const validation = hasRequiredInputs(blueprint, localKnowledge);
	if (!validation.valid) {
		throw new Error(`Missing required inputs: ${validation.missing.join(', ')}`);
	}

	// Filter pages to generate
	const pagesToGenerate = filterPagesForGeneration(
		blueprint,
		config.contentTypes
	);

	if (pagesToGenerate.length === 0) {
		console.warn('No pages match selected content types');
		return createEmptyEditorialContent();
	}

	// Initialize progress
	const progress: EditorialGenerationProgress = {
		currentPage: null,
		currentIndex: 0,
		totalCount: pagesToGenerate.length,
		phase: 'preparing',
		completedPages: 0,
		currentSection: null,
	};

	onProgress?.(progress);

	// Generate pages
	const generatedPages: GeneratedContentPage[] = [];
	let totalWordCount = 0;
	const allLocalReferences: string[] = [];

	for (let i = 0; i < pagesToGenerate.length; i++) {
		// Check for abort
		if (abortSignal?.current) {
			break;
		}

		const { brief, editorialType } = pagesToGenerate[i];

		// Update progress
		progress.currentPage = brief.id;
		progress.currentIndex = i;
		progress.phase = 'generating';
		onProgress?.(progress);

		try {
			// Generate the page
			const generatedPage = await generateContentPage(
				brief,
				editorialType,
				blueprint,
				localKnowledge,
				config.qualityLevel,
				{
					onProgress: (section) => {
						progress.currentSection = section;
						onProgress?.(progress);
					},
					abortSignal,
					modelKey: config.modelKey,
				}
			);

			// Check for abort after generation
			if (abortSignal?.current) {
				break;
			}

			// Inject local knowledge phase
			progress.phase = 'injecting-local';
			progress.currentSection = 'Injecting local references...';
			onProgress?.(progress);

			// Add to results
			generatedPages.push(generatedPage);
			totalWordCount += generatedPage.wordCount;
			allLocalReferences.push(...generatedPage.localReferences);

			// Update completed count
			progress.completedPages = generatedPages.length;
		} catch (error) {
			console.error(`Error generating page ${brief.id}:`, error);
			// Continue with other pages - don't fail the entire batch
		}
	}

	// Validation phase
	if (!abortSignal?.current) {
		progress.phase = 'validating';
		progress.currentSection = 'Validating content...';
		onProgress?.(progress);
	}

	// Final progress update
	progress.phase = 'complete';
	progress.currentPage = null;
	progress.currentSection = null;
	onProgress?.(progress);

	// Deduplicate local references
	const uniqueLocalReferences = [...new Set(allLocalReferences)];

	return {
		pages: generatedPages,
		totalWordCount,
		totalLocalReferences: uniqueLocalReferences.length,
		generatedAt: new Date().toISOString(),
	};
}

// ============================================================================
// ESTIMATION HELPERS
// ============================================================================

/**
 * Estimate how many pages will be generated based on config
 */
export function estimatePageCount(
	blueprint: SitePlannerOutput | null,
	contentTypes: EditorialPageType[]
): number {
	if (!blueprint) return 0;

	const pagesToGenerate = filterPagesForGeneration(blueprint, contentTypes);
	return pagesToGenerate.length;
}

/**
 * Estimate total word count based on config
 */
export function estimateWordCount(
	blueprint: SitePlannerOutput | null,
	contentTypes: EditorialPageType[],
	qualityLevel: QualityLevel
): number {
	if (!blueprint) return 0;

	const pagesToGenerate = filterPagesForGeneration(blueprint, contentTypes);

	let total = 0;
	for (const { editorialType } of pagesToGenerate) {
		// Use target word counts from structures
		const baseWords =
			qualityLevel === 'polished'
				? {
						service_page: 1600,
						city_service_page: 1300,
						cost_guide: 1400,
						troubleshooting: 1000,
						buying_guide: 2000,
						diy_guide: 1250,
						local_expertise: 1000,
						about: 800,
						methodology: 1000,
					}
				: {
						service_page: 1200,
						city_service_page: 1000,
						cost_guide: 1000,
						troubleshooting: 800,
						buying_guide: 1500,
						diy_guide: 1000,
						local_expertise: 800,
						about: 600,
						methodology: 800,
					};

		total += baseWords[editorialType] || 1000;
	}

	return total;
}

// ============================================================================
// SUPABASE CHECK
// ============================================================================

/**
 * Check if Supabase is configured (for edge function support)
 */
export function hasSupabase(): boolean {
	// Check if we have Supabase URL and key in storage
	try {
		const url = localStorage.getItem('supabase-project-url');
		const key = localStorage.getItem('supabase-anon-key');
		return !!(url && key);
	} catch {
		return false;
	}
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
	generateContentPage,
	mapPageTypeToEditorialType,
} from './generator';

export {
	getContentTypeStructure,
	getSectionTemplates,
	getTargetWordCount,
	getContentTypeGroup,
} from './structures';

export {
	injectLocalKnowledge,
	extractLocalReferences,
	validateLocalReferences,
} from './localInjector';

export { getAuthorForContentType, getAuthorById } from '@/data/authorPersonas';
