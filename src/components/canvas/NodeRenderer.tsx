import React from 'react';
import { 
  NodeData, 
  HoveredPort, 
  CategoryAnalysisResult,
  ProviderData,
  LocationData,
  isLLMNode, 
  isOutputNode, 
  isLocationNode, 
  isResearchNode, 
  isProviderNode,
  isProviderEnrichmentNode,
  isCategorySelectorNode,
  isWebDesignerNode,
  isImageGenNode,
  isLocalKnowledgeNode,
  isSitePlannerNode,
  isProviderProfileGeneratorNode,
  isEditorialContentGeneratorNode,
  isComparisonDataNode,
  isSEOOptimizationNode,
  isDesignPromptNode,
  isImageSourceNode,
  isBrandDesignNode,
  isDataViewerNode,
} from '@/types/nodes';
import { Connection } from '@/types/connections';
import { EnrichedProvider } from '@/types/enrichedProvider';
import { LocalKnowledgeOutput } from '@/types/localKnowledge';
import { GeneratedEditorialContent } from '@/types/editorialContent';
import { GeneratedComparisonData } from '@/types/comparisonPage';
import { LLMNode } from '../nodes/LLMNode';
import { OutputNode } from '../nodes/OutputNode';
import { LocationNode } from '../nodes/LocationNode';
import { DeepResearchNode } from '../nodes/DeepResearchNode';
import { ProviderDiscoveryNode } from '../nodes/ProviderDiscoveryNode';
import { ProviderEnrichmentNode } from '../nodes/ProviderEnrichmentNode';
import { CategorySelectorNode } from '../nodes/CategorySelectorNode';
import { WebDesignerNode } from '../nodes/WebDesignerNode';
import { ImageGenNode } from '../nodes/ImageGenNode';
import { LocalKnowledgeNode } from '../nodes/LocalKnowledgeNode';
import { SitePlannerNode } from '../nodes/SitePlannerNode';
import { ProviderProfileGeneratorNode } from '../nodes/ProviderProfileGeneratorNode';
import { EditorialContentGeneratorNode } from '../nodes/EditorialContentGeneratorNode';
import { ComparisonDataNode } from '../nodes/ComparisonDataNode';
import { SEOOptimizationNode } from '../nodes/SEOOptimizationNode';
import { DesignPromptNode } from '../nodes/DesignPromptNode';
import { ImageSourceNode } from '../nodes/ImageSourceNode';
import { BrandDesignNode } from '../nodes/BrandDesignNode';
import { DataViewerNode } from '../nodes/DataViewerNode';
import { SitePlannerOutput } from '@/types/sitePlanner';

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
  // Multi-port handlers for CategorySelectorNode (output ports)
  onOutputPortMouseDownWithPort: (e: React.MouseEvent, nodeId: string, portId: string) => void;
  onOutputPortMouseUpWithPort: (nodeId: string, portId: string) => void;
  // Multi-input port handlers for SitePlannerNode
  onInputPortMouseDownWithPort: (e: React.MouseEvent, nodeId: string, portId: string) => void;
  onInputPortMouseUpWithPort: (nodeId: string, portId: string) => void;
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
  getIncomingProviderEnrichmentData?: (nodeId: string) => {
    providers: ProviderData[];
    category?: string;
    city?: string;
    state?: string | null;
  } | null;
  getIncomingLocalKnowledgeData?: (nodeId: string) => {
    city: string;
    county?: string;
    state: string | null;
    category?: string;
  } | null;
  getIncomingSitePlannerData?: (nodeId: string) => {
    location: LocationData | null;
    serp: {
      category: string;
      serpQuality: 'Weak' | 'Medium' | 'Strong';
      serpScore: number;
    } | null;
    providers: EnrichedProvider[];
    localKnowledge: LocalKnowledgeOutput | null;
  } | null;
  getIncomingProfileGeneratorData?: (nodeId: string) => {
    blueprint: SitePlannerOutput | null;
    providers: EnrichedProvider[];
    localKnowledge: LocalKnowledgeOutput | null;
  } | null;
  getIncomingEditorialContentData?: (nodeId: string) => {
    blueprint: SitePlannerOutput | null;
    localKnowledge: LocalKnowledgeOutput | null;
    serpData: CategoryAnalysisResult | null;
  } | null;
  getIncomingComparisonDataData?: (nodeId: string) => {
    blueprint: SitePlannerOutput | null;
    enrichedProviders: EnrichedProvider[];
    localKnowledge: LocalKnowledgeOutput | null;
  } | null;
  getIncomingSEOOptimizationData?: (nodeId: string) => {
    blueprint: SitePlannerOutput | null;
    editorialContent: GeneratedEditorialContent | null;
    comparisonData: GeneratedComparisonData | null;
  } | null;
  getIncomingDesignPromptData?: (nodeId: string) => SitePlannerOutput | null;
  getIncomingBrandDesignData?: (nodeId: string) => { screenshotUrl: string } | null;
  getIncomingStructuredData?: (nodeId: string) => {
    data: unknown;
    sourceNodeType: string;
    sourceNodeTitle: string;
  } | null;
  getPortConnections: (nodeId: string, portId: string) => Connection[];
  getInputPortConnections: (nodeId: string, portId: string) => Connection[];
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
  onInputPortMouseDownWithPort,
  onInputPortMouseUpWithPort,
  connectingFrom,
  connectingTo,
  getIncomingData,
  getIncomingLocationData,
  getIncomingCategorySelectorData,
  getIncomingProviderData,
  getIncomingWebDesignerData,
  getIncomingProviderEnrichmentData,
  getIncomingLocalKnowledgeData,
  getIncomingSitePlannerData,
  getIncomingProfileGeneratorData,
  getIncomingEditorialContentData,
  getIncomingComparisonDataData,
  getIncomingSEOOptimizationData,
  getIncomingDesignPromptData,
  getIncomingBrandDesignData,
  getIncomingStructuredData,
  getPortConnections,
  getInputPortConnections,
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

        if (isProviderEnrichmentNode(node)) {
          return (
            <ProviderEnrichmentNode
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
              incomingData={getIncomingProviderEnrichmentData?.(node.id) ?? null}
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

        if (isLocalKnowledgeNode(node)) {
          return (
            <LocalKnowledgeNode
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
              incomingData={getIncomingLocalKnowledgeData?.(node.id) ?? null}
            />
          );
        }

        if (isSitePlannerNode(node)) {
          return (
            <SitePlannerNode
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
              onInputPortMouseDown={(e, portId) => onInputPortMouseDownWithPort(e, node.id, portId)}
              onInputPortMouseUp={(portId) => onInputPortMouseUpWithPort(node.id, portId)}
              onOutputPortMouseDown={(e) => onOutputPortMouseDown(e, node.id)}
              onOutputPortMouseUp={() => onOutputPortMouseUp(node.id)}
              connectingFrom={connectingFrom}
              connectingTo={connectingTo}
              getInputPortConnections={(portId) => getInputPortConnections(node.id, portId)}
              incomingData={getIncomingSitePlannerData?.(node.id) ?? null}
            />
          );
        }

        if (isProviderProfileGeneratorNode(node)) {
          return (
            <ProviderProfileGeneratorNode
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
              onInputPortMouseDown={(e, portId) => onInputPortMouseDownWithPort(e, node.id, portId)}
              onInputPortMouseUp={(portId) => onInputPortMouseUpWithPort(node.id, portId)}
              onOutputPortMouseDown={(e) => onOutputPortMouseDown(e, node.id)}
              onOutputPortMouseUp={() => onOutputPortMouseUp(node.id)}
              connectingFrom={connectingFrom}
              connectingTo={connectingTo}
              getInputPortConnections={(portId) => getInputPortConnections(node.id, portId)}
              incomingData={getIncomingProfileGeneratorData?.(node.id) ?? null}
            />
          );
        }

        if (isEditorialContentGeneratorNode(node)) {
          return (
            <EditorialContentGeneratorNode
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
              onInputPortMouseDown={(e, portId) => onInputPortMouseDownWithPort(e, node.id, portId)}
              onInputPortMouseUp={(portId) => onInputPortMouseUpWithPort(node.id, portId)}
              onOutputPortMouseDown={(e) => onOutputPortMouseDown(e, node.id)}
              onOutputPortMouseUp={() => onOutputPortMouseUp(node.id)}
              connectingFrom={connectingFrom}
              connectingTo={connectingTo}
              getInputPortConnections={(portId) => getInputPortConnections(node.id, portId)}
              incomingData={getIncomingEditorialContentData?.(node.id) ?? null}
            />
          );
        }

        if (isComparisonDataNode(node)) {
          return (
            <ComparisonDataNode
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
              onInputPortMouseDown={(e, portId) => onInputPortMouseDownWithPort(e, node.id, portId)}
              onInputPortMouseUp={(portId) => onInputPortMouseUpWithPort(node.id, portId)}
              onOutputPortMouseDown={(e) => onOutputPortMouseDown(e, node.id)}
              onOutputPortMouseUp={() => onOutputPortMouseUp(node.id)}
              connectingFrom={connectingFrom}
              connectingTo={connectingTo}
              getInputPortConnections={(portId) => getInputPortConnections(node.id, portId)}
              incomingData={getIncomingComparisonDataData?.(node.id) ?? null}
            />
          );
        }

        if (isSEOOptimizationNode(node)) {
          return (
            <SEOOptimizationNode
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
              onInputPortMouseDown={(e, portId) => onInputPortMouseDownWithPort(e, node.id, portId)}
              onInputPortMouseUp={(portId) => onInputPortMouseUpWithPort(node.id, portId)}
              onOutputPortMouseDown={(e) => onOutputPortMouseDown(e, node.id)}
              onOutputPortMouseUp={() => onOutputPortMouseUp(node.id)}
              connectingFrom={connectingFrom}
              connectingTo={connectingTo}
              getInputPortConnections={(portId) => getInputPortConnections(node.id, portId)}
              incomingData={getIncomingSEOOptimizationData?.(node.id) ?? null}
            />
          );
        }

        if (isDesignPromptNode(node)) {
          return (
            <DesignPromptNode
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
              incomingData={getIncomingDesignPromptData?.(node.id) ?? null}
            />
          );
        }

        if (isImageSourceNode(node)) {
          return (
            <ImageSourceNode
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
            />
          );
        }

        if (isBrandDesignNode(node)) {
          return (
            <BrandDesignNode
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
              incomingData={getIncomingBrandDesignData?.(node.id) ?? null}
            />
          );
        }

        if (isDataViewerNode(node)) {
          return (
            <DataViewerNode
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
              incomingData={getIncomingStructuredData?.(node.id) ?? null}
            />
          );
        }

        return null;
      })}
    </>
  );
}

export default NodeRenderer;
