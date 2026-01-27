/**
 * useVercelDeploy Hook
 * React hook for managing Vercel deployment state
 */

import { useState, useCallback, useRef } from 'react';
import { GeneratedFile } from '@/types/codeGeneration';
import { GeneratedAsset } from '@/types/screenshotReplicator';
import {
	deployToVercel,
	isVercelConfigured,
	DeployProgress,
	VercelDeploymentResult,
	createInitialDeployProgress,
} from '@/services/vercelDeploy';

// ============================================================================
// TYPES
// ============================================================================

export interface UseVercelDeployReturn {
	/** Current deployment progress */
	progress: DeployProgress;
	/** Whether a deployment is in progress */
	isDeploying: boolean;
	/** Latest deployment result (null if not deployed) */
	result: VercelDeploymentResult | null;
	/** Whether Vercel is configured */
	isConfigured: boolean;
	/** Start a deployment */
	deploy: (
		codeFiles: GeneratedFile[],
		assetFiles: GeneratedAsset[],
		projectName?: string,
	) => Promise<VercelDeploymentResult>;
	/** Cancel the current deployment */
	cancel: () => void;
	/** Reset state */
	reset: () => void;
}

// ============================================================================
// HOOK
// ============================================================================

export function useVercelDeploy(): UseVercelDeployReturn {
	const [progress, setProgress] = useState<DeployProgress>(
		createInitialDeployProgress(),
	);
	const [isDeploying, setIsDeploying] = useState(false);
	const [result, setResult] = useState<VercelDeploymentResult | null>(null);

	const abortControllerRef = useRef<AbortController | null>(null);

	/**
	 * Start a deployment to Vercel
	 */
	const deploy = useCallback(
		async (
			codeFiles: GeneratedFile[],
			assetFiles: GeneratedAsset[],
			projectName?: string,
		): Promise<VercelDeploymentResult> => {
			// Check if already deploying
			if (isDeploying) {
				throw new Error('Deployment already in progress');
			}

			// Check configuration
			if (!isVercelConfigured()) {
				const error =
					'Vercel not configured. Set VITE_VERCEL_TOKEN environment variable.';
				setProgress({
					...createInitialDeployProgress(),
					phase: 'error',
					error,
				});
				throw new Error(error);
			}

			// Reset state
			setIsDeploying(true);
			setResult(null);
			setProgress(createInitialDeployProgress());

			// Create abort controller
			abortControllerRef.current = new AbortController();

			try {
				// Generate a unique project name if not provided
				const name = projectName || `replicated-${Date.now().toString(36)}`;

				const deploymentResult = await deployToVercel(
					codeFiles,
					assetFiles,
					name,
					{
						onProgress: setProgress,
						abortSignal: abortControllerRef.current.signal,
						waitForReady: true,
					},
				);

				setResult(deploymentResult);
				setIsDeploying(false);
				return deploymentResult;
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : 'Deployment failed';

				// Don't treat abort as an error
				if (
					errorMessage === 'Upload aborted' ||
					errorMessage === 'Deployment polling aborted'
				) {
					setProgress({
						...createInitialDeployProgress(),
						phase: 'idle',
					});
				} else {
					setProgress((prev) => ({
						...prev,
						phase: 'error',
						error: errorMessage,
					}));
				}

				setIsDeploying(false);
				throw error;
			} finally {
				abortControllerRef.current = null;
			}
		},
		[isDeploying],
	);

	/**
	 * Cancel the current deployment
	 */
	const cancel = useCallback(() => {
		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
			abortControllerRef.current = null;
		}
		setIsDeploying(false);
	}, []);

	/**
	 * Reset all state
	 */
	const reset = useCallback(() => {
		cancel();
		setProgress(createInitialDeployProgress());
		setResult(null);
	}, [cancel]);

	return {
		progress,
		isDeploying,
		result,
		isConfigured: isVercelConfigured(),
		deploy,
		cancel,
		reset,
	};
}

export default useVercelDeploy;
