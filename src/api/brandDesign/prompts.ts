/**
 * Brand Design Extraction Prompts
 * Three focused prompts for multi-pass extraction
 */

/**
 * Pass 1: Global Design System
 * Extracts colors, typography, and spacing
 */
export const GLOBAL_DESIGN_PROMPT = `Analyze this website screenshot and extract the complete color palette and typography system.

Return a JSON object with this exact structure:
{
  "colors": {
    "primary": { "hex": "#...", "name": "...", "usage": "..." },
    "secondary": { "hex": "#...", "name": "...", "usage": "..." },
    "accent": { "hex": "#...", "name": "...", "usage": "..." },
    "backgrounds": {
      "main": "#...",
      "section": "#...",
      "card": "#...",
      "footer": "#..."
    },
    "text": {
      "primary": "#...",
      "secondary": "#...",
      "muted": "#...",
      "inverse": "#..."
    },
    "semantic": {
      "success": "#...",
      "warning": "#...",
      "error": "#...",
      "info": "#..."
    }
  },
  "typography": {
    "fontFamily": {
      "heading": { "name": "...", "category": "sans-serif|serif|display", "weight": "..." },
      "body": { "name": "...", "category": "sans-serif|serif", "weight": "..." }
    },
    "scale": {
      "h1": "...",
      "h2": "...",
      "h3": "...",
      "h4": "...",
      "body": "...",
      "small": "...",
      "caption": "..."
    },
    "lineHeight": {
      "tight": "...",
      "normal": "...",
      "relaxed": "..."
    }
  },
  "spacing": {
    "sectionPadding": { "y": "...", "x": "..." },
    "contentMaxWidth": "...",
    "gridGap": "...",
    "elementSpacing": {
      "xs": "...",
      "sm": "...",
      "md": "...",
      "lg": "...",
      "xl": "..."
    }
  }
}

Guidelines:
- Extract ALL colors you see, including gradients (use the dominant color)
- Identify font families by their visual characteristics (e.g., "Inter", "Playfair Display")
- Use rem/em units for typography, rem for spacing
- If unsure about exact values, make educated estimates based on common design patterns
- Include semantic colors if visible (success green, error red, etc.)

Return ONLY the JSON object, no additional text.`;

/**
 * Pass 2: Section Inventory
 * Lists every visible section from top to bottom
 */
export const SECTIONS_PROMPT = `Analyze this website screenshot and document every visible section from top to bottom.

Return a JSON object with this structure:
{
  "sections": [
    {
      "name": "...",
      "index": 0,
      "background": "#...",
      "padding": "...",
      "layout": "...",
      "textAlignment": "left|center|right",
      "hasPattern": false,
      "patternDescription": "..."
    }
  ]
}

For each section, document:
- name: Descriptive name (e.g., "Hero", "Features Grid", "Testimonials", "CTA Banner", "Footer")
- index: Position from top (0 = first/top)
- background: Hex color or gradient description
- padding: Estimated vertical padding (e.g., "py-16", "py-24")
- layout: Layout pattern (e.g., "two-column", "grid-3-col", "centered-stack", "full-width-image")
- textAlignment: Primary text alignment
- hasPattern: Whether there's a background pattern/texture
- patternDescription: If hasPattern, describe it (e.g., "subtle dot grid", "diagonal lines")

Look for these common sections:
1. Navigation/Header
2. Hero/Above the fold
3. Feature/Service sections
4. Testimonials/Reviews
5. Pricing/Plans
6. CTA/Call-to-action banners
7. FAQ/Accordion sections
8. Contact/Form sections
9. Footer

Return ONLY the JSON object, no additional text.`;

/**
 * Pass 3: Component Patterns
 * Documents buttons, cards, badges, and other UI components
 */
export const COMPONENTS_PROMPT = `Analyze this website screenshot and document all visible UI components and visual effects.

Return a JSON object with this structure:
{
  "components": {
    "buttons": {
      "primary": {
        "variant": "solid|outline|ghost",
        "background": "#...",
        "textColor": "#...",
        "padding": "...",
        "borderRadius": "...",
        "border": "...",
        "shadow": "...",
        "hoverEffect": "..."
      },
      "secondary": { ... },
      "cta": { ... }
    },
    "cards": [
      {
        "background": "#...",
        "border": "...",
        "borderRadius": "...",
        "shadow": "...",
        "padding": "..."
      }
    ],
    "badges": [
      {
        "background": "#...",
        "textColor": "#...",
        "padding": "...",
        "borderRadius": "...",
        "fontSize": "..."
      }
    ],
    "inputs": {
      "background": "#...",
      "border": "...",
      "borderRadius": "...",
      "padding": "...",
      "focusRing": "..."
    }
  },
  "effects": {
    "shadows": {
      "sm": "...",
      "md": "...",
      "lg": "...",
      "card": "..."
    },
    "borderRadius": {
      "sm": "...",
      "md": "...",
      "lg": "...",
      "full": "..."
    },
    "overlays": {
      "dark": "...",
      "light": "...",
      "gradient": "..."
    },
    "transitions": {
      "fast": "...",
      "normal": "...",
      "slow": "..."
    }
  }
}

Guidelines:
- Document ALL button variants you see (primary CTA, secondary, text links styled as buttons)
- Include any cards, even if subtle (service cards, testimonial cards, pricing cards)
- Look for badges/tags/labels
- Note shadow styles (e.g., "shadow-sm", "shadow-lg", "0 4px 6px rgba(0,0,0,0.1)")
- Document border-radius patterns (fully rounded? subtle rounding? sharp corners?)
- Identify any gradient overlays on images or sections

Return ONLY the JSON object, no additional text.`;

/**
 * Get all extraction prompts
 */
export function getExtractionPrompts() {
  return {
    global: GLOBAL_DESIGN_PROMPT,
    sections: SECTIONS_PROMPT,
    components: COMPONENTS_PROMPT,
  };
}
