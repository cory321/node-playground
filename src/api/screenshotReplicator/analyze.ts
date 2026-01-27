/**
 * Screenshot Replicator Analysis
 * Multi-pass Claude Vision analysis for screenshot replication
 */

import { callClaudeWithVision } from '../llm/anthropic';
import {
	PAGE_STRUCTURE_PROMPT,
	TEXT_EXTRACTION_PROMPT,
	ASSET_INVENTORY_PROMPT,
	DESIGN_TOKENS_PROMPT,
	SECTION_LAYOUT_PROMPT,
	FORM_ELEMENTS_PROMPT,
} from './prompts';
import {
	ScreenshotAnalysis,
	DiscoveredSection,
	DiscoveredAsset,
	ReplicatorDesignTokens,
	AnalysisMeta,
	AnalysisPass,
	SectionLayout,
	SectionText,
	FormElementsAnalysis,
	FormElement,
	DecorativeElement,
	Badge,
	Rating,
	IconGroup,
	sanitizeComponentName,
} from '@/types/screenshotReplicator';

// Model to use for vision analysis
const VISION_MODEL = 'claude-sonnet-4-5-20250929';

// ============================================================================
// PASS RESULT TYPES
// ============================================================================

interface StructurePassResult {
	sections: Array<{
		index: number;
		name: string;
		estimatedHeight: string;
	}>;
	totalSections: number;
	pageType: string;
	hasNavigation: boolean;
	hasFooter: boolean;
}

interface TextPassResult {
	sections: Array<{
		index: number;
		name: string;
		text: {
			headings: string[];
			paragraphs: string[];
			buttons: string[];
			links: string[];
			lists: string[][];
			other: string[];
		};
	}>;
	totalWords: number;
}

interface AssetPassResult {
	assets: Array<{
		id: string;
		type: 'photo' | 'icon' | 'graphic' | 'pattern' | 'avatar' | 'logo';
		purpose: string;
		sectionIndex: number;
		position: string;
		aspectRatio: string;
		description: string;
		generationPrompt: string;
		skipGeneration?: boolean;
		fallbackIcon?: string;
	}>;
	totalAssets: number;
	assetBreakdown: Record<string, number>;
}

interface TokensPassResult {
	colors: {
		primary: string;
		secondary?: string;
		accent?: string;
		background: string;
		backgroundAlt?: string;
		text: string;
		textMuted?: string;
		textInverse?: string;
	};
	typography: {
		headingFont: string;
		bodyFont: string;
		h1Size: string;
		h2Size: string;
		h3Size: string;
		bodySize: string;
		smallSize: string;
	};
	spacing: {
		sectionPadding: string;
		contentMaxWidth: string;
		gap: string;
	};
	effects: {
		borderRadius: string;
		shadow?: string;
		buttonRadius?: string;
	};
	buttons?: {
		primary?: {
			background: string;
			text: string;
			padding: string;
			borderRadius: string;
		};
		secondary?: {
			background: string;
			text: string;
			border?: string;
			padding: string;
			borderRadius: string;
		};
	};
}

interface LayoutPassResult {
	sections: Array<{
		index: number;
		name: string;
		layout: {
			type: 'flex' | 'grid' | 'stack' | 'absolute';
			direction?: 'row' | 'column';
			columns?: number;
			alignment?: string;
			justify?: string;
			background?: string;
			hasBackgroundImage?: boolean;
			padding?: string;
			gap?: string;
			maxWidth?: string;
		};
		multiColumn?: {
			isMultiColumn: boolean;
			columns?: Array<{
				name: string;
				width: string;
				contentType: string;
			}>;
			responsiveBehavior?: 'stack-on-mobile' | 'side-by-side-always' | 'cards-grid';
		};
		nestedLayouts?: Array<{
			parentElement: string;
			type: 'grid' | 'flex' | 'stack';
			columns?: number;
			description?: string;
		}>;
		childElements?: Array<{
			type: string;
			count: number;
			notes?: string;
		}>;
	}>;
}

interface FormsPassResult {
	forms: Array<{
		sectionIndex: number;
		type: 'search' | 'contact' | 'newsletter' | 'login' | 'quote-request';
		elements: Array<{
			type: 'input' | 'textarea' | 'select' | 'checkbox' | 'radio';
			placeholder?: string;
			label?: string;
			position: string;
		}>;
		submitButton?: string;
		layout: 'inline' | 'stacked' | 'grid';
		notes?: string;
	}>;
	decorativeElements: Array<{
		sectionIndex: number;
		type: 'connector-line' | 'divider' | 'separator' | 'decorative-shape' | 'progress-indicator';
		description: string;
		position: string;
		styling?: string;
	}>;
	badges: Array<{
		sectionIndex: number;
		text: string;
		backgroundColor: string;
		textColor: string;
		position: string;
		style?: 'rounded' | 'pill' | 'square';
	}>;
	ratings: Array<{
		sectionIndex: number;
		stars: number;
		maxStars?: number;
		reviewCount?: string;
		displayFormat?: 'stars-with-number' | 'stars-only' | 'number-only';
		position: string;
	}>;
	iconGroups: Array<{
		sectionIndex: number;
		count: number;
		hasConnectors: boolean;
		connectorType?: 'horizontal-line' | 'dashed-line' | 'arrow' | 'none';
		layout: 'horizontal' | 'vertical' | 'grid';
		description?: string;
	}>;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Parse JSON from Claude response, handling markdown code blocks
 */
function parseJsonResponse<T>(response: string): T {
	// Try to extract JSON from markdown code block
	const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
	const jsonString = jsonMatch ? jsonMatch[1].trim() : response.trim();
	
	try {
		return JSON.parse(jsonString);
	} catch (error) {
		// Try to find JSON object in the response
		const objectMatch = jsonString.match(/\{[\s\S]*\}/);
		if (objectMatch) {
			return JSON.parse(objectMatch[0]);
		}
		throw new Error(`Failed to parse JSON response: ${error}`);
	}
}

/**
 * Count total words in extracted text
 */
function countWords(textData: SectionText): number {
	const allText = [
		...textData.headings,
		...textData.paragraphs,
		...textData.buttons,
		...textData.links,
		...textData.lists.flat(),
		...textData.other,
	].join(' ');
	
	return allText.split(/\s+/).filter(Boolean).length;
}

// ============================================================================
// INDIVIDUAL PASS FUNCTIONS
// ============================================================================

/**
 * Pass 1: Page Structure Analysis
 */
async function runStructurePass(imageUrl: string): Promise<StructurePassResult> {
	const response = await callClaudeWithVision(
		PAGE_STRUCTURE_PROMPT,
		imageUrl,
		VISION_MODEL,
		4096
	);
	
	return parseJsonResponse<StructurePassResult>(response);
}

/**
 * Pass 2: Text Extraction (OCR)
 */
async function runTextPass(imageUrl: string): Promise<TextPassResult> {
	const response = await callClaudeWithVision(
		TEXT_EXTRACTION_PROMPT,
		imageUrl,
		VISION_MODEL,
		16384 // Larger token limit for text extraction
	);
	
	return parseJsonResponse<TextPassResult>(response);
}

/**
 * Pass 3: Asset Inventory
 */
async function runAssetPass(imageUrl: string): Promise<AssetPassResult> {
	const response = await callClaudeWithVision(
		ASSET_INVENTORY_PROMPT,
		imageUrl,
		VISION_MODEL,
		8192
	);
	
	return parseJsonResponse<AssetPassResult>(response);
}

/**
 * Pass 4: Design Tokens
 */
async function runTokensPass(imageUrl: string): Promise<TokensPassResult> {
	const response = await callClaudeWithVision(
		DESIGN_TOKENS_PROMPT,
		imageUrl,
		VISION_MODEL,
		4096
	);
	
	return parseJsonResponse<TokensPassResult>(response);
}

/**
 * Pass 5: Section Layouts
 */
async function runLayoutPass(imageUrl: string): Promise<LayoutPassResult> {
	const response = await callClaudeWithVision(
		SECTION_LAYOUT_PROMPT,
		imageUrl,
		VISION_MODEL,
		8192
	);
	
	return parseJsonResponse<LayoutPassResult>(response);
}

/**
 * Pass 6: Form Elements & Interactive Components
 */
async function runFormsPass(imageUrl: string): Promise<FormsPassResult> {
	const response = await callClaudeWithVision(
		FORM_ELEMENTS_PROMPT,
		imageUrl,
		VISION_MODEL,
		8192
	);
	
	return parseJsonResponse<FormsPassResult>(response);
}

// ============================================================================
// MERGING FUNCTIONS
// ============================================================================

/**
 * Merge all pass results into a unified ScreenshotAnalysis
 */
function mergePassResults(
	structureResult: StructurePassResult,
	textResult: TextPassResult,
	assetResult: AssetPassResult,
	tokensResult: TokensPassResult,
	layoutResult: LayoutPassResult,
	formsResult: FormsPassResult
): ScreenshotAnalysis {
	// Build sections by merging structure, text, and layout data
	const sections: DiscoveredSection[] = structureResult.sections.map((structSection) => {
		// Find matching text data
		const textSection = textResult.sections.find(t => t.index === structSection.index);
		// Find matching layout data
		const layoutSection = layoutResult.sections.find(l => l.index === structSection.index);
		// Find assets belonging to this section
		const sectionAssetIds = assetResult.assets
			.filter(a => a.sectionIndex === structSection.index)
			.map(a => a.id);
		
		const text: SectionText = textSection?.text || {
			headings: [],
			paragraphs: [],
			buttons: [],
			links: [],
			lists: [],
			other: [],
		};
		
		const layout: SectionLayout = {
			...(layoutSection?.layout || { type: 'stack' }),
			// Include multi-column and nested layout info
			multiColumn: layoutSection?.multiColumn,
			nestedLayouts: layoutSection?.nestedLayouts,
		};
		
		return {
			index: structSection.index,
			name: structSection.name,
			componentName: sanitizeComponentName(structSection.name, structSection.index),
			layout,
			text,
			assetIds: sectionAssetIds, // Always use computed IDs from Asset Pass sectionIndex
			estimatedHeight: structSection.estimatedHeight,
		};
	});
	
	// Build assets array
	const assets: DiscoveredAsset[] = assetResult.assets.map(asset => ({
		id: asset.id,
		type: asset.type,
		purpose: asset.purpose,
		sectionIndex: asset.sectionIndex,
		position: asset.position,
		aspectRatio: asset.aspectRatio || '16:9',
		description: asset.description,
		generationPrompt: asset.generationPrompt,
		skipGeneration: asset.skipGeneration || asset.type === 'logo',
		fallbackIcon: asset.fallbackIcon,
	}));
	
	// Build design tokens
	const designTokens: ReplicatorDesignTokens = {
		colors: {
			primary: tokensResult.colors.primary,
			secondary: tokensResult.colors.secondary,
			accent: tokensResult.colors.accent,
			background: tokensResult.colors.background,
			backgroundAlt: tokensResult.colors.backgroundAlt,
			text: tokensResult.colors.text,
			textMuted: tokensResult.colors.textMuted,
			textInverse: tokensResult.colors.textInverse,
		},
		typography: {
			headingFont: tokensResult.typography.headingFont,
			bodyFont: tokensResult.typography.bodyFont,
			h1Size: tokensResult.typography.h1Size,
			h2Size: tokensResult.typography.h2Size,
			h3Size: tokensResult.typography.h3Size,
			bodySize: tokensResult.typography.bodySize,
			smallSize: tokensResult.typography.smallSize,
		},
		spacing: {
			sectionPadding: tokensResult.spacing.sectionPadding,
			contentMaxWidth: tokensResult.spacing.contentMaxWidth,
			gap: tokensResult.spacing.gap,
		},
		effects: {
			borderRadius: tokensResult.effects.borderRadius,
			shadow: tokensResult.effects.shadow,
			buttonRadius: tokensResult.effects.buttonRadius,
		},
	};
	
	// Calculate total words
	const totalWords = sections.reduce((sum, section) => sum + countWords(section.text), 0);
	
	// Build form elements analysis
	const formElements: FormElementsAnalysis = {
		forms: formsResult.forms?.map(f => ({
			sectionIndex: f.sectionIndex,
			type: f.type,
			elements: f.elements,
			submitButton: f.submitButton,
			layout: f.layout,
			notes: f.notes,
		})) || [],
		decorativeElements: formsResult.decorativeElements?.map(d => ({
			sectionIndex: d.sectionIndex,
			type: d.type,
			description: d.description,
			position: d.position,
			styling: d.styling,
		})) || [],
		badges: formsResult.badges?.map(b => ({
			sectionIndex: b.sectionIndex,
			text: b.text,
			backgroundColor: b.backgroundColor,
			textColor: b.textColor,
			position: b.position,
			style: b.style,
		})) || [],
		ratings: formsResult.ratings?.map(r => ({
			sectionIndex: r.sectionIndex,
			stars: r.stars,
			maxStars: r.maxStars,
			reviewCount: r.reviewCount,
			displayFormat: r.displayFormat,
			position: r.position,
		})) || [],
		iconGroups: formsResult.iconGroups?.map(ig => ({
			sectionIndex: ig.sectionIndex,
			count: ig.count,
			hasConnectors: ig.hasConnectors,
			connectorType: ig.connectorType,
			layout: ig.layout,
			description: ig.description,
		})) || [],
	};
	
	// Build metadata
	const meta: AnalysisMeta = {
		totalSections: sections.length,
		totalAssets: assets.length,
		totalWords,
		analysisConfidence: calculateConfidence(structureResult, textResult, assetResult),
		analyzedAt: Date.now(),
		passesCompleted: ['structure', 'text', 'assets', 'tokens', 'layout', 'forms'],
	};
	
	return {
		sections,
		assets,
		designTokens,
		formElements,
		meta,
	};
}

/**
 * Calculate confidence score based on extraction quality
 */
function calculateConfidence(
	structureResult: StructurePassResult,
	textResult: TextPassResult,
	assetResult: AssetPassResult
): number {
	let score = 100;
	
	// Penalize if few sections found
	if (structureResult.totalSections < 3) {
		score -= 10;
	}
	
	// Penalize if no text extracted
	if (textResult.totalWords < 50) {
		score -= 20;
	}
	
	// Penalize if no assets found
	if (assetResult.totalAssets === 0) {
		score -= 15;
	}
	
	// Penalize if section count mismatch between passes
	if (structureResult.sections.length !== textResult.sections.length) {
		score -= 10;
	}
	
	return Math.max(0, Math.min(100, score));
}

// ============================================================================
// MAIN ANALYSIS FUNCTION
// ============================================================================

export interface AnalysisProgress {
	pass: AnalysisPass;
	passIndex: number;
	totalPasses: number;
}

export interface AnalyzeScreenshotOptions {
	onProgress?: (progress: AnalysisProgress) => void;
	abortSignal?: AbortSignal;
}

/**
 * Analyze a screenshot using 6-pass Claude Vision analysis
 */
export async function analyzeScreenshot(
	imageUrl: string,
	options: AnalyzeScreenshotOptions = {}
): Promise<ScreenshotAnalysis> {
	const { onProgress, abortSignal } = options;
	
	// Check for abort
	if (abortSignal?.aborted) {
		throw new Error('Analysis aborted');
	}
	
	// Pass 1: Structure
	onProgress?.({ pass: 'structure', passIndex: 0, totalPasses: 6 });
	const structureResult = await runStructurePass(imageUrl);
	
	if (abortSignal?.aborted) throw new Error('Analysis aborted');
	
	// Pass 2: Text
	onProgress?.({ pass: 'text', passIndex: 1, totalPasses: 6 });
	const textResult = await runTextPass(imageUrl);
	
	if (abortSignal?.aborted) throw new Error('Analysis aborted');
	
	// Pass 3: Assets
	onProgress?.({ pass: 'assets', passIndex: 2, totalPasses: 6 });
	const assetResult = await runAssetPass(imageUrl);
	
	if (abortSignal?.aborted) throw new Error('Analysis aborted');
	
	// Pass 4: Tokens
	onProgress?.({ pass: 'tokens', passIndex: 3, totalPasses: 6 });
	const tokensResult = await runTokensPass(imageUrl);
	
	if (abortSignal?.aborted) throw new Error('Analysis aborted');
	
	// Pass 5: Layout
	onProgress?.({ pass: 'layout', passIndex: 4, totalPasses: 6 });
	const layoutResult = await runLayoutPass(imageUrl);
	
	if (abortSignal?.aborted) throw new Error('Analysis aborted');
	
	// Pass 6: Forms & Interactive Elements
	onProgress?.({ pass: 'forms', passIndex: 5, totalPasses: 6 });
	const formsResult = await runFormsPass(imageUrl);
	
	// Merge all results
	const analysis = mergePassResults(
		structureResult,
		textResult,
		assetResult,
		tokensResult,
		layoutResult,
		formsResult
	);
	
	return analysis;
}

/**
 * Run a single analysis pass (for testing or partial analysis)
 */
export async function runSinglePass(
	imageUrl: string,
	pass: AnalysisPass
): Promise<unknown> {
	switch (pass) {
		case 'structure':
			return runStructurePass(imageUrl);
		case 'text':
			return runTextPass(imageUrl);
		case 'assets':
			return runAssetPass(imageUrl);
		case 'tokens':
			return runTokensPass(imageUrl);
		case 'layout':
			return runLayoutPass(imageUrl);
		case 'forms':
			return runFormsPass(imageUrl);
		default:
			throw new Error(`Unknown pass: ${pass}`);
	}
}
