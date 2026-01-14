import React from 'react';
import { NodeData, HoveredPort, isLLMNode, isOutputNode, isLocationNode } from '@/types/nodes';
import { Connection } from '@/types/connections';
import { LLMNode } from '../nodes/LLMNode';
import { OutputNode } from '../nodes/OutputNode';
import { LocationNode } from '../nodes/LocationNode';

interface NodeRendererProps {
  nodes: NodeData[];
  connections: Connection[];
  updateNode: (id: string, updates: Partial<NodeData>) => void;
  deleteNode: (id: string) => void;
  onMouseDown: (e: React.MouseEvent, node: NodeData) => void;
  onResizeStart: (e: React.MouseEvent, node: NodeData) => void;
  editingTitleId: string | null;
  setEditingTitleId: (id: string | null) => void;
  onExecute: (nodeId: string) => void;
  hoveredPort: HoveredPort | null;
  setHoveredPort: (port: HoveredPort | null) => void;
  onInputPortMouseDown: (e: React.MouseEvent, nodeId: string) => void;
  onInputPortMouseUp: (nodeId: string) => void;
  onOutputPortMouseDown: (e: React.MouseEvent, nodeId: string) => void;
  onOutputPortMouseUp: (nodeId: string) => void;
  connectingFrom: string | null;
  connectingTo: string | null;
  getIncomingData: (nodeId: string) => string | null;
}

export function NodeRenderer({
  nodes,
  connections,
  updateNode,
  deleteNode,
  onMouseDown,
  onResizeStart,
  editingTitleId,
  setEditingTitleId,
  onExecute,
  hoveredPort,
  setHoveredPort,
  onInputPortMouseDown,
  onInputPortMouseUp,
  onOutputPortMouseDown,
  onOutputPortMouseUp,
  connectingFrom,
  connectingTo,
  getIncomingData,
}: NodeRendererProps) {
  const isConnectedInput = (nodeId: string) =>
    connections.some((c) => c.toId === nodeId);
  const isConnectedOutput = (nodeId: string) =>
    connections.some((c) => c.fromId === nodeId);

  return (
    <>
      {nodes.map((node) => {
        if (isLLMNode(node)) {
          return (
            <LLMNode
              key={node.id}
              node={node}
              updateNode={updateNode}
              deleteNode={deleteNode}
              onMouseDown={(e) => onMouseDown(e, node)}
              onResizeStart={(e) => onResizeStart(e, node)}
              editingTitleId={editingTitleId}
              setEditingTitleId={setEditingTitleId}
              onExecute={onExecute}
              isConnectedInput={isConnectedInput(node.id)}
              isConnectedOutput={isConnectedOutput(node.id)}
              hoveredPort={hoveredPort}
              setHoveredPort={setHoveredPort}
              onInputPortMouseDown={(e) => onInputPortMouseDown(e, node.id)}
              onInputPortMouseUp={() => onInputPortMouseUp(node.id)}
              onOutputPortMouseDown={(e) => onOutputPortMouseDown(e, node.id)}
              onOutputPortMouseUp={() => onOutputPortMouseUp(node.id)}
              connectingFrom={connectingFrom}
              connectingTo={connectingTo}
              incomingData={getIncomingData(node.id)}
            />
          );
        }

        if (isOutputNode(node)) {
          return (
            <OutputNode
              key={node.id}
              node={node}
              updateNode={updateNode}
              deleteNode={deleteNode}
              onMouseDown={(e) => onMouseDown(e, node)}
              onResizeStart={(e) => onResizeStart(e, node)}
              editingTitleId={editingTitleId}
              setEditingTitleId={setEditingTitleId}
              isConnectedInput={isConnectedInput(node.id)}
              hoveredPort={hoveredPort}
              setHoveredPort={setHoveredPort}
              onInputPortMouseDown={(e) => onInputPortMouseDown(e, node.id)}
              onInputPortMouseUp={() => onInputPortMouseUp(node.id)}
              incomingData={getIncomingData(node.id)}
            />
          );
        }

        if (isLocationNode(node)) {
          return (
            <LocationNode
              key={node.id}
              node={node}
              updateNode={updateNode}
              deleteNode={deleteNode}
              onMouseDown={(e) => onMouseDown(e, node)}
              onResizeStart={(e) => onResizeStart(e, node)}
              editingTitleId={editingTitleId}
              setEditingTitleId={setEditingTitleId}
              isConnectedOutput={isConnectedOutput(node.id)}
              hoveredPort={hoveredPort}
              setHoveredPort={setHoveredPort}
              onOutputPortMouseDown={(e) => onOutputPortMouseDown(e, node.id)}
              onOutputPortMouseUp={() => onOutputPortMouseUp(node.id)}
              connectingFrom={connectingFrom}
              connectingTo={connectingTo}
            />
          );
        }

        return null;
      })}
    </>
  );
}

export default NodeRenderer;
