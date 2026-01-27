/**
 * Prompts for generating non-homepage pages
 * Uses Claude Haiku 4.5 for cost efficiency
 */

import { CodeGenInputs } from '@/types/codeGeneration';
import { PageBrief, PageType } from '@/types/sitePlanner';
import { SEOOptimizedPage } from '@/types/seoPackage';

/**
 * Get the model to use for a specific page type
 */
export function getModelForPageType(pageType: PageType): 'claude-opus' | 'claude-haiku' {
  // Only homepage gets the premium Opus treatment
  if (pageType === 'homepage') {
    return 'claude-opus';
  }
  // All other pages use cost-efficient Haiku
  return 'claude-haiku';
}

/**
 * Build context for a specific page
 */
export function buildPageContext(
  page: PageBrief,
  inputs: CodeGenInputs
): string {
  const { sitePlan, seoPackage, brandDesign } = inputs;
  
  // Find SEO data for this page
  const seoData = seoPackage.pages.find(p => p.pageId === page.id || p.url === page.url);
  
  // Find editorial content if available
  const editorial = inputs.editorialContent?.pages.find(p => p.pageId === page.id);
  
  return `
## PAGE DETAILS
- URL: ${page.url}
- Type: ${page.type}
- Title: ${page.title}
- Description: ${page.description || 'N/A'}

## BRAND
- Name: ${sitePlan.brand.name}
- Location: ${sitePlan.meta.city}, ${sitePlan.meta.state}
- Category: ${sitePlan.meta.category}

## SEO
- Title: ${seoData?.title || page.title}
- Meta Description: ${seoData?.description || ''}
- Keywords: ${seoData?.keywords?.slice(0, 5).join(', ') || ''}

## DESIGN TOKENS
- Primary Color: ${brandDesign.designSystem.colors.primary.hex}
- Heading Font: ${brandDesign.designSystem.typography.fontFamily.heading.name}
- Body Font: ${brandDesign.designSystem.typography.fontFamily.body.name}

${editorial ? `
## EDITORIAL CONTENT AVAILABLE
${JSON.stringify(editorial, null, 2).slice(0, 500)}...
` : ''}
`;
}

/**
 * Base prompt for all page types
 */
const BASE_PAGE_PROMPT = `You are a Next.js developer generating a page component.

## REQUIRED NEXT.JS IMPORTS
Always include these imports at the top of the file:
- import Image from 'next/image';     // For all images (never use <img> tags)
- import Link from 'next/link';       // For all internal navigation (never use <a> for internal links)
- import { Metadata } from 'next';    // For SEO metadata export

## REQUIREMENTS
1. Next.js 14+ App Router (page.tsx)
2. TypeScript with proper types
3. Tailwind CSS styling
4. Proper Metadata export
5. Import from @/components/layout, @/components/ui, @/components/content
6. Server Component (no 'use client' unless needed)
7. Use <Image> from next/image for all images
8. Use <Link> from next/link for all internal navigation

## AVAILABLE COMPONENTS
Layout: Breadcrumbs, Container
UI: Button, Card, CardContent, Badge, Input
Content: FAQSection, RichText, Prose

## OUTPUT
Return ONLY the page.tsx code. No markdown, no explanations.
Start with the required imports, then the Metadata export, then the component.`;

/**
 * Page-type specific prompt additions
 */
const PAGE_TYPE_PROMPTS: Partial<Record<PageType, string>> = {
  about: `
Create an About page that:
- Tells the brand story
- Builds trust and credibility
- Shows the team/company values
- Includes a brief history or mission statement
- Has a CTA to contact or explore services`,

  contact: `
Create a Contact page that:
- Has a clean contact form (name, email, phone, message)
- Shows contact information (address, phone, email)
- Includes a map placeholder or location info
- Has clear submission CTA
- Shows business hours if applicable`,

  methodology: `
Create a Methodology/How We Work page that:
- Explains the vetting/selection process
- Shows step-by-step how the service works
- Builds trust through transparency
- Uses icons or visuals to represent steps
- Includes a CTA to get started`,

  service_hub: `
Create a Service Hub page that:
- Lists all services in the category
- Has clear navigation to sub-services
- Includes brief descriptions of each service
- Shows CTAs to explore providers or get quotes
- Uses cards or grid layout`,

  service_detail: `
Create a Service Detail page that:
- Provides detailed information about the service
- Lists benefits and features
- Shows pricing ranges if available
- Includes FAQs about the service
- Has CTAs to find providers`,

  city_service: `
Create a City+Service page that:
- Targets the specific city and service
- Lists top providers in the area
- Includes local-focused content
- Shows FAQs relevant to the area
- Has CTAs to contact providers`,

  provider_listing: `
Create a Provider Listing page that:
- Lists providers in a clean grid/list
- Shows key info (name, rating, location)
- Has filtering/sorting UI elements
- Links to individual provider profiles
- Includes a CTA for users to request quotes`,

  provider_profile: `
Create a Provider Profile page that:
- Shows comprehensive provider information
- Displays ratings and reviews
- Lists services offered
- Shows contact information
- Has prominent CTA to get a quote`,

  comparison: `
Create a Comparison page that:
- Compares providers side-by-side
- Uses a clear table or card layout
- Highlights key differentiators
- Helps users make decisions
- Has CTAs to contact top choices`,

  cost_guide: `
Create a Cost Guide page that:
- Shows pricing ranges for services
- Lists factors that affect pricing
- Provides tips to save money
- Uses clear data visualization
- Has CTAs to get actual quotes`,

  legal: `
Create a Legal page (Privacy/Terms/Disclosure) that:
- Has clear, readable legal text
- Uses proper heading hierarchy
- Includes last updated date
- Is properly formatted for readability
- Matches brand styling`,
};

/**
 * Build the complete prompt for a page
 */
export function buildPagePrompt(page: PageBrief, inputs: CodeGenInputs): string {
  const context = buildPageContext(page, inputs);
  const typeSpecific = PAGE_TYPE_PROMPTS[page.type] || '';
  
  return `${BASE_PAGE_PROMPT}

${typeSpecific}

## CONTEXT
${context}

Generate the page.tsx now. Output ONLY the code.`;
}

/**
 * Validate and clean LLM-generated code
 */
export function cleanGeneratedCode(code: string): string {
  let cleaned = code.trim();
  
  // Remove markdown code blocks if present
  if (cleaned.startsWith('```typescript') || cleaned.startsWith('```tsx')) {
    cleaned = cleaned.replace(/^```(?:typescript|tsx)\n?/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\n?/, '');
  }
  
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.replace(/```$/, '');
  }
  
  return cleaned.trim();
}
