import React from 'react';
import { HoveredPort } from '@/types/nodes';

interface PortConfig {
  id: string;
  label: string;
  yOffset: number; // Y offset from top of node
}

interface MultiPortProps {
  nodeId: string;
  ports: PortConfig[];
  connectedPorts: Set<string>;
  hoveredPort: HoveredPort | null;
  setHoveredPort: (port: HoveredPort | null) => void;
  onPortMouseDown: (e: React.MouseEvent, portId: string) => void;
  onPortMouseUp: (portId: string) => void;
  isActive: boolean; // True when any connection is being dragged
}

// Port colors for multi-port (using violet theme for Category Selector)
const PORT_COLORS = {
  default: { border: 'border-slate-700', bg: 'bg-slate-700' },
  connected: { border: 'border-violet-500', bg: 'bg-violet-500' },
  hovered: { border: 'border-violet-400', bg: 'bg-violet-400' },
  active: { border: 'border-violet-400', bg: 'bg-violet-400' },
};

/**
 * MultiPort - Renders multiple output ports on the right edge of a node
 * Each port is positioned at a specific Y offset to align with content rows
 */
export function MultiPort({
  nodeId,
  ports,
  connectedPorts,
  hoveredPort,
  setHoveredPort,
  onPortMouseDown,
  onPortMouseUp,
  isActive,
}: MultiPortProps) {
  return (
    <>
      {ports.map((port) => {
        const isConnected = connectedPorts.has(port.id);
        const isHovered = 
          hoveredPort?.nodeId === nodeId && 
          hoveredPort?.type === 'out' && 
          hoveredPort?.portId === port.id;

        // Determine colors based on state
        let colors = PORT_COLORS.default;
        if (isActive) {
          colors = PORT_COLORS.active;
        } else if (isHovered) {
          colors = PORT_COLORS.hovered;
        } else if (isConnected) {
          colors = PORT_COLORS.connected;
        }

        return (
          <div
            key={port.id}
            className={`absolute -right-3 w-6 h-6 bg-[#020617] border-2 rounded-full cursor-crosshair z-20 transition-all flex items-center justify-center
              ${colors.border}
              ${isHovered ? 'scale-150 shadow-[0_0_15px_rgba(139,92,246,0.6)]' : ''}
              ${isActive && !isHovered ? 'scale-110' : ''}
            `}
            style={{ top: port.yOffset }}
            onMouseDown={(e) => onPortMouseDown(e, port.id)}
            onMouseUp={() => onPortMouseUp(port.id)}
            onMouseEnter={() => setHoveredPort({ nodeId, type: 'out', portId: port.id })}
            onMouseLeave={() => setHoveredPort(null)}
            title={`Output: ${port.label}`}
          >
            <div className={`w-2 h-2 rounded-full transition-colors ${colors.bg}`} />
          </div>
        );
      })}
    </>
  );
}

export default MultiPort;
