// Re-export Supabase client and types
export { supabase, hasSupabase } from './client';
export type { SerpCacheRow, ScanResultRow, ProviderCacheRow, ProjectRow } from './client';

// Re-export project persistence functions
export {
  getProjects,
  getProject,
  saveProject,
  updateProject,
  deleteProject,
} from './projects';
export type { ProjectData } from './projects';

// Re-export image storage functions
export {
  uploadGeneratedImage,
  listGeneratedImages,
  deleteGeneratedImage,
  hasImageStorage,
} from './storage';
export type { GeneratedImage } from './storage';
