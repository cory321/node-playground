import React, { ReactNode } from 'react';
import { NodeData, HoveredPort, NodeStatus } from '@/types/nodes';
import { Port } from './Port';
import { NodeHeader } from './NodeHeader';
import { NodeFooter } from './NodeFooter';
import { ResizeHandle } from './ResizeHandle';
import { StatusBar } from './StatusBar';

interface BaseNodeProps {
  node: NodeData;
  children: ReactNode;
  icon?: ReactNode;

  // Edit state
  isEditingTitle: boolean;
  onTitleChange: (title: string) => void;
  onEditTitleStart: () => void;
  onEditTitleEnd: () => void;
  onDelete: () => void;

  // Drag & resize
  onMouseDown: (e: React.MouseEvent) => void;
  onResizeStart: (e: React.MouseEvent) => void;

  // Ports configuration
  hasInputPort?: boolean;
  hasOutputPort?: boolean;
  isConnectedInput?: boolean;
  isConnectedOutput?: boolean;

  // Port interaction
  hoveredPort: HoveredPort | null;
  setHoveredPort: (port: HoveredPort | null) => void;
  onInputPortMouseDown?: (e: React.MouseEvent) => void;
  onInputPortMouseUp?: () => void;
  onOutputPortMouseDown?: (e: React.MouseEvent) => void;
  onOutputPortMouseUp?: () => void;
  connectingFrom?: string | null;
  connectingTo?: string | null;

  // Status
  status?: NodeStatus;
  isLoading?: boolean;
  loadingOverlay?: ReactNode;

  // Styling
  borderClass?: string;
  hoverBorderClass?: string;
  resizeHoverColor?: string;

  // Footer extras
  footerExtra?: ReactNode;

  // Extra ports rendered outside the main card (for multi-port nodes)
  extraPorts?: ReactNode;
}

export function BaseNode({
  node,
  children,
  icon,
  isEditingTitle,
  onTitleChange,
  onEditTitleStart,
  onEditTitleEnd,
  onDelete,
  onMouseDown,
  onResizeStart,
  hasInputPort = true,
  hasOutputPort = true,
  isConnectedInput = false,
  isConnectedOutput = false,
  hoveredPort,
  setHoveredPort,
  onInputPortMouseDown,
  onInputPortMouseUp,
  onOutputPortMouseDown,
  onOutputPortMouseUp,
  connectingFrom,
  connectingTo,
  status = 'idle',
  isLoading = false,
  loadingOverlay,
  borderClass = 'border-slate-700/50',
  hoverBorderClass = 'group-hover:border-slate-600/50',
  resizeHoverColor = 'hover:text-indigo-400',
  footerExtra,
  extraPorts,
}: BaseNodeProps) {
  const isInputActive = connectingFrom !== null && connectingFrom !== node.id;
  const isOutputActive =
    connectingFrom === node.id ||
    connectingTo === node.id ||
    (connectingTo !== null && connectingTo !== node.id);

  return (
    <div
      className="absolute select-none group"
      style={{
        left: node.x,
        top: node.y,
        width: node.width,
        height: node.height,
        zIndex: 10,
      }}
    >
      {/* Input Port */}
      {hasInputPort && onInputPortMouseDown && onInputPortMouseUp && (
        <Port
          nodeId={node.id}
          type="in"
          isConnected={isConnectedInput}
          hoveredPort={hoveredPort}
          setHoveredPort={setHoveredPort}
          onMouseDown={onInputPortMouseDown}
          onMouseUp={onInputPortMouseUp}
          isActive={isInputActive}
        />
      )}

      {/* Output Port */}
      {hasOutputPort && onOutputPortMouseDown && onOutputPortMouseUp && (
        <Port
          nodeId={node.id}
          type="out"
          isConnected={isConnectedOutput}
          hoveredPort={hoveredPort}
          setHoveredPort={setHoveredPort}
          onMouseDown={onOutputPortMouseDown}
          onMouseUp={onOutputPortMouseUp}
          isActive={isOutputActive}
        />
      )}

      {/* Extra Ports (for multi-port nodes, rendered outside overflow container) */}
      {extraPorts}

      {/* Resize Handle */}
      <ResizeHandle onMouseDown={onResizeStart} hoverColor={resizeHoverColor} />

      {/* Loading Overlay */}
      {isLoading && loadingOverlay}

      {/* Main Node Card */}
      <div
        className={`w-full h-full bg-slate-900/60 backdrop-blur-2xl border rounded-2xl flex flex-col overflow-hidden shadow-2xl transition-all ${borderClass} ${hoverBorderClass}`}
      >
        {/* Header */}
        <NodeHeader
          title={node.title}
          color={node.color}
          nodeId={node.id}
          icon={icon}
          isEditing={isEditingTitle}
          onTitleChange={onTitleChange}
          onEditStart={onEditTitleStart}
          onEditEnd={onEditTitleEnd}
          onDelete={onDelete}
          onMouseDown={onMouseDown}
        />

        {/* Body */}
        <div className="p-4 flex-1 flex flex-col gap-3 min-h-0 overflow-hidden">
          {children}

          {/* Footer */}
          <NodeFooter
            x={node.x}
            y={node.y}
            width={node.width}
            height={node.height}
            extraContent={footerExtra}
          />
        </div>

        {/* Status Bar */}
        <StatusBar status={status} color={node.color} />
      </div>
    </div>
  );
}

export default BaseNode;
