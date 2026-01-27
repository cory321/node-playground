// Code Generation Service
// Main orchestrator for transforming upstream node outputs into a Next.js codebase

import {
	CodeGenInputs,
	GeneratedCodebase,
	GeneratedFile,
	GeneratedImage,
	CodeGenerationProgress,
	CodebaseMetadata,
	calculateTotalBytes,
} from '@/types/codeGeneration';
import { validateInputs } from './validator';
import { generateRouteFiles } from './generators/routes';
import { generateStyleFiles } from './generators/styles';
import { generateLayoutFiles } from './generators/layouts';
import { generateComponentFiles } from './generators/components';
import { generatePageFiles } from './generators/pages';
import { generateSEOFiles } from './generators/seo';
import { generateDataFiles } from './generators/data';
import { generateConfigFiles } from './generators/config';
import { generateHomepageImages, extractBase64FromDataUrl } from './imageGeneration';

export interface CodeGenOptions {
	onProgress?: (progress: CodeGenerationProgress) => void;
	abortSignal?: AbortSignal;
	includeReadme?: boolean;
	/** Generate images using Gemini Image 3 (requires Google API key) */
	generateImages?: boolean;
	/** Use LLM for page generation (Opus for homepage, Haiku for others) */
	useLLM?: boolean;
}

/**
 * Main entry point for code generation
 * Transforms all upstream node outputs into a complete Next.js codebase
 */
export async function generateNextjsSite(
	inputs: CodeGenInputs,
	options: CodeGenOptions = {}
): Promise<GeneratedCodebase> {
	const { onProgress, abortSignal, includeReadme = true, generateImages = false, useLLM = false } = options;

	// Helper to check abort and report progress
	const checkAbort = () => {
		if (abortSignal?.aborted) {
			throw new DOMException('Generation aborted', 'AbortError');
		}
	};

	const reportProgress = (
		phase: CodeGenerationProgress['phase'],
		currentFile: string | null,
		filesGenerated: number,
		totalFiles: number,
		bytesGenerated: number
	) => {
		if (onProgress) {
			onProgress({
				phase,
				currentFile,
				filesGenerated,
				totalFiles,
				bytesGenerated,
			});
		}
	};

	// Phase 1: Preparing - Validate inputs
	reportProgress('preparing', null, 0, 0, 0);
	checkAbort();

	const validation = validateInputs(inputs);
	if (!validation.valid) {
		const errorMessages = validation.errors.map((e) => e.message).join('; ');
		throw new Error(`Validation failed: ${errorMessages}`);
	}

	// Log warnings but continue
	if (validation.warnings.length > 0) {
		console.warn(
			'Code generation warnings:',
			validation.warnings.map((w) => w.message)
		);
	}

	const allFiles: GeneratedFile[] = [];
	const allImages: GeneratedImage[] = [];
	let bytesGenerated = 0;

	// Estimate total files based on page count
	const estimatedTotal = estimateTotalFiles(inputs);

	// Phase 2: Routing - Generate route structure
	reportProgress('routing', 'Analyzing site structure...', 0, estimatedTotal, 0);
	checkAbort();

	const routeFiles = await generateRouteFiles(inputs, {
		onFile: (file) => {
			allFiles.push(file);
			bytesGenerated += new TextEncoder().encode(file.content).length;
			reportProgress(
				'routing',
				file.path,
				allFiles.length,
				estimatedTotal,
				bytesGenerated
			);
		},
		abortSignal,
	});

	// Phase 3: Styling - Generate style files
	reportProgress(
		'styling',
		'Generating design tokens...',
		allFiles.length,
		estimatedTotal,
		bytesGenerated
	);
	checkAbort();

	const styleFiles = await generateStyleFiles(inputs, {
		onFile: (file) => {
			allFiles.push(file);
			bytesGenerated += new TextEncoder().encode(file.content).length;
			reportProgress(
				'styling',
				file.path,
				allFiles.length,
				estimatedTotal,
				bytesGenerated
			);
		},
		abortSignal,
	});

	// Phase 4: Images - Generate brand-matched images (optional)
	if (generateImages) {
		reportProgress(
			'images',
			'Generating homepage images...',
			allFiles.length,
			estimatedTotal,
			bytesGenerated
		);
		checkAbort();

		try {
			const generatedImages = await generateHomepageImages(
				inputs.brandDesign,
				inputs.sitePlan,
				(imageProgress) => {
					reportProgress(
						'images',
						`Generating ${imageProgress.currentImage} (${imageProgress.current}/${imageProgress.total})...`,
						allFiles.length,
						estimatedTotal,
						bytesGenerated
					);
				}
			);

			// Convert to the GeneratedImage format for ZIP packaging
			for (const img of generatedImages) {
				const extracted = extractBase64FromDataUrl(img.dataUrl);
				if (extracted) {
					allImages.push({
						path: img.path,
						data: extracted.data,
						mimeType: extracted.mimeType,
						purpose: img.purpose,
						aspectRatio: img.aspectRatio,
					});
				}
			}
		} catch (error) {
			console.error('Image generation failed:', error);
			// Continue without images - they're optional
		}
	}

	// Phase 5: Content - Generate pages, layouts, components
	reportProgress(
		'content',
		'Generating pages...',
		allFiles.length,
		estimatedTotal,
		bytesGenerated
	);
	checkAbort();

	// Generate layouts first
	const layoutFiles = await generateLayoutFiles(inputs, {
		onFile: (file) => {
			allFiles.push(file);
			bytesGenerated += new TextEncoder().encode(file.content).length;
			reportProgress(
				'content',
				file.path,
				allFiles.length,
				estimatedTotal,
				bytesGenerated
			);
		},
		abortSignal,
	});

	// Generate components
	const componentFiles = await generateComponentFiles(inputs, {
		onFile: (file) => {
			allFiles.push(file);
			bytesGenerated += new TextEncoder().encode(file.content).length;
			reportProgress(
				'content',
				file.path,
				allFiles.length,
				estimatedTotal,
				bytesGenerated
			);
		},
		abortSignal,
	});

	// Generate page files (the bulk of the work)
	const pageFiles = await generatePageFiles(inputs, {
		onFile: (file) => {
			allFiles.push(file);
			bytesGenerated += new TextEncoder().encode(file.content).length;
			reportProgress(
				'content',
				file.path,
				allFiles.length,
				estimatedTotal,
				bytesGenerated
			);
		},
		abortSignal,
		useLLM,
	});

	// Phase 5: Assembling - Generate SEO, data, and config files
	reportProgress(
		'assembling',
		'Generating SEO files...',
		allFiles.length,
		estimatedTotal,
		bytesGenerated
	);
	checkAbort();

	const seoFiles = await generateSEOFiles(inputs, {
		onFile: (file) => {
			allFiles.push(file);
			bytesGenerated += new TextEncoder().encode(file.content).length;
			reportProgress(
				'assembling',
				file.path,
				allFiles.length,
				estimatedTotal,
				bytesGenerated
			);
		},
		abortSignal,
	});

	const dataFiles = await generateDataFiles(inputs, {
		onFile: (file) => {
			allFiles.push(file);
			bytesGenerated += new TextEncoder().encode(file.content).length;
			reportProgress(
				'assembling',
				file.path,
				allFiles.length,
				estimatedTotal,
				bytesGenerated
			);
		},
		abortSignal,
	});

	const configFiles = await generateConfigFiles(inputs, {
		onFile: (file) => {
			allFiles.push(file);
			bytesGenerated += new TextEncoder().encode(file.content).length;
			reportProgress(
				'assembling',
				file.path,
				allFiles.length,
				estimatedTotal,
				bytesGenerated
			);
		},
		abortSignal,
		includeReadme,
	});

	// Phase 6: Validating
	reportProgress(
		'validating',
		'Validating output...',
		allFiles.length,
		allFiles.length,
		bytesGenerated
	);
	checkAbort();

	// Perform final validation
	validateGeneratedFiles(allFiles, inputs);

	// Phase 7: Complete
	const totalBytes = calculateTotalBytes(allFiles);
	reportProgress('complete', null, allFiles.length, allFiles.length, totalBytes);

	// Build metadata
	const metadata: CodebaseMetadata = {
		generatedAt: new Date().toISOString(),
		totalFiles: allFiles.length,
		totalBytes,
		buildCommand: 'npm run build',
		deployTarget: 'vercel',
		sitePlan: {
			brandName: inputs.sitePlan.brand.name,
			domain: inputs.sitePlan.brand.domain,
			pageCount: inputs.sitePlan.pages.length,
			city: inputs.sitePlan.meta.city,
			state: inputs.sitePlan.meta.state,
			category: inputs.sitePlan.meta.category,
		},
	};

	return {
		files: allFiles,
		images: allImages,
		metadata,
	};
}

/**
 * Estimate total number of files to generate
 */
function estimateTotalFiles(inputs: CodeGenInputs): number {
	const pageCount = inputs.sitePlan.pages.length;

	// Estimate breakdown:
	// - Pages: pageCount
	// - Layouts: ~5 (root, nested layouts)
	// - Components: ~25 (UI, sections, entities, content)
	// - Lib utilities: ~15
	// - Styles: ~2 (tokens.css, globals)
	// - Data files: ~5
	// - Config: ~5 (package.json, tsconfig, next.config, tailwind, readme)
	// - SEO: ~2 (sitemap, robots)

	return pageCount + 60;
}

/**
 * Validate the generated files
 */
function validateGeneratedFiles(
	files: GeneratedFile[],
	inputs: CodeGenInputs
): void {
	// Check that all pages from sitePlan have corresponding files
	const pageUrls = inputs.sitePlan.pages.map((p) => p.url);
	const generatedPaths = files.filter((f) => f.type === 'page').map((f) => f.path);

	// Convert URLs to expected file paths
	const expectedPaths = pageUrls.map((url) => {
		if (url === '/') return 'src/app/page.tsx';
		const segments = url.split('/').filter(Boolean);
		return `src/app/${segments.join('/')}/page.tsx`;
	});

	const missingPages = expectedPaths.filter(
		(p) => !generatedPaths.includes(p)
	);

	if (missingPages.length > 0) {
		console.warn(
			`Warning: ${missingPages.length} pages may be using dynamic routes:`,
			missingPages.slice(0, 5)
		);
	}

	// Check for empty files
	const emptyFiles = files.filter((f) => !f.content || f.content.trim() === '');
	if (emptyFiles.length > 0) {
		throw new Error(
			`Generated empty files: ${emptyFiles.map((f) => f.path).join(', ')}`
		);
	}
}

// Re-export types and utilities
export { validateInputs, hasRequiredInputs, countOptionalInputs } from './validator';
export type { CodeGenInputs, GeneratedCodebase, GeneratedFile } from '@/types/codeGeneration';
