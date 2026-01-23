import React, { useState, useEffect, useMemo } from 'react';
import {
	FileText,
	Play,
	Square,
	AlertCircle,
	Copy,
	Check,
} from 'lucide-react';
import {
	SitePlannerNodeData,
	HoveredPort,
	SiteDepth,
	LocationData,
} from '@/types/nodes';
import { Connection } from '@/types/connections';
import { EnrichedProvider } from '@/types/enrichedProvider';
import { LocalKnowledgeOutput } from '@/types/localKnowledge';
import { SitePlannerOutput, SitePlannerInput } from '@/types/sitePlanner';
import { BaseNode } from '../base';
import { useSitePlanner } from '@/hooks/useSitePlanner';
import { SitePlannerPreview } from './SitePlannerPreview';
import { MultiInputPort, SITE_PLANNER_INPUT_PORTS } from './MultiInputPort';

interface SitePlannerNodeProps {
	node: SitePlannerNodeData;
	updateNode: (id: string, updates: Partial<SitePlannerNodeData>) => void;
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
		location: LocationData | null;
		serp: {
			category: string;
			serpQuality: 'Weak' | 'Medium' | 'Strong';
			serpScore: number;
		} | null;
		providers: EnrichedProvider[];
		localKnowledge: LocalKnowledgeOutput | null;
	} | null;
}

const DEPTH_OPTIONS: { value: SiteDepth; label: string; pages: string }[] = [
	{ value: 'mvp', label: 'MVP', pages: '30-35 pages' },
	{ value: 'standard', label: 'Standard', pages: '50-60 pages' },
	{ value: 'comprehensive', label: 'Comprehensive', pages: '75-90 pages' },
];

export function SitePlannerNode({
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
}: SitePlannerNodeProps) {
	// Site planner generation hook
	const { runGeneration, stopGeneration, hasSupabase } = useSitePlanner({
		nodeId: node.id,
		updateNode,
	});

	// Track copied state for JSON export
	const [copied, setCopied] = useState(false);

	// Update inputs when incoming data changes
	useEffect(() => {
		if (incomingData) {
			const updates: Partial<SitePlannerNodeData> = {};

			// Location updates
			if (incomingData.location) {
				if (incomingData.location.name !== node.inputCity) {
					updates.inputCity = incomingData.location.name;
				}
				if (incomingData.location.state !== node.inputState) {
					updates.inputState = incomingData.location.state;
				}
			}

			// SERP updates
			if (incomingData.serp) {
				if (incomingData.serp.category !== node.inputCategory) {
					updates.inputCategory = incomingData.serp.category;
				}
				if (incomingData.serp.serpScore !== node.inputSerpScore) {
					updates.inputSerpScore = incomingData.serp.serpScore;
				}
				if (incomingData.serp.serpQuality !== node.inputSerpQuality) {
					updates.inputSerpQuality = incomingData.serp.serpQuality;
				}
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
		if (!incomingData?.location || !incomingData?.serp) return;

		const input: SitePlannerInput = {
			location: incomingData.location,
			serp: incomingData.serp,
			providers: incomingData.providers || [],
			localKnowledge: incomingData.localKnowledge!,
		};

		runGeneration(input, node.depth);
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
	const output = node.output as SitePlannerOutput | null;
	const hasResults = node.status === 'success' && output && output.pages.length > 0;

	// Determine if we have required inputs
	// Local Knowledge is required and provides location + category
	const hasLocalKnowledge = !!incomingData?.localKnowledge;
	const hasProviders = (incomingData?.providers?.length || 0) > 0;

	// Can run if we have Local Knowledge (which provides location + category)
	const canRun = hasSupabase && hasLocalKnowledge && !isLoading;

	// Calculate connected and ready ports for multi-input visualization
	const connectedPorts = useMemo(() => {
		const connected = new Set<string>();
		SITE_PLANNER_INPUT_PORTS.forEach((port) => {
			if (getInputPortConnections(port.id).length > 0) {
				connected.add(port.id);
			}
		});
		return connected;
	}, [getInputPortConnections]);

	const readyPorts = useMemo(() => {
		const ready = new Set<string>();
		if (hasLocalKnowledge) ready.add('local-knowledge');
		if (hasProviders) ready.add('providers');
		return ready;
	}, [hasLocalKnowledge, hasProviders]);

	// Check if a connection is being dragged
	const isConnectionActive = !!connectingFrom || !!connectingTo;

	// Loading overlay
	const loadingOverlay = (
		<div className="absolute inset-0 z-40 bg-slate-900/80 backdrop-blur-sm rounded-2xl flex items-center justify-center">
			<div className="flex flex-col items-center gap-3">
				<div className="relative">
					<div className="w-12 h-12 rounded-full border-2 border-transparent border-t-blue-500 border-r-sky-500 animate-spin" />
					<FileText
						size={20}
						className="absolute inset-0 m-auto text-blue-400"
					/>
				</div>
				<div className="text-sm text-white/80">Generating site plan...</div>
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
			icon={<FileText size={14} className="text-blue-400" />}
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
					? 'border-blue-500/50 shadow-blue-500/20'
					: hasError
						? 'border-red-500/50'
						: 'border-slate-700/50'
			}
			hoverBorderClass="group-hover:border-blue-500/30"
			resizeHoverColor="hover:text-blue-400"
			extraPorts={
				<MultiInputPort
					nodeId={node.id}
					ports={SITE_PLANNER_INPUT_PORTS}
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

				{/* Input Summary - shows data from Local Knowledge */}
				{hasLocalKnowledge ? (
					<div className="flex flex-col gap-1.5 text-xs">
						<div className="flex gap-2">
							<div className="bg-green-500/10 text-green-400 px-2 py-1 rounded truncate flex-1">
								{node.inputCity}, {node.inputState}
							</div>
							<div className="bg-green-500/10 text-green-400 px-2 py-1 rounded truncate flex-1">
								{node.inputCategory}
							</div>
						</div>
						{hasProviders && (
							<div className="bg-blue-500/10 text-blue-400 px-2 py-1 rounded truncate">
								{node.inputProviderCount} competitor{node.inputProviderCount !== 1 ? 's' : ''} loaded
							</div>
						)}
					</div>
				) : (
					<div className="text-xs text-slate-500 text-center py-2">
						Connect a Local Knowledge node to get started
					</div>
				)}

				{/* Depth Selector */}
				<div className="flex flex-col gap-1">
					<label className="text-xs text-slate-400">Site Depth</label>
					<div className="grid grid-cols-3 gap-1">
						{DEPTH_OPTIONS.map((option) => (
							<button
								key={option.value}
								onClick={() => updateNode(node.id, { depth: option.value })}
								className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
									node.depth === option.value
										? 'bg-blue-500 text-white'
										: 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
								}`}
							>
								{option.label}
							</button>
						))}
					</div>
					<span className="text-xs text-slate-500 text-center">
						{DEPTH_OPTIONS.find((o) => o.value === node.depth)?.pages}
					</span>
				</div>

				{/* Run Button */}
				<div className="flex gap-2">
					<button
						onClick={handleRun}
						disabled={!canRun}
						className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-medium transition-all ${
							canRun
								? 'bg-blue-500 hover:bg-blue-400 text-white'
								: 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
						}`}
					>
						<Play size={14} />
						Generate Plan
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
				{hasResults && output && <SitePlannerPreview output={output} />}
			</div>
		</BaseNode>
	);
}

export default SitePlannerNode;
