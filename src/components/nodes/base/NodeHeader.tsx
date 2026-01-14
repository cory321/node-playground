import React, { ReactNode } from 'react';
import { Trash2, Edit2, Check } from 'lucide-react';

interface NodeHeaderProps {
  title: string;
  color: string;
  nodeId: string;
  icon?: ReactNode;
  isEditing: boolean;
  onTitleChange: (title: string) => void;
  onEditStart: () => void;
  onEditEnd: () => void;
  onDelete: () => void;
  onMouseDown: (e: React.MouseEvent) => void;
}

export function NodeHeader({
  title,
  color,
  icon,
  isEditing,
  onTitleChange,
  onEditStart,
  onEditEnd,
  onDelete,
  onMouseDown,
}: NodeHeaderProps) {
  return (
    <div
      className="p-4 flex items-center justify-between cursor-move active:cursor-grabbing border-b border-slate-700/30"
      style={{ backgroundColor: `${color}15` }}
      onMouseDown={onMouseDown}
      onDoubleClick={onEditStart}
    >
      <div className="flex items-center gap-3 overflow-hidden flex-1 mr-2">
        {icon && (
          <div
            className="p-1.5 rounded-lg"
            style={{ backgroundColor: `${color}30` }}
          >
            {icon}
          </div>
        )}
        {isEditing ? (
          <input
            autoFocus
            value={title}
            onBlur={onEditEnd}
            onKeyDown={(e) => e.key === 'Enter' && onEditEnd()}
            onChange={(e) => onTitleChange(e.target.value)}
            className="bg-slate-950 border border-indigo-500/50 rounded px-1 text-xs font-semibold w-full outline-none text-indigo-100"
          />
        ) : (
          <span className="font-semibold text-xs tracking-wide text-slate-100 uppercase truncate">
            {title}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={isEditing ? onEditEnd : onEditStart}
          className="p-1 hover:text-indigo-400 transition-colors"
        >
          {isEditing ? <Check size={14} /> : <Edit2 size={14} />}
        </button>
        <button
          onClick={onDelete}
          className="p-1 hover:text-red-400 transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

export default NodeHeader;
