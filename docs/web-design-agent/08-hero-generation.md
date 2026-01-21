# Plan 08: Hero Section Generation

> **Purpose:** Generate the hero section HTML/CSS that establishes the design system. The hero is the most important section — spend 50% of effort here.

**Dependencies:** Plan 05 (Design Tokens), Plan 06 (Content)  
**Estimated Time:** 3-4 hours  
**Parallelizable With:** Plan 09 (after hero template established)

---

## Overview

The hero section:
- Establishes the complete visual language
- Uses extracted design tokens exactly
- Includes anti-slop constraints
- Sets patterns for all subsequent sections

---

## Subtasks

### Anti-Slop Constraints

- [ ] **8.1** Create anti-slop module at `src/api/site-generator/anti-slop.ts`

```typescript
export const ANTI_SLOP_BLOCK = `<anti_slop_requirements>
TYPOGRAPHY — NEVER USE:
- Inter, Roboto, Arial, Space Grotesk, Open Sans, Segoe UI, System UI defaults

COLORS — NEVER USE:
- Purple gradients (#8B5CF6, #7C3AED, etc.)
- Purple on white backgrounds
- Blue-purple combinations

LAYOUT — NEVER CREATE:
- 3-column card grids with identical styling
- Centered Bootstrap-style layouts
- Cookie-cutter hero sections
- "Trusted by" grayscale logo bars
- Testimonial carousels
- Floating geometric blob shapes

ICONS — NEVER USE:
- Lucide icons (overused)
- Generic checkmark bullet points

IMAGES — NEVER USE:
- Stock photo with gradient overlay
- Smiling contractor with family

COPY — NEVER WRITE:
- "Get 3 Free Quotes"
- "Compare Prices From Top Pros"
- "We Connect You With..."
</anti_slop_requirements>`;
```

### Hero Prompt

- [ ] **8.2** Create hero generation prompt

```typescript
export function buildHeroPrompt(
  identity: BusinessIdentity,
  designTokens: ExtractedDesignTokens,
  content: ContentStrategy,
  referenceImageUrl?: string
): string {
  return `<context>
Generate the hero section HTML/CSS for a ${identity.name} landing page.
${referenceImageUrl ? 'Match the visual style from the reference image closely.' : ''}
</context>

<design_tokens>
${designTokens.cssVariables}
</design_tokens>

<content>
Headline: ${content.hero.headline}
Subheadline: ${content.hero.subheadline}
Primary CTA: ${content.hero.primaryCTA}
Secondary CTA: ${content.hero.secondaryCTA}
Trust Anchor: ${content.hero.trustAnchor}
Phone: ${content.footer.nap.phone}
</content>

<requirements>
- Full viewport hero (min-height: 100vh on desktop, 80vh on mobile)
- Headline uses var(--font-display) at var(--font-size-hero)
- Phone number prominent and clickable (tel: link)
- Single trust anchor, not a list
- Background: Use gradient, subtle texture, or atmospheric depth — NOT flat color
- Animation: Subtle fade-in on load with staggered timing (animation-delay)
- Responsive: Stack vertically on mobile, side-by-side on desktop if split layout
</requirements>

${ANTI_SLOP_BLOCK}

<technical>
- Semantic HTML5 (<header>, <h1>, <nav>)
- Mobile-first responsive (min-width media queries)
- Use CSS custom properties from design tokens
- Focus states on all interactive elements
- Preload font suggestion in comment
</technical>

<output>
Complete HTML structure with embedded <style> block for the hero section.
Include only the hero — header through the first CTA section.
</output>`;
}
```

### Edge Function

- [ ] **8.3** Create `supabase/functions/generate-hero/index.ts`

```typescript
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai@0.21.0';
import { corsHeaders, createSupabaseClient, handleError } from '../_shared/utils.ts';

const genAI = new GoogleGenerativeAI(Deno.env.get('GOOGLE_AI_API_KEY')!);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createSupabaseClient(req);
    const { jobId, identity, designTokens, content, referenceImageUrl } = await req.json();

    const prompt = buildHeroPrompt(identity, designTokens, content, referenceImageUrl);

    // If we have a reference image, use multimodal
    let result;
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    if (referenceImageUrl) {
      const imageResponse = await fetch(referenceImageUrl);
      const imageBuffer = await imageResponse.arrayBuffer();
      const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
      
      result = await model.generateContent({
        contents: [{
          role: 'user',
          parts: [
            { inlineData: { mimeType: 'image/png', data: base64Image } },
            { text: prompt },
          ],
        }],
        generationConfig: { temperature: 0.7 },
      });
    } else {
      result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7 },
      });
    }

    let heroHtml = result.response.text();
    
    // Clean up markdown code fences if present
    heroHtml = heroHtml.replace(/```html?\n?/gi, '').replace(/```\n?/g, '');

    await supabase
      .from('site_generations')
      .update({
        hero_html: heroHtml,
        status: 'hero-generated',
      })
      .eq('id', jobId);

    return new Response(
      JSON.stringify({ html: heroHtml }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return handleError(error);
  }
});
```

### Refinement Prompt

- [ ] **8.4** Create hero refinement prompt

```typescript
export function buildHeroRefinementPrompt(
  currentHtml: string,
  designTokens: ExtractedDesignTokens
): string {
  return `<context>
Review this hero section and improve it. Make targeted refinements only.
</context>

<current_hero>
${currentHtml}
</current_hero>

<refinement_checklist>
1. Add animation-delay stagger to elements (0.1s, 0.2s, 0.3s)
2. Ensure phone number has tel: link for mobile click-to-call
3. Add subtle background texture or gradient if missing
4. Verify typography scale looks balanced
5. Check that CTAs have hover and focus states
6. Ensure adequate color contrast (WCAG AA)
</refinement_checklist>

<constraints>
DO NOT change:
- The color palette (use exactly: ${Object.values(designTokens.colors).join(', ')})
- The font choices (${designTokens.typography.headlineFont}, ${designTokens.typography.bodyFont})
- The content/copy
- The overall layout structure
</constraints>

<output>
Output the refined HTML with improvements applied.
</output>`;
}
```

### Slop Validation

- [ ] **8.5** Create slop validation for hero

```typescript
export interface SlopCheckResult {
  passed: boolean;
  score: number;          // 0-100
  violations: string[];
  warnings: string[];
}

export function checkHeroForSlop(html: string, css: string): SlopCheckResult {
  const violations: string[] = [];
  const warnings: string[] = [];
  
  const combined = (html + css).toLowerCase();
  
  // Font checks
  const bannedFonts = ['inter', 'roboto', 'arial', 'space grotesk'];
  for (const font of bannedFonts) {
    if (combined.includes(`"${font}"`) || combined.includes(`'${font}'`)) {
      violations.push(`Banned font detected: ${font}`);
    }
  }
  
  // Color checks
  const purplePatterns = [/#8b5cf6/i, /#7c3aed/i, /#6366f1/i, /purple/i];
  for (const pattern of purplePatterns) {
    if (pattern.test(combined)) {
      violations.push('Purple color detected');
    }
  }
  
  // Layout checks
  if (combined.includes('grid-cols-3') && combined.includes('card')) {
    warnings.push('3-column card grid detected - may be generic');
  }
  
  // Icon checks
  if (combined.includes('lucide')) {
    warnings.push('Lucide icons detected - consider alternatives');
  }
  
  const score = Math.max(0, 100 - (violations.length * 20) - (warnings.length * 5));
  
  return {
    passed: violations.length === 0,
    score,
    violations,
    warnings,
  };
}
```

### HTML Cleanup

- [ ] **8.6** Create HTML cleanup utility

```typescript
export function cleanupGeneratedHtml(html: string): string {
  let cleaned = html;
  
  // Remove markdown code fences
  cleaned = cleaned.replace(/```html?\n?/gi, '').replace(/```\n?/g, '');
  
  // Remove any AI commentary before/after the HTML
  const htmlStart = cleaned.indexOf('<');
  const htmlEnd = cleaned.lastIndexOf('>');
  if (htmlStart !== -1 && htmlEnd !== -1) {
    cleaned = cleaned.substring(htmlStart, htmlEnd + 1);
  }
  
  // Ensure proper indentation (optional)
  cleaned = cleaned.trim();
  
  return cleaned;
}
```

### Preview Component

- [ ] **8.7** Create hero preview component

```tsx
interface HeroPreviewProps {
  html: string;
  designTokens: ExtractedDesignTokens;
  slopCheck: SlopCheckResult;
  onRefine: () => void;
  onApprove: () => void;
}

export function HeroPreview({
  html,
  designTokens,
  slopCheck,
  onRefine,
  onApprove,
}: HeroPreviewProps) {
  const iframeRef = React.useRef<HTMLIFrameElement>(null);
  
  React.useEffect(() => {
    if (iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(`
          <!DOCTYPE html>
          <html>
          <head>
            ${designTokens.typography.googleFontsImport ? 
              `<link href="${designTokens.typography.googleFontsImport.replace("@import url('", '').replace("');", '')}" rel="stylesheet">` : ''
            }
            <style>${designTokens.cssVariables}</style>
          </head>
          <body style="margin:0">${html}</body>
          </html>
        `);
        doc.close();
      }
    }
  }, [html, designTokens]);
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Hero Section Preview</h3>
        <SlopScore score={slopCheck.score} />
      </div>
      
      <iframe
        ref={iframeRef}
        className="w-full h-[500px] border rounded-lg"
        title="Hero Preview"
      />
      
      {slopCheck.violations.length > 0 && (
        <div className="p-3 bg-red-50 rounded-lg text-sm text-red-700">
          <strong>Issues:</strong> {slopCheck.violations.join(', ')}
        </div>
      )}
      
      <div className="flex gap-3">
        <button onClick={onRefine} className="px-4 py-2 border rounded-lg">
          🔄 Refine
        </button>
        <button onClick={onApprove} className="px-4 py-2 bg-green-600 text-white rounded-lg">
          ✅ Continue to Sections
        </button>
      </div>
    </div>
  );
}
```

### Frontend Client

- [ ] **8.8** Add hero generation to API client

```typescript
export interface GenerateHeroInput {
  jobId: string;
  identity: BusinessIdentity;
  designTokens: ExtractedDesignTokens;
  content: ContentStrategy;
  referenceImageUrl?: string;
}

export async function generateHero(input: GenerateHeroInput): Promise<string> {
  const { data, error } = await supabase.functions.invoke('generate-hero', {
    body: input,
  });
  
  if (error) throw error;
  return cleanupGeneratedHtml(data.html);
}

export async function refineHero(
  jobId: string,
  currentHtml: string,
  designTokens: ExtractedDesignTokens
): Promise<string> {
  const { data, error } = await supabase.functions.invoke('generate-hero', {
    body: { 
      jobId, 
      refine: true, 
      currentHtml, 
      designTokens 
    },
  });
  
  if (error) throw error;
  return cleanupGeneratedHtml(data.html);
}
```

### Testing

- [ ] **8.9** Create tests for hero generation

```typescript
import { describe, it, expect } from 'vitest';
import { checkHeroForSlop, cleanupGeneratedHtml } from '../hero';

describe('Hero Generation', () => {
  describe('checkHeroForSlop', () => {
    it('detects banned fonts', () => {
      const result = checkHeroForSlop('<div style="font-family: Inter">', '');
      expect(result.passed).toBe(false);
      expect(result.violations).toContain('Banned font detected: inter');
    });
    
    it('passes clean hero', () => {
      const result = checkHeroForSlop('<div style="font-family: DM Serif Display">', '');
      expect(result.passed).toBe(true);
    });
  });
  
  describe('cleanupGeneratedHtml', () => {
    it('removes markdown fences', () => {
      const input = '```html\n<div>Test</div>\n```';
      expect(cleanupGeneratedHtml(input)).toBe('<div>Test</div>');
    });
  });
});
```

---

## Verification Checklist

- [ ] Edge function deploys successfully
- [ ] Hero matches reference image style
- [ ] Design tokens are used correctly
- [ ] Slop validation catches banned patterns
- [ ] Phone numbers have tel: links
- [ ] Animations are smooth and staggered
- [ ] Preview renders correctly in iframe

---

## Next Steps

After completing this plan:
1. Proceed to **Plan 09: Section Generation System**
2. Hero establishes the design language for all sections
