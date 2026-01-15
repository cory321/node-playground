import { useState, useEffect, useCallback } from 'react';
import { NodeData } from '@/types/nodes';
import { Connection } from '@/types/connections';
import { CanvasTransform } from '@/types/canvas';
import { SavedSetup } from '@/types/api';
import {
  getProjects,
  saveProject,
  deleteProject as deleteProjectApi,
  hasSupabase,
  ProjectData,
} from '@/api/supabase';

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
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  saveSetup: (name: string) => Promise<boolean>;
  loadSetup: (setup: SavedSetup) => void;
  deleteSetup: (id: string) => Promise<boolean>;
  exportSetup: () => void;
  importSetup: (e: React.ChangeEvent<HTMLInputElement>) => void;
  refreshSetups: () => Promise<void>;
  hasCloudStorage: boolean;
}

// Convert ProjectData to SavedSetup format for backwards compatibility
function projectToSetup(project: ProjectData): SavedSetup {
  return {
    id: project.id,
    name: project.name,
    createdAt: project.createdAt,
    nodes: project.nodes as unknown[],
    connections: project.connections as unknown[],
    transform: project.transform ?? undefined,
  };
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
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasCloudStorage = hasSupabase();

  // Load saved setups from Supabase on mount
  const refreshSetups = useCallback(async () => {
    if (!hasCloudStorage) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const projects = await getProjects();
      setSavedSetups(projects.map(projectToSetup));
    } catch (err) {
      console.error('Failed to load projects:', err);
      setError('Failed to load saved projects');
    } finally {
      setIsLoading(false);
    }
  }, [hasCloudStorage]);

  useEffect(() => {
    refreshSetups();
  }, [refreshSetups]);

  // Save current setup to Supabase
  const saveSetup = useCallback(
    async (name: string): Promise<boolean> => {
      if (!name.trim()) return false;

      if (!hasCloudStorage) {
        setError('Supabase not configured. Please add credentials to .env');
        return false;
      }

      setIsSaving(true);
      setError(null);

      try {
        const result = await saveProject(name.trim(), nodes, connections, transform);

        if (!result) {
          setError('Failed to save project');
          return false;
        }

        // Refresh the list to include the new project
        await refreshSetups();
        return true;
      } catch (err) {
        console.error('Failed to save project:', err);
        setError('Failed to save project');
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [nodes, connections, transform, hasCloudStorage, refreshSetups]
  );

  // Load a setup (synchronous - data already fetched)
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

  // Delete a setup from Supabase
  const deleteSetup = useCallback(
    async (id: string): Promise<boolean> => {
      if (!hasCloudStorage) {
        setError('Supabase not configured');
        return false;
      }

      setError(null);

      try {
        const success = await deleteProjectApi(id);

        if (!success) {
          setError('Failed to delete project');
          return false;
        }

        // Update local state immediately
        setSavedSetups((prev) => prev.filter((s) => s.id !== id));
        return true;
      } catch (err) {
        console.error('Failed to delete project:', err);
        setError('Failed to delete project');
        return false;
      }
    },
    [hasCloudStorage]
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
    isLoading,
    isSaving,
    error,
    saveSetup,
    loadSetup,
    deleteSetup,
    exportSetup,
    importSetup,
    refreshSetups,
    hasCloudStorage,
  };
}

export default usePersistence;
