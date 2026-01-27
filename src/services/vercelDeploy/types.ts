/**
 * Vercel Deployment Types
 * Types for direct Vercel API deployment without GitHub
 */

// ============================================================================
// DEPLOYMENT STATUS
// ============================================================================

export type VercelDeploymentState =
	| 'QUEUED'
	| 'BUILDING'
	| 'READY'
	| 'ERROR'
	| 'CANCELED';

export type DeployPhase =
	| 'idle'
	| 'uploading'
	| 'creating'
	| 'building'
	| 'ready'
	| 'error';

// ============================================================================
// FILE UPLOAD
// ============================================================================

export interface FileToUpload {
	/** File path relative to project root */
	path: string;
	/** File content as string */
	content: string;
	/** Optional encoding (defaults to utf-8) */
	encoding?: 'utf-8' | 'base64';
}

export interface UploadedFile {
	/** File path */
	path: string;
	/** SHA1 hash of the file */
	sha: string;
	/** File size in bytes */
	size: number;
}

// ============================================================================
// DEPLOYMENT CONFIG
// ============================================================================

export interface DeploymentConfig {
	/** Project name (used in URL: project-name.vercel.app) */
	projectName: string;
	/** Framework preset */
	framework?: 'nextjs' | 'static';
	/** Build command override */
	buildCommand?: string;
	/** Output directory override */
	outputDirectory?: string;
	/** Team ID (optional, for team deployments) */
	teamId?: string;
}

// ============================================================================
// DEPLOYMENT RESULT
// ============================================================================

export interface VercelDeploymentResult {
	/** Deployment ID */
	id: string;
	/** Deployment URL (e.g., project-abc123.vercel.app) */
	url: string;
	/** Full URL with protocol */
	previewUrl: string;
	/** Current deployment state */
	state: VercelDeploymentState;
	/** Project ID */
	projectId?: string;
	/** Created timestamp */
	createdAt: number;
	/** Ready timestamp (when build completed) */
	readyAt?: number;
	/** Error message if state is ERROR */
	errorMessage?: string;
}

// ============================================================================
// PROGRESS TRACKING
// ============================================================================

export interface DeployProgress {
	/** Current phase */
	phase: DeployPhase;
	/** Number of files uploaded */
	filesUploaded: number;
	/** Total files to upload */
	totalFiles: number;
	/** Current file being processed */
	currentFile?: string;
	/** Deployment URL once available */
	deploymentUrl?: string;
	/** Error message if failed */
	error?: string;
	/** Deployment ID */
	deploymentId?: string;
}

// ============================================================================
// VERCEL API RESPONSES
// ============================================================================

export interface VercelFileUploadResponse {
	/** SHA of the uploaded file */
	sha: string;
}

export interface VercelDeploymentResponse {
	id: string;
	url: string;
	name: string;
	readyState: VercelDeploymentState;
	createdAt: number;
	buildingAt?: number;
	ready?: number;
	error?: {
		code: string;
		message: string;
	};
}

export interface VercelProjectResponse {
	id: string;
	name: string;
	accountId: string;
	createdAt: number;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create initial deploy progress
 */
export function createInitialDeployProgress(): DeployProgress {
	return {
		phase: 'idle',
		filesUploaded: 0,
		totalFiles: 0,
	};
}

/**
 * Get human-readable phase label
 */
export function getDeployPhaseLabel(phase: DeployPhase): string {
	const labels: Record<DeployPhase, string> = {
		idle: 'Ready to Deploy',
		uploading: 'Uploading Files',
		creating: 'Creating Deployment',
		building: 'Building Project',
		ready: 'Deployed',
		error: 'Deployment Failed',
	};
	return labels[phase];
}

/**
 * Map Vercel state to our phase
 */
export function vercelStateToPhase(state: VercelDeploymentState): DeployPhase {
	switch (state) {
		case 'QUEUED':
		case 'BUILDING':
			return 'building';
		case 'READY':
			return 'ready';
		case 'ERROR':
		case 'CANCELED':
			return 'error';
		default:
			return 'building';
	}
}
