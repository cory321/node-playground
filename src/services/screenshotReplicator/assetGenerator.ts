/**
 * Screenshot Replicator Asset Generator
 * Generates images using Gemini Pro Image 3 based on discovered assets
 */

import { callGeminiImage, findClosestAspectRatio } from '@/api/llm/gemini-image';
import {
	DiscoveredAsset,
	GeneratedAsset,
	mapToGeminiAspectRatio,
} from '@/types/screenshotReplicator';

// ============================================================================
// TYPES
// ============================================================================

export interface AssetGenerationProgress {
	currentAsset: string;
	currentIndex: number;
	totalAssets: number;
	completed: GeneratedAsset[];
	failed: Array<{ assetId: string; error: string }>;
}

export interface AssetGenerationOptions {
	onProgress?: (progress: AssetGenerationProgress) => void;
	abortSignal?: AbortSignal;
	/** Number of assets to generate in parallel (default: 2) */
	batchSize?: number;
	/** Delay between batches in ms to avoid rate limits (default: 1000) */
	batchDelay?: number;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get file path for an asset
 */
function getAssetPath(asset: DiscoveredAsset): string {
	// Use webp for photos/avatars, png for icons/graphics
	const extension = ['photo', 'avatar'].includes(asset.type) ? 'webp' : 'png';
	return `images/${asset.id}.${extension}`;
}

/**
 * Get MIME type for an asset
 */
function getAssetMimeType(asset: DiscoveredAsset): string {
	return ['photo', 'avatar'].includes(asset.type) ? 'image/webp' : 'image/png';
}

/**
 * Enhance generation prompt for better results
 */
function enhancePrompt(asset: DiscoveredAsset): string {
	let prompt = asset.generationPrompt;
	
	// Add type-specific enhancements
	switch (asset.type) {
		case 'photo':
			prompt = `Professional photograph: ${prompt}. High quality, well-lit, sharp focus.`;
			break;
		case 'avatar':
			prompt = `Professional headshot portrait: ${prompt}. Clean background, good lighting, professional appearance.`;
			break;
		case 'icon':
			prompt = `Simple, clean icon design: ${prompt}. Minimal, modern style, clear silhouette.`;
			break;
		case 'graphic':
			prompt = `Digital illustration: ${prompt}. Modern, clean design, suitable for web.`;
			break;
		case 'pattern':
			prompt = `Seamless pattern design: ${prompt}. Tileable, subtle, suitable for background.`;
			break;
		default:
			break;
	}
	
	return prompt;
}

/**
 * Delay helper for rate limiting
 */
function delay(ms: number): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// SINGLE ASSET GENERATION
// ============================================================================

/**
 * Generate a single asset using Gemini Pro Image 3
 */
async function generateSingleAsset(asset: DiscoveredAsset): Promise<GeneratedAsset> {
	try {
		// Get the aspect ratio (map to Gemini-supported ratio)
		const aspectRatio = mapToGeminiAspectRatio(asset.aspectRatio);
		
		// Enhance the prompt
		const prompt = enhancePrompt(asset);
		
		// Generate the image
		const dataUrl = await callGeminiImage(prompt, aspectRatio);
		
		return {
			assetId: asset.id,
			path: getAssetPath(asset),
			dataUrl,
			mimeType: getAssetMimeType(asset),
			success: true,
		};
	} catch (error) {
		return {
			assetId: asset.id,
			path: getAssetPath(asset),
			dataUrl: '',
			mimeType: getAssetMimeType(asset),
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

// ============================================================================
// BATCH ASSET GENERATION
// ============================================================================

/**
 * Generate all assets for a screenshot replication
 */
export async function generateAssets(
	assets: DiscoveredAsset[],
	options: AssetGenerationOptions = {}
): Promise<GeneratedAsset[]> {
	const {
		onProgress,
		abortSignal,
		batchSize = 2,
		batchDelay = 1000,
	} = options;
	
	// Filter assets that need generation (skip logos and assets with skipGeneration)
	const assetsToGenerate = assets.filter(asset => !asset.skipGeneration);
	
	if (assetsToGenerate.length === 0) {
		return [];
	}
	
	const results: GeneratedAsset[] = [];
	const failed: Array<{ assetId: string; error: string }> = [];
	
	// Process in batches
	for (let i = 0; i < assetsToGenerate.length; i += batchSize) {
		// Check for abort
		if (abortSignal?.aborted) {
			throw new Error('Asset generation aborted');
		}
		
		const batch = assetsToGenerate.slice(i, i + batchSize);
		
		// Report progress for first item in batch
		if (onProgress && batch[0]) {
			onProgress({
				currentAsset: batch[0].purpose,
				currentIndex: i,
				totalAssets: assetsToGenerate.length,
				completed: [...results],
				failed: [...failed],
			});
		}
		
		// Generate batch in parallel
		const batchResults = await Promise.all(
			batch.map(asset => generateSingleAsset(asset))
		);
		
		// Collect results
		for (const result of batchResults) {
			if (result.success) {
				results.push(result);
			} else {
				failed.push({ assetId: result.assetId, error: result.error || 'Unknown error' });
			}
		}
		
		// Delay before next batch (unless this is the last batch)
		if (i + batchSize < assetsToGenerate.length) {
			await delay(batchDelay);
		}
	}
	
	// Final progress report
	if (onProgress) {
		onProgress({
			currentAsset: 'Complete',
			currentIndex: assetsToGenerate.length,
			totalAssets: assetsToGenerate.length,
			completed: results,
			failed,
		});
	}
	
	return results;
}

/**
 * Generate placeholder for skipped assets (logos, icon library fallbacks)
 */
export function createPlaceholderAssets(assets: DiscoveredAsset[]): GeneratedAsset[] {
	const skippedAssets = assets.filter(asset => asset.skipGeneration);
	
	return skippedAssets.map(asset => {
		// For icons with fallback, we don't need to generate
		// For logos, we'll use a text placeholder
		return {
			assetId: asset.id,
			path: getAssetPath(asset),
			dataUrl: '', // Empty - will be handled in code generation
			mimeType: getAssetMimeType(asset),
			success: true, // Marked as success since we intentionally skipped
		};
	});
}

/**
 * Get a summary of asset generation
 */
export function getAssetGenerationSummary(
	assets: DiscoveredAsset[],
	generated: GeneratedAsset[]
): {
	total: number;
	generated: number;
	skipped: number;
	failed: number;
	breakdown: Record<string, number>;
} {
	const skipped = assets.filter(a => a.skipGeneration).length;
	const successful = generated.filter(g => g.success).length;
	const failed = generated.filter(g => !g.success).length;
	
	// Count by type
	const breakdown: Record<string, number> = {};
	for (const asset of assets) {
		breakdown[asset.type] = (breakdown[asset.type] || 0) + 1;
	}
	
	return {
		total: assets.length,
		generated: successful,
		skipped,
		failed,
		breakdown,
	};
}
