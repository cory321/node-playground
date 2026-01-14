import React from 'react';
import { Brain } from 'lucide-react';

export function EmptyState() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="text-center space-y-4 animate-in fade-in zoom-in duration-700">
        <div className="w-20 h-20 mx-auto border-2 border-indigo-500/20 rounded-full flex items-center justify-center animate-pulse">
          <Brain size={40} className="text-indigo-500/40" />
        </div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent uppercase tracking-widest">
          AI Chain Builder
        </h2>
        <p className="text-slate-600 font-mono text-[10px] uppercase tracking-[0.2em]">
          Add an LLM node to start building
        </p>
      </div>
    </div>
  );
}

export default EmptyState;
