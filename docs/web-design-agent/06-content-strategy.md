# Plan 06: Content Strategy Service

> **Purpose:** Generate all website copy, SEO content, and structured data before visual design begins.

**Dependencies:** Plan 01 (Infrastructure), Plan 03 (Identity)  
**Estimated Time:** 2-3 hours  
**Parallelizable With:** Plan 05

---

## Overview

Content strategy generates:
- SEO metadata (title, description, keywords)
- Hero copy (headline, subheadline, CTAs)
- Value content (400+ words of genuinely helpful content)
- Services descriptions
- FAQs
- Testimonials
- Footer content (NAP, hours, service areas)

---

## Subtasks

### Type Definitions

- [ ] **6.1** Add content types to `src/types/site-generation.ts`

```typescript
export interface ContentStrategy {
  seo: SEOContent;
  hero: HeroContent;
  valueContent: ValueContent;
  services: ServiceItem[];
  faqs: FAQItem[];
  testimonials: TestimonialItem[];
  footer: FooterContent;
}

export interface SEOContent {
  titleTag: string;         // Under 60 chars
  metaDescription: string;  // Under 160 chars
  h1: string;
  targetKeywords: string[];
}

export interface HeroContent {
  headline: string;         // 6-10 words
  subheadline: string;      // 15-25 words
  primaryCTA: string;       // Action verb + outcome
  secondaryCTA: string;
  trustAnchor: string;      // One proof point
}

export interface ValueContent {
  type: 'emergency-tips' | 'cost-guide' | 'how-to-choose' | 'local-considerations';
  title: string;
  content: string;          // 400+ words, genuinely helpful
}

export interface ServiceItem {
  name: string;
  description: string;      // 30-50 words
  priceRange?: string;
}

export interface FAQItem {
  question: string;
  answer: string;           // 50-100 words
}

export interface TestimonialItem {
  name: string;
  location: string;         // Neighborhood or city
  text: string;             // 30-50 words
  rating: number;           // 4-5
}

export interface FooterContent {
  nap: { name: string; address: string; phone: string };
  hours: string;
  serviceAreas: string[];
  disclosure: string;
}
```

### Content Prompt

- [ ] **6.2** Create content generation prompt

```typescript
export function buildContentPrompt(
  identity: BusinessIdentity,
  location: LocationInput,
  category: string
): string {
  return `<context>
Generate complete website content for: ${identity.name}
Location: ${location.city}, ${location.state}
Category: ${category}
Tagline: ${identity.tagline}
</context>

<seo_requirements>
- Title tag: Under 60 chars, format "[Service] [City] | [Business Name]"
- Meta description: Under 160 chars, include CTA
- H1: Primary keyword + location
- Keywords: 5-7 relevant local search terms
</seo_requirements>

<hero_requirements>
- Headline: 6-10 words, outcome-focused, includes location
- Subheadline: 15-25 words, addresses pain point
- Primary CTA: Action verb + benefit (e.g., "Get Fast Help Now")
- Secondary CTA: Lower commitment option
- Trust anchor: One specific proof point (years, jobs completed, rating)
</hero_requirements>

<value_content_requirements>
- Type: Choose most relevant for ${category}
- Minimum 400 words of genuinely helpful content
- Must pass "stand alone" test: valuable even without conversion
- Include specific, actionable advice
- Mention ${location.city} and local considerations
</value_content_requirements>

<services>
Generate 4-6 services relevant to ${category}
Each with: name, 30-50 word description, optional price range
</services>

<faqs>
Generate 5-6 FAQs with:
- Questions customers actually ask
- 50-100 word answers with specific information
- Include pricing, timing, and process questions
</faqs>

<testimonials>
Generate 3 testimonials:
- First names only with ${location.city} neighborhoods
- 30-50 words each, specific details about service
- 4-5 star ratings
- Varied demographics implied by names
</testimonials>

<footer>
- NAP: Use ${identity.name}, generate realistic ${location.city} address
- Phone: Generate realistic local number
- Hours: Appropriate for ${category}
- Service areas: ${location.city} and 4-5 nearby cities
- Disclosure: Brief disclaimer text
</footer>

<constraints>
NEVER include:
- "Best" or "#1" claims
- "Get 3 Free Quotes" comparison language
- Generic placeholder text
- Unrealistic claims or guarantees
</constraints>

<output>
JSON matching ContentStrategy interface
</output>`;
}
```

### Edge Function

- [ ] **6.3** Create `supabase/functions/generate-content/index.ts`

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
    const { jobId, identity, location, category } = await req.json();

    const prompt = buildContentPrompt(identity, location, category);

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    });

    const content = JSON.parse(result.response.text());

    await supabase
      .from('site_generations')
      .update({
        content_strategy: content,
        status: 'content-generated',
      })
      .eq('id', jobId);

    return new Response(
      JSON.stringify(content),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return handleError(error);
  }
});
```

### Validation

- [ ] **6.4** Add content validation

```typescript
export function validateContent(data: unknown): ContentStrategy {
  const content = data as ContentStrategy;
  
  // Validate SEO
  if (!content.seo?.titleTag || content.seo.titleTag.length > 60) {
    throw new Error('Invalid or too long title tag');
  }
  if (!content.seo?.metaDescription || content.seo.metaDescription.length > 160) {
    throw new Error('Invalid or too long meta description');
  }
  
  // Validate hero
  if (!content.hero?.headline || content.hero.headline.split(' ').length > 12) {
    throw new Error('Invalid hero headline');
  }
  
  // Validate value content length
  if (!content.valueContent?.content || content.valueContent.content.length < 1500) {
    throw new Error('Value content too short (need 400+ words)');
  }
  
  // Validate services count
  if (!content.services || content.services.length < 4) {
    throw new Error('Need at least 4 services');
  }
  
  // Validate FAQs
  if (!content.faqs || content.faqs.length < 5) {
    throw new Error('Need at least 5 FAQs');
  }
  
  return content;
}
```

### Frontend Client

- [ ] **6.5** Add content generation to API client

```typescript
export async function generateContent(
  jobId: string,
  identity: BusinessIdentity,
  location: LocationInput,
  category: string
): Promise<ContentStrategy> {
  const { data, error } = await supabase.functions.invoke('generate-content', {
    body: { jobId, identity, location, category },
  });
  
  if (error) throw error;
  return validateContent(data);
}
```

### Value Content Types

- [ ] **6.6** Add value content type selector

```typescript
export function selectValueContentType(category: string): ValueContent['type'] {
  const emergencyCategories = [
    'emergency-plumber', 'locksmith', 'water-damage-restoration'
  ];
  
  if (emergencyCategories.includes(category)) {
    return 'emergency-tips';
  }
  
  const costCategories = [
    'hvac-repair', 'garage-door-repair', 'appliance-repair'
  ];
  
  if (costCategories.includes(category)) {
    return 'cost-guide';
  }
  
  return 'how-to-choose';
}
```

### Phone Number Generator

- [ ] **6.7** Add realistic phone number generator

```typescript
const AREA_CODES: Record<string, string[]> = {
  'AZ': ['480', '602', '623', '520'],
  'CA': ['310', '323', '415', '408', '619', '714'],
  'TX': ['214', '512', '713', '817', '972'],
  'FL': ['305', '407', '813', '954'],
  // Add more states
};

export function generatePhoneNumber(state: string): string {
  const codes = AREA_CODES[state] || ['555'];
  const areaCode = codes[Math.floor(Math.random() * codes.length)];
  const prefix = Math.floor(Math.random() * 900) + 100;
  const line = Math.floor(Math.random() * 9000) + 1000;
  return `(${areaCode}) ${prefix}-${line}`;
}
```

### Address Generator

- [ ] **6.8** Add realistic address generator

```typescript
export function generateAddress(city: string, state: string): string {
  const streetNumber = Math.floor(Math.random() * 9000) + 1000;
  const streets = [
    'Main St', 'Oak Ave', 'Commerce Dr', 'Industrial Blvd',
    'Business Park Way', 'Professional Dr', 'Service Rd'
  ];
  const street = streets[Math.floor(Math.random() * streets.length)];
  const suite = Math.random() > 0.5 ? `, Suite ${Math.floor(Math.random() * 300) + 100}` : '';
  
  return `${streetNumber} ${street}${suite}, ${city}, ${state}`;
}
```

### Testing

- [ ] **6.9** Create test file

```typescript
import { describe, it, expect } from 'vitest';
import { validateContent, generatePhoneNumber } from '../content';

describe('Content Strategy', () => {
  it('validates complete content', () => {
    const valid = {
      seo: { titleTag: 'Test Title', metaDescription: 'Test desc', h1: 'H1', targetKeywords: [] },
      hero: { headline: 'Test Headline Here', subheadline: 'Sub', primaryCTA: 'Call', secondaryCTA: 'Quote', trustAnchor: '5 stars' },
      valueContent: { type: 'cost-guide', title: 'Test', content: 'x'.repeat(2000) },
      services: [1, 2, 3, 4].map(i => ({ name: `Service ${i}`, description: 'Desc' })),
      faqs: [1, 2, 3, 4, 5].map(i => ({ question: `Q${i}`, answer: 'A' })),
      testimonials: [],
      footer: { nap: { name: 'Test', address: '123', phone: '555' }, hours: '24/7', serviceAreas: [], disclosure: '' },
    };
    expect(() => validateContent(valid)).not.toThrow();
  });

  it('generates valid phone numbers', () => {
    const phone = generatePhoneNumber('AZ');
    expect(phone).toMatch(/\(\d{3}\) \d{3}-\d{4}/);
  });
});
```

---

## Verification Checklist

- [ ] Edge function deploys successfully
- [ ] Generated content passes validation
- [ ] Title tags are under 60 chars
- [ ] Meta descriptions are under 160 chars
- [ ] Value content exceeds 400 words
- [ ] Phone numbers look realistic for state
- [ ] FAQs are relevant to category

---

## Next Steps

After completing this plan:
1. Proceed to **Plan 07: Design Approval UI** (displays content preview)
2. Content is used in **Plan 08-09** for code generation
