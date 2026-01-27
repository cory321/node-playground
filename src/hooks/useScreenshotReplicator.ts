import { useState, useRef, useCallback } from 'react';
import { ScreenshotReplicatorNodeData } from '@/types/nodes';
import {
	ReplicatorProgress,
	ReplicatorOutput,
	ScreenshotAnalysis,
	GeneratedAsset,
	createInitialReplicatorProgress,
} from '@/types/screenshotReplicator';
import {
	replicateScreenshot,
	analyzeOnly,
	regenerateCodeOnly,
} from '@/services/screenshotReplicator';
import { hasApiKey } from '@/api/llm/storage';

interface UseScreenshotReplicatorProps {
	nodeId: string;
	updateNode: (id: string, updates: Partial<ScreenshotReplicatorNodeData>) => void;
}

interface UseScreenshotReplicatorReturn {
	/** Run full replication (analysis + asset gen + code gen) */
	runReplication: (imageUrl: string) => Promise<void>;
	/** Run analysis only (for preview) */
	runAnalysis: (imageUrl: string) => Promise<void>;
	/** Regenerate code only, reusing existing analysis and assets */
	runCodeGenerationOnly: (imageUrl: string, analysis: ScreenshotAnalysis, existingAssets: GeneratedAsset[]) => Promise<void>;
	/** Stop the current operation */
	stop: () => void;
	/** Whether an operation is in progress */
	isRunning: boolean;
	/** Whether we're in analysis-only mode */
	isAnalyzing: boolean;
	/** Whether we're regenerating code only */
	isRegeneratingCode: boolean;
}

export function useScreenshotReplicator({
	nodeId,
	updateNode,
}: UseScreenshotReplicatorProps): UseScreenshotReplicatorReturn {
	const [isRunning, setIsRunning] = useState(false);
	const [isAnalyzing, setIsAnalyzing] = useState(false);
	const [isRegeneratingCode, setIsRegeneratingCode] = useState(false);
	const abortControllerRef = useRef<AbortController | null>(null);

	const runReplication = useCallback(
		async (imageUrl: string) => {
			if (isRunning) return;

			// Check for required API keys
			if (!hasApiKey('anthropic')) {
				updateNode(nodeId, {
					status: 'error',
					error: 'Anthropic API key required for screenshot analysis. Add it in Settings.',
				});
				return;
			}

			if (!hasApiKey('google')) {
				updateNode(nodeId, {
					status: 'error',
					error: 'Google AI API key required for image generation. Add it in Settings.',
				});
				return;
			}

			// Create abort controller
			abortControllerRef.current = new AbortController();

			setIsRunning(true);
			updateNode(nodeId, {
				status: 'loading',
				error: null,
				progress: createInitialReplicatorProgress(),
			});

			try {
				// Progress callback - also saves partial results as they complete
				const onProgress = (progress: ReplicatorProgress) => {
					// Check if aborted before updating
					if (abortControllerRef.current?.signal.aborted) {
						return;
					}
					
					// Build update object
					const update: Partial<ScreenshotReplicatorNodeData> = {
						progress: {
							phase: progress.phase,
							currentPass: progress.currentPass,
							passesComplete: progress.passesComplete,
							totalPasses: progress.totalPasses,
							currentAsset: progress.currentAsset,
							assetsGenerated: progress.assetsGenerated,
							totalAssets: progress.totalAssets,
							currentSection: progress.currentSection,
							sectionsGenerated: progress.sectionsGenerated,
							totalSections: progress.totalSections,
							currentFile: progress.currentFile,
							filesGenerated: progress.filesGenerated,
							bytesGenerated: progress.bytesGenerated,
						},
					};
					
					// Save partial analysis immediately when available
					if (progress.partialAnalysis) {
						update.analysis = progress.partialAnalysis;
						update.lastAnalyzedAt = progress.partialAnalysis.meta.analyzedAt;
					}
					
					updateNode(nodeId, update);
				};

				// Run replication
				const output = await replicateScreenshot(imageUrl, {
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
					analysis: output.analysis,
					lastAnalyzedAt: output.analysis.meta.analyzedAt,
					lastGeneratedAt: output.metadata.generatedAt,
					error: null,
					progress: {
						phase: 'complete',
						passesComplete: 6,
						totalPasses: 6,
						assetsGenerated: output.metadata.assetsGenerated,
						totalAssets: output.metadata.assetsGenerated,
						sectionsGenerated: output.metadata.sectionsReplicated,
						totalSections: output.metadata.sectionsReplicated,
						filesGenerated: output.metadata.totalFiles,
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
						progress: createInitialReplicatorProgress(),
					});
					return;
				}

				const errorMessage =
					error instanceof Error ? error.message : 'Unknown error';
				console.error('Screenshot replication error:', error);

				// Preserve any partial results (don't wipe output or analysis)
				updateNode(nodeId, {
					status: 'error',
					error: errorMessage,
					// Don't set output: null - keep any partial results
				});
			} finally {
				setIsRunning(false);
				abortControllerRef.current = null;
			}
		},
		[nodeId, updateNode, isRunning]
	);

	const runAnalysis = useCallback(
		async (imageUrl: string) => {
			if (isRunning) return;

			// Check for required API key
			if (!hasApiKey('anthropic')) {
				updateNode(nodeId, {
					status: 'error',
					error: 'Anthropic API key required for screenshot analysis. Add it in Settings.',
				});
				return;
			}

			// Create abort controller
			abortControllerRef.current = new AbortController();

			setIsRunning(true);
			setIsAnalyzing(true);
			updateNode(nodeId, {
				status: 'loading',
				error: null,
				progress: createInitialReplicatorProgress(),
			});

			try {
				// Progress callback
				const onProgress = (progress: ReplicatorProgress) => {
					if (abortControllerRef.current?.signal.aborted) {
						return;
					}
					updateNode(nodeId, {
						progress: {
							phase: progress.phase,
							currentPass: progress.currentPass,
							passesComplete: progress.passesComplete,
							totalPasses: progress.totalPasses,
							assetsGenerated: 0,
							totalAssets: progress.totalAssets,
							sectionsGenerated: 0,
							totalSections: progress.totalSections,
							filesGenerated: 0,
							bytesGenerated: 0,
						},
					});
				};

				// Run analysis only
				const analysis = await analyzeOnly(imageUrl, {
					onProgress,
					abortSignal: abortControllerRef.current.signal,
				});

				// Check if aborted
				if (abortControllerRef.current?.signal.aborted) {
					return;
				}

				// Update node with analysis results
				updateNode(nodeId, {
					status: 'success',
					analysis,
					lastAnalyzedAt: analysis.meta.analyzedAt,
					error: null,
					progress: {
						phase: 'complete',
						passesComplete: 6,
						totalPasses: 6,
						assetsGenerated: 0,
						totalAssets: analysis.assets.length,
						sectionsGenerated: 0,
						totalSections: analysis.sections.length,
						filesGenerated: 0,
						bytesGenerated: 0,
					},
				});
			} catch (error) {
				if (abortControllerRef.current?.signal.aborted) {
					return;
				}

				if ((error as Error).name === 'AbortError') {
					updateNode(nodeId, {
						status: 'idle',
						error: null,
						progress: createInitialReplicatorProgress(),
					});
					return;
				}

				const errorMessage =
					error instanceof Error ? error.message : 'Unknown error';
				console.error('Screenshot analysis error:', error);

				updateNode(nodeId, {
					status: 'error',
					error: errorMessage,
					analysis: null,
				});
			} finally {
				setIsRunning(false);
				setIsAnalyzing(false);
				abortControllerRef.current = null;
			}
		},
		[nodeId, updateNode, isRunning]
	);

	const runCodeGenerationOnly = useCallback(
		async (imageUrl: string, analysis: ScreenshotAnalysis, existingAssets: GeneratedAsset[]) => {
			if (isRunning) return;

			// Check for required API key (only Anthropic needed for code gen)
			if (!hasApiKey('anthropic')) {
				updateNode(nodeId, {
					status: 'error',
					error: 'Anthropic API key required for code generation. Add it in Settings.',
				});
				return;
			}

			// Create abort controller
			abortControllerRef.current = new AbortController();

			setIsRunning(true);
			setIsRegeneratingCode(true);
			updateNode(nodeId, {
				status: 'loading',
				error: null,
				progress: {
					...createInitialReplicatorProgress(),
					// Mark analysis and assets as already complete
					passesComplete: 6,
					totalPasses: 6,
					assetsGenerated: existingAssets.length,
					totalAssets: existingAssets.length,
					totalSections: analysis.sections.length,
				},
			});

			try {
				// Progress callback
				const onProgress = (progress: ReplicatorProgress) => {
					if (abortControllerRef.current?.signal.aborted) {
						return;
					}
					updateNode(nodeId, {
						progress: {
							phase: progress.phase,
							currentPass: progress.currentPass,
							passesComplete: progress.passesComplete,
							totalPasses: progress.totalPasses,
							currentAsset: progress.currentAsset,
							assetsGenerated: progress.assetsGenerated,
							totalAssets: progress.totalAssets,
							currentSection: progress.currentSection,
							sectionsGenerated: progress.sectionsGenerated,
							totalSections: progress.totalSections,
							currentFile: progress.currentFile,
							filesGenerated: progress.filesGenerated,
							bytesGenerated: progress.bytesGenerated,
						},
					});
				};

				// Run code generation only (reuse existing analysis and assets)
				const output = await regenerateCodeOnly(imageUrl, analysis, existingAssets, {
					onProgress,
					abortSignal: abortControllerRef.current.signal,
				});

				// Check if aborted
				if (abortControllerRef.current?.signal.aborted) {
					return;
				}

				// Update node with new code but preserve existing assets
				updateNode(nodeId, {
					status: 'success',
					output,
					// Keep existing analysis
					lastGeneratedAt: output.metadata.generatedAt,
					error: null,
					progress: {
						phase: 'complete',
						passesComplete: 6,
						totalPasses: 6,
						assetsGenerated: existingAssets.length,
						totalAssets: existingAssets.length,
						sectionsGenerated: output.metadata.sectionsReplicated,
						totalSections: output.metadata.sectionsReplicated,
						filesGenerated: output.metadata.totalFiles,
						bytesGenerated: output.metadata.totalBytes,
					},
				});
			} catch (error) {
				if (abortControllerRef.current?.signal.aborted) {
					return;
				}

				if ((error as Error).name === 'AbortError') {
					updateNode(nodeId, {
						status: 'idle',
						error: null,
						progress: createInitialReplicatorProgress(),
					});
					return;
				}

				const errorMessage =
					error instanceof Error ? error.message : 'Unknown error';
				console.error('Code regeneration error:', error);

				// Preserve any existing output and analysis on error
				updateNode(nodeId, {
					status: 'error',
					error: errorMessage,
				});
			} finally {
				setIsRunning(false);
				setIsRegeneratingCode(false);
				abortControllerRef.current = null;
			}
		},
		[nodeId, updateNode, isRunning]
	);

	const stop = useCallback(() => {
		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
			abortControllerRef.current = null;
		}
		setIsRunning(false);
		setIsAnalyzing(false);
		setIsRegeneratingCode(false);
		updateNode(nodeId, {
			status: 'idle',
			error: null,
			progress: createInitialReplicatorProgress(),
		});
	}, [nodeId, updateNode]);

	return {
		runReplication,
		runAnalysis,
		runCodeGenerationOnly,
		stop,
		isRunning,
		isAnalyzing,
		isRegeneratingCode,
	};
}

export default useScreenshotReplicator;
