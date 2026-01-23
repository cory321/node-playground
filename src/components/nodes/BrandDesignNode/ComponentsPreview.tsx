import React from 'react';
import { Square, RectangleHorizontal, Tag, TextCursorInput } from 'lucide-react';
import { ComponentStyles } from '@/types/brandDesign';

interface ComponentsPreviewProps {
  components: ComponentStyles;
}

export function ComponentsPreview({ components }: ComponentsPreviewProps) {
  const hasButtons = components.buttons?.primary;
  const hasCards = components.cards && components.cards.length > 0;
  const hasBadges = components.badges && components.badges.length > 0;
  const hasInputs = components.inputs;

  if (!hasButtons && !hasCards && !hasBadges && !hasInputs) {
    return (
      <div className="flex items-center gap-2 text-slate-500 text-xs">
        <Square size={12} />
        <span>No components detected</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Buttons Preview */}
      {hasButtons && (
        <div className="flex flex-col gap-1.5">
          <span className="text-[9px] uppercase tracking-wider text-slate-500">Buttons</span>
          <div className="flex gap-2 flex-wrap">
            {components.buttons.primary && (
              <div
                className="px-3 py-1.5 text-[10px] font-medium transition-transform hover:scale-105"
                style={{
                  backgroundColor: components.buttons.primary.background || '#3b82f6',
                  color: components.buttons.primary.textColor || '#ffffff',
                  borderRadius: components.buttons.primary.borderRadius || '0.375rem',
                  border: components.buttons.primary.border,
                  boxShadow: components.buttons.primary.shadow,
                }}
              >
                Primary
              </div>
            )}
            {components.buttons.secondary && (
              <div
                className="px-3 py-1.5 text-[10px] font-medium transition-transform hover:scale-105"
                style={{
                  backgroundColor: components.buttons.secondary.background || 'transparent',
                  color: components.buttons.secondary.textColor || '#3b82f6',
                  borderRadius: components.buttons.secondary.borderRadius || '0.375rem',
                  border: components.buttons.secondary.border || '1px solid currentColor',
                }}
              >
                Secondary
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cards Preview */}
      {hasCards && (
        <div className="flex flex-col gap-1.5">
          <span className="text-[9px] uppercase tracking-wider text-slate-500">
            Cards ({components.cards!.length})
          </span>
          <div className="flex gap-2">
            {components.cards!.slice(0, 2).map((card, i) => (
              <div
                key={i}
                className="w-16 h-10 flex items-center justify-center"
                style={{
                  backgroundColor: card.background || '#ffffff',
                  borderRadius: card.borderRadius || '0.5rem',
                  border: card.border,
                  boxShadow: card.shadow,
                }}
              >
                <RectangleHorizontal size={16} className="text-slate-400 opacity-50" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Badges Preview */}
      {hasBadges && (
        <div className="flex flex-col gap-1.5">
          <span className="text-[9px] uppercase tracking-wider text-slate-500">Badges</span>
          <div className="flex gap-1.5 flex-wrap">
            {components.badges!.slice(0, 3).map((badge, i) => (
              <span
                key={i}
                className="text-[9px] font-medium"
                style={{
                  backgroundColor: badge.background || '#e5e7eb',
                  color: badge.textColor || '#374151',
                  padding: badge.padding || '0.125rem 0.5rem',
                  borderRadius: badge.borderRadius || '9999px',
                }}
              >
                Badge {i + 1}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Input Preview */}
      {hasInputs && (
        <div className="flex flex-col gap-1.5">
          <span className="text-[9px] uppercase tracking-wider text-slate-500">Inputs</span>
          <div
            className="flex items-center gap-2 px-2 py-1.5 text-[10px] text-slate-400"
            style={{
              backgroundColor: components.inputs!.background || '#ffffff',
              border: components.inputs!.border || '1px solid #e5e7eb',
              borderRadius: components.inputs!.borderRadius || '0.375rem',
            }}
          >
            <TextCursorInput size={12} />
            <span>Input field...</span>
          </div>
        </div>
      )}
    </div>
  );
}
