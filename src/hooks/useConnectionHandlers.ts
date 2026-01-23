import { useCallback } from 'react';
import { Connection } from '@/types/connections';
import { NodeData } from '@/types/nodes';

// Node types that support multiple outgoing connections from a single output port
const MULTI_OUTPUT_NODE_TYPES = new Set([
  'site-planner',
  'local-knowledge',
  'provider-enrichment',
]);

interface UseConnectionHandlersProps {
  connections: Connection[];
  setConnections: React.Dispatch<React.SetStateAction<Connection[]>>;
  connectingFrom: string | null;
  setConnectingFrom: (id: string | null) => void;
  connectingTo: string | null;
  setConnectingTo: (id: string | null) => void;
  nodes?: NodeData[];
}

interface UseConnectionHandlersReturn {
  startConnectionFromOutput: (e: React.MouseEvent, nodeId: string) => void;
  startConnectionFromInput: (e: React.MouseEvent, nodeId: string) => void;
  completeConnectionToInput: (toId: string) => void;
  completeConnectionToOutput: (fromId: string) => void;
  cancelConnection: () => void;
}

export function useConnectionHandlers({
  connections,
  setConnections,
  connectingFrom,
  setConnectingFrom,
  connectingTo,
  setConnectingTo,
  nodes = [],
}: UseConnectionHandlersProps): UseConnectionHandlersReturn {
  // Start connection from output port
  const startConnectionFromOutput = useCallback(
    (e: React.MouseEvent, nodeId: string) => {
      e.stopPropagation();
      
      // Check if this node type supports multiple output connections
      const sourceNode = nodes.find((n) => n.id === nodeId);
      const supportsMultiOutput = sourceNode && MULTI_OUTPUT_NODE_TYPES.has(sourceNode.type);
      
      const existingConnections = connections.filter((c) => c.fromId === nodeId);
      if (existingConnections.length > 0 && !supportsMultiOutput) {
        // For single-output nodes: Disconnect existing and start dragging from target
        const targetId = existingConnections[0].toId;
        setConnections(connections.filter((c) => c.fromId !== nodeId));
        setConnectingTo(targetId);
      } else {
        // For multi-output nodes or nodes with no connections: start new connection
        setConnectingFrom(nodeId);
      }
    },
    [connections, setConnections, setConnectingFrom, setConnectingTo, nodes]
  );

  // Start connection from input port
  const startConnectionFromInput = useCallback(
    (e: React.MouseEvent, nodeId: string) => {
      e.stopPropagation();
      const existingConnection = connections.find((c) => c.toId === nodeId);
      if (existingConnection) {
        // Disconnect existing and start dragging from source
        setConnections(connections.filter((c) => c.id !== existingConnection.id));
        setConnectingFrom(existingConnection.fromId);
      } else {
        setConnectingTo(nodeId);
      }
    },
    [connections, setConnections, setConnectingFrom, setConnectingTo]
  );

  // Complete connection to input port
  const completeConnectionToInput = useCallback(
    (toId: string) => {
      if (connectingFrom && connectingFrom !== toId) {
        const exists = connections.some(
          (c) => c.fromId === connectingFrom && c.toId === toId
        );
        if (!exists) {
          // Check if target is a ProviderDiscovery node (single input only)
          const targetNode = nodes.find((n) => n.id === toId);
          const isProviderNode = targetNode?.type === 'providers';

          // For ProviderDiscovery nodes, replace any existing input connection
          const filtered = isProviderNode
            ? connections.filter((c) => c.toId !== toId)
            : connections;

          setConnections([
            ...filtered,
            { id: `c-${Date.now()}`, fromId: connectingFrom, toId },
          ]);
        }
      }
      setConnectingFrom(null);
    },
    [connectingFrom, connections, setConnections, setConnectingFrom, nodes]
  );

  // Complete connection to output port
  const completeConnectionToOutput = useCallback(
    (fromId: string) => {
      if (connectingTo && connectingTo !== fromId) {
        const exists = connections.some(
          (c) => c.fromId === fromId && c.toId === connectingTo
        );
        if (!exists) {
          // Check if target is a ProviderDiscovery node (single input only)
          const targetNode = nodes.find((n) => n.id === connectingTo);
          const isProviderNode = targetNode?.type === 'providers';

          // For ProviderDiscovery nodes, replace any existing input connection
          const filtered = isProviderNode
            ? connections.filter((c) => c.toId !== connectingTo)
            : connections;

          setConnections([
            ...filtered,
            { id: `c-${Date.now()}`, fromId, toId: connectingTo },
          ]);
        }
      }
      setConnectingTo(null);
    },
    [connectingTo, connections, setConnections, setConnectingTo, nodes]
  );

  // Cancel any in-progress connection
  const cancelConnection = useCallback(() => {
    setConnectingFrom(null);
    setConnectingTo(null);
  }, [setConnectingFrom, setConnectingTo]);

  return {
    startConnectionFromOutput,
    startConnectionFromInput,
    completeConnectionToInput,
    completeConnectionToOutput,
    cancelConnection,
  };
}

export default useConnectionHandlers;
