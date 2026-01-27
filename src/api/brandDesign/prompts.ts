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
 * Pass 4: Visual Assets (Photography, Graphics, Icons)
 * Captures photography style, graphics/illustration style, and icon characteristics
 */
export const VISUAL_ASSETS_PROMPT = `Analyze this website screenshot and extract detailed information about the visual assets: photography style, graphics/illustrations, and icons.

Return a JSON object with this exact structure:
{
  "photography": {
    "lighting": ["..."],
    "composition": ["..."],
    "mood": "...",
    "colorGrading": "...",
    "subjectMatter": ["..."],
    "depthOfField": "...",
    "description": "..."
  },
  "graphics": {
    "illustrationStyle": "...",
    "patterns": ["..."],
    "decorativeElements": ["..."],
    "mood": "...",
    "colorUsage": "...",
    "description": "..."
  },
  "icons": {
    "style": "outline|filled|duotone|gradient",
    "strokeWeight": "...",
    "cornerStyle": "...",
    "suggestedLibrary": "...",
    "description": "..."
  }
}

PHOTOGRAPHY ANALYSIS:
- lighting: Types of lighting visible in photos (e.g., "natural daylight", "soft studio", "dramatic shadows", "warm ambient", "bright and airy")
- composition: How photos are composed (e.g., "centered subjects", "rule of thirds", "asymmetric balance", "overhead/flat lay", "close-up details")
- mood: Overall emotional feel (e.g., "warm and inviting", "professional and clean", "cozy and intimate", "energetic and vibrant")
- colorGrading: Color treatment of photos (e.g., "warm tones with high saturation", "cool and muted", "high contrast", "natural and unfiltered")
- subjectMatter: What's shown in photos (e.g., "people in homes", "product close-ups", "lifestyle scenes", "workspaces", "hands doing tasks")
- depthOfField: Focus style (e.g., "shallow with soft bokeh", "everything in focus", "selective focus on subjects")
- description: A VIVID, DETAILED prose paragraph (3-5 sentences) describing exactly how to recreate this photography style. Include specific details about lighting, mood, colors, subjects, and atmosphere that would help an AI image generator produce matching images.

GRAPHICS/ILLUSTRATION ANALYSIS:
- illustrationStyle: Style of any illustrations or graphics (e.g., "flat geometric", "3D rendered", "hand-drawn sketchy", "minimalist line art", "isometric", "gradient-rich")
- patterns: Background patterns or textures (e.g., "subtle dot grid", "geometric shapes", "organic blobs", "gradient meshes", "noise texture")
- decorativeElements: Visual embellishments (e.g., "rounded blob shapes", "floating circles", "abstract lines", "gradient overlays", "glassmorphism effects")
- mood: Mood of graphics (e.g., "playful and modern", "professional and minimal", "warm and approachable")
- colorUsage: How colors are applied (e.g., "duotone with primary/secondary", "full brand palette", "monochromatic accents", "gradient transitions")
- description: A VIVID prose paragraph (3-5 sentences) describing the graphic style to help recreate matching illustrations and decorative elements.

ICON ANALYSIS:
- style: Icon style - "outline" (stroked), "filled" (solid), "duotone" (two-tone), or "gradient"
- strokeWeight: For outline icons, the stroke thickness (e.g., "1.5px", "2px", "3px bold")
- cornerStyle: Corner treatment (e.g., "rounded", "sharp", "mixed")
- suggestedLibrary: Best matching icon library (e.g., "Lucide", "Heroicons", "Phosphor", "Feather", "Tabler", "custom")
- description: Brief description of icon characteristics and visual weight

If no photography is visible, describe what photography WOULD match this design's aesthetic.
If no illustrations are visible, describe what illustration style WOULD complement this design.

Return ONLY the JSON object, no additional text.`;

/**
 * Get all extraction prompts
 */
export function getExtractionPrompts() {
  return {
    global: GLOBAL_DESIGN_PROMPT,
    sections: SECTIONS_PROMPT,
    components: COMPONENTS_PROMPT,
    visualAssets: VISUAL_ASSETS_PROMPT,
  };
}
