import React from 'react';
import {
  Brain,
  Monitor,
  MapPin,
  Search,
  Layers,
  Users,
  Settings,
  Save,
  FolderOpen,
  Download,
  Upload,
  BarChart3,
} from 'lucide-react';
import { ToolbarButton } from './ToolbarButton';

interface ToolbarProps {
  onAddLLMNode: () => void;
  onAddOutputNode: () => void;
  onAddLocationNode: () => void;
  onAddResearchNode: () => void;
  onAddCategorySelectorNode: () => void;
  onAddProviderNode: () => void;
  onOpenSettings: () => void;
  onOpenSave: () => void;
  onOpenLoad: () => void;
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onToggleCompare?: () => void;
  comparisonCount?: number;
  nodeCount: number;
  connectionCount: number;
}

export function Toolbar({
  onAddLLMNode,
  onAddOutputNode,
  onAddLocationNode,
  onAddResearchNode,
  onAddCategorySelectorNode,
  onAddProviderNode,
  onOpenSettings,
  onOpenSave,
  onOpenLoad,
  onExport,
  onImport,
  onToggleCompare,
  comparisonCount = 0,
  nodeCount,
  connectionCount,
}: ToolbarProps) {
  return (
    <div className="fixed top-6 left-6 z-50 flex flex-col gap-4">
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 p-2 rounded-2xl flex items-center gap-2 shadow-2xl relative z-10">
        {/* Add LLM Node */}
        <ToolbarButton
          onClick={onAddLLMNode}
          icon={<Brain size={20} />}
          label="Add LLM Node"
          className="bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/20"
        />

        {/* Add Output Node */}
        <ToolbarButton
          onClick={onAddOutputNode}
          icon={<Monitor size={20} />}
          label="Add Output Node"
          className="bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-500/20"
        />

        {/* Add Location Node */}
        <ToolbarButton
          onClick={onAddLocationNode}
          icon={<MapPin size={20} />}
          label="Add Location Node"
          className="bg-sky-600 hover:bg-sky-500 shadow-lg shadow-sky-500/20"
        />

        {/* Add Research Node */}
        <ToolbarButton
          onClick={onAddResearchNode}
          icon={<Search size={20} />}
          label="Add Research Node"
          className="bg-orange-600 hover:bg-orange-500 shadow-lg shadow-orange-500/20"
        />

        {/* Add Category Selector Node */}
        <ToolbarButton
          onClick={onAddCategorySelectorNode}
          icon={<Layers size={20} />}
          label="Add Category Selector"
          className="bg-violet-600 hover:bg-violet-500 shadow-lg shadow-violet-500/20"
        />

        {/* Add Provider Discovery Node */}
        <ToolbarButton
          onClick={onAddProviderNode}
          icon={<Users size={20} />}
          label="Add Provider Discovery"
          className="bg-teal-600 hover:bg-teal-500 shadow-lg shadow-teal-500/20"
        />

        <div className="h-6 w-px bg-slate-700 mx-1" />

        {/* Compare Locations */}
        {onToggleCompare && (
          <div className="relative">
            <ToolbarButton
              onClick={onToggleCompare}
              icon={<BarChart3 size={20} />}
              label="Compare Locations"
              className="hover:text-amber-400"
            />
            {comparisonCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-amber-500 text-slate-900 text-[10px] font-bold rounded-full flex items-center justify-center">
                {comparisonCount}
              </span>
            )}
          </div>
        )}

        {/* Settings */}
        <ToolbarButton
          onClick={onOpenSettings}
          icon={<Settings size={20} />}
          label="API Settings"
          className="hover:text-violet-400"
        />

        <div className="h-6 w-px bg-slate-700 mx-1" />

        {/* Save */}
        <ToolbarButton
          onClick={onOpenSave}
          icon={<Save size={20} />}
          label="Save Setup"
          className="hover:text-emerald-400"
        />

        {/* Load */}
        <ToolbarButton
          onClick={onOpenLoad}
          icon={<FolderOpen size={20} />}
          label="Load Setup"
          className="hover:text-cyan-400"
        />

        <div className="h-6 w-px bg-slate-700 mx-1" />

        {/* Export */}
        <ToolbarButton
          onClick={onExport}
          icon={<Download size={20} />}
          label="Export"
          className="hover:text-purple-400"
        />

        {/* Import */}
        <label className="p-3 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-amber-400 cursor-pointer group relative">
          <Upload size={20} />
          <input
            type="file"
            accept=".json"
            onChange={onImport}
            className="hidden"
          />
          <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 z-10 bg-slate-900 text-[10px] px-2 py-1 rounded border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none uppercase tracking-tighter whitespace-nowrap">
            Import
          </span>
        </label>
      </div>

      {/* Status Bar */}
      <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800/50 px-4 py-2 rounded-xl text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em]">
        NET_OS // NODES: {nodeCount.toString().padStart(2, '0')} // LINKS:{' '}
        {connectionCount.toString().padStart(2, '0')}
      </div>
    </div>
  );
}

export default Toolbar;
