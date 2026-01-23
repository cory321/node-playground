import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { ColorPalette, ColorToken } from '@/types/brandDesign';

interface ColorPalettePreviewProps {
  colors: ColorPalette;
}

interface ColorSwatchProps {
  color: string | ColorToken;
  label: string;
  size?: 'sm' | 'md';
}

function ColorSwatch({ color, label, size = 'sm' }: ColorSwatchProps) {
  const [copied, setCopied] = useState(false);
  const hex = typeof color === 'string' ? color : color.hex;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(hex);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      onClick={handleCopy}
      className={`group relative flex flex-col items-center gap-1 transition-transform hover:scale-105 ${
        size === 'md' ? 'w-12' : 'w-8'
      }`}
      title={`${label}: ${hex} (click to copy)`}
    >
      <div
        className={`${size === 'md' ? 'w-10 h-10' : 'w-7 h-7'} rounded-lg border border-white/10 shadow-sm transition-all group-hover:shadow-md`}
        style={{ backgroundColor: hex }}
      />
      {copied ? (
        <Check size={10} className="text-emerald-400" />
      ) : (
        <span className="text-[8px] text-slate-500 truncate max-w-full">{label}</span>
      )}
    </button>
  );
}

export function ColorPalettePreview({ colors }: ColorPalettePreviewProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* Primary Colors Row */}
      <div className="flex flex-col gap-1">
        <span className="text-[9px] uppercase tracking-wider text-slate-500">Brand Colors</span>
        <div className="flex gap-2">
          {colors.primary && (
            <ColorSwatch color={colors.primary} label="Primary" size="md" />
          )}
          {colors.secondary && (
            <ColorSwatch color={colors.secondary} label="Secondary" size="md" />
          )}
          {colors.accent && (
            <ColorSwatch color={colors.accent} label="Accent" size="md" />
          )}
        </div>
      </div>

      {/* Backgrounds Row */}
      {colors.backgrounds && (
        <div className="flex flex-col gap-1">
          <span className="text-[9px] uppercase tracking-wider text-slate-500">Backgrounds</span>
          <div className="flex gap-2">
            {colors.backgrounds.main && (
              <ColorSwatch color={colors.backgrounds.main} label="Main" />
            )}
            {colors.backgrounds.section && (
              <ColorSwatch color={colors.backgrounds.section} label="Section" />
            )}
            {colors.backgrounds.card && (
              <ColorSwatch color={colors.backgrounds.card} label="Card" />
            )}
            {colors.backgrounds.footer && (
              <ColorSwatch color={colors.backgrounds.footer} label="Footer" />
            )}
          </div>
        </div>
      )}

      {/* Text Colors Row */}
      {colors.text && (
        <div className="flex flex-col gap-1">
          <span className="text-[9px] uppercase tracking-wider text-slate-500">Text</span>
          <div className="flex gap-2">
            {colors.text.primary && (
              <ColorSwatch color={colors.text.primary} label="Primary" />
            )}
            {colors.text.secondary && (
              <ColorSwatch color={colors.text.secondary} label="Secondary" />
            )}
            {colors.text.muted && (
              <ColorSwatch color={colors.text.muted} label="Muted" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
