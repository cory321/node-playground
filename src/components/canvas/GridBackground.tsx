import React from 'react';
import { CANVAS_CONSTANTS } from '@/types/canvas';

interface GridBackgroundProps {
  transform: {
    x: number;
    y: number;
    scale: number;
  };
}

export function GridBackground({ transform }: GridBackgroundProps) {
  const gridSize = CANVAS_CONSTANTS.GRID_SIZE;
  
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: `
          radial-gradient(circle at 1px 1px, #1e293b 1px, transparent 0),
          linear-gradient(to right, #0f172a11 1px, transparent 1px),
          linear-gradient(to bottom, #0f172a11 1px, transparent 1px)
        `,
        backgroundSize: `
          ${gridSize * transform.scale}px ${gridSize * transform.scale}px,
          ${gridSize * 5 * transform.scale}px ${gridSize * 5 * transform.scale}px,
          ${gridSize * 5 * transform.scale}px ${gridSize * 5 * transform.scale}px
        `,
        backgroundPosition: `${transform.x}px ${transform.y}px`,
      }}
    />
  );
}

export default GridBackground;
