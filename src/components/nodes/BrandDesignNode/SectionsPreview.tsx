import React from 'react';
import { Layers } from 'lucide-react';
import { SectionStyle } from '@/types/brandDesign';

interface SectionsPreviewProps {
  sections: SectionStyle[];
}

export function SectionsPreview({ sections }: SectionsPreviewProps) {
  if (!sections || sections.length === 0) {
    return (
      <div className="flex items-center gap-2 text-slate-500 text-xs">
        <Layers size={12} />
        <span>No sections detected</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[9px] uppercase tracking-wider text-slate-500">
          Page Sections ({sections.length})
        </span>
      </div>
      <div className="flex flex-col gap-1 max-h-32 overflow-y-auto scrollbar-hide">
        {sections.sort((a, b) => a.index - b.index).map((section, i) => (
          <div
            key={i}
            className="flex items-center gap-2 px-2 py-1.5 bg-slate-800/40 rounded-lg"
          >
            {/* Section color indicator */}
            <div
              className="w-3 h-3 rounded shrink-0 border border-white/10"
              style={{ backgroundColor: section.background }}
            />
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs text-slate-200 truncate">{section.name}</span>
              {section.layout && (
                <span className="text-[9px] text-slate-500 truncate">{section.layout}</span>
              )}
            </div>
            <span className="text-[9px] text-slate-600">#{section.index + 1}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
