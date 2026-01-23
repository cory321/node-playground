import React from 'react';
import { ImagePlus, Check, ImageOff, RefreshCw } from 'lucide-react';
import { ImageSourceNodeData, HoveredPort } from '@/types/nodes';
import { BaseNode } from '../base';
import { useImageLibrary } from '@/contexts/ImageLibraryContext';

interface ImageSourceNodeProps {
	node: ImageSourceNodeData;
	updateNode: (id: string, updates: Partial<ImageSourceNodeData>) => void;
	deleteNode: (id: string) => void;
	onMouseDown: (e: React.MouseEvent) => void;
	onResizeStart: (e: React.MouseEvent) => void;
	editingTitleId: string | null;
	setEditingTitleId: (id: string | null) => void;
	isConnectedOutput: boolean;
	hoveredPort: HoveredPort | null;
	setHoveredPort: (port: HoveredPort | null) => void;
	onOutputPortMouseDown: (e: React.MouseEvent) => void;
	onOutputPortMouseUp: () => void;
}

export function ImageSourceNode({
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
	onOutputPortMouseDown,
	onOutputPortMouseUp,
}: ImageSourceNodeProps) {
	const { images, isLoading, refreshImages, hasStorage } = useImageLibrary();

	const handleSelectImage = (image: {
		id: string;
		public_url: string;
		prompt: string;
		aspect_ratio: string;
	}) => {
		updateNode(node.id, {
			selectedImageId: image.id,
			selectedImageUrl: image.public_url,
			selectedImagePrompt: image.prompt,
			selectedImageAspectRatio: image.aspect_ratio,
		});
	};

	const handleClearSelection = () => {
		updateNode(node.id, {
			selectedImageId: null,
			selectedImageUrl: null,
			selectedImagePrompt: null,
			selectedImageAspectRatio: null,
		});
	};

	const hasSelection = !!node.selectedImageId;

	return (
		<BaseNode
			node={node}
			icon={<ImagePlus size={14} className="text-pink-400" />}
			isEditingTitle={editingTitleId === node.id}
			onTitleChange={(title) => updateNode(node.id, { title })}
			onEditTitleStart={() => setEditingTitleId(node.id)}
			onEditTitleEnd={() => setEditingTitleId(null)}
			onDelete={() => deleteNode(node.id)}
			onMouseDown={onMouseDown}
			onResizeStart={onResizeStart}
			hasInputPort={false}
			hasOutputPort={true}
			isConnectedOutput={isConnectedOutput}
			hoveredPort={hoveredPort}
			setHoveredPort={setHoveredPort}
			onOutputPortMouseDown={onOutputPortMouseDown}
			onOutputPortMouseUp={onOutputPortMouseUp}
			status={hasSelection ? 'success' : 'idle'}
			hoverBorderClass="group-hover:border-pink-500/30"
			resizeHoverColor="hover:text-pink-400"
		>
			{/* Header with selection status and refresh */}
			<div className="flex items-center justify-between mb-2">
				<div className="flex items-center gap-2">
					{hasSelection ? (
						<span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-pink-400">
							<Check size={12} />
							Image Selected
						</span>
					) : (
						<span className="text-[10px] uppercase tracking-wider text-slate-600">
							Select an image
						</span>
					)}
				</div>
				<div className="flex items-center gap-1">
					{hasSelection && (
						<button
							onClick={handleClearSelection}
							className="px-2 py-1 text-[10px] uppercase tracking-wider text-slate-500 hover:text-slate-300 transition-colors"
						>
							Clear
						</button>
					)}
					<button
						onClick={refreshImages}
						disabled={isLoading}
						className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-50"
						title="Refresh images"
					>
						<RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
					</button>
				</div>
			</div>

			{/* Image Grid or Empty State */}
			<div className="flex-1 bg-slate-950/60 border border-slate-800/50 rounded-xl overflow-hidden min-h-0">
				{!hasStorage ? (
					<div className="h-full flex items-center justify-center p-4">
						<div className="text-center space-y-2">
							<div className="w-12 h-12 mx-auto border border-dashed border-slate-700 rounded-full flex items-center justify-center">
								<ImageOff size={20} className="text-slate-700" />
							</div>
							<p className="text-[10px] text-slate-600 uppercase tracking-wider">
								Image storage not configured
							</p>
						</div>
					</div>
				) : images.length === 0 ? (
					<div className="h-full flex items-center justify-center p-4">
						<div className="text-center space-y-2">
							<div className="w-12 h-12 mx-auto border border-dashed border-slate-700 rounded-full flex items-center justify-center">
								<ImagePlus size={20} className="text-slate-700" />
							</div>
							<p className="text-[10px] text-slate-600 uppercase tracking-wider">
								No images in library
							</p>
							<p className="text-[9px] text-slate-700">
								Generate images with Image Gen node
							</p>
						</div>
					</div>
				) : (
					<div className="h-full overflow-y-auto p-2">
						<div className="grid grid-cols-3 gap-2">
							{images.map((image) => {
								const isSelected = node.selectedImageId === image.id;
								return (
									<button
										key={image.id}
										onClick={() => handleSelectImage(image)}
										className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all hover:scale-[1.02] ${
											isSelected
												? 'border-pink-500 ring-2 ring-pink-500/30'
												: 'border-transparent hover:border-slate-600'
										}`}
									>
										<img
											src={image.public_url}
											alt={image.prompt}
											className="w-full h-full object-cover"
											loading="lazy"
										/>
										{isSelected && (
											<div className="absolute inset-0 bg-pink-500/20 flex items-center justify-center">
												<div className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center">
													<Check size={14} className="text-white" />
												</div>
											</div>
										)}
									</button>
								);
							})}
						</div>
					</div>
				)}
			</div>

			{/* Selected Image Info */}
			{hasSelection && node.selectedImagePrompt && (
				<div className="mt-2 p-2 bg-slate-800/40 rounded-lg">
					<p className="text-[10px] text-slate-400 line-clamp-2">
						{node.selectedImagePrompt}
					</p>
					{node.selectedImageAspectRatio && (
						<span className="text-[9px] text-slate-600 uppercase">
							{node.selectedImageAspectRatio}
						</span>
					)}
				</div>
			)}
		</BaseNode>
	);
}

export default ImageSourceNode;
