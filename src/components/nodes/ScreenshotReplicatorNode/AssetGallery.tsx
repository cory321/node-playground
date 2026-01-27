import React, { useState } from 'react';
import { Image as ImageIcon, CheckCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { GeneratedAsset } from '@/types/screenshotReplicator';

interface AssetGalleryProps {
	assets: GeneratedAsset[];
}

export function AssetGallery({ assets }: AssetGalleryProps) {
	const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

	if (assets.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-4 text-slate-500">
				<ImageIcon size={24} className="mb-2" />
				<span className="text-[10px]">No assets generated</span>
			</div>
		);
	}

	const successfulAssets = assets.filter(a => a.success && a.dataUrl);
	const failedAssets = assets.filter(a => !a.success);

	// Selected asset for preview
	const selectedAsset = selectedIndex !== null ? successfulAssets[selectedIndex] : null;

	return (
		<div className="space-y-3">
			{/* Stats */}
			<div className="flex items-center justify-between text-[10px]">
				<span className="text-slate-400">
					{successfulAssets.length} generated, {failedAssets.length} failed
				</span>
			</div>

			{/* Grid of thumbnails */}
			<div className="grid grid-cols-4 gap-1">
				{successfulAssets.map((asset, i) => (
					<button
						key={asset.assetId}
						onClick={() => setSelectedIndex(i)}
						className={`relative aspect-square rounded overflow-hidden border-2 transition-all ${
							selectedIndex === i
								? 'border-violet-500'
								: 'border-transparent hover:border-slate-600'
						}`}
					>
						<img
							src={asset.dataUrl}
							alt={asset.assetId}
							className="w-full h-full object-cover"
						/>
						<div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-0.5">
							<span className="text-[7px] text-white truncate block">
								{asset.assetId.split('-').slice(-2).join('-')}
							</span>
						</div>
					</button>
				))}
			</div>

			{/* Selected Asset Preview */}
			{selectedAsset && (
				<div className="bg-slate-700/50 rounded-lg p-2">
					<div className="relative">
						<img
							src={selectedAsset.dataUrl}
							alt={selectedAsset.assetId}
							className="w-full h-32 object-contain rounded"
						/>
						{/* Navigation */}
						{successfulAssets.length > 1 && (
							<>
								<button
									onClick={() => setSelectedIndex(prev => 
										prev !== null ? (prev - 1 + successfulAssets.length) % successfulAssets.length : 0
									)}
									className="absolute left-1 top-1/2 -translate-y-1/2 p-1 bg-black/50 rounded-full hover:bg-black/70"
								>
									<ChevronLeft size={12} className="text-white" />
								</button>
								<button
									onClick={() => setSelectedIndex(prev => 
										prev !== null ? (prev + 1) % successfulAssets.length : 0
									)}
									className="absolute right-1 top-1/2 -translate-y-1/2 p-1 bg-black/50 rounded-full hover:bg-black/70"
								>
									<ChevronRight size={12} className="text-white" />
								</button>
							</>
						)}
					</div>
					<div className="mt-2">
						<div className="text-[10px] text-slate-300 font-mono truncate">
							{selectedAsset.assetId}
						</div>
						<div className="text-[9px] text-slate-500 truncate">
							{selectedAsset.path}
						</div>
					</div>
				</div>
			)}

			{/* Failed Assets */}
			{failedAssets.length > 0 && (
				<div className="space-y-1">
					<div className="flex items-center gap-1 text-[10px] text-red-400">
						<XCircle size={12} />
						<span>Failed Assets</span>
					</div>
					{failedAssets.map((asset, i) => (
						<div
							key={i}
							className="flex items-center gap-2 px-2 py-1 bg-red-500/10 rounded text-[9px]"
						>
							<span className="text-slate-300 font-mono truncate flex-1">
								{asset.assetId}
							</span>
							<span className="text-red-400 truncate max-w-[100px]">
								{asset.error || 'Unknown error'}
							</span>
						</div>
					))}
				</div>
			)}
		</div>
	);
}

export default AssetGallery;
