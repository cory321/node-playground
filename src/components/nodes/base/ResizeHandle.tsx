import React from 'react';

interface ResizeHandleProps {
  onMouseDown: (e: React.MouseEvent) => void;
  hoverColor?: string;
}

export function ResizeHandle({ onMouseDown, hoverColor = 'hover:text-indigo-400' }: ResizeHandleProps) {
  return (
    <div
      className={`absolute -right-1 -bottom-1 w-5 h-5 cursor-nwse-resize z-30 flex items-end justify-end p-1 text-slate-600 ${hoverColor} transition-colors`}
      onMouseDown={onMouseDown}
    >
      <div className="w-2 h-2 border-r-2 border-b-2 border-current" />
    </div>
  );
}

export default ResizeHandle;
