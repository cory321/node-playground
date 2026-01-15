import React from 'react';

interface SerpBadgeProps {
  quality: 'Weak' | 'Medium' | 'Strong';
  showLabel?: boolean;
}

/**
 * SERP Quality Badge
 * - Weak (emerald/green) = Good opportunity, weak competition
 * - Medium (amber/yellow) = Possible opportunity
 * - Strong (red) = Tough competition, hard to rank
 */
export function SerpBadge({ quality, showLabel = true }: SerpBadgeProps) {
  const config = {
    Weak: {
      bg: 'bg-emerald-500/20',
      border: 'border-emerald-500/30',
      text: 'text-emerald-300',
      label: 'Weak',
    },
    Medium: {
      bg: 'bg-amber-500/20',
      border: 'border-amber-500/30',
      text: 'text-amber-300',
      label: 'Medium',
    },
    Strong: {
      bg: 'bg-red-500/20',
      border: 'border-red-500/30',
      text: 'text-red-300',
      label: 'Strong',
    },
  };

  const { bg, border, text, label } = config[quality];

  return (
    <span
      className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${bg} ${border} ${text}`}
    >
      {showLabel ? label : quality.charAt(0)}
    </span>
  );
}

export default SerpBadge;
