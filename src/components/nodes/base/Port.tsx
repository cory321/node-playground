import React from 'react';
import { PortType, HoveredPort } from '@/types/nodes';

interface PortProps {
  nodeId: string;
  type: PortType;
  isConnected: boolean;
  hoveredPort: HoveredPort | null;
  setHoveredPort: (port: HoveredPort | null) => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
  isActive?: boolean;
  color?: string;
}

const PORT_COLORS = {
  default: {
    in: { border: 'border-slate-700', bg: 'bg-slate-700' },
    out: { border: 'border-slate-700', bg: 'bg-slate-700' },
  },
  connected: {
    in: { border: 'border-purple-500', bg: 'bg-purple-500' },
    out: { border: 'border-indigo-500', bg: 'bg-indigo-500' },
  },
  hovered: {
    in: { border: 'border-indigo-400', bg: 'bg-indigo-400' },
    out: { border: 'border-indigo-400', bg: 'bg-indigo-400' },
  },
  active: {
    in: { border: 'border-indigo-400', bg: 'bg-indigo-400' },
    out: { border: 'border-indigo-400', bg: 'bg-indigo-400' },
  },
};

export function Port({
  nodeId,
  type,
  isConnected,
  hoveredPort,
  setHoveredPort,
  onMouseDown,
  onMouseUp,
  isActive = false,
  color,
}: PortProps) {
  const isHovered = hoveredPort?.nodeId === nodeId && hoveredPort?.type === type;
  const position = type === 'in' ? '-left-3' : '-right-3';

  // Determine colors
  let colors = PORT_COLORS.default[type];
  if (isActive) {
    colors = PORT_COLORS.active[type];
  } else if (isHovered) {
    colors = PORT_COLORS.hovered[type];
  } else if (isConnected) {
    colors = PORT_COLORS.connected[type];
  }

  // Custom color override for connected state
  const borderColor = isConnected && color ? `border-[${color}]` : colors.border;
  const bgColor = isConnected && color ? `bg-[${color}]` : colors.bg;

  return (
    <div
      className={`absolute ${position} top-14 w-6 h-6 bg-[#020617] border-2 rounded-full cursor-crosshair z-20 transition-all flex items-center justify-center
        ${colors.border}
        ${isHovered ? 'scale-150 shadow-[0_0_15px_rgba(99,102,241,0.6)]' : ''}
        ${isActive ? 'scale-125' : ''}
      `}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onMouseEnter={() => setHoveredPort({ nodeId, type })}
      onMouseLeave={() => setHoveredPort(null)}
    >
      <div className={`w-2 h-2 rounded-full transition-colors ${colors.bg}`} />
    </div>
  );
}

export default Port;
