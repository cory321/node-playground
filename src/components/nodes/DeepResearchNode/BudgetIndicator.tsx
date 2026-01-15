import React from 'react';
import { Search, Database, DollarSign } from 'lucide-react';

interface BudgetIndicatorProps {
  searchesUsed: number;
  maxSearches: number;
  cacheHits: number;
  isScanning: boolean;
}

export function BudgetIndicator({
  searchesUsed,
  maxSearches,
  cacheHits,
  isScanning,
}: BudgetIndicatorProps) {
  const progress = maxSearches > 0 ? (searchesUsed / maxSearches) * 100 : 0;
  const isNearLimit = progress >= 80;
  const estimatedSavings = (cacheHits * 0.01).toFixed(2); // ~$0.01 per search

  return (
    <div className="bg-slate-950/60 border border-slate-700/50 rounded-lg px-3 py-2 space-y-2">
      {/* Progress Bar */}
      <div className="flex items-center gap-2">
        <Search size={12} className="text-slate-500 shrink-0" />
        <div className="flex-1">
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                isNearLimit
                  ? 'bg-gradient-to-r from-amber-500 to-red-500'
                  : 'bg-gradient-to-r from-orange-500 to-amber-500'
              }`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
        <span
          className={`text-[10px] font-mono ${
            isNearLimit ? 'text-amber-400' : 'text-slate-400'
          }`}
        >
          {searchesUsed}/{maxSearches}
        </span>
      </div>

      {/* Stats Row */}
      <div className="flex items-center justify-between text-[10px]">
        {/* Cache Hits */}
        <div className="flex items-center gap-1 text-slate-500">
          <Database size={10} className="text-emerald-400" />
          <span>
            <span className="text-emerald-400">{cacheHits}</span> cache hit
            {cacheHits !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Estimated Savings */}
        {cacheHits > 0 && (
          <div className="flex items-center gap-1 text-slate-500">
            <DollarSign size={10} className="text-emerald-400" />
            <span className="text-emerald-400">${estimatedSavings}</span>
            <span>saved</span>
          </div>
        )}

        {/* Scanning indicator */}
        {isScanning && (
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse" />
            <span className="text-orange-400">Scanning...</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default BudgetIndicator;
