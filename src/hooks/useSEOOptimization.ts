import { useState, useRef, useCallback } from 'react';
import { SEOOptimizationNodeData } from '@/types/nodes';
import {
	SEOOptimizationInput,
	SEOOptimizationConfig,
	SEOOptimizationProgress,
} from '@/types/seoPackage';
import { optimizeSEO, hasSupabaseConfig } from '@/api/seoOptimization';

interface UseSEOOptimizationProps {
	nodeId: string;
	updateNode: (id: string, updates: Partial<SEOOptimizationNodeData>) => void;
}

interface UseSEOOptimizationReturn {
	runOptimization: (
		input: SEOOptimizationInput,
		config: SEOOptimizationConfig,
	) => Promise<void>;
	stopOptimization: () => void;
	isOptimizing: boolean;
	hasSupabase: boolean;
}

export function useSEOOptimization({
	nodeId,
	updateNode,
}: UseSEOOptimizationProps): UseSEOOptimizationReturn {
	const [isOptimizing, setIsOptimizing] = useState(false);
	const abortControllerRef = useRef<AbortController | null>(null);

	const hasSupabase = hasSupabaseConfig();

	const runOptimization = useCallback(
		async (input: SEOOptimizationInput, config: SEOOptimizationConfig) => {
			if (isOptimizing) return;

			// Create abort controller
			abortControllerRef.current = new AbortController();

			setIsOptimizing(true);
			updateNode(nodeId, {
				status: 'loading',
				error: null,
				progress: {
					phase: 'preparing',
					currentPage: null,
					completedPages: 0,
					totalPages: 0,
					currentStep: 'Initializing...',
				},
			});

			try {
				// Progress callback
				const onProgress = (progress: SEOOptimizationProgress) => {
					// Check if aborted before updating
					if (abortControllerRef.current?.signal.aborted) {
						return;
					}
					updateNode(nodeId, { progress });
				};

				// Run the SEO optimization
				const output = await optimizeSEO(input, config, onProgress);

				// Check if aborted
				if (abortControllerRef.current?.signal.aborted) {
					return;
				}

				// Update node with results
				updateNode(nodeId, {
					status: 'success',
					output,
					lastOptimizedAt: Date.now(),
					error: null,
					progress: {
						phase: 'complete',
						currentPage: null,
						completedPages: output.pages.length,
						totalPages: output.pages.length,
						currentStep: 'Optimization complete',
					},
				});
			} catch (error) {
				// Check if aborted
				if (abortControllerRef.current?.signal.aborted) {
					return;
				}

				// Handle abort errors gracefully
				if ((error as Error).name === 'AbortError') {
					updateNode(nodeId, {
						status: 'idle',
						error: null,
						progress: {
							phase: 'preparing',
							currentPage: null,
							completedPages: 0,
							totalPages: 0,
							currentStep: null,
						},
					});
					return;
				}

				const errorMessage =
					error instanceof Error ? error.message : 'Unknown error';
				console.error('SEO optimization error:', error);

				updateNode(nodeId, {
					status: 'error',
					error: errorMessage,
					output: null,
				});
			} finally {
				setIsOptimizing(false);
				abortControllerRef.current = null;
			}
		},
		[nodeId, updateNode, isOptimizing],
	);

	const stopOptimization = useCallback(() => {
		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
			abortControllerRef.current = null;
		}
		setIsOptimizing(false);
		updateNode(nodeId, {
			status: 'idle',
			error: null,
			progress: {
				phase: 'preparing',
				currentPage: null,
				completedPages: 0,
				totalPages: 0,
				currentStep: null,
			},
		});
	}, [nodeId, updateNode]);

	return {
		runOptimization,
		stopOptimization,
		isOptimizing,
		hasSupabase,
	};
}

export default useSEOOptimization;
