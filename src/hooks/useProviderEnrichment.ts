import { useCallback, useState, useRef } from 'react';
import {
	ProviderEnrichmentNodeData,
	ProviderEnrichmentProgress,
	ProviderData,
} from '@/types/nodes';
import { EnrichedProvider } from '@/types/enrichedProvider';
import { enrichAllProviders } from '@/api/enrichment';

interface UseProviderEnrichmentProps {
	nodeId: string;
	updateNode: (
		id: string,
		updates: Partial<ProviderEnrichmentNodeData>
	) => void;
}

interface EnrichmentOptions {
	skipWithoutWebsite?: boolean;
	discoverMissingWebsites?: boolean;
	city?: string;
	state?: string | null;
}

interface UseProviderEnrichmentReturn {
	runEnrichment: (
		providers: ProviderData[],
		options?: EnrichmentOptions
	) => Promise<void>;
	stopEnrichment: () => void;
	isEnriching: boolean;
	hasSupabase: boolean;
}

/**
 * Check if Supabase is configured
 */
function checkSupabase(): boolean {
	const url = import.meta.env.VITE_SUPABASE_URL;
	const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
	return Boolean(url && key);
}

export function useProviderEnrichment({
	nodeId,
	updateNode,
}: UseProviderEnrichmentProps): UseProviderEnrichmentReturn {
	const [isEnriching, setIsEnriching] = useState(false);
	const abortRef = useRef(false);

	const hasSupabase = checkSupabase();

	// Reset progress
	const resetProgress = useCallback(() => {
		updateNode(nodeId, {
			progress: {
				currentProvider: null,
				currentIndex: 0,
				totalCount: 0,
				completed: false,
				phase: null,
				discoveredCount: 0,
			},
			enrichedProviders: [],
			error: null,
		});
	}, [nodeId, updateNode]);

	// Update progress
	const updateProgress = useCallback(
		(progress: Partial<ProviderEnrichmentProgress>) => {
			updateNode(nodeId, {
				progress: {
					currentProvider: null,
					currentIndex: 0,
					totalCount: 0,
					completed: false,
					phase: null,
					discoveredCount: 0,
					...progress,
				} as ProviderEnrichmentProgress,
			});
		},
		[nodeId, updateNode]
	);

	// Run provider enrichment
	const runEnrichment = useCallback(
		async (providers: ProviderData[], options?: EnrichmentOptions) => {
			const {
				skipWithoutWebsite = false,
				discoverMissingWebsites = true,
				city,
				state,
			} = options || {};

			if (isEnriching || !hasSupabase) return;
			if (providers.length === 0) {
				updateNode(nodeId, {
					status: 'error',
					error: 'No providers to enrich',
				});
				return;
			}

			setIsEnriching(true);
			abortRef.current = false;
			resetProgress();

			updateNode(nodeId, {
				status: 'loading',
				inputProviders: providers,
				skipWithoutWebsite,
				discoverMissingWebsites,
			});

			// Calculate initial total based on mode
			const providersWithWebsite = providers.filter((p) => p.website).length;
			const providersWithoutWebsite = providers.length - providersWithWebsite;

			// If discovering, we'll process all providers
			// If not discovering and skipping, only those with websites
			const initialTotal = discoverMissingWebsites
				? providers.length
				: skipWithoutWebsite
				? providersWithWebsite
				: providers.length;

			updateProgress({
				totalCount: initialTotal,
				phase: discoverMissingWebsites && providersWithoutWebsite > 0 ? 'discovery' : 'enrichment',
			});

			try {
				const enrichedProviders = await enrichAllProviders(providers, {
					skipWithoutWebsite,
					discoverMissingWebsites,
					city,
					state,
					abortSignal: abortRef,
					onProgress: (progress) => {
						if (!abortRef.current) {
							updateProgress({
								currentProvider: progress.currentProvider,
								currentIndex: progress.currentIndex,
								totalCount: progress.totalCount,
								phase: progress.phase,
								discoveredCount: progress.discoveredCount,
							});
						}
					},
				});

				if (abortRef.current) return;

				// Calculate final discovered count
				const finalDiscoveredCount = enrichedProviders.filter(
					(p) =>
						p.websiteDiscovery?.discoverySource === 'serp_organic' ||
						p.websiteDiscovery?.discoverySource === 'phone_lookup'
				).length;

				updateNode(nodeId, {
					status: 'success',
					enrichedProviders: enrichedProviders as unknown as EnrichedProvider[],
					progress: {
						currentProvider: null,
						currentIndex: enrichedProviders.length,
						totalCount: enrichedProviders.length,
						completed: true,
						phase: null,
						discoveredCount: finalDiscoveredCount,
					},
					lastEnrichmentAt: Date.now(),
				});
			} catch (err) {
				if (!abortRef.current) {
					updateNode(nodeId, {
						status: 'error',
						error: err instanceof Error ? err.message : 'Unknown error',
					});
				}
			} finally {
				setIsEnriching(false);
			}
		},
		[
			isEnriching,
			hasSupabase,
			nodeId,
			updateNode,
			resetProgress,
			updateProgress,
		]
	);

	// Stop current enrichment
	const stopEnrichment = useCallback(() => {
		abortRef.current = true;
		setIsEnriching(false);
		updateNode(nodeId, {
			status: 'idle',
			progress: {
				currentProvider: null,
				currentIndex: 0,
				totalCount: 0,
				completed: false,
				phase: null,
				discoveredCount: 0,
			},
		});
	}, [nodeId, updateNode]);

	return {
		runEnrichment,
		stopEnrichment,
		isEnriching,
		hasSupabase,
	};
}

export default useProviderEnrichment;
