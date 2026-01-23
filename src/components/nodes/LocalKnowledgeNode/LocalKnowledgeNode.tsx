import React, { useState, useEffect } from 'react';
import {
	BookOpen,
	Play,
	Square,
	AlertCircle,
	Link2Off,
	RefreshCw,
	ChevronDown,
	ChevronRight,
	Copy,
	Check,
	MapPin,
	Cloud,
	MessageSquare,
	AlertTriangle,
} from 'lucide-react';
import { LocalKnowledgeNodeData, HoveredPort } from '@/types/nodes';
import { LocalKnowledgeOutput } from '@/types/localKnowledge';
import { BaseNode } from '../base';
import { useLocalKnowledge } from '@/hooks/useLocalKnowledge';
import { ConfidenceBadge } from './ConfidenceBadge';
import { ContentHooksPanel } from './ContentHooksPanel';

interface LocalKnowledgeNodeProps {
	node: LocalKnowledgeNodeData;
	updateNode: (id: string, updates: Partial<LocalKnowledgeNodeData>) => void;
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
		city: string;
		county?: string;
		state: string | null;
		category?: string;
	} | null;
}

export function LocalKnowledgeNode({
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
}: LocalKnowledgeNodeProps) {
	// Local knowledge generation hook
	const { runGeneration, stopGeneration, isGenerating, hasSupabase } =
		useLocalKnowledge({
			nodeId: node.id,
			updateNode,
		});

	// Update inputs when incoming data changes
	useEffect(() => {
		if (incomingData) {
			const updates: Partial<LocalKnowledgeNodeData> = {};
			if (incomingData.city !== node.inputCity) {
				updates.inputCity = incomingData.city;
			}
			if (incomingData.county !== node.inputCounty) {
				updates.inputCounty = incomingData.county || null;
			}
			if (incomingData.state !== node.inputState) {
				updates.inputState = incomingData.state;
			}
			if (
				incomingData.category &&
				incomingData.category !== node.inputCategory
			) {
				updates.inputCategory = incomingData.category;
			}
			if (Object.keys(updates).length > 0) {
				updateNode(node.id, updates);
			}
		}
	}, [
		incomingData,
		node.id,
		node.inputCity,
		node.inputCounty,
		node.inputState,
		node.inputCategory,
		updateNode,
	]);

	// Handle run button
	const handleRun = (bypassCache: boolean = false) => {
		const city = node.inputCity || incomingData?.city;
		const state = node.inputState || incomingData?.state;
		const category =
			node.inputCategory || node.manualCategory || incomingData?.category;

		if (!city || !state) return;
		if (!category) return;

		runGeneration(
			{
				location: {
					city,
					county: node.inputCounty || incomingData?.county,
					state,
				},
				category,
			},
			bypassCache,
		);
	};

	const isLoading = node.status === 'loading';
	const hasError = node.status === 'error';
	const output = node.output as LocalKnowledgeOutput | null;
	const hasResults =
		node.status === 'success' && output && output.meta.confidence > 0;

	// Determine if we have required inputs
	const hasLocation =
		!!(node.inputCity || incomingData?.city) &&
		!!(node.inputState || incomingData?.state);
	const hasCategory = !!(
		node.inputCategory ||
		node.manualCategory ||
		incomingData?.category
	);
	const canRun = hasSupabase && hasLocation && hasCategory && !isLoading;

	// Loading overlay
	const loadingOverlay = (
		<div className="absolute inset-0 z-40 bg-slate-900/80 backdrop-blur-sm rounded-2xl flex items-center justify-center">
			<div className="flex flex-col items-center gap-3">
				<div className="relative">
					<div className="w-12 h-12 rounded-full border-2 border-transparent border-t-green-500 border-r-emerald-500 animate-spin" />
					<BookOpen
						size={20}
						className="absolute inset-0 m-auto text-green-400"
					/>
				</div>
				<div className="text-sm text-white/80">
					Researching local context...
				</div>
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
			icon={<BookOpen size={14} className="text-green-400" />}
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
					? 'border-green-500/50 shadow-green-500/20'
					: hasError
						? 'border-red-500/50'
						: 'border-slate-700/50'
			}
			hoverBorderClass="group-hover:border-green-500/30"
			resizeHoverColor="hover:text-green-400"
		>
			<div className="flex flex-col gap-3 text-sm">
				{/* Configuration Status */}
				{!hasSupabase && (
					<div className="flex items-center gap-2 text-amber-400 bg-amber-500/10 px-3 py-2 rounded-lg">
						<AlertCircle size={14} />
						<span>Supabase not configured</span>
					</div>
				)}

				{/* Input Status */}
				{!isConnectedInput && !hasLocation && (
					<div className="flex items-center gap-2 text-slate-400 bg-slate-800/50 px-3 py-2 rounded-lg">
						<Link2Off size={14} />
						<span>Connect a Location node</span>
					</div>
				)}

				{/* Location Display */}
				{hasLocation && (
					<div className="flex items-center gap-2 text-slate-300 bg-slate-800/50 px-3 py-2 rounded-lg">
						<MapPin size={14} className="text-green-400" />
						<span>
							{node.inputCity || incomingData?.city},{' '}
							{node.inputState || incomingData?.state}
						</span>
					</div>
				)}

				{/* Category Input */}
				{!node.inputCategory && !incomingData?.category && (
					<div className="flex flex-col gap-1">
						<label className="text-xs text-slate-400">Service Category</label>
						<input
							type="text"
							value={node.manualCategory || ''}
							onChange={(e) =>
								updateNode(node.id, { manualCategory: e.target.value })
							}
							placeholder="e.g., garage door repair, HVAC, plumbing"
							className="bg-slate-800/50 text-white px-3 py-2 rounded-lg border border-slate-700/50 focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 outline-none transition-all"
						/>
					</div>
				)}

				{/* Show category if coming from upstream */}
				{(node.inputCategory || incomingData?.category) && (
					<div className="flex items-center gap-2 text-slate-300 bg-slate-800/50 px-3 py-2 rounded-lg">
						<span className="text-xs text-slate-400">Category:</span>
						<span className="text-green-400">
							{node.inputCategory || incomingData?.category}
						</span>
					</div>
				)}

				{/* Run Button */}
				<div className="flex gap-2">
					<button
						onClick={() => handleRun(false)}
						disabled={!canRun}
						className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-medium transition-all ${
							canRun
								? 'bg-green-500 hover:bg-green-400 text-white'
								: 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
						}`}
					>
						<Play size={14} />
						Generate
					</button>
					{hasResults && (
						<button
							onClick={() => handleRun(true)}
							disabled={!canRun}
							title="Regenerate (bypass cache)"
							className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-medium transition-all ${
								canRun
									? 'bg-slate-700 hover:bg-slate-600 text-slate-300'
									: 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
							}`}
						>
							<RefreshCw size={14} />
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

				{/* Results Display */}
				{hasResults && output && (
					<div className="flex flex-col gap-3 mt-1">
						{/* Header with Regional Identity */}
						<div className="bg-slate-800/50 rounded-lg p-3">
							<div className="flex items-center justify-between mb-2">
								<h4 className="text-xs font-medium text-slate-400 uppercase tracking-wide">
									Regional Identity
								</h4>
								<ConfidenceBadge confidence={output.meta.confidence} />
							</div>
							<div className="text-white font-medium">
								{output.regionalIdentity.region || 'Unknown Region'}
							</div>
							{output.regionalIdentity.characterization && (
								<div className="text-slate-400 text-xs mt-1">
									{output.regionalIdentity.characterization}
								</div>
							)}
							{output.regionalIdentity.nearbyReference && (
								<div className="text-slate-500 text-xs mt-1">
									{output.regionalIdentity.nearbyReference}
								</div>
							)}
							{output.meta.cached && (
								<div className="text-xs text-slate-500 mt-2 flex items-center gap-1">
									<span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
									Cached result
								</div>
							)}
						</div>

						{/* Content Hooks */}
						<ContentHooksPanel
							hooks={output.contentHooks}
							marketContext={output.marketContext}
						/>
					</div>
				)}
			</div>
		</BaseNode>
	);
}

export default LocalKnowledgeNode;
