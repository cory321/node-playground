/**
 * Tailwind Config Generator
 * Converts design tokens to Tailwind extend configuration
 */

import {
  DesignSystem,
  TailwindConfig,
  TailwindColorConfig,
  ColorToken,
} from '@/types/brandDesign';

/**
 * Convert a color token to Tailwind format
 */
function colorTokenToHex(token: ColorToken | string | undefined): string | undefined {
  if (!token) return undefined;
  if (typeof token === 'string') return token;
  return token.hex;
}

/**
 * Generate Tailwind color configuration from design system colors
 */
function generateColorConfig(colors: DesignSystem['colors']): TailwindColorConfig {
  const config: TailwindColorConfig = {};

  // Primary color
  if (colors.primary) {
    const hex = colorTokenToHex(colors.primary);
    if (hex) {
      config.primary = {
        DEFAULT: hex,
        50: adjustBrightness(hex, 0.95),
        100: adjustBrightness(hex, 0.9),
        200: adjustBrightness(hex, 0.75),
        300: adjustBrightness(hex, 0.6),
        400: adjustBrightness(hex, 0.4),
        500: hex,
        600: adjustBrightness(hex, -0.1),
        700: adjustBrightness(hex, -0.2),
        800: adjustBrightness(hex, -0.3),
        900: adjustBrightness(hex, -0.4),
      };
    }
  }

  // Secondary color
  if (colors.secondary) {
    const hex = colorTokenToHex(colors.secondary);
    if (hex) {
      config.secondary = {
        DEFAULT: hex,
        light: adjustBrightness(hex, 0.3),
        dark: adjustBrightness(hex, -0.2),
      };
    }
  }

  // Accent color
  if (colors.accent) {
    const hex = colorTokenToHex(colors.accent);
    if (hex) {
      config.accent = {
        DEFAULT: hex,
        light: adjustBrightness(hex, 0.3),
        dark: adjustBrightness(hex, -0.2),
      };
    }
  }

  // Background colors
  if (colors.backgrounds) {
    config.background = {};
    if (colors.backgrounds.main) config.background.DEFAULT = colors.backgrounds.main;
    if (colors.backgrounds.section) config.background.section = colors.backgrounds.section;
    if (colors.backgrounds.card) config.background.card = colors.backgrounds.card;
    if (colors.backgrounds.footer) config.background.footer = colors.backgrounds.footer;
  }

  // Text/foreground colors
  if (colors.text) {
    config.foreground = {};
    if (colors.text.primary) config.foreground.DEFAULT = colors.text.primary;
    if (colors.text.secondary) config.foreground.secondary = colors.text.secondary;
    if (colors.text.muted) config.foreground.muted = colors.text.muted;
    if (colors.text.inverse) config.foreground.inverse = colors.text.inverse;
  }

  return config;
}

/**
 * Adjust brightness of a hex color
 */
function adjustBrightness(hex: string, factor: number): string {
  // Parse hex to RGB
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  // Adjust based on factor (positive = lighter, negative = darker)
  const adjust = (value: number): number => {
    if (factor > 0) {
      return Math.round(value + (255 - value) * factor);
    } else {
      return Math.round(value * (1 + factor));
    }
  };

  const newR = Math.min(255, Math.max(0, adjust(r)));
  const newG = Math.min(255, Math.max(0, adjust(g)));
  const newB = Math.min(255, Math.max(0, adjust(b)));

  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

/**
 * Generate font family configuration
 */
function generateFontFamilyConfig(
  typography: DesignSystem['typography']
): Record<string, string[]> {
  const config: Record<string, string[]> = {};

  if (typography.fontFamily.heading?.name) {
    config.heading = [
      typography.fontFamily.heading.name,
      getFallbackFonts(typography.fontFamily.heading.category),
    ].flat();
  }

  if (typography.fontFamily.body?.name) {
    config.body = [
      typography.fontFamily.body.name,
      getFallbackFonts(typography.fontFamily.body.category),
    ].flat();
  }

  return config;
}

/**
 * Get fallback fonts for a font category
 */
function getFallbackFonts(category: string): string[] {
  switch (category) {
    case 'serif':
      return ['Georgia', 'Times New Roman', 'serif'];
    case 'monospace':
      return ['Menlo', 'Monaco', 'monospace'];
    case 'display':
      return ['system-ui', 'sans-serif'];
    default:
      return ['system-ui', '-apple-system', 'sans-serif'];
  }
}

/**
 * Generate font size configuration
 */
function generateFontSizeConfig(
  typography: DesignSystem['typography']
): Record<string, string | [string, { lineHeight?: string }]> {
  const config: Record<string, string | [string, { lineHeight?: string }]> = {};
  const lineHeight = typography.lineHeight?.normal || '1.5';

  if (typography.scale.h1) {
    config.h1 = [typography.scale.h1, { lineHeight: typography.lineHeight?.tight || '1.2' }];
  }
  if (typography.scale.h2) {
    config.h2 = [typography.scale.h2, { lineHeight: typography.lineHeight?.tight || '1.25' }];
  }
  if (typography.scale.h3) {
    config.h3 = [typography.scale.h3, { lineHeight: '1.3' }];
  }
  if (typography.scale.h4) {
    config.h4 = [typography.scale.h4, { lineHeight: '1.35' }];
  }
  if (typography.scale.body) {
    config.body = [typography.scale.body, { lineHeight }];
  }
  if (typography.scale.small) {
    config.small = typography.scale.small;
  }
  if (typography.scale.caption) {
    config.caption = typography.scale.caption;
  }

  return config;
}

/**
 * Generate spacing configuration
 */
function generateSpacingConfig(
  spacing: DesignSystem['spacing']
): Record<string, string> {
  const config: Record<string, string> = {};

  // Section padding
  if (spacing.sectionPadding.y) {
    config['section-y'] = spacing.sectionPadding.y;
  }
  if (spacing.sectionPadding.x) {
    config['section-x'] = spacing.sectionPadding.x;
  }

  // Grid gap
  if (spacing.gridGap) {
    config.grid = spacing.gridGap;
  }

  // Element spacing
  if (spacing.elementSpacing) {
    if (spacing.elementSpacing.xs) config['element-xs'] = spacing.elementSpacing.xs;
    if (spacing.elementSpacing.sm) config['element-sm'] = spacing.elementSpacing.sm;
    if (spacing.elementSpacing.md) config['element-md'] = spacing.elementSpacing.md;
    if (spacing.elementSpacing.lg) config['element-lg'] = spacing.elementSpacing.lg;
    if (spacing.elementSpacing.xl) config['element-xl'] = spacing.elementSpacing.xl;
  }

  return config;
}

/**
 * Generate border radius configuration
 */
function generateBorderRadiusConfig(
  effects: DesignSystem['effects']
): Record<string, string> | undefined {
  if (!effects?.borderRadius) return undefined;

  const config: Record<string, string> = {};

  if (effects.borderRadius.sm) config.sm = effects.borderRadius.sm;
  if (effects.borderRadius.md) config.md = effects.borderRadius.md;
  if (effects.borderRadius.lg) config.lg = effects.borderRadius.lg;
  if (effects.borderRadius.full) config.full = effects.borderRadius.full;

  return Object.keys(config).length > 0 ? config : undefined;
}

/**
 * Generate box shadow configuration
 */
function generateBoxShadowConfig(
  effects: DesignSystem['effects']
): Record<string, string> | undefined {
  if (!effects?.shadows) return undefined;

  const config: Record<string, string> = {};

  if (effects.shadows.sm) config.sm = effects.shadows.sm;
  if (effects.shadows.md) config.md = effects.shadows.md;
  if (effects.shadows.lg) config.lg = effects.shadows.lg;
  if (effects.shadows.card) config.card = effects.shadows.card;

  return Object.keys(config).length > 0 ? config : undefined;
}

/**
 * Generate max-width configuration
 */
function generateMaxWidthConfig(
  spacing: DesignSystem['spacing']
): Record<string, string> | undefined {
  if (!spacing.contentMaxWidth) return undefined;

  return {
    content: spacing.contentMaxWidth,
  };
}

/**
 * Generate complete Tailwind configuration from design system
 */
export function generateTailwindConfig(designSystem: DesignSystem): TailwindConfig {
  const config: TailwindConfig = {
    theme: {
      extend: {},
    },
  };

  // Generate colors
  const colorConfig = generateColorConfig(designSystem.colors);
  if (Object.keys(colorConfig).length > 0) {
    config.theme.extend.colors = colorConfig;
  }

  // Generate font families
  const fontFamilyConfig = generateFontFamilyConfig(designSystem.typography);
  if (Object.keys(fontFamilyConfig).length > 0) {
    config.theme.extend.fontFamily = fontFamilyConfig;
  }

  // Generate font sizes
  const fontSizeConfig = generateFontSizeConfig(designSystem.typography);
  if (Object.keys(fontSizeConfig).length > 0) {
    config.theme.extend.fontSize = fontSizeConfig;
  }

  // Generate spacing
  const spacingConfig = generateSpacingConfig(designSystem.spacing);
  if (Object.keys(spacingConfig).length > 0) {
    config.theme.extend.spacing = spacingConfig;
  }

  // Generate border radius
  const borderRadiusConfig = generateBorderRadiusConfig(designSystem.effects);
  if (borderRadiusConfig) {
    config.theme.extend.borderRadius = borderRadiusConfig;
  }

  // Generate box shadows
  const boxShadowConfig = generateBoxShadowConfig(designSystem.effects);
  if (boxShadowConfig) {
    config.theme.extend.boxShadow = boxShadowConfig;
  }

  // Generate max-width
  const maxWidthConfig = generateMaxWidthConfig(designSystem.spacing);
  if (maxWidthConfig) {
    config.theme.extend.maxWidth = maxWidthConfig;
  }

  return config;
}

/**
 * Convert Tailwind config to formatted string for display/export
 */
export function tailwindConfigToString(config: TailwindConfig): string {
  return JSON.stringify(config, null, 2);
}
