import React, { useState } from 'react';
import { Database, ChevronUp, ChevronDown, AlertTriangle, TrendingUp, TrendingDown, Minus, Activity, ShieldCheck, Copy, Check } from 'lucide-react';
import { CategoryAnalysisResult } from '@/types/nodes';

interface ResultsTableProps {
  results: CategoryAnalysisResult[];
  currentCategory?: string | null;
  isScanning: boolean;
  onManualOverride?: (category: string, override: boolean) => void;
}

type SortField = 'category' | 'serpScore' | 'verdict';
type SortDirection = 'asc' | 'desc';

// Verdict badge colors
const VERDICT_STYLES = {
  strong: {
    bg: 'bg-emerald-500/20',
    border: 'border-emerald-500/30',
    text: 'text-emerald-300',
    icon: '✅',
  },
  maybe: {
    bg: 'bg-amber-500/20',
    border: 'border-amber-500/30',
    text: 'text-amber-300',
    icon: '⚠️',
  },
  skip: {
    bg: 'bg-red-500/20',
    border: 'border-red-500/30',
    text: 'text-red-300',
    icon: '❌',
  },
};

// Trend direction icons
const TREND_ICONS = {
  growing: <TrendingUp size={10} className="text-emerald-400" />,
  declining: <TrendingDown size={10} className="text-red-400" />,
  flat: <Minus size={10} className="text-slate-400" />,
  volatile: <Activity size={10} className="text-amber-400" />,
};

// Tier badge styles
const TIER_STYLES: Record<string, string> = {
  tier1: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  tier2: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  tier3: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  conditional: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
};

// Tier label display
const TIER_LABELS: Record<string, string> = {
  tier1: 'T1',
  tier2: 'T2',
  tier3: 'T3',
  conditional: 'C',
};

export function ResultsTable({
  results,
  currentCategory,
  isScanning,
  onManualOverride,
}: ResultsTableProps) {
  const [sortField, setSortField] = useState<SortField>('category');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [copiedCategory, setCopiedCategory] = useState<string | null>(null);

  // Copy reasoning to clipboard
  const handleCopyReasoning = async (category: string, reasoning: string) => {
    try {
      await navigator.clipboard.writeText(reasoning);
      setCopiedCategory(category);
      setTimeout(() => setCopiedCategory(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Sort results
  const sortedResults = [...results].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case 'category':
        comparison = a.category.localeCompare(b.category);
        break;
      case 'serpScore':
        comparison = a.serpScore - b.serpScore;
        break;
      case 'verdict':
        const verdictOrder = { strong: 0, maybe: 1, skip: 2 };
        comparison = verdictOrder[a.verdict] - verdictOrder[b.verdict];
        break;
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // Toggle sort
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sort indicator
  const SortIndicator = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp size={10} />
    ) : (
      <ChevronDown size={10} />
    );
  };

  if (results.length === 0 && !isScanning) {
    return (
      <div className="bg-slate-950/60 border border-slate-700/50 rounded-lg px-4 py-6 text-center">
        <span className="text-xs text-slate-500">
          No results yet. Run a scan to see category analysis.
        </span>
      </div>
    );
  }

  return (
    <div className="bg-slate-950/60 border border-slate-700/50 rounded-lg overflow-hidden">
      {/* Table Header */}
      <div className="grid grid-cols-[1fr,70px,50px,60px,50px] gap-1 px-2 py-1.5 bg-slate-800/50 border-b border-slate-700/50 text-[10px] text-slate-400 uppercase tracking-wider">
        <button
          onClick={() => toggleSort('category')}
          className="flex items-center gap-1 hover:text-slate-200 text-left"
        >
          Category <SortIndicator field="category" />
        </button>
        <span className="text-center">SERP</span>
        <span className="text-center">Trend</span>
        <span className="text-center">Lead $</span>
        <button
          onClick={() => toggleSort('verdict')}
          className="flex items-center justify-center gap-1 hover:text-slate-200"
        >
          <SortIndicator field="verdict" />
        </button>
      </div>

      {/* Table Body */}
      <div className="max-h-[600px] overflow-y-auto scrollbar-themed">
        {sortedResults.map((result) => {
          const verdictStyle = VERDICT_STYLES[result.verdict];
          const tierStyle = TIER_STYLES[result.tier];
          const isCurrentlyScanning = currentCategory === result.category;
          const hasValidationFlags = (result.validationFlags?.length ?? 0) > 0;
          const hasCriticalFlag = result.validationFlags?.some(
            (f) => f.includes('SPIKE_ANOMALY') || 
                   f.includes('SEVERE_DECLINE') ||
                   f.includes('INSUFFICIENT_TREND_DATA') ||
                   f.includes('NO_SEARCH_INTEREST')
          );
          const isManuallyOverridden = result.manualOverride === true;

          return (
            <div
              key={result.category}
              className={`grid grid-cols-[1fr,70px,50px,60px,50px] gap-1 px-2 py-1.5 border-b border-slate-800/50 text-xs ${
                isCurrentlyScanning 
                  ? 'bg-orange-500/10' 
                  : hasCriticalFlag
                  ? 'bg-red-500/5'
                  : 'hover:bg-slate-800/30'
              }`}
            >
              {/* Category + Tier + Cache + Validation Warning */}
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="truncate text-slate-200">{result.category}</span>
                <span
                  className={`px-1 py-0.5 text-[9px] rounded border shrink-0 ${tierStyle}`}
                >
                  {TIER_LABELS[result.tier] || 'T?'}
                </span>
                {result.fromCache && (
                  <Database size={10} className="text-emerald-400 shrink-0" />
                )}
                {/* Manual Override Badge */}
                {isManuallyOverridden && (
                  <div className="flex items-center gap-1 shrink-0">
                    <ShieldCheck size={10} className="text-blue-400" />
                    <span className="text-[9px] text-blue-400">Validated</span>
                    {onManualOverride && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onManualOverride(result.category, false);
                        }}
                        className="text-[9px] text-slate-500 hover:text-slate-300"
                        title="Undo manual validation"
                      >
                        (undo)
                      </button>
                    )}
                  </div>
                )}
                {/* Validation Flags Warning + Override Button */}
                {hasValidationFlags && !isManuallyOverridden && (
                  <div className="relative group shrink-0 flex items-center gap-1">
                    <AlertTriangle 
                      size={10} 
                      className={hasCriticalFlag ? 'text-red-400' : 'text-amber-400'} 
                    />
                    {/* Override button */}
                    {onManualOverride && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onManualOverride(result.category, true);
                        }}
                        className="px-1.5 py-0.5 text-[9px] bg-slate-700/50 hover:bg-slate-600/50 
                                   border border-slate-600/50 rounded text-slate-400 hover:text-slate-200 
                                   transition-colors whitespace-nowrap"
                        title="I've validated this manually"
                      >
                        Override
                      </button>
                    )}
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-0 mb-1 hidden group-hover:block z-50">
                      <div className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[9px] text-slate-300 whitespace-nowrap max-w-48">
                        {result.validationFlags?.slice(0, 2).map((flag, i) => (
                          <div key={i} className="truncate">{flag.split(':')[0]}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* SERP Quality */}
              <div className="flex items-center justify-center gap-1">
                <span
                  className={`text-[10px] ${
                    result.serpQuality === 'Weak'
                      ? 'text-emerald-400'
                      : result.serpQuality === 'Strong'
                      ? 'text-red-400'
                      : 'text-amber-400'
                  }`}
                >
                  {result.serpQuality}
                </span>
                <span className="text-slate-500 text-[10px]">
                  ({result.serpScore})
                </span>
              </div>

              {/* Trend Direction + Confidence */}
              <div className="flex items-center justify-center gap-1">
                {result.trendDirection ? (
                  <>
                    {TREND_ICONS[result.trendDirection]}
                    {result.spikeDetected && (
                      <span className="text-[8px] text-red-400" title="Spike detected">⚡</span>
                    )}
                  </>
                ) : (
                  <span className="text-[10px] text-slate-600">—</span>
                )}
              </div>

              {/* Lead Value */}
              <div className="text-center text-slate-300 text-[10px]">
                {result.leadValue}
              </div>

              {/* Verdict */}
              <div className="flex justify-center relative group/verdict">
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] border cursor-help ${verdictStyle.bg} ${verdictStyle.border} ${verdictStyle.text}`}
                >
                  {verdictStyle.icon}
                </span>
                {/* Verdict Tooltip - pb-2 creates invisible bridge to icon */}
                <div className="absolute bottom-full right-0 hidden group-hover/verdict:block z-50 pb-2">
                  <div 
                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-[11px] text-slate-300 w-56 shadow-xl cursor-pointer hover:border-slate-600 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyReasoning(result.category, result.reasoning || 'No detailed reasoning available.');
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-medium ${verdictStyle.text}`}>
                        {result.verdict === 'strong' ? 'Strong Opportunity' : result.verdict === 'maybe' ? 'Maybe — Needs Review' : 'Skip — Not Recommended'}
                      </span>
                      {copiedCategory === result.category ? (
                        <Check size={12} className="text-emerald-400" />
                      ) : (
                        <Copy size={12} className="text-slate-500" />
                      )}
                    </div>
                    <div className="text-slate-400 leading-relaxed">
                      {result.reasoning || 'No detailed reasoning available.'}
                    </div>
                    <div className="text-[9px] text-slate-600 mt-1.5 text-center">
                      {copiedCategory === result.category ? 'Copied!' : 'Click to copy'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Scanning indicator row */}
        {isScanning && currentCategory && (
          <div className="grid grid-cols-[1fr,70px,50px,60px,50px] gap-1 px-2 py-1.5 bg-orange-500/10 border-b border-slate-800/50 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
              <span className="text-orange-300">{currentCategory}</span>
            </div>
            <div className="col-span-4 flex items-center justify-center">
              <span className="text-[10px] text-orange-400 animate-pulse">
                Analyzing...
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ResultsTable;
