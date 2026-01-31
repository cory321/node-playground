import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Play,
  Square,
  AlertCircle,
  Link2Off,
  CheckCircle2,
  Zap,
  AlertTriangle,
  ShieldCheck,
  Copy,
  Check,
} from 'lucide-react';
import { DeepResearchNodeData, HoveredPort, ResearchScanMode } from '@/types/nodes';
import { BaseNode } from '../base';
import { ScanModeSelector } from './ScanModeSelector';
import { CityProfileDisplay } from './CityProfileDisplay';
import { CategoriesPreview } from './CategoriesPreview';
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
  const [categoriesExpanded, setCategoriesExpanded] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Get city profile from incoming demographics
  const { profile } = useCityProfile({
    demographics: incomingData?.demographics as any,
    lat: incomingData?.lat,
    lng: incomingData?.lng,
  });

  // Get category counts for display
  const { tier1, tier2, conditional } = getCategoriesToScan(profile, DEFAULT_SCAN_CONFIG);

  // Research hook
  const { runTriageScan, runFullScan, stopScan, setManualOverride, isScanning, hasApiKey } =
    useDeepResearch({
      nodeId: node.id,
      node,
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

  // Generate comprehensive report for clipboard
  const generateComprehensiveReport = useCallback(() => {
    const lines: string[] = [];
    const city = incomingData?.city || node.inputCity || 'Unknown';
    const state = incomingData?.state || node.inputState || '';
    const location = state ? `${city}, ${state}` : city;
    const scanDate = node.lastScanAt ? new Date(node.lastScanAt).toLocaleString() : 'Unknown';

    // Header
    lines.push(`# Deep Research Report: ${location}`);
    lines.push(`Generated: ${scanDate}`);
    lines.push('');

    // City Profile
    if (node.cityTraits && node.cityTraits.length > 0) {
      lines.push('## City Profile');
      lines.push(`**Location:** ${location}`);
      lines.push(`**Traits:** ${node.cityTraits.join(', ')}`);
      lines.push('');
    }

    // Validation Summary
    if (node.validationSummary) {
      lines.push('## Validation Summary');
      lines.push(`- **Categories Validated:** ${node.validationSummary.trendsValidated}`);
      lines.push(`- **Total Flags:** ${node.validationSummary.totalFlags}`);
      lines.push(`- **Manually Overridden:** ${node.validationSummary.overriddenCount || 0}`);
      if (node.validationSummary.criticalWarnings.length > 0) {
        lines.push('');
        lines.push('### Critical Warnings');
        node.validationSummary.criticalWarnings.forEach((warning) => {
          lines.push(`- ${warning}`);
        });
      }
      lines.push('');
    }

    // Scan Statistics
    lines.push('## Scan Statistics');
    lines.push(`- **Total Categories Scanned:** ${node.categoryResults.length}`);
    lines.push(`- **API Searches Used:** ${node.progress.searchesUsed}`);
    lines.push(`- **Cache Hits:** ${node.progress.cacheHits}`);
    lines.push('');

    // Top Opportunities
    if (node.topOpportunities.length > 0) {
      lines.push('## Top Opportunities');
      node.topOpportunities.forEach((opp, idx) => {
        lines.push(`### ${idx + 1}. ${opp.category}`);
        lines.push(`- **SERP Score:** ${opp.serpScore}/10`);
        lines.push(`- **SERP Quality:** ${opp.serpQuality}`);
        lines.push(`- **Competition:** ${opp.competition}`);
        lines.push(`- **Lead Value:** ${opp.leadValue}`);
        lines.push(`- **Urgency:** ${opp.urgency}`);
        lines.push(`- **Reasoning:** ${opp.reasoning}`);
        if (opp.trendDirection) {
          lines.push(`- **Trend Direction:** ${opp.trendDirection}`);
        }
        if (opp.demandConfidence) {
          lines.push(`- **Demand Confidence:** ${opp.demandConfidence}`);
        }
        lines.push('');
      });
    }

    // All Category Results
    lines.push('## All Category Analysis');
    lines.push('');

    // Group by verdict
    const strongCategories = node.categoryResults.filter((r) => r.verdict === 'strong');
    const maybeCategories = node.categoryResults.filter((r) => r.verdict === 'maybe');
    const skipCategories = node.categoryResults.filter((r) => r.verdict === 'skip');

    if (strongCategories.length > 0) {
      lines.push('### Strong Opportunities (Recommended)');
      lines.push('');
      strongCategories.forEach((result) => {
        lines.push(`#### ${result.category}`);
        lines.push(`- **Tier:** ${result.tier}`);
        lines.push(`- **Verdict:** ✅ STRONG`);
        lines.push(`- **SERP Score:** ${result.serpScore}/10`);
        lines.push(`- **SERP Quality:** ${result.serpQuality}`);
        lines.push(`- **Competition:** ${result.competition}`);
        lines.push(`- **Lead Value:** ${result.leadValue}`);
        lines.push(`- **Urgency:** ${result.urgency}`);
        lines.push(`- **Reasoning:** ${result.reasoning}`);
        if (result.trendDirection) lines.push(`- **Trend:** ${result.trendDirection}`);
        if (result.demandConfidence) lines.push(`- **Demand Confidence:** ${result.demandConfidence}`);
        if (result.trendConfidence) lines.push(`- **Trend Confidence:** ${result.trendConfidence}%`);
        if (result.spikeDetected) lines.push(`- **⚠️ Spike Detected:** Yes`);
        if (result.validationFlags && result.validationFlags.length > 0) {
          lines.push(`- **Validation Flags:** ${result.validationFlags.join('; ')}`);
        }
        if (result.manualOverride) lines.push(`- **Manually Validated:** Yes`);
        lines.push('');
      });
    }

    if (maybeCategories.length > 0) {
      lines.push('### Maybe Categories (Needs Validation)');
      lines.push('');
      maybeCategories.forEach((result) => {
        lines.push(`#### ${result.category}`);
        lines.push(`- **Tier:** ${result.tier}`);
        lines.push(`- **Verdict:** ⚠️ MAYBE`);
        lines.push(`- **SERP Score:** ${result.serpScore}/10`);
        lines.push(`- **SERP Quality:** ${result.serpQuality}`);
        lines.push(`- **Competition:** ${result.competition}`);
        lines.push(`- **Lead Value:** ${result.leadValue}`);
        lines.push(`- **Urgency:** ${result.urgency}`);
        lines.push(`- **Reasoning:** ${result.reasoning}`);
        if (result.trendDirection) lines.push(`- **Trend:** ${result.trendDirection}`);
        if (result.demandConfidence) lines.push(`- **Demand Confidence:** ${result.demandConfidence}`);
        if (result.trendConfidence) lines.push(`- **Trend Confidence:** ${result.trendConfidence}%`);
        if (result.spikeDetected) lines.push(`- **⚠️ Spike Detected:** Yes`);
        if (result.validationFlags && result.validationFlags.length > 0) {
          lines.push(`- **Validation Flags:** ${result.validationFlags.join('; ')}`);
        }
        if (result.manualOverride) lines.push(`- **Manually Validated:** Yes`);
        lines.push('');
      });
    }

    if (skipCategories.length > 0) {
      lines.push('### Skip Categories (Not Recommended)');
      lines.push('');
      skipCategories.forEach((result) => {
        lines.push(`#### ${result.category}`);
        lines.push(`- **Tier:** ${result.tier}`);
        lines.push(`- **Verdict:** ❌ SKIP`);
        lines.push(`- **SERP Score:** ${result.serpScore}/10`);
        lines.push(`- **Reasoning:** ${result.reasoning}`);
        if (result.validationFlags && result.validationFlags.length > 0) {
          lines.push(`- **Validation Flags:** ${result.validationFlags.join('; ')}`);
        }
        lines.push('');
      });
    }

    // Skip List Summary
    if (node.skipList.length > 0) {
      lines.push('## Skip List Summary');
      lines.push('');
      node.skipList.forEach((item) => {
        lines.push(`- **${item.category}:** ${item.reason}`);
      });
      lines.push('');
    }

    // Footer
    lines.push('---');
    lines.push(`*Report generated by Deep Research Node*`);

    return lines.join('\n');
  }, [node, incomingData]);

  // Copy report to clipboard
  const handleCopyReport = useCallback(async () => {
    const report = generateComprehensiveReport();
    try {
      await navigator.clipboard.writeText(report);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy report:', err);
    }
  }, [generateComprehensiveReport]);

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

          {/* Categories Preview */}
          <CategoriesPreview
            tier1={tier1}
            tier2={tier2}
            conditional={conditional}
            expanded={categoriesExpanded}
            onToggle={() => setCategoriesExpanded(!categoriesExpanded)}
          />

          {/* Scan Mode Selector */}
          <ScanModeSelector
            mode={node.scanMode}
            onChange={handleModeChange}
            disabled={isScanning}
            tier1Count={tier1.length}
            tier2Count={tier2.length}
            conditionalCount={conditional.length}
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
          {/* Validation Summary Banner */}
          {!isScanning && node.validationSummary && (
            <div
              className={`flex items-start gap-2 px-3 py-2 rounded-lg border ${
                node.validationSummary.criticalWarnings.length > 0
                  ? 'bg-amber-500/10 border-amber-500/20'
                  : 'bg-emerald-500/10 border-emerald-500/20'
              }`}
            >
              {node.validationSummary.criticalWarnings.length > 0 ? (
                <>
                  <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-amber-300 font-medium mb-1">
                      Validation Warnings Detected
                    </div>
                    <div className="space-y-0.5">
                      {node.validationSummary.criticalWarnings.slice(0, 2).map((warning, i) => (
                        <div key={i} className="text-[10px] text-amber-200/70 truncate">
                          • {warning.split(':')[0]}
                        </div>
                      ))}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      {node.validationSummary.trendsValidated} categories trend-validated
                    </div>
                    {(node.validationSummary.overriddenCount ?? 0) > 0 && (
                      <div className="text-[10px] text-blue-400 mt-1">
                        {node.validationSummary.overriddenCount} manually validated
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <ShieldCheck size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-xs text-emerald-300">
                      All trends validated — no anomalies detected
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {node.validationSummary.trendsValidated} categories checked
                      {(node.validationSummary.overriddenCount ?? 0) > 0 && (
                        <span className="text-blue-400 ml-1">
                          ({node.validationSummary.overriddenCount} manually validated)
                        </span>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          <ResultsTable
            results={node.categoryResults}
            currentCategory={node.progress.currentCategory}
            isScanning={isScanning}
            onManualOverride={setManualOverride}
          />

          {!isScanning && (
            <OpportunitySummary
              topOpportunities={node.topOpportunities}
              skipList={node.skipList}
            />
          )}

          {/* Copy Comprehensive Report Button */}
          {!isScanning && node.categoryResults.length > 0 && (
            <button
              onClick={handleCopyReport}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium transition-all ${
                copySuccess
                  ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300'
                  : 'bg-slate-800/80 border border-slate-700/50 text-slate-300 hover:bg-slate-700/80 hover:border-slate-600/50'
              }`}
            >
              {copySuccess ? (
                <>
                  <Check size={14} />
                  Report Copied!
                </>
              ) : (
                <>
                  <Copy size={14} />
                  Copy Comprehensive Report
                </>
              )}
            </button>
          )}
        </>
      )}
    </BaseNode>
  );
}

export default DeepResearchNode;
