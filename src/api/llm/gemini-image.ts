import { getApiKeys } from './storage';

/**
 * Valid aspect ratios supported by Gemini 3 Pro Image API
 */
export const ASPECT_RATIO_PRESETS = [
  '1:1',   // Square
  '16:9',  // Landscape widescreen
  '9:16',  // Portrait (phone)
  '4:3',   // Landscape standard
  '3:4',   // Portrait standard
  '3:2',   // Landscape photo
  '2:3',   // Portrait photo
  '5:4',   // Landscape
  '4:5',   // Portrait (Instagram)
  '21:9',  // Ultra-wide
] as const;

/**
 * Numeric ratios for each preset (width/height)
 */
const PRESET_RATIOS: Record<string, number> = {
  '1:1': 1,
  '16:9': 16 / 9,
  '9:16': 9 / 16,
  '4:3': 4 / 3,
  '3:4': 3 / 4,
  '3:2': 3 / 2,
  '2:3': 2 / 3,
  '5:4': 5 / 4,
  '4:5': 4 / 5,
  '21:9': 21 / 9,
};

/**
 * Find the closest valid aspect ratio to a given width/height
 */
export function findClosestAspectRatio(width: number, height: number): string {
  if (width <= 0 || height <= 0) {
    return '1:1';
  }
  
  const targetRatio = width / height;
  let closestPreset = '1:1';
  let smallestDiff = Infinity;
  
  for (const [preset, ratio] of Object.entries(PRESET_RATIOS)) {
    const diff = Math.abs(ratio - targetRatio);
    if (diff < smallestDiff) {
      smallestDiff = diff;
      closestPreset = preset;
    }
  }
  
  return closestPreset;
}

/**
 * Calculate the raw aspect ratio from width and height (for display only)
 * e.g., 1440 x 4500 → "8:25"
 */
function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

export function calculateAspectRatio(width: number, height: number): string {
  if (width <= 0 || height <= 0) {
    return '1:1';
  }
  
  const divisor = gcd(width, height);
  const w = width / divisor;
  const h = height / divisor;
  
  return `${w}:${h}`;
}

interface GeminiImageRequestBody {
  contents: Array<{ parts: Array<{ text: string }> }>;
  generationConfig: {
    responseModalities: string[];
    imageConfig?: {
      aspectRatio?: string;
    };
  };
}

interface GeminiImageResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
        inlineData?: {
          mimeType: string;
          data: string; // base64 encoded
        };
      }>;
    };
  }>;
  error?: { message: string };
}

/**
 * Call Gemini Image Generation API (gemini-3-pro-image-preview)
 * 
 * @param prompt - The text prompt for image generation
 * @param aspectRatio - Aspect ratio string (e.g., "1:1", "16:9", "8:25")
 * @returns Base64-encoded image data URL
 */
export async function callGeminiImage(
  prompt: string,
  aspectRatio: string = '1:1'
): Promise<string> {
  const keys = getApiKeys();

  if (!keys.google) {
    throw new Error('Google AI API key not configured. Please add it in Settings.');
  }

  if (!prompt.trim()) {
    throw new Error('Image prompt cannot be empty.');
  }

  // Use Gemini 3 Pro Image for best quality, or gemini-2.5-flash-image for faster generation
  const modelId = 'gemini-3-pro-image-preview';

  // Build request body
  const requestBody: GeminiImageRequestBody = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseModalities: ['IMAGE', 'TEXT'],
      imageConfig: {
        aspectRatio,
      },
    },
  };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${keys.google}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    }
  );

  if (!response.ok) {
    const error: GeminiImageResponse = await response.json().catch(() => ({}));
    
    // Handle specific error codes
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please wait a moment and try again.');
    }
    if (response.status === 503) {
      throw new Error('Image generation service is temporarily unavailable. Please try again later.');
    }
    
    throw new Error(error.error?.message || `Gemini Image API error: ${response.status}`);
  }

  const data: GeminiImageResponse = await response.json();

  // Find the image part in the response
  const parts = data.candidates?.[0]?.content?.parts;
  if (!parts || parts.length === 0) {
    throw new Error('No image generated. The model may have refused the request.');
  }

  // Look for inline image data
  const imagePart = parts.find((part) => part.inlineData?.data);
  if (!imagePart?.inlineData) {
    // Check if there's a text response explaining why no image was generated
    const textPart = parts.find((part) => part.text);
    if (textPart?.text) {
      throw new Error(`Image generation failed: ${textPart.text}`);
    }
    throw new Error('No image data in response.');
  }

  // Return as data URL
  const { mimeType, data: base64Data } = imagePart.inlineData;
  return `data:${mimeType};base64,${base64Data}`;
}
