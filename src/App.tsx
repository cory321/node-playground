import React, { useState, useRef, useCallback } from 'react';
import { NodeData } from '@/types/nodes';
import { Connection } from '@/types/connections';
import { CanvasTransform, DragState, ResizeState, Point, CANVAS_CONSTANTS } from '@/types/canvas';

// Components
import { Toolbar } from '@/components/toolbar';
import { GridBackground, ConnectionLayer, NodeRenderer, EmptyState } from '@/components/canvas';
import { SettingsModal, SaveModal, LoadModal } from '@/components/modals';
import { ComparisonPanel } from '@/components/nodes/LocationNode';
import { ImageLibraryPanel } from '@/components/panels';

// Hooks
import { useChainExecution } from '@/hooks/useChainExecution';
import { usePersistence } from '@/hooks/usePersistence';
import { useNodeDrag } from '@/hooks/useNodeDrag';
import { useNodeResize } from '@/hooks/useNodeResize';
import { useConnectionHandlers } from '@/hooks/useConnectionHandlers';

// Contexts
import { useComparison, useImageLibrary } from '@/contexts';

// Node registry for creating new nodes
import { createNode } from '@/components/nodes/registry';
import { HoveredPort, LLMNodeData, OutputNodeData } from './types/nodes';

// Default initial state
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

const DEFAULT_CONNECTIONS: Connection[] = [{ id: 'c1', fromId: '1', toId: '2' }];

function App() {
  // Core state
  const [nodes, setNodes] = useState<NodeData[]>(DEFAULT_NODES);
  const [connections, setConnections] = useState<Connection[]>(DEFAULT_CONNECTIONS);
  const [transform, setTransform] = useState<CanvasTransform>({ x: 0, y: 0, scale: 1 });

  // Interaction state
  const [draggingNode, setDraggingNode] = useState<DragState | null>(null);
  const [resizingNode, setResizingNode] = useState<ResizeState | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [connectingFromPort, setConnectingFromPort] = useState<string | null>(null); // For multi-port nodes
  const [connectingTo, setConnectingTo] = useState<string | null>(null);
  const [hoveredPort, setHoveredPort] = useState<HoveredPort | null>(null);
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<Point>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);

  // Modal state
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Comparison context
  const { locations: comparisonLocations, togglePanel: toggleComparisonPanel } = useComparison();
  
  // Image library context
  const { images: libraryImages, togglePanel: toggleImageLibrary } = useImageLibrary();

  const containerRef = useRef<HTMLDivElement>(null);

  // Node CRUD operations
  const updateNode = useCallback((id: string, updates: Partial<NodeData>) => {
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, ...updates } : n)));
  }, []);

  const deleteNode = useCallback((id: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== id));
    setConnections((prev) => prev.filter((c) => c.fromId !== id && c.toId !== id));
  }, []);

  // Chain execution hook
  const { 
    executeLLMNode, 
    getIncomingData, 
    getIncomingLocationData, 
    getIncomingCategorySelectorData,
    getIncomingProviderData,
    getIncomingWebDesignerData,
  } = useChainExecution({
    nodes,
    setNodes,
    connections,
  });

  // Persistence hook
  const {
    savedSetups,
    isLoading: isLoadingProjects,
    isSaving,
    error: persistenceError,
    saveSetup,
    loadSetup,
    deleteSetup,
    exportSetup,
    importSetup,
    refreshSetups,
    hasCloudStorage,
  } = usePersistence({
    nodes,
    setNodes,
    connections,
    setConnections,
    transform,
    setTransform,
  });

  // Drag hook
  const { startDrag, updateDrag } = useNodeDrag({
    updateNode,
    scale: transform.scale,
  });

  // Resize hook
  const { startResize, updateResize } = useNodeResize({
    updateNode,
    scale: transform.scale,
  });

  // Connection handlers hook
  const {
    startConnectionFromOutput,
    startConnectionFromInput,
    completeConnectionToInput,
    completeConnectionToOutput,
    cancelConnection,
  } = useConnectionHandlers({
    connections,
    setConnections,
    connectingFrom,
    setConnectingFrom,
    connectingTo,
    setConnectingTo,
    nodes,
  });

  // Add node handlers
  const addLLMNode = useCallback(() => {
    const node = createNode(
      'llm',
      (window.innerWidth / 2 - transform.x - 160) / transform.scale,
      (window.innerHeight / 2 - transform.y - 160) / transform.scale
    );
    if (node) setNodes((prev) => [...prev, node]);
  }, [transform]);

  const addOutputNode = useCallback(() => {
    const node = createNode(
      'output',
      (window.innerWidth / 2 - transform.x - 160) / transform.scale,
      (window.innerHeight / 2 - transform.y - 140) / transform.scale
    );
    if (node) setNodes((prev) => [...prev, node]);
  }, [transform]);

  const addLocationNode = useCallback(() => {
    const node = createNode(
      'location',
      (window.innerWidth / 2 - transform.x - 200) / transform.scale,
      (window.innerHeight / 2 - transform.y - 190) / transform.scale
    );
    if (node) setNodes((prev) => [...prev, node]);
  }, [transform]);

  const addResearchNode = useCallback(() => {
    const node = createNode(
      'research',
      (window.innerWidth / 2 - transform.x - 240) / transform.scale,
      (window.innerHeight / 2 - transform.y - 300) / transform.scale
    );
    if (node) setNodes((prev) => [...prev, node]);
  }, [transform]);

  const addProviderNode = useCallback(() => {
    const node = createNode(
      'providers',
      (window.innerWidth / 2 - transform.x - 240) / transform.scale,
      (window.innerHeight / 2 - transform.y - 260) / transform.scale
    );
    if (node) setNodes((prev) => [...prev, node]);
  }, [transform]);

  const addCategorySelectorNode = useCallback(() => {
    const node = createNode(
      'category-selector',
      (window.innerWidth / 2 - transform.x - 210) / transform.scale,
      (window.innerHeight / 2 - transform.y - 240) / transform.scale
    );
    if (node) setNodes((prev) => [...prev, node]);
  }, [transform]);

  const addWebDesignerNode = useCallback(() => {
    const node = createNode(
      'web-designer',
      (window.innerWidth / 2 - transform.x - 200) / transform.scale,
      (window.innerHeight / 2 - transform.y - 210) / transform.scale
    );
    if (node) setNodes((prev) => [...prev, node]);
  }, [transform]);

  const addImageGenNode = useCallback(() => {
    const node = createNode(
      'image-gen',
      (window.innerWidth / 2 - transform.x - 190) / transform.scale,
      (window.innerHeight / 2 - transform.y - 210) / transform.scale
    );
    if (node) setNodes((prev) => [...prev, node]);
  }, [transform]);

  // Multi-port connection handlers for CategorySelectorNode
  const handleOutputPortMouseDownWithPort = useCallback(
    (e: React.MouseEvent, nodeId: string, portId: string) => {
      e.stopPropagation();
      setConnectingFrom(nodeId);
      setConnectingFromPort(portId);
    },
    []
  );

  const handleOutputPortMouseUpWithPort = useCallback(
    (nodeId: string, portId: string) => {
      // If we were dragging from an input, complete the connection
      if (connectingTo && connectingTo !== nodeId) {
        setConnections((prev) => {
          const exists = prev.some(
            (c) => c.fromId === nodeId && c.toId === connectingTo && c.fromPort === portId
          );
          if (exists) return prev;
          return [
            ...prev,
            { id: `c-${Date.now()}`, fromId: nodeId, toId: connectingTo, fromPort: portId },
          ];
        });
      }
      setConnectingTo(null);
      setConnectingFrom(null);
      setConnectingFromPort(null);
    },
    [connectingTo]
  );

  // Complete connection TO input from multi-port output
  const completeConnectionToInputFromPort = useCallback(
    (nodeId: string) => {
      if (connectingFrom && connectingFrom !== nodeId) {
        // Check if target is a ProviderDiscovery node (single input only)
        const targetNode = nodes.find((n) => n.id === nodeId);
        const isProviderNode = targetNode?.type === 'providers';

        setConnections((prev) => {
          const exists = prev.some(
            (c) => c.fromId === connectingFrom && c.toId === nodeId && c.fromPort === connectingFromPort
          );
          if (exists) return prev;

          // For ProviderDiscovery nodes, replace any existing input connection
          let filtered = prev;
          if (isProviderNode) {
            filtered = prev.filter((c) => c.toId !== nodeId);
          }

          return [
            ...filtered,
            { 
              id: `c-${Date.now()}`, 
              fromId: connectingFrom, 
              toId: nodeId,
              ...(connectingFromPort && { fromPort: connectingFromPort }),
            },
          ];
        });
      }
      setConnectingFrom(null);
      setConnectingFromPort(null);
      setConnectingTo(null);
    },
    [connectingFrom, connectingFromPort, nodes]
  );

  // Get port connections helper
  const getPortConnections = useCallback(
    (nodeId: string, portId: string) => {
      return connections.filter((c) => c.fromId === nodeId && c.fromPort === portId);
    },
    [connections]
  );

  // Mouse move handler
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = (e.clientX - rect.left - transform.x) / transform.scale;
      const y = (e.clientY - rect.top - transform.y) / transform.scale;
      setMousePos({ x, y });

      if (draggingNode) {
        updateDrag(e, draggingNode);
      }

      if (resizingNode) {
        updateResize(e, resizingNode);
      }

      if (isPanning) {
        setTransform((prev) => ({
          ...prev,
          x: prev.x + e.movementX,
          y: prev.y + e.movementY,
        }));
      }
    },
    [draggingNode, resizingNode, isPanning, transform, updateDrag, updateResize]
  );

  // Mouse up handler
  const handleMouseUp = useCallback(() => {
    setDraggingNode(null);
    setResizingNode(null);
    setIsPanning(false);
    setConnectingFromPort(null);
    cancelConnection();
  }, [cancelConnection]);

  // Wheel handler (zoom/pan)
  const onWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey) {
      const scaleChange = e.deltaY * -0.001;
      setTransform((prev) => ({
        ...prev,
        scale: Math.min(
          Math.max(prev.scale + scaleChange, CANVAS_CONSTANTS.MIN_SCALE),
          CANVAS_CONSTANTS.MAX_SCALE
        ),
      }));
    } else {
      setTransform((prev) => ({
        ...prev,
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY,
      }));
    }
  }, []);

  // Node interaction handlers
  const handleNodeMouseDown = useCallback(
    (e: React.MouseEvent, node: NodeData) => {
      if (e.button !== 0 || editingTitleId) return;
      e.stopPropagation();
      setDraggingNode(startDrag(e, node));
    },
    [editingTitleId, startDrag]
  );

  const handleNodeResizeStart = useCallback(
    (e: React.MouseEvent, node: NodeData) => {
      setResizingNode(startResize(e, node));
    },
    [startResize]
  );

  return (
    <div
      className="w-full h-screen bg-[#020617] text-slate-200 overflow-hidden font-sans selection:bg-indigo-500/30 touch-none"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={onWheel}
      onMouseDown={(e) => {
        if (e.button === 1 || e.altKey || e.target === containerRef.current) {
          setIsPanning(true);
          setEditingTitleId(null);
        }
      }}
    >
      <style>{`
        @keyframes dash { to { stroke-dashoffset: -16; } }
        @keyframes pulse { 0% { stroke-dashoffset: 120; } 100% { stroke-dashoffset: -120; } }
      `}</style>

      {/* Toolbar */}
      <Toolbar
        onAddLLMNode={addLLMNode}
        onAddOutputNode={addOutputNode}
        onAddLocationNode={addLocationNode}
        onAddResearchNode={addResearchNode}
        onAddCategorySelectorNode={addCategorySelectorNode}
        onAddProviderNode={addProviderNode}
        onAddWebDesignerNode={addWebDesignerNode}
        onAddImageGenNode={addImageGenNode}
        onOpenSettings={() => setShowSettingsModal(true)}
        onOpenSave={() => setShowSaveModal(true)}
        onOpenLoad={() => setShowLoadModal(true)}
        onExport={exportSetup}
        onImport={importSetup}
        onToggleCompare={toggleComparisonPanel}
        comparisonCount={comparisonLocations.length}
        onToggleImageLibrary={toggleImageLibrary}
        imageLibraryCount={libraryImages.length}
        nodeCount={nodes.length}
        connectionCount={connections.length}
      />

      {/* Grid Background */}
      <GridBackground transform={transform} />

      {/* Infinite Canvas */}
      <div
        className="absolute inset-0 origin-top-left"
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
        }}
      >
        {/* Connection Layer */}
        <ConnectionLayer
          connections={connections}
          nodes={nodes}
          connectingFrom={connectingFrom}
          connectingFromPort={connectingFromPort}
          connectingTo={connectingTo}
          mousePos={mousePos}
        />

        {/* Node Renderer */}
        <NodeRenderer
          nodes={nodes}
          connections={connections}
          updateNode={updateNode}
          deleteNode={deleteNode}
          onMouseDown={handleNodeMouseDown}
          onResizeStart={handleNodeResizeStart}
          editingTitleId={editingTitleId}
          setEditingTitleId={setEditingTitleId}
          onExecute={executeLLMNode}
          hoveredPort={hoveredPort}
          setHoveredPort={setHoveredPort}
          onInputPortMouseDown={startConnectionFromInput}
          onInputPortMouseUp={connectingFromPort ? completeConnectionToInputFromPort : completeConnectionToInput}
          onOutputPortMouseDown={startConnectionFromOutput}
          onOutputPortMouseUp={completeConnectionToOutput}
          onOutputPortMouseDownWithPort={handleOutputPortMouseDownWithPort}
          onOutputPortMouseUpWithPort={handleOutputPortMouseUpWithPort}
          connectingFrom={connectingFrom}
          connectingTo={connectingTo}
          getIncomingData={getIncomingData}
          getIncomingLocationData={getIncomingLocationData}
          getIncomingCategorySelectorData={getIncomingCategorySelectorData}
          getIncomingProviderData={getIncomingProviderData}
          getIncomingWebDesignerData={getIncomingWebDesignerData}
          getPortConnections={getPortConnections}
        />
      </div>

      {/* Empty State */}
      {nodes.length === 0 && <EmptyState />}

      {/* Modals */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />

      <SaveModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={saveSetup}
        nodeCount={nodes.length}
        connectionCount={connections.length}
        isSaving={isSaving}
        error={persistenceError}
        hasCloudStorage={hasCloudStorage}
      />

      <LoadModal
        isOpen={showLoadModal}
        onClose={() => setShowLoadModal(false)}
        savedSetups={savedSetups}
        onLoad={loadSetup}
        onDelete={deleteSetup}
        onRefresh={refreshSetups}
        isLoading={isLoadingProjects}
        error={persistenceError}
        hasCloudStorage={hasCloudStorage}
      />

      {/* Comparison Panel */}
      <ComparisonPanel />

      {/* Image Library Panel */}
      <ImageLibraryPanel />
    </div>
  );
}

export default App;
