# Plan 03: Identity Generation Service

> **Purpose:** Implement the business identity generation edge function that creates the brand foundation (name, tagline, credentials, owner story) before any visual work begins.

**Dependencies:** Plan 01 (Infrastructure Setup)  
**Estimated Time:** 2-3 hours  
**Parallelizable With:** Plan 02, Plan 04

---

## Overview

Business identity generation creates:
- **Business name** (domain-friendly, local-feeling)
- **Tagline** (8-12 words, includes location)
- **Owner story** (plausible, 2-3 sentences)
- **Credentials** (license format for state, certifications)
- **Domain suggestions** (multiple options)

---

## Subtasks

### Type Definitions

- [ ] **3.1** Add identity interfaces to `src/types/site-generation.ts`

```typescript
export interface BusinessIdentity {
  name: string;                   // "Phoenix Plumbing Pros"
  tagline: string;                // "Phoenix's 24/7 Emergency Plumber"
  yearsInBusiness: number;        // 12
  domainSuggestions: string[];    // ["phoenixplumbingpros.com", ...]
  ownerStory: OwnerStory;
  credentials: BusinessCredentials;
}

export interface OwnerStory {
  name: string;                   // "Mike Rodriguez"
  background: string;             // Brief founder story (2-3 sentences)
}

export interface BusinessCredentials {
  license: string;                // "ROC #123456" (state-specific format)
  insurance: string;              // "Fully Insured"
  certifications: string[];       // ["EPA Certified", "BBB A+ Rated"]
}

export interface IdentityGenerationInput {
  location: LocationInput;
  category: string;
  competitionLevel: 'low' | 'medium' | 'high';
  demographics?: DemographicData;
}

export interface DemographicData {
  medianIncome?: number;
  population?: number;
  homeOwnershipRate?: number;
}
```

### Prompt Template

- [ ] **3.2** Create identity prompt template at `src/api/site-generator/prompts/identity.ts`

```typescript
import type { IdentityGenerationInput } from '../../../types/site-generation';
import { getPresetOrThrow } from '../presets';

export function buildIdentityPrompt(input: IdentityGenerationInput): string {
  const preset = getPresetOrThrow(input.category);
  
  return `<context>
Generate a business identity for a lead generation landing page.
Location: ${input.location.city}, ${input.location.state}
Category: ${preset.displayName}
Competition Level: ${input.competitionLevel}
Emergency Service: ${preset.emergencyService ? 'Yes - requires 24/7 messaging' : 'No'}
</context>

<naming_strategy>
Tier ${preset.tier} naming pattern:
- Include city name OR regional identifier
- Include service keyword
- Avoid generic modifiers like "Services" or "Solutions"
- Name must work as a .com domain (under 25 chars, no hyphens)
- Sound like a real local business, not a directory
</naming_strategy>

<requirements>
- Business name: Local-feeling, memorable, domain-friendly
- Tagline: 8-12 words, includes location, speaks to customer outcome
- Owner story: Plausible, local-feeling, 2-3 sentences about founder
- Credentials: Realistic for ${input.location.state} (research actual license formats)
- Years in business: Believable number (5-25 years)
- Domain suggestions: 3-4 alternatives if primary is taken
</requirements>

<state_license_formats>
${getStateLicenseInfo(input.location.state)}
</state_license_formats>

<constraints>
NEVER include in the business name:
- "Best" or "#1" claims
- "Near Me"
- "Get Quotes" or comparison-style language
- Generic modifiers like "Services" or "Solutions"
- Hyphens (bad for domains)
- Numbers unless meaningful
</constraints>

<output_format>
Return a JSON object matching this structure:
{
  "name": "Phoenix Plumbing Pros",
  "tagline": "Phoenix's Trusted Emergency Plumbers — 24/7 Response",
  "yearsInBusiness": 12,
  "domainSuggestions": [
    "phoenixplumbingpros.com",
    "phoenixplumberpros.com",
    "phxplumbingpros.com"
  ],
  "ownerStory": {
    "name": "Mike Rodriguez",
    "background": "Mike started Phoenix Plumbing Pros in 2012 after 15 years as a master plumber. Born and raised in the Valley, he built his business on the simple promise of treating every home like his own."
  },
  "credentials": {
    "license": "ROC #123456",
    "insurance": "Fully Insured - $2M Liability",
    "certifications": ["Licensed Master Plumber", "BBB A+ Rated", "EPA Lead-Safe Certified"]
  }
}
</output_format>`;
}

function getStateLicenseInfo(state: string): string {
  const licenseFormats: Record<string, string> = {
    'AZ': 'Arizona: ROC (Registrar of Contractors) license, format: ROC #XXXXXX',
    'CA': 'California: CSLB license, format: License #XXXXXXX',
    'TX': 'Texas: TDLR license, format: License #XXXXXXXX',
    'FL': 'Florida: DBPR license, format: License #CGCXXXXXX',
    'NY': 'New York: NYC DOB license or state varies by county',
    'IL': 'Illinois: IDFPR license varies by trade',
    'PA': 'Pennsylvania: State license format varies by trade',
    'OH': 'Ohio: OCILB license, format: License #XXXXX',
    'GA': 'Georgia: State license format varies by trade',
    'NC': 'North Carolina: State licensing board varies by trade',
  };
  
  return licenseFormats[state] || `${state}: Research specific license format for this state`;
}
```

### Edge Function Implementation

- [ ] **3.3** Create edge function at `supabase/functions/generate-identity/index.ts`

```typescript
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai@0.21.0';
import { corsHeaders, createSupabaseClient, handleError, updateJobStatus } from '../_shared/utils.ts';

const genAI = new GoogleGenerativeAI(Deno.env.get('GOOGLE_AI_API_KEY')!);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createSupabaseClient(req);
    const body = await req.json();
    const { jobId, location, category, competitionLevel, demographics } = body;

    // Update status
    await updateJobStatus(supabase, jobId, 'generating-identity');

    // Build prompt (import from shared prompts module or inline)
    const prompt = buildIdentityPrompt({ location, category, competitionLevel, demographics });

    // Call Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.8, // Some creativity for names
      },
    });

    const responseText = result.response.text();
    const identity = JSON.parse(responseText);

    // Validate required fields
    if (!identity.name || !identity.tagline || !identity.ownerStory) {
      throw new Error('Invalid identity response: missing required fields');
    }

    // Save to database
    await updateJobStatus(supabase, jobId, 'identity-generated', {
      identity_json: identity,
    });

    return new Response(
      JSON.stringify(identity),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return handleError(error);
  }
});

// Inline prompt builder (or import from shared module)
function buildIdentityPrompt(input: {
  location: { city: string; state: string };
  category: string;
  competitionLevel: string;
  demographics?: unknown;
}): string {
  // ... (same as 3.2 but adapted for Deno)
  return `...`; // Full prompt here
}
```

- [ ] **3.4** Add input validation

```typescript
interface GenerateIdentityRequest {
  jobId: string;
  location: {
    city: string;
    state: string;
  };
  category: string;
  competitionLevel: 'low' | 'medium' | 'high';
  demographics?: {
    medianIncome?: number;
    population?: number;
  };
}

function validateRequest(body: unknown): GenerateIdentityRequest {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid request body');
  }
  
  const { jobId, location, category, competitionLevel } = body as Record<string, unknown>;
  
  if (!jobId || typeof jobId !== 'string') {
    throw new Error('Missing or invalid jobId');
  }
  
  if (!location || typeof location !== 'object') {
    throw new Error('Missing or invalid location');
  }
  
  const { city, state } = location as Record<string, unknown>;
  if (!city || !state) {
    throw new Error('Location must include city and state');
  }
  
  if (!category || typeof category !== 'string') {
    throw new Error('Missing or invalid category');
  }
  
  if (!['low', 'medium', 'high'].includes(competitionLevel as string)) {
    throw new Error('competitionLevel must be low, medium, or high');
  }
  
  return body as GenerateIdentityRequest;
}
```

### Frontend Client

- [ ] **3.5** Add identity generation to API client at `src/api/site-generator/index.ts`

```typescript
import type { BusinessIdentity, IdentityGenerationInput } from '../../types/site-generation';

export async function generateIdentity(
  jobId: string,
  input: IdentityGenerationInput
): Promise<BusinessIdentity> {
  const { data, error } = await supabase.functions.invoke('generate-identity', {
    body: { jobId, ...input },
  });
  
  if (error) throw error;
  return data as BusinessIdentity;
}
```

### Retry Logic

- [ ] **3.6** Add retry wrapper for identity generation

```typescript
export async function generateIdentityWithRetry(
  jobId: string,
  input: IdentityGenerationInput,
  maxRetries = 3
): Promise<BusinessIdentity> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await generateIdentity(jobId, input);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`Identity generation attempt ${attempt} failed:`, lastError.message);
      
      if (attempt < maxRetries) {
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }
  
  throw lastError;
}
```

### Naming Variations

- [ ] **3.7** Add helper for generating name variations

```typescript
export function generateNameVariations(baseName: string, city: string): string[] {
  const variations: string[] = [];
  const words = baseName.split(' ');
  
  // Original
  variations.push(baseName.toLowerCase().replace(/\s+/g, ''));
  
  // Without "the"
  if (words[0]?.toLowerCase() === 'the') {
    variations.push(words.slice(1).join('').toLowerCase());
  }
  
  // Abbreviated city
  const cityAbbrev = city.slice(0, 3).toLowerCase();
  variations.push(`${cityAbbrev}${words.slice(-1)[0]?.toLowerCase()}`);
  
  // With "co" suffix
  variations.push(baseName.toLowerCase().replace(/\s+/g, '') + 'co');
  
  return [...new Set(variations)].slice(0, 5);
}
```

### Domain Availability Check (Optional)

- [ ] **3.8** Add domain availability check helper (for UI display only)

```typescript
// Note: Actual domain checks require external API
// This is a placeholder that could be extended
export interface DomainCheckResult {
  domain: string;
  available: boolean | 'unknown';
  price?: number;
}

export async function checkDomainAvailability(
  domains: string[]
): Promise<DomainCheckResult[]> {
  // For MVP, return unknown status
  // Later: integrate with domain registrar API
  return domains.map(domain => ({
    domain: domain.toLowerCase().endsWith('.com') ? domain : `${domain}.com`,
    available: 'unknown' as const,
  }));
}
```

### Response Validation

- [ ] **3.9** Add identity response validation

```typescript
import type { BusinessIdentity } from '../../types/site-generation';

export function validateIdentityResponse(data: unknown): BusinessIdentity {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid identity response: not an object');
  }
  
  const identity = data as Record<string, unknown>;
  
  const requiredFields = ['name', 'tagline', 'yearsInBusiness', 'domainSuggestions', 'ownerStory', 'credentials'];
  for (const field of requiredFields) {
    if (!(field in identity)) {
      throw new Error(`Invalid identity response: missing ${field}`);
    }
  }
  
  if (typeof identity.name !== 'string' || identity.name.length < 3) {
    throw new Error('Invalid business name');
  }
  
  if (typeof identity.tagline !== 'string' || identity.tagline.length < 10) {
    throw new Error('Invalid tagline');
  }
  
  if (!Array.isArray(identity.domainSuggestions) || identity.domainSuggestions.length === 0) {
    throw new Error('Invalid domain suggestions');
  }
  
  const ownerStory = identity.ownerStory as Record<string, unknown>;
  if (!ownerStory?.name || !ownerStory?.background) {
    throw new Error('Invalid owner story');
  }
  
  const credentials = identity.credentials as Record<string, unknown>;
  if (!credentials?.license || !credentials?.insurance) {
    throw new Error('Invalid credentials');
  }
  
  return identity as unknown as BusinessIdentity;
}
```

### Testing

- [ ] **3.10** Create test file for identity generation

```typescript
// src/api/site-generator/__tests__/identity.test.ts
import { describe, it, expect } from 'vitest';
import { validateIdentityResponse, generateNameVariations } from '../identity';

describe('Identity Generation', () => {
  describe('validateIdentityResponse', () => {
    it('validates complete identity', () => {
      const valid = {
        name: 'Phoenix Plumbing Pros',
        tagline: "Phoenix's Trusted Emergency Plumber",
        yearsInBusiness: 12,
        domainSuggestions: ['phoenixplumbingpros.com'],
        ownerStory: { name: 'Mike', background: 'Started in 2012...' },
        credentials: { license: 'ROC #123', insurance: 'Fully Insured', certifications: [] },
      };
      
      expect(() => validateIdentityResponse(valid)).not.toThrow();
    });
    
    it('rejects missing fields', () => {
      expect(() => validateIdentityResponse({ name: 'Test' })).toThrow();
    });
  });
  
  describe('generateNameVariations', () => {
    it('generates domain variations', () => {
      const variations = generateNameVariations('Phoenix Plumbing Pros', 'Phoenix');
      expect(variations).toContain('phoenixplumbingpros');
      expect(variations.length).toBeGreaterThan(1);
    });
  });
});
```

---

## Verification Checklist

- [ ] Edge function deploys without errors
- [ ] Function responds to POST requests
- [ ] Generated identities pass validation
- [ ] State-specific license formats are realistic
- [ ] Business names are domain-friendly (no spaces, reasonable length)
- [ ] Owner stories feel authentic and local
- [ ] Error handling returns useful messages

---

## Example Output

For input:
```json
{
  "location": { "city": "Phoenix", "state": "AZ" },
  "category": "emergency-plumber",
  "competitionLevel": "medium"
}
```

Expected output:
```json
{
  "name": "Phoenix Plumbing Pros",
  "tagline": "Phoenix's Trusted Emergency Plumbers — Fast 24/7 Response",
  "yearsInBusiness": 12,
  "domainSuggestions": [
    "phoenixplumbingpros.com",
    "phoenixplumberpros.com",
    "phxplumbingpros.com",
    "valleyplumbingpros.com"
  ],
  "ownerStory": {
    "name": "Mike Rodriguez",
    "background": "Mike started Phoenix Plumbing Pros in 2012 after 15 years as a master plumber for one of the Valley's largest construction companies. Born and raised in Tempe, he built his business on a simple promise: treat every home like it's your own."
  },
  "credentials": {
    "license": "ROC #298547",
    "insurance": "Fully Insured - $2M General Liability",
    "certifications": [
      "Licensed Master Plumber",
      "BBB A+ Rated",
      "EPA Lead-Safe Certified"
    ]
  }
}
```

---

## Next Steps

After completing this plan:
1. Proceed to **Plan 06: Content Strategy Service** (uses identity)
2. Identity is also used by **Plan 07: Design Approval UI**
