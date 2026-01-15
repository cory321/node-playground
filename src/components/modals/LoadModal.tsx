import React, { useState } from 'react';
import { FolderOpen, Trash2, Loader2, Cloud, CloudOff, AlertCircle, RefreshCw } from 'lucide-react';
import { Modal } from './Modal';
import { SavedSetup } from '@/types/api';

interface LoadModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedSetups: SavedSetup[];
  onLoad: (setup: SavedSetup) => void;
  onDelete: (id: string) => Promise<boolean>;
  onRefresh?: () => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
  hasCloudStorage?: boolean;
}

export function LoadModal({
  isOpen,
  onClose,
  savedSetups,
  onLoad,
  onDelete,
  onRefresh,
  isLoading = false,
  error = null,
  hasCloudStorage = true,
}: LoadModalProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(id);
    await onDelete(id);
    setDeletingId(null);
  };

  const handleRefresh = async () => {
    if (onRefresh) {
      await onRefresh();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Load Project"
      icon={<FolderOpen size={20} className="text-cyan-400" />}
      iconBgColor="bg-cyan-500/20"
      shadowColor="shadow-cyan-500/10"
    >
      {/* Cloud Status Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em]">
          {hasCloudStorage ? (
            <>
              <Cloud size={12} className="text-cyan-400" />
              <span className="text-cyan-400">Cloud Storage</span>
            </>
          ) : (
            <>
              <CloudOff size={12} className="text-amber-400" />
              <span className="text-amber-400">Not Connected</span>
            </>
          )}
        </div>
        {onRefresh && hasCloudStorage && (
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-1.5 hover:bg-slate-800/50 rounded-lg transition-colors text-slate-500 hover:text-cyan-400 disabled:opacity-50"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-2 px-3 py-2 mb-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <AlertCircle size={14} className="text-red-400 shrink-0" />
          <span className="text-xs text-red-300">{error}</span>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 border-2 border-slate-700/50 rounded-full flex items-center justify-center">
            <Loader2 size={28} className="text-cyan-400 animate-spin" />
          </div>
          <p className="text-slate-500 text-sm mb-1">Loading projects...</p>
          <p className="text-slate-600 text-[10px] font-mono uppercase tracking-[0.2em]">
            Fetching from cloud storage
          </p>
        </div>
      ) : !hasCloudStorage ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 border-2 border-amber-500/30 rounded-full flex items-center justify-center">
            <CloudOff size={28} className="text-amber-500" />
          </div>
          <p className="text-amber-400 text-sm mb-1">Cloud Storage Not Configured</p>
          <p className="text-slate-600 text-[10px] font-mono uppercase tracking-[0.2em]">
            Add Supabase credentials to .env to enable
          </p>
        </div>
      ) : savedSetups.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 border-2 border-slate-700/50 rounded-full flex items-center justify-center">
            <FolderOpen size={28} className="text-slate-600" />
          </div>
          <p className="text-slate-500 text-sm mb-1">No saved projects yet</p>
          <p className="text-slate-600 text-[10px] font-mono uppercase tracking-[0.2em]">
            Save your current project to get started
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1 scrollbar-hide">
          {savedSetups.map((setup) => (
            <div
              key={setup.id}
              onClick={() => {
                onLoad(setup);
                onClose();
              }}
              className="group bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/30 hover:border-cyan-500/30 rounded-xl p-4 cursor-pointer transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-200 truncate group-hover:text-cyan-300 transition-colors">
                    {setup.name}
                  </h3>
                  <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-500 font-mono uppercase tracking-wider">
                    <span className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                      {setup.nodes.length} Nodes
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                      {setup.connections.length} Links
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-600 mt-2">
                    {new Date(setup.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <button
                  onClick={(e) => handleDelete(setup.id, e)}
                  disabled={deletingId === setup.id}
                  className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 rounded-lg transition-all text-slate-500 hover:text-red-400 disabled:opacity-50"
                >
                  {deletingId === setup.id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

export default LoadModal;
