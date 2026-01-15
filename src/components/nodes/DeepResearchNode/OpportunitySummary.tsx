import React, { useState } from 'react';
import { Trophy, XCircle, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { CategoryAnalysisResult } from '@/types/nodes';

interface OpportunitySummaryProps {
  topOpportunities: CategoryAnalysisResult[];
  skipList: { category: string; reason: string }[];
}

export function OpportunitySummary({
  topOpportunities,
  skipList,
}: OpportunitySummaryProps) {
  const [showSkipList, setShowSkipList] = useState(false);

  if (topOpportunities.length === 0 && skipList.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Top Opportunities */}
      {topOpportunities.length > 0 && (
        <div className="bg-gradient-to-br from-emerald-950/40 to-slate-950/60 border border-emerald-500/30 rounded-lg overflow-hidden">
          <div className="px-3 py-2 border-b border-emerald-500/20 flex items-center gap-2">
            <Trophy size={14} className="text-emerald-400" />
            <span className="text-xs font-medium text-emerald-300 uppercase tracking-wider">
              Top {topOpportunities.length} Opportunities
            </span>
          </div>

          <div className="divide-y divide-emerald-500/10">
            {topOpportunities.map((opp, index) => (
              <div key={opp.category} className="px-3 py-2">
                <div className="flex items-start gap-2">
                  <span className="shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-200">
                        {opp.category}
                      </span>
                      <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] rounded">
                        {opp.leadValue}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                      {opp.reasoning}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-500">
                      <span>
                        SERP:{' '}
                        <span
                          className={
                            opp.serpQuality === 'Weak'
                              ? 'text-emerald-400'
                              : 'text-amber-400'
                          }
                        >
                          {opp.serpQuality}
                        </span>
                      </span>
                      <span>
                        Competition:{' '}
                        <span
                          className={
                            opp.competition === 'Low'
                              ? 'text-emerald-400'
                              : 'text-amber-400'
                          }
                        >
                          {opp.competition}
                        </span>
                      </span>
                      <span>
                        Urgency:{' '}
                        <span
                          className={
                            opp.urgency === 'High'
                              ? 'text-emerald-400'
                              : 'text-slate-400'
                          }
                        >
                          {opp.urgency}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Action hint */}
          <div className="px-3 py-2 bg-emerald-500/10 border-t border-emerald-500/20">
            <div className="flex items-center gap-2 text-[10px] text-emerald-300">
              <Sparkles size={12} />
              <span>
                These categories show weak SERPs with validated lead markets
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Skip List */}
      {skipList.length > 0 && (
        <div className="bg-slate-950/60 border border-slate-700/50 rounded-lg overflow-hidden">
          <button
            onClick={() => setShowSkipList(!showSkipList)}
            className="w-full px-3 py-2 flex items-center justify-between hover:bg-slate-800/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <XCircle size={14} className="text-red-400" />
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Skip List
              </span>
              <span className="px-1.5 py-0.5 bg-slate-800 text-slate-500 text-[10px] rounded">
                {skipList.length}
              </span>
            </div>
            <span className="text-slate-500">
              {showSkipList ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </span>
          </button>

          {showSkipList && (
            <div className="px-3 pb-2 space-y-1">
              {skipList.map(({ category, reason }) => (
                <div
                  key={category}
                  className="flex items-start gap-2 text-xs py-1"
                >
                  <span className="text-red-400 shrink-0">❌</span>
                  <span className="text-slate-400">
                    <span className="text-slate-300">{category}</span>
                    <span className="text-slate-600"> — </span>
                    {reason}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default OpportunitySummary;
