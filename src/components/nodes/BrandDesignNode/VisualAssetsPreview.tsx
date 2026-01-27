import React from 'react';
import { Camera, Shapes, Box, FileText } from 'lucide-react';
import { VisualAssets } from '@/types/brandDesign';

interface VisualAssetsPreviewProps {
  visualAssets: VisualAssets;
}

export function VisualAssetsPreview({ visualAssets }: VisualAssetsPreviewProps) {
  const { photography, graphics, icons } = visualAssets;

  return (
    <div className="flex flex-col gap-4 max-h-[280px] overflow-y-auto pr-1">
      {/* Photography Style */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5">
          <Camera size={11} className="text-indigo-400" />
          <span className="text-[9px] uppercase tracking-wider text-slate-400">
            Photography Style
          </span>
        </div>
        
        <div className="p-2 bg-slate-800/50 rounded-lg space-y-2">
          {/* Mood & Lighting */}
          <div className="flex flex-wrap gap-1">
            <span className="px-1.5 py-0.5 text-[9px] bg-indigo-500/20 text-indigo-300 rounded">
              {photography.mood}
            </span>
            {photography.lighting.slice(0, 2).map((light, i) => (
              <span
                key={i}
                className="px-1.5 py-0.5 text-[9px] bg-slate-700 text-slate-300 rounded"
              >
                {light}
              </span>
            ))}
          </div>
          
          {/* Subject Matter */}
          <div className="flex flex-wrap gap-1">
            {photography.subjectMatter.slice(0, 4).map((subject, i) => (
              <span
                key={i}
                className="px-1.5 py-0.5 text-[9px] bg-emerald-500/20 text-emerald-300 rounded"
              >
                {subject}
              </span>
            ))}
          </div>
          
          {/* Description */}
          <div className="flex items-start gap-1.5 pt-1 border-t border-slate-700/50">
            <FileText size={10} className="text-slate-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-slate-400 leading-relaxed line-clamp-3">
              {photography.description}
            </p>
          </div>
        </div>
      </div>

      {/* Graphics Style */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5">
          <Shapes size={11} className="text-violet-400" />
          <span className="text-[9px] uppercase tracking-wider text-slate-400">
            Graphics & Illustrations
          </span>
        </div>
        
        <div className="p-2 bg-slate-800/50 rounded-lg space-y-2">
          {/* Style & Mood */}
          <div className="flex flex-wrap gap-1">
            <span className="px-1.5 py-0.5 text-[9px] bg-violet-500/20 text-violet-300 rounded">
              {graphics.illustrationStyle}
            </span>
            <span className="px-1.5 py-0.5 text-[9px] bg-slate-700 text-slate-300 rounded">
              {graphics.mood}
            </span>
          </div>
          
          {/* Patterns & Elements */}
          <div className="flex flex-wrap gap-1">
            {graphics.patterns.slice(0, 2).map((pattern, i) => (
              <span
                key={i}
                className="px-1.5 py-0.5 text-[9px] bg-amber-500/20 text-amber-300 rounded"
              >
                {pattern}
              </span>
            ))}
            {graphics.decorativeElements.slice(0, 2).map((elem, i) => (
              <span
                key={i}
                className="px-1.5 py-0.5 text-[9px] bg-slate-700 text-slate-300 rounded"
              >
                {elem}
              </span>
            ))}
          </div>
          
          {/* Description */}
          <div className="flex items-start gap-1.5 pt-1 border-t border-slate-700/50">
            <FileText size={10} className="text-slate-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-slate-400 leading-relaxed line-clamp-3">
              {graphics.description}
            </p>
          </div>
        </div>
      </div>

      {/* Icon Style */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5">
          <Box size={11} className="text-cyan-400" />
          <span className="text-[9px] uppercase tracking-wider text-slate-400">
            Icon Style
          </span>
        </div>
        
        <div className="p-2 bg-slate-800/50 rounded-lg">
          <div className="flex flex-wrap gap-1.5">
            <span className="px-1.5 py-0.5 text-[9px] bg-cyan-500/20 text-cyan-300 rounded capitalize">
              {icons.style}
            </span>
            <span className="px-1.5 py-0.5 text-[9px] bg-slate-700 text-slate-300 rounded">
              {icons.strokeWeight} stroke
            </span>
            <span className="px-1.5 py-0.5 text-[9px] bg-slate-700 text-slate-300 rounded capitalize">
              {icons.cornerStyle} corners
            </span>
            <span className="px-1.5 py-0.5 text-[9px] bg-emerald-500/20 text-emerald-300 rounded">
              {icons.suggestedLibrary}
            </span>
          </div>
          
          {icons.description && (
            <p className="text-[10px] text-slate-500 mt-2">
              {icons.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
