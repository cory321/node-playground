/**
 * Golden Prompt for Homepage Generation
 * Uses Claude Opus 4.5 for highest quality output
 */

import { CodeGenInputs } from '@/types/codeGeneration';
import { BrandDesignOutput } from '@/types/brandDesign';
import { SitePlannerOutput } from '@/types/sitePlanner';
import { SEOOptimizedPackage } from '@/types/seoPackage';

/**
 * Build comprehensive context for homepage generation
 */
export function buildHomepageContext(inputs: CodeGenInputs): string {
  const { sitePlan, brandDesign, seoPackage } = inputs;
  
  // Extract design tokens
  const designTokens = extractDesignTokens(brandDesign);
  
  // Extract SEO data for homepage
  const homepageSeo = seoPackage.pages.find(p => p.pageId === 'homepage' || p.url === '/');
  
  // Build service list
  const services = sitePlan.pages
    .filter(p => p.type === 'service_hub' || p.type === 'service_detail')
    .map(p => p.title)
    .slice(0, 6);
  
  return `
## BRAND CONTEXT
- Brand Name: ${sitePlan.brand.name}
- Tagline: ${sitePlan.brand.tagline || 'Your Trusted Local Resource'}
- Domain: ${sitePlan.brand.domain}
- Location: ${sitePlan.meta.city}, ${sitePlan.meta.state}
- Category: ${sitePlan.meta.category}

## SERVICES OFFERED
${services.map(s => `- ${s}`).join('\n')}

## SEO REQUIREMENTS
- Title: ${homepageSeo?.title || sitePlan.brand.name}
- Meta Description: ${homepageSeo?.description || ''}
- Primary Keywords: ${homepageSeo?.keywords?.slice(0, 5).join(', ') || sitePlan.meta.category}

## DESIGN SYSTEM
${designTokens}

## VISUAL ASSETS AVAILABLE
${brandDesign.designSystem.visualAssets ? `
- Photography Style: ${brandDesign.designSystem.visualAssets.photography.mood}
- Graphics Style: ${brandDesign.designSystem.visualAssets.graphics.illustrationStyle}
- Icons: ${brandDesign.designSystem.visualAssets.icons.suggestedLibrary} (${brandDesign.designSystem.visualAssets.icons.style})
` : 'Default styling'}

## GENERATED IMAGES AVAILABLE
- /images/hero.webp - Hero section background
- /images/services-bg.webp - Services section background
- /images/testimonials-bg.webp - Testimonials background
- /images/cta-bg.webp - CTA section background
`;
}

/**
 * Extract design tokens as readable format for LLM
 */
function extractDesignTokens(brandDesign: BrandDesignOutput): string {
  const { colors, typography, spacing } = brandDesign.designSystem;
  
  return `
### Colors
- Primary: ${colors.primary.hex} (${colors.primary.name || 'brand primary'})
- Secondary: ${colors.secondary?.hex || 'N/A'}
- Accent: ${colors.accent?.hex || 'N/A'}
- Background: ${colors.backgrounds.main}
- Section Background: ${colors.backgrounds.section || colors.backgrounds.main}
- Text Primary: ${colors.text.primary}
- Text Secondary: ${colors.text.secondary || colors.text.primary}

### Typography
- Heading Font: ${typography.fontFamily.heading.name}
- Body Font: ${typography.fontFamily.body.name}
- H1 Size: ${typography.scale.h1}
- H2 Size: ${typography.scale.h2}
- Body Size: ${typography.scale.body}

### Spacing
- Section Padding: ${spacing.sectionPadding.y}
- Content Max Width: ${spacing.contentMaxWidth}
- Grid Gap: ${spacing.gridGap}
`;
}

/**
 * The golden prompt for homepage generation
 */
export const HOMEPAGE_GENERATION_PROMPT = `You are an expert Next.js developer creating a stunning, high-converting homepage for a local service directory website.

## YOUR TASK
Generate a complete, production-ready Next.js App Router page.tsx file for the homepage. This page must be beautiful, performant, and optimized for conversions.

## REQUIREMENTS

### Required Next.js Imports
Always include these imports at the top of the file:
- import Image from 'next/image';     // For all images
- import Link from 'next/link';       // For all internal navigation
- import { Metadata } from 'next';    // For SEO metadata export

### Technical Requirements
1. Use Next.js 14+ App Router conventions
2. TypeScript with proper type annotations
3. Tailwind CSS for all styling (use design tokens from context)
4. Server Component by default (no 'use client' unless needed)
5. Proper Metadata export for SEO
6. Import components from @/components/sections and @/components/ui
7. Use <Image> from next/image for all images (never use <img> tags)
8. Use <Link> from next/link for all internal links (never use <a> for internal navigation)
9. Responsive design (mobile-first)

### Component Library Available
Import these from @/components/sections:
- HeroSection - Full-width hero with headline, subheadline, CTA buttons
- ServicesSection - Grid of service categories with icons
- TrustIndicatorsSection - Stats, badges, trust signals
- TestimonialsSection - Customer testimonials carousel/grid
- HowItWorksSection - Step-by-step process explanation
- CTASection - Call-to-action with form or buttons
- FAQSection - Frequently asked questions accordion

Import these from @/components/ui:
- Button, Card, CardContent, CardHeader, Badge, Container

### Design Guidelines
1. Use the exact brand colors from the design system
2. Apply proper typography hierarchy
3. Include ample whitespace (use spacing tokens)
4. Ensure strong visual hierarchy
5. Use subtle shadows and rounded corners per brand
6. Include micro-interactions where appropriate

### Content Guidelines
1. Headlines should be compelling and benefit-focused
2. Include social proof elements
3. Clear value proposition above the fold
4. Multiple CTAs throughout the page
5. Address user pain points
6. Build trust with credentials and guarantees

### Image Usage
Use the generated images with next/image:
- Hero: /images/hero.webp (priority loading)
- Other sections: respective background images

## OUTPUT FORMAT
Return ONLY the complete page.tsx file content. No explanations, no markdown code blocks, just the raw TypeScript/JSX code.

Start with the imports and end with the default export.`;

/**
 * Build the complete prompt for homepage generation
 */
export function buildHomepagePrompt(inputs: CodeGenInputs): string {
  const context = buildHomepageContext(inputs);
  
  return `${HOMEPAGE_GENERATION_PROMPT}

## CONTEXT FOR THIS SPECIFIC SITE
${context}

Generate the homepage now. Remember: output ONLY the page.tsx code, nothing else.`;
}
