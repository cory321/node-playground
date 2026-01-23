import React, { useState, useEffect, useMemo } from 'react';
import {
	UserCircle,
	Play,
	Square,
	AlertCircle,
	Copy,
	Check,
} from 'lucide-react';
import {
	ProviderProfileGeneratorNodeData,
	HoveredPort,
	EditorialDepth,
	LocationData,
} from '@/types/nodes';
import { Connection } from '@/types/connections';
import { EnrichedProvider } from '@/types/enrichedProvider';
import { LocalKnowledgeOutput } from '@/types/localKnowledge';
import { SitePlannerOutput } from '@/types/sitePlanner';
import { GeneratedProviderProfile } from '@/types/generatedProfile';
import { BaseNode } from '../base';
import { useProviderProfileGenerator } from '@/hooks/useProviderProfileGenerator';
import { ProfilePreview } from './ProfilePreview';
import { MultiInputPort, PROFILE_GENERATOR_INPUT_PORTS } from './MultiInputPort';

interface ProviderProfileGeneratorNodeProps {
	node: ProviderProfileGeneratorNodeData;
	updateNode: (
		id: string,
		updates: Partial<ProviderProfileGeneratorNodeData>
	) => void;
	deleteNode: (id: string) => void;
	onMouseDown: (e: React.MouseEvent) => void;
	onResizeStart: (e: React.MouseEvent) => void;
	editingTitleId: string | null;
	setEditingTitleId: (id: string | null) => void;
	isConnectedOutput: boolean;
	hoveredPort: HoveredPort | null;
	setHoveredPort: (port: HoveredPort | null) => void;
	// Multi-input port handlers
	onInputPortMouseDown: (e: React.MouseEvent, portId: string) => void;
	onInputPortMouseUp: (portId: string) => void;
	onOutputPortMouseDown: (e: React.MouseEvent) => void;
	onOutputPortMouseUp: () => void;
	connectingFrom: string | null;
	connectingTo: string | null;
	// Get connections to specific input ports
	getInputPortConnections: (portId: string) => Connection[];
	incomingData: {
		blueprint: SitePlannerOutput | null;
		providers: EnrichedProvider[];
		localKnowledge: LocalKnowledgeOutput | null;
	} | null;
}

const DEPTH_OPTIONS: {
	value: EditorialDepth;
	label: string;
	desc: string;
}[] = [
	{ value: 'brief', label: 'Brief', desc: '~150 words' },
	{ value: 'standard', label: 'Standard', desc: '~200 words' },
	{ value: 'detailed', label: 'Detailed', desc: '~300 words' },
];

export function ProviderProfileGeneratorNode({
	node,
	updateNode,
	deleteNode,
	onMouseDown,
	onResizeStart,
	editingTitleId,
	setEditingTitleId,
	isConnectedOutput,
	hoveredPort,
	setHoveredPort,
	onInputPortMouseDown,
	onInputPortMouseUp,
	onOutputPortMouseDown,
	onOutputPortMouseUp,
	connectingFrom,
	connectingTo,
	getInputPortConnections,
	incomingData,
}: ProviderProfileGeneratorNodeProps) {
	// Profile generator hook
	const { runGeneration, stopGeneration, hasSupabase } =
		useProviderProfileGenerator({
			nodeId: node.id,
			updateNode,
		});

	// Track copied state for JSON export
	const [copied, setCopied] = useState(false);

	// Update inputs when incoming data changes
	useEffect(() => {
		if (incomingData) {
			const updates: Partial<ProviderProfileGeneratorNodeData> = {};

			// Blueprint data
			if (incomingData.blueprint) {
				if (!node.inputHasBlueprint) {
					updates.inputHasBlueprint = true;
				}
				// Extract location from blueprint meta
				const meta = incomingData.blueprint.meta;
				if (meta?.city !== node.inputCity) {
					updates.inputCity = meta?.city || null;
				}
				if (meta?.state !== node.inputState) {
					updates.inputState = meta?.state || null;
				}
				if (meta?.category !== node.inputCategory) {
					updates.inputCategory = meta?.category || null;
				}
			} else if (node.inputHasBlueprint) {
				updates.inputHasBlueprint = false;
			}

			// Provider count
			const providerCount = incomingData.providers?.length || 0;
			if (providerCount !== node.inputProviderCount) {
				updates.inputProviderCount = providerCount;
			}

			// Local knowledge presence
			const hasLK = !!incomingData.localKnowledge;
			if (hasLK !== node.inputHasLocalKnowledge) {
				updates.inputHasLocalKnowledge = hasLK;
			}

			if (Object.keys(updates).length > 0) {
				updateNode(node.id, updates);
			}
		}
	}, [incomingData, node, updateNode]);

	// Handle run button
	const handleRun = () => {
		if (
			!incomingData?.blueprint ||
			!incomingData?.providers?.length ||
			!incomingData?.localKnowledge
		) {
			return;
		}

		runGeneration(
			{
				blueprint: incomingData.blueprint,
				providers: incomingData.providers,
				localKnowledge: incomingData.localKnowledge,
			},
			{
				editorialDepth: node.editorialDepth,
				includeComparison: node.includeComparison,
			}
		);
	};

	// Handle JSON copy
	const handleCopyJson = () => {
		if (!node.output) return;
		navigator.clipboard.writeText(JSON.stringify(node.output, null, 2));
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const isLoading = node.status === 'loading';
	const hasError = node.status === 'error';
	const output = node.output as GeneratedProviderProfile[] | null;
	const hasResults =
		node.status === 'success' && output && output.length > 0;

	// Determine if we have required inputs
	const hasBlueprint = !!incomingData?.blueprint;
	const hasProviders = (incomingData?.providers?.length || 0) > 0;
	const hasLocalKnowledge = !!incomingData?.localKnowledge;

	// Can run if we have all required inputs
	const canRun =
		hasSupabase && hasBlueprint && hasProviders && hasLocalKnowledge && !isLoading;

	// Calculate connected and ready ports for multi-input visualization
	const connectedPorts = useMemo(() => {
		const connected = new Set<string>();
		PROFILE_GENERATOR_INPUT_PORTS.forEach((port) => {
			if (getInputPortConnections(port.id).length > 0) {
				connected.add(port.id);
			}
		});
		return connected;
	}, [getInputPortConnections]);

	const readyPorts = useMemo(() => {
		const ready = new Set<string>();
		if (hasBlueprint) ready.add('blueprint');
		// localKnowledge and providers are now included in blueprint, no separate ports
		return ready;
	}, [hasBlueprint]);

	// Check if a connection is being dragged
	const isConnectionActive = !!connectingFrom || !!connectingTo;

	// Progress display
	const progress = node.progress;
	const progressText = isLoading
		? progress?.currentProvider
			? `Generating profile ${progress.currentIndex} of ${progress.totalCount}...`
			: progress?.phase === 'validating'
				? 'Validating profiles...'
				: 'Preparing...'
		: null;

	// Loading overlay
	const loadingOverlay = (
		<div className="absolute inset-0 z-40 bg-slate-900/80 backdrop-blur-sm rounded-2xl flex items-center justify-center">
			<div className="flex flex-col items-center gap-3">
				<div className="relative">
					<div className="w-12 h-12 rounded-full border-2 border-transparent border-t-amber-500 border-r-orange-500 animate-spin" />
					<UserCircle
						size={20}
						className="absolute inset-0 m-auto text-amber-400"
					/>
				</div>
				<div className="text-sm text-white/80 text-center px-4">
					{progressText || 'Generating profiles...'}
				</div>
				{progress?.currentProvider && (
					<div className="text-xs text-slate-400 truncate max-w-[200px]">
						{progress.currentProvider}
					</div>
				)}
				<button
					onClick={stopGeneration}
					className="mt-2 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm flex items-center gap-1.5 transition-colors"
				>
					<Square size={12} />
					Cancel
				</button>
			</div>
		</div>
	);

	return (
		<BaseNode
			node={node}
			icon={<UserCircle size={14} className="text-amber-400" />}
			isEditingTitle={editingTitleId === node.id}
			onTitleChange={(title) => updateNode(node.id, { title })}
			onEditTitleStart={() => setEditingTitleId(node.id)}
			onEditTitleEnd={() => setEditingTitleId(null)}
			onDelete={() => deleteNode(node.id)}
			onMouseDown={onMouseDown}
			onResizeStart={onResizeStart}
			hasInputPort={false} // We use custom multi-input ports
			hasOutputPort={true}
			isConnectedInput={connectedPorts.size > 0}
			isConnectedOutput={isConnectedOutput}
			hoveredPort={hoveredPort}
			setHoveredPort={setHoveredPort}
			onOutputPortMouseDown={onOutputPortMouseDown}
			onOutputPortMouseUp={onOutputPortMouseUp}
			connectingFrom={connectingFrom}
			connectingTo={connectingTo}
			status={node.status}
			isLoading={isLoading}
			loadingOverlay={loadingOverlay}
			borderClass={
				isLoading
					? 'border-amber-500/50 shadow-amber-500/20'
					: hasError
						? 'border-red-500/50'
						: 'border-slate-700/50'
			}
			hoverBorderClass="group-hover:border-amber-500/30"
			resizeHoverColor="hover:text-amber-400"
			extraPorts={
				<MultiInputPort
					nodeId={node.id}
					ports={PROFILE_GENERATOR_INPUT_PORTS}
					connectedPorts={connectedPorts}
					readyPorts={readyPorts}
					hoveredPort={hoveredPort}
					setHoveredPort={setHoveredPort}
					onPortMouseDown={onInputPortMouseDown}
					onPortMouseUp={onInputPortMouseUp}
					isActive={isConnectionActive}
				/>
			}
		>
			<div className="flex flex-col gap-3 text-sm">
				{/* Configuration Status */}
				{!hasSupabase && (
					<div className="flex items-center gap-2 text-amber-400 bg-amber-500/10 px-3 py-2 rounded-lg">
						<AlertCircle size={14} />
						<span>Supabase not configured</span>
					</div>
				)}

				{/* Input Summary */}
				{hasBlueprint || hasProviders || hasLocalKnowledge ? (
					<div className="flex flex-col gap-1.5 text-xs">
						{node.inputCity && node.inputCategory && (
							<div className="flex gap-2">
								<div className="bg-green-500/10 text-green-400 px-2 py-1 rounded truncate flex-1">
									{node.inputCity}, {node.inputState}
								</div>
								<div className="bg-green-500/10 text-green-400 px-2 py-1 rounded truncate flex-1">
									{node.inputCategory}
								</div>
							</div>
						)}
						<div className="flex gap-2">
							{hasBlueprint && (
								<div className="bg-blue-500/10 text-blue-400 px-2 py-1 rounded truncate flex-1">
									Blueprint ready
								</div>
							)}
							{hasProviders && (
								<div className="bg-amber-500/10 text-amber-400 px-2 py-1 rounded truncate flex-1">
									{node.inputProviderCount} provider
									{node.inputProviderCount !== 1 ? 's' : ''}
								</div>
							)}
						</div>
					</div>
				) : (
					<div className="text-xs text-slate-500 text-center py-2">
						Connect Blueprint, Providers, and Local Knowledge
					</div>
				)}

				{/* Editorial Depth Selector */}
				<div className="flex flex-col gap-1">
					<label className="text-xs text-slate-400">Editorial Depth</label>
					<div className="grid grid-cols-3 gap-1">
						{DEPTH_OPTIONS.map((option) => (
							<button
								key={option.value}
								onClick={() =>
									updateNode(node.id, { editorialDepth: option.value })
								}
								className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
									node.editorialDepth === option.value
										? 'bg-amber-500 text-white'
										: 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
								}`}
							>
								{option.label}
							</button>
						))}
					</div>
					<span className="text-xs text-slate-500 text-center">
						{DEPTH_OPTIONS.find((o) => o.value === node.editorialDepth)?.desc}
					</span>
				</div>

				{/* Include Comparison Toggle */}
				<label className="flex items-center gap-2 cursor-pointer">
					<input
						type="checkbox"
						checked={node.includeComparison}
						onChange={(e) =>
							updateNode(node.id, { includeComparison: e.target.checked })
						}
						className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-amber-500 focus:ring-amber-500 focus:ring-offset-0"
					/>
					<span className="text-xs text-slate-400">
						Include comparison context
					</span>
				</label>

				{/* Run Button */}
				<div className="flex gap-2">
					<button
						onClick={handleRun}
						disabled={!canRun}
						className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-medium transition-all ${
							canRun
								? 'bg-amber-500 hover:bg-amber-400 text-white'
								: 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
						}`}
					>
						<Play size={14} />
						Generate Profiles
					</button>
					{hasResults && (
						<button
							onClick={handleCopyJson}
							title="Copy JSON"
							className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-medium transition-all bg-slate-700 hover:bg-slate-600 text-slate-300"
						>
							{copied ? <Check size={14} /> : <Copy size={14} />}
						</button>
					)}
				</div>

				{/* Error Display */}
				{hasError && node.error && (
					<div className="flex items-start gap-2 text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">
						<AlertCircle size={14} className="mt-0.5 shrink-0" />
						<span className="text-xs">{node.error}</span>
					</div>
				)}

				{/* Results Preview */}
				{hasResults && output && (
					<ProfilePreview
						profiles={output}
						onUpdateProfile={(index, updates) => {
							const newOutput = [...output];
							newOutput[index] = { ...newOutput[index], ...updates };
							updateNode(node.id, { output: newOutput });
						}}
					/>
				)}
			</div>
		</BaseNode>
	);
}

export default ProviderProfileGeneratorNode;
