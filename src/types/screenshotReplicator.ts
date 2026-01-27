/**
 * Screenshot Replicator Types
 * Defines types for analyzing screenshots and replicating them as React/Tailwind code
 */

import { DesignSystem, ColorPalette, Typography, Spacing, VisualEffects } from './brandDesign';
import { GeneratedFile, GeneratedImage } from './codeGeneration';

// ============================================================================
// ANALYSIS PHASES
// ============================================================================

export type ReplicatorPhase =
	| 'idle'
	| 'analyzing'
	| 'generating-assets'
	| 'generating-code'
	| 'assembling'
	| 'complete';

export type AnalysisPass =
	| 'structure'
	| 'text'
	| 'assets'
	| 'tokens'
	| 'layout'
	| 'forms';

// ============================================================================
// DISCOVERED SECTION
// ============================================================================

export interface MultiColumnInfo {
	/** Whether this section has multiple side-by-side content areas */
	isMultiColumn: boolean;
	/** Column definitions */
	columns?: Array<{
		name: string;
		width: string;
		contentType: string;
	}>;
	/** How the layout responds on mobile */
	responsiveBehavior?: 'stack-on-mobile' | 'side-by-side-always' | 'cards-grid';
}

export interface NestedLayout {
	/** Parent container this layout is nested in */
	parentElement: string;
	/** Layout type */
	type: 'grid' | 'flex' | 'stack';
	/** Number of columns for grid layouts */
	columns?: number;
	/** Description of the nested layout */
	description?: string;
}

export interface SectionLayout {
	/** Layout type */
	type: 'flex' | 'grid' | 'stack' | 'absolute';
	/** Flex/grid direction */
	direction?: 'row' | 'column';
	/** Number of columns for grid layouts */
	columns?: number;
	/** Alignment (e.g., "center", "start", "between") */
	alignment?: string;
	/** Justify content */
	justify?: string;
	/** Background color or gradient */
	background?: string;
	/** Has background image */
	hasBackgroundImage?: boolean;
	/** Padding values (Tailwind classes) */
	padding?: string;
	/** Gap between items */
	gap?: string;
	/** Max width constraint */
	maxWidth?: string;
	/** Multi-column layout info (side-by-side content areas) */
	multiColumn?: MultiColumnInfo;
	/** Nested layout structures within this section */
	nestedLayouts?: NestedLayout[];
}

export interface SectionText {
	/** H1, H2, H3 headings */
	headings: string[];
	/** Paragraph text */
	paragraphs: string[];
	/** Button labels */
	buttons: string[];
	/** Link text */
	links: string[];
	/** List items (array of arrays for multiple lists) */
	lists: string[][];
	/** Other text (captions, labels, etc.) */
	other: string[];
}

export interface DiscoveredSection {
	/** Order from top (0, 1, 2...) */
	index: number;
	/** Descriptive name from analysis (e.g., "Hero", "Features Grid") */
	name: string;
	/** Sanitized component name for React (e.g., "Section0_Hero") */
	componentName: string;
	/** Layout information */
	layout: SectionLayout;
	/** Extracted text organized by type */
	text: SectionText;
	/** IDs of visual assets contained in this section */
	assetIds: string[];
	/** Estimated height in viewport percentage */
	estimatedHeight?: string;
}

// ============================================================================
// DISCOVERED ASSET
// ============================================================================

export type AssetType = 'photo' | 'icon' | 'graphic' | 'pattern' | 'avatar' | 'logo';

export interface DiscoveredAsset {
	/** Unique ID (e.g., "section-2-card-1-photo") */
	id: string;
	/** Type of asset */
	type: AssetType;
	/** What role this asset plays (e.g., "Hero background", "Step 1 icon") */
	purpose: string;
	/** Which section contains this asset (0-indexed) */
	sectionIndex: number;
	/** Position within the section (e.g., "background", "left-column", "card-1") */
	position: string;
	/** Aspect ratio (e.g., "16:9", "1:1", "4:3") */
	aspectRatio: string;
	/** Description of what the asset shows */
	description: string;
	/** Detailed prompt to recreate this asset with AI image generation */
	generationPrompt: string;
	/** Whether to skip generation (for logos or when using icon library) */
	skipGeneration?: boolean;
	/** Lucide icon name to use as fallback for simple icons */
	fallbackIcon?: string;
	/** Estimated width in pixels */
	estimatedWidth?: number;
	/** Estimated height in pixels */
	estimatedHeight?: number;
}

// ============================================================================
// DESIGN TOKENS (simplified for replication)
// ============================================================================

export interface ReplicatorDesignTokens {
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
}

// ============================================================================
// FORM ELEMENTS & INTERACTIVE COMPONENTS
// ============================================================================

export interface FormElementInput {
	/** Input type */
	type: 'input' | 'textarea' | 'select' | 'checkbox' | 'radio';
	/** Placeholder text if visible */
	placeholder?: string;
	/** Associated label if any */
	label?: string;
	/** Position relative to other elements */
	position: string;
}

export interface FormElement {
	/** Section index containing this form */
	sectionIndex: number;
	/** Type of form */
	type: 'search' | 'contact' | 'newsletter' | 'login' | 'quote-request';
	/** Form input elements */
	elements: FormElementInput[];
	/** Submit button label */
	submitButton?: string;
	/** Form layout style */
	layout: 'inline' | 'stacked' | 'grid';
	/** Additional notes */
	notes?: string;
}

export interface DecorativeElement {
	/** Section index containing this element */
	sectionIndex: number;
	/** Type of decorative element */
	type: 'connector-line' | 'divider' | 'separator' | 'decorative-shape' | 'progress-indicator';
	/** Description of the element */
	description: string;
	/** Position in the section */
	position: string;
	/** Styling info */
	styling?: string;
}

export interface Badge {
	/** Section index containing this badge */
	sectionIndex: number;
	/** Badge text exactly as shown */
	text: string;
	/** Background color (hex) */
	backgroundColor: string;
	/** Text color (hex) */
	textColor: string;
	/** Position in the section */
	position: string;
	/** Badge style */
	style?: 'rounded' | 'pill' | 'square';
}

export interface Rating {
	/** Section index containing this rating */
	sectionIndex: number;
	/** Star rating value */
	stars: number;
	/** Maximum stars */
	maxStars?: number;
	/** Review count text */
	reviewCount?: string;
	/** Display format */
	displayFormat?: 'stars-with-number' | 'stars-only' | 'number-only';
	/** Position in the section */
	position: string;
}

export interface IconGroup {
	/** Section index containing this icon group */
	sectionIndex: number;
	/** Number of icons in the group */
	count: number;
	/** Whether icons have connectors between them */
	hasConnectors: boolean;
	/** Type of connector */
	connectorType?: 'horizontal-line' | 'dashed-line' | 'arrow' | 'none';
	/** Layout of the icon group */
	layout: 'horizontal' | 'vertical' | 'grid';
	/** Description of what the icons represent */
	description?: string;
}

export interface FormElementsAnalysis {
	/** Discovered forms */
	forms: FormElement[];
	/** Decorative elements */
	decorativeElements: DecorativeElement[];
	/** Badges */
	badges: Badge[];
	/** Ratings */
	ratings: Rating[];
	/** Icon groups */
	iconGroups: IconGroup[];
}

// ============================================================================
// SCREENSHOT ANALYSIS RESULT
// ============================================================================

export interface ScreenshotAnalysis {
	/** Discovered sections (variable count, dynamic names) */
	sections: DiscoveredSection[];
	/** All visual assets found in the screenshot */
	assets: DiscoveredAsset[];
	/** Extracted design tokens */
	designTokens: ReplicatorDesignTokens;
	/** Form elements and interactive components */
	formElements?: FormElementsAnalysis;
	/** Analysis metadata */
	meta: AnalysisMeta;
}

export interface AnalysisMeta {
	/** Total number of sections discovered */
	totalSections: number;
	/** Total number of assets identified */
	totalAssets: number;
	/** Total word count from OCR */
	totalWords: number;
	/** Confidence score (0-100) */
	analysisConfidence: number;
	/** Timestamp of analysis */
	analyzedAt: number;
	/** Which passes were completed */
	passesCompleted: AnalysisPass[];
	/** Any warnings from analysis */
	warnings?: string[];
}

// ============================================================================
// ASSET MANIFEST
// ============================================================================

/**
 * Asset manifest entry - single source of truth for asset paths and types
 */
export interface AssetManifestEntry {
	/** Path to the asset file (empty for fallback types) */
	path: string;
	/** How the asset should be rendered */
	type: 'generated' | 'fallback-icon' | 'fallback-text' | 'missing';
	/** Lucide icon name for fallback-icon type */
	fallbackIcon?: string;
	/** Base64 data URL for generated assets */
	dataUrl?: string;
}

/**
 * Asset manifest - maps asset IDs to their paths and types
 * Used for consistent path references across code generation and deployment
 */
export interface AssetManifest {
	[assetId: string]: AssetManifestEntry;
}

// ============================================================================
// GENERATED ASSET
// ============================================================================

export interface GeneratedAsset {
	/** Original asset ID */
	assetId: string;
	/** File path in output (e.g., "images/section-0-hero-bg.webp") */
	path: string;
	/** Base64 data URL */
	dataUrl: string;
	/** MIME type */
	mimeType: string;
	/** Whether generation was successful */
	success: boolean;
	/** Error message if failed */
	error?: string;
}

// ============================================================================
// REPLICATOR OUTPUT
// ============================================================================

export interface ReplicatorOutput {
	/** Generated React component files */
	files: GeneratedFile[];
	/** Generated visual assets */
	images: GeneratedAsset[];
	/** Full analysis for reference */
	analysis: ScreenshotAnalysis;
	/** Output metadata */
	metadata: ReplicatorMetadata;
}

export interface ReplicatorMetadata {
	/** Timestamp of generation */
	generatedAt: number;
	/** Number of sections replicated */
	sectionsReplicated: number;
	/** Number of assets generated */
	assetsGenerated: number;
	/** Total bytes of output */
	totalBytes: number;
	/** Total number of files */
	totalFiles: number;
}

// ============================================================================
// PROGRESS TRACKING
// ============================================================================

export interface ReplicatorProgress {
	/** Current phase */
	phase: ReplicatorPhase;
	/** Current analysis pass (when phase is 'analyzing') */
	currentPass?: AnalysisPass;
	/** Number of analysis passes completed */
	passesComplete: number;
	/** Total analysis passes */
	totalPasses: number;
	/** Current asset being generated (when phase is 'generating-assets') */
	currentAsset?: string;
	/** Number of assets generated */
	assetsGenerated: number;
	/** Total assets to generate */
	totalAssets: number;
	/** Current section being generated (when phase is 'generating-code') */
	currentSection?: string;
	/** Number of sections generated */
	sectionsGenerated: number;
	/** Total sections */
	totalSections: number;
	/** Current file being generated */
	currentFile?: string;
	/** Total files generated */
	filesGenerated: number;
	/** Total bytes generated */
	bytesGenerated: number;
	/** Error message if any */
	error?: string;
	/** Partial results - analysis (available after analysis phase) */
	partialAnalysis?: ScreenshotAnalysis;
	/** Partial results - generated assets (available after asset phase) */
	partialAssets?: GeneratedAsset[];
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create initial progress state
 */
export function createInitialReplicatorProgress(): ReplicatorProgress {
	return {
		phase: 'idle',
		passesComplete: 0,
		totalPasses: 6,
		assetsGenerated: 0,
		totalAssets: 0,
		sectionsGenerated: 0,
		totalSections: 0,
		filesGenerated: 0,
		bytesGenerated: 0,
	};
}

/**
 * Create empty analysis result
 */
export function createEmptyAnalysis(): ScreenshotAnalysis {
	return {
		sections: [],
		assets: [],
		designTokens: {
			colors: {
				primary: '#3B82F6',
				background: '#FFFFFF',
				text: '#1F2937',
			},
			typography: {
				headingFont: 'Inter, sans-serif',
				bodyFont: 'Inter, sans-serif',
				h1Size: '3rem',
				h2Size: '2rem',
				h3Size: '1.5rem',
				bodySize: '1rem',
				smallSize: '0.875rem',
			},
			spacing: {
				sectionPadding: 'py-16 px-4',
				contentMaxWidth: 'max-w-7xl',
				gap: 'gap-8',
			},
			effects: {
				borderRadius: 'rounded-lg',
			},
		},
		meta: {
			totalSections: 0,
			totalAssets: 0,
			totalWords: 0,
			analysisConfidence: 0,
			analyzedAt: Date.now(),
			passesCompleted: [],
		},
	};
}

/**
 * Create empty replicator output
 */
export function createEmptyReplicatorOutput(): ReplicatorOutput {
	return {
		files: [],
		images: [],
		analysis: createEmptyAnalysis(),
		metadata: {
			generatedAt: Date.now(),
			sectionsReplicated: 0,
			assetsGenerated: 0,
			totalBytes: 0,
			totalFiles: 0,
		},
	};
}

/**
 * Sanitize section name to valid React component name
 */
export function sanitizeComponentName(name: string, index: number): string {
	// Remove special characters and convert to PascalCase
	const cleaned = name
		.replace(/[^a-zA-Z0-9\s]/g, '')
		.split(/\s+/)
		.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join('');
	
	return `Section${index}_${cleaned || 'Unknown'}`;
}

/**
 * Get phase display label
 */
export function getReplicatorPhaseLabel(phase: ReplicatorPhase): string {
	const labels: Record<ReplicatorPhase, string> = {
		idle: 'Ready',
		analyzing: 'Analyzing Screenshot',
		'generating-assets': 'Generating Assets',
		'generating-code': 'Generating Code',
		assembling: 'Assembling Output',
		complete: 'Complete',
	};
	return labels[phase];
}

/**
 * Get analysis pass display label
 */
export function getAnalysisPassLabel(pass: AnalysisPass): string {
	const labels: Record<AnalysisPass, string> = {
		structure: 'Page Structure',
		text: 'Text Content (OCR)',
		assets: 'Visual Assets',
		tokens: 'Design Tokens',
		layout: 'Section Layouts',
		forms: 'Form Elements',
	};
	return labels[pass];
}

/**
 * Calculate progress percentage
 */
export function calculateReplicatorProgress(progress: ReplicatorProgress): number {
	const { phase, passesComplete, totalPasses, assetsGenerated, totalAssets, sectionsGenerated, totalSections } = progress;
	
	switch (phase) {
		case 'idle':
			return 0;
		case 'analyzing':
			// Analysis is 0-30%
			return Math.round((passesComplete / totalPasses) * 30);
		case 'generating-assets':
			// Asset generation is 30-60%
			const assetProgress = totalAssets > 0 ? assetsGenerated / totalAssets : 0;
			return 30 + Math.round(assetProgress * 30);
		case 'generating-code':
			// Code generation is 60-90%
			const codeProgress = totalSections > 0 ? sectionsGenerated / totalSections : 0;
			return 60 + Math.round(codeProgress * 30);
		case 'assembling':
			return 95;
		case 'complete':
			return 100;
		default:
			return 0;
	}
}

/**
 * Map aspect ratio string to Gemini-supported ratio
 */
export function mapToGeminiAspectRatio(aspectRatio: string): string {
	const supportedRatios = ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3', '5:4', '4:5', '21:9'];
	
	if (supportedRatios.includes(aspectRatio)) {
		return aspectRatio;
	}
	
	// Parse the ratio and find the closest supported one
	const [w, h] = aspectRatio.split(':').map(Number);
	if (isNaN(w) || isNaN(h)) {
		return '16:9'; // Default fallback
	}
	
	const targetRatio = w / h;
	let closest = '16:9';
	let minDiff = Infinity;
	
	for (const ratio of supportedRatios) {
		const [rw, rh] = ratio.split(':').map(Number);
		const diff = Math.abs(rw / rh - targetRatio);
		if (diff < minDiff) {
			minDiff = diff;
			closest = ratio;
		}
	}
	
	return closest;
}
