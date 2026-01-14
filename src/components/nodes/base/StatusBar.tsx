import React from 'react';
import { NodeStatus } from '@/types/nodes';

interface StatusBarProps {
  status?: NodeStatus;
  color?: string;
  hasContent?: boolean;
  progress?: number;
}

export function StatusBar({
  status = 'idle',
  color = '#6366f1',
  hasContent = false,
  progress = 30,
}: StatusBarProps) {
  if (status === 'loading') {
    return (
      <div className="h-1.5 w-full bg-slate-800/50 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 animate-[shimmer_1.5s_linear_infinite]"
          style={{
            backgroundSize: '200% 100%',
          }}
        />
        <style>{`
          @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}</style>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="h-1.5 w-full bg-slate-800/50">
        <div className="h-full w-full bg-red-500/60" />
      </div>
    );
  }

  if (status === 'success' || hasContent) {
    return (
      <div className="h-1.5 w-full bg-slate-800/50">
        <div className="h-full w-full bg-emerald-500/60" />
      </div>
    );
  }

  // Idle state
  return (
    <div className="h-1.5 w-full bg-slate-800/50">
      <div
        className="h-full bg-indigo-500/40"
        style={{ width: `${progress}%`, backgroundColor: color }}
      />
    </div>
  );
}

export default StatusBar;
