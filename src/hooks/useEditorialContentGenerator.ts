import { useState, useRef, useCallback } from 'react';
import {
	EditorialContentGeneratorNodeData,
	EditorialContentGenerationProgress,
	EditorialPageType,
	EditorialQualityLevel,
	EditorialModelKey,
} from '@/types/nodes';
import { LocalKnowledgeOutput } from '@/types/localKnowledge';
import { SitePlannerOutput } from '@/types/sitePlanner';
import { CategoryAnalysisResult } from '@/types/nodes';
import { GeneratedEditorialContent } from '@/types/editorialContent';
import {
	generateAllEditorialContent,
	hasSupabase as hasSupabaseConfig,
} from '@/api/editorialContent';

interface UseEditorialContentGeneratorProps {
	nodeId: string;
	updateNode: (
		id: string,
		updates: Partial<EditorialContentGeneratorNodeData>
	) => void;
}

interface EditorialGeneratorInput {
	blueprint: SitePlannerOutput;
	localKnowledge: LocalKnowledgeOutput;
	serpData: CategoryAnalysisResult | null;
}

interface EditorialGeneratorConfig {
	contentTypes: EditorialPageType[];
	qualityLevel: EditorialQualityLevel;
	modelKey: EditorialModelKey;
}

interface UseEditorialContentGeneratorReturn {
	runGeneration: (
		input: EditorialGeneratorInput,
		config: EditorialGeneratorConfig
	) => Promise<void>;
	stopGeneration: () => void;
	isGenerating: boolean;
	hasSupabase: boolean;
}

export function useEditorialContentGenerator({
	nodeId,
	updateNode,
}: UseEditorialContentGeneratorProps): UseEditorialContentGeneratorReturn {
	const [isGenerating, setIsGenerating] = useState(false);
	const abortRef = useRef<{ current: boolean }>({ current: false });

	const hasSupabase = hasSupabaseConfig();

	const runGeneration = useCallback(
		async (
			input: EditorialGeneratorInput,
			config: EditorialGeneratorConfig
		) => {
			if (isGenerating) return;

			// Reset abort flag
			abortRef.current = { current: false };

			setIsGenerating(true);
			updateNode(nodeId, {
				status: 'loading',
				error: null,
				progress: {
					currentPage: null,
					currentIndex: 0,
					totalCount: 0,
					phase: 'preparing',
					completedPages: 0,
					currentSection: null,
				},
			});

			try {
				// Generate all editorial content with progress tracking
				const content = await generateAllEditorialContent(
					input.blueprint,
					input.localKnowledge,
					input.serpData,
					config,
					{
						onProgress: (progress: EditorialContentGenerationProgress) => {
							// Check if aborted
							if (abortRef.current.current) return;

							updateNode(nodeId, {
								progress,
							});
						},
						abortSignal: abortRef.current,
					}
				);

				// Check if aborted
				if (abortRef.current.current) {
					return;
				}

				// Update node with results
				updateNode(nodeId, {
					status: 'success',
					output: content as unknown,
					lastGeneratedAt: Date.now(),
					error: null,
					progress: {
						currentPage: null,
						currentIndex: content.pages.length,
						totalCount: content.pages.length,
						phase: 'complete',
						completedPages: content.pages.length,
						currentSection: null,
					},
				});
			} catch (error) {
				// Check if aborted
				if (abortRef.current.current) {
					return;
				}

				const errorMessage =
					error instanceof Error ? error.message : 'Unknown error';
				console.error('Editorial content generation error:', error);

				updateNode(nodeId, {
					status: 'error',
					error: errorMessage,
					output: null,
				});
			} finally {
				setIsGenerating(false);
			}
		},
		[nodeId, updateNode, isGenerating]
	);

	const stopGeneration = useCallback(() => {
		abortRef.current.current = true;
		setIsGenerating(false);
		updateNode(nodeId, {
			status: 'idle',
			error: null,
			progress: {
				currentPage: null,
				currentIndex: 0,
				totalCount: 0,
				phase: 'preparing',
				completedPages: 0,
				currentSection: null,
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

export default useEditorialContentGenerator;
