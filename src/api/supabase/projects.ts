import { supabase, hasSupabase, ProjectRow } from './client';
import { NodeData } from '@/types/nodes';
import { Connection } from '@/types/connections';
import { CanvasTransform } from '@/types/canvas';

// Project data for saving
export interface ProjectData {
  id: string;
  name: string;
  nodes: NodeData[];
  connections: Connection[];
  transform: CanvasTransform | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get all saved projects, sorted by most recently updated
 */
export async function getProjects(): Promise<ProjectData[]> {
  if (!hasSupabase() || !supabase) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
      return [];
    }

    return (data as ProjectRow[]).map((row) => ({
      id: row.id,
      name: row.name,
      nodes: row.nodes as unknown as NodeData[],
      connections: row.connections as unknown as Connection[],
      transform: row.transform,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  } catch (err) {
    console.error('Error fetching projects:', err);
    return [];
  }
}

/**
 * Get a specific project by ID
 */
export async function getProject(id: string): Promise<ProjectData | null> {
  if (!hasSupabase() || !supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) {
      console.error('Error fetching project:', error);
      return null;
    }

    const row = data as ProjectRow;
    return {
      id: row.id,
      name: row.name,
      nodes: row.nodes as unknown as NodeData[],
      connections: row.connections as unknown as Connection[],
      transform: row.transform,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  } catch (err) {
    console.error('Error fetching project:', err);
    return null;
  }
}

/**
 * Save a new project
 */
export async function saveProject(
  name: string,
  nodes: NodeData[],
  connections: Connection[],
  transform: CanvasTransform | null
): Promise<ProjectData | null> {
  if (!hasSupabase() || !supabase) {
    console.warn('Supabase not configured, cannot save project');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('projects')
      .insert({
        name,
        nodes: nodes as unknown as Record<string, unknown>[],
        connections: connections as unknown as Record<string, unknown>[],
        transform,
      })
      .select()
      .single();

    if (error || !data) {
      console.error('Error saving project:', error);
      return null;
    }

    const row = data as ProjectRow;
    return {
      id: row.id,
      name: row.name,
      nodes: row.nodes as unknown as NodeData[],
      connections: row.connections as unknown as Connection[],
      transform: row.transform,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  } catch (err) {
    console.error('Error saving project:', err);
    return null;
  }
}

/**
 * Update an existing project
 */
export async function updateProject(
  id: string,
  updates: {
    name?: string;
    nodes?: NodeData[];
    connections?: Connection[];
    transform?: CanvasTransform | null;
  }
): Promise<ProjectData | null> {
  if (!hasSupabase() || !supabase) {
    console.warn('Supabase not configured, cannot update project');
    return null;
  }

  try {
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.name !== undefined) {
      updateData.name = updates.name;
    }
    if (updates.nodes !== undefined) {
      updateData.nodes = updates.nodes as unknown as Record<string, unknown>[];
    }
    if (updates.connections !== undefined) {
      updateData.connections = updates.connections as unknown as Record<string, unknown>[];
    }
    if (updates.transform !== undefined) {
      updateData.transform = updates.transform;
    }

    const { data, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      console.error('Error updating project:', error);
      return null;
    }

    const row = data as ProjectRow;
    return {
      id: row.id,
      name: row.name,
      nodes: row.nodes as unknown as NodeData[],
      connections: row.connections as unknown as Connection[],
      transform: row.transform,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  } catch (err) {
    console.error('Error updating project:', err);
    return null;
  }
}

/**
 * Delete a project
 */
export async function deleteProject(id: string): Promise<boolean> {
  if (!hasSupabase() || !supabase) {
    console.warn('Supabase not configured, cannot delete project');
    return false;
  }

  try {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting project:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Error deleting project:', err);
    return false;
  }
}
