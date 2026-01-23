import { useState, useRef, useCallback } from 'react';
import { BrandDesignNodeData, BrandDesignProgress, BrandDesignPhase } from '@/types/nodes';
import { BrandDesignOutput, ExtractionProgress } from '@/types/brandDesign';
import { extractBrandDesign } from '@/api/brandDesign';
import { hasApiKey } from '@/api/llm';

interface UseBrandDesignExtractorProps {
	nodeId: string;
	updateNode: (id: string, updates: Partial<BrandDesignNodeData>) => void;
}

interface UseBrandDesignExtractorReturn {
	runExtraction: (screenshotUrl: string) => Promise<void>;
	stopExtraction: () => void;
	isExtracting: boolean;
	hasAnthropicKey: boolean;
}

export function useBrandDesignExtractor({
	nodeId,
	updateNode,
}: UseBrandDesignExtractorProps): UseBrandDesignExtractorReturn {
	const [isExtracting, setIsExtracting] = useState(false);
	const abortRef = useRef<{ current: boolean }>({ current: false });

	// Check for Anthropic API key
	const hasAnthropicKey = hasApiKey('anthropic');

	const runExtraction = useCallback(
		async (screenshotUrl: string) => {
			if (isExtracting) return;

			// Check for API key
			if (!hasAnthropicKey) {
				updateNode(nodeId, {
					status: 'error',
					error: 'Anthropic API key required for vision extraction. Add it in Settings.',
				});
				return;
			}

			// Reset abort flag
			abortRef.current = { current: false };

			setIsExtracting(true);
			updateNode(nodeId, {
				status: 'loading',
				error: null,
				inputScreenshotUrl: screenshotUrl,
				progress: {
					phase: 'preparing',
					passesComplete: 0,
					totalPasses: 3,
				},
			});

			try {
				// Run extraction with progress tracking
				const output = await extractBrandDesign(
					screenshotUrl,
					(progress: ExtractionProgress) => {
						// Check if aborted
						if (abortRef.current.current) {
							throw new Error('Extraction cancelled');
						}

						// Map ExtractionProgress to BrandDesignProgress
						const nodeProgress: BrandDesignProgress = {
							phase: progress.phase as BrandDesignPhase,
							passesComplete: progress.passesComplete,
							totalPasses: 3,
							currentPassName: progress.currentPassName,
						};

						updateNode(nodeId, {
							progress: nodeProgress,
						});
					}
				);

				// Check if aborted
				if (abortRef.current.current) {
					updateNode(nodeId, {
						status: 'idle',
						error: null,
						progress: {
							phase: 'preparing',
							passesComplete: 0,
							totalPasses: 3,
						},
					});
					return;
				}

				// Success
				updateNode(nodeId, {
					status: 'success',
					error: null,
					output: output as unknown,
					progress: {
						phase: 'complete',
						passesComplete: 3,
						totalPasses: 3,
					},
					lastExtractedAt: Date.now(),
				});
			} catch (error) {
				// Don't set error if aborted
				if (abortRef.current.current) {
					updateNode(nodeId, {
						status: 'idle',
						error: null,
					});
					return;
				}

				const message = error instanceof Error ? error.message : 'Unknown error';
				updateNode(nodeId, {
					status: 'error',
					error: message,
				});
			} finally {
				setIsExtracting(false);
			}
		},
		[nodeId, updateNode, isExtracting, hasAnthropicKey]
	);

	const stopExtraction = useCallback(() => {
		if (abortRef.current) {
			abortRef.current.current = true;
		}
		setIsExtracting(false);
		updateNode(nodeId, {
			status: 'idle',
			error: null,
		});
	}, [nodeId, updateNode]);

	return {
		runExtraction,
		stopExtraction,
		isExtracting,
		hasAnthropicKey,
	};
}
