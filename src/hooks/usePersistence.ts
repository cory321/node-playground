import { useState, useEffect, useCallback } from 'react';
import { NodeData } from '@/types/nodes';
import { Connection } from '@/types/connections';
import { CanvasTransform } from '@/types/canvas';
import { SavedSetup } from '@/types/api';

const STORAGE_KEY = 'nodeBuilderSetups';

interface UsePersistenceProps {
  nodes: NodeData[];
  setNodes: React.Dispatch<React.SetStateAction<NodeData[]>>;
  connections: Connection[];
  setConnections: React.Dispatch<React.SetStateAction<Connection[]>>;
  transform: CanvasTransform;
  setTransform: React.Dispatch<React.SetStateAction<CanvasTransform>>;
}

interface UsePersistenceReturn {
  savedSetups: SavedSetup[];
  saveSetup: (name: string) => void;
  loadSetup: (setup: SavedSetup) => void;
  deleteSetup: (id: string) => void;
  exportSetup: () => void;
  importSetup: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function usePersistence({
  nodes,
  setNodes,
  connections,
  setConnections,
  transform,
  setTransform,
}: UsePersistenceProps): UsePersistenceReturn {
  const [savedSetups, setSavedSetups] = useState<SavedSetup[]>([]);

  // Load saved setups from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setSavedSetups(JSON.parse(saved));
      } catch (err) {
        console.error('Failed to parse saved setups:', err);
      }
    }
  }, []);

  // Save current setup
  const saveSetup = useCallback(
    (name: string) => {
      if (!name.trim()) return;

      const newSetup: SavedSetup = {
        id: Date.now().toString(),
        name: name.trim(),
        createdAt: new Date().toISOString(),
        nodes: nodes,
        connections: connections,
        transform: transform,
      };

      const updatedSetups = [...savedSetups, newSetup];
      setSavedSetups(updatedSetups);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSetups));
    },
    [nodes, connections, transform, savedSetups]
  );

  // Load a setup
  const loadSetup = useCallback(
    (setup: SavedSetup) => {
      setNodes(setup.nodes as NodeData[]);
      setConnections(setup.connections as Connection[]);
      if (setup.transform) {
        setTransform(setup.transform);
      }
    },
    [setNodes, setConnections, setTransform]
  );

  // Delete a setup
  const deleteSetup = useCallback(
    (id: string) => {
      const updatedSetups = savedSetups.filter((s) => s.id !== id);
      setSavedSetups(updatedSetups);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSetups));
    },
    [savedSetups]
  );

  // Export current setup to JSON file
  const exportSetup = useCallback(() => {
    const data = {
      name: 'Node Builder Export',
      exportedAt: new Date().toISOString(),
      nodes: nodes,
      connections: connections,
      transform: transform,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `node-setup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [nodes, connections, transform]);

  // Import setup from JSON file
  const importSetup = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          if (data.nodes && data.connections) {
            setNodes(data.nodes);
            setConnections(data.connections);
            if (data.transform) {
              setTransform(data.transform);
            }
          }
        } catch (err) {
          console.error('Failed to import setup:', err);
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    },
    [setNodes, setConnections, setTransform]
  );

  return {
    savedSetups,
    saveSetup,
    loadSetup,
    deleteSetup,
    exportSetup,
    importSetup,
  };
}

export default usePersistence;
