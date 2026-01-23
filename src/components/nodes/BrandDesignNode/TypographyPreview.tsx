import React from 'react';
import { Type } from 'lucide-react';
import { Typography } from '@/types/brandDesign';

interface TypographyPreviewProps {
  typography: Typography;
}

export function TypographyPreview({ typography }: TypographyPreviewProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* Font Families */}
      <div className="flex flex-col gap-1">
        <span className="text-[9px] uppercase tracking-wider text-slate-500">Font Families</span>
        <div className="flex flex-col gap-1.5">
          {typography.fontFamily.heading && (
            <div className="flex items-center gap-2 px-2 py-1.5 bg-slate-800/50 rounded-lg">
              <Type size={12} className="text-indigo-400" />
              <div className="flex flex-col">
                <span className="text-xs text-slate-200 font-medium">
                  {typography.fontFamily.heading.name}
                </span>
                <span className="text-[9px] text-slate-500">
                  Headings · {typography.fontFamily.heading.category}
                </span>
              </div>
            </div>
          )}
          {typography.fontFamily.body && (
            <div className="flex items-center gap-2 px-2 py-1.5 bg-slate-800/50 rounded-lg">
              <Type size={12} className="text-slate-400" />
              <div className="flex flex-col">
                <span className="text-xs text-slate-200 font-medium">
                  {typography.fontFamily.body.name}
                </span>
                <span className="text-[9px] text-slate-500">
                  Body · {typography.fontFamily.body.category}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Type Scale */}
      {typography.scale && (
        <div className="flex flex-col gap-1">
          <span className="text-[9px] uppercase tracking-wider text-slate-500">Type Scale</span>
          <div className="grid grid-cols-2 gap-1">
            {typography.scale.h1 && (
              <div className="flex items-baseline gap-1.5 px-2 py-1 bg-slate-800/30 rounded">
                <span className="text-[10px] text-slate-500">H1</span>
                <span className="text-xs text-slate-300 font-mono">{typography.scale.h1}</span>
              </div>
            )}
            {typography.scale.h2 && (
              <div className="flex items-baseline gap-1.5 px-2 py-1 bg-slate-800/30 rounded">
                <span className="text-[10px] text-slate-500">H2</span>
                <span className="text-xs text-slate-300 font-mono">{typography.scale.h2}</span>
              </div>
            )}
            {typography.scale.h3 && (
              <div className="flex items-baseline gap-1.5 px-2 py-1 bg-slate-800/30 rounded">
                <span className="text-[10px] text-slate-500">H3</span>
                <span className="text-xs text-slate-300 font-mono">{typography.scale.h3}</span>
              </div>
            )}
            {typography.scale.body && (
              <div className="flex items-baseline gap-1.5 px-2 py-1 bg-slate-800/30 rounded">
                <span className="text-[10px] text-slate-500">Body</span>
                <span className="text-xs text-slate-300 font-mono">{typography.scale.body}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
