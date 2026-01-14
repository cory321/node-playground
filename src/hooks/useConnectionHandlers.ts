import { useCallback } from 'react';
import { Connection } from '@/types/connections';

interface UseConnectionHandlersProps {
  connections: Connection[];
  setConnections: React.Dispatch<React.SetStateAction<Connection[]>>;
  connectingFrom: string | null;
  setConnectingFrom: (id: string | null) => void;
  connectingTo: string | null;
  setConnectingTo: (id: string | null) => void;
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
}: UseConnectionHandlersProps): UseConnectionHandlersReturn {
  // Start connection from output port
  const startConnectionFromOutput = useCallback(
    (e: React.MouseEvent, nodeId: string) => {
      e.stopPropagation();
      const existingConnections = connections.filter((c) => c.fromId === nodeId);
      if (existingConnections.length > 0) {
        // Disconnect existing and start dragging from target
        const targetId = existingConnections[0].toId;
        setConnections(connections.filter((c) => c.fromId !== nodeId));
        setConnectingTo(targetId);
      } else {
        setConnectingFrom(nodeId);
      }
    },
    [connections, setConnections, setConnectingFrom, setConnectingTo]
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
          setConnections([
            ...connections,
            { id: `c-${Date.now()}`, fromId: connectingFrom, toId },
          ]);
        }
      }
      setConnectingFrom(null);
    },
    [connectingFrom, connections, setConnections, setConnectingFrom]
  );

  // Complete connection to output port
  const completeConnectionToOutput = useCallback(
    (fromId: string) => {
      if (connectingTo && connectingTo !== fromId) {
        const exists = connections.some(
          (c) => c.fromId === fromId && c.toId === connectingTo
        );
        if (!exists) {
          setConnections([
            ...connections,
            { id: `c-${Date.now()}`, fromId, toId: connectingTo },
          ]);
        }
      }
      setConnectingTo(null);
    },
    [connectingTo, connections, setConnections, setConnectingTo]
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
