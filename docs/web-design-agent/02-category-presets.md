# Plan 02: Category Presets Module

> **Purpose:** Create the category presets that define the structure-only prompts for reference image generation. Each preset specifies layout and sections but NOT colors, letting Gemini choose creative palettes.

**Dependencies:** Plan 01 (Infrastructure Setup)  
**Estimated Time:** 2-3 hours  
**Parallelizable With:** Plan 03, Plan 04

---

## Core Concept

Category presets define:
- **What sections** appear on the page
- **What order** they appear in
- **What content** each section contains

They do NOT specify:
- Colors
- Specific fonts
- Visual style

This allows Gemini to be creative with the visual design while maintaining structural consistency.

---

## Subtasks

### Type Definitions

- [ ] **2.1** Create `src/api/site-generator/types.ts` with preset interfaces

```typescript
export interface ImagePromptParams {
  businessDescriptor: string;     // "Trusted 24/7 emergency plumbing company"
  pageHeight: number;             // 4500-5500 based on section count
  header: string;                 // Header description
  hero: string;                   // Hero section description
  sections: string[];             // Array of section descriptions
  footer: string;                 // Footer description
}

export interface CategoryPreset extends ImagePromptParams {
  slug: string;                   // URL-friendly identifier
  displayName: string;            // Human-readable name
  tier: 1 | 2 | 3;               // Priority tier
  emergencyService: boolean;      // Requires 24/7 messaging
  typicalServices: string[];      // Common services for content gen
}
```

### Preset Builder Function

- [ ] **2.2** Create `src/api/site-generator/presets.ts` with builder function

```typescript
import type { ImagePromptParams, CategoryPreset } from './types';

/**
 * Page height formula based on section count
 * Base: 3000px + (SECTION_COUNT × 250)
 */
function calculatePageHeight(sectionCount: number): number {
  const height = 3000 + (sectionCount * 250);
  // Round to nearest 100
  return Math.round(height / 100) * 100;
}

/**
 * Build the image generation prompt from a preset
 * Structure-only: specifies layout, NOT colors
 */
export function buildImagePrompt(params: ImagePromptParams): string {
  const allSections = [
    params.header,
    params.hero,
    ...params.sections,
    params.footer,
  ].join(' → ');

  return `Full-page website screenshot, portrait orientation, 1440px × ${params.pageHeight}px. ${params.businessDescriptor} landing page, entire page from header to footer in one continuous image.

Sections top to bottom: ${allSections}.`;
}
```

### Tier 1 Category Presets

- [ ] **2.3** Add Emergency Plumber preset

```typescript
const EMERGENCY_PLUMBER: CategoryPreset = {
  slug: 'emergency-plumber',
  displayName: 'Emergency Plumber',
  tier: 1,
  emergencyService: true,
  typicalServices: ['Burst Pipes', 'Water Heater', 'Drain Cleaning', 'Sewer Line', 'Leak Detection', 'Fixture Repair'],
  businessDescriptor: 'Trusted 24/7 emergency plumbing company',
  pageHeight: 4800,
  header: 'Sticky header with bold logo and prominent emergency phone number',
  hero: 'Full-screen hero with professional plumber at work in modern home, urgent but reassuring headline, "Call Now" and "Get Free Quote" dual CTAs, 24/7 availability badge',
  sections: [
    'Trust bar with response time, completed jobs count, and 5-star rating',
    '6-card emergency services grid: Burst Pipes, Water Heater, Drain Cleaning, Sewer Line, Leak Detection, Fixture Repair with relevant imagery',
    '"Why Choose Us" 4-column section: Licensed, Insured, Fast Response, Upfront Pricing with icons',
    '3 customer testimonial cards with star ratings and emergency repair stories',
    '"How It Works" 3-step process: Call, We Dispatch, Problem Solved with numbered steps',
    'Service area map showing coverage zones',
    'About section with owner photo, license numbers, and certification badges',
    'Bold CTA banner with phone number and "Available 24/7" messaging',
  ],
  footer: '4-column footer with emergency contact, services list, service areas, and licensing info',
};
```

- [ ] **2.4** Add Garage Door Repair preset

```typescript
const GARAGE_DOOR_REPAIR: CategoryPreset = {
  slug: 'garage-door-repair',
  displayName: 'Garage Door Repair',
  tier: 1,
  emergencyService: true,
  typicalServices: ['Spring Repair', 'Opener Installation', 'Panel Replacement', 'New Door Installation', 'Maintenance', 'Emergency Service'],
  businessDescriptor: 'Professional garage door repair and installation company',
  pageHeight: 4600,
  header: 'Clean header with logo, phone number, and "Get Free Estimate" button',
  hero: 'Hero with beautiful modern home featuring prominent garage door, confident headline about same-day service, phone number and quote form CTAs',
  sections: [
    'Trust indicators bar: Years in business, doors serviced, 5-star reviews',
    '6-card services grid: Spring Repair, Opener Installation, Panel Replacement, New Door Installation, Maintenance, Emergency Service',
    'Before/after showcase section with repair examples',
    '"Why Homeowners Choose Us" 4-column benefits',
    'Brands we service logo bar (LiftMaster, Chamberlain, Genie, etc.)',
    '3 customer testimonials with photos and repair details',
    'Service area section with city list',
    'Special offer banner with seasonal promotion',
  ],
  footer: 'Professional footer with contact info, service areas, hours, and licensing',
};
```

- [ ] **2.5** Add Appliance Repair preset

```typescript
const APPLIANCE_REPAIR: CategoryPreset = {
  slug: 'appliance-repair',
  displayName: 'Appliance Repair',
  tier: 1,
  emergencyService: false,
  typicalServices: ['Refrigerator', 'Washer', 'Dryer', 'Dishwasher', 'Oven', 'Microwave', 'Freezer', 'Ice Maker'],
  businessDescriptor: 'Expert home appliance repair service',
  pageHeight: 4700,
  header: 'Header with logo, phone number, and "Schedule Repair" button',
  hero: 'Hero with technician diagnosing appliance in modern kitchen, headline about fast repairs, scheduling form or phone CTA',
  sections: [
    'Trust bar: Appliances repaired count, average repair time, satisfaction rate',
    'Appliances we repair grid (8 items): Refrigerator, Washer, Dryer, Dishwasher, Oven, Microwave, Freezer, Ice Maker with appliance icons',
    'Brands we service section with manufacturer logos',
    '"Our Repair Process" 4-step timeline: Schedule, Diagnose, Repair, Guarantee',
    '"Why Choose Us" benefits section',
    '3 customer reviews with star ratings',
    'Cost transparency section with common repair price ranges',
    'Service area map',
    'CTA banner with scheduling prompt',
  ],
  footer: 'Footer with contact, services, areas served, and warranty info',
};
```

- [ ] **2.6** Add Junk Removal preset

```typescript
const JUNK_REMOVAL: CategoryPreset = {
  slug: 'junk-removal',
  displayName: 'Junk Removal',
  tier: 1,
  emergencyService: false,
  typicalServices: ['Furniture', 'Appliances', 'Yard Waste', 'Construction Debris', 'Electronics', 'Estate Cleanouts'],
  businessDescriptor: 'Professional junk removal and hauling service',
  pageHeight: 4500,
  header: 'Friendly header with logo, phone number, and "Get Quote" button',
  hero: 'Hero with clean truck and professional crew, headline about easy junk removal, before/after imagery hint, phone and quote CTAs',
  sections: [
    'Trust bar: Tons removed, happy customers, eco-friendly disposal rate',
    'What we remove grid (6 items): Furniture, Appliances, Yard Waste, Construction Debris, Electronics, Estate Cleanouts',
    '"How It Works" 3-step process: Book, We Haul, Done with friendly illustrations',
    'Transparent pricing section with truck load examples',
    'Eco-commitment section about recycling and donation partnerships',
    '3 customer testimonials about easy experience',
    'Service area section',
    'CTA banner with same-day availability message',
  ],
  footer: 'Footer with contact, services, areas, and eco certifications',
};
```

- [ ] **2.7** Add Locksmith preset

```typescript
const LOCKSMITH: CategoryPreset = {
  slug: 'locksmith',
  displayName: 'Locksmith',
  tier: 1,
  emergencyService: true,
  typicalServices: ['Emergency Lockout', 'Lock Rekey', 'Lock Installation', 'Car Lockout', 'Safe Opening', 'Security Upgrade'],
  businessDescriptor: '24/7 emergency locksmith service',
  pageHeight: 4600,
  header: 'Urgent header with logo, prominent phone number, and "Call Now" button',
  hero: 'Hero with professional locksmith at work, urgent but trustworthy headline, 24/7 badge, phone CTA prominent',
  sections: [
    'Trust bar: Response time, completed jobs, licensed and bonded badge',
    '6-card services grid: Emergency Lockout, Lock Rekey, Lock Installation, Car Lockout, Safe Opening, Security Upgrade',
    '"Fast Response" map showing coverage and response times',
    '"Why Trust Us" 4-column: Licensed, Background Checked, Upfront Pricing, Guaranteed Work',
    '3 customer testimonials about emergency situations',
    'Residential and commercial services breakdown',
    'CTA banner with emergency phone number',
  ],
  footer: 'Footer with 24/7 phone, services, areas, and licensing info',
};
```

- [ ] **2.8** Add Water Damage Restoration preset

```typescript
const WATER_DAMAGE_RESTORATION: CategoryPreset = {
  slug: 'water-damage-restoration',
  displayName: 'Water Damage Restoration',
  tier: 1,
  emergencyService: true,
  typicalServices: ['Water Extraction', 'Flood Cleanup', 'Mold Remediation', 'Sewage Cleanup', 'Storm Damage', 'Fire and Smoke'],
  businessDescriptor: '24/7 water damage restoration and emergency cleanup company',
  pageHeight: 5000,
  header: 'Urgent header with logo, emergency phone number, and "Get Help Now" button',
  hero: 'Hero with professional restoration team and equipment, urgent headline about fast response, "Call Now" and "Insurance Claim Help" CTAs',
  sections: [
    'Emergency response bar: Response time, jobs completed, insurance claim success rate',
    '"What to Do Right Now" emergency steps section with clear instructions',
    '6-card services grid: Water Extraction, Flood Cleanup, Mold Remediation, Sewage Cleanup, Storm Damage, Fire and Smoke',
    '"Our Restoration Process" 5-step timeline with professional imagery',
    'Insurance assistance section explaining claim help',
    'Equipment and certifications showcase (IICRC certification)',
    '3 customer testimonials about emergency response',
    'Service area map with 24/7 coverage zones',
    'Urgent CTA banner with phone number',
  ],
  footer: 'Footer with emergency contact, services, certifications, and insurance info',
};
```

- [ ] **2.9** Add HVAC Repair preset

```typescript
const HVAC_REPAIR: CategoryPreset = {
  slug: 'hvac-repair',
  displayName: 'HVAC Repair',
  tier: 1,
  emergencyService: true,
  typicalServices: ['AC Repair', 'Heating Repair', 'Installation', 'Maintenance', 'Duct Cleaning', 'Indoor Air Quality'],
  businessDescriptor: 'Professional HVAC repair and installation company',
  pageHeight: 4800,
  header: 'Clean header with logo, phone number, and "Schedule Service" button',
  hero: 'Hero with modern HVAC system or comfortable family in well-heated/cooled home, headline about comfort and reliability, dual CTAs for repair and installation',
  sections: [
    'Trust bar: Systems serviced, years experience, satisfaction guarantee',
    '6-card services grid: AC Repair, Heating Repair, Installation, Maintenance, Duct Cleaning, Indoor Air Quality',
    'Brands we service logo bar (Carrier, Trane, Lennox, etc.)',
    '"Why Choose Us" 4-column benefits',
    'Seasonal maintenance plan showcase',
    '3 customer testimonials',
    'Energy efficiency tips section',
    'Service area map',
    'CTA banner with seasonal promotion',
  ],
  footer: 'Footer with contact, services, areas, and licensing/certifications',
};
```

- [ ] **2.10** Add Pest Control preset

```typescript
const PEST_CONTROL: CategoryPreset = {
  slug: 'pest-control',
  displayName: 'Pest Control',
  tier: 1,
  emergencyService: false,
  typicalServices: ['Ants', 'Termites', 'Rodents', 'Bed Bugs', 'Cockroaches', 'Mosquitoes'],
  businessDescriptor: 'Professional pest control and extermination service',
  pageHeight: 4600,
  header: 'Trustworthy header with logo, phone number, and "Get Free Inspection" button',
  hero: 'Hero with happy family in pest-free home or professional technician, reassuring headline about protection, inspection CTA',
  sections: [
    'Trust bar: Homes protected, years experience, satisfaction guarantee',
    '6-card pest types grid: Ants, Termites, Rodents, Bed Bugs, Cockroaches, Mosquitoes with pest imagery',
    '"Our Treatment Process" 4-step approach',
    'Residential and commercial services breakdown',
    'Prevention tips section',
    '3 customer testimonials',
    'Service area map',
    'Protection plan options section',
    'CTA banner with free inspection offer',
  ],
  footer: 'Footer with contact, services, areas, and EPA certifications',
};
```

- [ ] **2.11** Add House Cleaning preset

```typescript
const HOUSE_CLEANING: CategoryPreset = {
  slug: 'house-cleaning',
  displayName: 'House Cleaning',
  tier: 1,
  emergencyService: false,
  typicalServices: ['Standard Clean', 'Deep Clean', 'Move In/Out', 'One-Time Clean'],
  businessDescriptor: 'Professional house cleaning and maid service',
  pageHeight: 4500,
  header: 'Fresh clean header with logo, phone number, and "Book Cleaning" button',
  hero: 'Hero with sparkling clean modern home interior, welcoming headline about coming home to clean, easy booking CTA',
  sections: [
    'Trust bar: Homes cleaned, 5-star reviews, satisfaction guarantee',
    '4-card cleaning packages: Standard Clean, Deep Clean, Move In/Out, One-Time Clean with pricing hints',
    "What's included checklist section with room-by-room breakdown",
    '"Our Cleaning Team" section about vetted, trained staff',
    '"Why Choose Us" benefits: Insured, Background Checked, Eco-Friendly Products, Satisfaction Guaranteed',
    '3 customer testimonials',
    'Easy booking section with scheduling preview',
    'Service area map',
  ],
  footer: 'Footer with contact, services, areas, and trust badges',
};
```

- [ ] **2.12** Add Pool Service preset

```typescript
const POOL_SERVICE: CategoryPreset = {
  slug: 'pool-service',
  displayName: 'Pool Service',
  tier: 1,
  emergencyService: false,
  typicalServices: ['Weekly Maintenance', 'One-Time Cleaning', 'Pool Opening/Closing', 'Equipment Repair'],
  businessDescriptor: 'Professional pool cleaning and maintenance service',
  pageHeight: 4600,
  header: 'Clean header with logo, phone number, and "Get Quote" button',
  hero: 'Hero with beautiful sparkling pool in backyard setting, headline about crystal clear pools, service CTA',
  sections: [
    'Trust bar: Pools serviced, years experience, customer satisfaction',
    '4-card service plans: Weekly Maintenance, One-Time Cleaning, Pool Opening/Closing, Equipment Repair',
    '"What\'s Included" breakdown of maintenance services',
    'Equipment we service section',
    '"Why Regular Maintenance Matters" educational section',
    '3 customer testimonials with pool photos',
    'Service area map',
    'Seasonal promotion banner',
  ],
  footer: 'Footer with contact, services, areas, and certifications',
};
```

### Preset Registry

- [ ] **2.13** Create preset registry with lookup functions

```typescript
export const CATEGORY_PRESETS: Record<string, CategoryPreset> = {
  'emergency-plumber': EMERGENCY_PLUMBER,
  'garage-door-repair': GARAGE_DOOR_REPAIR,
  'appliance-repair': APPLIANCE_REPAIR,
  'junk-removal': JUNK_REMOVAL,
  'locksmith': LOCKSMITH,
  'water-damage-restoration': WATER_DAMAGE_RESTORATION,
  'hvac-repair': HVAC_REPAIR,
  'pest-control': PEST_CONTROL,
  'house-cleaning': HOUSE_CLEANING,
  'pool-service': POOL_SERVICE,
};

export function getPreset(categorySlug: string): CategoryPreset | undefined {
  return CATEGORY_PRESETS[categorySlug];
}

export function getPresetOrThrow(categorySlug: string): CategoryPreset {
  const preset = getPreset(categorySlug);
  if (!preset) {
    throw new Error(`Unknown category: ${categorySlug}`);
  }
  return preset;
}

export function getAllPresets(): CategoryPreset[] {
  return Object.values(CATEGORY_PRESETS);
}

export function getPresetsByTier(tier: 1 | 2 | 3): CategoryPreset[] {
  return getAllPresets().filter(p => p.tier === tier);
}

export function getEmergencyPresets(): CategoryPreset[] {
  return getAllPresets().filter(p => p.emergencyService);
}
```

### Export Module

- [ ] **2.14** Create index export at `src/api/site-generator/presets/index.ts`

```typescript
export * from './types';
export * from './presets';
export { buildImagePrompt } from './presets';
```

---

## Verification Checklist

- [ ] All 10 Tier 1 presets are defined
- [ ] Each preset has all required fields
- [ ] `buildImagePrompt` generates correct format
- [ ] Lookup functions work correctly
- [ ] TypeScript compiles without errors
- [ ] Module exports correctly from index

---

## Example Output

For Emergency Plumber, `buildImagePrompt()` should produce:

```
Full-page website screenshot, portrait orientation, 1440px × 4800px.
Trusted 24/7 emergency plumbing company landing page, entire page from
header to footer in one continuous image.

Sections top to bottom: Sticky header with bold logo and prominent
emergency phone number → Full-screen hero with professional plumber
at work in modern home, urgent but reassuring headline, "Call Now"
and "Get Free Quote" dual CTAs, 24/7 availability badge → Trust bar
with response time, completed jobs count, and 5-star rating →
[...continues with all sections...]
```

---

## Next Steps

After completing this plan:
1. Proceed to **Plan 04: Reference Image Generation** (uses these presets)
2. Can also continue with **Plan 03: Identity Generation** in parallel
