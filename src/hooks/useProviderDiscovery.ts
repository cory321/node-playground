import { useCallback, useState, useRef } from 'react';
import {
	ProviderDiscoveryNodeData,
	ProviderData,
	ProviderDiscoveryProgress,
} from '@/types/nodes';
import { discoverProviders, hasProviderApiKey } from '@/api/providers';

interface UseProviderDiscoveryProps {
	nodeId: string;
	updateNode: (id: string, updates: Partial<ProviderDiscoveryNodeData>) => void;
	providerLimit?: number;
}

interface UseProviderDiscoveryReturn {
	runDiscovery: (
		category: string,
		city: string,
		state: string | null,
	) => Promise<void>;
	stopDiscovery: () => void;
	toggleContacted: (providerId: string) => void;
	isDiscovering: boolean;
	hasApiKey: boolean;
}

export function useProviderDiscovery({
	nodeId,
	updateNode,
	providerLimit = 10,
}: UseProviderDiscoveryProps): UseProviderDiscoveryReturn {
	const [isDiscovering, setIsDiscovering] = useState(false);
	const abortRef = useRef(false);

	const hasApiKey = hasProviderApiKey();

	// Reset progress
	const resetProgress = useCallback(() => {
		updateNode(nodeId, {
			progress: {
				currentSource: null,
				completed: false,
			},
			providers: [],
			error: null,
		});
	}, [nodeId, updateNode]);

	// Update progress
	const updateProgress = useCallback(
		(progress: Partial<ProviderDiscoveryProgress>) => {
			updateNode(nodeId, {
				progress: {
					currentSource: null,
					completed: false,
					...progress,
				} as ProviderDiscoveryProgress,
			});
		},
		[nodeId, updateNode],
	);

	// Run provider discovery
	const runDiscovery = useCallback(
		async (category: string, city: string, state: string | null) => {
			if (isDiscovering || !hasApiKey) return;

			setIsDiscovering(true);
			abortRef.current = false;
			resetProgress();

			updateNode(nodeId, {
				status: 'loading',
				inputCategory: category,
				inputCity: city,
				inputState: state,
			});

			updateProgress({
				currentSource: 'Google Local Pack',
			});

			try {
				// Fetch providers from SerpAPI (using Google Maps engine for more results)
				const result = await discoverProviders(
					category,
					city,
					state,
					false,
					providerLimit,
				);

				if (abortRef.current) return;

				if (result.error) {
					throw new Error(result.error);
				}

				updateNode(nodeId, {
					status: 'success',
					providers: result.providers,
					progress: {
						currentSource: null,
						completed: true,
					},
					lastDiscoveryAt: Date.now(),
				});
			} catch (err) {
				if (!abortRef.current) {
					updateNode(nodeId, {
						status: 'error',
						error: err instanceof Error ? err.message : 'Unknown error',
					});
				}
			} finally {
				setIsDiscovering(false);
			}
		},
		[
			isDiscovering,
			hasApiKey,
			nodeId,
			updateNode,
			resetProgress,
			updateProgress,
			providerLimit,
		],
	);

	// Stop current discovery
	const stopDiscovery = useCallback(() => {
		abortRef.current = true;
		setIsDiscovering(false);
		updateNode(nodeId, {
			status: 'idle',
			progress: {
				currentSource: null,
				completed: false,
			},
		});
	}, [nodeId, updateNode]);

	// Toggle contacted status for a provider
	const toggleContacted = useCallback(
		(providerId: string) => {
			updateNode(nodeId, {
				providers: undefined, // Will be handled in the callback
			});

			// We need to update providers array - get current node state
			// Since we can't directly access node state here, we'll use a special update pattern
			// The actual toggle will happen in the component that has access to node.providers
		},
		[nodeId, updateNode],
	);

	return {
		runDiscovery,
		stopDiscovery,
		toggleContacted,
		isDiscovering,
		hasApiKey,
	};
}

export default useProviderDiscovery;
