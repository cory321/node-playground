import { useState, useRef, useCallback } from 'react';
import { ComparisonDataNodeData } from '@/types/nodes';
import {
	ComparisonDataInput,
	ComparisonDataConfig,
	ComparisonDataGenerationProgress,
} from '@/types/comparisonPage';
import {
	generateComparisonData,
	hasSupabaseConfig,
} from '@/api/comparisonData';

interface UseComparisonDataGeneratorProps {
	nodeId: string;
	updateNode: (id: string, updates: Partial<ComparisonDataNodeData>) => void;
}

interface UseComparisonDataGeneratorReturn {
	runGeneration: (
		input: ComparisonDataInput,
		config: ComparisonDataConfig,
	) => Promise<void>;
	stopGeneration: () => void;
	isGenerating: boolean;
	hasSupabase: boolean;
}

export function useComparisonDataGenerator({
	nodeId,
	updateNode,
}: UseComparisonDataGeneratorProps): UseComparisonDataGeneratorReturn {
	const [isGenerating, setIsGenerating] = useState(false);
	const abortControllerRef = useRef<AbortController | null>(null);

	const hasSupabase = hasSupabaseConfig();

	const runGeneration = useCallback(
		async (input: ComparisonDataInput, config: ComparisonDataConfig) => {
			if (isGenerating) return;

			// Create abort controller
			abortControllerRef.current = new AbortController();

			setIsGenerating(true);
			updateNode(nodeId, {
				status: 'loading',
				error: null,
				progress: {
					phase: 'preparing',
					currentStep: 'Initializing...',
					completedSteps: 0,
					totalSteps: 0,
				},
			});

			try {
				// Progress callback
				const onProgress = (progress: ComparisonDataGenerationProgress) => {
					// Check if aborted before updating
					if (abortControllerRef.current?.signal.aborted) {
						return;
					}
					updateNode(nodeId, { progress });
				};

				// Generate the comparison data
				const output = await generateComparisonData(input, config, {
					onProgress,
					abortSignal: abortControllerRef.current.signal,
				});

				// Check if aborted
				if (abortControllerRef.current?.signal.aborted) {
					return;
				}

				// Update node with results
				updateNode(nodeId, {
					status: 'success',
					output,
					lastGeneratedAt: Date.now(),
					error: null,
					progress: {
						phase: 'complete',
						currentStep: 'Generation complete',
						completedSteps:
							output.comparisonPages.length + output.pricingPages.length + 1,
						totalSteps:
							output.comparisonPages.length + output.pricingPages.length + 1,
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
							currentStep: null,
							completedSteps: 0,
							totalSteps: 0,
						},
					});
					return;
				}

				const errorMessage =
					error instanceof Error ? error.message : 'Unknown error';
				console.error('Comparison data generation error:', error);

				updateNode(nodeId, {
					status: 'error',
					error: errorMessage,
					output: null,
				});
			} finally {
				setIsGenerating(false);
				abortControllerRef.current = null;
			}
		},
		[nodeId, updateNode, isGenerating],
	);

	const stopGeneration = useCallback(() => {
		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
			abortControllerRef.current = null;
		}
		setIsGenerating(false);
		updateNode(nodeId, {
			status: 'idle',
			error: null,
			progress: {
				phase: 'preparing',
				currentStep: null,
				completedSteps: 0,
				totalSteps: 0,
			},
		});
	}, [nodeId, updateNode]);

	return {
		runGeneration,
		stopGeneration,
		isGenerating,
		hasSupabase,
	};
}

export default useComparisonDataGenerator;
