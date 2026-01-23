import React, { useState, useEffect, useMemo } from 'react';
import {
	Shield,
	Play,
	Square,
	AlertCircle,
	Copy,
	Check,
	Settings,
	Eye,
	FileCode,
	Link,
} from 'lucide-react';
import { SEOOptimizationNodeData, HoveredPort } from '@/types/nodes';
import { Connection } from '@/types/connections';
import { SitePlannerOutput } from '@/types/sitePlanner';
import { GeneratedEditorialContent } from '@/types/editorialContent';
import { GeneratedComparisonData } from '@/types/comparisonPage';
import {
	SEOOptimizedPackage,
	SEOOptimizationInput,
	SEOOptimizationConfig,
} from '@/types/seoPackage';
import { BaseNode } from '../base';
import { useSEOOptimization } from '@/hooks/useSEOOptimization';
import { MultiInputPort, SEO_OPTIMIZATION_INPUT_PORTS } from './MultiInputPort';
import {
	SEOScoreDashboard,
	SERPPreview,
	SchemaValidator,
	LinkVisualizer,
} from './seo';

interface SEOOptimizationNodeProps {
	node: SEOOptimizationNodeData;
	updateNode: (id: string, updates: Partial<SEOOptimizationNodeData>) => void;
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
		editorialContent: GeneratedEditorialContent | null;
		comparisonData: GeneratedComparisonData | null;
	} | null;
}

type PreviewTab = 'dashboard' | 'serp' | 'schema' | 'links';

export function SEOOptimizationNode({
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
}: SEOOptimizationNodeProps) {
	// SEO optimization hook
	const { runOptimization, stopOptimization } = useSEOOptimization({
		nodeId: node.id,
		updateNode,
	});

	// Track copied state for JSON export
	const [copied, setCopied] = useState(false);
	// Active preview tab
	const [activeTab, setActiveTab] = useState<PreviewTab>('dashboard');

	// Update inputs when incoming data changes
	useEffect(() => {
		if (incomingData) {
			const updates: Partial<SEOOptimizationNodeData> = {};

			// Blueprint data
			if (incomingData.blueprint) {
				const meta = incomingData.blueprint.meta;
				if (meta.city !== node.inputCity) {
					updates.inputCity = meta.city;
				}
				if (meta.state !== node.inputState) {
					updates.inputState = meta.state;
				}
				if (meta.category !== node.inputCategory) {
					updates.inputCategory = meta.category;
				}
				const pageCount = incomingData.blueprint.pages?.length || 0;
				if (pageCount !== node.inputPageCount) {
					updates.inputPageCount = pageCount;
				}
			}

			// Input presence flags
			const hasBlueprint = !!incomingData.blueprint;
			if (hasBlueprint !== node.inputHasBlueprint) {
				updates.inputHasBlueprint = hasBlueprint;
			}

			// Providers come from blueprint.providers (pass-through from site planner)
			const hasProviders = (incomingData.blueprint?.providers?.length || 0) > 0;
			if (hasProviders !== node.inputHasProviders) {
				updates.inputHasProviders = hasProviders;
			}

			const hasEditorial = !!incomingData.editorialContent?.pages?.length;
			if (hasEditorial !== node.inputHasEditorial) {
				updates.inputHasEditorial = hasEditorial;
			}

			const hasComparison =
				!!incomingData.comparisonData?.comparisonPages?.length;
			if (hasComparison !== node.inputHasComparison) {
				updates.inputHasComparison = hasComparison;
			}

			if (Object.keys(updates).length > 0) {
				updateNode(node.id, updates);
			}
		}
	}, [incomingData, node, updateNode]);

	// Handle run button
	const handleRun = () => {
		// Providers are accessed via blueprint.providers
		if (!incomingData?.blueprint || !incomingData.blueprint.providers?.length)
			return;

		const input: SEOOptimizationInput = {
			blueprint: incomingData.blueprint,
			editorialContent: incomingData.editorialContent,
			comparisonData: incomingData.comparisonData,
		};

		const config: SEOOptimizationConfig = {
			schemaValidation: node.schemaValidation,
			linkDensityTarget: node.linkDensityTarget,
		};

		runOptimization(input, config);
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
	const output = node.output as SEOOptimizedPackage | null;
	const hasResults =
		node.status === 'success' && output && output.pages.length > 0;

	// Determine if we have required inputs
	// Providers come from blueprint.providers (pass-through from site planner)
	const hasBlueprint = !!incomingData?.blueprint;
	const hasProviders = (incomingData?.blueprint?.providers?.length || 0) > 0;

	// Can run if we have required inputs
	const canRun = hasBlueprint && hasProviders && !isLoading;

	// Calculate connected and ready ports for multi-input visualization
	const connectedPorts = useMemo(() => {
		const connected = new Set<string>();
		SEO_OPTIMIZATION_INPUT_PORTS.forEach((port) => {
			if (getInputPortConnections(port.id).length > 0) {
				connected.add(port.id);
			}
		});
		return connected;
	}, [getInputPortConnections]);

	// Ready ports (providers are now part of blueprint, not a separate port)
	const readyPorts = useMemo(() => {
		const ready = new Set<string>();
		if (hasBlueprint) ready.add('blueprint');
		if (incomingData?.editorialContent?.pages?.length) ready.add('editorial');
		if (incomingData?.comparisonData?.comparisonPages?.length)
			ready.add('comparison');
		return ready;
	}, [hasBlueprint, incomingData]);

	// Check if a connection is being dragged
	const isConnectionActive = !!connectingFrom || !!connectingTo;

	// Loading overlay
	const loadingOverlay = (
		<div className="absolute inset-0 z-40 bg-slate-900/80 backdrop-blur-sm rounded-2xl flex items-center justify-center">
			<div className="flex flex-col items-center gap-3">
				<div className="relative">
					<div className="w-12 h-12 rounded-full border-2 border-transparent border-t-teal-500 border-r-cyan-500 animate-spin" />
					<Shield size={20} className="absolute inset-0 m-auto text-teal-400" />
				</div>
				<div className="text-sm text-white/80">
					{node.progress.currentStep || 'Optimizing SEO...'}
				</div>
				{node.progress.totalPages > 0 && (
					<div className="text-xs text-slate-400">
						Page {node.progress.completedPages} of {node.progress.totalPages}
					</div>
				)}
				<button
					onClick={stopOptimization}
					className="mt-2 px-3 py-1.5 bg-teal-500/20 hover:bg-teal-500/30 text-teal-400 rounded-lg text-sm flex items-center gap-1.5 transition-colors"
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
			icon={<Shield size={14} className="text-teal-400" />}
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
					? 'border-teal-500/50 shadow-teal-500/20'
					: hasError
						? 'border-red-500/50'
						: 'border-slate-700/50'
			}
			hoverBorderClass="group-hover:border-teal-500/30"
			resizeHoverColor="hover:text-teal-400"
			extraPorts={
				<MultiInputPort
					nodeId={node.id}
					ports={SEO_OPTIMIZATION_INPUT_PORTS}
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
				{/* Input Summary */}
				{hasBlueprint ? (
					<div className="flex flex-col gap-1.5 text-xs">
						<div className="flex gap-2">
							<div className="bg-green-500/10 text-green-400 px-2 py-1 rounded truncate flex-1">
								{node.inputCity}, {node.inputState}
							</div>
							<div className="bg-green-500/10 text-green-400 px-2 py-1 rounded truncate flex-1">
								{node.inputCategory}
							</div>
						</div>
						<div className="flex gap-2">
							<div className="bg-teal-500/10 text-teal-400 px-2 py-1 rounded truncate flex-1">
								{node.inputPageCount} pages
							</div>
							{hasProviders && (
								<div className="bg-teal-500/10 text-teal-400 px-2 py-1 rounded truncate flex-1">
									{incomingData?.blueprint?.providers?.length || 0} providers
								</div>
							)}
						</div>
						<div className="flex gap-1 mt-1">
							{node.inputHasEditorial && (
								<div className="bg-slate-700/50 text-slate-300 px-1.5 py-0.5 rounded text-[10px]">
									Editorial
								</div>
							)}
							{node.inputHasComparison && (
								<div className="bg-slate-700/50 text-slate-300 px-1.5 py-0.5 rounded text-[10px]">
									Comparison
								</div>
							)}
						</div>
					</div>
				) : (
					<div className="text-xs text-slate-500 text-center py-2">
						Connect Blueprint & Providers
					</div>
				)}

				{/* Configuration */}
				<div className="flex flex-col gap-2">
					<div className="flex items-center gap-2 text-xs text-slate-400">
						<Settings size={12} />
						<span>Configuration</span>
					</div>
					<div className="flex gap-2">
						<button
							onClick={() =>
								updateNode(node.id, {
									schemaValidation: !node.schemaValidation,
								})
							}
							className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
								node.schemaValidation
									? 'bg-teal-500 text-white'
									: 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
							}`}
						>
							Schema Validation
						</button>
					</div>
					<div className="flex items-center gap-2">
						<span className="text-xs text-slate-500 shrink-0">
							Link Density:
						</span>
						<input
							type="range"
							min="5"
							max="20"
							value={node.linkDensityTarget}
							onChange={(e) =>
								updateNode(node.id, {
									linkDensityTarget: Number(e.target.value),
								})
							}
							className="flex-1 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
						/>
						<span className="text-xs text-teal-400 w-6 text-right">
							{node.linkDensityTarget}
						</span>
					</div>
				</div>

				{/* Run Button */}
				<div className="flex gap-2">
					<button
						onClick={handleRun}
						disabled={!canRun}
						className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-medium transition-all ${
							canRun
								? 'bg-teal-500 hover:bg-teal-400 text-white'
								: 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
						}`}
					>
						<Play size={14} />
						Optimize SEO
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
					<div className="flex flex-col gap-2">
						{/* Tab Buttons */}
						<div className="flex gap-1">
							<button
								onClick={() => setActiveTab('dashboard')}
								className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs transition-colors ${
									activeTab === 'dashboard'
										? 'bg-teal-500/20 text-teal-400'
										: 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
								}`}
							>
								<Eye size={10} />
								Dashboard
							</button>
							<button
								onClick={() => setActiveTab('serp')}
								className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs transition-colors ${
									activeTab === 'serp'
										? 'bg-teal-500/20 text-teal-400'
										: 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
								}`}
							>
								<Eye size={10} />
								SERP
							</button>
							<button
								onClick={() => setActiveTab('schema')}
								className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs transition-colors ${
									activeTab === 'schema'
										? 'bg-teal-500/20 text-teal-400'
										: 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
								}`}
							>
								<FileCode size={10} />
								Schema
							</button>
							<button
								onClick={() => setActiveTab('links')}
								className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs transition-colors ${
									activeTab === 'links'
										? 'bg-teal-500/20 text-teal-400'
										: 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
								}`}
							>
								<Link size={10} />
								Links
							</button>
						</div>

						{/* Tab Content */}
						<div className="min-h-[200px]">
							{activeTab === 'dashboard' && (
								<SEOScoreDashboard output={output} />
							)}
							{activeTab === 'serp' && <SERPPreview pages={output.pages} />}
							{activeTab === 'schema' && <SchemaValidator output={output} />}
							{activeTab === 'links' && <LinkVisualizer output={output} />}
						</div>
					</div>
				)}
			</div>
		</BaseNode>
	);
}

export default SEOOptimizationNode;
