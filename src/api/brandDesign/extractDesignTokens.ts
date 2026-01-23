/**
 * Design Token Extraction
 * Multi-pass Claude vision extraction logic
 */

import { callClaudeWithVision } from '../llm';
import {
  GlobalDesignResult,
  SectionsResult,
  ComponentsResult,
  DesignSystem,
  ExtractionConfidence,
  ColorPalette,
  Typography,
  Spacing,
  SectionStyle,
  ComponentStyles,
  VisualEffects,
} from '@/types/brandDesign';
import { GLOBAL_DESIGN_PROMPT, SECTIONS_PROMPT, COMPONENTS_PROMPT } from './prompts';

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
 * Calculate overall confidence from individual pass confidence scores
 */
function calculateOverallConfidence(
  colorsConfidence: number,
  typographyConfidence: number,
  sectionsConfidence: number,
  componentsConfidence: number
): ExtractionConfidence {
  // Weighted average: colors 30%, sections 25%, components 25%, typography 20%
  const overall =
    colorsConfidence * 0.3 +
    typographyConfidence * 0.2 +
    sectionsConfidence * 0.25 +
    componentsConfidence * 0.25;

  return {
    colors: colorsConfidence,
    typography: typographyConfidence,
    sections: sectionsConfidence,
    components: componentsConfidence,
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

  // Run all three passes in parallel
  const [globalResult, sectionsResult, componentsResult] = await Promise.all([
    extractGlobalDesign(imageUrl, modelId),
    extractSections(imageUrl, modelId),
    extractComponents(imageUrl, modelId),
  ]);

  onProgress?.('merging', 3);

  // Merge results into complete design system
  const designSystem: DesignSystem = {
    colors: globalResult.result.colors,
    typography: globalResult.result.typography,
    spacing: globalResult.result.spacing,
    components: componentsResult.result.components,
    sections: sectionsResult.result.sections,
    effects: componentsResult.result.effects,
  };

  // Calculate confidence
  const confidence = calculateOverallConfidence(
    globalResult.confidence,
    globalResult.confidence, // Typography is part of global pass
    sectionsResult.confidence,
    componentsResult.confidence
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

  return { designSystem, confidence, warnings };
}
