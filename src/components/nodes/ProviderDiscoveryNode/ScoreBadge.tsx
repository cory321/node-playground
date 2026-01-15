import React from 'react';
import { ProviderPriority } from '@/types/nodes';

interface ScoreBadgeProps {
  priority: ProviderPriority;
  score: number;
  showScore?: boolean;
}

const PRIORITY_CONFIG: Record<
  ProviderPriority,
  { label: string; bg: string; text: string; border: string }
> = {
  P1: {
    label: 'Hot',
    bg: 'bg-emerald-500/20',
    text: 'text-emerald-300',
    border: 'border-emerald-500/30',
  },
  P2: {
    label: 'Warm',
    bg: 'bg-amber-500/20',
    text: 'text-amber-300',
    border: 'border-amber-500/30',
  },
  P3: {
    label: 'Maybe',
    bg: 'bg-slate-600/50',
    text: 'text-slate-300',
    border: 'border-slate-500/30',
  },
  P4: {
    label: 'Cold',
    bg: 'bg-slate-700/50',
    text: 'text-slate-400',
    border: 'border-slate-600/30',
  },
  skip: {
    label: 'Skip',
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    border: 'border-red-500/20',
  },
};

export function ScoreBadge({ priority, score, showScore = false }: ScoreBadgeProps) {
  const config = PRIORITY_CONFIG[priority];

  return (
    <div
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border ${config.bg} ${config.border}`}
    >
      <span className={`text-[10px] font-bold ${config.text}`}>
        {priority}
      </span>
      {showScore && (
        <span className={`text-[9px] ${config.text} opacity-70`}>
          {score}/25
        </span>
      )}
    </div>
  );
}

export default ScoreBadge;
