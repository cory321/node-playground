import React, { ReactNode } from 'react';
import { Move } from 'lucide-react';

interface NodeFooterProps {
  x: number;
  y: number;
  width: number;
  height: number;
  extraContent?: ReactNode;
}

export function NodeFooter({ x, y, width, height, extraContent }: NodeFooterProps) {
  return (
    <div className="flex items-center justify-between text-[9px] text-slate-600 font-mono tracking-tighter shrink-0">
      <span className="flex items-center gap-1 uppercase">
        <Move size={10} /> {Math.round(x)}:{Math.round(y)}
      </span>
      {extraContent}
      <span className="uppercase">
        {width}x{height}
      </span>
    </div>
  );
}

export default NodeFooter;
