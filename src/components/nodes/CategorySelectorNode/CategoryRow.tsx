import React from 'react';
import { Check, X, AlertTriangle, Eye, EyeOff, Link2 } from 'lucide-react';
import { CategoryItem } from '@/types/nodes';
import { SerpBadge } from './SerpBadge';

interface CategoryRowProps {
  item: CategoryItem;
  onToggleVisible: (id: string) => void;
  isConnected: boolean;
  rank?: number; // 1-3 for top opportunities
}

/**
 * CategoryRow - Displays a single category with visibility toggle
 * Shows: [toggle] CategoryName [SerpBadge] $LeadValue [VerdictIcon] [ConnectionIndicator]
 */
// Rank badge colors for top 3
const RANK_COLORS = {
  1: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
  2: { bg: 'bg-slate-400/20', text: 'text-slate-300', border: 'border-slate-400/30' },
  3: { bg: 'bg-orange-600/20', text: 'text-orange-400', border: 'border-orange-500/30' },
} as const;

export function CategoryRow({
  item,
  onToggleVisible,
  isConnected,
  rank,
}: CategoryRowProps) {
  const verdictConfig = {
    strong: {
      icon: Check,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    maybe: {
      icon: AlertTriangle,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
    },
    skip: {
      icon: X,
      color: 'text-red-400',
      bg: 'bg-red-500/10',
    },
  };

  const { icon: VerdictIcon, color: verdictColor, bg: verdictBg } = verdictConfig[item.verdict];

  return (
    <div
      className={`flex items-center gap-2 px-2 py-2 rounded-lg transition-all ${
        item.visible
          ? 'bg-slate-800/60 border border-slate-700/50'
          : 'bg-slate-800/30 border border-transparent opacity-60'
      }`}
    >
      {/* Rank Badge for Top 3 */}
      {rank && rank <= 3 && (
        <div
          className={`w-5 h-5 flex items-center justify-center rounded text-[10px] font-bold border ${
            RANK_COLORS[rank as 1 | 2 | 3].bg
          } ${RANK_COLORS[rank as 1 | 2 | 3].text} ${RANK_COLORS[rank as 1 | 2 | 3].border}`}
          title={`#${rank} opportunity`}
        >
          {rank}
        </div>
      )}

      {/* Visibility Toggle */}
      <button
        onClick={() => onToggleVisible(item.id)}
        className={`p-1 rounded transition-colors ${
          item.visible
            ? 'text-violet-400 hover:bg-violet-500/20'
            : 'text-slate-500 hover:bg-slate-700/50'
        }`}
        title={item.visible ? 'Hide category (remove port)' : 'Show category (add port)'}
      >
        {item.visible ? <Eye size={14} /> : <EyeOff size={14} />}
      </button>

      {/* Category Name */}
      <span
        className={`flex-1 text-xs font-medium truncate ${
          item.visible ? 'text-slate-200' : 'text-slate-400'
        }`}
        title={item.category}
      >
        {item.category}
      </span>

      {/* SERP Quality Badge */}
      <SerpBadge quality={item.serpQuality} />

      {/* Lead Value */}
      <span className="text-[10px] text-slate-400 font-mono w-12 text-right">
        {item.leadValue}
      </span>

      {/* Verdict Icon */}
      <div className={`p-1 rounded ${verdictBg}`}>
        <VerdictIcon size={12} className={verdictColor} />
      </div>

      {/* Connection Indicator (only for visible items) */}
      {item.visible && (
        <div
          className={`w-4 flex justify-center ${
            isConnected ? 'text-violet-400' : 'text-slate-600'
          }`}
          title={isConnected ? 'Connected to downstream node' : 'Not connected'}
        >
          {isConnected && <Link2 size={12} />}
        </div>
      )}
    </div>
  );
}

export default CategoryRow;
