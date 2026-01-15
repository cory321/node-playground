import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
  NodeData,
  LLMNodeData,
  OutputNodeData,
  LocationNodeData,
  DeepResearchNodeData,
  ProviderDiscoveryNodeData,
  NODE_DEFAULTS,
} from '@/types/nodes';
import { CanvasTransform } from '@/types/canvas';

// Context value type
interface NodesContextValue {
  nodes: NodeData[];
  setNodes: React.Dispatch<React.SetStateAction<NodeData[]>>;
  addNode: (type: 'llm' | 'output' | 'location' | 'research' | 'providers', transform: CanvasTransform) => void;
  updateNode: (id: string, updates: Partial<NodeData>) => void;
  deleteNode: (id: string) => void;
  getNode: (id: string) => NodeData | undefined;
}

// Create context
const NodesContext = createContext<NodesContextValue | null>(null);

// Default initial nodes
const DEFAULT_NODES: NodeData[] = [
  {
    id: '1',
    x: 100,
    y: 150,
    width: 320,
    height: 320,
    title: 'LLM Prompt',
    text: 'Write a haiku about programming',
    color: '#6366f1',
    type: 'llm',
    provider: 'claude-sonnet',
    status: 'idle',
    response: null,
    error: null,
    useReasoning: false,
  } as LLMNodeData,
  {
    id: '2',
    x: 550,
    y: 150,
    width: 320,
    height: 320,
    title: 'Output Display',
    text: '',
    color: '#10b981',
    type: 'output',
    displayValue: null,
    lastUpdated: null,
  } as OutputNodeData,
];

// Provider props
interface NodesProviderProps {
  children: ReactNode;
  initialNodes?: NodeData[];
}

// Provider component
export function NodesProvider({ children, initialNodes = DEFAULT_NODES }: NodesProviderProps) {
  const [nodes, setNodes] = useState<NodeData[]>(initialNodes);

  // Add a new node
  const addNode = useCallback((type: 'llm' | 'output' | 'location' | 'research' | 'providers', transform: CanvasTransform) => {
    const defaults = NODE_DEFAULTS[type];
    const baseX = (window.innerWidth / 2 - transform.x - defaults.width / 2) / transform.scale;
    const baseY = (window.innerHeight / 2 - transform.y - defaults.height / 2) / transform.scale;

    let newNode: NodeData;

    if (type === 'llm') {
      newNode = {
        id: Date.now().toString(),
        x: baseX,
        y: baseY,
        width: defaults.width,
        height: defaults.height,
        title: 'LLM Node',
        text: '',
        color: defaults.color,
        type: 'llm',
        provider: 'claude-sonnet',
        status: 'idle',
        response: null,
        error: null,
        useReasoning: false,
      } as LLMNodeData;
    } else if (type === 'output') {
      newNode = {
        id: Date.now().toString(),
        x: baseX,
        y: baseY,
        width: defaults.width,
        height: defaults.height,
        title: 'Output',
        text: '',
        color: defaults.color,
        type: 'output',
        displayValue: null,
        lastUpdated: null,
      } as OutputNodeData;
    } else if (type === 'location') {
      newNode = {
        id: Date.now().toString(),
        x: baseX,
        y: baseY,
        width: defaults.width,
        height: defaults.height,
        title: 'Location Picker',
        text: '',
        color: defaults.color,
        type: 'location',
        selectedLocation: null,
        demographicsStatus: 'idle',
        demographicsError: null,
      } as LocationNodeData;
    } else if (type === 'research') {
      newNode = {
        id: Date.now().toString(),
        x: baseX,
        y: baseY,
        width: defaults.width,
        height: defaults.height,
        title: 'Deep Research',
        text: '',
        color: defaults.color,
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
      } as DeepResearchNodeData;
    } else {
      newNode = {
        id: Date.now().toString(),
        x: baseX,
        y: baseY,
        width: defaults.width,
        height: defaults.height,
        title: 'Provider Discovery',
        color: defaults.color,
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
      } as ProviderDiscoveryNodeData;
    }

    setNodes((prev) => [...prev, newNode]);
  }, []);

  // Update a node
  const updateNode = useCallback((id: string, updates: Partial<NodeData>) => {
    setNodes((prev) =>
      prev.map((node) => (node.id === id ? { ...node, ...updates } : node))
    );
  }, []);

  // Delete a node
  const deleteNode = useCallback((id: string) => {
    setNodes((prev) => prev.filter((node) => node.id !== id));
  }, []);

  // Get a node by ID
  const getNode = useCallback(
    (id: string) => nodes.find((node) => node.id === id),
    [nodes]
  );

  const value: NodesContextValue = {
    nodes,
    setNodes,
    addNode,
    updateNode,
    deleteNode,
    getNode,
  };

  return <NodesContext.Provider value={value}>{children}</NodesContext.Provider>;
}

// Hook to use nodes context
export function useNodes() {
  const context = useContext(NodesContext);
  if (!context) {
    throw new Error('useNodes must be used within a NodesProvider');
  }
  return context;
}

export default NodesContext;
