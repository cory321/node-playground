import React, { useState } from 'react';
import { Save, Loader2, Cloud, CloudOff, AlertCircle } from 'lucide-react';
import { Modal } from './Modal';

interface SaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => Promise<boolean>;
  nodeCount: number;
  connectionCount: number;
  isSaving?: boolean;
  error?: string | null;
  hasCloudStorage?: boolean;
}

export function SaveModal({
  isOpen,
  onClose,
  onSave,
  nodeCount,
  connectionCount,
  isSaving = false,
  error = null,
  hasCloudStorage = true,
}: SaveModalProps) {
  const [saveName, setSaveName] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!saveName.trim() || isSaving) return;

    setLocalError(null);
    const success = await onSave(saveName.trim());

    if (success) {
      setSaveName('');
      onClose();
    } else {
      setLocalError('Failed to save project. Please try again.');
    }
  };

  const displayError = error || localError;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Save Project"
      icon={<Save size={20} className="text-emerald-400" />}
      iconBgColor="bg-emerald-500/20"
      shadowColor="shadow-emerald-500/10"
    >
      <div className="space-y-4">
        {/* Cloud Status */}
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em]">
          {hasCloudStorage ? (
            <>
              <Cloud size={12} className="text-emerald-400" />
              <span className="text-emerald-400">Cloud Storage Connected</span>
            </>
          ) : (
            <>
              <CloudOff size={12} className="text-amber-400" />
              <span className="text-amber-400">Cloud Storage Not Configured</span>
            </>
          )}
        </div>

        {/* Error Display */}
        {displayError && (
          <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
            <AlertCircle size={14} className="text-red-400 shrink-0" />
            <span className="text-xs text-red-300">{displayError}</span>
          </div>
        )}

        <div>
          <label className="block text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-2">
            Project Name
          </label>
          <input
            type="text"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            placeholder="My Research Project..."
            autoFocus
            disabled={isSaving || !hasCloudStorage}
            className="w-full bg-slate-950/60 border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
          disabled={!saveName.trim() || isSaving || !hasCloudStorage}
          className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed rounded-xl text-sm font-semibold uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 disabled:shadow-none flex items-center justify-center gap-2"
        >
          {isSaving ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Cloud size={16} />
              Save to Cloud
            </>
          )}
        </button>
      </div>
    </Modal>
  );
}

export default SaveModal;
