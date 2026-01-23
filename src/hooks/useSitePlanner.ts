import { useState, useRef, useCallback } from 'react';
import { SitePlannerNodeData, SiteDepth } from '@/types/nodes';
import { SitePlannerInput } from '@/types/sitePlanner';
import { generateSitePlan, hasSupabaseConfig } from '@/api/sitePlanner';

interface UseSitePlannerProps {
	nodeId: string;
	updateNode: (id: string, updates: Partial<SitePlannerNodeData>) => void;
}

interface UseSitePlannerReturn {
	runGeneration: (input: SitePlannerInput, depth: SiteDepth) => Promise<void>;
	stopGeneration: () => void;
	isGenerating: boolean;
	hasSupabase: boolean;
}

export function useSitePlanner({
	nodeId,
	updateNode,
}: UseSitePlannerProps): UseSitePlannerReturn {
	const [isGenerating, setIsGenerating] = useState(false);
	const abortControllerRef = useRef<AbortController | null>(null);

	const hasSupabase = hasSupabaseConfig();

	const runGeneration = useCallback(
		async (input: SitePlannerInput, depth: SiteDepth) => {
			if (isGenerating) return;

			// Create abort controller
			abortControllerRef.current = new AbortController();

			setIsGenerating(true);
			updateNode(nodeId, {
				status: 'loading',
				error: null,
			});

			try {
				// Generate the site plan
				const output = await generateSitePlan(input, depth);

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
				});
			} catch (error) {
				// Check if aborted
				if (abortControllerRef.current?.signal.aborted) {
					return;
				}

				const errorMessage =
					error instanceof Error ? error.message : 'Unknown error';
				console.error('Site planner generation error:', error);

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
		[nodeId, updateNode, isGenerating]
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
		});
	}, [nodeId, updateNode]);

	return {
		runGeneration,
		stopGeneration,
		isGenerating,
		hasSupabase,
	};
}

export default useSitePlanner;
