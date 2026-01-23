/**
 * Brand Design API
 * Main entry point for design token extraction
 */

import {
  BrandDesignOutput,
  ExtractionPhase,
  ExtractionProgress,
} from '@/types/brandDesign';
import { extractDesignSystem } from './extractDesignTokens';
import { generateTailwindConfig, tailwindConfigToString } from './generateTailwindConfig';

// Re-export utilities
export { generateTailwindConfig, tailwindConfigToString } from './generateTailwindConfig';
export { extractDesignSystem } from './extractDesignTokens';
export { getExtractionPrompts } from './prompts';

/**
 * Progress callback type
 */
export type ProgressCallback = (progress: ExtractionProgress) => void;

/**
 * Main extraction function
 * Takes a screenshot URL and returns complete brand design output
 */
export async function extractBrandDesign(
  screenshotUrl: string,
  onProgress?: ProgressCallback,
  options: {
    modelId?: string;
  } = {}
): Promise<BrandDesignOutput> {
  const { modelId = 'claude-sonnet-4-5-20250929' } = options;

  // Track progress
  const updateProgress = (phase: ExtractionPhase, passesComplete: number, currentPassName?: string) => {
    onProgress?.({
      phase,
      passesComplete,
      totalPasses: 3,
      currentPassName,
    });
  };

  updateProgress('preparing', 0, 'Initializing extraction...');

  // Extract design system with multi-pass approach
  const { designSystem, confidence, warnings } = await extractDesignSystem(
    screenshotUrl,
    (phase, passesComplete) => {
      updateProgress(
        phase as ExtractionPhase,
        passesComplete,
        phase === 'extracting-global' ? 'Colors & Typography' :
        phase === 'extracting-sections' ? 'Section Layout' :
        phase === 'extracting-components' ? 'UI Components' :
        phase === 'merging' ? 'Merging results...' : undefined
      );
    },
    modelId
  );

  updateProgress('generating-tailwind', 3, 'Generating Tailwind config...');

  // Generate Tailwind configuration
  const tailwindConfig = generateTailwindConfig(designSystem);

  updateProgress('complete', 3);

  // Build complete output
  const output: BrandDesignOutput = {
    screenshot: {
      url: screenshotUrl,
    },
    designSystem,
    tailwindConfig,
    meta: {
      extractedAt: Date.now(),
      modelId,
      passes: {
        global: true,
        sections: true,
        components: true,
      },
      confidence,
      warnings: warnings.length > 0 ? warnings : undefined,
    },
  };

  return output;
}

/**
 * Quick color-only extraction (for faster previews)
 */
export async function extractColorsOnly(
  screenshotUrl: string,
  modelId: string = 'claude-sonnet-4-5-20250929'
): Promise<{
  primary: string;
  secondary?: string;
  accent?: string;
  background: string;
  text: string;
}> {
  const { designSystem } = await extractDesignSystem(screenshotUrl, undefined, modelId);
  
  return {
    primary: designSystem.colors.primary?.hex || '#3b82f6',
    secondary: designSystem.colors.secondary?.hex,
    accent: designSystem.colors.accent?.hex,
    background: designSystem.colors.backgrounds?.main || '#ffffff',
    text: designSystem.colors.text?.primary || '#1f2937',
  };
}
