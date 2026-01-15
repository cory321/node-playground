import React, { useState } from 'react';
import { Database, ChevronUp, ChevronDown } from 'lucide-react';
import { CategoryAnalysisResult } from '@/types/nodes';

interface ResultsTableProps {
  results: CategoryAnalysisResult[];
  currentCategory?: string | null;
  isScanning: boolean;
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
}: ResultsTableProps) {
  const [sortField, setSortField] = useState<SortField>('category');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

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
      <div className="grid grid-cols-[1fr,70px,70px,70px,60px] gap-1 px-2 py-1.5 bg-slate-800/50 border-b border-slate-700/50 text-[10px] text-slate-400 uppercase tracking-wider">
        <button
          onClick={() => toggleSort('category')}
          className="flex items-center gap-1 hover:text-slate-200 text-left"
        >
          Category <SortIndicator field="category" />
        </button>
        <span className="text-center">SERP</span>
        <span className="text-center">Comp.</span>
        <span className="text-center">Lead $</span>
        <button
          onClick={() => toggleSort('verdict')}
          className="flex items-center justify-center gap-1 hover:text-slate-200"
        >
          <SortIndicator field="verdict" />
        </button>
      </div>

      {/* Table Body */}
      <div className="max-h-80 overflow-y-auto scrollbar-themed">
        {sortedResults.map((result) => {
          const verdictStyle = VERDICT_STYLES[result.verdict];
          const tierStyle = TIER_STYLES[result.tier];
          const isCurrentlyScanning = currentCategory === result.category;

          return (
            <div
              key={result.category}
              className={`grid grid-cols-[1fr,70px,70px,70px,60px] gap-1 px-2 py-1.5 border-b border-slate-800/50 text-xs ${
                isCurrentlyScanning ? 'bg-orange-500/10' : 'hover:bg-slate-800/30'
              }`}
            >
              {/* Category + Tier + Cache */}
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

              {/* Competition */}
              <div className="text-center">
                <span
                  className={`text-[10px] ${
                    result.competition === 'Low'
                      ? 'text-emerald-400'
                      : result.competition === 'High'
                      ? 'text-red-400'
                      : 'text-amber-400'
                  }`}
                >
                  {result.competition}
                </span>
              </div>

              {/* Lead Value */}
              <div className="text-center text-slate-300 text-[10px]">
                {result.leadValue}
              </div>

              {/* Verdict */}
              <div className="flex justify-center">
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] border ${verdictStyle.bg} ${verdictStyle.border} ${verdictStyle.text}`}
                >
                  {verdictStyle.icon}
                </span>
              </div>
            </div>
          );
        })}

        {/* Scanning indicator row */}
        {isScanning && currentCategory && (
          <div className="grid grid-cols-[1fr,70px,70px,70px,60px] gap-1 px-2 py-1.5 bg-orange-500/10 border-b border-slate-800/50 text-xs">
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
