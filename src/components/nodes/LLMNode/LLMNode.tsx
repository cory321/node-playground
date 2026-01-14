import React, { useState } from 'react';
import {
  Play,
  ChevronDown,
  ChevronUp,
  Loader2,
  Brain,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { LLMNodeData, HoveredPort } from '@/types/nodes';
import { BaseNode } from '../base';
import { PROVIDER_OPTIONS, getProviderOption } from './LLMNode.config';

interface LLMNodeProps {
  node: LLMNodeData;
  updateNode: (id: string, updates: Partial<LLMNodeData>) => void;
  deleteNode: (id: string) => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onResizeStart: (e: React.MouseEvent) => void;
  editingTitleId: string | null;
  setEditingTitleId: (id: string | null) => void;
  onExecute: (nodeId: string) => void;
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

export function LLMNode({
  node,
  updateNode,
  deleteNode,
  onMouseDown,
  onResizeStart,
  editingTitleId,
  setEditingTitleId,
  onExecute,
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
}: LLMNodeProps) {
  const [showResponse, setShowResponse] = useState(false);
  const isLoading = node.status === 'loading';
  const hasError = node.status === 'error';
  const hasResponse = node.status === 'success' && node.response;

  const currentProvider = getProviderOption(node.provider);
  const supportsReasoning = currentProvider?.supportsReasoning ?? false;

  const loadingOverlay = (
    <div className="absolute inset-0 z-40 bg-slate-900/80 backdrop-blur-sm rounded-2xl flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-transparent border-t-indigo-500 border-r-purple-500 animate-spin" />
          <Brain size={20} className="absolute inset-0 m-auto text-indigo-400" />
        </div>
        <span className="text-[10px] uppercase tracking-[0.2em] text-indigo-300 font-mono">
          Processing...
        </span>
      </div>
    </div>
  );

  return (
    <BaseNode
      node={node}
      icon={<Brain size={14} style={{ color: currentProvider.color }} />}
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
          : 'border-slate-700/50'
      }
    >
      {/* Provider Selector */}
      <div className="flex items-center gap-2">
        <select
          value={node.provider || 'claude-sonnet'}
          onChange={(e) => updateNode(node.id, { provider: e.target.value, useReasoning: false })}
          disabled={isLoading}
          className="flex-1 bg-slate-950/60 border border-slate-700/50 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 cursor-pointer disabled:opacity-50"
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
          <span className="hidden sm:inline">Think</span>
        </button>
        <button
          onClick={() => onExecute(node.id)}
          disabled={isLoading || !node.text?.trim()}
          className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-all ${
            isLoading || !node.text?.trim()
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/20'
          }`}
        >
          {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
          {isLoading ? 'Running' : 'Run'}
        </button>
      </div>

      {/* Incoming Data Indicator */}
      {incomingData && (
        <div className="flex items-center gap-2 px-3 py-2 bg-purple-500/10 border border-purple-500/20 rounded-lg">
          <Sparkles size={12} className="text-purple-400" />
          <span className="text-[10px] text-purple-300 uppercase tracking-wider truncate">
            Context from upstream node
          </span>
        </div>
      )}

      {/* Prompt Textarea */}
      <textarea
        value={node.text}
        onChange={(e) => updateNode(node.id, { text: e.target.value })}
        placeholder="Enter your prompt..."
        disabled={isLoading}
        className="w-full flex-1 bg-slate-950/40 border border-slate-800/80 rounded-xl p-3 text-sm text-slate-300 placeholder:text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 resize-none transition-all scrollbar-hide disabled:opacity-50 min-h-[60px]"
      />

      {/* Error Display */}
      {hasError && node.error && (
        <div className="flex items-start gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
          <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
          <span className="text-xs text-red-300 line-clamp-2">{node.error}</span>
        </div>
      )}

      {/* Response Preview */}
      {hasResponse && (
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setShowResponse(!showResponse)}
            className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            {showResponse ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            Response Preview
          </button>
          {showResponse && (
            <div className="bg-slate-950/60 border border-emerald-500/20 rounded-lg p-3 max-h-32 overflow-y-auto">
              <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono">
                {node.response?.substring(0, 500)}
                {(node.response?.length ?? 0) > 500 && '...'}
              </pre>
            </div>
          )}
        </div>
      )}
    </BaseNode>
  );
}

export default LLMNode;
