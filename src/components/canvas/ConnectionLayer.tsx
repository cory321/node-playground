import React from 'react';
import { Connection } from '@/types/connections';
import { NodeData, isCategorySelectorNode, isSitePlannerNode } from '@/types/nodes';
import { Point } from '@/types/canvas';
import { 
  getConnectorPos, 
  getConnectionPath, 
  getMultiPortConnectorPos,
  MULTI_PORT_BASE_OFFSET,
  MULTI_PORT_SPACING,
  SITE_PLANNER_INPUT_BASE_OFFSET,
  SITE_PLANNER_INPUT_SPACING,
} from '@/utils/geometry';

interface ConnectionLayerProps {
  connections: Connection[];
  nodes: NodeData[];
  connectingFrom: string | null;
  connectingFromPort: string | null; // Port ID when dragging from multi-port output node
  connectingTo: string | null;
  connectingToPort: string | null; // Port ID when dragging from multi-port input node
  mousePos: Point;
}

export function ConnectionLayer({
  connections,
  nodes,
  connectingFrom,
  connectingFromPort,
  connectingTo,
  connectingToPort,
  mousePos,
}: ConnectionLayerProps) {
  const getNode = (id: string) => nodes.find((n) => n.id === id);

  // Site Planner input port order for index lookup
  // Local Knowledge provides location + category, so we only need 2 ports
  const SITE_PLANNER_PORT_ORDER = ['local-knowledge', 'providers'];

  // Get the port position, handling multi-port nodes
  const getPortPosition = (
    nodeId: string, 
    type: 'in' | 'out', 
    portId?: string
  ): Point => {
    const node = getNode(nodeId);
    if (!node) return { x: 0, y: 0 };

    // Check if this is a multi-port output node (category-selector) with a specific port
    if (type === 'out' && portId && isCategorySelectorNode(node)) {
      // Find the visible index of this port
      const visibleCategories = node.categories.filter((c) => c.visible);
      const portIndex = visibleCategories.findIndex((c) => c.id === portId);
      
      if (portIndex !== -1) {
        // Calculate position matching MultiPort component layout
        const yOffset = MULTI_PORT_BASE_OFFSET + (portIndex * MULTI_PORT_SPACING) + (MULTI_PORT_SPACING / 2);
        return {
          x: node.x + node.width,
          y: node.y + yOffset,
        };
      }
    }

    // Check if this is a multi-input node (site-planner) with a specific port
    if (type === 'in' && portId && isSitePlannerNode(node)) {
      const portIndex = SITE_PLANNER_PORT_ORDER.indexOf(portId);
      
      if (portIndex !== -1) {
        // Calculate position matching MultiInputPort component layout
        const yOffset = SITE_PLANNER_INPUT_BASE_OFFSET + (portIndex * SITE_PLANNER_INPUT_SPACING);
        return {
          x: node.x,
          y: node.y + yOffset,
        };
      }
    }

    // Default single port position
    return getConnectorPos(node, type);
  };

  // Render a permanent connection with its own gradient
  const renderConnection = (conn: Connection, index: number) => {
    const start = getPortPosition(conn.fromId, 'out', conn.fromPort);
    const end = getPortPosition(conn.toId, 'in', conn.toPort);
    const d = getConnectionPath(start, end);
    const key = `${conn.fromId}-${conn.toId}-${conn.fromPort || 'default'}`;
    const gradientId = `gradLine-${index}`;

    // Add small offset to y2 when line is horizontal to prevent gradient collapse
    const isHorizontal = Math.abs(start.y - end.y) < 1;
    const y2Offset = isHorizontal ? 1 : 0;

    // Use violet gradient for connections from category selector
    const fromNode = getNode(conn.fromId);
    const isFromCategorySelector = fromNode && isCategorySelectorNode(fromNode);
    const startColor = isFromCategorySelector ? '#8b5cf6' : '#6366f1';

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
            <stop offset="0%" stopColor={startColor} />
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
  const renderTentativeConnection = (fromId: string, fromPort: string | null) => {
    const start = getPortPosition(fromId, 'out', fromPort || undefined);
    const d = getConnectionPath(start, mousePos);

    // Use violet color if dragging from category selector
    const fromNode = getNode(fromId);
    const isFromCategorySelector = fromNode && isCategorySelectorNode(fromNode);
    const strokeColor = isFromCategorySelector ? '#8b5cf6' : '#6366f1';

    return (
      <g key="tentative">
        <path
          d={d}
          fill="none"
          stroke={strokeColor}
          strokeWidth={4}
          strokeOpacity={0.2}
          strokeLinecap="round"
          className="blur-md"
        />
        <path
          d={d}
          fill="none"
          stroke={strokeColor}
          strokeWidth={2}
          strokeDasharray="8,8"
          strokeLinecap="round"
          className="animate-[dash_1s_linear_infinite]"
        />
      </g>
    );
  };

  // Render reverse tentative connection (dragging backward from input)
  const renderReverseConnection = (toId: string, toPort: string | null) => {
    const end = getPortPosition(toId, 'in', toPort || undefined);
    const d = getConnectionPath(mousePos, end);

    // Use blue color for Site Planner multi-input ports
    const toNode = getNode(toId);
    const isSitePlanner = toNode && isSitePlannerNode(toNode);
    const strokeColor = isSitePlanner ? '#3b82f6' : '#a855f7';

    return (
      <g key="tentative-reverse">
        <path
          d={d}
          fill="none"
          stroke={strokeColor}
          strokeWidth={4}
          strokeOpacity={0.2}
          strokeLinecap="round"
          className="blur-md"
        />
        <path
          d={d}
          fill="none"
          stroke={strokeColor}
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
      {connections.map((conn, index) => renderConnection(conn, index))}
      
      {/* Render tentative connection if dragging from output */}
      {connectingFrom && renderTentativeConnection(connectingFrom, connectingFromPort)}
      
      {/* Render reverse tentative connection if dragging from input */}
      {connectingTo && renderReverseConnection(connectingTo, connectingToPort)}
    </svg>
  );
}

export default ConnectionLayer;
