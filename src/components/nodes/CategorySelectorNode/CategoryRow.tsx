import React from 'react';
import { Check, X, AlertTriangle, Eye, EyeOff, Link2 } from 'lucide-react';
import { CategoryItem } from '@/types/nodes';
import { SerpBadge } from './SerpBadge';

interface CategoryRowProps {
  item: CategoryItem;
  onToggleVisible: (id: string) => void;
  isConnected: boolean;
}

/**
 * CategoryRow - Displays a single category with visibility toggle
 * Shows: [toggle] CategoryName [SerpBadge] $LeadValue [VerdictIcon] [ConnectionIndicator]
 */
export function CategoryRow({
  item,
  onToggleVisible,
  isConnected,
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
