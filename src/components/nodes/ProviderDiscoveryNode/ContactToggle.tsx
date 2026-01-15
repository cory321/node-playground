import React from 'react';
import { Check, Circle } from 'lucide-react';

interface ContactToggleProps {
  contacted: boolean;
  onToggle: () => void;
}

export function ContactToggle({ contacted, onToggle }: ContactToggleProps) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={`w-5 h-5 rounded flex items-center justify-center transition-all ${
        contacted
          ? 'bg-teal-500/30 border border-teal-500/50 text-teal-300'
          : 'bg-slate-700/50 border border-slate-600/50 text-slate-500 hover:border-slate-500'
      }`}
      title={contacted ? 'Mark as not contacted' : 'Mark as contacted'}
    >
      {contacted ? <Check size={12} /> : <Circle size={8} />}
    </button>
  );
}

export default ContactToggle;
