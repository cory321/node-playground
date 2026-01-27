import { useState, useRef, useCallback } from 'react';
import { CodeGenerationNodeData } from '@/types/nodes';
import {
	CodeGenInputs,
	CodeGenerationProgress,
	createInitialProgress,
} from '@/types/codeGeneration';
import { generateNextjsSite } from '@/services/codeGeneration';

interface UseCodeGeneratorProps {
	nodeId: string;
	updateNode: (id: string, updates: Partial<CodeGenerationNodeData>) => void;
}

interface GenerationOptions {
	includeReadme?: boolean;
	useLLM?: boolean;
	generateImages?: boolean;
}

interface UseCodeGeneratorReturn {
	runGeneration: (inputs: CodeGenInputs, options?: GenerationOptions) => Promise<void>;
	stopGeneration: () => void;
	isGenerating: boolean;
}

export function useCodeGenerator({
	nodeId,
	updateNode,
}: UseCodeGeneratorProps): UseCodeGeneratorReturn {
	const [isGenerating, setIsGenerating] = useState(false);
	const abortControllerRef = useRef<AbortController | null>(null);

	const runGeneration = useCallback(
		async (inputs: CodeGenInputs, options: GenerationOptions = {}) => {
			if (isGenerating) return;

			// Create abort controller
			abortControllerRef.current = new AbortController();

			setIsGenerating(true);
			updateNode(nodeId, {
				status: 'loading',
				error: null,
				progress: createInitialProgress(),
			});

			try {
				// Progress callback
				const onProgress = (progress: CodeGenerationProgress) => {
					// Check if aborted before updating
					if (abortControllerRef.current?.signal.aborted) {
						return;
					}
					updateNode(nodeId, { progress });
				};

				// Generate the codebase with options
				const output = await generateNextjsSite(inputs, {
					onProgress,
					abortSignal: abortControllerRef.current.signal,
					includeReadme: options.includeReadme ?? true,
					useLLM: options.useLLM ?? false,
					generateImages: options.generateImages ?? false,
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
						currentFile: null,
						filesGenerated: output.files.length,
						totalFiles: output.files.length,
						bytesGenerated: output.metadata.totalBytes,
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
						progress: createInitialProgress(),
					});
					return;
				}

				const errorMessage =
					error instanceof Error ? error.message : 'Unknown error';
				console.error('Code generation error:', error);

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
			progress: createInitialProgress(),
		});
	}, [nodeId, updateNode]);

	return {
		runGeneration,
		stopGeneration,
		isGenerating,
	};
}

export default useCodeGenerator;
