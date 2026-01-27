import React, { useState, useEffect, useMemo } from 'react';
import JSZip from 'jszip';
import {
	Code2,
	Play,
	Square,
	AlertCircle,
	Download,
	Check,
	FileCheck,
	FolderOpen,
	Eye,
	Sparkles,
	ImageIcon,
} from 'lucide-react';
import { CodeGenerationNodeData, HoveredPort } from '@/types/nodes';
import { Connection } from '@/types/connections';
import { SitePlannerOutput } from '@/types/sitePlanner';
import { SEOOptimizedPackage } from '@/types/seoPackage';
import { BrandDesignOutput } from '@/types/brandDesign';
import { GeneratedProviderProfile } from '@/types/generatedProfile';
import {
	GeneratedCodebase,
	CodeGenInputs,
	buildFileTree,
	formatBytes,
	getPhaseLabel,
} from '@/types/codeGeneration';
import { BaseNode } from '../base';
import { useCodeGenerator } from '@/hooks/useCodeGenerator';
import { MultiInputPort, CODE_GEN_INPUT_PORTS } from './MultiInputPort';
import { FileTreePreview } from './FileTreePreview';
import { CodePreview } from './CodePreview';

interface CodeGenerationNodeProps {
	node: CodeGenerationNodeData;
	updateNode: (id: string, updates: Partial<CodeGenerationNodeData>) => void;
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
	// Note: editorialContent and comparisonData are now passed through SEO package's sourceData
	incomingData: {
		sitePlan: SitePlannerOutput | null;
		seoPackage: SEOOptimizedPackage | null;
		brandDesign: BrandDesignOutput | null;
		providerProfiles: GeneratedProviderProfile[];
	} | null;
}

export function CodeGenerationNode({
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
}: CodeGenerationNodeProps) {
	// Code generation hook
	const { runGeneration, stopGeneration, isGenerating } = useCodeGenerator({
		nodeId: node.id,
		updateNode,
	});

	// UI state
	const [viewMode, setViewMode] = useState<'tree' | 'preview'>('tree');
	const [selectedFile, setSelectedFile] = useState<string | null>(null);

	// Extract editorial and comparison data from SEO package's sourceData
	const editorialContent = incomingData?.seoPackage?.sourceData?.editorialContent ?? null;
	const comparisonData = incomingData?.seoPackage?.sourceData?.comparisonData ?? null;

	// Update inputs when incoming data changes
	useEffect(() => {
		if (incomingData) {
			const updates: Partial<CodeGenerationNodeData> = {};

			// Site Plan data
			if (incomingData.sitePlan) {
				const meta = incomingData.sitePlan.meta;
				if (meta.city !== node.inputCity) {
					updates.inputCity = meta.city;
				}
				if (meta.state !== node.inputState) {
					updates.inputState = meta.state;
				}
				if (meta.category !== node.inputCategory) {
					updates.inputCategory = meta.category;
				}
				if (meta.pageCount !== node.inputPageCount) {
					updates.inputPageCount = meta.pageCount;
				}
			}

			// Input presence tracking
			const hasSitePlan = !!incomingData.sitePlan;
			const hasSEO = !!incomingData.seoPackage;
			const hasBrandDesign = !!incomingData.brandDesign;
			// Editorial and Comparison come from SEO package's sourceData
			const hasEditorial = !!editorialContent;
			const hasProfiles = incomingData.providerProfiles?.length > 0;
			const hasComparison = !!comparisonData;

			if (hasSitePlan !== node.inputHasSitePlan) {
				updates.inputHasSitePlan = hasSitePlan;
			}
			if (hasSEO !== node.inputHasSEO) {
				updates.inputHasSEO = hasSEO;
			}
			if (hasBrandDesign !== node.inputHasBrandDesign) {
				updates.inputHasBrandDesign = hasBrandDesign;
			}
			if (hasEditorial !== node.inputHasEditorial) {
				updates.inputHasEditorial = hasEditorial;
			}
			if (hasProfiles !== node.inputHasProfiles) {
				updates.inputHasProfiles = hasProfiles;
			}
			if (hasComparison !== node.inputHasComparison) {
				updates.inputHasComparison = hasComparison;
			}

			if (Object.keys(updates).length > 0) {
				updateNode(node.id, updates);
			}
		}
	}, [incomingData, editorialContent, comparisonData, node, updateNode]);

	// Handle run button
	const handleRun = () => {
		if (!incomingData?.sitePlan || !incomingData?.seoPackage || !incomingData?.brandDesign) {
			return;
		}

		const inputs: CodeGenInputs = {
			sitePlan: incomingData.sitePlan,
			seoPackage: incomingData.seoPackage,
			brandDesign: incomingData.brandDesign,
			// Editorial and Comparison data come from SEO package's sourceData
			editorialContent,
			providerProfiles: incomingData.providerProfiles || [],
			comparisonData,
		};

		// Pass generation options
		runGeneration(inputs, {
			includeReadme: node.includeReadme,
			useLLM: node.useLLM ?? false,
			generateImages: node.generateImages ?? false,
		});
	};

	// Download state for async ZIP generation
	const [isDownloading, setIsDownloading] = useState(false);

	// Handle download - creates a ZIP file with all generated files and images
	const handleDownload = async () => {
		if (!output) return;

		setIsDownloading(true);

		try {
			const zip = new JSZip();

			// Add all generated code files
			for (const file of output.files) {
				zip.file(file.path, file.content);
			}

			// Add all generated images (if any)
			if (output.images && output.images.length > 0) {
				for (const img of output.images) {
					// Convert base64 to binary
					const binaryData = atob(img.data);
					const bytes = new Uint8Array(binaryData.length);
					for (let i = 0; i < binaryData.length; i++) {
						bytes[i] = binaryData.charCodeAt(i);
					}
					zip.file(img.path, bytes, { binary: true });
				}
			}

			// Generate the ZIP file
			const blob = await zip.generateAsync({ 
				type: 'blob',
				compression: 'DEFLATE',
				compressionOptions: { level: 6 }
			});

			// Create download link
			const brandName = output.metadata.sitePlan.brandName || 'generated-site';
			const safeName = brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `${safeName}.zip`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		} catch (error) {
			console.error('Failed to create ZIP:', error);
		} finally {
			setIsDownloading(false);
		}
	};

	const isLoading = node.status === 'loading';
	const hasError = node.status === 'error';
	const output = node.output as GeneratedCodebase | null;
	const hasResults = node.status === 'success' && output && output.files.length > 0;

	// Required inputs check
	const hasRequiredInputs =
		!!incomingData?.sitePlan &&
		!!incomingData?.seoPackage &&
		!!incomingData?.brandDesign;

	// Can run if we have required inputs
	const canRun = hasRequiredInputs && !isLoading;

	// Calculate connected and ready ports
	const connectedPorts = useMemo(() => {
		const connected = new Set<string>();
		CODE_GEN_INPUT_PORTS.forEach((port) => {
			if (getInputPortConnections(port.id).length > 0) {
				connected.add(port.id);
			}
		});
		return connected;
	}, [getInputPortConnections]);

	const readyPorts = useMemo(() => {
		const ready = new Set<string>();
		if (incomingData?.sitePlan) ready.add('sitePlan');
		if (incomingData?.seoPackage) ready.add('seoPackage');
		if (incomingData?.brandDesign) ready.add('brandDesign');
		if (incomingData?.providerProfiles?.length > 0) ready.add('profiles');
		// Note: Editorial and Comparison data come from SEO package's sourceData, not separate ports
		return ready;
	}, [incomingData]);

	const isConnectionActive = !!connectingFrom || !!connectingTo;

	// Build file tree for preview
	const fileTree = useMemo(() => {
		if (!output?.files.length) return null;
		return buildFileTree(output.files);
	}, [output]);

	// Get selected file content
	const selectedFileData = useMemo(() => {
		if (!selectedFile || !output) return null;
		return output.files.find((f) => f.path === selectedFile) || null;
	}, [selectedFile, output]);

	// Loading overlay
	const loadingOverlay = (
		<div className="absolute inset-0 z-40 bg-slate-900/80 backdrop-blur-sm rounded-2xl flex items-center justify-center">
			<div className="flex flex-col items-center gap-3">
				<div className="relative">
					<div className="w-12 h-12 rounded-full border-2 border-transparent border-t-emerald-500 border-r-green-500 animate-spin" />
					<Code2 size={20} className="absolute inset-0 m-auto text-emerald-400" />
				</div>
				<div className="text-sm text-white/80">
					{getPhaseLabel(node.progress.phase)}
				</div>
				{node.progress.currentFile && (
					<div className="text-xs text-slate-400 font-mono truncate max-w-[200px]">
						{node.progress.currentFile}
					</div>
				)}
				{node.progress.totalFiles > 0 && (
					<div className="w-48 h-1.5 bg-slate-700 rounded-full overflow-hidden">
						<div
							className="h-full bg-emerald-500 transition-all duration-300"
							style={{
								width: `${(node.progress.filesGenerated / node.progress.totalFiles) * 100}%`,
							}}
						/>
					</div>
				)}
				<div className="text-xs text-slate-500">
					{node.progress.filesGenerated} / {node.progress.totalFiles} files
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
			icon={<Code2 size={14} className="text-emerald-400" />}
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
			isLoading={isLoading}
			loadingOverlay={loadingOverlay}
			borderClass={
				isLoading
					? 'border-emerald-500/50 shadow-emerald-500/20'
					: hasError
						? 'border-red-500/50'
						: hasResults
							? 'border-emerald-500/30'
							: 'border-slate-700/50'
			}
			hoverBorderClass="group-hover:border-emerald-500/30"
			resizeHoverColor="hover:text-emerald-400"
			extraPorts={
				<MultiInputPort
					nodeId={node.id}
					ports={CODE_GEN_INPUT_PORTS}
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
				{/* Input Status Summary */}
				<div className="grid grid-cols-2 gap-2 text-xs">
					{/* Required Inputs */}
					<div
						className={`px-2 py-1.5 rounded flex items-center gap-1.5 ${
							node.inputHasSitePlan
								? 'bg-green-500/10 text-green-400'
								: 'bg-slate-800/50 text-slate-500'
						}`}
					>
						{node.inputHasSitePlan ? <Check size={10} /> : null}
						Site Plan
						{node.inputHasSitePlan && node.inputPageCount > 0 && (
							<span className="text-slate-500 ml-auto">{node.inputPageCount} pages</span>
						)}
					</div>
					<div
						className={`px-2 py-1.5 rounded flex items-center gap-1.5 ${
							node.inputHasSEO
								? 'bg-green-500/10 text-green-400'
								: 'bg-slate-800/50 text-slate-500'
						}`}
					>
						{node.inputHasSEO ? <Check size={10} /> : null}
						SEO Package
					</div>
					<div
						className={`px-2 py-1.5 rounded flex items-center gap-1.5 ${
							node.inputHasBrandDesign
								? 'bg-green-500/10 text-green-400'
								: 'bg-slate-800/50 text-slate-500'
						}`}
					>
						{node.inputHasBrandDesign ? <Check size={10} /> : null}
						Brand Design
					</div>
					<div
						className={`px-2 py-1.5 rounded flex items-center gap-1.5 ${
							node.inputHasProfiles
								? 'bg-emerald-500/10 text-emerald-400'
								: 'bg-slate-800/50 text-slate-500'
						}`}
					>
						{node.inputHasProfiles ? <Check size={10} /> : null}
						Profiles
					</div>
					{/* Editorial and Comparison come from SEO Package - show as derived data */}
					<div
						className={`px-2 py-1.5 rounded flex items-center gap-1.5 ${
							node.inputHasEditorial
								? 'bg-green-500/10 text-green-400'
								: 'bg-slate-800/50 text-slate-500'
						}`}
						title="Editorial data is passed through from SEO Package"
					>
						{node.inputHasEditorial ? <Check size={10} className="text-green-400" /> : null}
						Editorial
						{node.inputHasEditorial && (
							<span className="text-[8px] text-slate-500 ml-auto">via SEO</span>
						)}
					</div>
					<div
						className={`px-2 py-1.5 rounded flex items-center gap-1.5 ${
							node.inputHasComparison
								? 'bg-green-500/10 text-green-400'
								: 'bg-slate-800/50 text-slate-500'
						}`}
						title="Comparison data is passed through from SEO Package"
					>
						{node.inputHasComparison ? <Check size={10} className="text-green-400" /> : null}
						Comparison
						{node.inputHasComparison && (
							<span className="text-[8px] text-slate-500 ml-auto">via SEO</span>
						)}
					</div>
				</div>

				{/* Location/Category Info */}
				{node.inputCity && node.inputCategory && (
					<div className="flex gap-2 text-xs">
						<div className="bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded truncate flex-1">
							{node.inputCity}, {node.inputState}
						</div>
						<div className="bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded truncate flex-1">
							{node.inputCategory}
						</div>
					</div>
				)}

				{/* Options */}
				<div className="flex flex-col gap-2 p-2 bg-slate-800/30 rounded-lg">
					<div className="text-[9px] uppercase tracking-wider text-slate-500 font-medium">Generation Options</div>
					<div className="flex flex-wrap gap-x-4 gap-y-2">
						<label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
							<input
								type="checkbox"
								checked={node.includeReadme}
								onChange={(e) => updateNode(node.id, { includeReadme: e.target.checked })}
								className="rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500/30 w-3 h-3"
							/>
							README
						</label>
						<label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer" title="Use Claude Opus 4.5 for homepage, Haiku for other pages">
							<input
								type="checkbox"
								checked={node.useLLM ?? false}
								onChange={(e) => updateNode(node.id, { useLLM: e.target.checked })}
								className="rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500/30 w-3 h-3"
							/>
							<Sparkles size={10} className="text-indigo-400" />
							LLM Pages
						</label>
						<label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer" title="Generate images using Gemini Imagen 3">
							<input
								type="checkbox"
								checked={node.generateImages ?? false}
								onChange={(e) => updateNode(node.id, { generateImages: e.target.checked })}
								className="rounded border-slate-600 bg-slate-800 text-violet-500 focus:ring-violet-500/30 w-3 h-3"
							/>
							<ImageIcon size={10} className="text-violet-400" />
							Images
						</label>
					</div>
				</div>

				{/* Run Button */}
				<div className="flex gap-2">
					<button
						onClick={handleRun}
						disabled={!canRun}
						className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-medium transition-all ${
							canRun
								? 'bg-emerald-500 hover:bg-emerald-400 text-white'
								: 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
						}`}
					>
						<Play size={14} />
						Generate Codebase
					</button>
					{hasResults && (
						<button
							onClick={handleDownload}
							disabled={isDownloading}
							title="Download as ZIP"
							className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-medium transition-all ${
								isDownloading
									? 'bg-slate-800 text-slate-500 cursor-wait'
									: 'bg-slate-700 hover:bg-slate-600 text-slate-300'
							}`}
						>
							{isDownloading ? (
								<div className="w-3.5 h-3.5 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
							) : (
								<Download size={14} />
							)}
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

				{/* Results */}
				{hasResults && output && (
					<div className="flex flex-col gap-2">
						{/* Stats */}
						<div className="flex items-center gap-4 text-xs bg-emerald-500/10 px-3 py-2 rounded-lg">
							<div className="flex items-center gap-1.5 text-emerald-400">
								<FileCheck size={12} />
								{output.files.length} files
							</div>
							{output.images && output.images.length > 0 && (
								<div className="flex items-center gap-1.5 text-violet-400">
									<ImageIcon size={12} />
									{output.images.length} images
								</div>
							)}
							<div className="text-slate-400">
								{formatBytes(output.metadata.totalBytes)}
							</div>
						</div>

						{/* View Toggle */}
						<div className="flex gap-1 bg-slate-800/50 p-1 rounded-lg">
							<button
								onClick={() => setViewMode('tree')}
								className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded text-xs font-medium transition-colors ${
									viewMode === 'tree'
										? 'bg-emerald-500 text-white'
										: 'text-slate-400 hover:text-slate-300'
								}`}
							>
								<FolderOpen size={12} />
								File Tree
							</button>
							<button
								onClick={() => setViewMode('preview')}
								className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded text-xs font-medium transition-colors ${
									viewMode === 'preview'
										? 'bg-emerald-500 text-white'
										: 'text-slate-400 hover:text-slate-300'
								}`}
							>
								<Eye size={12} />
								Preview
							</button>
						</div>

						{/* Content */}
						{viewMode === 'tree' && fileTree && (
							<FileTreePreview
								tree={fileTree}
								onFileSelect={(path) => {
									setSelectedFile(path);
									setViewMode('preview');
								}}
								selectedFile={selectedFile}
								maxHeight={200}
							/>
						)}
						{viewMode === 'preview' && (
							<CodePreview file={selectedFileData} maxHeight={200} />
						)}
					</div>
				)}
			</div>
		</BaseNode>
	);
}

export default CodeGenerationNode;
