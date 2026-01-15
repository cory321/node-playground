import React, { useState, useCallback } from 'react';
import {
  Users,
  Play,
  Square,
  Loader2,
  AlertCircle,
  Link2Off,
  Search,
} from 'lucide-react';
import { ProviderDiscoveryNodeData, ProviderData, HoveredPort } from '@/types/nodes';
import { BaseNode } from '../base';
import { ProviderTable } from './ProviderTable';
import { useProviderDiscovery } from '@/hooks/useProviderDiscovery';
import { getProviderCounts } from '@/api/providers';
import { TIER1_CATEGORIES } from '@/api/serp';

interface ProviderDiscoveryNodeProps {
  node: ProviderDiscoveryNodeData;
  updateNode: (id: string, updates: Partial<ProviderDiscoveryNodeData>) => void;
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
    category?: string;
    city: string;
    state: string | null;
  } | null;
}

export function ProviderDiscoveryNode({
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
}: ProviderDiscoveryNodeProps) {
  // Provider discovery hook
  const { runDiscovery, stopDiscovery, isDiscovering, hasApiKey } =
    useProviderDiscovery({
      nodeId: node.id,
      updateNode,
    });

  // Determine the category to use
  const effectiveCategory = incomingData?.category || node.manualCategory || TIER1_CATEGORIES[0];
  const hasCategory = !!incomingData?.category || !!node.manualCategory;

  // Handle manual category change (when connected to Location node only)
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateNode(node.id, { manualCategory: e.target.value });
  };

  // Handle run button
  const handleRun = () => {
    if (!incomingData?.city) return;
    runDiscovery(effectiveCategory, incomingData.city, incomingData.state);
  };

  // Toggle contacted status for a provider
  const handleToggleContacted = useCallback(
    (providerId: string) => {
      const updatedProviders = node.providers.map((p) =>
        p.id === providerId ? { ...p, contacted: !p.contacted } : p
      );
      updateNode(node.id, { providers: updatedProviders });
    },
    [node.id, node.providers, updateNode]
  );

  const isLoading = node.status === 'loading';
  const hasError = node.status === 'error';
  const hasResults = node.status === 'success' && node.providers.length > 0;

  // Get provider counts for summary
  const counts = hasResults ? getProviderCounts(node.providers) : null;

  // Loading overlay
  const loadingOverlay = (
    <div className="absolute inset-0 z-40 bg-slate-900/80 backdrop-blur-sm rounded-2xl flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-transparent border-t-teal-500 border-r-cyan-500 animate-spin" />
          <Users size={20} className="absolute inset-0 m-auto text-teal-400" />
        </div>
        <div className="text-center">
          <span className="text-[10px] uppercase tracking-[0.2em] text-teal-300 font-mono block">
            {node.progress.currentSource
              ? `Searching: ${node.progress.currentSource}`
              : 'Starting discovery...'}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <BaseNode
      node={node}
      icon={<Users size={14} className="text-teal-400" />}
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
          ? 'border-teal-500/50 shadow-teal-500/20'
          : hasError
          ? 'border-red-500/50'
          : 'border-slate-700/50'
      }
      hoverBorderClass="group-hover:border-teal-500/30"
      resizeHoverColor="hover:text-teal-400"
    >
      {/* API Key Warning */}
      {!hasApiKey && (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <AlertCircle size={14} className="text-amber-400 shrink-0" />
          <span className="text-xs text-amber-300">
            Supabase not configured. Provider discovery requires SERP proxy.
          </span>
        </div>
      )}

      {/* Input Status */}
      {!incomingData?.city ? (
        <div className="flex items-center gap-2 px-3 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg">
          <Link2Off size={14} className="text-slate-500" />
          <span className="text-xs text-slate-500">
            Connect a Location or Research Node to discover providers
          </span>
        </div>
      ) : (
        <>
          {/* Location Display */}
          <div className="px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Search size={12} className="text-teal-400" />
                <span className="text-xs text-slate-300">
                  {incomingData.city}
                  {incomingData.state && `, ${incomingData.state}`}
                </span>
              </div>
            </div>
          </div>

          {/* Category Selector (show when no category from upstream) */}
          {!incomingData.category && (
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">
                Service Category
              </label>
              <select
                value={node.manualCategory || TIER1_CATEGORIES[0]}
                onChange={handleCategoryChange}
                disabled={isDiscovering}
                className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700/50 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-teal-500/50"
              >
                {TIER1_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Category from upstream display */}
          {incomingData.category && (
            <div className="px-3 py-2 bg-teal-500/10 border border-teal-500/20 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider text-teal-400 font-mono">
                  Category:
                </span>
                <span className="text-xs text-teal-200 font-medium">
                  {incomingData.category}
                </span>
              </div>
            </div>
          )}

          {/* Run/Stop Button */}
          <div className="flex gap-2">
            {isDiscovering ? (
              <button
                onClick={stopDiscovery}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30 transition-all"
              >
                <Square size={14} />
                Stop
              </button>
            ) : (
              <button
                onClick={handleRun}
                disabled={!hasApiKey || !incomingData?.city}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                  !hasApiKey || !incomingData?.city
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white shadow-lg shadow-teal-500/20'
                }`}
              >
                <Play size={14} />
                Discover Providers
              </button>
            )}
          </div>
        </>
      )}

      {/* Error Display */}
      {hasError && node.error && (
        <div className="flex items-start gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
          <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
          <span className="text-xs text-red-300 line-clamp-2">{node.error}</span>
        </div>
      )}

      {/* Results Summary */}
      {hasResults && counts && (
        <div className="flex items-center justify-between px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg">
          <div className="flex items-center gap-3 text-[10px] font-mono">
            <span className="text-slate-400">
              {counts.total} providers
            </span>
            {counts.p1 > 0 && (
              <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded">
                {counts.p1} P1
              </span>
            )}
            {counts.p2 > 0 && (
              <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded">
                {counts.p2} P2
              </span>
            )}
            {counts.p3 > 0 && (
              <span className="px-1.5 py-0.5 bg-slate-600/50 text-slate-300 rounded">
                {counts.p3} P3
              </span>
            )}
          </div>
          {counts.contacted > 0 && (
            <span className="text-[10px] text-teal-400">
              {counts.contacted} contacted
            </span>
          )}
        </div>
      )}

      {/* Provider Table */}
      {hasResults && (
        <ProviderTable
          providers={node.providers}
          onToggleContacted={handleToggleContacted}
        />
      )}
    </BaseNode>
  );
}

export default ProviderDiscoveryNode;
