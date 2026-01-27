import React, { useState, useCallback, useEffect } from 'react';
import JSZip from 'jszip';
import {
	Play,
	Square,
	Loader2,
	Copy,
	AlertCircle,
	ChevronDown,
	ChevronUp,
	Download,
	Eye,
	Code,
	Image as ImageIcon,
	FileText,
	Layers,
	CheckCircle,
	Rocket,
	RefreshCw,
} from 'lucide-react';
import { ScreenshotReplicatorNodeData, HoveredPort } from '@/types/nodes';
import { ReplicatorOutput, ScreenshotAnalysis, calculateReplicatorProgress, getReplicatorPhaseLabel, getAnalysisPassLabel } from '@/types/screenshotReplicator';
import { BaseNode } from '../base';
import { useScreenshotReplicator } from '@/hooks/useScreenshotReplicator';
import { useVercelDeploy } from '@/hooks/useVercelDeploy';
import { AnalysisPreview } from './AnalysisPreview';
import { AssetGallery } from './AssetGallery';
import { DeploymentStatus } from './DeploymentStatus';

type PreviewTab = 'analysis' | 'assets' | 'code';

interface ScreenshotReplicatorNodeProps {
	node: ScreenshotReplicatorNodeData;
	updateNode: (id: string, updates: Partial<ScreenshotReplicatorNodeData>) => void;
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
	incomingData: { screenshotUrl: string } | null;
}

export function ScreenshotReplicatorNode({
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
}: ScreenshotReplicatorNodeProps) {
	const [showPreview, setShowPreview] = useState(true);
	const [activeTab, setActiveTab] = useState<PreviewTab>('analysis');
	const [isDownloading, setIsDownloading] = useState(false);

	const { runReplication, runAnalysis, runCodeGenerationOnly, stop, isRunning, isRegeneratingCode } = useScreenshotReplicator({
		nodeId: node.id,
		updateNode,
	});

	// Vercel deployment hook
	const {
		progress: deployProgress,
		isDeploying,
		result: deployResult,
		isConfigured: isVercelConfigured,
		deploy,
		cancel: cancelDeploy,
	} = useVercelDeploy();

	const isLoading = node.status === 'loading' || isRunning;
	const hasError = node.status === 'error';
	const hasOutput = node.status === 'success' && node.output;
	const hasAnalysis = node.analysis !== null;

	// Get typed outputs
	const output = node.output as ReplicatorOutput | null;
	const analysis = node.analysis as ScreenshotAnalysis | null;

	// Get screenshot URL (from input or stored)
	const screenshotUrl = incomingData?.screenshotUrl || node.inputScreenshotUrl;

	// Sync incoming screenshot URL
	useEffect(() => {
		if (incomingData?.screenshotUrl && incomingData.screenshotUrl !== node.inputScreenshotUrl) {
			updateNode(node.id, {
				inputScreenshotUrl: incomingData.screenshotUrl,
			});
		}
	}, [incomingData?.screenshotUrl, node.id, node.inputScreenshotUrl, updateNode]);

	// Handle replication
	const handleReplicate = useCallback(() => {
		if (!screenshotUrl) {
			updateNode(node.id, {
				status: 'error',
				error: 'No screenshot connected. Connect an Image Source or Image Generator node.',
			});
			return;
		}
		runReplication(screenshotUrl);
	}, [screenshotUrl, runReplication, node.id, updateNode]);

	// Handle analysis only
	const handleAnalyze = useCallback(() => {
		if (!screenshotUrl) {
			updateNode(node.id, {
				status: 'error',
				error: 'No screenshot connected. Connect an Image Source or Image Generator node.',
			});
			return;
		}
		runAnalysis(screenshotUrl);
	}, [screenshotUrl, runAnalysis, node.id, updateNode]);

	// Check if we can regenerate code (have existing analysis and assets)
	const canRegenerateCode = analysis && output?.images && output.images.length > 0;

	// Handle regenerate code only (reuse existing analysis and assets)
	const handleRegenerateCode = useCallback(() => {
		if (!screenshotUrl) {
			updateNode(node.id, {
				status: 'error',
				error: 'No screenshot connected. Connect an Image Source or Image Generator node.',
			});
			return;
		}
		if (!analysis || !output?.images) {
			updateNode(node.id, {
				status: 'error',
				error: 'No existing analysis or assets. Run full replication first.',
			});
			return;
		}
		runCodeGenerationOnly(screenshotUrl, analysis, output.images);
	}, [screenshotUrl, analysis, output?.images, runCodeGenerationOnly, node.id, updateNode]);

	// Get progress info
	const progress = node.progress;
	const progressPercent = progress ? calculateReplicatorProgress(progress) : 0;
	
	const getProgressText = () => {
		if (!progress) return 'Preparing...';
		const { phase, currentPass, currentSection, currentAsset } = progress;
		
		if (phase === 'complete') return 'Complete';
		if (phase === 'analyzing' && currentPass) {
			return `Analyzing: ${getAnalysisPassLabel(currentPass)}`;
		}
		if (phase === 'generating-assets' && currentAsset) {
			return `Generating: ${currentAsset}`;
		}
		if (phase === 'generating-code' && currentSection) {
			return `Generating: ${currentSection}`;
		}
		return getReplicatorPhaseLabel(phase);
	};

	// Download generated code and assets as ZIP
	const handleDownload = useCallback(async () => {
		if (!output) return;
		
		setIsDownloading(true);
		
		try {
			const zip = new JSZip();
			
			// Add all generated code files
			for (const file of output.files) {
				zip.file(file.path, file.content);
			}
			
			// Add all generated images
			if (output.images && output.images.length > 0) {
				for (const img of output.images) {
					if (img.success && img.dataUrl) {
						// Extract base64 data from data URL
						const base64Match = img.dataUrl.match(/^data:[^;]+;base64,(.+)$/);
						if (base64Match) {
							const binaryData = atob(base64Match[1]);
							const bytes = new Uint8Array(binaryData.length);
							for (let i = 0; i < binaryData.length; i++) {
								bytes[i] = binaryData.charCodeAt(i);
							}
							zip.file(img.path, bytes, { binary: true });
						}
					}
				}
			}
			
			// Generate the ZIP file
			const blob = await zip.generateAsync({ 
				type: 'blob',
				compression: 'DEFLATE',
				compressionOptions: { level: 6 }
			});
			
			// Create download link
			const timestamp = new Date().toISOString().slice(0, 10);
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `replicated-page-${timestamp}.zip`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		} catch (error) {
			console.error('Failed to create ZIP:', error);
		} finally {
			setIsDownloading(false);
		}
	}, [output]);

	// Deploy to Vercel
	const handleDeploy = useCallback(async () => {
		if (!output) return;
		
		try {
			const projectName = `replicated-${Date.now().toString(36)}`;
			await deploy(output.files, output.images, projectName);
		} catch (error) {
			console.error('Deployment failed:', error);
		}
	}, [output, deploy]);

	// Loading overlay
	const loadingOverlay = (
		<div className="absolute inset-0 z-40 bg-slate-900/80 backdrop-blur-sm rounded-2xl flex items-center justify-center">
			<div className="flex flex-col items-center gap-3">
				<div className="relative">
					<div className="w-12 h-12 rounded-full border-2 border-transparent border-t-violet-500 border-r-purple-500 animate-spin" />
					<Copy size={20} className="absolute inset-0 m-auto text-violet-400" />
				</div>
				<span className="text-[10px] uppercase tracking-[0.2em] text-violet-300 font-mono">
					{getProgressText()}
				</span>
				<div className="w-32 h-1 bg-slate-700 rounded-full overflow-hidden">
					<div 
						className="h-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-300"
						style={{ width: `${progressPercent}%` }}
					/>
				</div>
				<span className="text-[10px] text-slate-400">
					{progressPercent}%
				</span>
			</div>
		</div>
	);

	// Tab button component
	const TabButton = ({ tab, label, icon: Icon }: { tab: PreviewTab; label: string; icon: React.ElementType }) => (
		<button
			onClick={() => setActiveTab(tab)}
			className={`flex items-center gap-1 px-2 py-1 text-[10px] uppercase tracking-wider rounded transition-all ${
				activeTab === tab
					? 'bg-violet-600 text-white'
					: 'bg-slate-800 text-slate-400 hover:text-white'
			}`}
		>
			<Icon size={12} />
			{label}
		</button>
	);

	return (
		<BaseNode
			node={node}
			updateNode={updateNode}
			deleteNode={deleteNode}
			onMouseDown={onMouseDown}
			onResizeStart={onResizeStart}
			editingTitleId={editingTitleId}
			setEditingTitleId={setEditingTitleId}
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
		>
			{isLoading && loadingOverlay}

			<div className="flex flex-col gap-3 p-3">
				{/* Screenshot Preview */}
				{screenshotUrl ? (
					<div className="relative rounded-lg overflow-hidden bg-slate-800 border border-slate-700">
						<img
							src={screenshotUrl}
							alt="Input screenshot"
							className="w-full h-32 object-cover object-top"
						/>
						<div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900/90 to-transparent p-2">
							<span className="text-[10px] text-slate-300">Screenshot connected</span>
						</div>
					</div>
				) : (
					<div className="flex items-center justify-center h-24 rounded-lg bg-slate-800 border border-dashed border-slate-600">
						<div className="flex flex-col items-center gap-1 text-slate-500">
							<ImageIcon size={20} />
							<span className="text-[10px]">Connect a screenshot</span>
						</div>
					</div>
				)}

				{/* Status Summary */}
				{(hasAnalysis || hasOutput) && (
					<div className="grid grid-cols-3 gap-2 text-center">
						<div className="bg-slate-800 rounded-lg p-2">
							<div className="text-lg font-bold text-violet-400">
								{analysis?.meta.totalSections || 0}
							</div>
							<div className="text-[9px] uppercase tracking-wider text-slate-500">Sections</div>
						</div>
						<div className="bg-slate-800 rounded-lg p-2">
							<div className="text-lg font-bold text-purple-400">
								{analysis?.meta.totalAssets || 0}
							</div>
							<div className="text-[9px] uppercase tracking-wider text-slate-500">Assets</div>
						</div>
						<div className="bg-slate-800 rounded-lg p-2">
							<div className="text-lg font-bold text-pink-400">
								{output?.metadata.totalFiles || 0}
							</div>
							<div className="text-[9px] uppercase tracking-wider text-slate-500">Files</div>
						</div>
					</div>
				)}

				{/* Action Buttons */}
				<div className="flex gap-2">
					{isLoading ? (
						<button
							onClick={stop}
							className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium transition-colors"
						>
							<Square size={14} />
							Stop
						</button>
					) : (
						<>
							<button
								onClick={handleAnalyze}
								disabled={!screenshotUrl}
								className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-xs font-medium transition-colors"
							>
								<Eye size={14} />
								Analyze
							</button>
							<button
								onClick={handleReplicate}
								disabled={!screenshotUrl}
								className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-xs font-medium transition-colors"
							>
								<Play size={14} />
								Replicate
							</button>
							{canRegenerateCode && (
								<button
									onClick={handleRegenerateCode}
									title="Regenerate code only (keeps existing images)"
									className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors"
								>
									<RefreshCw size={14} />
									<span className="hidden sm:inline">Regen</span>
								</button>
							)}
						</>
					)}
				</div>

				{/* Error Display */}
				{hasError && node.error && (
					<div className="flex items-start gap-2 p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
						<AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
						<p className="text-[11px] text-red-300 leading-relaxed">{node.error}</p>
					</div>
				)}

				{/* Results Preview */}
				{(hasAnalysis || hasOutput) && (
					<div className="flex flex-col gap-2">
						{/* Preview Toggle */}
						<button
							onClick={() => setShowPreview(!showPreview)}
							className="flex items-center justify-between w-full px-2 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-[11px] text-slate-300 transition-colors"
						>
							<span className="flex items-center gap-1.5">
								<CheckCircle size={12} className="text-green-400" />
								Results
							</span>
							{showPreview ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
						</button>

						{showPreview && (
							<div className="flex flex-col gap-2">
								{/* Tabs */}
								<div className="flex gap-1">
									<TabButton tab="analysis" label="Analysis" icon={Layers} />
									<TabButton tab="assets" label="Assets" icon={ImageIcon} />
									<TabButton tab="code" label="Code" icon={Code} />
								</div>

								{/* Tab Content */}
								<div className="bg-slate-800 rounded-lg p-2 max-h-64 overflow-y-auto">
									{activeTab === 'analysis' && analysis && (
										<AnalysisPreview analysis={analysis} />
									)}
									{activeTab === 'assets' && output && (
										<AssetGallery assets={output.images} />
									)}
									{activeTab === 'code' && output && (
										<div className="space-y-2">
											{output.files.slice(0, 5).map((file, i) => (
												<div key={i} className="flex items-center gap-2 text-[10px]">
													<FileText size={12} className="text-slate-500" />
													<span className="text-slate-300 font-mono">{file.path}</span>
												</div>
											))}
											{output.files.length > 5 && (
												<div className="text-[10px] text-slate-500">
													+{output.files.length - 5} more files
												</div>
											)}
										</div>
									)}
								</div>

								{/* Action Buttons */}
								{hasOutput && (
									<div className="flex flex-col gap-2">
										<div className="flex gap-2">
											{/* Download Button */}
											<button
												onClick={handleDownload}
												disabled={isDownloading || isDeploying}
												className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-xs font-medium transition-colors"
											>
												{isDownloading ? (
													<>
														<Loader2 size={14} className="animate-spin" />
														ZIP...
													</>
												) : (
													<>
														<Download size={14} />
														Download
													</>
												)}
											</button>

											{/* Deploy to Vercel Button */}
											{isVercelConfigured ? (
												isDeploying ? (
													<button
														onClick={cancelDeploy}
														className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium transition-colors"
													>
														<Square size={14} />
														Cancel
													</button>
												) : (
													<button
														onClick={handleDeploy}
														disabled={isDownloading || deployProgress.phase === 'ready'}
														className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-xs font-medium transition-colors"
													>
														<Rocket size={14} />
														Deploy
													</button>
												)
											) : (
												<button
													disabled
													title="Set VITE_VERCEL_TOKEN to enable"
													className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-700 opacity-50 cursor-not-allowed text-slate-400 rounded-lg text-xs font-medium"
												>
													<Rocket size={14} />
													Deploy
												</button>
											)}
										</div>

										{/* Deployment Status */}
										<DeploymentStatus
											progress={deployProgress}
											isDeploying={isDeploying}
										/>
									</div>
								)}
							</div>
						)}
					</div>
				)}
			</div>
		</BaseNode>
	);
}

export default ScreenshotReplicatorNode;
