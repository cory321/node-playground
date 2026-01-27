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
// VISUAL ASSETS (Photography, Graphics, Icons)
// ============================================

export interface PhotographyStyle {
  /** Lighting characteristics, e.g., ["natural", "soft", "dramatic"] */
  lighting: string[];
  /** Composition patterns, e.g., ["centered", "rule-of-thirds", "asymmetric"] */
  composition: string[];
  /** Overall mood, e.g., "warm and inviting" */
  mood: string;
  /** Color treatment, e.g., "high saturation, warm tones" */
  colorGrading: string;
  /** Types of subjects shown, e.g., ["people", "home interiors", "products"] */
  subjectMatter: string[];
  /** Depth of field style, e.g., "shallow with bokeh" */
  depthOfField: string;
  /** Vivid prose description for generating matching images */
  description: string;
}

export interface GraphicsStyle {
  /** Style of illustrations, e.g., "flat geometric", "3D rendered", "hand-drawn" */
  illustrationStyle: string;
  /** Background patterns used, e.g., ["subtle gradients", "geometric shapes"] */
  patterns: string[];
  /** Decorative elements, e.g., ["rounded corners", "soft shadows", "abstract blobs"] */
  decorativeElements: string[];
  /** Overall mood of graphics */
  mood: string;
  /** How colors are used in graphics, e.g., "duotone", "full color palette" */
  colorUsage: string;
  /** Vivid prose description for generating matching graphics */
  description: string;
}

export interface IconStyle {
  /** Icon style variant */
  style: 'outline' | 'filled' | 'duotone' | 'gradient';
  /** Stroke weight for outline icons, e.g., "1.5px", "2px" */
  strokeWeight: string;
  /** Corner treatment, e.g., "rounded", "sharp" */
  cornerStyle: string;
  /** Suggested icon library, e.g., "Lucide", "Heroicons", "Phosphor" */
  suggestedLibrary: string;
  /** Description of icon visual characteristics */
  description: string;
}

export interface VisualAssets {
  photography: PhotographyStyle;
  graphics: GraphicsStyle;
  icons: IconStyle;
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
  visualAssets?: VisualAssets;
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
  visualAssets: number;
  overall: number;
}

export interface ExtractionMeta {
  extractedAt: number;
  modelId: string;
  passes: {
    global: boolean;
    sections: boolean;
    components: boolean;
    visualAssets: boolean;
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

export interface VisualAssetsResult {
  photography: PhotographyStyle;
  graphics: GraphicsStyle;
  icons: IconStyle;
}

// ============================================
// EXTRACTION PROGRESS
// ============================================

export type ExtractionPhase =
  | 'preparing'
  | 'extracting-global'
  | 'extracting-sections'
  | 'extracting-components'
  | 'extracting-visual-assets'
  | 'merging'
  | 'generating-tailwind'
  | 'complete';

export interface ExtractionProgress {
  phase: ExtractionPhase;
  passesComplete: number;
  totalPasses: 4;
  currentPassName?: string;
}
