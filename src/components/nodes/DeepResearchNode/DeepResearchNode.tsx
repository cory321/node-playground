import React, { useState, useEffect } from 'react';
import {
  Search,
  Play,
  Square,
  Loader2,
  AlertCircle,
  MapPin,
  Link2Off,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import { DeepResearchNodeData, HoveredPort, ResearchScanMode } from '@/types/nodes';
import { BaseNode } from '../base';
import { ScanModeSelector } from './ScanModeSelector';
import { CityProfileDisplay } from './CityProfileDisplay';
import { BudgetIndicator } from './BudgetIndicator';
import { ResultsTable } from './ResultsTable';
import { OpportunitySummary } from './OpportunitySummary';
import { useDeepResearch } from '@/hooks/useDeepResearch';
import { useCityProfile } from '@/hooks/useCityProfile';
import { getCategoriesToScan, DEFAULT_SCAN_CONFIG } from '@/api/serp';

interface DeepResearchNodeProps {
  node: DeepResearchNodeData;
  updateNode: (id: string, updates: Partial<DeepResearchNodeData>) => void;
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
    lat?: number;
    lng?: number;
    demographics?: {
      population: number | null;
      medianHouseholdIncome: number | null;
      homeownershipRate: number | null;
      medianHomeValue: number | null;
    };
  } | null;
}

export function DeepResearchNode({
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
}: DeepResearchNodeProps) {
  const [profileExpanded, setProfileExpanded] = useState(false);

  // Get city profile from incoming demographics
  const { profile } = useCityProfile({
    demographics: incomingData?.demographics as any,
    lat: incomingData?.lat,
    lng: incomingData?.lng,
  });

  // Get category counts for display
  const { tier1, tier2 } = getCategoriesToScan(profile, DEFAULT_SCAN_CONFIG);

  // Research hook
  const { runTriageScan, runFullScan, stopScan, isScanning, hasApiKey } =
    useDeepResearch({
      nodeId: node.id,
      updateNode,
    });

  // Handle mode change
  const handleModeChange = (mode: ResearchScanMode) => {
    updateNode(node.id, { scanMode: mode });
  };

  // Handle run button
  const handleRun = () => {
    if (!incomingData?.city) return;

    if (node.scanMode === 'triage') {
      runTriageScan(incomingData.city, incomingData.state);
    } else {
      runFullScan(incomingData.city, incomingData.state, profile);
    }
  };

  // Update city traits when profile changes
  // Use primitive values in deps to avoid infinite loops from object reference changes
  const traitsKey = profile.traits.join(',');
  const incomingCity = incomingData?.city;
  const incomingState = incomingData?.state;
  
  useEffect(() => {
    if (profile.traits.length > 0 && incomingCity) {
      // Only update if values actually changed
      const traitsChanged = node.cityTraits?.join(',') !== traitsKey;
      const cityChanged = node.inputCity !== incomingCity;
      const stateChanged = node.inputState !== incomingState;
      
      if (traitsChanged || cityChanged || stateChanged) {
        updateNode(node.id, {
          cityTraits: profile.traits,
          inputCity: incomingCity,
          inputState: incomingState,
        });
      }
    }
  }, [traitsKey, incomingCity, incomingState, node.id, node.cityTraits, node.inputCity, node.inputState, updateNode, profile.traits]);

  const isLoading = node.status === 'loading';
  const hasError = node.status === 'error';
  const hasResults =
    node.status === 'success' &&
    (node.categoryResults.length > 0 || node.triageResult);

  // Loading overlay
  const loadingOverlay = (
    <div className="absolute inset-0 z-40 bg-slate-900/80 backdrop-blur-sm rounded-2xl flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-transparent border-t-orange-500 border-r-amber-500 animate-spin" />
          <Search size={20} className="absolute inset-0 m-auto text-orange-400" />
        </div>
        <div className="text-center">
          <span className="text-[10px] uppercase tracking-[0.2em] text-orange-300 font-mono block">
            {node.progress.currentCategory
              ? `Scanning: ${node.progress.currentCategory}`
              : 'Starting scan...'}
          </span>
          {node.progress.totalCount > 0 && (
            <span className="text-[10px] text-slate-500 mt-1 block">
              {node.progress.completedCount} / {node.progress.totalCount} categories
            </span>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <BaseNode
      node={node}
      icon={<Search size={14} className="text-orange-400" />}
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
          ? 'border-orange-500/50 shadow-orange-500/20'
          : hasError
          ? 'border-red-500/50'
          : 'border-slate-700/50'
      }
      hoverBorderClass="group-hover:border-orange-500/30"
      resizeHoverColor="hover:text-orange-400"
    >
      {/* API Key Warning */}
      {!hasApiKey && (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <AlertCircle size={14} className="text-amber-400 shrink-0" />
          <span className="text-xs text-amber-300">
            SerpAPI key not configured. Add VITE_SERP_API_KEY to .env
          </span>
        </div>
      )}

      {/* Input Status */}
      {!incomingData?.city ? (
        <div className="flex items-center gap-2 px-3 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg">
          <Link2Off size={14} className="text-slate-500" />
          <span className="text-xs text-slate-500">
            Connect a Location Node to start research
          </span>
        </div>
      ) : (
        <>
          {/* City Profile */}
          <CityProfileDisplay
            cityName={incomingData.city}
            state={incomingData.state}
            traits={profile.traits}
            tier2Categories={profile.tier2Categories}
            expanded={profileExpanded}
            onToggleExpanded={() => setProfileExpanded(!profileExpanded)}
          />

          {/* Scan Mode Selector */}
          <ScanModeSelector
            mode={node.scanMode}
            onChange={handleModeChange}
            disabled={isScanning}
            tier1Count={tier1.length}
            tier2Count={tier2.length}
          />

          {/* Run/Stop Button */}
          <div className="flex gap-2">
            {isScanning ? (
              <button
                onClick={stopScan}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30 transition-all"
              >
                <Square size={14} />
                Stop Scan
              </button>
            ) : (
              <button
                onClick={handleRun}
                disabled={!hasApiKey || !incomingData?.city}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                  !hasApiKey || !incomingData?.city
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white shadow-lg shadow-orange-500/20'
                }`}
              >
                <Play size={14} />
                Run {node.scanMode === 'triage' ? 'Triage' : 'Full Scan'}
              </button>
            )}
          </div>

          {/* Budget Indicator */}
          {(isScanning || hasResults) && (
            <BudgetIndicator
              searchesUsed={node.progress.searchesUsed}
              maxSearches={node.maxSearches}
              cacheHits={node.progress.cacheHits}
              isScanning={isScanning}
            />
          )}
        </>
      )}

      {/* Error Display */}
      {hasError && node.error && (
        <div className="flex items-start gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
          <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
          <span className="text-xs text-red-300 line-clamp-2">{node.error}</span>
        </div>
      )}

      {/* Triage Result */}
      {node.triageResult && node.scanMode === 'triage' && (
        <div
          className={`px-3 py-3 rounded-lg border ${
            node.triageResult.worthFullScan
              ? 'bg-emerald-500/10 border-emerald-500/30'
              : 'bg-amber-500/10 border-amber-500/30'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            {node.triageResult.worthFullScan ? (
              <CheckCircle2 size={16} className="text-emerald-400" />
            ) : (
              <Zap size={16} className="text-amber-400" />
            )}
            <span
              className={`text-sm font-medium ${
                node.triageResult.worthFullScan
                  ? 'text-emerald-300'
                  : 'text-amber-300'
              }`}
            >
              {node.triageResult.overallSignal === 'promising'
                ? 'Promising Market'
                : node.triageResult.overallSignal === 'saturated'
                ? 'Saturated Market'
                : 'Neutral Signals'}
            </span>
          </div>
          <p className="text-xs text-slate-300 mb-2">
            {node.triageResult.recommendation}
          </p>
          <div className="flex flex-wrap gap-2 text-[10px]">
            <span className="px-2 py-0.5 bg-slate-800/80 rounded text-slate-400">
              LSAs: {node.triageResult.lsaPresent ? '✅ Present' : '❌ None'}
            </span>
            <span className="px-2 py-0.5 bg-slate-800/80 rounded text-slate-400">
              Aggregators: {node.triageResult.aggregatorDominance}
            </span>
            <span className="px-2 py-0.5 bg-slate-800/80 rounded text-slate-400">
              Ad Density: {node.triageResult.adDensity}
            </span>
          </div>
          {node.triageResult.worthFullScan && (
            <button
              onClick={() => handleModeChange('full')}
              className="mt-3 w-full text-xs py-1.5 px-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded hover:bg-emerald-500/30 transition-colors"
            >
              Run Full Scan →
            </button>
          )}
        </div>
      )}

      {/* Full Scan Results */}
      {node.scanMode === 'full' && node.categoryResults.length > 0 && (
        <>
          <ResultsTable
            results={node.categoryResults}
            currentCategory={node.progress.currentCategory}
            isScanning={isScanning}
          />

          {!isScanning && (
            <OpportunitySummary
              topOpportunities={node.topOpportunities}
              skipList={node.skipList}
            />
          )}
        </>
      )}
    </BaseNode>
  );
}

export default DeepResearchNode;
