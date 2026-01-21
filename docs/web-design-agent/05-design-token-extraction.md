# Plan 05: Design Token Extraction

> **Purpose:** Implement the multimodal design token extraction that analyzes the AI-generated reference screenshot and extracts colors, typography characteristics, layout patterns, and overall vibe.

**Dependencies:** Plan 01 (Infrastructure), Plan 04 (Reference Image Generation)  
**Estimated Time:** 2-3 hours  
**Parallelizable With:** Plan 06

---

## Core Concept

Design token extraction:
1. Takes the AI-generated reference screenshot as input
2. Uses multimodal LLM to analyze the visual design
3. Extracts exact colors (hex values)
4. Identifies typography characteristics and suggests matching Google Fonts
5. Outputs CSS custom properties for consistent code generation

---

## Subtasks

### Type Definitions

- [ ] **5.1** Add design token types to `src/types/site-generation.ts`

```typescript
export interface ExtractedDesignTokens {
  colors: ColorPalette;
  typography: TypographyTokens;
  layout: LayoutTokens;
  visualElements: VisualElementTokens;
  vibe: string[];           // 3-5 keywords describing the aesthetic
  cssVariables: string;     // Complete CSS custom properties block
}

export interface ColorPalette {
  primary: string;          // "#1E3A5F"
  secondary: string;        // "#F5A623"
  accent: string;           // "#E55934"
  background: string;       // "#FAFAF8"
  surface: string;          // "#FFFFFF"
  surfaceAlt: string;       // "#F0EDE8"
  text: string;             // "#1A1A1A"
  textMuted: string;        // "#6B7280"
}

export interface TypographyTokens {
  headlineFont: string;     // "DM Serif Display"
  bodyFont: string;         // "Plus Jakarta Sans"
  headlineWeight: string;   // "700"
  headlineStyle: 'condensed' | 'normal' | 'extended';
  googleFontsImport: string; // @import url for Google Fonts
}

export interface LayoutTokens {
  heroStyle: 'full-width' | 'split' | 'asymmetric';
  spacing: 'generous' | 'balanced' | 'compact';
  sectionPattern: string;   // Description of repeating patterns
  maxWidth: string;         // "1280px"
}

export interface VisualElementTokens {
  backgroundStyle: 'solid' | 'gradient' | 'textured' | 'image';
  cardStyle: string;        // Description of card treatment
  buttonStyle: string;      // Description of button treatment
  borderRadius: string;     // "8px" or "rounded-lg"
}

export interface ExtractDesignInput {
  jobId: string;
  imageUrl: string;
  category?: string;        // For context
}
```

### Extraction Prompt

- [ ] **5.2** Create extraction prompt template

```typescript
export function buildExtractionPrompt(category?: string): string {
  return `<context>
Analyze this website screenshot and extract a complete design system.
${category ? `This is an AI-generated mockup for a ${category} landing page.` : 'This is an AI-generated website mockup.'}
</context>

<extract>
1. COLOR PALETTE
   - Sample the exact hex colors visible in the image
   - Identify: primary (dominant brand color), secondary (supporting color), accent (CTA/highlight color)
   - Identify: background, surface (cards), text, muted text colors
   - Note any gradients or color transitions

2. TYPOGRAPHY CHARACTERISTICS
   - Headline style: serif/sans-serif, weight, condensed/extended
   - Body style: matching characteristics
   - Suggest specific Google Fonts that match these characteristics
   - Consider: Is the typography bold and urgent, or refined and elegant?

3. LAYOUT APPROACH
   - Hero structure (full-width, split, asymmetric)
   - Section patterns visible
   - Spacing rhythm (generous/compact)
   - Content max-width estimate

4. VISUAL ELEMENTS
   - Background treatment (solid, gradient, texture, image)
   - Card/container styles (shadows, borders, backgrounds)
   - Button styles (shape, shadows, hover states implied)
   - Border radius pattern (sharp, slightly rounded, fully rounded)

5. OVERALL VIBE
   - 3-5 keywords describing the aesthetic
</extract>

<output_format>
Return a JSON object with this exact structure:
{
  "colors": {
    "primary": "#HEXVAL",
    "secondary": "#HEXVAL",
    "accent": "#HEXVAL",
    "background": "#HEXVAL",
    "surface": "#HEXVAL",
    "surfaceAlt": "#HEXVAL",
    "text": "#HEXVAL",
    "textMuted": "#HEXVAL"
  },
  "typography": {
    "headlineFont": "Font Name",
    "bodyFont": "Font Name",
    "headlineWeight": "700",
    "headlineStyle": "normal",
    "googleFontsImport": "@import url('https://fonts.googleapis.com/css2?family=...');"
  },
  "layout": {
    "heroStyle": "full-width",
    "spacing": "generous",
    "sectionPattern": "Alternating white and light gray backgrounds",
    "maxWidth": "1280px"
  },
  "visualElements": {
    "backgroundStyle": "gradient",
    "cardStyle": "White cards with subtle shadow and rounded corners",
    "buttonStyle": "Solid fill with slight shadow, rounded corners",
    "borderRadius": "8px"
  },
  "vibe": ["Bold", "Professional", "Urgent", "Trustworthy"]
}
</output_format>

<important>
- Extract ACTUAL colors from the image, not assumed colors
- Match Google Fonts to the VISUAL characteristics seen, not generic defaults
- Never suggest Inter, Roboto, or Arial - find distinctive alternatives
- Be specific about visual treatments, not generic descriptions
</important>`;
}
```

### Edge Function Implementation

- [ ] **5.3** Create edge function at `supabase/functions/extract-design/index.ts`

```typescript
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai@0.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleError } from '../_shared/utils.ts';

const genAI = new GoogleGenerativeAI(Deno.env.get('GOOGLE_AI_API_KEY')!);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { jobId, imageUrl, category } = body;

    if (!imageUrl) {
      throw new Error('imageUrl is required');
    }

    // Fetch the image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status}`);
    }
    
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = btoa(
      String.fromCharCode(...new Uint8Array(imageBuffer))
    );

    // Build extraction prompt
    const prompt = buildExtractionPrompt(category);

    // Call Gemini with vision
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType: 'image/png',
              data: base64Image,
            },
          },
          { text: prompt },
        ],
      }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.3, // Lower temperature for accurate extraction
      },
    });

    const responseText = result.response.text();
    const tokens = JSON.parse(responseText);

    // Generate CSS variables
    const cssVariables = generateCSSVariables(tokens);
    tokens.cssVariables = cssVariables;

    // Update job record
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    await supabase
      .from('site_generations')
      .update({
        design_tokens: tokens,
        status: 'design-extracted',
      })
      .eq('id', jobId);

    return new Response(
      JSON.stringify(tokens),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Design extraction error:', error);
    return handleError(error);
  }
});
```

### CSS Variable Generation

- [ ] **5.4** Create CSS variable generator

```typescript
export function generateCSSVariables(tokens: ExtractedDesignTokens): string {
  return `:root {
  /* Colors - extracted from reference image */
  --color-primary: ${tokens.colors.primary};
  --color-secondary: ${tokens.colors.secondary};
  --color-accent: ${tokens.colors.accent};
  --color-background: ${tokens.colors.background};
  --color-surface: ${tokens.colors.surface};
  --color-surface-alt: ${tokens.colors.surfaceAlt};
  --color-text: ${tokens.colors.text};
  --color-text-muted: ${tokens.colors.textMuted};

  /* Typography - matched to Google Fonts */
  --font-display: '${tokens.typography.headlineFont}', Georgia, serif;
  --font-body: '${tokens.typography.bodyFont}', -apple-system, sans-serif;
  --font-weight-headline: ${tokens.typography.headlineWeight};
  
  /* Font Sizes (fluid) */
  --font-size-hero: clamp(2.5rem, 5vw + 1rem, 4.5rem);
  --font-size-h2: clamp(1.75rem, 3vw + 0.5rem, 2.5rem);
  --font-size-h3: clamp(1.25rem, 2vw + 0.5rem, 1.75rem);
  --font-size-body: clamp(1rem, 1vw + 0.5rem, 1.125rem);
  --font-size-small: clamp(0.875rem, 0.5vw + 0.5rem, 0.9375rem);

  /* Spacing (8px base) */
  --space-1: 0.5rem;
  --space-2: 1rem;
  --space-3: 1.5rem;
  --space-4: 2rem;
  --space-6: 3rem;
  --space-8: 4rem;
  --space-12: 6rem;
  --space-16: 8rem;

  /* Layout */
  --max-width: ${tokens.layout.maxWidth};
  --border-radius: ${tokens.visualElements.borderRadius};
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
}`;
}
```

### Frontend Client

- [ ] **5.5** Add design extraction to API client

```typescript
import type { ExtractedDesignTokens, ExtractDesignInput } from '../../types/site-generation';

export async function extractDesignTokens(
  input: ExtractDesignInput
): Promise<ExtractedDesignTokens> {
  const { data, error } = await supabase.functions.invoke('extract-design', {
    body: input,
  });
  
  if (error) throw error;
  return data as ExtractedDesignTokens;
}
```

### Color Validation

- [ ] **5.6** Add color validation utilities

```typescript
const HEX_COLOR_REGEX = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

export function isValidHexColor(color: string): boolean {
  return HEX_COLOR_REGEX.test(color);
}

export function validateColorPalette(colors: Record<string, string>): void {
  const requiredColors = ['primary', 'secondary', 'accent', 'background', 'surface', 'text'];
  
  for (const key of requiredColors) {
    if (!colors[key]) {
      throw new Error(`Missing required color: ${key}`);
    }
    if (!isValidHexColor(colors[key])) {
      throw new Error(`Invalid hex color for ${key}: ${colors[key]}`);
    }
  }
}

export function normalizeHexColor(color: string): string {
  // Ensure uppercase and 6-digit format
  let hex = color.toUpperCase();
  if (hex.length === 4) {
    hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  }
  return hex;
}
```

### Font Validation

- [ ] **5.7** Add font validation and Google Fonts URL builder

```typescript
const BANNED_FONTS = [
  'inter',
  'roboto',
  'arial',
  'space grotesk',
  'open sans',
  'segoe ui',
  'helvetica',
];

export function isBannedFont(fontName: string): boolean {
  return BANNED_FONTS.includes(fontName.toLowerCase());
}

export function validateTypography(typography: TypographyTokens): void {
  if (isBannedFont(typography.headlineFont)) {
    throw new Error(`Banned font detected: ${typography.headlineFont}. Choose a more distinctive option.`);
  }
  if (isBannedFont(typography.bodyFont)) {
    throw new Error(`Banned font detected: ${typography.bodyFont}. Choose a more distinctive option.`);
  }
}

export function buildGoogleFontsUrl(fonts: string[]): string {
  const formatted = fonts.map(font => 
    font.replace(/\s+/g, '+') + ':wght@400;500;600;700'
  ).join('&family=');
  
  return `https://fonts.googleapis.com/css2?family=${formatted}&display=swap`;
}
```

### Response Validation

- [ ] **5.8** Add complete response validation

```typescript
export function validateDesignTokens(data: unknown): ExtractedDesignTokens {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid design tokens: not an object');
  }
  
  const tokens = data as Record<string, unknown>;
  
  // Validate colors
  if (!tokens.colors || typeof tokens.colors !== 'object') {
    throw new Error('Invalid design tokens: missing colors');
  }
  validateColorPalette(tokens.colors as Record<string, string>);
  
  // Validate typography
  if (!tokens.typography || typeof tokens.typography !== 'object') {
    throw new Error('Invalid design tokens: missing typography');
  }
  const typography = tokens.typography as TypographyTokens;
  if (!typography.headlineFont || !typography.bodyFont) {
    throw new Error('Invalid design tokens: missing font definitions');
  }
  validateTypography(typography);
  
  // Validate layout
  if (!tokens.layout || typeof tokens.layout !== 'object') {
    throw new Error('Invalid design tokens: missing layout');
  }
  
  // Validate vibe
  if (!Array.isArray(tokens.vibe) || tokens.vibe.length === 0) {
    throw new Error('Invalid design tokens: missing vibe keywords');
  }
  
  return tokens as unknown as ExtractedDesignTokens;
}
```

### Fallback Fonts

- [ ] **5.9** Add fallback font suggestions

```typescript
// Distinctive fonts for fallback if extraction fails
export const FALLBACK_FONT_PAIRS: Array<{ headline: string; body: string }> = [
  { headline: 'DM Serif Display', body: 'Plus Jakarta Sans' },
  { headline: 'Playfair Display', body: 'Source Sans 3' },
  { headline: 'Fraunces', body: 'Outfit' },
  { headline: 'Bitter', body: 'Karla' },
  { headline: 'Libre Baskerville', body: 'Nunito Sans' },
  { headline: 'Josefin Sans', body: 'Lato' },
  { headline: 'Cormorant Garamond', body: 'Fira Sans' },
  { headline: 'Merriweather', body: 'Mulish' },
];

export function getRandomFontPair(): { headline: string; body: string } {
  const index = Math.floor(Math.random() * FALLBACK_FONT_PAIRS.length);
  return FALLBACK_FONT_PAIRS[index];
}
```

### Testing

- [ ] **5.10** Create test file for design token extraction

```typescript
// src/api/site-generator/__tests__/design-tokens.test.ts
import { describe, it, expect } from 'vitest';
import {
  isValidHexColor,
  validateColorPalette,
  isBannedFont,
  generateCSSVariables,
} from '../design-tokens';

describe('Design Token Extraction', () => {
  describe('isValidHexColor', () => {
    it('validates 6-digit hex', () => {
      expect(isValidHexColor('#1E3A5F')).toBe(true);
      expect(isValidHexColor('#fff')).toBe(true);
    });
    
    it('rejects invalid colors', () => {
      expect(isValidHexColor('red')).toBe(false);
      expect(isValidHexColor('#GGG')).toBe(false);
    });
  });
  
  describe('isBannedFont', () => {
    it('identifies banned fonts', () => {
      expect(isBannedFont('Inter')).toBe(true);
      expect(isBannedFont('Roboto')).toBe(true);
      expect(isBannedFont('DM Serif Display')).toBe(false);
    });
  });
  
  describe('generateCSSVariables', () => {
    it('generates valid CSS', () => {
      const tokens = {
        colors: {
          primary: '#1E3A5F',
          secondary: '#F5A623',
          accent: '#E55934',
          background: '#FAFAF8',
          surface: '#FFFFFF',
          surfaceAlt: '#F0EDE8',
          text: '#1A1A1A',
          textMuted: '#6B7280',
        },
        typography: {
          headlineFont: 'DM Serif Display',
          bodyFont: 'Plus Jakarta Sans',
          headlineWeight: '700',
          headlineStyle: 'normal' as const,
          googleFontsImport: '',
        },
        layout: {
          heroStyle: 'full-width' as const,
          spacing: 'generous' as const,
          sectionPattern: '',
          maxWidth: '1280px',
        },
        visualElements: {
          backgroundStyle: 'gradient' as const,
          cardStyle: '',
          buttonStyle: '',
          borderRadius: '8px',
        },
        vibe: ['Bold', 'Professional'],
        cssVariables: '',
      };
      
      const css = generateCSSVariables(tokens);
      expect(css).toContain('--color-primary: #1E3A5F');
      expect(css).toContain("--font-display: 'DM Serif Display'");
    });
  });
});
```

---

## Verification Checklist

- [ ] Edge function deploys without errors
- [ ] Function successfully fetches and processes images
- [ ] Extracted colors are valid hex values
- [ ] Typography suggestions avoid banned fonts
- [ ] CSS variables generate correctly
- [ ] Validation catches malformed responses
- [ ] Fallback fonts are distinctive and appropriate

---

## Example Output

For a reference image, the function should return:

```json
{
  "colors": {
    "primary": "#1E3A5F",
    "secondary": "#F5A623",
    "accent": "#E55934",
    "background": "#FAFAF8",
    "surface": "#FFFFFF",
    "surfaceAlt": "#F0EDE8",
    "text": "#1A1A1A",
    "textMuted": "#6B7280"
  },
  "typography": {
    "headlineFont": "DM Serif Display",
    "bodyFont": "Plus Jakarta Sans",
    "headlineWeight": "700",
    "headlineStyle": "normal",
    "googleFontsImport": "@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:wght@400&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');"
  },
  "layout": {
    "heroStyle": "full-width",
    "spacing": "generous",
    "sectionPattern": "Alternating white and cream backgrounds with consistent padding",
    "maxWidth": "1280px"
  },
  "visualElements": {
    "backgroundStyle": "gradient",
    "cardStyle": "White cards with subtle shadow (shadow-md) and 8px border radius",
    "buttonStyle": "Solid fill with accent color, slight shadow, rounded corners",
    "borderRadius": "8px"
  },
  "vibe": ["Bold", "Professional", "Urgent", "Trustworthy", "Modern"],
  "cssVariables": ":root {\n  --color-primary: #1E3A5F;\n  ..."
}
```

---

## Next Steps

After completing this plan:
1. Proceed to **Plan 07: Design Approval UI** (displays these tokens)
2. These tokens are also used in **Plan 08: Hero Generation** and beyond
