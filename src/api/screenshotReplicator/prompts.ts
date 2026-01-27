/**
 * Screenshot Replicator Analysis Prompts
 * Five specialized prompts for multi-pass screenshot analysis
 */

/**
 * Pass 1: Page Structure Analysis
 * Identifies sections and overall page structure
 */
export const PAGE_STRUCTURE_PROMPT = `Analyze this website screenshot and identify ALL visible sections from top to bottom.

For each distinct section, provide:
- index: Position from top (0 = first/top section)
- name: Descriptive name based on content/purpose (e.g., "Navigation", "Hero", "Features Grid", "Testimonials", "Footer")
- estimatedHeight: Approximate percentage of viewport height this section takes

Return JSON:
{
  "sections": [
    {
      "index": 0,
      "name": "descriptive-section-name",
      "estimatedHeight": "15%"
    }
  ],
  "totalSections": <number>,
  "pageType": "landing-page|product-page|portfolio|blog|other",
  "hasNavigation": true/false,
  "hasFooter": true/false
}

Guidelines:
- Count every visually distinct section (even small ones like CTAs or dividers)
- Use descriptive names that indicate purpose (not generic names like "Section 1")
- Include navigation/header and footer as separate sections
- Sections are separated by background color changes, dividers, or clear visual boundaries

Return ONLY the JSON object, no additional text.`;

/**
 * Pass 2: Complete Text Extraction (OCR)
 * Extracts ALL visible text organized by section
 */
export const TEXT_EXTRACTION_PROMPT = `Analyze this website screenshot and extract ALL visible text content.

Organize the text by visual sections from top to bottom. For each section:
1. Match the section index to the page structure (0 = topmost section)
2. Extract ALL text including headings, paragraphs, button labels, links, lists
3. Preserve the text EXACTLY as shown - do not paraphrase, correct spelling, or improve wording

Return JSON:
{
  "sections": [
    {
      "index": 0,
      "name": "section-name",
      "text": {
        "headings": ["Main heading", "Subheading"],
        "paragraphs": ["Full paragraph text exactly as shown..."],
        "buttons": ["Button Label 1", "Button Label 2"],
        "links": ["Link Text 1", "Link Text 2"],
        "lists": [
          ["List item 1", "List item 2", "List item 3"]
        ],
        "other": ["Phone numbers", "Addresses", "Labels", "Badges", "Small text"]
      }
    }
  ],
  "totalWords": <estimated word count>
}

CRITICAL RULES:
- Extract text EXACTLY as shown, including typos, special characters, and formatting
- Include ALL text: navigation items, footer links, copyright text, phone numbers, addresses
- Include badge text, labels, small print, and fine print
- For lists, preserve the exact bullet point or numbered text
- Include button text even if it's a CTA button
- Phone numbers and addresses go in "other"

Return ONLY the JSON object, no additional text.`;

/**
 * Pass 3: Visual Asset Inventory
 * Identifies all images, icons, and graphics that need regeneration
 */
export const ASSET_INVENTORY_PROMPT = `Identify ALL visual assets in this screenshot that would need to be recreated.

For each image, icon, graphic, or visual element, provide:

Return JSON:
{
  "assets": [
    {
      "id": "section-{index}-{type}-{number}",
      "type": "photo|icon|graphic|pattern|avatar|logo",
      "purpose": "What role this asset plays in the design",
      "sectionIndex": 0,
      "position": "background|left|right|center|grid-item-1|card-1|etc",
      "aspectRatio": "16:9|4:3|1:1|3:2|9:16|etc",
      "description": "Detailed description of what the asset shows",
      "generationPrompt": "A detailed prompt to recreate this asset with an AI image generator",
      "skipGeneration": false,
      "fallbackIcon": null
    }
  ],
  "totalAssets": <number>,
  "assetBreakdown": {
    "photos": <count>,
    "icons": <count>,
    "graphics": <count>,
    "patterns": <count>,
    "avatars": <count>,
    "logos": <count>
  }
}

Asset Types:
- "photo": Real photographs (hero images, product photos, people, places, objects)
- "icon": Simple symbolic graphics (checkmarks, arrows, symbols, step indicators)
- "graphic": Illustrations, diagrams, decorative elements, infographics
- "pattern": Background textures, repeating patterns
- "avatar": Person photos used for testimonials, team members, profiles
- "logo": Brand logos (mark skipGeneration=true for logos)

ID Format: Use "section-{sectionIndex}-{type}-{number}" format
- Example: "section-1-photo-1" for first photo in section 1
- Example: "section-2-icon-3" for third icon in section 2

Generation Prompt Guidelines:
- Be extremely detailed and specific
- Describe lighting, mood, colors, composition
- Include style hints (professional, editorial, lifestyle, etc.)
- For icons, suggest a simple description that could be matched to a Lucide icon
- For photos, describe subject matter, setting, and atmosphere

For simple icons that can be replaced with icon libraries:
- Set "skipGeneration": true
- Set "fallbackIcon": "lucide-icon-name" (e.g., "Shield", "Check", "Phone", "Star")

Return ONLY the JSON object, no additional text.`;

/**
 * Pass 4: Design Token Extraction
 * Extracts colors, typography, and styling patterns
 */
export const DESIGN_TOKENS_PROMPT = `Analyze this website screenshot and extract the design tokens (colors, typography, spacing).

Return JSON:
{
  "colors": {
    "primary": "#hex",
    "secondary": "#hex or null",
    "accent": "#hex or null",
    "background": "#hex",
    "backgroundAlt": "#hex or null",
    "text": "#hex",
    "textMuted": "#hex or null",
    "textInverse": "#hex or null"
  },
  "typography": {
    "headingFont": "Font Name, fallback",
    "bodyFont": "Font Name, fallback",
    "h1Size": "3rem|2.5rem|etc",
    "h2Size": "2rem|1.75rem|etc",
    "h3Size": "1.5rem|1.25rem|etc",
    "bodySize": "1rem|0.875rem|etc",
    "smallSize": "0.875rem|0.75rem|etc"
  },
  "spacing": {
    "sectionPadding": "py-16|py-20|py-24|etc",
    "contentMaxWidth": "max-w-6xl|max-w-7xl|etc",
    "gap": "gap-4|gap-6|gap-8|etc"
  },
  "effects": {
    "borderRadius": "rounded-none|rounded|rounded-lg|rounded-xl|rounded-full",
    "shadow": "shadow-none|shadow-sm|shadow|shadow-lg|etc",
    "buttonRadius": "rounded|rounded-lg|rounded-full|etc"
  },
  "buttons": {
    "primary": {
      "background": "#hex",
      "text": "#hex",
      "padding": "px-4 py-2|px-6 py-3|etc",
      "borderRadius": "rounded-lg|etc"
    },
    "secondary": {
      "background": "#hex or transparent",
      "text": "#hex",
      "border": "border border-{color}|none",
      "padding": "px-4 py-2|etc",
      "borderRadius": "rounded-lg|etc"
    }
  }
}

Guidelines:
- Extract exact hex colors visible in the design
- Identify font families by visual characteristics
- Use Tailwind CSS class names for spacing and effects where possible
- If unsure about exact values, make educated estimates based on common patterns
- For fonts you can't identify, use common alternatives (Inter, system-ui, etc.)

Return ONLY the JSON object, no additional text.`;

/**
 * Pass 5: Section Layout Analysis
 * Detailed layout information for each section including multi-column detection
 */
export const SECTION_LAYOUT_PROMPT = `Analyze this website screenshot and provide detailed layout information for each section.

For each section, analyze its internal structure. Pay SPECIAL ATTENTION to multi-column layouts where different content areas sit side-by-side.

Return JSON:
{
  "sections": [
    {
      "index": 0,
      "name": "section-name",
      "layout": {
        "type": "flex|grid|stack|absolute",
        "direction": "row|column|null",
        "columns": 2|3|4|null,
        "alignment": "center|start|end|between|null",
        "justify": "center|start|end|between|null",
        "background": "#hex|gradient description|image",
        "hasBackgroundImage": true|false,
        "padding": "py-12 px-4|py-16 px-6|etc",
        "gap": "gap-4|gap-6|gap-8|null",
        "maxWidth": "max-w-6xl|max-w-7xl|null"
      },
      "multiColumn": {
        "isMultiColumn": true|false,
        "columns": [
          {
            "name": "Column Name/Purpose",
            "width": "50%|60%|40%|auto",
            "contentType": "text|cards|images|form|mixed"
          }
        ],
        "responsiveBehavior": "stack-on-mobile|side-by-side-always|cards-grid"
      },
      "nestedLayouts": [
        {
          "parentElement": "left-column|right-column|content-area",
          "type": "grid|flex|stack",
          "columns": 2|3|4|null,
          "description": "4 provider cards in 2x2 grid"
        }
      ],
      "childElements": [
        {
          "type": "heading|text|button|image|card|list|grid|icon-group|form|testimonial",
          "count": 1,
          "notes": "Any relevant structural notes"
        }
      ]
    }
  ]
}

CRITICAL - Multi-Column Detection:
- Look for sections where TWO or more distinct content areas sit SIDE BY SIDE
- Examples: "Why Trust Us" on left + "Testimonials" on right
- Examples: Text content on left + Image gallery on right
- Examples: Feature list on left + Form on right
- Set isMultiColumn: true when content is horizontally split

Layout Type Definitions:
- "flex": Flexbox layout (use direction for row/column)
- "grid": CSS Grid layout (specify columns)
- "stack": Simple vertical stack
- "absolute": Elements with absolute positioning (overlays, floating elements)

Child Element Types:
- "heading": H1, H2, H3 headings
- "text": Paragraphs, descriptions
- "button": CTA buttons, links styled as buttons
- "image": Photos, graphics
- "card": Card components (grouped content with borders/shadows)
- "list": Bulleted or numbered lists
- "grid": A grid of repeated elements (feature cards, team members, etc.)
- "icon-group": A row/group of icons
- "form": Form elements (inputs, buttons)
- "testimonial": Testimonial cards with quotes and attribution

Nested Layouts:
- Some sections contain nested grids (e.g., a 2-column layout where one column has a 2x2 card grid)
- Describe these nested structures in nestedLayouts

Return ONLY the JSON object, no additional text.`;

/**
 * Pass 6: Form Elements & Interactive Components
 * Identifies forms, decorative elements, badges, and ratings
 */
export const FORM_ELEMENTS_PROMPT = `Analyze this website screenshot and identify all form elements, decorative elements, badges, and ratings.

Return JSON:
{
  "forms": [
    {
      "sectionIndex": 0,
      "type": "search|contact|newsletter|login|quote-request",
      "elements": [
        {
          "type": "input|textarea|select|checkbox|radio",
          "placeholder": "placeholder text if visible",
          "label": "associated label if any",
          "position": "inline-with-button|standalone|stacked"
        }
      ],
      "submitButton": "Button Label",
      "layout": "inline|stacked|grid",
      "notes": "Any additional context about the form"
    }
  ],
  "decorativeElements": [
    {
      "sectionIndex": 0,
      "type": "connector-line|divider|separator|decorative-shape|progress-indicator",
      "description": "Detailed description of the decorative element",
      "position": "between-icons|below-heading|section-divider|etc",
      "styling": "horizontal line|dashed|solid|gradient|etc"
    }
  ],
  "badges": [
    {
      "sectionIndex": 0,
      "text": "Badge text exactly as shown",
      "backgroundColor": "#hex (estimated)",
      "textColor": "#hex (estimated)",
      "position": "below-rating|in-card|header|etc",
      "style": "rounded|pill|square"
    }
  ],
  "ratings": [
    {
      "sectionIndex": 0,
      "stars": 4.8,
      "maxStars": 5,
      "reviewCount": "230 Reviews",
      "displayFormat": "stars-with-number|stars-only|number-only",
      "position": "below-company-name|in-card|etc"
    }
  ],
  "iconGroups": [
    {
      "sectionIndex": 0,
      "count": 3,
      "hasConnectors": true,
      "connectorType": "horizontal-line|dashed-line|arrow|none",
      "layout": "horizontal|vertical|grid",
      "description": "Description of what the icons represent"
    }
  ]
}

CRITICAL IDENTIFICATION RULES:
1. FORMS: Look for input fields, not just buttons. A search bar with a button is a FORM, not two buttons.
2. DECORATIVE ELEMENTS: Look for lines connecting icons, section dividers, decorative shapes.
3. BADGES: Small colored labels/tags (e.g., "Licensed & Insured", "Background Checked", "New", "Featured").
4. RATINGS: Star ratings, number ratings, review counts.
5. ICON GROUPS: Sets of icons that work together, especially "How It Works" style step icons.

Return ONLY the JSON object, no additional text.`;

/**
 * Get all analysis prompts
 */
export function getAnalysisPrompts() {
	return {
		structure: PAGE_STRUCTURE_PROMPT,
		text: TEXT_EXTRACTION_PROMPT,
		assets: ASSET_INVENTORY_PROMPT,
		tokens: DESIGN_TOKENS_PROMPT,
		layout: SECTION_LAYOUT_PROMPT,
		forms: FORM_ELEMENTS_PROMPT,
	};
}

/**
 * Get prompt for a specific pass
 */
export function getPromptForPass(pass: 'structure' | 'text' | 'assets' | 'tokens' | 'layout' | 'forms'): string {
	const prompts = getAnalysisPrompts();
	return prompts[pass];
}
