import React from 'react';
import {
  GraduationCap,
  Waves,
  Users,
  DollarSign,
  Palmtree,
  Tag,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface CityProfileDisplayProps {
  cityName: string;
  state: string | null;
  traits: string[];
  tier2Categories: string[];
  expanded?: boolean;
  onToggleExpanded?: () => void;
}

// Map trait names to icons
const TRAIT_ICONS: Record<string, React.ReactNode> = {
  'College Town': <GraduationCap size={12} className="text-blue-400" />,
  Coastal: <Waves size={12} className="text-cyan-400" />,
  'Retirement Community': <Users size={12} className="text-purple-400" />,
  'High Income': <DollarSign size={12} className="text-emerald-400" />,
  'Tourism Hub': <Palmtree size={12} className="text-amber-400" />,
};

export function CityProfileDisplay({
  cityName,
  state,
  traits,
  tier2Categories,
  expanded = false,
  onToggleExpanded,
}: CityProfileDisplayProps) {
  const hasTraits = traits.length > 0;
  const hasTier2 = tier2Categories.length > 0;

  return (
    <div className="bg-slate-950/60 border border-slate-700/50 rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggleExpanded}
        disabled={!onToggleExpanded}
        className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-slate-800/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-200">
            {cityName}
            {state && <span className="text-slate-500">, {state}</span>}
          </span>
          {hasTraits && (
            <span className="px-1.5 py-0.5 bg-orange-500/20 text-orange-300 text-[10px] rounded">
              {traits.length} trait{traits.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        {onToggleExpanded && (
          <span className="text-slate-500">
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </span>
        )}
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-slate-700/50">
          {/* Detected Traits */}
          {hasTraits ? (
            <div className="pt-2">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">
                Detected Traits
              </div>
              <div className="flex flex-wrap gap-1.5">
                {traits.map((trait) => (
                  <span
                    key={trait}
                    className="flex items-center gap-1 px-2 py-1 bg-slate-800/80 border border-slate-700/50 rounded text-xs text-slate-300"
                  >
                    {TRAIT_ICONS[trait] || <Tag size={12} className="text-slate-500" />}
                    {trait}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="pt-2 text-xs text-slate-500">
              No special traits detected. Using Tier 1 categories only.
            </div>
          )}

          {/* Tier 2 Categories */}
          {hasTier2 && (
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">
                Tier 2 Categories (Conditional)
              </div>
              <div className="flex flex-wrap gap-1.5">
                {tier2Categories.map((category) => (
                  <span
                    key={category}
                    className="px-2 py-1 bg-orange-500/10 border border-orange-500/20 rounded text-xs text-orange-300"
                  >
                    {category}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CityProfileDisplay;
