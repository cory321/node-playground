import { ComponentType } from 'react';
import { Brain, Monitor, MapPin, Search, Users, Layers, Palette, Image as ImageIcon, LucideIcon } from 'lucide-react';
import {
  NodeType,
  NodeData,
  LLMNodeData,
  OutputNodeData,
  LocationNodeData,
  DeepResearchNodeData,
  ProviderDiscoveryNodeData,
  CategorySelectorNodeData,
  WebDesignerNodeData,
  ImageGenNodeData,
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
    demographicsStatus: 'idle',
    demographicsError: null,
  }),
});

// Register Deep Research node type
registry.set('research', {
  type: 'research',
  label: 'Deep Research',
  icon: Search,
  color: NODE_DEFAULTS.research.color,
  defaultWidth: NODE_DEFAULTS.research.width,
  defaultHeight: NODE_DEFAULTS.research.height,
  hasInputPort: true,
  hasOutputPort: true,
  createDefaultData: (id: string, x: number, y: number): DeepResearchNodeData => ({
    id,
    x,
    y,
    width: NODE_DEFAULTS.research.width,
    height: NODE_DEFAULTS.research.height,
    title: 'Deep Research',
    text: '',
    color: NODE_DEFAULTS.research.color,
    type: 'research',
    scanMode: 'full',
    status: 'idle',
    error: null,
    inputCity: null,
    inputState: null,
    cityTraits: [],
    maxSearches: 12,
    enableDeepDive: true,
    triageResult: null,
    categoryResults: [],
    topOpportunities: [],
    skipList: [],
    progress: {
      currentCategory: null,
      completedCount: 0,
      totalCount: 0,
      cacheHits: 0,
      searchesUsed: 0,
    },
    lastScanAt: null,
  }),
});

// Register Provider Discovery node type
registry.set('providers', {
  type: 'providers',
  label: 'Provider Discovery',
  icon: Users,
  color: NODE_DEFAULTS.providers.color,
  defaultWidth: NODE_DEFAULTS.providers.width,
  defaultHeight: NODE_DEFAULTS.providers.height,
  hasInputPort: true,
  hasOutputPort: true,
  createDefaultData: (id: string, x: number, y: number): ProviderDiscoveryNodeData => ({
    id,
    x,
    y,
    width: NODE_DEFAULTS.providers.width,
    height: NODE_DEFAULTS.providers.height,
    title: 'Provider Discovery',
    color: NODE_DEFAULTS.providers.color,
    type: 'providers',
    status: 'idle',
    error: null,
    inputCategory: null,
    inputCity: null,
    inputState: null,
    manualCategory: '',
    providers: [],
    progress: {
      currentSource: null,
      completed: false,
    },
    lastDiscoveryAt: null,
  }),
});

// Register Category Selector node type
registry.set('category-selector', {
  type: 'category-selector',
  label: 'Category Selector',
  icon: Layers,
  color: NODE_DEFAULTS['category-selector'].color,
  defaultWidth: NODE_DEFAULTS['category-selector'].width,
  defaultHeight: NODE_DEFAULTS['category-selector'].height,
  hasInputPort: true,
  hasOutputPort: false, // Custom multi-port handling
  createDefaultData: (id: string, x: number, y: number): CategorySelectorNodeData => ({
    id,
    x,
    y,
    width: NODE_DEFAULTS['category-selector'].width,
    height: NODE_DEFAULTS['category-selector'].height,
    title: 'Category Selector',
    color: NODE_DEFAULTS['category-selector'].color,
    type: 'category-selector',
    inputCity: null,
    inputState: null,
    categories: [],
    lastUpdatedAt: null,
  }),
});

// Register Web Designer node type
registry.set('web-designer', {
  type: 'web-designer',
  label: 'Web Designer',
  icon: Palette,
  color: NODE_DEFAULTS['web-designer'].color,
  defaultWidth: NODE_DEFAULTS['web-designer'].width,
  defaultHeight: NODE_DEFAULTS['web-designer'].height,
  hasInputPort: true,
  hasOutputPort: true,
  createDefaultData: (id: string, x: number, y: number): WebDesignerNodeData => ({
    id,
    x,
    y,
    width: NODE_DEFAULTS['web-designer'].width,
    height: NODE_DEFAULTS['web-designer'].height,
    title: 'Web Designer',
    color: NODE_DEFAULTS['web-designer'].color,
    type: 'web-designer',
    status: 'idle',
    error: null,
    provider: 'gemini-pro',
    useReasoning: false,
    inputCity: null,
    inputState: null,
    inputCategory: null,
    inputSerpScore: null,
    inputSerpQuality: null,
    inputUrgency: null,
    inputCompetition: null,
    generatedPrompt: null,
    generatedBusinessName: null,
    lastGeneratedAt: null,
  }),
});

// Register Image Generation node type
registry.set('image-gen', {
  type: 'image-gen',
  label: 'Image Generator',
  icon: ImageIcon,
  color: NODE_DEFAULTS['image-gen'].color,
  defaultWidth: NODE_DEFAULTS['image-gen'].width,
  defaultHeight: NODE_DEFAULTS['image-gen'].height,
  hasInputPort: true,
  hasOutputPort: true,
  createDefaultData: (id: string, x: number, y: number): ImageGenNodeData => ({
    id,
    x,
    y,
    width: NODE_DEFAULTS['image-gen'].width,
    height: NODE_DEFAULTS['image-gen'].height,
    title: 'Image Generator',
    color: NODE_DEFAULTS['image-gen'].color,
    type: 'image-gen',
    status: 'idle',
    error: null,
    prompt: '',
    aspectRatioMode: 'preset',
    aspectRatio: '1:1',
    customWidth: null,
    customHeight: null,
    generatedImage: null,
    lastGeneratedAt: null,
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
