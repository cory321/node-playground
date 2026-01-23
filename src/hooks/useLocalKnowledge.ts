import { useCallback, useState, useRef } from 'react';
import { LocalKnowledgeNodeData } from '@/types/nodes';
import { LocalKnowledgeOutput, LocalKnowledgeInput } from '@/types/localKnowledge';
import { generateLocalKnowledge, isLocalKnowledgeAvailable } from '@/api/localKnowledge';

interface UseLocalKnowledgeProps {
	nodeId: string;
	updateNode: (id: string, updates: Partial<LocalKnowledgeNodeData>) => void;
}

interface UseLocalKnowledgeReturn {
	runGeneration: (input: LocalKnowledgeInput, bypassCache?: boolean) => Promise<void>;
	stopGeneration: () => void;
	isGenerating: boolean;
	hasSupabase: boolean;
}

export function useLocalKnowledge({
	nodeId,
	updateNode,
}: UseLocalKnowledgeProps): UseLocalKnowledgeReturn {
	const [isGenerating, setIsGenerating] = useState(false);
	const abortRef = useRef(false);

	const hasSupabase = isLocalKnowledgeAvailable();

	// Run local knowledge generation
	const runGeneration = useCallback(
		async (input: LocalKnowledgeInput, bypassCache: boolean = false) => {
			if (isGenerating || !hasSupabase) return;

			// Validate input
			if (!input.location.city || !input.location.state) {
				updateNode(nodeId, {
					status: 'error',
					error: 'Location (city and state) is required',
				});
				return;
			}

			if (!input.category) {
				updateNode(nodeId, {
					status: 'error',
					error: 'Category is required',
				});
				return;
			}

			setIsGenerating(true);
			abortRef.current = false;

			// Update node with inputs and loading state
			updateNode(nodeId, {
				status: 'loading',
				error: null,
				inputCity: input.location.city,
				inputCounty: input.location.county || null,
				inputState: input.location.state,
				inputCategory: input.category,
			});

			try {
				const result = await generateLocalKnowledge(input, bypassCache);

				// Check if aborted
				if (abortRef.current) return;

				if (result.success) {
					updateNode(nodeId, {
						status: 'success',
						output: result.data as unknown,
						lastGeneratedAt: Date.now(),
					});
				} else {
					// Partial success - we have data but there was an error
					updateNode(nodeId, {
						status: result.data.meta.confidence > 0 ? 'success' : 'error',
						output: result.data as unknown,
						error: result.error,
						lastGeneratedAt: Date.now(),
					});
				}
			} catch (err) {
				if (!abortRef.current) {
					updateNode(nodeId, {
						status: 'error',
						error: err instanceof Error ? err.message : 'Unknown error',
					});
				}
			} finally {
				setIsGenerating(false);
			}
		},
		[isGenerating, hasSupabase, nodeId, updateNode]
	);

	// Stop current generation
	const stopGeneration = useCallback(() => {
		abortRef.current = true;
		setIsGenerating(false);
		updateNode(nodeId, {
			status: 'idle',
		});
	}, [nodeId, updateNode]);

	return {
		runGeneration,
		stopGeneration,
		isGenerating,
		hasSupabase,
	};
}

export default useLocalKnowledge;
