# Web Design Agent: Multi-Step Workflow for High-Quality Website Generation

> **Purpose:** A comprehensive plan for building an automated, multi-step web design agent that generates beautiful, SEO-optimized websites while avoiding "AI slop" — with strategic human-in-the-loop checkpoints for critical decisions.

---

## Executive Summary

Based on community research from Gemini Pro 3 Canvas practitioners and analysis of your existing prompt system, this document outlines an **image-first, iterative workflow** that transforms the current single-shot prompt generation into a multi-step agent pipeline. The key insight: **Generate a visual reference first, then extract the design system from it** — this produces unique, category-appropriate designs without constraining Gemini's creativity.

### Core Principles

1. **Image-First Design**: Generate a full-page screenshot reference using AI, then extract colors/typography from it
2. **Structure-Only Prompts**: Image generation prompts specify sections and layout, NOT colors — let AI be creative
3. **Visual References > Text Descriptions**: AI-generated screenshots beat verbal style descriptions
4. **Explicit Anti-Slop Constraints**: Code generation prompts must include explicit "NEVER DO" lists
5. **Human Approval at Value Inflection Points**: Automate execution, but require human approval for decisions that compound (design direction, business name, production deployment)
6. **Supabase Edge Functions Backend**: Persist job state, secure API keys, enable resume-from-checkpoint

---

## Current System Analysis

### What We Have

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CURRENT ARCHITECTURE                             │
│                                                                     │
│   WebDesignerNode receives:                                        │
│   ├── Location (city, state, coordinates)                          │
│   ├── Category (from research node)                                │
│   ├── SERP data (score, quality, urgency)                          │
│   └── Demographics (for city profile)                              │
│                                                                     │
│   usePromptGeneration generates:                                   │
│   ├── Specialized Golden Prompt (via LLM)                          │
│   └── Business Name                                                │
│                                                                     │
│   Output: A text prompt for manual use in Gemini Canvas            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### What We Need

```
┌─────────────────────────────────────────────────────────────────────┐
│                    TARGET ARCHITECTURE                              │
│                                                                     │
│   WebDesignerNode orchestrates (via Supabase Edge Functions):      │
│   ├── Step 1.1: Generate Business Identity                         │
│   ├── Step 1.2a: Generate Reference Screenshot (Gemini Image)      │
│   ├── Step 1.2b: Extract Design Tokens from Screenshot             │
│   ├── Step 1.3: Generate Content Strategy                          │
│   ├── 🔴 HUMAN: Approve identity + reference image                 │
│   ├── Step 2.1: Generate Hero Section (from reference)             │
│   ├── Step 2.2: Generate Remaining Sections                        │
│   ├── Step 2.3: Refinement Pass                                    │
│   ├── Step 2.4: Assemble Next.js Project                           │
│   ├── Step 3.1: Push to GitHub                                     │
│   ├── Step 3.2: Deploy to Vercel Preview                           │
│   ├── 🔴 HUMAN: Approve preview                                    │
│   └── Step 3.3: Promote to Production                              │
│                                                                     │
│   Human Checkpoints:                                                │
│   ├── [✓] Reference image + business name (can regenerate)         │
│   ├── [✓] Preview approval (before production)                     │
│   └── [✓] Domain selection (before DNS config)                     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Backend Architecture: Supabase Edge Functions

### Why Not Frontend-Only?

| Aspect                | Frontend Orchestration      | Supabase Edge Functions    |
| --------------------- | --------------------------- | -------------------------- |
| **Reliability**       | Browser close = lost work   | Job survives disconnection |
| **Secrets**           | API keys in localStorage    | Keys in secure server env  |
| **Long operations**   | Can timeout, user must wait | Background processing      |
| **Batch processing**  | One at a time               | Queue multiple jobs        |
| **Resume capability** | None                        | Resume from any checkpoint |

### Recommended Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    HYBRID ARCHITECTURE                              │
│                                                                     │
│  Frontend (React)                                                  │
│  ├── Orchestrates flow (calls edge functions in sequence)          │
│  ├── Handles human checkpoints (UI for approval)                   │
│  ├── Displays progress/previews                                    │
│  └── Can disconnect between checkpoints safely                     │
│                                                                     │
│  Supabase Edge Functions                                           │
│  ├── /generate-identity     → Returns identity JSON                │
│  ├── /generate-reference    → Calls Gemini Image, returns URL      │
│  ├── /extract-design        → Analyzes image, returns tokens       │
│  ├── /generate-content      → Returns content strategy             │
│  ├── /generate-hero         → Returns hero HTML/CSS                │
│  ├── /generate-section      → Returns section HTML/CSS             │
│  ├── /assemble-nextjs       → Returns complete project files       │
│  ├── /push-to-github        → Creates repo, returns URL            │
│  └── /deploy-to-vercel      → Deploys, returns preview URL         │
│                                                                     │
│  Supabase Tables                                                   │
│  └── site_generations                                              │
│      ├── id, project_id, status                                    │
│      ├── identity_json, design_tokens, reference_image_url         │
│      ├── hero_html, sections_json                                  │
│      ├── github_url, preview_url, production_url                   │
│      └── created_at, updated_at                                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Benefits

1. **API keys stay secure** — LLM keys, GitHub token, Vercel token all in Supabase secrets
2. **Job state persists** — User can close browser, return later, resume from checkpoint
3. **No new infrastructure** — Already using Supabase; just add more edge functions
4. **Frontend stays responsive** — Each function call is 30-90 seconds, not 8 minutes
5. **Easy batch mode later** — Queue multiple jobs in the table

---

## Research Synthesis: What Works

### Key Findings from Gemini Canvas Community

| Finding                                            | Implication for Our System                      |
| -------------------------------------------------- | ----------------------------------------------- |
| Hero section establishes design system             | Split generation: hero first, then sections     |
| Screenshot references beat text descriptions       | Include reference image upload capability       |
| Brand guides transform output quality              | Generate design tokens document first           |
| "NEVER use Inter/Roboto" explicitly stated works   | Hard-code anti-slop constraints in every prompt |
| Section-by-section + "don't change anything else"  | Each step includes negative constraints         |
| XML-structured prompts outperform natural language | Use structured prompt format                    |
| 90% AI + 10% human polish is the sweet spot        | Plan for iteration, not perfection              |
| Typography is the #1 differentiator                | Generate font pairing first, enforce throughout |

### The Purple Slop Problem

The community has identified a specific "AI slop" aesthetic that Gemini defaults to:

```
AI SLOP CHARACTERISTICS (What We're Avoiding):
─────────────────────────────────────────────
❌ Purple-to-blue gradients on white
❌ Inter, Roboto, Arial, Space Grotesk fonts
❌ Centered Bootstrap-style 3-column layouts
❌ Generic Lucide/Heroicons usage
❌ "Trusted by" grayscale logo bars
❌ Floating geometric blob shapes
❌ Stock photo with gradient overlay
❌ Testimonial carousels
❌ Cookie-cutter hero sections
```

Our prompts must **explicitly ban these** in every code generation step.

---

## Category Presets for Reference Image Generation

Each Tier 1 category has a predefined prompt structure. These specify layout and sections only — **no colors** — letting Gemini choose creative, category-appropriate palettes.

### Tier 1 Category Presets

```typescript
const CATEGORY_PRESETS: Record<string, ImagePromptParams> = {
	'emergency-plumber': {
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
		footer:
			'4-column footer with emergency contact, services list, service areas, and licensing info',
	},

	'garage-door-repair': {
		businessDescriptor:
			'Professional garage door repair and installation company',
		pageHeight: 4600,
		header:
			'Clean header with logo, phone number, and "Get Free Estimate" button',
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
		footer:
			'Professional footer with contact info, service areas, hours, and licensing',
	},

	'appliance-repair': {
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
	},

	'junk-removal': {
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
	},

	locksmith: {
		businessDescriptor: '24/7 emergency locksmith service',
		pageHeight: 4600,
		header:
			'Urgent header with logo, prominent phone number, and "Call Now" button',
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
	},

	'water-damage-restoration': {
		businessDescriptor:
			'24/7 water damage restoration and emergency cleanup company',
		pageHeight: 5000,
		header:
			'Urgent header with logo, emergency phone number, and "Get Help Now" button',
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
		footer:
			'Footer with emergency contact, services, certifications, and insurance info',
	},

	'hvac-repair': {
		businessDescriptor: 'Professional HVAC repair and installation company',
		pageHeight: 4800,
		header:
			'Clean header with logo, phone number, and "Schedule Service" button',
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
		footer:
			'Footer with contact, services, areas, and licensing/certifications',
	},

	'pest-control': {
		businessDescriptor: 'Professional pest control and extermination service',
		pageHeight: 4600,
		header:
			'Trustworthy header with logo, phone number, and "Get Free Inspection" button',
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
	},

	'house-cleaning': {
		businessDescriptor: 'Professional house cleaning and maid service',
		pageHeight: 4500,
		header:
			'Fresh clean header with logo, phone number, and "Book Cleaning" button',
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
	},

	'pool-service': {
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
	},
};
```

### Page Height Formula

Based on section count: `3000 + (SECTION_COUNT × 250)`

| Sections | Height |
| -------- | ------ |
| 6-8      | 4500px |
| 9-11     | 5000px |
| 12+      | 5500px |

---

## Multi-Step Workflow Design

### Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                    GENERATION PIPELINE                              │
│                                                                     │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐             │
│  │   PHASE 1   │    │   PHASE 2   │    │   PHASE 3   │             │
│  │   PREPARE   │───▶│   BUILD     │───▶│   DEPLOY    │             │
│  └─────────────┘    └─────────────┘    └─────────────┘             │
│                                                                     │
│  Phase 1: Prepare                                                  │
│  ├── 1.1 Generate Business Identity                                │
│  ├── 1.2a Generate Reference Screenshot (Gemini Image)            │
│  ├── 1.2b Extract Design Tokens from Screenshot                   │
│  ├── 1.3 Generate Content Strategy                                │
│  └── 🔴 HUMAN CHECKPOINT: Approve name + reference image          │
│                                                                     │
│  Phase 2: Build                                                    │
│  ├── 2.1 Generate Hero Section (matching reference)               │
│  ├── 2.2 Generate Remaining Sections                              │
│  ├── 2.3 Refinement Pass                                          │
│  └── 2.4 Assemble Next.js Project                                 │
│                                                                     │
│  Phase 3: Deploy                                                   │
│  ├── 3.1 Push to GitHub                                           │
│  ├── 3.2 Deploy to Vercel Preview                                 │
│  ├── 🔴 HUMAN CHECKPOINT: Approve preview                         │
│  └── 3.3 Promote to Production                                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Prepare

### Step 1.1: Generate Business Identity

**Purpose:** Create the brand foundation before any visual work.

**Input:**

- Location (city, state, service area)
- Category
- Competition level (from SERP analysis)
- Demographics

**Output:**

```typescript
interface BusinessIdentity {
	name: string; // "Phoenix Plumbing Pros"
	tagline: string; // "Phoenix's 24/7 Emergency Plumber"
	yearsInBusiness: number; // 12
	domainSuggestions: string[];
	ownerStory: {
		name: string; // "Mike Rodriguez"
		background: string; // Brief founder story
	};
	credentials: {
		license: string; // "ROC #123456"
		insurance: string; // "Fully Insured"
		certifications: string[];
	};
}
```

**Prompt Structure:**

```xml
<context>
Generate a business identity for a lead generation landing page.
Location: {{city}}, {{state}}
Category: {{category}}
Competition: {{competition_level}}
</context>

<requirements>
- Name must follow Tier {{tier}} naming pattern (see naming strategy)
- Name must work as a .com domain (under 25 chars, no hyphens)
- Tagline: 8-12 words, includes location, speaks to outcome
- Owner story: Plausible, local-feeling, 2-3 sentences
- Credentials: Realistic for {{state}} (research actual license formats)
</requirements>

<constraints>
NEVER include:
- "Best" or "#1" claims in the name
- "Near Me" in the name
- "Get Quotes" or comparison-style language
- Generic modifiers like "Services" or "Solutions"
</constraints>

<output>
JSON object matching BusinessIdentity interface
</output>
```

### Step 1.2a: Generate Reference Screenshot

**Purpose:** Create a unique visual reference that Gemini designs creatively, without constraining colors.

**Key Insight:** By NOT specifying colors in the image prompt, we let Gemini choose a cohesive, category-appropriate palette. This produces more unique, professional results than prescribing colors.

**Prompt Template (Structure-Only):**

```
Full-page website screenshot, portrait orientation, 1440px × {{PAGE_HEIGHT}}px.
{{BUSINESS_DESCRIPTOR}} landing page, entire page from header to footer in one continuous image.

Sections top to bottom: {{HEADER}} → {{HERO}} → {{SECTIONS_LIST}} → {{FOOTER}}.
```

**Template Parameters:**

```typescript
interface ImagePromptParams {
	businessDescriptor: string; // "Trusted 24/7 emergency plumbing company"
	pageHeight: number; // 4500-5500 based on section count
	header: string; // "Sticky header with bold logo and prominent emergency phone number"
	hero: string; // "Full-screen hero with professional plumber at work..."
	sections: string[]; // Array of section descriptions
	footer: string; // "4-column footer with emergency contact..."
}

function buildImagePrompt(params: ImagePromptParams): string {
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

**Example Output Prompt (Emergency Plumber):**

```
Full-page website screenshot, portrait orientation, 1440px × 4800px.
Trusted 24/7 emergency plumbing company landing page, entire page from
header to footer in one continuous image.

Sections top to bottom: Sticky header with bold logo and prominent
emergency phone number → Full-screen hero with professional plumber
at work in modern home, urgent but reassuring headline, "Call Now"
and "Get Free Quote" dual CTAs, 24/7 availability badge → Trust bar
with response time, completed jobs count, and 5-star rating →
6-card emergency services grid: Burst Pipes, Water Heater, Drain
Cleaning, Sewer Line, Leak Detection, Fixture Repair with relevant
imagery → "Why Choose Us" 4-column section: Licensed, Insured, Fast
Response, Upfront Pricing with icons → 3 customer testimonial cards
with star ratings and emergency repair stories → "How It Works"
3-step process: Call, We Dispatch, Problem Solved with numbered
steps → Service area map showing coverage zones → About section
with owner photo, license numbers, and certification badges → Bold
CTA banner with phone number and "Available 24/7" messaging →
4-column footer with emergency contact, services list, service
areas, and licensing info.
```

---

### Step 1.2b: Extract Design Tokens from Screenshot

**Purpose:** Analyze the AI-generated screenshot to extract the design system Gemini chose.

**Input:** The generated screenshot image from Step 1.2a

**Extraction Prompt:**

```xml
<context>
Analyze this website screenshot and extract a complete design system.
This is an AI-generated mockup for a {{category}} landing page.
</context>

<extract>
1. COLOR PALETTE
   - Sample the exact hex colors visible in the image
   - Identify: primary, secondary, accent, background, text colors
   - Note any gradients or color transitions

2. TYPOGRAPHY CHARACTERISTICS
   - Headline style: serif/sans-serif, weight, condensed/extended
   - Body style: matching characteristics
   - Suggest specific Google Fonts that match these characteristics

3. LAYOUT APPROACH
   - Hero structure (full-width, split, asymmetric)
   - Section patterns visible
   - Spacing rhythm (generous/compact)
   - Grid structure (if apparent)

4. VISUAL ELEMENTS
   - Background treatment (solid, gradient, texture, image)
   - Card/container styles
   - Button styles
   - Any decorative elements

5. OVERALL VIBE
   - 3-5 keywords describing the aesthetic
</extract>

<output>
Return a JSON object with design tokens, then output complete CSS custom properties.
</output>
```

**Output:**

```typescript
interface ExtractedDesignTokens {
	colors: {
		primary: string; // "#1E3A5F"
		secondary: string; // "#F5A623"
		accent: string; // "#E55934"
		background: string; // "#FAFAF8"
		surface: string; // "#FFFFFF"
		surfaceAlt: string; // "#F0EDE8"
		text: string; // "#1A1A1A"
		textMuted: string; // "#6B7280"
	};
	typography: {
		headlineFont: string; // "DM Serif Display"
		bodyFont: string; // "Plus Jakarta Sans"
		headlineWeight: string; // "700"
		headlineStyle: 'condensed' | 'normal' | 'extended';
	};
	layout: {
		heroStyle: 'full-width' | 'split' | 'asymmetric';
		spacing: 'generous' | 'balanced' | 'compact';
		sectionPattern: string;
	};
	visualElements: {
		backgroundStyle: 'solid' | 'gradient' | 'textured';
		cardStyle: string;
		buttonStyle: string;
	};
	vibe: string[]; // ["Bold", "Professional", "Urgent", "Trustworthy"]
}
```

**CSS Output:**

```css
:root {
	/* Colors - extracted from reference image */
	--color-primary: #1e3a5f;
	--color-secondary: #f5a623;
	--color-accent: #e55934;
	--color-surface: #fafaf8;
	--color-surface-alt: #f0ede8;
	--color-text: #1a1a1a;
	--color-text-muted: #6b7280;

	/* Typography - matched to Google Fonts */
	--font-display: 'DM Serif Display', Georgia, serif;
	--font-body: 'Plus Jakarta Sans', -apple-system, sans-serif;
	--font-size-hero: clamp(2.5rem, 5vw + 1rem, 4.5rem);
	--font-size-h2: clamp(1.75rem, 3vw + 0.5rem, 2.5rem);
	--font-size-h3: clamp(1.25rem, 2vw + 0.5rem, 1.75rem);
	--font-size-body: clamp(1rem, 1vw + 0.5rem, 1.125rem);

	/* Spacing (8px base) */
	--space-1: 0.5rem;
	--space-2: 1rem;
	--space-3: 1.5rem;
	--space-4: 2rem;
	--space-6: 3rem;
	--space-8: 4rem;
	--space-12: 6rem;
}
```

### Step 1.3: Generate Content Strategy

**Purpose:** Create all copy before design, so Gemini has substance to work with.

**Output:**

```typescript
interface ContentStrategy {
	seo: {
		titleTag: string; // Under 60 chars
		metaDescription: string; // Under 160 chars
		h1: string;
		targetKeywords: string[];
	};
	hero: {
		headline: string; // 6-10 words
		subheadline: string; // 15-25 words
		primaryCTA: string; // Action verb + outcome
		secondaryCTA: string;
		trustAnchor: string; // One proof point
	};
	valueContent: {
		type:
			| 'emergency-tips'
			| 'cost-guide'
			| 'how-to-choose'
			| 'local-considerations';
		title: string;
		content: string; // 400+ words, genuinely helpful
	};
	services: Array<{
		name: string;
		description: string; // 30-50 words
		priceRange?: string;
	}>;
	faqs: Array<{
		question: string;
		answer: string; // 50-100 words
	}>;
	testimonials: Array<{
		name: string;
		location: string; // Neighborhood or city
		text: string; // 30-50 words
		rating: number;
	}>;
	footer: {
		nap: {
			name: string;
			address: string;
			phone: string;
		};
		hours: string;
		serviceAreas: string[];
		disclosure: string;
	};
}
```

### 🔴 HUMAN CHECKPOINT: Identity + Reference Image Approval

**What the human reviews:**

1. Business name — Does it sound legitimate? Domain available?
2. Generated reference image — Does the design look premium and category-appropriate?
3. Extracted colors — Do they work for this business type?
4. Content strategy — Is the headline compelling? FAQs relevant?

**UI Presentation:**

```
┌─────────────────────────────────────────────────────────────────────┐
│ 📋 Review Design Direction                                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ Business Name: Phoenix Plumbing Pros                               │
│ Domain: phoenixplumbingpros.com ✅ Available                       │
│                                                                     │
│ Tagline: "Phoenix's Trusted Emergency Plumbers — 24/7 Response"   │
│                                                                     │
│ ┌─ Generated Reference Image ──────────────────────────────────┐   │
│ │ ┌─────────────────────────────────────────────────────────┐  │   │
│ │ │                                                         │  │   │
│ │ │           [AI-generated website mockup]                 │  │   │
│ │ │                 Full-page preview                       │  │   │
│ │ │                    600×800                              │  │   │
│ │ │                                                         │  │   │
│ │ └─────────────────────────────────────────────────────────┘  │   │
│ │ [🔄 Regenerate Image]  [📤 Upload Own Reference]             │   │
│ └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│ ┌─ Extracted Design System ────────────────────────────────────┐   │
│ │ Colors:                                                       │   │
│ │ ██ #1E3A5F  ██ #F5A623  ██ #FAFAF8  ██ #1A1A1A              │   │
│ │ Primary     Accent      Surface     Text                      │   │
│ │                                                               │   │
│ │ Typography:                                                   │   │
│ │ Headline: DM Serif Display (Bold)                            │   │
│ │ Body: Plus Jakarta Sans (Regular)                            │   │
│ │                                                               │   │
│ │ Vibe: Bold, Professional, Urgent, Trustworthy                │   │
│ └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│ Hero Headline: "Burst Pipe? Phoenix Trusts Us to Fix It Fast"     │
│                                                                     │
│ [🔄 Regenerate All]  [✏️ Adjust]  [✅ Approve & Continue]         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Why this checkpoint:**

- Reference image sets the entire visual direction — easy to regenerate here, expensive later
- Business name compounds throughout (domain, schema, all mentions)
- Extracted colors will be used for all code generation
- Human can quickly spot if the design "feels wrong" for the category
- Cost of bad decision here: entire rebuild

---

## Phase 2: Build

### Step 2.1: Generate Hero Section

**Purpose:** The hero establishes the design system. Get this right, and everything else follows.

**Community insight:** "50% of effort on hero section alone."

**Prompt Structure:**

```xml
<context>
Generate the hero section HTML/CSS for a {{category}} landing page.
Business: {{businessName}}
Location: {{city}}, {{state}}
</context>

<design_system>
{{paste design tokens from Step 1.2}}
</design_system>

<content>
Headline: {{hero.headline}}
Subheadline: {{hero.subheadline}}
Primary CTA: {{hero.primaryCTA}}
Trust Anchor: {{hero.trustAnchor}}
Phone: {{phone}}
</content>

<requirements>
- Full viewport hero (100vh or min-height: 80vh)
- Headline uses --font-display at --font-size-hero
- Phone number prominent (for emergency services)
- Single trust anchor, not a list
- Background: Use gradient mesh, subtle noise texture, or atmospheric depth — NOT flat color
- Animation: Subtle fade-in on load with staggered timing
</requirements>

<anti-slop>
NEVER include:
- Purple gradients of any kind
- Floating geometric blob shapes
- Stock photo of smiling contractor
- 3-column layout in hero
- Generic "Learn More" buttons
- Testimonial carousel
- "Trusted by" logo bar
</anti-slop>

<technical>
- Semantic HTML5 (<header>, <h1>)
- Mobile-first responsive
- Preload hero fonts
- Focus states on all interactive elements
</technical>

<output>
Complete HTML structure for hero section with embedded critical CSS
</output>
```

**Iteration Strategy:**

After initial generation, run refinement prompts:

```xml
<refinement_pass_1>
Review the hero section and improve:
1. Add subtle animation (fade-in with animation-delay stagger)
2. Ensure phone number has click-to-call on mobile
3. Add subtle background texture or gradient
4. Verify typography scale feels balanced

DO NOT change:
- The color palette
- The font choices
- The content/copy
</refinement_pass_1>
```

### 🔴 HUMAN CHECKPOINT: Hero Approval (Optional Fast-Track)

**Options:**

1. **Standard Mode**: Human reviews hero before proceeding
2. **Fast-Track Mode**: Skip to full preview at end (for experienced users)

**What the human reviews:**

- Does this look like a premium local business or generic template?
- Is the typography distinctive?
- Does the color palette feel right?
- Is the CTA clear and compelling?

**UI Presentation:**

```
┌─────────────────────────────────────────────────────────────────────┐
│ 🎨 Hero Section Preview                                            │
├─────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────┐   │
│ │                                                             │   │
│ │                   [Live preview iframe]                     │   │
│ │                        320px × 480px                        │   │
│ │                                                             │   │
│ └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│ Quick Checks:                                                      │
│ ├── ✅ Distinctive typography (not Inter/Roboto)                  │
│ ├── ✅ Non-purple color scheme                                    │
│ ├── ✅ Phone number prominent                                     │
│ └── ⚠️ Consider: Add background texture                          │
│                                                                     │
│ [🔄 Regenerate Hero]  [✏️ Refine]  [✅ Continue to Sections]      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Step 2.2: Generate Remaining Sections

**Purpose:** Build each section iteratively, maintaining design consistency.

**Section Order:**

1. Credibility Strip (quick trust signals)
2. Services Section
3. Value Content Section (required for Google compliance)
4. About/Trust Section
5. Testimonials
6. Lead Capture Form
7. FAQ Section
8. Service Area Section
9. Final CTA
10. Footer

**Per-Section Prompt Pattern:**

```xml
<context>
Generate the {{section_name}} section for the {{businessName}} landing page.
This follows the hero section already generated.
</context>

<design_continuity>
Use EXACTLY these design tokens — do not deviate:
{{paste design tokens}}

The hero section established this visual language:
- Typography: {{font_display}} for headings, {{font_body}} for text
- Colors: {{primary}} primary, {{accent}} for CTAs
- Spacing: 8px base rhythm
</design_continuity>

<content>
{{section-specific content from ContentStrategy}}
</content>

<requirements>
{{section-specific requirements}}
</requirements>

<constraints>
CRITICAL — DO NOT:
- Change the color palette
- Change the fonts
- Change the spacing scale
- Add any purple gradients
- Use 3-column card layouts
- Add testimonial carousels

KEEP the hero section exactly as it was — output only this new section.
</constraints>

<output>
HTML for {{section_name}} section with scoped CSS that uses the design tokens
</output>
```

**Value Content Section — Critical for Google Compliance:**

```xml
<context>
Generate the Value Content section — this is REQUIRED for Google quality compliance.
Type: {{valueContent.type}} (emergency-tips | cost-guide | how-to-choose | local-considerations)
</context>

<requirements>
- Minimum 400 words of genuinely helpful content
- Must pass the "stand alone" test: valuable even if visitor doesn't convert
- Include specific, actionable advice
- For emergency tips: Step-by-step safety instructions
- For cost guide: Actual price ranges with factors that affect cost
- For how-to-choose: Specific questions to ask, red flags to watch
- For local: Climate considerations, local codes, common issues in {{city}}
</requirements>

<output>
Complete HTML section with rich, helpful content
</output>
```

### Step 2.3: Refinement Pass

**Purpose:** Polish the full page after initial generation.

**Prompt:**

```xml
<context>
Review the complete landing page and perform final refinements.
</context>

<refinement_checklist>
1. Typography consistency — verify same fonts used throughout
2. Color consistency — no rogue colors outside the palette
3. Spacing rhythm — consistent use of spacing scale
4. Mobile responsiveness — check all breakpoints
5. Animation polish — ensure load animations are staggered
6. Accessibility — add any missing ARIA labels, ensure focus states
7. Form validation — add inline error message placeholders
8. Phone number — click-to-call on mobile
</refinement_checklist>

<seo_verification>
- Title tag under 60 chars with [Service] [City]
- Meta description under 160 chars with CTA
- H1 contains primary keyword + location
- All images have descriptive alt text with location
- Schema.org LocalBusiness JSON-LD complete
</seo_verification>

<output>
List of specific changes made, then the final optimized code
</output>
```

### Step 2.4: Assemble Next.js Project

**Purpose:** Structure the generated code into a deployable Next.js static site.

**Target Structure:**

```
generated-site/
├── package.json
├── next.config.js           # { output: 'export' }
├── tailwind.config.js
├── postcss.config.js
├── app/
│   ├── layout.tsx           # Root layout, fonts, metadata
│   ├── page.tsx             # Landing page (main content)
│   ├── about/
│   │   └── page.tsx         # About page (if needed)
│   ├── services/
│   │   └── page.tsx         # Services page (if needed)
│   └── contact/
│       └── page.tsx         # Contact page (if needed)
├── components/
│   ├── Hero.tsx
│   ├── CredibilityStrip.tsx
│   ├── Services.tsx
│   ├── ValueContent.tsx
│   ├── About.tsx
│   ├── Testimonials.tsx
│   ├── LeadForm.tsx
│   ├── FAQ.tsx
│   ├── ServiceArea.tsx
│   ├── FinalCTA.tsx
│   ├── Header.tsx
│   └── Footer.tsx
├── styles/
│   └── globals.css          # Design tokens + base styles
└── public/
    ├── robots.txt
    └── sitemap.xml
```

**Assembly Prompt:**

```xml
<context>
Convert the generated landing page sections into a Next.js App Router project.
</context>

<requirements>
- Use Next.js 14+ App Router
- Configure for static export (output: 'export')
- Use Tailwind CSS with custom design tokens
- Include proper metadata API usage for SEO
- Generate sitemap.xml
- Include schema.org JSON-LD in layout
</requirements>

<files_to_generate>
1. package.json with dependencies
2. next.config.js with static export config
3. tailwind.config.js with custom theme
4. app/layout.tsx with fonts and metadata
5. app/page.tsx assembling all components
6. Each component file
7. styles/globals.css with design tokens
</files_to_generate>

<output>
JSON object with file paths as keys and file contents as values
</output>
```

---

## Phase 3: Deploy

### Step 3.1: Push to GitHub

**Purpose:** Create a new repository for the generated site.

**Implementation Options:**

**Option A: GitHub API (Direct)**

```typescript
interface GitHubDeployment {
	repoName: string; // "phoenix-plumbing-pros"
	files: Record<string, string>; // path -> content
}

async function pushToGitHub(deployment: GitHubDeployment): Promise<string> {
	// 1. Create repository
	const repo = await octokit.repos.createForAuthenticatedUser({
		name: deployment.repoName,
		private: true,
		auto_init: false,
	});

	// 2. Create initial commit with all files
	// Using Git Data API for atomic commit

	return repo.data.html_url;
}
```

**Option B: GitHub MCP**

```typescript
// If using @modelcontextprotocol/server-github
await mcp.call('github', 'create_repository', { name: repoName });
await mcp.call('github', 'push_files', { repo: repoName, files });
```

### Step 3.2: Deploy to Vercel Preview

**Purpose:** Create a preview deployment for human review.

**Implementation:**

```typescript
interface VercelDeployment {
	repoUrl: string;
	projectName: string;
}

async function deployToVercel(config: VercelDeployment): Promise<{
	previewUrl: string;
	deploymentId: string;
}> {
	// 1. Create Vercel project linked to GitHub repo
	const project = await vercelAPI.post('/v10/projects', {
		name: config.projectName,
		gitRepository: {
			type: 'github',
			repo: config.repoUrl,
		},
	});

	// 2. Trigger deployment (or wait for auto-deploy)
	const deployment = await vercelAPI.post('/v13/deployments', {
		name: config.projectName,
		gitSource: { ref: 'main', type: 'github' },
	});

	return {
		previewUrl: deployment.url,
		deploymentId: deployment.id,
	};
}
```

### 🔴 HUMAN CHECKPOINT: Preview Approval

**What the human reviews:**

1. Full page render in preview URL
2. Mobile responsiveness (test on phone or dev tools)
3. Form submission works
4. Phone click-to-call works
5. Overall "would you call this business?" gut check

**UI Presentation:**

```
┌─────────────────────────────────────────────────────────────────────┐
│ 🌐 Preview Deployment Ready                                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ Preview URL: https://phoenix-plumbing-pros-abc123.vercel.app       │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────┐   │
│ │                                                             │   │
│ │                   [Embedded iframe]                         │   │
│ │                      Full preview                           │   │
│ │                                                             │   │
│ └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│ [🔗 Open in New Tab]  [📱 Mobile View]  [💻 Desktop View]         │
│                                                                     │
│ Quality Checklist:                                                 │
│ ├── [ ] Does it look like a real local business?                  │
│ ├── [ ] Is the phone number clickable?                            │
│ ├── [ ] Does the form work?                                       │
│ ├── [ ] Does it load fast?                                        │
│ └── [ ] Would YOU call this number?                               │
│                                                                     │
│ [🔄 Request Changes]  [❌ Reject]  [✅ Approve for Production]    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**"Request Changes" Flow:**

```
┌─────────────────────────────────────────────────────────────────────┐
│ 📝 Request Changes                                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ What needs to change?                                              │
│ ┌─────────────────────────────────────────────────────────────┐   │
│ │ The hero text is too small on mobile. Make the headline     │   │
│ │ larger and add more contrast to the CTA button.             │   │
│ │                                                             │   │
│ └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│ [Cancel]  [Submit Changes → Regenerate]                            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

The change request becomes a refinement prompt, and the cycle repeats.

### Step 3.3: Promote to Production

**After human approval:**

```typescript
async function promoteToProduction(deploymentId: string): Promise<string> {
	// Promote deployment to production
	await vercelAPI.patch(`/v13/deployments/${deploymentId}`, {
		target: 'production',
	});

	// If custom domain is configured, add it
	if (customDomain) {
		await vercelAPI.post(`/v10/projects/${projectId}/domains`, {
			name: customDomain,
		});
	}

	return productionUrl;
}
```

---

## Human-in-the-Loop Decision Matrix

| Decision Point         | Why Human?                                    | Risk if Automated              | Automation Level                |
| ---------------------- | --------------------------------------------- | ------------------------------ | ------------------------------- |
| **Business Name**      | Brand/legal implications, domain availability | Bad name propagates everywhere | Human REQUIRED                  |
| **Design Direction**   | Taste, brand fit                              | Subjective quality issues      | Human REQUIRED                  |
| **Hero Approval**      | "Does it look real?" test                     | Compound errors                | Optional (fast-track available) |
| **Preview Approval**   | Full quality check                            | Bad site goes live             | Human REQUIRED                  |
| **Production Deploy**  | Financial commitment                          | Wasted hosting/domain costs    | Human REQUIRED                  |
| **Domain Purchase**    | Financial transaction                         | Wrong domain purchased         | Human REQUIRED                  |
| **DNS Configuration**  | Technical, no judgment                        | —                              | Fully automated                 |
| **Section Generation** | Follows design system                         | —                              | Fully automated                 |
| **GitHub Push**        | Technical, no judgment                        | —                              | Fully automated                 |
| **Code Assembly**      | Technical, no judgment                        | —                              | Fully automated                 |

### Recommended Default Mode

```
┌─────────────────────────────────────────────────────────────────────┐
│                    AUTOMATION LEVELS                                │
│                                                                     │
│  🟢 FULL AUTO (No human needed):                                   │
│  ├── Design token extraction                                       │
│  ├── Content generation                                            │
│  ├── Section-by-section building                                   │
│  ├── Code assembly                                                 │
│  ├── GitHub repository creation                                    │
│  ├── Vercel deployment                                             │
│  └── DNS configuration                                             │
│                                                                     │
│  🟡 OPTIONAL CHECKPOINT (Can fast-track):                          │
│  └── Hero section approval                                         │
│                                                                     │
│  🔴 REQUIRED CHECKPOINT (Cannot skip):                             │
│  ├── Business identity approval (name, design direction)           │
│  ├── Preview approval (before production)                          │
│  └── Domain selection (before purchase)                            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Technical Implementation

### Supabase Schema

```sql
-- Site generation jobs table
CREATE TABLE site_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  status TEXT NOT NULL DEFAULT 'idle',

  -- Phase 1: Prepare
  input_location JSONB,           -- { city, state, lat, lng }
  input_category TEXT,
  input_serp_data JSONB,
  identity_json JSONB,            -- BusinessIdentity
  reference_image_url TEXT,       -- Gemini-generated screenshot
  design_tokens JSONB,            -- ExtractedDesignTokens
  content_strategy JSONB,         -- ContentStrategy

  -- Phase 2: Build
  hero_html TEXT,
  sections_json JSONB,            -- { sectionName: html }[]
  assembled_files JSONB,          -- { path: content }

  -- Phase 3: Deploy
  github_repo_url TEXT,
  preview_url TEXT,
  deployment_id TEXT,
  production_url TEXT,

  -- Metadata
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX idx_site_generations_project ON site_generations(project_id);
CREATE INDEX idx_site_generations_status ON site_generations(status);
```

### New Files to Create

```
src/
├── api/
│   └── site-generator/
│       ├── index.ts              # Client for calling edge functions
│       ├── presets.ts            # Category presets for image prompts
│       └── types.ts              # All interfaces
├── hooks/
│   └── useSiteGeneration.ts      # Full workflow orchestration + state
├── components/nodes/
│   └── WebDesignerNode/
│       ├── WebDesignerNode.tsx   # Enhanced with multi-step UI
│       ├── ReferencePreview.tsx  # Checkpoint 1: Image + identity review
│       ├── DeployPreview.tsx     # Checkpoint 2: Preview approval
│       ├── ProgressTracker.tsx   # Pipeline status display
│       └── DomainSelector.tsx    # Domain suggestions UI
└── types/
    └── site-generation.ts        # All new interfaces

supabase/
└── functions/
    ├── generate-identity/
    │   └── index.ts              # Business name + brand
    ├── generate-reference/
    │   └── index.ts              # Gemini Image API call
    ├── extract-design/
    │   └── index.ts              # Multimodal design token extraction
    ├── generate-content/
    │   └── index.ts              # Content strategy
    ├── generate-hero/
    │   └── index.ts              # Hero section code
    ├── generate-section/
    │   └── index.ts              # Any section code (parameterized)
    ├── refine-page/
    │   └── index.ts              # Polish pass
    ├── assemble-nextjs/
    │   └── index.ts              # Build Next.js project
    ├── push-to-github/
    │   └── index.ts              # Create repo + push files
    ├── deploy-to-vercel/
    │   └── index.ts              # Deploy preview
    └── promote-to-production/
        └── index.ts              # Promote deployment
```

### Edge Function Example: generate-reference

```typescript
// supabase/functions/generate-reference/index.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(Deno.env.get('GOOGLE_AI_API_KEY')!);

Deno.serve(async (req) => {
	const { jobId, category, businessDescriptor } = await req.json();

	// Get category preset
	const preset = CATEGORY_PRESETS[category];
	if (!preset) {
		return new Response(JSON.stringify({ error: 'Unknown category' }), {
			status: 400,
		});
	}

	// Build structure-only prompt (no colors!)
	const prompt = buildImagePrompt({
		...preset,
		businessDescriptor: businessDescriptor || preset.businessDescriptor,
	});

	// Call Gemini Image model
	const model = genAI.getGenerativeModel({
		model: 'gemini-2.0-flash-exp-image-generation',
	});
	const result = await model.generateContent({
		contents: [{ role: 'user', parts: [{ text: prompt }] }],
		generationConfig: {
			responseModalities: ['image', 'text'],
		},
	});

	// Extract image from response
	const imagePart = result.response.candidates[0].content.parts.find((p) =>
		p.inlineData?.mimeType?.startsWith('image/')
	);

	if (!imagePart?.inlineData) {
		return new Response(JSON.stringify({ error: 'No image generated' }), {
			status: 500,
		});
	}

	// Upload to Supabase Storage
	const imageBuffer = Uint8Array.from(atob(imagePart.inlineData.data), (c) =>
		c.charCodeAt(0)
	);
	const fileName = `references/${jobId}.png`;

	const { data: uploadData, error: uploadError } = await supabase.storage
		.from('site-assets')
		.upload(fileName, imageBuffer, { contentType: 'image/png' });

	if (uploadError) throw uploadError;

	const {
		data: { publicUrl },
	} = supabase.storage.from('site-assets').getPublicUrl(fileName);

	// Update job record
	await supabase
		.from('site_generations')
		.update({
			reference_image_url: publicUrl,
			status: 'reference-generated',
		})
		.eq('id', jobId);

	return new Response(
		JSON.stringify({
			imageUrl: publicUrl,
			prompt: prompt,
		})
	);
});
```

### State Machine for Workflow

```typescript
type GenerationStage =
	| 'idle'
	| 'generating-identity'
	| 'generating-reference-image'
	| 'extracting-design-tokens'
	| 'generating-content'
	| 'awaiting-design-approval' // 🔴 Human checkpoint
	| 'generating-hero'
	| 'generating-sections'
	| 'refining'
	| 'assembling'
	| 'pushing-to-github'
	| 'deploying-preview'
	| 'awaiting-preview-approval' // 🔴 Human checkpoint
	| 'deploying-production'
	| 'complete'
	| 'error';

interface GenerationState {
	stage: GenerationStage;
	progress: number; // 0-100

	// Phase 1 outputs
	identity?: BusinessIdentity;
	referenceImageUrl?: string;
	designTokens?: ExtractedDesignTokens;
	contentStrategy?: ContentStrategy;

	// Phase 2 outputs
	heroHtml?: string;
	sectionsHtml?: Record<string, string>;
	assembledFiles?: Record<string, string>;

	// Phase 3 outputs
	githubUrl?: string;
	previewUrl?: string;
	deploymentId?: string;
	productionUrl?: string;

	// Error handling
	error?: string;
	canRetry?: boolean;
	retryFromStage?: GenerationStage;
}
```

### Frontend Hook

```typescript
// src/hooks/useSiteGeneration.ts
export function useSiteGeneration(projectId: string) {
	const [state, setState] = useState<GenerationState>({
		stage: 'idle',
		progress: 0,
	});

	// Resume from Supabase if job exists
	useEffect(() => {
		async function loadExistingJob() {
			const { data: job } = await supabase
				.from('site_generations')
				.select('*')
				.eq('project_id', projectId)
				.order('created_at', { ascending: false })
				.limit(1)
				.single();

			if (job && job.status !== 'complete') {
				// Resume from saved state
				setState(mapJobToState(job));
			}
		}
		loadExistingJob();
	}, [projectId]);

	const startGeneration = async (input: GenerationInput) => {
		// Create job record
		const { data: job } = await supabase
			.from('site_generations')
			.insert({
				project_id: projectId,
				status: 'generating-identity',
				input_location: input.location,
				input_category: input.category,
			})
			.select()
			.single();

		setState({ stage: 'generating-identity', progress: 5 });

		// Step 1.1: Generate identity
		const identity = await supabase.functions.invoke('generate-identity', {
			body: { jobId: job.id, ...input },
		});
		setState((s) => ({ ...s, identity: identity.data, progress: 15 }));

		// Step 1.2a: Generate reference image
		setState((s) => ({
			...s,
			stage: 'generating-reference-image',
			progress: 20,
		}));
		const reference = await supabase.functions.invoke('generate-reference', {
			body: { jobId: job.id, category: input.category },
		});
		setState((s) => ({
			...s,
			referenceImageUrl: reference.data.imageUrl,
			progress: 40,
		}));

		// Step 1.2b: Extract design tokens
		setState((s) => ({
			...s,
			stage: 'extracting-design-tokens',
			progress: 45,
		}));
		const tokens = await supabase.functions.invoke('extract-design', {
			body: { jobId: job.id, imageUrl: reference.data.imageUrl },
		});
		setState((s) => ({ ...s, designTokens: tokens.data, progress: 55 }));

		// Step 1.3: Generate content
		setState((s) => ({ ...s, stage: 'generating-content', progress: 60 }));
		const content = await supabase.functions.invoke('generate-content', {
			body: {
				jobId: job.id,
				identity: identity.data,
				category: input.category,
			},
		});
		setState((s) => ({
			...s,
			contentStrategy: content.data,
			stage: 'awaiting-design-approval',
			progress: 70,
		}));

		// Now wait for human approval...
	};

	const approveDesign = async () => {
		// Continue to Phase 2...
	};

	const approvePreview = async () => {
		// Continue to production...
	};

	const regenerateImage = async () => {
		// Re-run Step 1.2a with same category
	};

	return {
		state,
		startGeneration,
		approveDesign,
		approvePreview,
		regenerateImage,
	};
}
```

### WebDesignerNode Enhanced UI

```
┌─────────────────────────────────────────────────────────────────────┐
│ 🎨 Web Designer                                                  ≡ X│
├─────────────────────────────────────────────────────────────────────┤
│ ┌─ Input ──────────────────────────────────────────────────────┐   │
│ │ 📍 Phoenix, AZ │ 🏷️ Emergency Plumber │ 📊 Score: 82        │   │
│ └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│ ┌─ Pipeline Status ────────────────────────────────────────────┐   │
│ │ ✅ Identity   ✅ Design   🔄 Hero   ○ Sections   ○ Deploy   │   │
│ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 45%  │   │
│ └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│ ┌─ Current Step ───────────────────────────────────────────────┐   │
│ │ 🎨 Generating Hero Section...                                │   │
│ │                                                               │   │
│ │ ┌─────────────────────────────────────────────────────────┐  │   │
│ │ │              [Live preview as it generates]              │  │   │
│ │ └─────────────────────────────────────────────────────────┘  │   │
│ │                                                               │   │
│ │ Applying: DM Serif Display + Plus Jakarta Sans               │   │
│ │ Colors: Navy #1E3A5F, Orange #F5A623                        │   │
│ └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│ [⏸️ Pause]  [🔄 Restart]                                           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Anti-Slop Enforcement

### Hardcoded Constraints in Every Prompt

Every generation prompt MUST include this anti-slop block:

```xml
<anti_slop_requirements>
TYPOGRAPHY — NEVER USE:
- Inter
- Roboto
- Arial
- Space Grotesk
- Open Sans
- Segoe UI
- System UI defaults

COLORS — NEVER USE:
- Purple gradients (#8B5CF6, #7C3AED, etc.)
- Purple on white backgrounds
- Blue-purple combinations
- Generic purple accent colors

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
- Heroicons gradient variants

IMAGES — NEVER USE:
- Stock photo with gradient overlay
- Smiling contractor with family
- Generic handshake images
- Floating people cutouts

COPY — NEVER WRITE:
- "Get 3 Free Quotes"
- "Compare Prices From Top Pros"
- "We Connect You With..."
- "Our Network of Professionals"
- "100% Satisfaction Guaranteed" badges
- Countdown timers
- "Limited Time Offer" without specificity
</anti_slop_requirements>
```

### Validation Check

After each generation step, run a validation pass:

```typescript
interface SlopCheck {
	fontViolations: string[]; // Any banned fonts detected
	colorViolations: string[]; // Purple detected
	layoutViolations: string[]; // 3-column cards, etc.
	copyViolations: string[]; // Banned phrases
	score: number; // 0-100, higher is better
}

function checkForSlop(html: string, css: string): SlopCheck {
	// Regex checks for banned patterns
	// Return violations for human review or auto-regeneration
}
```

---

## Prompt Library

### Prompt Templates by Step

All prompts should be stored in `src/api/site-generator/prompts/`:

```
prompts/
├── identity.xml           # Business name + brand generation
├── design-system.xml      # Design tokens extraction/generation
├── content-strategy.xml   # All copy and SEO content
├── hero.xml               # Hero section generation
├── sections/
│   ├── credibility.xml
│   ├── services.xml
│   ├── value-content.xml
│   ├── about.xml
│   ├── testimonials.xml
│   ├── lead-form.xml
│   ├── faq.xml
│   ├── service-area.xml
│   ├── final-cta.xml
│   └── footer.xml
├── refinement.xml         # Polish pass
└── assembly.xml           # Next.js project assembly
```

### Prompt Version Control

Track prompt effectiveness:

```typescript
interface PromptVersion {
	id: string;
	version: number;
	template: string;
	successRate: number; // % of generations approved by humans
	slopScore: number; // Average slop check score
	createdAt: Date;
	notes: string;
}
```

---

## Success Metrics

### Quality Metrics

| Metric                   | Target  | How to Measure                         |
| ------------------------ | ------- | -------------------------------------- |
| First-pass approval rate | >60%    | % of previews approved without changes |
| Slop score               | >85/100 | Automated anti-slop validation         |
| Time to preview          | <5 min  | From start to Vercel preview URL       |
| Human intervention count | <3      | Number of checkpoints hit per site     |
| "Would you call?" rate   | >80%    | Human gut-check on preview             |

### Speed Metrics

| Stage                     | Target Time |
| ------------------------- | ----------- |
| Identity generation       | <30 sec     |
| Reference image (Gemini)  | <45 sec     |
| Design token extraction   | <20 sec     |
| Content strategy          | <45 sec     |
| Hero section              | <60 sec     |
| All sections              | <3 min      |
| Refinement                | <30 sec     |
| Assembly                  | <15 sec     |
| GitHub push               | <20 sec     |
| Vercel deploy             | <90 sec     |
| **Total (no human wait)** | **<9 min**  |

---

## Implementation Phases

### Phase 1: Infrastructure + Image Generation

- [ ] Create `site_generations` Supabase table for job state
- [ ] Implement `/generate-identity` edge function
- [ ] Implement `/generate-reference` edge function (Gemini Image API)
- [ ] Implement `/extract-design` edge function (multimodal LLM)
- [ ] Implement `/generate-content` edge function
- [ ] Create category presets module with all Tier 1 categories
- [ ] Create identity + reference image approval UI in WebDesignerNode

### Phase 2: Code Generation Pipeline

- [ ] Implement `/generate-hero` edge function
- [ ] Implement `/generate-section` edge function (parameterized)
- [ ] Implement `/refine-page` edge function
- [ ] Implement `/assemble-nextjs` edge function
- [ ] Create slop validation checker
- [ ] Add section progress UI with live preview

### Phase 3: Deployment Pipeline

- [ ] Implement `/push-to-github` edge function
- [ ] Implement `/deploy-to-vercel` edge function
- [ ] Implement `/promote-to-production` edge function
- [ ] Create preview approval UI with iframe embed
- [ ] Add domain suggestions UI (availability check only)

### Phase 4: Polish + Scale

- [ ] Add manual reference image upload option
- [ ] Implement prompt effectiveness tracking
- [ ] Add A/B testing for prompt variations
- [ ] Create batch generation mode (queue multiple jobs)
- [ ] Add template library from successful generations
- [ ] Implement job resume from any checkpoint

---

## Appendix A: Reference Image Prompt Examples

### Emergency Plumber

```
Full-page website screenshot, portrait orientation, 1440px × 4800px.
Trusted 24/7 emergency plumbing company landing page, entire page from
header to footer in one continuous image.

Sections top to bottom: Sticky header with bold logo and prominent
emergency phone number → Full-screen hero with professional plumber
at work in modern home, urgent but reassuring headline, "Call Now"
and "Get Free Quote" dual CTAs, 24/7 availability badge → Trust bar
with response time, completed jobs count, and 5-star rating →
6-card emergency services grid: Burst Pipes, Water Heater, Drain
Cleaning, Sewer Line, Leak Detection, Fixture Repair with relevant
imagery → "Why Choose Us" 4-column section: Licensed, Insured, Fast
Response, Upfront Pricing with icons → 3 customer testimonial cards
with star ratings and emergency repair stories → "How It Works"
3-step process: Call, We Dispatch, Problem Solved with numbered
steps → Service area map showing coverage zones → About section
with owner photo, license numbers, and certification badges → Bold
CTA banner with phone number and "Available 24/7" messaging →
4-column footer with emergency contact, services list, service
areas, and licensing info.
```

### Luxury Boutique Hotel

```
Full-page website screenshot, portrait orientation, 1440px × 5200px.
Luxury boutique hotel landing page, entire page from header to footer
in one continuous image.

Sections top to bottom: Elegant transparent header with refined logo,
"Book Your Stay" → Full-screen hero with breathtaking property exterior
or infinity pool view, subtle headline, arrival date picker overlay →
"The Experience" intro text on minimal background → Accommodations
section: 4 room/suite cards with stunning interiors, "From $XXX" pricing,
"View Room" links → Amenities grid (6 items): Spa, Fine Dining, Pool,
Fitness, Concierge, Activities with beautiful photography → Dining
section featuring on-site restaurant with food and ambiance shots →
Spa and wellness feature with treatment room imagery → Local experiences
section: Curated activities and excursions → Guest testimonials with
elegant card design → Location section with property map and travel
directions → Special offers banner → Sophisticated footer with
reservation phone and address.
```

---

## Appendix B: Code Generation Prompts

### Hero Section (From Reference Image)

```xml
<context>
Generate the hero section HTML/CSS for a {{category}} landing page.
Business: {{businessName}}
Location: {{city}}, {{state}}

You have a reference screenshot to match. Replicate the visual style closely.
</context>

<reference_image>
[Attached: AI-generated reference screenshot]
</reference_image>

<design_tokens>
{{paste extracted CSS custom properties}}
</design_tokens>

<content>
Headline: {{hero.headline}}
Subheadline: {{hero.subheadline}}
Primary CTA: {{hero.primaryCTA}}
Trust Anchor: {{hero.trustAnchor}}
Phone: {{phone}}
</content>

<requirements>
- Match the reference image's layout and visual treatment
- Use the extracted design tokens for colors and typography
- Full viewport hero (100vh or min-height: 80vh)
- Phone number prominent (for emergency services)
- Animation: Subtle fade-in on load with staggered timing
</requirements>

<anti-slop>
NEVER include even if reference shows them:
- Purple gradients of any kind
- Floating geometric blob shapes
- Generic "Learn More" buttons
- Testimonial carousel
- "Trusted by" logo bar
</anti-slop>

<output>
Complete HTML structure for hero section with embedded critical CSS
</output>
```

### Section Addition Pattern

```xml
<context>
Generate the {{section_name}} section for the {{businessName}} landing page.
Match the visual style established in the reference image and hero section.
</context>

<reference_image>
[Attached: Same AI-generated reference screenshot]
</reference_image>

<design_tokens>
{{paste extracted CSS custom properties}}
</design_tokens>

<content>
{{section-specific content from ContentStrategy}}
</content>

<constraints>
CRITICAL — DO NOT:
- Change the color palette
- Change the fonts
- Change the spacing scale
- Add any elements not consistent with the reference

Output ONLY this section's HTML/CSS.
</constraints>
```

---

## Conclusion

This plan transforms the current single-shot prompt generation into a sophisticated multi-step pipeline that:

1. **Image-first design**: Generate a visual reference with Gemini Image, then extract colors/typography from it
2. **Structure-only prompts**: Let AI be creative with colors by specifying layout, not aesthetics
3. **Separates concerns**: Identity → Reference Image → Design Tokens → Content → Build → Deploy
4. **Backend persistence**: Supabase Edge Functions enable resume-from-checkpoint and secure API key storage
5. **Maximizes automation**: Only 2 required human checkpoints (design approval, preview approval)
6. **Produces deployable sites**: Complete Next.js projects pushed to GitHub and deployed to Vercel

### Key Insights

1. **Image-first beats text-first**: AI-generated reference screenshots produce more unique, category-appropriate designs than text-described style specifications

2. **Structure-only prompts**: By NOT specifying colors in image generation prompts, we let Gemini choose creative, cohesive palettes appropriate for each category

3. **Category presets**: Pre-defined section structures for each Tier 1 category ensure consistent, high-quality layouts while allowing visual creativity

4. **Supabase backend**: Edge functions provide:
   - Secure API key storage (no localStorage)
   - Persistent job state (resume from any checkpoint)
   - Background processing (frontend stays responsive)
   - Easy path to batch generation

### Human-in-the-Loop Philosophy

Human judgment remains essential at **value inflection points**:

- **Reference image + identity**: Easy to regenerate here, expensive to fix later
- **Preview approval**: The "would you call this business?" gut check

Everything else — design token extraction, content generation, code generation, deployment — can and should be automated. The human provides creative direction and quality gates; the AI provides speed and consistency.
