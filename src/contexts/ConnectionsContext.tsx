import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Connection } from '@/types/connections';

// Context value type
interface ConnectionsContextValue {
  connections: Connection[];
  setConnections: React.Dispatch<React.SetStateAction<Connection[]>>;
  addConnection: (fromId: string, toId: string, fromPort?: string, toPort?: string) => void;
  removeConnection: (id: string) => void;
  removeConnectionsForNode: (nodeId: string) => void;
  removeConnectionsForPort: (nodeId: string, portId: string) => void;
  getConnectionsFrom: (nodeId: string) => Connection[];
  getConnectionsFromPort: (nodeId: string, portId: string) => Connection[];
  getConnectionsTo: (nodeId: string) => Connection[];
  hasConnection: (fromId: string, toId: string, fromPort?: string, toPort?: string) => boolean;
  isPortConnected: (nodeId: string, portId: string) => boolean;
}

// Create context
const ConnectionsContext = createContext<ConnectionsContextValue | null>(null);

// Default initial connections
const DEFAULT_CONNECTIONS: Connection[] = [
  { id: 'c1', fromId: '1', toId: '2' },
];

// Provider props
interface ConnectionsProviderProps {
  children: ReactNode;
  initialConnections?: Connection[];
}

// Provider component
export function ConnectionsProvider({
  children,
  initialConnections = DEFAULT_CONNECTIONS,
}: ConnectionsProviderProps) {
  const [connections, setConnections] = useState<Connection[]>(initialConnections);

  // Add a new connection (with optional port identifiers for multi-port nodes)
  const addConnection = useCallback((
    fromId: string, 
    toId: string, 
    fromPort?: string, 
    toPort?: string
  ) => {
    setConnections((prev) => {
      // Check if connection already exists (including port matching)
      const exists = prev.some((c) => 
        c.fromId === fromId && 
        c.toId === toId &&
        c.fromPort === fromPort &&
        c.toPort === toPort
      );
      if (exists) return prev;

      return [...prev, { 
        id: `c-${Date.now()}`, 
        fromId, 
        toId,
        ...(fromPort && { fromPort }),
        ...(toPort && { toPort }),
      }];
    });
  }, []);

  // Remove a connection by ID
  const removeConnection = useCallback((id: string) => {
    setConnections((prev) => prev.filter((c) => c.id !== id));
  }, []);

  // Remove all connections for a node
  const removeConnectionsForNode = useCallback((nodeId: string) => {
    setConnections((prev) =>
      prev.filter((c) => c.fromId !== nodeId && c.toId !== nodeId)
    );
  }, []);

  // Remove all connections from a specific port
  const removeConnectionsForPort = useCallback((nodeId: string, portId: string) => {
    setConnections((prev) =>
      prev.filter((c) => !(c.fromId === nodeId && c.fromPort === portId))
    );
  }, []);

  // Get connections from a node
  const getConnectionsFrom = useCallback(
    (nodeId: string) => connections.filter((c) => c.fromId === nodeId),
    [connections]
  );

  // Get connections from a specific port of a node
  const getConnectionsFromPort = useCallback(
    (nodeId: string, portId: string) => 
      connections.filter((c) => c.fromId === nodeId && c.fromPort === portId),
    [connections]
  );

  // Get connections to a node
  const getConnectionsTo = useCallback(
    (nodeId: string) => connections.filter((c) => c.toId === nodeId),
    [connections]
  );

  // Check if a connection exists (with optional port matching)
  const hasConnection = useCallback(
    (fromId: string, toId: string, fromPort?: string, toPort?: string) =>
      connections.some((c) => 
        c.fromId === fromId && 
        c.toId === toId &&
        (fromPort === undefined || c.fromPort === fromPort) &&
        (toPort === undefined || c.toPort === toPort)
      ),
    [connections]
  );

  // Check if a specific port has any connections
  const isPortConnected = useCallback(
    (nodeId: string, portId: string) =>
      connections.some((c) => c.fromId === nodeId && c.fromPort === portId),
    [connections]
  );

  const value: ConnectionsContextValue = {
    connections,
    setConnections,
    addConnection,
    removeConnection,
    removeConnectionsForNode,
    removeConnectionsForPort,
    getConnectionsFrom,
    getConnectionsFromPort,
    getConnectionsTo,
    hasConnection,
    isPortConnected,
  };

  return (
    <ConnectionsContext.Provider value={value}>{children}</ConnectionsContext.Provider>
  );
}

// Hook to use connections context
export function useConnections() {
  const context = useContext(ConnectionsContext);
  if (!context) {
    throw new Error('useConnections must be used within a ConnectionsProvider');
  }
  return context;
}

export default ConnectionsContext;
