import { useState } from 'react';
import {
  X,
  Trash2,
  Image as ImageIcon,
  ExternalLink,
  RefreshCw,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useImageLibrary } from '@/contexts';
import { GeneratedImage } from '@/api/supabase';

export function ImageLibraryPanel() {
  const {
    images,
    isLoading,
    error,
    isOpen,
    hasStorage,
    removeImage,
    refreshImages,
    closePanel,
  } = useImageLibrary();

  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDelete = async (image: GeneratedImage) => {
    setDeletingId(image.id);
    await removeImage(image.id, image.storage_path);
    setDeletingId(null);
  };

  return (
    <div className="fixed right-4 top-16 bottom-4 w-[380px] bg-slate-900 border border-slate-700/50 rounded-lg shadow-2xl flex flex-col z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50 bg-slate-800/50">
        <div className="flex items-center gap-2">
          <ImageIcon size={16} className="text-cyan-400" />
          <span className="text-sm font-medium text-slate-200">
            Image Library
          </span>
          <span className="text-xs text-slate-500">
            ({images.length} images)
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={refreshImages}
            disabled={isLoading}
            className="p-1.5 rounded text-slate-400 hover:text-cyan-400 hover:bg-slate-700/50 transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={closePanel}
            className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="px-4 py-3 bg-red-500/10 border-b border-red-500/20 flex items-center gap-2">
          <AlertCircle size={14} className="text-red-400 shrink-0" />
          <span className="text-xs text-red-300">{error}</span>
        </div>
      )}

      {/* Not Configured State */}
      {!hasStorage && (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <AlertCircle size={32} className="mx-auto mb-3 text-amber-500" />
            <p className="text-sm text-slate-400 mb-1">Storage not configured</p>
            <p className="text-xs text-slate-500">
              Add Supabase credentials in Settings to enable image storage
            </p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {hasStorage && isLoading && images.length === 0 && (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={24} className="text-cyan-400 animate-spin" />
            <span className="text-xs text-slate-500">Loading images...</span>
          </div>
        </div>
      )}

      {/* Empty State */}
      {hasStorage && !isLoading && images.length === 0 && (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <ImageIcon size={32} className="mx-auto mb-3 text-slate-600" />
            <p className="text-sm text-slate-400 mb-1">No images yet</p>
            <p className="text-xs text-slate-500">
              Generated images will appear here automatically
            </p>
          </div>
        </div>
      )}

      {/* Image Grid */}
      {hasStorage && images.length > 0 && (
        <div className="flex-1 overflow-auto p-3">
          <div className="grid grid-cols-3 gap-2">
            {images.map((image) => (
              <ImageThumbnail
                key={image.id}
                image={image}
                isDeleting={deletingId === image.id}
                onDelete={() => handleDelete(image)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      {hasStorage && images.length > 0 && (
        <div className="px-4 py-2.5 border-t border-slate-700/50 bg-slate-800/30">
          <p className="text-[10px] text-slate-500 text-center">
            Click image to view full size • Hover for prompt
          </p>
        </div>
      )}
    </div>
  );
}

interface ImageThumbnailProps {
  image: GeneratedImage;
  isDeleting: boolean;
  onDelete: () => void;
}

function ImageThumbnail({ image, isDeleting, onDelete }: ImageThumbnailProps) {
  const [showActions, setShowActions] = useState(false);

  const formattedDate = new Date(image.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <div
      className="relative aspect-square bg-slate-800 rounded-lg overflow-hidden group border border-slate-700/50 hover:border-cyan-500/50 transition-colors"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Image */}
      <img
        src={image.public_url}
        alt={image.prompt}
        className="w-full h-full object-cover cursor-pointer"
        onClick={() => window.open(image.public_url, '_blank')}
        loading="lazy"
      />

      {/* Hover Overlay */}
      {showActions && (
        <div className="absolute inset-0 bg-black/60 flex flex-col justify-between p-2">
          {/* Top Actions */}
          <div className="flex items-start justify-between">
            <button
              onClick={() => window.open(image.public_url, '_blank')}
              className="p-1.5 rounded bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
              title="Open full size"
            >
              <ExternalLink size={12} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              disabled={isDeleting}
              className="p-1.5 rounded bg-slate-800/80 text-slate-300 hover:text-red-400 hover:bg-slate-700 transition-colors disabled:opacity-50"
              title="Delete image"
            >
              {isDeleting ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Trash2 size={12} />
              )}
            </button>
          </div>

          {/* Bottom Info */}
          <div className="space-y-1">
            <p className="text-[10px] text-slate-300 line-clamp-2 leading-tight">
              {image.prompt}
            </p>
            <div className="flex items-center justify-between text-[9px] text-slate-500">
              <span>{image.aspect_ratio}</span>
              <span>{formattedDate}</span>
            </div>
          </div>
        </div>
      )}

      {/* Deleting Overlay */}
      {isDeleting && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
          <Loader2 size={20} className="text-red-400 animate-spin" />
        </div>
      )}
    </div>
  );
}

export default ImageLibraryPanel;
