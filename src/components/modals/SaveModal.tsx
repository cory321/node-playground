import React, { useState } from 'react';
import { Save } from 'lucide-react';
import { Modal } from './Modal';

interface SaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  nodeCount: number;
  connectionCount: number;
}

export function SaveModal({
  isOpen,
  onClose,
  onSave,
  nodeCount,
  connectionCount,
}: SaveModalProps) {
  const [saveName, setSaveName] = useState('');

  const handleSave = () => {
    if (!saveName.trim()) return;
    onSave(saveName.trim());
    setSaveName('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Save Setup"
      icon={<Save size={20} className="text-emerald-400" />}
      iconBgColor="bg-emerald-500/20"
      shadowColor="shadow-emerald-500/10"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-2">
            Setup Name
          </label>
          <input
            type="text"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            placeholder="My Awesome Flow..."
            autoFocus
            className="w-full bg-slate-950/60 border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono uppercase tracking-wider">
          <span className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
            {nodeCount} Nodes
          </span>
          <span className="text-slate-700">•</span>
          <span className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
            {connectionCount} Links
          </span>
        </div>

        <button
          onClick={handleSave}
          disabled={!saveName.trim()}
          className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed rounded-xl text-sm font-semibold uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 disabled:shadow-none"
        >
          Save to Library
        </button>
      </div>
    </Modal>
  );
}

export default SaveModal;
