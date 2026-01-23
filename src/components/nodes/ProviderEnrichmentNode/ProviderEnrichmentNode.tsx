import React, { useCallback, useMemo } from 'react';
import {
	Sparkles,
	Play,
	Square,
	AlertCircle,
	Link2Off,
	Database,
} from 'lucide-react';
import {
	ProviderEnrichmentNodeData,
	ProviderData,
	HoveredPort,
} from '@/types/nodes';
import { EnrichedProvider } from '@/types/enrichedProvider';
import { BaseNode } from '../base';
import {
	EnrichedProviderTable,
	MissingWebsitesList,
} from './EnrichedProviderTable';
import { EnrichmentProgress } from './EnrichmentProgress';
import { useProviderEnrichment } from '@/hooks/useProviderEnrichment';
import { calculateEnrichmentStats } from '@/api/enrichment';

interface ProviderEnrichmentNodeProps {
	node: ProviderEnrichmentNodeData;
	updateNode: (
		id: string,
		updates: Partial<ProviderEnrichmentNodeData>,
	) => void;
	deleteNode: (id: string) => void;
	onMouseDown: (e: React.MouseEvent) => void;
	onResizeStart: (e: React.MouseEvent) => void;
	editingTitleId: string | null;
	setEditingTitleId: (id: string | null) => void;
	isConnectedInput: boolean;
	isConnectedOutput: boolean;
	hoveredPort: HoveredPort | null;
	setHoveredPort: (port: HoveredPort | null) => void;
	onInputPortMouseDown: (e: React.MouseEvent) => void;
	onInputPortMouseUp: () => void;
	onOutputPortMouseDown: (e: React.MouseEvent) => void;
	onOutputPortMouseUp: () => void;
	connectingFrom: string | null;
	connectingTo: string | null;
	incomingData: {
		providers: ProviderData[];
		category?: string;
		city?: string;
		state?: string | null;
	} | null;
}

export function ProviderEnrichmentNode({
	node,
	updateNode,
	deleteNode,
	onMouseDown,
	onResizeStart,
	editingTitleId,
	setEditingTitleId,
	isConnectedInput,
	isConnectedOutput,
	hoveredPort,
	setHoveredPort,
	onInputPortMouseDown,
	onInputPortMouseUp,
	onOutputPortMouseDown,
	onOutputPortMouseUp,
	connectingFrom,
	connectingTo,
	incomingData,
}: ProviderEnrichmentNodeProps) {
	// Provider enrichment hook
	const { runEnrichment, stopEnrichment, isEnriching, hasSupabase } =
		useProviderEnrichment({
			nodeId: node.id,
			updateNode,
		});

	// Get manual websites from node data (with fallback for existing nodes)
	const manualWebsites = node.manualWebsites ?? {};

	// Handle manual website update
	const handleWebsiteUpdate = useCallback(
		(providerId: string, website: string | null) => {
			const updated = { ...manualWebsites };
			if (website) {
				updated[providerId] = website;
			} else {
				delete updated[providerId];
			}
			updateNode(node.id, { manualWebsites: updated });
		},
		[node.id, manualWebsites, updateNode],
	);

	// Merge incoming providers with manual website overrides
	const providersWithOverrides = useMemo(() => {
		if (!incomingData?.providers) return [];
		return incomingData.providers.map((p) => ({
			...p,
			website: manualWebsites[p.id] || p.website,
		}));
	}, [incomingData?.providers, manualWebsites]);

	// Handle run button - enrich providers with websites (original or manual)
	const handleRun = () => {
		if (providersWithOverrides.length === 0) return;

		// Run enrichment with merged provider data
		runEnrichment(providersWithOverrides, {
			skipWithoutWebsite: true,
			discoverMissingWebsites: false,
			city: incomingData?.city,
			state: incomingData?.state,
		});
	};

	const isLoading = node.status === 'loading';
	const hasError = node.status === 'error';
	const hasResults =
		node.status === 'success' && node.enrichedProviders.length > 0;

	// Get enrichment stats for summary
	const stats = hasResults
		? calculateEnrichmentStats(node.enrichedProviders as EnrichedProvider[])
		: null;

	// Count providers with websites (original + manual)
	const providersWithWebsite = providersWithOverrides.filter(
		(p) => p.website,
	).length;
	const providersWithoutWebsite =
		providersWithOverrides.length - providersWithWebsite;
	const totalProviders = incomingData?.providers?.length || 0;

	// Count how many are manually added
	const manuallyAddedCount = Object.keys(manualWebsites).filter((id) =>
		incomingData?.providers?.some((p) => p.id === id && !p.website),
	).length;

	// Determine if run button should be enabled - only if we have providers with websites
	const canRun = hasSupabase && providersWithWebsite > 0;

	// Loading overlay - enrichment only (no discovery phase)
	const loadingOverlay = (
		<div className="absolute inset-0 z-40 bg-slate-900/80 backdrop-blur-sm rounded-2xl flex items-center justify-center">
			<div className="flex flex-col items-center gap-3">
				<div className="relative">
					<div className="w-12 h-12 rounded-full border-2 border-transparent animate-spin border-t-purple-500 border-r-violet-500" />
					<Sparkles
						size={20}
						className="absolute inset-0 m-auto text-purple-400"
					/>
				</div>
				<div className="text-center">
					<span className="text-[10px] uppercase tracking-[0.2em] font-mono block text-purple-300">
						{node.progress.currentProvider
							? `Enriching: ${node.progress.currentProvider}`
							: 'Starting enrichment...'}
					</span>
					<span className="text-[10px] text-slate-500 font-mono block mt-1">
						{node.progress.currentIndex} / {node.progress.totalCount}
					</span>
				</div>
			</div>
		</div>
	);

	return (
		<BaseNode
			node={node}
			icon={<Sparkles size={14} className="text-purple-400" />}
			isEditingTitle={editingTitleId === node.id}
			onTitleChange={(title) => updateNode(node.id, { title })}
			onEditTitleStart={() => setEditingTitleId(node.id)}
			onEditTitleEnd={() => setEditingTitleId(null)}
			onDelete={() => deleteNode(node.id)}
			onMouseDown={onMouseDown}
			onResizeStart={onResizeStart}
			hasInputPort={true}
			hasOutputPort={true}
			isConnectedInput={isConnectedInput}
			isConnectedOutput={isConnectedOutput}
			hoveredPort={hoveredPort}
			setHoveredPort={setHoveredPort}
			onInputPortMouseDown={onInputPortMouseDown}
			onInputPortMouseUp={onInputPortMouseUp}
			onOutputPortMouseDown={onOutputPortMouseDown}
			onOutputPortMouseUp={onOutputPortMouseUp}
			connectingFrom={connectingFrom}
			connectingTo={connectingTo}
			status={node.status}
			isLoading={isLoading}
			loadingOverlay={loadingOverlay}
			borderClass={
				isLoading
					? 'border-purple-500/50 shadow-purple-500/20'
					: hasError
						? 'border-red-500/50'
						: 'border-slate-700/50'
			}
			hoverBorderClass="group-hover:border-purple-500/30"
			resizeHoverColor="hover:text-purple-400"
		>
			{/* Supabase Warning */}
			{!hasSupabase && (
				<div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
					<AlertCircle size={14} className="text-amber-400 shrink-0" />
					<span className="text-xs text-amber-300">
						Supabase not configured. Enrichment requires edge functions.
					</span>
				</div>
			)}

			{/* Input Status */}
			{!incomingData?.providers || incomingData.providers.length === 0 ? (
				<div className="flex items-center gap-2 px-3 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg">
					<Link2Off size={14} className="text-slate-500" />
					<span className="text-xs text-slate-500">
						Connect a Provider Discovery Node to enrich providers
					</span>
				</div>
			) : (
				<>
					{/* Provider Count Display */}
					<div className="px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<Database size={12} className="text-purple-400" />
								<span className="text-xs text-slate-300">
									{totalProviders} providers from upstream
								</span>
							</div>
							<div className="flex items-center gap-2 text-[10px] font-mono">
								<span className="text-emerald-400">
									{providersWithWebsite} with websites
									{manuallyAddedCount > 0 && (
										<span className="text-cyan-400 ml-1">
											({manuallyAddedCount} manual)
										</span>
									)}
								</span>
								{providersWithoutWebsite > 0 && (
									<span className="text-amber-400">
										{providersWithoutWebsite} missing
									</span>
								)}
							</div>
						</div>
					</div>

					{/* Category/Location from upstream */}
					{(incomingData.category || incomingData.city) && (
						<div className="px-3 py-2 bg-purple-500/10 border border-purple-500/20 rounded-lg">
							<div className="flex items-center gap-2 flex-wrap text-[10px]">
								{incomingData.category && (
									<span className="text-purple-200">
										{incomingData.category}
									</span>
								)}
								{incomingData.city && (
									<span className="text-purple-300/70">
										in {incomingData.city}
										{incomingData.state && `, ${incomingData.state}`}
									</span>
								)}
							</div>
						</div>
					)}

					{/* Missing Websites List - Manual Search & Entry */}
					<MissingWebsitesList
						providers={incomingData.providers}
						manualWebsites={manualWebsites}
						onWebsiteUpdate={handleWebsiteUpdate}
					/>

					{/* Progress (when loading) */}
					{isLoading && !node.progress.completed && (
						<EnrichmentProgress
							progress={node.progress}
							isDiscoveryPhase={false}
						/>
					)}

					{/* Run/Stop Button */}
					<div className="flex gap-2">
						{isEnriching ? (
							<button
								onClick={stopEnrichment}
								className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30 transition-all"
							>
								<Square size={14} />
								Stop
							</button>
						) : (
							<button
								onClick={handleRun}
								disabled={!canRun}
								className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
									!canRun
										? 'bg-slate-800 text-slate-500 cursor-not-allowed'
										: 'bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white shadow-lg shadow-purple-500/20'
								}`}
							>
								<Play size={14} />
								Enrich {providersWithWebsite} Provider
								{providersWithWebsite !== 1 ? 's' : ''}
							</button>
						)}
					</div>
				</>
			)}

			{/* Error Display */}
			{hasError && node.error && (
				<div className="flex items-start gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
					<AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
					<span className="text-xs text-red-300 line-clamp-2">
						{node.error}
					</span>
				</div>
			)}

			{/* Results Summary */}
			{hasResults && stats && (
				<div className="flex items-center justify-between px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg">
					<div className="flex items-center gap-3 text-[10px] font-mono">
						<span className="text-slate-400">{stats.total} enriched</span>
						{stats.highConfidence > 0 && (
							<span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded">
								{stats.highConfidence} high
							</span>
						)}
						{stats.mediumConfidence > 0 && (
							<span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded">
								{stats.mediumConfidence} medium
							</span>
						)}
						{stats.lowConfidence > 0 && (
							<span className="px-1.5 py-0.5 bg-red-500/20 text-red-300 rounded">
								{stats.lowConfidence} low
							</span>
						)}
					</div>
					<span className="text-[10px] text-purple-400">
						avg: {stats.avgConfidence}%
					</span>
				</div>
			)}

			{/* Enriched Provider Table */}
			{hasResults && (
				<EnrichedProviderTable
					providers={node.enrichedProviders as EnrichedProvider[]}
				/>
			)}
		</BaseNode>
	);
}

export default ProviderEnrichmentNode;
