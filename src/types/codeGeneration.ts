// Code Generation types for producing complete Next.js codebases
// Final output node: transforms all upstream workflow outputs into deployable code

import { SitePlannerOutput, PageBrief, PageType } from './sitePlanner';
import { SEOOptimizedPackage, SEOOptimizedPage } from './seoPackage';
import { BrandDesignOutput } from './brandDesign';
import {
	GeneratedEditorialContent,
	GeneratedContentPage,
} from './editorialContent';
import { GeneratedProviderProfile } from './generatedProfile';
import { GeneratedComparisonData } from './comparisonPage';

// ============================================================================
// GENERATED FILE TYPES
// ============================================================================

export type GeneratedFileType =
	| 'component'
	| 'page'
	| 'layout'
	| 'config'
	| 'style'
	| 'data'
	| 'lib';

export interface GeneratedFile {
	path: string; // "src/app/page.tsx"
	content: string; // File contents
	type: GeneratedFileType;
	encoding: 'utf-8';
}

// ============================================================================
// CODEBASE METADATA
// ============================================================================

export interface CodebaseMetadata {
	generatedAt: string;
	totalFiles: number;
	totalBytes: number;
	buildCommand: string; // "npm run build"
	deployTarget: 'vercel';
	sitePlan: {
		brandName: string;
		domain: string;
		pageCount: number;
		city: string;
		state: string;
		category: string;
	};
}

// ============================================================================
// MAIN OUTPUT STRUCTURE
// ============================================================================

export interface GeneratedCodebase {
	files: GeneratedFile[];
	metadata: CodebaseMetadata;
}

// ============================================================================
// PROGRESS TRACKING
// ============================================================================

export type CodeGenerationPhase =
	| 'preparing'
	| 'routing'
	| 'styling'
	| 'content'
	| 'assembling'
	| 'validating'
	| 'complete';

export interface CodeGenerationProgress {
	phase: CodeGenerationPhase;
	currentFile: string | null;
	filesGenerated: number;
	totalFiles: number;
	bytesGenerated: number;
}

// ============================================================================
// INPUT AGGREGATION
// ============================================================================

export interface CodeGenInputs {
	sitePlan: SitePlannerOutput;
	seoPackage: SEOOptimizedPackage;
	brandDesign: BrandDesignOutput;
	editorialContent: GeneratedEditorialContent | null;
	providerProfiles: GeneratedProviderProfile[];
	comparisonData: GeneratedComparisonData | null;
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

export interface CodeValidationResult {
	valid: boolean;
	errors: CodeValidationError[];
	warnings: CodeValidationWarning[];
}

export interface CodeValidationError {
	type: 'missing_page' | 'missing_content' | 'invalid_route' | 'type_error';
	message: string;
	file?: string;
	pageId?: string;
}

export interface CodeValidationWarning {
	type: 'missing_optional' | 'fallback_used' | 'incomplete_data';
	message: string;
	affectedPages?: string[];
}

// ============================================================================
// ROUTE GENERATION
// ============================================================================

export interface GeneratedRoute {
	url: string; // "/phoenix/repair"
	filePath: string; // "src/app/phoenix/repair/page.tsx"
	pageType: PageType;
	pageId: string;
	isDynamic: boolean;
	dynamicSegments?: string[]; // ["city", "service-slug"]
}

// ============================================================================
// CONTENT MAPPING
// ============================================================================

export interface PageContentMapping {
	pageId: string;
	pageType: PageType;
	url: string;
	seo: SEOOptimizedPage | null;
	editorial: GeneratedContentPage | null;
	profile: GeneratedProviderProfile | null;
	comparison: {
		comparisonPage?: unknown;
		pricingPage?: unknown;
	} | null;
}

// ============================================================================
// GENERATION CONFIG
// ============================================================================

export interface CodeGenerationConfig {
	outputFormat: 'files' | 'zip';
	includeReadme: boolean;
	prettyPrint: boolean;
	strictMode: boolean;
}

// ============================================================================
// FILE TREE STRUCTURE (for UI preview)
// ============================================================================

export interface FileTreeNode {
	name: string;
	type: 'file' | 'directory';
	path: string;
	size?: number; // bytes
	children?: FileTreeNode[];
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create empty codebase for initialization/error cases
 */
export function createEmptyCodebase(): GeneratedCodebase {
	return {
		files: [],
		metadata: {
			generatedAt: new Date().toISOString(),
			totalFiles: 0,
			totalBytes: 0,
			buildCommand: 'npm run build',
			deployTarget: 'vercel',
			sitePlan: {
				brandName: '',
				domain: '',
				pageCount: 0,
				city: '',
				state: '',
				category: '',
			},
		},
	};
}

/**
 * Create initial progress state
 */
export function createInitialProgress(): CodeGenerationProgress {
	return {
		phase: 'preparing',
		currentFile: null,
		filesGenerated: 0,
		totalFiles: 0,
		bytesGenerated: 0,
	};
}

/**
 * Convert URL to file system path for Next.js App Router
 * @example "/phoenix/repair" -> "src/app/phoenix/repair/page.tsx"
 */
export function urlToFilePath(url: string): string {
	if (url === '/') {
		return 'src/app/page.tsx';
	}
	const segments = url.split('/').filter(Boolean);
	return `src/app/${segments.join('/')}/page.tsx`;
}

/**
 * Check if a URL pattern contains dynamic segments
 */
export function isDynamicRoute(url: string): boolean {
	return url.includes('[') && url.includes(']');
}

/**
 * Extract dynamic segment names from a URL
 * @example "/[city]/[service-slug]" -> ["city", "service-slug"]
 */
export function extractDynamicSegments(url: string): string[] {
	const matches = url.match(/\[([^\]]+)\]/g);
	if (!matches) return [];
	return matches.map((m) => m.slice(1, -1));
}

/**
 * Build file tree structure from flat file list
 */
export function buildFileTree(files: GeneratedFile[]): FileTreeNode {
	const root: FileTreeNode = {
		name: 'generated-site',
		type: 'directory',
		path: '',
		children: [],
	};

	for (const file of files) {
		const parts = file.path.split('/');
		let current = root;

		for (let i = 0; i < parts.length; i++) {
			const part = parts[i];
			const isFile = i === parts.length - 1;
			const path = parts.slice(0, i + 1).join('/');

			if (isFile) {
				current.children = current.children || [];
				current.children.push({
					name: part,
					type: 'file',
					path,
					size: new TextEncoder().encode(file.content).length,
				});
			} else {
				current.children = current.children || [];
				let dir = current.children.find(
					(c) => c.name === part && c.type === 'directory',
				);
				if (!dir) {
					dir = {
						name: part,
						type: 'directory',
						path,
						children: [],
					};
					current.children.push(dir);
				}
				current = dir;
			}
		}
	}

	// Sort children: directories first, then files, alphabetically
	const sortChildren = (node: FileTreeNode) => {
		if (node.children) {
			node.children.sort((a, b) => {
				if (a.type !== b.type) {
					return a.type === 'directory' ? -1 : 1;
				}
				return a.name.localeCompare(b.name);
			});
			node.children.forEach(sortChildren);
		}
	};
	sortChildren(root);

	return root;
}

/**
 * Calculate total size of generated codebase
 */
export function calculateTotalBytes(files: GeneratedFile[]): number {
	return files.reduce(
		(total, file) => total + new TextEncoder().encode(file.content).length,
		0,
	);
}

/**
 * Format bytes as human-readable string
 */
export function formatBytes(bytes: number): string {
	if (bytes === 0) return '0 B';
	const k = 1024;
	const sizes = ['B', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Get phase display name
 */
export function getPhaseLabel(phase: CodeGenerationPhase): string {
	const labels: Record<CodeGenerationPhase, string> = {
		preparing: 'Preparing',
		routing: 'Generating Routes',
		styling: 'Generating Styles',
		content: 'Generating Pages',
		assembling: 'Assembling Codebase',
		validating: 'Validating',
		complete: 'Complete',
	};
	return labels[phase];
}

/**
 * Get phase progress percentage
 */
export function getPhaseProgress(phase: CodeGenerationPhase): number {
	const progress: Record<CodeGenerationPhase, number> = {
		preparing: 0,
		routing: 10,
		styling: 20,
		content: 50,
		assembling: 90,
		validating: 95,
		complete: 100,
	};
	return progress[phase];
}
