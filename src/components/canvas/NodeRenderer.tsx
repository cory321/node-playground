import React from 'react';
import { 
  NodeData, 
  HoveredPort, 
  CategoryAnalysisResult,
  isLLMNode, 
  isOutputNode, 
  isLocationNode, 
  isResearchNode, 
  isProviderNode,
  isCategorySelectorNode,
  isWebDesignerNode,
  isImageGenNode,
} from '@/types/nodes';
import { Connection } from '@/types/connections';
import { LLMNode } from '../nodes/LLMNode';
import { OutputNode } from '../nodes/OutputNode';
import { LocationNode } from '../nodes/LocationNode';
import { DeepResearchNode } from '../nodes/DeepResearchNode';
import { ProviderDiscoveryNode } from '../nodes/ProviderDiscoveryNode';
import { CategorySelectorNode } from '../nodes/CategorySelectorNode';
import { WebDesignerNode } from '../nodes/WebDesignerNode';
import { ImageGenNode } from '../nodes/ImageGenNode';

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
  // Multi-port handlers for CategorySelectorNode
  onOutputPortMouseDownWithPort: (e: React.MouseEvent, nodeId: string, portId: string) => void;
  onOutputPortMouseUpWithPort: (nodeId: string, portId: string) => void;
  connectingFrom: string | null;
  connectingTo: string | null;
  getIncomingData: (nodeId: string) => string | null;
  getIncomingLocationData: (nodeId: string) => {
    city: string;
    state: string | null;
    lat?: number;
    lng?: number;
    demographics?: {
      population: number | null;
      medianHouseholdIncome: number | null;
      homeownershipRate: number | null;
      medianHomeValue: number | null;
    };
  } | null;
  getIncomingCategorySelectorData?: (nodeId: string) => {
    city: string;
    state: string | null;
    categories: CategoryAnalysisResult[];
  } | null;
  getIncomingProviderData?: (nodeId: string) => {
    category?: string;
    city: string;
    state: string | null;
  } | null;
  getIncomingWebDesignerData?: (nodeId: string) => {
    city: string;
    state: string | null;
    category: string | null;
    serpScore?: number;
    serpQuality?: 'Weak' | 'Medium' | 'Strong';
    urgency?: 'extreme' | 'high' | 'medium' | 'low';
    competition?: 'low' | 'moderate' | 'high' | 'extreme';
  } | null;
  getPortConnections: (nodeId: string, portId: string) => Connection[];
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
  onOutputPortMouseDownWithPort,
  onOutputPortMouseUpWithPort,
  connectingFrom,
  connectingTo,
  getIncomingData,
  getIncomingLocationData,
  getIncomingCategorySelectorData,
  getIncomingProviderData,
  getIncomingWebDesignerData,
  getPortConnections,
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

        if (isResearchNode(node)) {
          return (
            <DeepResearchNode
              key={node.id}
              node={node}
              updateNode={updateNode}
              deleteNode={deleteNode}
              onMouseDown={(e) => onMouseDown(e, node)}
              onResizeStart={(e) => onResizeStart(e, node)}
              editingTitleId={editingTitleId}
              setEditingTitleId={setEditingTitleId}
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
              incomingData={getIncomingLocationData(node.id)}
            />
          );
        }

        if (isProviderNode(node)) {
          return (
            <ProviderDiscoveryNode
              key={node.id}
              node={node}
              updateNode={updateNode}
              deleteNode={deleteNode}
              onMouseDown={(e) => onMouseDown(e, node)}
              onResizeStart={(e) => onResizeStart(e, node)}
              editingTitleId={editingTitleId}
              setEditingTitleId={setEditingTitleId}
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
              incomingData={getIncomingProviderData?.(node.id) ?? null}
            />
          );
        }

        if (isCategorySelectorNode(node)) {
          return (
            <CategorySelectorNode
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
              onOutputPortMouseDown={(e, portId) => onOutputPortMouseDownWithPort(e, node.id, portId)}
              onOutputPortMouseUp={(portId) => onOutputPortMouseUpWithPort(node.id, portId)}
              connectingFrom={connectingFrom}
              connectingTo={connectingTo}
              incomingData={getIncomingCategorySelectorData?.(node.id) ?? null}
              getPortConnections={(portId) => getPortConnections(node.id, portId)}
            />
          );
        }

        if (isWebDesignerNode(node)) {
          return (
            <WebDesignerNode
              key={node.id}
              node={node}
              updateNode={updateNode}
              deleteNode={deleteNode}
              onMouseDown={(e) => onMouseDown(e, node)}
              onResizeStart={(e) => onResizeStart(e, node)}
              editingTitleId={editingTitleId}
              setEditingTitleId={setEditingTitleId}
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
              incomingData={getIncomingWebDesignerData?.(node.id) ?? null}
            />
          );
        }

        if (isImageGenNode(node)) {
          return (
            <ImageGenNode
              key={node.id}
              node={node}
              updateNode={updateNode}
              deleteNode={deleteNode}
              onMouseDown={(e) => onMouseDown(e, node)}
              onResizeStart={(e) => onResizeStart(e, node)}
              editingTitleId={editingTitleId}
              setEditingTitleId={setEditingTitleId}
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

        return null;
      })}
    </>
  );
}

export default NodeRenderer;
