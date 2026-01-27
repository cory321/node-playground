/**
 * DeploymentStatus Component
 * Shows Vercel deployment progress and preview URL
 */

import React from 'react';
import {
	Loader2,
	CheckCircle,
	XCircle,
	ExternalLink,
	Cloud,
	Upload,
	Hammer,
} from 'lucide-react';
import { DeployProgress, getDeployPhaseLabel } from '@/services/vercelDeploy';

interface DeploymentStatusProps {
	progress: DeployProgress;
	isDeploying: boolean;
}

export function DeploymentStatus({ progress, isDeploying }: DeploymentStatusProps) {
	const { phase, filesUploaded, totalFiles, deploymentUrl, error } = progress;

	// Calculate progress percentage
	const getProgressPercent = () => {
		switch (phase) {
			case 'idle':
				return 0;
			case 'uploading':
				return totalFiles > 0 ? Math.round((filesUploaded / totalFiles) * 40) : 0;
			case 'creating':
				return 45;
			case 'building':
				return 70;
			case 'ready':
				return 100;
			case 'error':
				return 0;
			default:
				return 0;
		}
	};

	// Get phase icon
	const getPhaseIcon = () => {
		switch (phase) {
			case 'uploading':
				return <Upload size={12} className="text-blue-400" />;
			case 'creating':
			case 'building':
				return <Hammer size={12} className="text-amber-400" />;
			case 'ready':
				return <CheckCircle size={12} className="text-green-400" />;
			case 'error':
				return <XCircle size={12} className="text-red-400" />;
			default:
				return <Cloud size={12} className="text-slate-400" />;
		}
	};

	// Don't show anything if idle and not deploying
	if (phase === 'idle' && !isDeploying) {
		return null;
	}

	return (
		<div className="flex flex-col gap-2 p-2 bg-slate-800/50 border border-slate-700 rounded-lg">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-1.5">
					{isDeploying && phase !== 'ready' && phase !== 'error' ? (
						<Loader2 size={12} className="text-blue-400 animate-spin" />
					) : (
						getPhaseIcon()
					)}
					<span className="text-[10px] font-medium text-slate-300">
						{getDeployPhaseLabel(phase)}
					</span>
				</div>
				{phase === 'uploading' && totalFiles > 0 && (
					<span className="text-[9px] text-slate-500">
						{filesUploaded}/{totalFiles} files
					</span>
				)}
			</div>

			{/* Progress bar */}
			{isDeploying && phase !== 'ready' && phase !== 'error' && (
				<div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden">
					<div
						className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-300"
						style={{ width: `${getProgressPercent()}%` }}
					/>
				</div>
			)}

			{/* Preview URL */}
			{deploymentUrl && phase === 'ready' && (
				<a
					href={deploymentUrl}
					target="_blank"
					rel="noopener noreferrer"
					className="flex items-center justify-center gap-1.5 px-2 py-1.5 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 rounded text-[10px] text-green-300 transition-colors"
				>
					<ExternalLink size={10} />
					<span className="font-mono truncate max-w-[180px]">
						{deploymentUrl.replace('https://', '')}
					</span>
				</a>
			)}

			{/* Building indicator with URL */}
			{deploymentUrl && phase === 'building' && (
				<div className="flex items-center gap-1.5 px-2 py-1 bg-amber-600/10 border border-amber-500/20 rounded text-[10px] text-amber-300">
					<Loader2 size={10} className="animate-spin" />
					<span>Building preview...</span>
				</div>
			)}

			{/* Error message */}
			{error && (
				<div className="flex items-start gap-1.5 p-1.5 bg-red-500/10 border border-red-500/20 rounded">
					<XCircle size={10} className="text-red-400 shrink-0 mt-0.5" />
					<span className="text-[9px] text-red-300 leading-relaxed">{error}</span>
				</div>
			)}
		</div>
	);
}

export default DeploymentStatus;
