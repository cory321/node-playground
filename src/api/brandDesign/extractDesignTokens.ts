/**
 * Design Token Extraction
 * Multi-pass Claude vision extraction logic
 */

import { callClaudeWithVision } from '../llm';
import {
  GlobalDesignResult,
  SectionsResult,
  ComponentsResult,
  VisualAssetsResult,
  DesignSystem,
  ExtractionConfidence,
  ColorPalette,
  Typography,
  Spacing,
  SectionStyle,
  ComponentStyles,
  VisualEffects,
  PhotographyStyle,
  GraphicsStyle,
  IconStyle,
  VisualAssets,
} from '@/types/brandDesign';
import { GLOBAL_DESIGN_PROMPT, SECTIONS_PROMPT, COMPONENTS_PROMPT, VISUAL_ASSETS_PROMPT } from './prompts';

// Default values for fallbacks
const DEFAULT_COLORS: ColorPalette = {
  primary: { hex: '#3b82f6', name: 'Blue', usage: 'Primary actions' },
  backgrounds: { main: '#ffffff' },
  text: { primary: '#1f2937' },
};

const DEFAULT_TYPOGRAPHY: Typography = {
  fontFamily: {
    heading: { name: 'Inter', category: 'sans-serif' },
    body: { name: 'Inter', category: 'sans-serif' },
  },
  scale: {
    h1: '3rem',
    h2: '2.25rem',
    h3: '1.5rem',
    h4: '1.25rem',
    body: '1rem',
  },
};

const DEFAULT_SPACING: Spacing = {
  sectionPadding: { y: '4rem' },
  contentMaxWidth: '1280px',
  gridGap: '2rem',
  elementSpacing: { sm: '0.5rem', md: '1rem', lg: '2rem' },
};

const DEFAULT_PHOTOGRAPHY: PhotographyStyle = {
  lighting: ['natural', 'soft'],
  composition: ['centered', 'balanced'],
  mood: 'professional and approachable',
  colorGrading: 'natural tones with slight warmth',
  subjectMatter: ['people', 'workspaces', 'products'],
  depthOfField: 'moderate depth with subtle background blur',
  description: 'Clean, professional photography with natural lighting. Images feature real people in authentic settings with a warm, inviting atmosphere. Colors are true-to-life with subtle enhancement for vibrancy.',
};

const DEFAULT_GRAPHICS: GraphicsStyle = {
  illustrationStyle: 'flat geometric',
  patterns: ['subtle gradients'],
  decorativeElements: ['rounded shapes', 'soft shadows'],
  mood: 'modern and clean',
  colorUsage: 'brand colors with gradient accents',
  description: 'Modern flat design aesthetic with clean geometric shapes. Uses brand colors in subtle gradients and soft shadow effects to create depth without being heavy.',
};

const DEFAULT_ICONS: IconStyle = {
  style: 'outline',
  strokeWeight: '1.5px',
  cornerStyle: 'rounded',
  suggestedLibrary: 'Lucide',
  description: 'Clean outline icons with consistent stroke weight and rounded corners for a friendly, approachable feel.',
};

const DEFAULT_VISUAL_ASSETS: VisualAssets = {
  photography: DEFAULT_PHOTOGRAPHY,
  graphics: DEFAULT_GRAPHICS,
  icons: DEFAULT_ICONS,
};

/**
 * Parse JSON from Claude response, handling markdown code blocks
 */
function parseJsonResponse<T>(response: string): T {
  // Remove markdown code blocks if present
  let cleaned = response.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  cleaned = cleaned.trim();

  return JSON.parse(cleaned);
}

/**
 * Validate hex color format
 */
function isValidHex(color: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}

/**
 * Extract global design system (colors, typography, spacing)
 */
export async function extractGlobalDesign(
  imageUrl: string,
  modelId: string = 'claude-sonnet-4-5-20250929'
): Promise<{ result: GlobalDesignResult; confidence: number }> {
  try {
    const response = await callClaudeWithVision(GLOBAL_DESIGN_PROMPT, imageUrl, modelId);
    const parsed = parseJsonResponse<GlobalDesignResult>(response);

    // Validate and calculate confidence
    let confidence = 1.0;
    const warnings: string[] = [];

    // Check colors
    if (!parsed.colors?.primary?.hex || !isValidHex(parsed.colors.primary.hex)) {
      warnings.push('Invalid primary color');
      confidence -= 0.2;
    }
    if (!parsed.colors?.backgrounds?.main) {
      warnings.push('Missing main background');
      confidence -= 0.1;
    }
    if (!parsed.colors?.text?.primary) {
      warnings.push('Missing primary text color');
      confidence -= 0.1;
    }

    // Check typography
    if (!parsed.typography?.fontFamily?.heading?.name) {
      warnings.push('Missing heading font');
      confidence -= 0.1;
    }
    if (!parsed.typography?.scale?.h1) {
      warnings.push('Missing type scale');
      confidence -= 0.1;
    }

    return {
      result: {
        colors: parsed.colors || DEFAULT_COLORS,
        typography: parsed.typography || DEFAULT_TYPOGRAPHY,
        spacing: parsed.spacing || DEFAULT_SPACING,
      },
      confidence: Math.max(0.3, confidence),
    };
  } catch (error) {
    console.error('Error extracting global design:', error);
    return {
      result: {
        colors: DEFAULT_COLORS,
        typography: DEFAULT_TYPOGRAPHY,
        spacing: DEFAULT_SPACING,
      },
      confidence: 0.3,
    };
  }
}

/**
 * Extract section inventory
 */
export async function extractSections(
  imageUrl: string,
  modelId: string = 'claude-sonnet-4-5-20250929'
): Promise<{ result: SectionsResult; confidence: number }> {
  try {
    const response = await callClaudeWithVision(SECTIONS_PROMPT, imageUrl, modelId);
    const parsed = parseJsonResponse<SectionsResult>(response);

    // Validate sections
    let confidence = 1.0;

    if (!parsed.sections || !Array.isArray(parsed.sections)) {
      return { result: { sections: [] }, confidence: 0.3 };
    }

    // Check for minimum sections (expecting at least 5 for a full page)
    if (parsed.sections.length < 3) {
      confidence -= 0.2;
    } else if (parsed.sections.length < 5) {
      confidence -= 0.1;
    }

    // Validate each section has required fields
    const validSections = parsed.sections.filter(
      (s): s is SectionStyle => 
        typeof s.name === 'string' && 
        typeof s.background === 'string' &&
        typeof s.index === 'number'
    );

    if (validSections.length < parsed.sections.length) {
      confidence -= 0.1 * (parsed.sections.length - validSections.length);
    }

    return {
      result: { sections: validSections },
      confidence: Math.max(0.3, confidence),
    };
  } catch (error) {
    console.error('Error extracting sections:', error);
    return { result: { sections: [] }, confidence: 0.3 };
  }
}

/**
 * Extract component patterns
 */
export async function extractComponents(
  imageUrl: string,
  modelId: string = 'claude-sonnet-4-5-20250929'
): Promise<{ result: ComponentsResult; confidence: number }> {
  const DEFAULT_COMPONENTS: ComponentStyles = {
    buttons: {
      primary: {
        variant: 'solid',
        background: '#3b82f6',
        textColor: '#ffffff',
        padding: 'px-6 py-3',
        borderRadius: '0.5rem',
      },
    },
  };

  try {
    const response = await callClaudeWithVision(COMPONENTS_PROMPT, imageUrl, modelId);
    const parsed = parseJsonResponse<ComponentsResult>(response);

    let confidence = 1.0;

    // Check for button styles
    if (!parsed.components?.buttons?.primary) {
      confidence -= 0.2;
    }

    // Check for any cards
    if (!parsed.components?.cards || parsed.components.cards.length === 0) {
      confidence -= 0.1;
    }

    return {
      result: {
        components: parsed.components || DEFAULT_COMPONENTS,
        effects: parsed.effects,
      },
      confidence: Math.max(0.3, confidence),
    };
  } catch (error) {
    console.error('Error extracting components:', error);
    return {
      result: { components: DEFAULT_COMPONENTS },
      confidence: 0.3,
    };
  }
}

/**
 * Extract visual assets (photography, graphics, icons)
 */
export async function extractVisualAssets(
  imageUrl: string,
  modelId: string = 'claude-sonnet-4-5-20250929'
): Promise<{ result: VisualAssetsResult; confidence: number }> {
  try {
    const response = await callClaudeWithVision(VISUAL_ASSETS_PROMPT, imageUrl, modelId);
    const parsed = parseJsonResponse<VisualAssetsResult>(response);

    let confidence = 1.0;

    // Check photography fields
    if (!parsed.photography?.description) {
      confidence -= 0.15;
    }
    if (!parsed.photography?.mood) {
      confidence -= 0.1;
    }
    if (!parsed.photography?.lighting || parsed.photography.lighting.length === 0) {
      confidence -= 0.1;
    }

    // Check graphics fields
    if (!parsed.graphics?.description) {
      confidence -= 0.15;
    }
    if (!parsed.graphics?.illustrationStyle) {
      confidence -= 0.1;
    }

    // Check icons fields
    if (!parsed.icons?.style) {
      confidence -= 0.1;
    }
    if (!parsed.icons?.suggestedLibrary) {
      confidence -= 0.05;
    }

    // Ensure all required fields have values, using defaults if needed
    const result: VisualAssetsResult = {
      photography: {
        lighting: parsed.photography?.lighting || DEFAULT_PHOTOGRAPHY.lighting,
        composition: parsed.photography?.composition || DEFAULT_PHOTOGRAPHY.composition,
        mood: parsed.photography?.mood || DEFAULT_PHOTOGRAPHY.mood,
        colorGrading: parsed.photography?.colorGrading || DEFAULT_PHOTOGRAPHY.colorGrading,
        subjectMatter: parsed.photography?.subjectMatter || DEFAULT_PHOTOGRAPHY.subjectMatter,
        depthOfField: parsed.photography?.depthOfField || DEFAULT_PHOTOGRAPHY.depthOfField,
        description: parsed.photography?.description || DEFAULT_PHOTOGRAPHY.description,
      },
      graphics: {
        illustrationStyle: parsed.graphics?.illustrationStyle || DEFAULT_GRAPHICS.illustrationStyle,
        patterns: parsed.graphics?.patterns || DEFAULT_GRAPHICS.patterns,
        decorativeElements: parsed.graphics?.decorativeElements || DEFAULT_GRAPHICS.decorativeElements,
        mood: parsed.graphics?.mood || DEFAULT_GRAPHICS.mood,
        colorUsage: parsed.graphics?.colorUsage || DEFAULT_GRAPHICS.colorUsage,
        description: parsed.graphics?.description || DEFAULT_GRAPHICS.description,
      },
      icons: {
        style: parsed.icons?.style || DEFAULT_ICONS.style,
        strokeWeight: parsed.icons?.strokeWeight || DEFAULT_ICONS.strokeWeight,
        cornerStyle: parsed.icons?.cornerStyle || DEFAULT_ICONS.cornerStyle,
        suggestedLibrary: parsed.icons?.suggestedLibrary || DEFAULT_ICONS.suggestedLibrary,
        description: parsed.icons?.description || DEFAULT_ICONS.description,
      },
    };

    return {
      result,
      confidence: Math.max(0.3, confidence),
    };
  } catch (error) {
    console.error('Error extracting visual assets:', error);
    return {
      result: DEFAULT_VISUAL_ASSETS,
      confidence: 0.3,
    };
  }
}

/**
 * Calculate overall confidence from individual pass confidence scores
 */
function calculateOverallConfidence(
  colorsConfidence: number,
  typographyConfidence: number,
  sectionsConfidence: number,
  componentsConfidence: number,
  visualAssetsConfidence: number
): ExtractionConfidence {
  // Weighted average: colors 25%, sections 20%, components 20%, typography 15%, visualAssets 20%
  const overall =
    colorsConfidence * 0.25 +
    typographyConfidence * 0.15 +
    sectionsConfidence * 0.2 +
    componentsConfidence * 0.2 +
    visualAssetsConfidence * 0.2;

  return {
    colors: colorsConfidence,
    typography: typographyConfidence,
    sections: sectionsConfidence,
    components: componentsConfidence,
    visualAssets: visualAssetsConfidence,
    overall: Math.round(overall * 100) / 100,
  };
}

/**
 * Run all extraction passes and merge results
 */
export async function extractDesignSystem(
  imageUrl: string,
  onProgress?: (phase: string, passesComplete: number) => void,
  modelId: string = 'claude-sonnet-4-5-20250929'
): Promise<{
  designSystem: DesignSystem;
  confidence: ExtractionConfidence;
  warnings: string[];
}> {
  const warnings: string[] = [];

  onProgress?.('extracting-global', 0);

  // Run all four passes in parallel
  const [globalResult, sectionsResult, componentsResult, visualAssetsResult] = await Promise.all([
    extractGlobalDesign(imageUrl, modelId),
    extractSections(imageUrl, modelId),
    extractComponents(imageUrl, modelId),
    extractVisualAssets(imageUrl, modelId),
  ]);

  onProgress?.('merging', 4);

  // Merge results into complete design system
  const designSystem: DesignSystem = {
    colors: globalResult.result.colors,
    typography: globalResult.result.typography,
    spacing: globalResult.result.spacing,
    components: componentsResult.result.components,
    sections: sectionsResult.result.sections,
    effects: componentsResult.result.effects,
    visualAssets: {
      photography: visualAssetsResult.result.photography,
      graphics: visualAssetsResult.result.graphics,
      icons: visualAssetsResult.result.icons,
    },
  };

  // Calculate confidence
  const confidence = calculateOverallConfidence(
    globalResult.confidence,
    globalResult.confidence, // Typography is part of global pass
    sectionsResult.confidence,
    componentsResult.confidence,
    visualAssetsResult.confidence
  );

  // Add warnings for low confidence areas
  if (confidence.colors < 0.7) {
    warnings.push('Color extraction may be incomplete');
  }
  if (confidence.sections < 0.7) {
    warnings.push('Some sections may not have been detected');
  }
  if (confidence.components < 0.7) {
    warnings.push('Component styles may need manual review');
  }
  if (confidence.visualAssets < 0.7) {
    warnings.push('Visual asset descriptions may need refinement');
  }

  return { designSystem, confidence, warnings };
}
