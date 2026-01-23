import React, { useState, useCallback } from 'react';
import {
  Play,
  Square,
  Loader2,
  Palette,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Image as ImageIcon,
  Sparkles,
} from 'lucide-react';
import { BrandDesignNodeData, HoveredPort } from '@/types/nodes';
import { BrandDesignOutput } from '@/types/brandDesign';
import { BaseNode } from '../base';
import { useBrandDesignExtractor } from '@/hooks';
import { ColorPalettePreview } from './ColorPalettePreview';
import { TypographyPreview } from './TypographyPreview';
import { SectionsPreview } from './SectionsPreview';
import { ComponentsPreview } from './ComponentsPreview';

type PreviewTab = 'colors' | 'typography' | 'sections' | 'components';

interface BrandDesignNodeProps {
  node: BrandDesignNodeData;
  updateNode: (id: string, updates: Partial<BrandDesignNodeData>) => void;
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

export function BrandDesignNode({
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
}: BrandDesignNodeProps) {
  const [showPreview, setShowPreview] = useState(true);
  const [activeTab, setActiveTab] = useState<PreviewTab>('colors');

  const { runExtraction, stopExtraction, isExtracting, hasAnthropicKey } =
    useBrandDesignExtractor({
      nodeId: node.id,
      updateNode,
    });

  const isLoading = node.status === 'loading' || isExtracting;
  const hasError = node.status === 'error';
  const hasOutput = node.status === 'success' && node.output;

  // Get typed output
  const output = node.output as BrandDesignOutput | null;

  // Get screenshot URL (from input or stored)
  const screenshotUrl = incomingData?.screenshotUrl || node.inputScreenshotUrl;

  // Handle extraction
  const handleExtract = useCallback(() => {
    if (!screenshotUrl) {
      updateNode(node.id, {
        status: 'error',
        error: 'No screenshot connected. Connect an Image Generator node.',
      });
      return;
    }
    runExtraction(screenshotUrl);
  }, [screenshotUrl, runExtraction, node.id, updateNode]);

  // Get progress text
  const getProgressText = () => {
    if (!node.progress) return 'Preparing...';
    const { phase, passesComplete, currentPassName } = node.progress;
    if (phase === 'complete') return 'Complete';
    if (currentPassName) return currentPassName;
    return `Pass ${passesComplete + 1} of 3`;
  };

  // Get confidence percentage
  const confidencePercent = output?.meta?.confidence?.overall
    ? Math.round(output.meta.confidence.overall * 100)
    : 0;

  // Loading overlay
  const loadingOverlay = (
    <div className="absolute inset-0 z-40 bg-slate-900/80 backdrop-blur-sm rounded-2xl flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-transparent border-t-indigo-500 border-r-violet-500 animate-spin" />
          <Palette size={20} className="absolute inset-0 m-auto text-indigo-400" />
        </div>
        <span className="text-[10px] uppercase tracking-[0.2em] text-indigo-300 font-mono">
          {getProgressText()}
        </span>
        {node.progress && node.progress.passesComplete > 0 && (
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all ${
                  i < node.progress.passesComplete
                    ? 'bg-indigo-400'
                    : 'bg-slate-700'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Tab button component
  const TabButton = ({ tab, label }: { tab: PreviewTab; label: string }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-2 py-1 text-[10px] uppercase tracking-wider rounded transition-all ${
        activeTab === tab
          ? 'bg-indigo-600 text-white'
          : 'bg-slate-800 text-slate-400 hover:text-white'
      }`}
    >
      {label}
    </button>
  );

  return (
    <BaseNode
      node={node}
      icon={<Palette size={14} className="text-indigo-400" />}
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
          ? 'border-indigo-500/50 shadow-indigo-500/20'
          : hasError
          ? 'border-red-500/50'
          : hasOutput
          ? 'border-indigo-500/30'
          : 'border-slate-700/50'
      }
    >
      {/* API Key Warning */}
      {!hasAnthropicKey && (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <AlertCircle size={12} className="text-amber-400 shrink-0" />
          <span className="text-[10px] text-amber-300">
            Anthropic API key required for vision
          </span>
        </div>
      )}

      {/* Screenshot Thumbnail */}
      {screenshotUrl && (
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/40 border border-slate-700/30 rounded-lg">
          <div
            className="w-10 h-10 rounded overflow-hidden border border-slate-600/30 cursor-pointer hover:border-indigo-500/50 transition-colors"
            onClick={() => window.open(screenshotUrl, '_blank')}
          >
            <img
              src={screenshotUrl}
              alt="Screenshot"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">
              Input Screenshot
            </span>
            <button
              onClick={() => window.open(screenshotUrl, '_blank')}
              className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300"
            >
              View Full Size
              <ExternalLink size={10} />
            </button>
          </div>
        </div>
      )}

      {/* No Screenshot Warning */}
      {!screenshotUrl && !hasOutput && (
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/40 border border-slate-700/30 rounded-lg">
          <ImageIcon size={12} className="text-slate-500" />
          <span className="text-[10px] text-slate-500">
            Connect an Image Generator node
          </span>
        </div>
      )}

      {/* Controls Row */}
      <div className="flex items-center gap-2">
        <button
          onClick={isLoading ? stopExtraction : handleExtract}
          disabled={!screenshotUrl || !hasAnthropicKey}
          className={`flex-1 px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
            !screenshotUrl || !hasAnthropicKey
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : isLoading
              ? 'bg-red-600 hover:bg-red-500 text-white'
              : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/20'
          }`}
        >
          {isLoading ? (
            <>
              <Square size={14} />
              Stop
            </>
          ) : (
            <>
              <Sparkles size={14} />
              Extract Design
            </>
          )}
        </button>
      </div>

      {/* Error Display */}
      {hasError && node.error && (
        <div className="flex items-start gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
          <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
          <span className="text-xs text-red-300 line-clamp-2">{node.error}</span>
        </div>
      )}

      {/* Confidence Bar */}
      {hasOutput && output?.meta?.confidence && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[9px] uppercase tracking-wider text-slate-500">
              Extraction Confidence
            </span>
            <span
              className={`text-xs font-mono ${
                confidencePercent >= 70
                  ? 'text-emerald-400'
                  : confidencePercent >= 50
                  ? 'text-amber-400'
                  : 'text-red-400'
              }`}
            >
              {confidencePercent}%
            </span>
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                confidencePercent >= 70
                  ? 'bg-emerald-500'
                  : confidencePercent >= 50
                  ? 'bg-amber-500'
                  : 'bg-red-500'
              }`}
              style={{ width: `${confidencePercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Output Preview */}
      {hasOutput && output?.designSystem && (
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            {showPreview ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            Design System Preview
          </button>

          {showPreview && (
            <div className="flex flex-col gap-3 p-3 bg-slate-950/60 border border-slate-700/50 rounded-lg">
              {/* Tabs */}
              <div className="flex gap-1">
                <TabButton tab="colors" label="Colors" />
                <TabButton tab="typography" label="Type" />
                <TabButton tab="sections" label="Sections" />
                <TabButton tab="components" label="UI" />
              </div>

              {/* Tab Content */}
              <div className="min-h-[120px]">
                {activeTab === 'colors' && (
                  <ColorPalettePreview colors={output.designSystem.colors} />
                )}
                {activeTab === 'typography' && (
                  <TypographyPreview typography={output.designSystem.typography} />
                )}
                {activeTab === 'sections' && (
                  <SectionsPreview sections={output.designSystem.sections} />
                )}
                {activeTab === 'components' && (
                  <ComponentsPreview components={output.designSystem.components} />
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Warnings */}
      {hasOutput && output?.meta?.warnings && output.meta.warnings.length > 0 && (
        <div className="flex flex-col gap-1 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <span className="text-[9px] uppercase tracking-wider text-amber-400">Warnings</span>
          {output.meta.warnings.map((warning, i) => (
            <span key={i} className="text-[10px] text-amber-300">
              • {warning}
            </span>
          ))}
        </div>
      )}
    </BaseNode>
  );
}

export default BrandDesignNode;
