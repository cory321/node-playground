/**
 * Vercel Deployment Service
 * Main orchestrator for deploying generated code directly to Vercel
 */

import { GeneratedFile } from '@/types/codeGeneration';
import { GeneratedAsset } from '@/types/screenshotReplicator';
import { uploadFilesParallel } from './fileUploader';
import {
	FileToUpload,
	UploadedFile,
	DeploymentConfig,
	VercelDeploymentResult,
	VercelDeploymentResponse,
	DeployProgress,
	vercelStateToPhase,
} from './types';

// Re-export types
export * from './types';

// ============================================================================
// CONFIGURATION
// ============================================================================

const VERCEL_API_BASE = 'https://api.vercel.com';
const DEFAULT_POLL_INTERVAL = 3000; // 3 seconds
const MAX_POLL_ATTEMPTS = 60; // 3 minutes max

/**
 * Get Vercel token from environment
 */
function getVercelToken(): string {
	const token = import.meta.env.VITE_VERCEL_TOKEN;
	if (!token) {
		throw new Error('VITE_VERCEL_TOKEN environment variable is not set');
	}
	return token;
}

// ============================================================================
// FILE CONVERSION
// ============================================================================

/**
 * Convert GeneratedFile array to FileToUpload array
 */
function convertCodeFiles(files: GeneratedFile[]): FileToUpload[] {
	return files.map(file => ({
		path: file.path,
		content: file.content,
		encoding: 'utf-8' as const,
	}));
}

/**
 * Convert GeneratedAsset array to FileToUpload array
 */
function convertAssetFiles(assets: GeneratedAsset[]): FileToUpload[] {
	return assets
		.filter(asset => asset.success && asset.dataUrl)
		.map(asset => {
			// Extract base64 data from data URL
			const match = asset.dataUrl.match(/^data:[^;]+;base64,(.+)$/);
			if (!match) {
				console.warn(`Invalid data URL for asset ${asset.assetId}`);
				return null;
			}
			
			return {
				path: `public/${asset.path}`,
				content: match[1],
				encoding: 'base64' as const,
			};
		})
		.filter((f): f is FileToUpload => f !== null);
}

/**
 * Generate Next.js config files for deployment
 */
function generateConfigFiles(projectName: string): FileToUpload[] {
	const packageJson = {
		name: projectName,
		version: '0.1.0',
		private: true,
		scripts: {
			dev: 'next dev',
			build: 'next build',
			start: 'next start',
			lint: 'next lint',
		},
		dependencies: {
			next: '^14.0.0',
			react: '^18.2.0',
			'react-dom': '^18.2.0',
			'lucide-react': '^0.460.0',
		},
		devDependencies: {
			'@types/node': '^20',
			'@types/react': '^18',
			'@types/react-dom': '^18',
			typescript: '^5',
			tailwindcss: '^3.4.0',
			postcss: '^8',
			autoprefixer: '^10',
		},
	};

	const nextConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
`;

	const tsConfig = {
		compilerOptions: {
			lib: ['dom', 'dom.iterable', 'esnext'],
			allowJs: true,
			skipLibCheck: true,
			strict: true,
			noEmit: true,
			esModuleInterop: true,
			module: 'esnext',
			moduleResolution: 'bundler',
			resolveJsonModule: true,
			isolatedModules: true,
			jsx: 'preserve',
			incremental: true,
			plugins: [{ name: 'next' }],
			paths: { '@/*': ['./*'] },
		},
		include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
		exclude: ['node_modules'],
	};

	const tailwindConfig = `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
`;

	const postcssConfig = `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`;

	const globalsCss = `@import './styles/tokens.css';

@tailwind base;
@tailwind components;
@tailwind utilities;
`;

	// Root layout is REQUIRED for Next.js App Router
	const rootLayout = `import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '${projectName}',
  description: 'Generated with Screenshot Replicator',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`;

	return [
		{ path: 'package.json', content: JSON.stringify(packageJson, null, 2), encoding: 'utf-8' },
		{ path: 'next.config.js', content: nextConfig, encoding: 'utf-8' },
		{ path: 'tsconfig.json', content: JSON.stringify(tsConfig, null, 2), encoding: 'utf-8' },
		{ path: 'tailwind.config.js', content: tailwindConfig, encoding: 'utf-8' },
		{ path: 'postcss.config.js', content: postcssConfig, encoding: 'utf-8' },
		{ path: 'app/globals.css', content: globalsCss, encoding: 'utf-8' },
		{ path: 'app/layout.tsx', content: rootLayout, encoding: 'utf-8' },
	];
}

// ============================================================================
// DEPLOYMENT API
// ============================================================================

/**
 * Create a deployment on Vercel
 */
async function createDeployment(
	uploadedFiles: UploadedFile[],
	config: DeploymentConfig,
	token: string
): Promise<VercelDeploymentResponse> {
	const url = new URL(`${VERCEL_API_BASE}/v13/deployments`);
	if (config.teamId) {
		url.searchParams.set('teamId', config.teamId);
	}

	// Build files array for deployment
	const files = uploadedFiles.map(f => ({
		file: f.path,
		sha: f.sha,
		size: f.size,
	}));

	const body = {
		name: config.projectName,
		files,
		projectSettings: {
			framework: config.framework || 'nextjs',
			buildCommand: config.buildCommand,
			outputDirectory: config.outputDirectory,
		},
	};

	const response = await fetch(url.toString(), {
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${token}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(body),
	});

	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		const message = errorData.error?.message || response.statusText;
		throw new Error(`Failed to create deployment: ${message}`);
	}

	return response.json();
}

/**
 * Get deployment status
 */
async function getDeploymentStatus(
	deploymentId: string,
	token: string,
	teamId?: string
): Promise<VercelDeploymentResponse> {
	const url = new URL(`${VERCEL_API_BASE}/v13/deployments/${deploymentId}`);
	if (teamId) {
		url.searchParams.set('teamId', teamId);
	}

	const response = await fetch(url.toString(), {
		headers: {
			'Authorization': `Bearer ${token}`,
		},
	});

	if (!response.ok) {
		throw new Error(`Failed to get deployment status: ${response.statusText}`);
	}

	return response.json();
}

/**
 * Poll deployment until ready or error
 */
async function waitForDeployment(
	deploymentId: string,
	token: string,
	options: {
		teamId?: string;
		pollInterval?: number;
		maxAttempts?: number;
		onStatus?: (status: VercelDeploymentResponse) => void;
		abortSignal?: AbortSignal;
	} = {}
): Promise<VercelDeploymentResponse> {
	const {
		teamId,
		pollInterval = DEFAULT_POLL_INTERVAL,
		maxAttempts = MAX_POLL_ATTEMPTS,
		onStatus,
		abortSignal,
	} = options;

	for (let attempt = 0; attempt < maxAttempts; attempt++) {
		if (abortSignal?.aborted) {
			throw new Error('Deployment polling aborted');
		}

		const status = await getDeploymentStatus(deploymentId, token, teamId);
		onStatus?.(status);

		if (status.readyState === 'READY') {
			return status;
		}

		if (status.readyState === 'ERROR' || status.readyState === 'CANCELED') {
			throw new Error(status.error?.message || 'Deployment failed');
		}

		// Wait before next poll
		await new Promise(resolve => setTimeout(resolve, pollInterval));
	}

	throw new Error('Deployment timed out');
}

// ============================================================================
// MAIN DEPLOYMENT FUNCTION
// ============================================================================

export interface DeployOptions {
	/** Callback for progress updates */
	onProgress?: (progress: DeployProgress) => void;
	/** Abort signal for cancellation */
	abortSignal?: AbortSignal;
	/** Team ID for team deployments */
	teamId?: string;
	/** Whether to wait for deployment to complete */
	waitForReady?: boolean;
}

/**
 * Deploy generated code to Vercel
 * 
 * @param codeFiles - Generated code files from the replicator
 * @param assetFiles - Generated image assets
 * @param projectName - Name for the Vercel project
 * @param options - Deployment options
 * @returns Deployment result with preview URL
 */
export async function deployToVercel(
	codeFiles: GeneratedFile[],
	assetFiles: GeneratedAsset[],
	projectName: string,
	options: DeployOptions = {}
): Promise<VercelDeploymentResult> {
	const { onProgress, abortSignal, teamId, waitForReady = true } = options;
	
	// Get token
	const token = getVercelToken();
	
	// Sanitize project name
	const sanitizedName = projectName
		.toLowerCase()
		.replace(/[^a-z0-9-]/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '')
		.slice(0, 100) || 'replicated-site';

	// Convert files
	const filesToUpload: FileToUpload[] = [
		...generateConfigFiles(sanitizedName),
		...convertCodeFiles(codeFiles),
		...convertAssetFiles(assetFiles),
	];

	// Remap paths: move page.tsx to app/, components to app/components/
	const remappedFiles = filesToUpload.map(f => {
		let newPath = f.path;
		
		// Move page.tsx to app/page.tsx
		if (f.path === 'page.tsx') {
			newPath = 'app/page.tsx';
		}
		// Move components/* to app/components/*
		else if (f.path.startsWith('components/')) {
			newPath = `app/${f.path}`;
		}
		// Move styles/* to app/styles/*
		else if (f.path.startsWith('styles/')) {
			newPath = `app/${f.path}`;
		}
		
		return { ...f, path: newPath };
	});

	const totalFiles = remappedFiles.length;

	// Phase 1: Upload files
	onProgress?.({
		phase: 'uploading',
		filesUploaded: 0,
		totalFiles,
		currentFile: 'Starting upload...',
	});

	const uploadedFiles = await uploadFilesParallel(remappedFiles, token, {
		teamId,
		concurrency: 5,
		onProgress: (uploaded, total) => {
			onProgress?.({
				phase: 'uploading',
				filesUploaded: uploaded,
				totalFiles: total,
				currentFile: uploaded < total ? remappedFiles[uploaded]?.path : 'Complete',
			});
		},
		abortSignal,
	});

	// Phase 2: Create deployment
	onProgress?.({
		phase: 'creating',
		filesUploaded: totalFiles,
		totalFiles,
		currentFile: 'Creating deployment...',
	});

	const deployment = await createDeployment(
		uploadedFiles,
		{ projectName: sanitizedName, framework: 'nextjs', teamId },
		token
	);

	const previewUrl = `https://${deployment.url}`;

	// Phase 3: Wait for build (optional)
	if (waitForReady) {
		onProgress?.({
			phase: 'building',
			filesUploaded: totalFiles,
			totalFiles,
			deploymentUrl: previewUrl,
			deploymentId: deployment.id,
		});

		const finalStatus = await waitForDeployment(deployment.id, token, {
			teamId,
			onStatus: (status) => {
				onProgress?.({
					phase: vercelStateToPhase(status.readyState),
					filesUploaded: totalFiles,
					totalFiles,
					deploymentUrl: previewUrl,
					deploymentId: deployment.id,
				});
			},
			abortSignal,
		});

		onProgress?.({
			phase: 'ready',
			filesUploaded: totalFiles,
			totalFiles,
			deploymentUrl: previewUrl,
			deploymentId: deployment.id,
		});

		return {
			id: deployment.id,
			url: finalStatus.url,
			previewUrl: `https://${finalStatus.url}`,
			state: finalStatus.readyState,
			projectId: undefined,
			createdAt: deployment.createdAt,
			readyAt: finalStatus.ready,
		};
	}

	// Return immediately without waiting
	return {
		id: deployment.id,
		url: deployment.url,
		previewUrl,
		state: deployment.readyState,
		projectId: undefined,
		createdAt: deployment.createdAt,
	};
}

/**
 * Check if Vercel deployment is configured
 */
export function isVercelConfigured(): boolean {
	try {
		return !!import.meta.env.VITE_VERCEL_TOKEN;
	} catch {
		return false;
	}
}
