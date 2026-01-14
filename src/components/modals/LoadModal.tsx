import React from 'react';
import { FolderOpen, Trash2 } from 'lucide-react';
import { Modal } from './Modal';
import { SavedSetup } from '@/types/api';

interface LoadModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedSetups: SavedSetup[];
  onLoad: (setup: SavedSetup) => void;
  onDelete: (id: string) => void;
}

export function LoadModal({
  isOpen,
  onClose,
  savedSetups,
  onLoad,
  onDelete,
}: LoadModalProps) {
  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(id);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Load Setup"
      icon={<FolderOpen size={20} className="text-cyan-400" />}
      iconBgColor="bg-cyan-500/20"
      shadowColor="shadow-cyan-500/10"
    >
      {savedSetups.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 border-2 border-slate-700/50 rounded-full flex items-center justify-center">
            <FolderOpen size={28} className="text-slate-600" />
          </div>
          <p className="text-slate-500 text-sm mb-1">No saved setups yet</p>
          <p className="text-slate-600 text-[10px] font-mono uppercase tracking-[0.2em]">
            Save your current setup to get started
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
                  className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 rounded-lg transition-all text-slate-500 hover:text-red-400"
                >
                  <Trash2 size={14} />
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
