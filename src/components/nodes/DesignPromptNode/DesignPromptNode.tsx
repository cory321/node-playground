import React, { useState, useEffect, useCallback } from 'react';
import {
	Wand2,
	Play,
	AlertCircle,
	Copy,
	Check,
	ChevronDown,
	ChevronUp,
	Loader2,
	Palette,
} from 'lucide-react';
import { DesignPromptNodeData, HoveredPort } from '@/types/nodes';
import { SitePlannerOutput } from '@/types/sitePlanner';
import { BaseNode } from '../base';
import { callLLM } from '@/api/llm';
import {
	DESIGN_PROMPT_SYSTEM,
	createUserPrompt,
	determineMarketLevel,
	extractServiceTypes,
	DesignPromptVariables,
} from './goldenPrompt';

interface DesignPromptNodeProps {
	node: DesignPromptNodeData;
	updateNode: (id: string, updates: Partial<DesignPromptNodeData>) => void;
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
	incomingData: SitePlannerOutput | null;
}

export function DesignPromptNode({
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
}: DesignPromptNodeProps) {
	const [showPrompt, setShowPrompt] = useState(false);
	const [copied, setCopied] = useState(false);

	const isLoading = node.status === 'loading';
	const hasError = node.status === 'error';
	const hasPrompt = node.status === 'success' && node.generatedPrompt;

	// Update inputs when incoming data changes
	useEffect(() => {
		if (incomingData) {
			const updates: Partial<DesignPromptNodeData> = {};

			// Extract data from blueprint
			const meta = incomingData.meta;
			const brand = incomingData.brand;
			const localKnowledge = incomingData.localKnowledge;

			if (meta.city !== node.inputCity) {
				updates.inputCity = meta.city;
			}
			if (meta.state !== node.inputState) {
				updates.inputState = meta.state;
			}
			if (meta.category !== node.inputCategory) {
				updates.inputCategory = meta.category;
			}
			if (brand?.name !== node.inputBrandName) {
				updates.inputBrandName = brand?.name || null;
			}
			if (brand?.tagline !== node.inputTagline) {
				updates.inputTagline = brand?.tagline || null;
			}

			const providerCount = incomingData.providers?.length || 0;
			if (providerCount !== node.inputProviderCount) {
				updates.inputProviderCount = providerCount;
			}

			const region = localKnowledge?.regionalIdentity?.region || null;
			if (region !== node.inputRegion) {
				updates.inputRegion = region;
			}

			const hasBlueprint = !!incomingData;
			if (hasBlueprint !== node.inputHasBlueprint) {
				updates.inputHasBlueprint = hasBlueprint;
			}

			if (Object.keys(updates).length > 0) {
				updateNode(node.id, updates);
			}
		}
	}, [incomingData, node, updateNode]);

	// Handle prompt generation
	const handleGenerate = useCallback(async () => {
		if (!incomingData) return;

		updateNode(node.id, { status: 'loading', error: null });

		try {
			const brand = incomingData.brand;
			const meta = incomingData.meta;
			const localKnowledge = incomingData.localKnowledge;

			// Build variables for prompt
			const variables: DesignPromptVariables = {
				brandName: brand?.name || `${meta.city} ${meta.category} Guide`,
				tagline: brand?.tagline || 'Your trusted local resource',
				category: meta.category,
				city: meta.city,
				state: meta.state,
				region: localKnowledge?.regionalIdentity?.region || '',
				providerCount: incomingData.providers?.length || 0,
				serviceTypes: extractServiceTypes(incomingData.pages || []),
				personality:
					brand?.voiceTone?.personality?.join(', ') ||
					'helpful, local, straightforward',
				climateNotes:
					localKnowledge?.contentHooks?.climateContext?.join('; ') || '',
				marketLevel: determineMarketLevel(
					localKnowledge?.marketContext?.pricePosition || 'middle',
				),
				primaryColor: node.primaryColorOverride || undefined,
			};

			const userPrompt = createUserPrompt(variables);

			// Call Claude to generate the image prompt
			const response = await callLLM(
				'claude-sonnet',
				userPrompt,
				'claude-sonnet',
				DESIGN_PROMPT_SYSTEM,
				false,
			);

			updateNode(node.id, {
				status: 'success',
				generatedPrompt: response,
				error: null,
				lastGeneratedAt: Date.now(),
			});
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Unknown error';
			updateNode(node.id, {
				status: 'error',
				error: errorMessage,
				generatedPrompt: null,
			});
		}
	}, [node.id, node.primaryColorOverride, incomingData, updateNode]);

	// Handle copy
	const handleCopy = () => {
		if (!node.generatedPrompt) return;
		navigator.clipboard.writeText(node.generatedPrompt);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const canRun = !!incomingData && !isLoading;

	const loadingOverlay = (
		<div className="absolute inset-0 z-40 bg-slate-900/80 backdrop-blur-sm rounded-2xl flex items-center justify-center">
			<div className="flex flex-col items-center gap-3">
				<div className="relative">
					<div className="w-12 h-12 rounded-full border-2 border-transparent border-t-fuchsia-500 border-r-pink-500 animate-spin" />
					<Wand2
						size={20}
						className="absolute inset-0 m-auto text-fuchsia-400"
					/>
				</div>
				<span className="text-[10px] uppercase tracking-[0.2em] text-fuchsia-300 font-mono">
					Generating prompt...
				</span>
			</div>
		</div>
	);

	return (
		<BaseNode
			node={node}
			icon={<Wand2 size={14} className="text-fuchsia-400" />}
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
					? 'border-fuchsia-500/50 shadow-fuchsia-500/20'
					: hasError
						? 'border-red-500/50'
						: 'border-slate-700/50'
			}
			hoverBorderClass="group-hover:border-fuchsia-500/30"
			resizeHoverColor="hover:text-fuchsia-400"
		>
			<div className="flex flex-col gap-3 text-sm">
				{/* Input Summary */}
				{incomingData ? (
					<div className="flex flex-col gap-1.5 text-xs">
						<div className="flex gap-2">
							<div className="bg-fuchsia-500/10 text-fuchsia-400 px-2 py-1 rounded truncate flex-1">
								{node.inputCity}, {node.inputState}
							</div>
							<div className="bg-fuchsia-500/10 text-fuchsia-400 px-2 py-1 rounded truncate flex-1">
								{node.inputCategory}
							</div>
						</div>
						<div className="bg-slate-800/50 text-slate-300 px-2 py-1 rounded truncate">
							{node.inputBrandName || 'No brand name'}
						</div>
						<div className="flex gap-2 text-slate-400">
							<span>
								{node.inputProviderCount} provider
								{node.inputProviderCount !== 1 ? 's' : ''}
							</span>
							{node.inputRegion && (
								<>
									<span>•</span>
									<span className="truncate">{node.inputRegion}</span>
								</>
							)}
						</div>
					</div>
				) : (
					<div className="text-xs text-slate-500 text-center py-2">
						Connect Site Planner output
					</div>
				)}

				{/* Primary Color Override */}
				<div className="flex flex-col gap-1">
					<label className="text-xs text-slate-400 flex items-center gap-1">
						<Palette size={12} />
						Primary Color Override (optional)
					</label>
					<div className="flex gap-2">
						<input
							type="text"
							value={node.primaryColorOverride || ''}
							onChange={(e) =>
								updateNode(node.id, {
									primaryColorOverride: e.target.value || null,
								})
							}
							placeholder="#d946ef"
							className="flex-1 bg-slate-950/40 border border-slate-800/80 rounded-lg px-3 py-1.5 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-fuchsia-500/30"
						/>
						{node.primaryColorOverride && (
							<div
								className="w-8 h-8 rounded-lg border border-slate-700"
								style={{ backgroundColor: node.primaryColorOverride }}
							/>
						)}
					</div>
				</div>

				{/* Generate Button */}
				<button
					onClick={handleGenerate}
					disabled={!canRun}
					className={`flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-medium transition-all ${
						canRun
							? 'bg-fuchsia-500 hover:bg-fuchsia-400 text-white'
							: 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
					}`}
				>
					{isLoading ? (
						<Loader2 size={14} className="animate-spin" />
					) : (
						<Play size={14} />
					)}
					Generate Design Prompt
				</button>

				{/* Error Display */}
				{hasError && node.error && (
					<div className="flex items-start gap-2 text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">
						<AlertCircle size={14} className="mt-0.5 shrink-0" />
						<span className="text-xs">{node.error}</span>
					</div>
				)}

				{/* Generated Prompt Preview */}
				{hasPrompt && (
					<div className="flex flex-col gap-2">
						<div className="flex items-center justify-between">
							<button
								onClick={() => setShowPrompt(!showPrompt)}
								className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-fuchsia-400 hover:text-fuchsia-300 transition-colors"
							>
								{showPrompt ? (
									<ChevronUp size={12} />
								) : (
									<ChevronDown size={12} />
								)}
								Generated Prompt
							</button>
							<button
								onClick={handleCopy}
								className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-slate-500 hover:text-fuchsia-400 transition-colors"
							>
								{copied ? <Check size={10} /> : <Copy size={10} />}
								{copied ? 'Copied' : 'Copy'}
							</button>
						</div>
						{showPrompt && (
							<div className="bg-slate-950/60 border border-fuchsia-500/20 rounded-lg p-3 max-h-48 overflow-y-auto scrollbar-hide">
								<p className="text-xs text-slate-300 whitespace-pre-wrap">
									{node.generatedPrompt}
								</p>
							</div>
						)}
						{!showPrompt && (
							<div className="text-xs text-slate-400 bg-slate-800/30 rounded-lg px-3 py-2 truncate">
								{node.generatedPrompt?.slice(0, 80)}...
							</div>
						)}
					</div>
				)}
			</div>
		</BaseNode>
	);
}

export default DesignPromptNode;
