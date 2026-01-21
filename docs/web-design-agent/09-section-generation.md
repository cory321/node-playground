# Plan 09: Section Generation System

> **Purpose:** Build the parameterized section generation system that creates all page sections while maintaining design consistency with the hero.

**Dependencies:** Plan 05 (Design Tokens), Plan 06 (Content), Plan 08 (Hero)  
**Estimated Time:** 4-5 hours  
**Parallelizable With:** None

---

## Overview

Sections to generate (in order):
1. Credibility Strip (trust signals)
2. Services Section
3. Value Content Section (required for Google)
4. About/Trust Section
5. Testimonials
6. Lead Capture Form
7. FAQ Section
8. Service Area Section
9. Final CTA
10. Footer

---

## Subtasks

### Section Types

- [ ] **9.1** Define section types

```typescript
export type SectionType =
  | 'credibility-strip'
  | 'services'
  | 'value-content'
  | 'about'
  | 'testimonials'
  | 'lead-form'
  | 'faq'
  | 'service-area'
  | 'final-cta'
  | 'footer';

export interface SectionOutput {
  type: SectionType;
  html: string;
  order: number;
}

export const SECTION_ORDER: SectionType[] = [
  'credibility-strip',
  'services',
  'value-content',
  'about',
  'testimonials',
  'lead-form',
  'faq',
  'service-area',
  'final-cta',
  'footer',
];
```

### Section-Specific Prompts

- [ ] **9.2** Create section prompt builders

```typescript
export function buildSectionPrompt(
  sectionType: SectionType,
  identity: BusinessIdentity,
  designTokens: ExtractedDesignTokens,
  content: ContentStrategy,
  heroHtml: string
): string {
  const basePrompt = `<context>
Generate the ${sectionType} section for ${identity.name}.
This follows the hero section already generated.
</context>

<design_continuity>
Use EXACTLY these design tokens — do not deviate:
${designTokens.cssVariables}

The hero established this visual language:
- Typography: ${designTokens.typography.headlineFont} for headings
- Colors: ${designTokens.colors.primary} primary, ${designTokens.colors.accent} accent
- Spacing: 8px base rhythm
</design_continuity>

${ANTI_SLOP_BLOCK}

<constraints>
CRITICAL — DO NOT:
- Change the color palette
- Change the fonts  
- Change the spacing scale
- Add any purple gradients
- Use 3-column card layouts
Output ONLY this section's HTML with embedded styles.
</constraints>`;

  const sectionContent = getSectionContent(sectionType, content);
  
  return `${basePrompt}\n\n<content>\n${sectionContent}\n</content>\n\n<output>HTML for ${sectionType} section</output>`;
}

function getSectionContent(type: SectionType, content: ContentStrategy): string {
  switch (type) {
    case 'credibility-strip':
      return `Trust anchor: ${content.hero.trustAnchor}\nInclude: years in business, jobs completed, rating`;
    case 'services':
      return content.services.map(s => `- ${s.name}: ${s.description}`).join('\n');
    case 'value-content':
      return `Type: ${content.valueContent.type}\nTitle: ${content.valueContent.title}\nContent (400+ words):\n${content.valueContent.content}`;
    case 'about':
      return `Owner: ${content.footer.nap.name}\nCredentials: Display license and certifications`;
    case 'testimonials':
      return content.testimonials.map(t => `${t.name} (${t.location}): "${t.text}" - ${t.rating} stars`).join('\n');
    case 'lead-form':
      return 'Simple lead capture: Name, Phone, Email, Message. Strong CTA button.';
    case 'faq':
      return content.faqs.map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n');
    case 'service-area':
      return `Areas: ${content.footer.serviceAreas.join(', ')}`;
    case 'final-cta':
      return `Phone: ${content.footer.nap.phone}\nCTA: ${content.hero.primaryCTA}`;
    case 'footer':
      return `NAP: ${JSON.stringify(content.footer.nap)}\nHours: ${content.footer.hours}\nDisclosure: ${content.footer.disclosure}`;
  }
}
```

### Edge Function

- [ ] **9.3** Create `supabase/functions/generate-section/index.ts`

```typescript
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai@0.21.0';
import { corsHeaders, createSupabaseClient, handleError } from '../_shared/utils.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createSupabaseClient(req);
    const { jobId, sectionType, identity, designTokens, content, heroHtml } = await req.json();

    const prompt = buildSectionPrompt(sectionType, identity, designTokens, content, heroHtml);

    const genAI = new GoogleGenerativeAI(Deno.env.get('GOOGLE_AI_API_KEY')!);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.6 },
    });

    let sectionHtml = result.response.text();
    sectionHtml = cleanupGeneratedHtml(sectionHtml);

    // Update sections_json in job
    const { data: job } = await supabase
      .from('site_generations')
      .select('sections_json')
      .eq('id', jobId)
      .single();

    const sections = job?.sections_json || [];
    sections.push({ type: sectionType, html: sectionHtml, order: SECTION_ORDER.indexOf(sectionType) });

    await supabase
      .from('site_generations')
      .update({ sections_json: sections })
      .eq('id', jobId);

    return new Response(
      JSON.stringify({ html: sectionHtml, type: sectionType }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return handleError(error);
  }
});
```

### Batch Generation

- [ ] **9.4** Create batch section generator

```typescript
export async function generateAllSections(
  jobId: string,
  identity: BusinessIdentity,
  designTokens: ExtractedDesignTokens,
  content: ContentStrategy,
  heroHtml: string,
  onProgress?: (section: SectionType, index: number, total: number) => void
): Promise<SectionOutput[]> {
  const sections: SectionOutput[] = [];
  
  for (let i = 0; i < SECTION_ORDER.length; i++) {
    const sectionType = SECTION_ORDER[i];
    onProgress?.(sectionType, i, SECTION_ORDER.length);
    
    const { data } = await supabase.functions.invoke('generate-section', {
      body: { jobId, sectionType, identity, designTokens, content, heroHtml },
    });
    
    sections.push({
      type: sectionType,
      html: data.html,
      order: i,
    });
  }
  
  return sections;
}
```

### Value Content Validation

- [ ] **9.5** Add value content validation (Google compliance)

```typescript
export function validateValueContent(html: string): { valid: boolean; wordCount: number; issues: string[] } {
  const issues: string[] = [];
  
  // Extract text content
  const textContent = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const wordCount = textContent.split(' ').length;
  
  if (wordCount < 400) {
    issues.push(`Content too short: ${wordCount} words (need 400+)`);
  }
  
  // Check for placeholder text
  if (/lorem ipsum/i.test(textContent)) {
    issues.push('Contains placeholder text');
  }
  
  // Check for actionable content
  const hasActionableContent = /should|must|can|will|how to|steps|tips/i.test(textContent);
  if (!hasActionableContent) {
    issues.push('May lack actionable advice');
  }
  
  return {
    valid: issues.length === 0,
    wordCount,
    issues,
  };
}
```

### Progress Tracking UI

- [ ] **9.6** Create section progress component

```tsx
interface SectionProgressProps {
  currentSection: SectionType | null;
  completedSections: SectionType[];
  totalSections: number;
}

export function SectionProgress({ currentSection, completedSections, totalSections }: SectionProgressProps) {
  const progress = (completedSections.length / totalSections) * 100;
  
  return (
    <div className="space-y-3">
      <div className="flex justify-between text-sm">
        <span>Generating sections...</span>
        <span>{completedSections.length}/{totalSections}</span>
      </div>
      
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-blue-600 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {currentSection && (
        <p className="text-sm text-gray-600">
          Currently generating: <span className="font-medium">{currentSection}</span>
        </p>
      )}
      
      <div className="flex flex-wrap gap-2">
        {SECTION_ORDER.map(section => (
          <span 
            key={section}
            className={`px-2 py-1 text-xs rounded ${
              completedSections.includes(section)
                ? 'bg-green-100 text-green-800'
                : section === currentSection
                ? 'bg-blue-100 text-blue-800 animate-pulse'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            {section}
          </span>
        ))}
      </div>
    </div>
  );
}
```

### Slop Check for Sections

- [ ] **9.7** Add section-specific slop validation

```typescript
export function checkSectionForSlop(html: string, sectionType: SectionType): SlopCheckResult {
  const baseCheck = checkHeroForSlop(html, '');
  
  // Additional section-specific checks
  if (sectionType === 'testimonials' && html.includes('carousel')) {
    baseCheck.violations.push('Testimonial carousel detected');
    baseCheck.passed = false;
  }
  
  if (sectionType === 'credibility-strip' && html.includes('trusted by') && html.includes('logo')) {
    baseCheck.warnings.push('Generic "trusted by" logo bar detected');
  }
  
  return baseCheck;
}
```

### Frontend Client

- [ ] **9.8** Add section generation to API client

```typescript
export async function generateSection(
  jobId: string,
  sectionType: SectionType,
  context: {
    identity: BusinessIdentity;
    designTokens: ExtractedDesignTokens;
    content: ContentStrategy;
    heroHtml: string;
  }
): Promise<SectionOutput> {
  const { data, error } = await supabase.functions.invoke('generate-section', {
    body: { jobId, sectionType, ...context },
  });
  
  if (error) throw error;
  return data as SectionOutput;
}
```

### Testing

- [ ] **9.9** Create tests

```typescript
describe('Section Generation', () => {
  it('generates all section types', () => {
    expect(SECTION_ORDER.length).toBe(10);
    expect(SECTION_ORDER).toContain('value-content');
  });
  
  it('validates value content word count', () => {
    const shortContent = '<p>Short content here.</p>';
    const result = validateValueContent(shortContent);
    expect(result.valid).toBe(false);
    expect(result.issues).toContain(expect.stringContaining('too short'));
  });
});
```

---

## Verification Checklist

- [ ] All 10 sections generate successfully
- [ ] Sections maintain design token consistency
- [ ] Value content exceeds 400 words
- [ ] Slop validation runs on each section
- [ ] Progress UI updates correctly
- [ ] Sections save to database correctly

---

## Next Steps

After completing this plan:
1. Proceed to **Plan 10: Refinement & Assembly**
