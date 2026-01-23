import React, { useState, useEffect, useMemo } from 'react';
import {
	Newspaper,
	Play,
	Square,
	AlertCircle,
	Copy,
	Check,
	Sparkles,
	FileText,
} from 'lucide-react';
import {
	EditorialContentGeneratorNodeData,
	HoveredPort,
	EditorialPageType,
	EditorialQualityLevel,
	EditorialModelKey,
	CategoryAnalysisResult,
} from '@/types/nodes';
import { Connection } from '@/types/connections';
import { LocalKnowledgeOutput } from '@/types/localKnowledge';
import { SitePlannerOutput } from '@/types/sitePlanner';
import { GeneratedEditorialContent } from '@/types/editorialContent';
import { BaseNode } from '../base';
import { useEditorialContentGenerator } from '@/hooks/useEditorialContentGenerator';
import { MultiInputPort, EDITORIAL_INPUT_PORTS } from './MultiInputPort';
import { ContentTypeSelector } from './ContentTypeSelector';
import { EditorialPreview } from './EditorialPreview';
import { estimatePageCount, estimateWordCount } from '@/api/editorialContent';

interface EditorialContentGeneratorNodeProps {
	node: EditorialContentGeneratorNodeData;
	updateNode: (
		id: string,
		updates: Partial<EditorialContentGeneratorNodeData>,
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
		localKnowledge: LocalKnowledgeOutput | null;
		serpData: CategoryAnalysisResult | null;
	} | null;
}

const QUALITY_OPTIONS: { value: EditorialQualityLevel; label: string }[] = [
	{ value: 'draft', label: 'Draft' },
	{ value: 'polished', label: 'Polished' },
];

const MODEL_OPTIONS: { value: EditorialModelKey; label: string; description: string }[] = [
	{ value: 'claude-haiku', label: 'Haiku 4.5', description: 'Fastest' },
	{ value: 'claude-sonnet', label: 'Sonnet 4.5', description: 'Balanced' },
	{ value: 'claude-opus', label: 'Opus 4.5', description: 'Most capable' },
];

export function EditorialContentGeneratorNode({
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
}: EditorialContentGeneratorNodeProps) {
	// Editorial content generation hook
	const { runGeneration, stopGeneration, isGenerating, hasSupabase } =
		useEditorialContentGenerator({
			nodeId: node.id,
			updateNode,
		});

	// Track copied state for JSON export
	const [copied, setCopied] = useState(false);

	// Update inputs when incoming data changes
	useEffect(() => {
		if (incomingData) {
			const updates: Partial<EditorialContentGeneratorNodeData> = {};

			// Blueprint updates
			if (incomingData.blueprint) {
				if (!node.inputHasBlueprint) {
					updates.inputHasBlueprint = true;
				}
				if (incomingData.blueprint.meta?.city !== node.inputCity) {
					updates.inputCity = incomingData.blueprint.meta?.city || null;
				}
				if (incomingData.blueprint.meta?.state !== node.inputState) {
					updates.inputState = incomingData.blueprint.meta?.state || null;
				}
				if (incomingData.blueprint.meta?.category !== node.inputCategory) {
					updates.inputCategory = incomingData.blueprint.meta?.category || null;
				}
				const pageCount = incomingData.blueprint.pages?.length || 0;
				if (pageCount !== node.inputPageCount) {
					updates.inputPageCount = pageCount;
				}
			} else if (node.inputHasBlueprint) {
				updates.inputHasBlueprint = false;
				updates.inputPageCount = 0;
			}

			// Local Knowledge updates
			const hasLK = !!incomingData.localKnowledge;
			if (hasLK !== node.inputHasLocalKnowledge) {
				updates.inputHasLocalKnowledge = hasLK;
			}

			// SERP data updates
			const hasSerpData = !!incomingData.serpData;
			if (hasSerpData !== node.inputHasSerpData) {
				updates.inputHasSerpData = hasSerpData;
			}

			if (Object.keys(updates).length > 0) {
				updateNode(node.id, updates);
			}
		}
	}, [incomingData, node, updateNode]);

	// Connected/ready port tracking
	const connectedPorts = useMemo(() => {
		const connected = new Set<string>();
		EDITORIAL_INPUT_PORTS.forEach((port) => {
			if (getInputPortConnections(port.id).length > 0) {
				connected.add(port.id);
			}
		});
		return connected;
	}, [getInputPortConnections]);

	const readyPorts = useMemo(() => {
		const ready = new Set<string>();
		if (incomingData?.blueprint) ready.add('blueprint');
		// localKnowledge is now included in blueprint, no separate port
		if (incomingData?.serpData) ready.add('serp');
		return ready;
	}, [incomingData]);

	// Is connection active
	const isConnectionActive = !!(connectingFrom || connectingTo);

	// Handle run button
	const handleRun = () => {
		if (!incomingData?.blueprint || !incomingData?.localKnowledge) return;
		if (node.contentTypes.length === 0) return;

		runGeneration(
			{
				blueprint: incomingData.blueprint,
				localKnowledge: incomingData.localKnowledge,
				serpData: incomingData.serpData,
			},
			{
				contentTypes: node.contentTypes,
				qualityLevel: node.qualityLevel,
				modelKey: node.modelKey,
			},
		);
	};

	// Handle model change
	const handleModelChange = (modelKey: EditorialModelKey) => {
		updateNode(node.id, { modelKey });
	};

	// Handle content type change
	const handleContentTypesChange = (types: EditorialPageType[]) => {
		updateNode(node.id, { contentTypes: types });
	};

	// Handle quality level change
	const handleQualityChange = (quality: EditorialQualityLevel) => {
		updateNode(node.id, { qualityLevel: quality });
	};

	// Copy JSON to clipboard
	const handleCopyJson = async () => {
		if (!node.output) return;
		try {
			await navigator.clipboard.writeText(JSON.stringify(node.output, null, 2));
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (error) {
			console.error('Failed to copy:', error);
		}
	};

	// Check if we can run
	const canRun =
		!isGenerating &&
		node.inputHasBlueprint &&
		node.inputHasLocalKnowledge &&
		node.contentTypes.length > 0;

	// Estimate pages to generate
	const estimatedPages = estimatePageCount(
		incomingData?.blueprint || null,
		node.contentTypes,
	);

	const estimatedWords = estimateWordCount(
		incomingData?.blueprint || null,
		node.contentTypes,
		node.qualityLevel,
	);

	// Get output for preview
	const output = node.output as GeneratedEditorialContent | null;

	// Loading overlay
	const loadingOverlay =
		node.status === 'loading' ? (
			<div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center z-10">
				<div className="text-center space-y-2">
					<Sparkles className="w-6 h-6 text-emerald-400 animate-pulse mx-auto" />
					<div className="text-xs text-slate-300">
						{node.progress.phase === 'preparing' && 'Preparing...'}
						{node.progress.phase === 'generating' && (
							<>
								Generating {node.progress.currentIndex + 1}/
								{node.progress.totalCount}
								{node.progress.currentSection && (
									<div className="text-[10px] text-slate-500 mt-1">
										{node.progress.currentSection}
									</div>
								)}
							</>
						)}
						{node.progress.phase === 'injecting-local' &&
							'Injecting local references...'}
						{node.progress.phase === 'validating' && 'Validating...'}
					</div>
					{node.progress.totalCount > 0 && (
						<div className="w-32 mx-auto bg-slate-700 rounded-full h-1.5">
							<div
								className="bg-emerald-500 h-1.5 rounded-full transition-all"
								style={{
									width: `${(node.progress.completedPages / node.progress.totalCount) * 100}%`,
								}}
							/>
						</div>
					)}
				</div>
			</div>
		) : undefined;

	return (
		<BaseNode
			node={node}
			icon={<Newspaper size={14} className="text-emerald-400" />}
			isEditingTitle={editingTitleId === node.id}
			onTitleChange={(title) => updateNode(node.id, { title })}
			onEditTitleStart={() => setEditingTitleId(node.id)}
			onEditTitleEnd={() => setEditingTitleId(null)}
			onDelete={() => deleteNode(node.id)}
			onMouseDown={onMouseDown}
			onResizeStart={onResizeStart}
			hasInputPort={false}
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
			isLoading={isGenerating}
			loadingOverlay={loadingOverlay}
			borderClass={
				isGenerating
					? 'border-emerald-500/50 shadow-emerald-500/20'
					: node.error
						? 'border-red-500/50'
						: 'border-slate-700/50'
			}
			hoverBorderClass="group-hover:border-emerald-500/30"
			resizeHoverColor="hover:text-emerald-400"
			extraPorts={
				<MultiInputPort
					nodeId={node.id}
					ports={EDITORIAL_INPUT_PORTS}
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
			<div className="p-3 space-y-3 overflow-y-auto max-h-[calc(100%-80px)]">
				{/* Input summary */}
				<div className="bg-slate-800/50 rounded-lg p-2 space-y-1.5">
					<div className="text-[10px] text-slate-500 uppercase tracking-wider">
						Inputs
					</div>
					<div className="grid grid-cols-2 gap-2 text-xs">
						<div className="flex items-center gap-1.5">
							<div
								className={`w-2 h-2 rounded-full ${
									node.inputHasBlueprint ? 'bg-green-500' : 'bg-slate-600'
								}`}
							/>
							<span
								className={
									node.inputHasBlueprint ? 'text-slate-300' : 'text-slate-500'
								}
							>
								Blueprint
								{node.inputHasBlueprint && (
									<span className="text-slate-500 ml-1">
										({node.inputPageCount} pages)
									</span>
								)}
							</span>
						</div>
						<div className="flex items-center gap-1.5">
							<div
								className={`w-2 h-2 rounded-full ${
									node.inputHasLocalKnowledge ? 'bg-green-500' : 'bg-slate-600'
								}`}
							/>
							<span
								className={
									node.inputHasLocalKnowledge
										? 'text-slate-300'
										: 'text-slate-500'
								}
							>
								Local Knowledge
							</span>
						</div>
						<div className="flex items-center gap-1.5">
							<div
								className={`w-2 h-2 rounded-full ${
									node.inputHasSerpData ? 'bg-green-500' : 'bg-slate-600'
								}`}
							/>
							<span
								className={
									node.inputHasSerpData ? 'text-slate-300' : 'text-slate-500'
								}
							>
								SERP Data
								<span className="text-slate-600 ml-1">(optional)</span>
							</span>
						</div>
						{node.inputCity && (
							<div className="text-slate-400">
								{node.inputCity}, {node.inputState}
							</div>
						)}
					</div>
				</div>

				{/* Content type selector */}
				<div className="bg-slate-800/50 rounded-lg p-2 space-y-2">
					<div className="text-[10px] text-slate-500 uppercase tracking-wider">
						Content Types
					</div>
					<ContentTypeSelector
						selectedTypes={node.contentTypes}
						onChange={handleContentTypesChange}
						disabled={isGenerating}
					/>
				</div>

				{/* Quality level */}
				<div className="flex items-center justify-between">
					<span className="text-xs text-slate-400">Quality</span>
					<div className="flex rounded-lg overflow-hidden border border-slate-700">
						{QUALITY_OPTIONS.map((option) => (
							<button
								key={option.value}
								onClick={() => handleQualityChange(option.value)}
								disabled={isGenerating}
								className={`px-3 py-1 text-xs transition-colors ${
									node.qualityLevel === option.value
										? 'bg-emerald-500/20 text-emerald-400'
										: 'bg-slate-800 text-slate-400 hover:bg-slate-700'
								} ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
							>
								{option.label}
							</button>
						))}
					</div>
				</div>

				{/* Model selector */}
				<div className="flex items-center justify-between">
					<span className="text-xs text-slate-400">Model</span>
					<div className="flex rounded-lg overflow-hidden border border-slate-700">
						{MODEL_OPTIONS.map((option) => (
							<button
								key={option.value}
								onClick={() => handleModelChange(option.value)}
								disabled={isGenerating}
								title={option.description}
								className={`px-2 py-1 text-xs transition-colors ${
									node.modelKey === option.value
										? 'bg-purple-500/20 text-purple-400'
										: 'bg-slate-800 text-slate-400 hover:bg-slate-700'
								} ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
							>
								{option.label}
							</button>
						))}
					</div>
				</div>

				{/* Estimate */}
				{estimatedPages > 0 && (
					<div className="flex items-center justify-between text-xs text-slate-500">
						<span>Estimated output:</span>
						<span>
							{estimatedPages} pages, {estimatedWords.toLocaleString()} words
						</span>
					</div>
				)}

				{/* Action button */}
				<div className="flex gap-2">
					{isGenerating ? (
						<button
							onClick={stopGeneration}
							className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
						>
							<Square size={14} />
							<span className="text-sm">Stop</span>
						</button>
					) : (
						<button
							onClick={handleRun}
							disabled={!canRun}
							className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors ${
								canRun
									? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400'
									: 'bg-slate-800 text-slate-600 cursor-not-allowed'
							}`}
						>
							<Play size={14} />
							<span className="text-sm">Generate Content</span>
						</button>
					)}
				</div>

				{/* Requirements warning */}
				{!canRun && !isGenerating && (
					<div className="flex items-start gap-2 text-xs text-amber-400 bg-amber-500/10 rounded-lg p-2">
						<AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
						<span>
							{!node.inputHasBlueprint && 'Connect Site Blueprint. '}
							{!node.inputHasLocalKnowledge && 'Connect Local Knowledge. '}
							{node.contentTypes.length === 0 &&
								'Select at least one content type.'}
						</span>
					</div>
				)}

				{/* Error display */}
				{node.error && (
					<div className="flex items-start gap-2 text-xs text-red-400 bg-red-500/10 rounded-lg p-2">
						<AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
						<span>{node.error}</span>
					</div>
				)}

				{/* Output preview */}
				{output && output.pages.length > 0 && (
					<div className="border-t border-slate-700/50 pt-3">
						<EditorialPreview content={output} />
					</div>
				)}

				{/* Last generated timestamp */}
				{node.lastGeneratedAt && (
					<div className="text-[10px] text-slate-600 text-right">
						Last generated: {new Date(node.lastGeneratedAt).toLocaleString()}
					</div>
				)}
			</div>
		</BaseNode>
	);
}

export default EditorialContentGeneratorNode;
