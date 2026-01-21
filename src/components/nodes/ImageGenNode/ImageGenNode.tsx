import React, { useState, useCallback } from 'react';
import {
  Play,
  ChevronDown,
  ChevronUp,
  Loader2,
  Image as ImageIcon,
  Sparkles,
  AlertCircle,
  Settings2,
  ExternalLink,
  Check,
} from 'lucide-react';
import { ImageGenNodeData, HoveredPort, AspectRatioPreset } from '@/types/nodes';
import { BaseNode } from '../base';
import { callGeminiImage, calculateAspectRatio, findClosestAspectRatio, ASPECT_RATIO_PRESETS } from '@/api/llm';
import { useImageLibrary } from '@/contexts';

interface ImageGenNodeProps {
  node: ImageGenNodeData;
  updateNode: (id: string, updates: Partial<ImageGenNodeData>) => void;
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
  incomingData: string | null;
}

export function ImageGenNode({
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
}: ImageGenNodeProps) {
  const [showImage, setShowImage] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [savedToLibrary, setSavedToLibrary] = useState(false);
  const isLoading = node.status === 'loading';
  const hasError = node.status === 'error';
  const hasImage = node.status === 'success' && node.generatedImage;

  // Image library for auto-saving
  const { addImage, hasStorage } = useImageLibrary();

  // Calculate the display aspect ratio (what user specified)
  const getDisplayAspectRatio = useCallback((): string => {
    if (node.aspectRatioMode === 'custom' && node.customWidth && node.customHeight) {
      return calculateAspectRatio(node.customWidth, node.customHeight);
    }
    return node.aspectRatio;
  }, [node.aspectRatioMode, node.aspectRatio, node.customWidth, node.customHeight]);

  // Get the API-compatible aspect ratio (closest valid preset)
  const getApiAspectRatio = useCallback((): string => {
    if (node.aspectRatioMode === 'custom' && node.customWidth && node.customHeight) {
      return findClosestAspectRatio(node.customWidth, node.customHeight);
    }
    return node.aspectRatio;
  }, [node.aspectRatioMode, node.aspectRatio, node.customWidth, node.customHeight]);

  // Check if custom ratio differs from API ratio
  const customRatioMismatch = node.aspectRatioMode === 'custom' && 
    node.customWidth && node.customHeight &&
    getDisplayAspectRatio() !== getApiAspectRatio();

  // Handle image generation
  const handleGenerate = useCallback(async () => {
    // Determine the prompt to use
    const effectivePrompt = incomingData || node.prompt;
    
    if (!effectivePrompt?.trim()) {
      updateNode(node.id, {
        status: 'error',
        error: 'No prompt provided. Enter a prompt or connect an upstream node.',
      });
      return;
    }

    updateNode(node.id, { status: 'loading', error: null });
    setSavedToLibrary(false);

    try {
      // Use the API-compatible aspect ratio
      const aspectRatio = getApiAspectRatio();
      const imageDataUrl = await callGeminiImage(effectivePrompt, aspectRatio);
      
      updateNode(node.id, {
        status: 'success',
        generatedImage: imageDataUrl,
        error: null,
        lastGeneratedAt: Date.now(),
      });

      // Auto-save to image library if storage is available
      if (hasStorage) {
        const saved = await addImage(imageDataUrl, effectivePrompt, aspectRatio, node.id);
        if (saved) {
          setSavedToLibrary(true);
          // Reset the saved indicator after 3 seconds
          setTimeout(() => setSavedToLibrary(false), 3000);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      updateNode(node.id, {
        status: 'error',
        error: errorMessage,
        generatedImage: null,
      });
    }
  }, [node.id, node.prompt, incomingData, getApiAspectRatio, updateNode, hasStorage, addImage]);

  const loadingOverlay = (
    <div className="absolute inset-0 z-40 bg-slate-900/80 backdrop-blur-sm rounded-2xl flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-transparent border-t-cyan-500 border-r-teal-500 animate-spin" />
          <ImageIcon size={20} className="absolute inset-0 m-auto text-cyan-400" />
        </div>
        <span className="text-[10px] uppercase tracking-[0.2em] text-cyan-300 font-mono">
          Generating...
        </span>
      </div>
    </div>
  );

  return (
    <BaseNode
      node={node}
      icon={<ImageIcon size={14} className="text-cyan-400" />}
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
          ? 'border-cyan-500/50 shadow-cyan-500/20'
          : hasError
          ? 'border-red-500/50'
          : 'border-slate-700/50'
      }
    >
      {/* Controls Row */}
      <div className="flex items-center gap-2">
        {/* Settings Toggle */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          disabled={isLoading}
          className={`px-2 py-2 rounded-lg transition-all ${
            showSettings
              ? 'bg-cyan-600 text-white'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-cyan-400'
          }`}
          title="Aspect ratio settings"
        >
          <Settings2 size={14} />
        </button>

        {/* Aspect Ratio Display */}
        <div className="flex-1 bg-slate-950/60 border border-slate-700/50 rounded-lg px-3 py-2 text-xs text-slate-400">
          <span className="text-slate-500">Ratio:</span>{' '}
          <span className="text-cyan-300 font-mono">{getApiAspectRatio()}</span>
          {customRatioMismatch && (
            <span className="text-amber-400/70 ml-1" title={`Your ratio ${getDisplayAspectRatio()} mapped to closest: ${getApiAspectRatio()}`}>
              ≈
            </span>
          )}
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={isLoading || (!node.prompt?.trim() && !incomingData)}
          className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-all ${
            isLoading || (!node.prompt?.trim() && !incomingData)
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white shadow-lg shadow-cyan-500/20'
          }`}
        >
          {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
          {isLoading ? 'Gen...' : 'Gen'}
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="flex flex-col gap-2 p-3 bg-slate-950/60 border border-slate-700/50 rounded-lg">
          {/* Mode Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 w-12">Mode</span>
            <div className="flex flex-1 bg-slate-800 rounded-lg p-0.5">
              <button
                onClick={() => updateNode(node.id, { aspectRatioMode: 'preset' })}
                className={`flex-1 px-2 py-1 text-[10px] uppercase tracking-wider rounded-md transition-all ${
                  node.aspectRatioMode === 'preset'
                    ? 'bg-cyan-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Preset
              </button>
              <button
                onClick={() => updateNode(node.id, { aspectRatioMode: 'custom' })}
                className={`flex-1 px-2 py-1 text-[10px] uppercase tracking-wider rounded-md transition-all ${
                  node.aspectRatioMode === 'custom'
                    ? 'bg-cyan-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Custom
              </button>
            </div>
          </div>

          {/* Preset Selector */}
          {node.aspectRatioMode === 'preset' && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 w-12">Ratio</span>
              <select
                value={node.aspectRatio}
                onChange={(e) => updateNode(node.id, { aspectRatio: e.target.value as AspectRatioPreset })}
                className="flex-1 bg-slate-800 border border-slate-700/50 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500/30"
              >
                {ASPECT_RATIO_PRESETS.map((ratio) => (
                  <option key={ratio} value={ratio}>
                    {ratio}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Custom Dimensions */}
          {node.aspectRatioMode === 'custom' && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 w-12">Size</span>
              <input
                type="number"
                value={node.customWidth || ''}
                onChange={(e) => updateNode(node.id, { customWidth: parseInt(e.target.value) || null })}
                placeholder="Width"
                className="flex-1 bg-slate-800 border border-slate-700/50 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 w-20"
              />
              <span className="text-slate-500 text-xs">×</span>
              <input
                type="number"
                value={node.customHeight || ''}
                onChange={(e) => updateNode(node.id, { customHeight: parseInt(e.target.value) || null })}
                placeholder="Height"
                className="flex-1 bg-slate-800 border border-slate-700/50 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 w-20"
              />
            </div>
          )}

          {/* Calculated Ratio Hint */}
          {node.aspectRatioMode === 'custom' && node.customWidth && node.customHeight && (
            <div className="text-[10px] pl-14 space-y-0.5">
              <div className="text-slate-500">
                Your ratio: <span className="text-slate-300 font-mono">{getDisplayAspectRatio()}</span>
              </div>
              {customRatioMismatch && (
                <div className="text-amber-400/80">
                  → Using closest: <span className="font-mono">{getApiAspectRatio()}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Incoming Data Indicator */}
      {incomingData && (
        <div className="flex items-center gap-2 px-3 py-2 bg-purple-500/10 border border-purple-500/20 rounded-lg">
          <Sparkles size={12} className="text-purple-400" />
          <span className="text-[10px] text-purple-300 uppercase tracking-wider truncate">
            Prompt from upstream node
          </span>
        </div>
      )}

      {/* Prompt Textarea */}
      <textarea
        value={node.prompt}
        onChange={(e) => updateNode(node.id, { prompt: e.target.value })}
        placeholder={incomingData ? 'Additional instructions (optional)...' : 'Describe the image you want to generate...'}
        disabled={isLoading}
        className="w-full flex-1 bg-slate-950/40 border border-slate-800/80 rounded-xl p-3 text-sm text-slate-300 placeholder:text-slate-700 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 resize-none transition-all scrollbar-hide disabled:opacity-50 min-h-[60px]"
      />

      {/* Error Display */}
      {hasError && node.error && (
        <div className="flex items-start gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
          <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
          <span className="text-xs text-red-300 line-clamp-2">{node.error}</span>
        </div>
      )}

      {/* Image Preview */}
      {hasImage && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowImage(!showImage)}
              className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              {showImage ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              Generated Image
            </button>
            <button
              onClick={() => window.open(node.generatedImage!, '_blank')}
              className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-slate-500 hover:text-cyan-400 transition-colors"
              title="Open full size in new tab"
            >
              <ExternalLink size={10} />
              Full Size
            </button>
            {savedToLibrary && (
              <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-emerald-400">
                <Check size={10} />
                Saved
              </span>
            )}
          </div>
          {showImage && (
            <div 
              className="bg-slate-950/60 border border-emerald-500/20 rounded-lg p-2 overflow-hidden cursor-pointer group relative"
              onClick={() => window.open(node.generatedImage!, '_blank')}
              title="Click to open full size"
            >
              <img
                src={node.generatedImage!}
                alt="Generated"
                className="w-full h-auto rounded-lg object-contain max-h-48 group-hover:opacity-90 transition-opacity"
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 rounded-lg">
                <ExternalLink size={24} className="text-white" />
              </div>
            </div>
          )}
          {!showImage && node.generatedImage && (
            <div 
              className="h-12 w-12 rounded-lg overflow-hidden border border-slate-700/50 cursor-pointer hover:border-cyan-500/50 transition-colors group relative"
              onClick={() => window.open(node.generatedImage!, '_blank')}
              title="Click to open full size"
            >
              <img
                src={node.generatedImage}
                alt="Generated thumbnail"
                className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                <ExternalLink size={12} className="text-white" />
              </div>
            </div>
          )}
        </div>
      )}
    </BaseNode>
  );
}

export default ImageGenNode;
