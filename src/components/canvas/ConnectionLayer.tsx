import React from 'react';
import { Connection } from '@/types/connections';
import { NodeData } from '@/types/nodes';
import { Point } from '@/types/canvas';
import { getConnectorPos, getConnectionPath } from '@/utils/geometry';

interface ConnectionLayerProps {
  connections: Connection[];
  nodes: NodeData[];
  connectingFrom: string | null;
  connectingTo: string | null;
  mousePos: Point;
}

export function ConnectionLayer({
  connections,
  nodes,
  connectingFrom,
  connectingTo,
  mousePos,
}: ConnectionLayerProps) {
  const getNode = (id: string) => nodes.find((n) => n.id === id);

  // Render a permanent connection with its own gradient
  const renderConnection = (fromId: string, toId: string, key: string, index: number) => {
    const fromNode = getNode(fromId);
    const toNode = getNode(toId);
    const start = getConnectorPos(fromNode, 'out');
    const end = getConnectorPos(toNode, 'in');
    const d = getConnectionPath(start, end);
    const gradientId = `gradLine-${index}`;

    // Add small offset to y2 when line is horizontal to prevent gradient collapse
    const isHorizontal = Math.abs(start.y - end.y) < 1;
    const y2Offset = isHorizontal ? 1 : 0;

    return (
      <g key={key}>
        {/* Per-connection gradient using actual coordinates */}
        <defs>
          <linearGradient
            id={gradientId}
            x1={start.x}
            y1={start.y}
            x2={end.x}
            y2={end.y + y2Offset}
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>
        {/* Glow effect */}
        <path
          d={d}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={6}
          strokeOpacity={0.15}
          strokeLinecap="round"
          className="blur-md"
        />
        {/* Main line */}
        <path
          d={d}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={3}
          strokeLinecap="round"
          className="drop-shadow-[0_0_8px_rgba(99,102,241,0.4)]"
        />
        {/* Animated highlight */}
        <path
          d={d}
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeDasharray="20, 100"
          strokeLinecap="round"
          className="animate-[pulse_3s_linear_infinite] opacity-60 mix-blend-overlay"
        />
      </g>
    );
  };

  // Render tentative connection from output (dragging forward)
  const renderTentativeConnection = (fromId: string) => {
    const fromNode = getNode(fromId);
    const start = getConnectorPos(fromNode, 'out');
    const d = getConnectionPath(start, mousePos);

    return (
      <g key="tentative">
        <path
          d={d}
          fill="none"
          stroke="#6366f1"
          strokeWidth={4}
          strokeOpacity={0.2}
          strokeLinecap="round"
          className="blur-md"
        />
        <path
          d={d}
          fill="none"
          stroke="#6366f1"
          strokeWidth={2}
          strokeDasharray="8,8"
          strokeLinecap="round"
          className="animate-[dash_1s_linear_infinite]"
        />
      </g>
    );
  };

  // Render reverse tentative connection (dragging backward from input)
  const renderReverseConnection = (toId: string) => {
    const toNode = getNode(toId);
    const end = getConnectorPos(toNode, 'in');
    const d = getConnectionPath(mousePos, end);

    return (
      <g key="tentative-reverse">
        <path
          d={d}
          fill="none"
          stroke="#a855f7"
          strokeWidth={4}
          strokeOpacity={0.2}
          strokeLinecap="round"
          className="blur-md"
        />
        <path
          d={d}
          fill="none"
          stroke="#a855f7"
          strokeWidth={2}
          strokeDasharray="8,8"
          strokeLinecap="round"
          className="animate-[dash_1s_linear_infinite]"
        />
      </g>
    );
  };

  return (
    <svg 
      className="absolute pointer-events-none overflow-visible" 
      style={{ left: 0, top: 0, width: '10000px', height: '10000px' }}
    >
      {/* Render all permanent connections */}
      {connections.map((conn, index) =>
        renderConnection(conn.fromId, conn.toId, `${conn.fromId}-${conn.toId}`, index)
      )}
      
      {/* Render tentative connection if dragging from output */}
      {connectingFrom && renderTentativeConnection(connectingFrom)}
      
      {/* Render reverse tentative connection if dragging from input */}
      {connectingTo && renderReverseConnection(connectingTo)}
    </svg>
  );
}

export default ConnectionLayer;
