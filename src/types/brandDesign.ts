/**
 * Brand Design System Types
 * Defines the complete design token structure extracted from screenshots
 */

// ============================================
// COLOR SYSTEM
// ============================================

export interface ColorToken {
  hex: string;
  name?: string;
  usage?: string;
}

export interface ColorPalette {
  primary: ColorToken;
  secondary?: ColorToken;
  accent?: ColorToken;
  backgrounds: {
    main: string;
    section?: string;
    card?: string;
    footer?: string;
  };
  text: {
    primary: string;
    secondary?: string;
    muted?: string;
    inverse?: string;
  };
  semantic?: {
    success?: string;
    warning?: string;
    error?: string;
    info?: string;
  };
}

// ============================================
// TYPOGRAPHY SYSTEM
// ============================================

export interface FontFamily {
  name: string;
  category: 'sans-serif' | 'serif' | 'monospace' | 'display';
  weight?: string;
}

export interface TypeScale {
  h1: string;
  h2: string;
  h3: string;
  h4?: string;
  body: string;
  small?: string;
  caption?: string;
}

export interface Typography {
  fontFamily: {
    heading: FontFamily;
    body: FontFamily;
  };
  scale: TypeScale;
  lineHeight?: {
    tight?: string;
    normal?: string;
    relaxed?: string;
  };
}

// ============================================
// SPACING SYSTEM
// ============================================

export interface Spacing {
  sectionPadding: {
    y: string;
    x?: string;
  };
  contentMaxWidth: string;
  gridGap: string;
  elementSpacing: {
    xs?: string;
    sm: string;
    md: string;
    lg: string;
    xl?: string;
  };
}

// ============================================
// COMPONENT STYLES
// ============================================

export interface ButtonStyle {
  variant: 'solid' | 'outline' | 'ghost';
  background?: string;
  textColor: string;
  padding: string;
  borderRadius: string;
  border?: string;
  shadow?: string;
  hoverEffect?: string;
}

export interface CardStyle {
  background: string;
  border?: string;
  borderRadius: string;
  shadow?: string;
  padding: string;
}

export interface BadgeStyle {
  background: string;
  textColor: string;
  padding: string;
  borderRadius: string;
  fontSize?: string;
}

export interface InputStyle {
  background: string;
  border: string;
  borderRadius: string;
  padding: string;
  focusRing?: string;
}

export interface ComponentStyles {
  buttons: {
    primary: ButtonStyle;
    secondary?: ButtonStyle;
    cta?: ButtonStyle;
  };
  cards?: CardStyle[];
  badges?: BadgeStyle[];
  inputs?: InputStyle;
}

// ============================================
// SECTION STYLES
// ============================================

export interface SectionStyle {
  name: string;
  index: number;
  background: string;
  padding?: string;
  layout?: string;
  textAlignment?: 'left' | 'center' | 'right';
  hasPattern?: boolean;
  patternDescription?: string;
}

// ============================================
// VISUAL EFFECTS
// ============================================

export interface VisualEffects {
  shadows?: {
    sm?: string;
    md?: string;
    lg?: string;
    card?: string;
  };
  borderRadius?: {
    sm?: string;
    md?: string;
    lg?: string;
    full?: string;
  };
  overlays?: {
    dark?: string;
    light?: string;
    gradient?: string;
  };
  transitions?: {
    fast?: string;
    normal?: string;
    slow?: string;
  };
}

// ============================================
// COMPLETE DESIGN SYSTEM
// ============================================

export interface DesignSystem {
  colors: ColorPalette;
  typography: Typography;
  spacing: Spacing;
  components: ComponentStyles;
  sections: SectionStyle[];
  effects?: VisualEffects;
}

// ============================================
// TAILWIND CONFIG OUTPUT
// ============================================

export interface TailwindColorConfig {
  primary: string | Record<string, string>;
  secondary?: string | Record<string, string>;
  accent?: string | Record<string, string>;
  background?: Record<string, string>;
  foreground?: Record<string, string>;
}

export interface TailwindConfig {
  theme: {
    extend: {
      colors?: TailwindColorConfig;
      fontFamily?: Record<string, string[]>;
      fontSize?: Record<string, string | [string, { lineHeight?: string }]>;
      spacing?: Record<string, string>;
      borderRadius?: Record<string, string>;
      boxShadow?: Record<string, string>;
      maxWidth?: Record<string, string>;
    };
  };
}

// ============================================
// EXTRACTION METADATA
// ============================================

export interface ExtractionConfidence {
  colors: number;
  typography: number;
  sections: number;
  components: number;
  overall: number;
}

export interface ExtractionMeta {
  extractedAt: number;
  modelId: string;
  passes: {
    global: boolean;
    sections: boolean;
    components: boolean;
  };
  confidence: ExtractionConfidence;
  warnings?: string[];
}

// ============================================
// BRAND DESIGN OUTPUT (Complete Package)
// ============================================

export interface BrandDesignOutput {
  screenshot: {
    url: string;
    aspectRatio?: string;
  };
  designSystem: DesignSystem;
  tailwindConfig: TailwindConfig;
  meta: ExtractionMeta;
}

// ============================================
// PASS-SPECIFIC EXTRACTION RESULTS
// ============================================

export interface GlobalDesignResult {
  colors: ColorPalette;
  typography: Typography;
  spacing: Spacing;
}

export interface SectionsResult {
  sections: SectionStyle[];
}

export interface ComponentsResult {
  components: ComponentStyles;
  effects?: VisualEffects;
}

// ============================================
// EXTRACTION PROGRESS
// ============================================

export type ExtractionPhase =
  | 'preparing'
  | 'extracting-global'
  | 'extracting-sections'
  | 'extracting-components'
  | 'merging'
  | 'generating-tailwind'
  | 'complete';

export interface ExtractionProgress {
  phase: ExtractionPhase;
  passesComplete: number;
  totalPasses: 3;
  currentPassName?: string;
}
