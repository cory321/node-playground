// Node type constants
export const NODE_TYPES = {
  LLM: 'llm',
  OUTPUT: 'output',
  LOCATION: 'location',
} as const;

export type NodeType = (typeof NODE_TYPES)[keyof typeof NODE_TYPES];

// Node status for async operations
export type NodeStatus = 'idle' | 'loading' | 'success' | 'error';

// Base node data shared by all node types
export interface BaseNodeData {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  title: string;
  color: string;
  type: NodeType;
}

// LLM Node specific data
export interface LLMNodeData extends BaseNodeData {
  type: 'llm';
  text: string;
  provider: string;
  status: NodeStatus;
  response: string | null;
  error: string | null;
  useReasoning: boolean;
}

// Output Node specific data
export interface OutputNodeData extends BaseNodeData {
  type: 'output';
  text: string;
  displayValue: string | null;
  lastUpdated: number | null;
}

// Location data
export interface LocationData {
  name: string;
  state: string;
  country: string;
  lat: number;
  lng: number;
}

// Location Node specific data
export interface LocationNodeData extends BaseNodeData {
  type: 'location';
  text: string;
  selectedLocation: LocationData | null;
}

// Union type for all node types
export type NodeData = LLMNodeData | OutputNodeData | LocationNodeData;

// Type guards for narrowing node types
export function isLLMNode(node: NodeData): node is LLMNodeData {
  return node.type === 'llm';
}

export function isOutputNode(node: NodeData): node is OutputNodeData {
  return node.type === 'output';
}

export function isLocationNode(node: NodeData): node is LocationNodeData {
  return node.type === 'location';
}

// Default node dimensions
export const NODE_DEFAULTS = {
  llm: {
    width: 320,
    height: 320,
    color: '#6366f1',
  },
  output: {
    width: 320,
    height: 280,
    color: '#10b981',
  },
  location: {
    width: 400,
    height: 380,
    color: '#0ea5e9',
  },
} as const;

// Port types
export type PortType = 'in' | 'out';

export interface HoveredPort {
  nodeId: string;
  type: PortType;
}
