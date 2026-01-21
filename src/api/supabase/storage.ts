import { supabase, hasSupabase } from './client';

// Types for generated images
export interface GeneratedImage {
  id: string;
  storage_path: string;
  public_url: string;
  prompt: string;
  aspect_ratio: string;
  node_id: string | null;
  created_at: string;
}

const BUCKET_NAME = 'generated-images';

/**
 * Convert a base64 data URL to a Blob
 */
function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64Data] = dataUrl.split(',');
  const mimeMatch = header.match(/:(.*?);/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
  
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  
  return new Blob([byteArray], { type: mimeType });
}

/**
 * Generate a unique filename for the image
 */
function generateFilename(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}.png`;
}

/**
 * Upload an image to Supabase Storage and save metadata
 */
export async function uploadGeneratedImage(
  dataUrl: string,
  prompt: string,
  aspectRatio: string,
  nodeId?: string
): Promise<GeneratedImage | null> {
  if (!hasSupabase() || !supabase) {
    console.warn('Supabase not configured, cannot upload image');
    return null;
  }

  try {
    // Convert data URL to blob
    const blob = dataUrlToBlob(dataUrl);
    const filename = generateFilename();
    const storagePath = filename;

    // Upload to storage bucket
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, blob, {
        contentType: 'image/png',
        cacheControl: '31536000', // 1 year cache
        upsert: false,
      });

    if (uploadError) {
      console.error('Failed to upload image:', uploadError);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(storagePath);

    const publicUrl = urlData.publicUrl;

    // Save metadata to database
    const { data: metadata, error: metadataError } = await supabase
      .from('generated_images')
      .insert({
        storage_path: storagePath,
        public_url: publicUrl,
        prompt,
        aspect_ratio: aspectRatio,
        node_id: nodeId || null,
      })
      .select()
      .single();

    if (metadataError) {
      console.error('Failed to save image metadata:', metadataError);
      // Try to clean up the uploaded file
      await supabase.storage.from(BUCKET_NAME).remove([storagePath]);
      return null;
    }

    return metadata as GeneratedImage;
  } catch (error) {
    console.error('Error uploading image:', error);
    return null;
  }
}

/**
 * List all generated images, sorted by most recent first
 */
export async function listGeneratedImages(): Promise<GeneratedImage[]> {
  if (!hasSupabase() || !supabase) {
    console.warn('Supabase not configured, cannot list images');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('generated_images')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to list images:', error);
      return [];
    }

    return (data || []) as GeneratedImage[];
  } catch (error) {
    console.error('Error listing images:', error);
    return [];
  }
}

/**
 * Delete a generated image from storage and database
 */
export async function deleteGeneratedImage(id: string, storagePath: string): Promise<boolean> {
  if (!hasSupabase() || !supabase) {
    console.warn('Supabase not configured, cannot delete image');
    return false;
  }

  try {
    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([storagePath]);

    if (storageError) {
      console.error('Failed to delete image from storage:', storageError);
      // Continue to try deleting metadata anyway
    }

    // Delete metadata from database
    const { error: dbError } = await supabase
      .from('generated_images')
      .delete()
      .eq('id', id);

    if (dbError) {
      console.error('Failed to delete image metadata:', dbError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
}

/**
 * Check if image storage is available
 */
export function hasImageStorage(): boolean {
  return hasSupabase();
}
