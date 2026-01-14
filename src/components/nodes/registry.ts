import { ComponentType } from 'react';
import { Brain, Monitor, MapPin, LucideIcon } from 'lucide-react';
import {
  NodeType,
  NodeData,
  LLMNodeData,
  OutputNodeData,
  LocationNodeData,
  NODE_DEFAULTS,
} from '@/types/nodes';

// Node component props interface (minimal common props)
export interface NodeComponentProps<T extends NodeData = NodeData> {
  node: T;
  updateNode: (id: string, updates: Partial<T>) => void;
  deleteNode: (id: string) => void;
  // ... additional props handled by the renderer
}

// Node type configuration
export interface NodeTypeConfig {
  type: NodeType;
  label: string;
  icon: LucideIcon;
  color: string;
  defaultWidth: number;
  defaultHeight: number;
  hasInputPort: boolean;
  hasOutputPort: boolean;
  createDefaultData: (id: string, x: number, y: number) => NodeData;
}

// Registry map
const registry = new Map<NodeType, NodeTypeConfig>();

// Register LLM node type
registry.set('llm', {
  type: 'llm',
  label: 'LLM Node',
  icon: Brain,
  color: NODE_DEFAULTS.llm.color,
  defaultWidth: NODE_DEFAULTS.llm.width,
  defaultHeight: NODE_DEFAULTS.llm.height,
  hasInputPort: true,
  hasOutputPort: true,
  createDefaultData: (id: string, x: number, y: number): LLMNodeData => ({
    id,
    x,
    y,
    width: NODE_DEFAULTS.llm.width,
    height: NODE_DEFAULTS.llm.height,
    title: 'LLM Node',
    text: '',
    color: NODE_DEFAULTS.llm.color,
    type: 'llm',
    provider: 'claude-sonnet',
    status: 'idle',
    response: null,
    error: null,
    useReasoning: false,
  }),
});

// Register Output node type
registry.set('output', {
  type: 'output',
  label: 'Output',
  icon: Monitor,
  color: NODE_DEFAULTS.output.color,
  defaultWidth: NODE_DEFAULTS.output.width,
  defaultHeight: NODE_DEFAULTS.output.height,
  hasInputPort: true,
  hasOutputPort: false,
  createDefaultData: (id: string, x: number, y: number): OutputNodeData => ({
    id,
    x,
    y,
    width: NODE_DEFAULTS.output.width,
    height: NODE_DEFAULTS.output.height,
    title: 'Output',
    text: '',
    color: NODE_DEFAULTS.output.color,
    type: 'output',
    displayValue: null,
    lastUpdated: null,
  }),
});

// Register Location node type
registry.set('location', {
  type: 'location',
  label: 'Location Picker',
  icon: MapPin,
  color: NODE_DEFAULTS.location.color,
  defaultWidth: NODE_DEFAULTS.location.width,
  defaultHeight: NODE_DEFAULTS.location.height,
  hasInputPort: false,
  hasOutputPort: true,
  createDefaultData: (id: string, x: number, y: number): LocationNodeData => ({
    id,
    x,
    y,
    width: NODE_DEFAULTS.location.width,
    height: NODE_DEFAULTS.location.height,
    title: 'Location Picker',
    text: '',
    color: NODE_DEFAULTS.location.color,
    type: 'location',
    selectedLocation: null,
  }),
});

// Get a node type config
export function getNodeTypeConfig(type: NodeType): NodeTypeConfig | undefined {
  return registry.get(type);
}

// Get all registered node types
export function getAllNodeTypes(): NodeTypeConfig[] {
  return Array.from(registry.values());
}

// Register a new node type (for extensibility)
export function registerNodeType(config: NodeTypeConfig): void {
  registry.set(config.type, config);
}

// Create a new node of a given type
export function createNode(
  type: NodeType,
  x: number,
  y: number,
  id?: string
): NodeData | undefined {
  const config = registry.get(type);
  if (!config) return undefined;
  
  return config.createDefaultData(id || Date.now().toString(), x, y);
}

// Check if a node type is registered
export function isNodeTypeRegistered(type: string): type is NodeType {
  return registry.has(type as NodeType);
}

export default registry;
