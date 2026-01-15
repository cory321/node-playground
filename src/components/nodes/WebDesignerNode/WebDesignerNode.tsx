import React, { useEffect, useState } from 'react';
import {
  Palette,
  Play,
  Loader2,
  MapPin,
  Tag,
  BarChart3,
  Sparkles,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Link2Off,
  Copy,
  Check,
} from 'lucide-react';
import { WebDesignerNodeData, HoveredPort } from '@/types/nodes';
import { BaseNode } from '../base';
import { PROVIDER_OPTIONS, getProviderOption } from '../LLMNode/LLMNode.config';
import { usePromptGeneration } from '@/hooks/usePromptGeneration';

interface WebDesignerNodeProps {
  node: WebDesignerNodeData;
  updateNode: (id: string, updates: Partial<WebDesignerNodeData>) => void;
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
  incomingData: {
    city: string;
    state: string | null;
    category: string | null;
    serpScore?: number;
    serpQuality?: 'Weak' | 'Medium' | 'Strong';
    urgency?: 'extreme' | 'high' | 'medium' | 'low';
    competition?: 'low' | 'moderate' | 'high' | 'extreme';
  } | null;
}

export function WebDesignerNode({
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
}: WebDesignerNodeProps) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [copied, setCopied] = useState(false);
  const { generateSpecializedPrompt, isGenerating } = usePromptGeneration();

  const isLoading = node.status === 'loading' || isGenerating;
  const hasError = node.status === 'error';
  const hasResult = node.status === 'success' && node.generatedPrompt;
  
  const currentProvider = getProviderOption(node.provider);
  const supportsReasoning = currentProvider?.supportsReasoning ?? false;

  // Extract primitive values from incomingData to use as stable dependencies
  const incomingCity = incomingData?.city;
  const incomingState = incomingData?.state;
  const incomingCategory = incomingData?.category;
  const incomingSerpScore = incomingData?.serpScore;
  const incomingSerpQuality = incomingData?.serpQuality;
  const incomingUrgency = incomingData?.urgency;
  const incomingCompetition = incomingData?.competition;

  // Sync incoming data to node state
  useEffect(() => {
    if (incomingCity !== undefined) {
      const updates: Partial<WebDesignerNodeData> = {};
      
      if (incomingCity !== node.inputCity) {
        updates.inputCity = incomingCity;
      }
      if (incomingState !== node.inputState) {
        updates.inputState = incomingState ?? null;
      }
      if (incomingCategory !== node.inputCategory) {
        updates.inputCategory = incomingCategory ?? null;
      }
      if (incomingSerpScore !== node.inputSerpScore) {
        updates.inputSerpScore = incomingSerpScore ?? null;
      }
      if (incomingSerpQuality !== node.inputSerpQuality) {
        updates.inputSerpQuality = incomingSerpQuality ?? null;
      }
      if (incomingUrgency !== node.inputUrgency) {
        updates.inputUrgency = incomingUrgency ?? null;
      }
      if (incomingCompetition !== node.inputCompetition) {
        updates.inputCompetition = incomingCompetition ?? null;
      }

      if (Object.keys(updates).length > 0) {
        updateNode(node.id, updates);
      }
    }
  }, [incomingCity, incomingState, incomingCategory, incomingSerpScore, incomingSerpQuality, incomingUrgency, incomingCompetition, node.id, node.inputCity, node.inputState, node.inputCategory, node.inputSerpScore, node.inputSerpQuality, node.inputUrgency, node.inputCompetition, updateNode]);

  // Handle generate button click
  const handleGenerate = async () => {
    if (!node.inputCity || !node.inputCategory) return;

    updateNode(node.id, { status: 'loading', error: null });

    try {
      const result = await generateSpecializedPrompt(
        {
          city: node.inputCity,
          state: node.inputState,
          category: node.inputCategory,
          serpScore: node.inputSerpScore ?? undefined,
          serpQuality: node.inputSerpQuality ?? undefined,
        },
        node.provider,
        node.useReasoning
      );

      updateNode(node.id, {
        status: 'success',
        generatedPrompt: result.prompt,
        generatedBusinessName: result.businessName,
        lastGeneratedAt: Date.now(),
        error: null,
      });
    } catch (err) {
      updateNode(node.id, {
        status: 'error',
        error: err instanceof Error ? err.message : 'Failed to generate prompt',
      });
    }
  };

  // Copy prompt to clipboard
  const handleCopy = async () => {
    if (node.generatedPrompt) {
      await navigator.clipboard.writeText(node.generatedPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const canGenerate = node.inputCity && node.inputCategory && !isLoading;

  const loadingOverlay = (
    <div className="absolute inset-0 z-40 bg-slate-900/80 backdrop-blur-sm rounded-2xl flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-transparent border-t-pink-500 border-r-rose-500 animate-spin" />
          <Palette size={20} className="absolute inset-0 m-auto text-pink-400" />
        </div>
        <span className="text-[10px] uppercase tracking-[0.2em] text-pink-300 font-mono">
          Generating...
        </span>
      </div>
    </div>
  );

  return (
    <BaseNode
      node={node}
      icon={<Palette size={14} className="text-pink-400" />}
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
          ? 'border-pink-500/50 shadow-pink-500/20'
          : hasError
          ? 'border-red-500/50'
          : 'border-slate-700/50'
      }
      hoverBorderClass="group-hover:border-pink-500/30"
      resizeHoverColor="hover:text-pink-400"
    >
      {/* No Connection State */}
      {!incomingData?.city ? (
        <div className="flex items-center gap-2 px-3 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg">
          <Link2Off size={14} className="text-slate-500" />
          <span className="text-xs text-slate-500">
            Connect a Location, Research, or Category Selector node
          </span>
        </div>
      ) : (
        <>
          {/* Input Summary */}
          <div className="px-3 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg space-y-1.5">
            {/* Location */}
            <div className="flex items-center gap-2">
              <MapPin size={12} className="text-pink-400 shrink-0" />
              <span className="text-xs text-slate-300">
                {incomingData.city}
                {incomingData.state && `, ${incomingData.state}`}
              </span>
            </div>
            
            {/* Category */}
            {incomingData.category ? (
              <div className="flex items-center gap-2">
                <Tag size={12} className="text-pink-400 shrink-0" />
                <span className="text-xs text-slate-300 truncate">
                  {incomingData.category}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Tag size={12} className="text-amber-500 shrink-0" />
                <span className="text-xs text-amber-400">
                  No category selected
                </span>
              </div>
            )}
            
            {/* SERP Data */}
            {incomingData.serpQuality && (
              <div className="flex items-center gap-2">
                <BarChart3 size={12} className="text-pink-400 shrink-0" />
                <span className="text-xs text-slate-400">
                  Score: {incomingData.serpScore ?? '?'} | {incomingData.serpQuality} SERP
                  {incomingData.urgency && ` | ${capitalize(incomingData.urgency)} Urg`}
                </span>
              </div>
            )}
          </div>

          {/* Provider Selector Row */}
          <div className="flex items-center gap-2">
            <select
              value={node.provider}
              onChange={(e) => updateNode(node.id, { provider: e.target.value, useReasoning: false })}
              disabled={isLoading}
              className="flex-1 bg-slate-950/60 border border-slate-700/50 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-pink-500/30 cursor-pointer disabled:opacity-50"
            >
              {PROVIDER_OPTIONS.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))}
            </select>
            
            {/* Reasoning Toggle */}
            <button
              onClick={() => updateNode(node.id, { useReasoning: !node.useReasoning })}
              disabled={isLoading || !supportsReasoning}
              title={
                supportsReasoning
                  ? node.useReasoning
                    ? 'Extended thinking enabled'
                    : 'Enable extended thinking'
                  : 'Model does not support reasoning'
              }
              className={`px-2 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 ${
                !supportsReasoning
                  ? 'bg-slate-800/50 text-slate-600 cursor-not-allowed'
                  : node.useReasoning
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-amber-500/20'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-amber-400'
              }`}
            >
              <Sparkles size={12} className={node.useReasoning ? 'animate-pulse' : ''} />
            </button>
            
            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-all ${
                !canGenerate
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white shadow-lg shadow-pink-500/20'
              }`}
            >
              {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
              {isLoading ? 'Gen' : 'Run'}
            </button>
          </div>

          {/* Error Display */}
          {hasError && node.error && (
            <div className="flex items-start gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
              <span className="text-xs text-red-300 line-clamp-2">{node.error}</span>
            </div>
          )}

          {/* Generated Business Name */}
          {node.generatedBusinessName && (
            <div className="px-3 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <div className="text-[10px] text-emerald-400 uppercase tracking-wider mb-1">
                Generated Name
              </div>
              <div className="text-sm text-emerald-300 font-medium">
                {node.generatedBusinessName}
              </div>
            </div>
          )}

          {/* Generated Prompt Preview */}
          {hasResult && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowPrompt(!showPrompt)}
                  className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-pink-400 hover:text-pink-300 transition-colors"
                >
                  {showPrompt ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  Prompt Preview
                </button>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-slate-400 hover:text-slate-300 transition-colors"
                >
                  {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              {showPrompt && (
                <div className="bg-slate-950/60 border border-pink-500/20 rounded-lg p-3 max-h-40 overflow-y-auto">
                  <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono">
                    {node.generatedPrompt?.substring(0, 800)}
                    {(node.generatedPrompt?.length ?? 0) > 800 && '...'}
                  </pre>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </BaseNode>
  );
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default WebDesignerNode;
