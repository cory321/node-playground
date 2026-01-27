/**
 * Screenshot Replicator Service
 * Main orchestrator that combines analysis, asset generation, and code generation
 */

import { analyzeScreenshot, AnalysisProgress } from '@/api/screenshotReplicator';
import {
	generateAssets,
	createPlaceholderAssets,
	AssetGenerationProgress,
} from './assetGenerator';
import { generateCode, calculateCodeBytes, CodeGenerationProgress } from './codeGenerator';
import {
	ScreenshotAnalysis,
	ReplicatorOutput,
	ReplicatorProgress,
	ReplicatorPhase,
	GeneratedAsset,
	createEmptyReplicatorOutput,
	createInitialReplicatorProgress,
	getAnalysisPassLabel,
} from '@/types/screenshotReplicator';

// ============================================================================
// TYPES
// ============================================================================

export interface ReplicateScreenshotOptions {
	onProgress?: (progress: ReplicatorProgress) => void;
	abortSignal?: AbortSignal;
	/** Skip asset generation (for testing) */
	skipAssets?: boolean;
}

// ============================================================================
// MAIN ORCHESTRATOR
// ============================================================================

/**
 * Replicate a screenshot as React/Tailwind code
 * 
 * This is the main entry point that orchestrates:
 * 1. Multi-pass screenshot analysis
 * 2. Visual asset generation
 * 3. Code generation
 */
export async function replicateScreenshot(
	imageUrl: string,
	options: ReplicateScreenshotOptions = {}
): Promise<ReplicatorOutput> {
	const { onProgress, abortSignal, skipAssets = false } = options;
	
	// Initialize progress
	let progress: ReplicatorProgress = createInitialReplicatorProgress();
	
	const updateProgress = (updates: Partial<ReplicatorProgress>) => {
		progress = { ...progress, ...updates };
		onProgress?.(progress);
	};
	
	try {
		// ========================================
		// PHASE 1: ANALYSIS
		// ========================================
		updateProgress({
			phase: 'analyzing',
			passesComplete: 0,
			totalPasses: 6,
		});
		
		const analysis = await analyzeScreenshot(imageUrl, {
			abortSignal,
			onProgress: (analysisProgress: AnalysisProgress) => {
				updateProgress({
					phase: 'analyzing',
					currentPass: analysisProgress.pass,
					passesComplete: analysisProgress.passIndex,
					totalPasses: analysisProgress.totalPasses,
				});
			},
		});
		
		// Check for abort
		if (abortSignal?.aborted) {
			throw new Error('Replication aborted');
		}
		
		// Update with analysis results and include partial analysis
		updateProgress({
			passesComplete: 6,
			totalAssets: analysis.assets.filter(a => !a.skipGeneration).length,
			totalSections: analysis.sections.length,
			partialAnalysis: analysis,
		});
		
		// ========================================
		// PHASE 2: ASSET GENERATION
		// ========================================
		let generatedAssets: GeneratedAsset[] = [];
		
		if (!skipAssets && analysis.assets.length > 0) {
			updateProgress({
				phase: 'generating-assets',
				assetsGenerated: 0,
			});
			
			generatedAssets = await generateAssets(analysis.assets, {
				abortSignal,
				onProgress: (assetProgress: AssetGenerationProgress) => {
					updateProgress({
						phase: 'generating-assets',
						currentAsset: assetProgress.currentAsset,
						assetsGenerated: assetProgress.currentIndex,
						totalAssets: assetProgress.totalAssets,
					});
				},
			});
			
			// Add placeholder assets for skipped items
			const placeholders = createPlaceholderAssets(analysis.assets);
			generatedAssets = [...generatedAssets, ...placeholders];
		}
		
		// Check for abort
		if (abortSignal?.aborted) {
			throw new Error('Replication aborted');
		}
		
		updateProgress({
			assetsGenerated: generatedAssets.length,
			partialAssets: generatedAssets,
		});
		
		// ========================================
		// PHASE 3: CODE GENERATION
		// ========================================
		updateProgress({
			phase: 'generating-code',
			sectionsGenerated: 0,
		});
		
		const files = await generateCode(analysis, generatedAssets, {
			abortSignal,
			imageUrl, // Pass screenshot for vision-assisted code generation
			onProgress: (codeProgress: CodeGenerationProgress) => {
				updateProgress({
					phase: 'generating-code',
					currentSection: codeProgress.currentSection,
					sectionsGenerated: codeProgress.currentIndex,
					currentFile: `components/${codeProgress.currentSection}.tsx`,
					filesGenerated: codeProgress.generatedFiles.length,
				});
			},
		});
		
		// Check for abort
		if (abortSignal?.aborted) {
			throw new Error('Replication aborted');
		}
		
		// ========================================
		// PHASE 4: ASSEMBLY
		// ========================================
		updateProgress({
			phase: 'assembling',
		});
		
		const totalBytes = calculateCodeBytes(files);
		
		// Build final output
		const output: ReplicatorOutput = {
			files,
			images: generatedAssets,
			analysis,
			metadata: {
				generatedAt: Date.now(),
				sectionsReplicated: analysis.sections.length,
				assetsGenerated: generatedAssets.filter(a => a.success).length,
				totalBytes,
				totalFiles: files.length,
			},
		};
		
		// ========================================
		// COMPLETE
		// ========================================
		updateProgress({
			phase: 'complete',
			sectionsGenerated: analysis.sections.length,
			filesGenerated: files.length,
			bytesGenerated: totalBytes,
		});
		
		return output;
		
	} catch (error) {
		// Update progress with error
		updateProgress({
			error: error instanceof Error ? error.message : 'Unknown error',
		});
		
		throw error;
	}
}

/**
 * Regenerate code only, reusing existing analysis and assets
 * 
 * This allows iterating on code generation without re-running
 * expensive image generation (saves API credits)
 */
export async function regenerateCodeOnly(
	imageUrl: string,
	analysis: ScreenshotAnalysis,
	existingAssets: GeneratedAsset[],
	options: ReplicateScreenshotOptions = {}
): Promise<ReplicatorOutput> {
	const { onProgress, abortSignal } = options;
	
	// Initialize progress - skip to code generation phase
	let progress: ReplicatorProgress = {
		...createInitialReplicatorProgress(),
		// Mark analysis and assets as already complete
		passesComplete: 6,
		totalPasses: 6,
		assetsGenerated: existingAssets.length,
		totalAssets: existingAssets.length,
		totalSections: analysis.sections.length,
		partialAnalysis: analysis,
		partialAssets: existingAssets,
	};
	
	const updateProgress = (updates: Partial<ReplicatorProgress>) => {
		progress = { ...progress, ...updates };
		onProgress?.(progress);
	};
	
	try {
		// ========================================
		// PHASE: CODE GENERATION (skip analysis & assets)
		// ========================================
		updateProgress({
			phase: 'generating-code',
			sectionsGenerated: 0,
		});
		
		const files = await generateCode(analysis, existingAssets, {
			abortSignal,
			imageUrl, // Pass screenshot for vision-assisted code generation
			onProgress: (codeProgress: CodeGenerationProgress) => {
				updateProgress({
					phase: 'generating-code',
					currentSection: codeProgress.currentSection,
					sectionsGenerated: codeProgress.currentIndex,
					currentFile: `components/${codeProgress.currentSection}.tsx`,
					filesGenerated: codeProgress.generatedFiles.length,
				});
			},
		});
		
		// Check for abort
		if (abortSignal?.aborted) {
			throw new Error('Code regeneration aborted');
		}
		
		// ========================================
		// PHASE: ASSEMBLY
		// ========================================
		updateProgress({
			phase: 'assembling',
		});
		
		const totalBytes = calculateCodeBytes(files);
		
		// Build final output (preserving existing assets)
		const output: ReplicatorOutput = {
			files,
			images: existingAssets,
			analysis,
			metadata: {
				generatedAt: Date.now(),
				sectionsReplicated: analysis.sections.length,
				assetsGenerated: existingAssets.filter(a => a.success).length,
				totalBytes,
				totalFiles: files.length,
			},
		};
		
		// ========================================
		// COMPLETE
		// ========================================
		updateProgress({
			phase: 'complete',
			sectionsGenerated: analysis.sections.length,
			filesGenerated: files.length,
			bytesGenerated: totalBytes,
		});
		
		return output;
		
	} catch (error) {
		// Update progress with error
		updateProgress({
			error: error instanceof Error ? error.message : 'Unknown error',
		});
		
		throw error;
	}
}

/**
 * Analyze a screenshot without generating code (for preview)
 */
export async function analyzeOnly(
	imageUrl: string,
	options: { onProgress?: (progress: ReplicatorProgress) => void; abortSignal?: AbortSignal } = {}
): Promise<ScreenshotAnalysis> {
	const { onProgress, abortSignal } = options;
	
	let progress: ReplicatorProgress = createInitialReplicatorProgress();
	
	const updateProgress = (updates: Partial<ReplicatorProgress>) => {
		progress = { ...progress, ...updates };
		onProgress?.(progress);
	};
	
	updateProgress({
		phase: 'analyzing',
		passesComplete: 0,
		totalPasses: 6,
	});
	
	const analysis = await analyzeScreenshot(imageUrl, {
		abortSignal,
		onProgress: (analysisProgress: AnalysisProgress) => {
			updateProgress({
				phase: 'analyzing',
				currentPass: analysisProgress.pass,
				passesComplete: analysisProgress.passIndex,
				totalPasses: analysisProgress.totalPasses,
			});
		},
	});
	
	updateProgress({
		phase: 'complete',
		passesComplete: 6,
		totalAssets: analysis.assets.length,
		totalSections: analysis.sections.length,
	});
	
	return analysis;
}

// Re-export types and utilities
export type { ReplicatorProgress, ReplicatorPhase, ScreenshotAnalysis, ReplicatorOutput, GeneratedAsset };
export { createInitialReplicatorProgress, createEmptyReplicatorOutput, getAnalysisPassLabel };
