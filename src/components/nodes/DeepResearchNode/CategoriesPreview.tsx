import React from 'react';
import {
  ChevronDown,
  ChevronUp,
  Zap,
  DollarSign,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import { getLeadEconomics, LeadEconomics } from '@/api/serp';

interface CategoriesPreviewProps {
  tier1: string[];
  tier2: string[];
  conditional: string[];
  expanded: boolean;
  onToggle: () => void;
}

// Tier badge styles
const TIER_STYLES: Record<string, { bg: string; text: string; border: string; label: string }> = {
  tier1: {
    bg: 'bg-blue-500/20',
    text: 'text-blue-300',
    border: 'border-blue-500/30',
    label: 'Core',
  },
  tier2: {
    bg: 'bg-purple-500/20',
    text: 'text-purple-300',
    border: 'border-purple-500/30',
    label: 'Market',
  },
  conditional: {
    bg: 'bg-amber-500/20',
    text: 'text-amber-300',
    border: 'border-amber-500/30',
    label: 'Signal',
  },
};

// Urgency icon component
function UrgencyIcon({ urgency }: { urgency: LeadEconomics['urgency'] }) {
  const colors = {
    extreme: 'text-red-400',
    high: 'text-orange-400',
    medium: 'text-amber-400',
    low: 'text-slate-400',
  };

  return (
    <Zap
      size={10}
      className={`${colors[urgency]} ${urgency === 'extreme' ? 'animate-pulse' : ''}`}
    />
  );
}

// Competition badge
function CompetitionBadge({ level }: { level: LeadEconomics['competitionLevel'] }) {
  const styles = {
    low: 'text-emerald-400',
    moderate: 'text-amber-400',
    high: 'text-orange-400',
    extreme: 'text-red-400',
  };

  return (
    <span className={`text-[9px] ${styles[level]}`}>
      {level.charAt(0).toUpperCase() + level.slice(1)}
    </span>
  );
}

// Single category row
function CategoryRow({
  category,
  tier,
}: {
  category: string;
  tier: 'tier1' | 'tier2' | 'conditional';
}) {
  const economics = getLeadEconomics(category);
  const tierStyle = TIER_STYLES[tier];

  return (
    <div className="flex items-center justify-between py-1.5 px-2 hover:bg-slate-800/30 rounded transition-colors">
      <div className="flex items-center gap-2 min-w-0">
        <span
          className={`px-1.5 py-0.5 text-[9px] rounded border shrink-0 ${tierStyle.bg} ${tierStyle.text} ${tierStyle.border}`}
        >
          {tierStyle.label}
        </span>
        <span className="text-xs text-slate-200 truncate">{category}</span>
      </div>

      {economics ? (
        <div className="flex items-center gap-2 shrink-0">
          <UrgencyIcon urgency={economics.urgency} />
          <span className="text-[10px] text-slate-400">
            ${economics.typicalCPL.min}-{economics.typicalCPL.max}
          </span>
          <CompetitionBadge level={economics.competitionLevel} />
        </div>
      ) : (
        <span className="text-[10px] text-slate-500 italic">No data</span>
      )}
    </div>
  );
}

export function CategoriesPreview({
  tier1,
  tier2,
  conditional,
  expanded,
  onToggle,
}: CategoriesPreviewProps) {
  const total = tier1.length + tier2.length + conditional.length;

  return (
    <div className="bg-slate-950/60 border border-slate-700/50 rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-slate-800/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <TrendingUp size={14} className="text-orange-400" />
          <span className="text-xs font-medium text-slate-200">
            Categories to Scan
          </span>
          <span className="px-1.5 py-0.5 bg-orange-500/20 text-orange-300 text-[10px] rounded">
            {total} total
          </span>
        </div>
        <span className="text-slate-500">
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </button>

      {/* Legend */}
      {expanded && (
        <div className="px-3 py-1.5 border-t border-b border-slate-700/50 bg-slate-800/30 flex items-center gap-4 text-[10px] text-slate-500">
          <div className="flex items-center gap-1">
            <Zap size={10} className="text-orange-400" />
            <span>Urgency</span>
          </div>
          <div className="flex items-center gap-1">
            <DollarSign size={10} className="text-slate-400" />
            <span>CPL Range</span>
          </div>
          <div className="flex items-center gap-1">
            <AlertTriangle size={10} className="text-slate-400" />
            <span>Competition</span>
          </div>
        </div>
      )}

      {/* Categories List */}
      {expanded && (
        <div className="max-h-[600px] overflow-y-auto scrollbar-themed">
          {/* Tier 1 */}
          {tier1.length > 0 && (
            <div className="px-1 py-1">
              {tier1.map((category) => (
                <CategoryRow
                  key={category}
                  category={category}
                  tier="tier1"
                />
              ))}
            </div>
          )}

          {/* Tier 2 */}
          {tier2.length > 0 && (
            <div className="px-1 py-1 border-t border-slate-800/50">
              {tier2.map((category) => (
                <CategoryRow
                  key={category}
                  category={category}
                  tier="tier2"
                />
              ))}
            </div>
          )}

          {/* Conditional */}
          {conditional.length > 0 && (
            <div className="px-1 py-1 border-t border-slate-800/50">
              <div className="px-2 py-1 text-[10px] text-amber-400/70 flex items-center gap-1">
                <AlertTriangle size={10} />
                <span>Conditional - scanned to validate market signals</span>
              </div>
              {conditional.map((category) => (
                <CategoryRow
                  key={category}
                  category={category}
                  tier="conditional"
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CategoriesPreview;
