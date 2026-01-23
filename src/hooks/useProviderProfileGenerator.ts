import { useState, useRef, useCallback } from 'react';
import {
	ProviderProfileGeneratorNodeData,
	EditorialDepth,
	ProfileGenerationProgress,
} from '@/types/nodes';
import { EnrichedProvider } from '@/types/enrichedProvider';
import { LocalKnowledgeOutput } from '@/types/localKnowledge';
import { SitePlannerOutput } from '@/types/sitePlanner';
import { GeneratedProviderProfile } from '@/types/generatedProfile';
import {
	generateAllProfiles,
	hasSupabase as hasSupabaseConfig,
} from '@/api/providerProfile';

interface UseProviderProfileGeneratorProps {
	nodeId: string;
	updateNode: (
		id: string,
		updates: Partial<ProviderProfileGeneratorNodeData>
	) => void;
}

interface ProfileGeneratorInput {
	providers: EnrichedProvider[];
	blueprint: SitePlannerOutput;
	localKnowledge: LocalKnowledgeOutput;
}

interface ProfileGeneratorConfig {
	editorialDepth: EditorialDepth;
	includeComparison: boolean;
}

interface UseProviderProfileGeneratorReturn {
	runGeneration: (
		input: ProfileGeneratorInput,
		config: ProfileGeneratorConfig
	) => Promise<void>;
	stopGeneration: () => void;
	isGenerating: boolean;
	hasSupabase: boolean;
}

export function useProviderProfileGenerator({
	nodeId,
	updateNode,
}: UseProviderProfileGeneratorProps): UseProviderProfileGeneratorReturn {
	const [isGenerating, setIsGenerating] = useState(false);
	const abortRef = useRef<{ current: boolean }>({ current: false });

	const hasSupabase = hasSupabaseConfig();

	const runGeneration = useCallback(
		async (input: ProfileGeneratorInput, config: ProfileGeneratorConfig) => {
			if (isGenerating) return;

			// Reset abort flag
			abortRef.current = { current: false };

			setIsGenerating(true);
			updateNode(nodeId, {
				status: 'loading',
				error: null,
				progress: {
					currentProvider: null,
					currentIndex: 0,
					totalCount: input.providers.length,
					phase: 'preparing',
					completedProfiles: 0,
				},
			});

			try {
				// Generate all profiles with progress tracking
				const profiles = await generateAllProfiles(
					input.providers,
					input.blueprint,
					input.localKnowledge,
					config,
					{
						onProgress: (progress: ProfileGenerationProgress) => {
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
					output: profiles as unknown[],
					lastGeneratedAt: Date.now(),
					error: null,
					progress: {
						currentProvider: null,
						currentIndex: input.providers.length,
						totalCount: input.providers.length,
						phase: 'complete',
						completedProfiles: profiles.length,
					},
				});
			} catch (error) {
				// Check if aborted
				if (abortRef.current.current) {
					return;
				}

				const errorMessage =
					error instanceof Error ? error.message : 'Unknown error';
				console.error('Provider profile generation error:', error);

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
				currentProvider: null,
				currentIndex: 0,
				totalCount: 0,
				phase: 'preparing',
				completedProfiles: 0,
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

export default useProviderProfileGenerator;
