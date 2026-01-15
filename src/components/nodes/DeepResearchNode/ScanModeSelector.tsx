import React from 'react';
import { Zap, Search } from 'lucide-react';
import { ResearchScanMode } from '@/types/nodes';

interface ScanModeSelectorProps {
  mode: ResearchScanMode;
  onChange: (mode: ResearchScanMode) => void;
  disabled?: boolean;
  tier1Count: number;
  tier2Count: number;
}

export function ScanModeSelector({
  mode,
  onChange,
  disabled = false,
  tier1Count,
  tier2Count,
}: ScanModeSelectorProps) {
  const totalFullScans = tier1Count + tier2Count;

  return (
    <div className="flex gap-2">
      {/* Quick Triage Button */}
      <button
        onClick={() => onChange('triage')}
        disabled={disabled}
        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
          mode === 'triage'
            ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300'
            : 'bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-slate-200 hover:border-slate-600'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <Zap size={14} className={mode === 'triage' ? 'text-amber-400' : ''} />
        <span>Quick Triage</span>
        <span
          className={`px-1.5 py-0.5 rounded text-[10px] ${
            mode === 'triage'
              ? 'bg-amber-500/30 text-amber-200'
              : 'bg-slate-700 text-slate-500'
          }`}
        >
          1 search
        </span>
      </button>

      {/* Full Scan Button */}
      <button
        onClick={() => onChange('full')}
        disabled={disabled}
        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
          mode === 'full'
            ? 'bg-orange-500/20 border border-orange-500/50 text-orange-300'
            : 'bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-slate-200 hover:border-slate-600'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <Search size={14} className={mode === 'full' ? 'text-orange-400' : ''} />
        <span>Full Scan</span>
        <span
          className={`px-1.5 py-0.5 rounded text-[10px] ${
            mode === 'full'
              ? 'bg-orange-500/30 text-orange-200'
              : 'bg-slate-700 text-slate-500'
          }`}
        >
          {totalFullScans} searches
        </span>
      </button>
    </div>
  );
}

export default ScanModeSelector;
