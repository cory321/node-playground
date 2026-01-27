/**
 * Image Generation Service for Code Generation
 * Generates brand-matched images for the generated website using Gemini Image 3
 */

import { callGeminiImage } from '@/api/llm/gemini-image';
import { BrandDesignOutput, VisualAssets, ColorPalette } from '@/types/brandDesign';
import { SitePlannerOutput, PageBrief } from '@/types/sitePlanner';

// ============================================================================
// TYPES
// ============================================================================

export interface GeneratedImage {
  /** File path in the generated project, e.g., "public/images/hero.webp" */
  path: string;
  /** Base64 data URL of the image */
  dataUrl: string;
  /** Purpose of the image */
  purpose: ImagePurpose;
  /** Prompt used to generate the image */
  prompt: string;
  /** Aspect ratio used */
  aspectRatio: string;
}

export type ImagePurpose = 
  | 'hero'
  | 'section-background'
  | 'feature-illustration'
  | 'testimonial-background'
  | 'cta-background'
  | 'service-illustration'
  | 'about-photo'
  | 'decorative';

export interface ImageGenerationPlan {
  hero: ImagePromptSpec;
  sections: ImagePromptSpec[];
  decorative: ImagePromptSpec[];
}

export interface ImagePromptSpec {
  purpose: ImagePurpose;
  filename: string;
  prompt: string;
  aspectRatio: string;
}

export interface ImageGenProgress {
  current: number;
  total: number;
  currentImage: string;
  status: 'generating' | 'complete' | 'error';
}

// ============================================================================
// PROMPT BUILDING
// ============================================================================

/**
 * Build a base style prefix from visual assets
 */
function buildStylePrefix(visualAssets: VisualAssets, colors: ColorPalette): string {
  const { photography } = visualAssets;
  
  // Build color hints
  const primaryColor = colors.primary?.hex || '#3b82f6';
  const secondaryColor = colors.secondary?.hex || colors.accent?.hex || '';
  const colorHint = secondaryColor 
    ? `Color palette hints: ${primaryColor} and ${secondaryColor}.`
    : `Primary brand color: ${primaryColor}.`;
  
  return `${photography.description} ${colorHint} Mood: ${photography.mood}. Lighting: ${photography.lighting.join(', ')}.`;
}

/**
 * Build a hero image prompt for the homepage
 */
export function buildHeroPrompt(
  brandDesign: BrandDesignOutput,
  sitePlan: SitePlannerOutput
): ImagePromptSpec {
  const { visualAssets, colors } = brandDesign.designSystem;
  
  if (!visualAssets) {
    return {
      purpose: 'hero',
      filename: 'hero.webp',
      prompt: `Professional hero image for a ${sitePlan.meta.category} service website in ${sitePlan.meta.city}. Modern, clean, high-quality stock photo style.`,
      aspectRatio: '16:9',
    };
  }
  
  const stylePrefix = buildStylePrefix(visualAssets, colors);
  const { photography } = visualAssets;
  
  // Build subject-specific prompt based on category
  const categorySubject = getCategorySubject(sitePlan.meta.category, sitePlan.meta.city);
  
  const prompt = `${stylePrefix}

Create a stunning hero image for a ${sitePlan.meta.category} website. ${categorySubject}

Subject matter style: ${photography.subjectMatter.join(', ')}.
Composition: ${photography.composition.join(', ')}.
Color grading: ${photography.colorGrading}.
Depth of field: ${photography.depthOfField}.

The image should feel premium, trustworthy, and inviting. No text or logos.`;

  return {
    purpose: 'hero',
    filename: 'hero.webp',
    prompt,
    aspectRatio: '16:9',
  };
}

/**
 * Build section background prompts
 */
export function buildSectionPrompts(
  brandDesign: BrandDesignOutput,
  sitePlan: SitePlannerOutput
): ImagePromptSpec[] {
  const { visualAssets, colors, sections } = brandDesign.designSystem;
  const prompts: ImagePromptSpec[] = [];
  
  if (!visualAssets) {
    return [];
  }
  
  const stylePrefix = buildStylePrefix(visualAssets, colors);
  
  // Services/Features section
  prompts.push({
    purpose: 'feature-illustration',
    filename: 'services-bg.webp',
    prompt: `${stylePrefix}

Abstract background for a services section. Subtle, professional, not distracting. 
Should complement content overlaid on top. Soft gradients or subtle patterns.
Graphics style: ${visualAssets.graphics.illustrationStyle}.
Patterns: ${visualAssets.graphics.patterns.join(', ')}.
Color usage: ${visualAssets.graphics.colorUsage}.`,
    aspectRatio: '16:9',
  });
  
  // Trust/Testimonials section
  prompts.push({
    purpose: 'testimonial-background',
    filename: 'testimonials-bg.webp',
    prompt: `${stylePrefix}

Warm, inviting background for a testimonials section. Should evoke trust and authenticity.
Subtle texture or soft gradient. Human element suggested but abstract.
Mood: ${visualAssets.photography.mood}.
Keep it subtle enough for text overlay.`,
    aspectRatio: '16:9',
  });
  
  // CTA section
  prompts.push({
    purpose: 'cta-background',
    filename: 'cta-bg.webp',
    prompt: `${stylePrefix}

Bold, attention-grabbing background for a call-to-action section.
Should create urgency while remaining professional.
Graphics style: ${visualAssets.graphics.illustrationStyle}.
Decorative elements: ${visualAssets.graphics.decorativeElements.join(', ')}.
Primary brand color presence: ${colors.primary.hex}.`,
    aspectRatio: '16:9',
  });
  
  return prompts;
}

/**
 * Build decorative/illustration prompts
 */
export function buildDecorativePrompts(
  brandDesign: BrandDesignOutput,
  sitePlan: SitePlannerOutput
): ImagePromptSpec[] {
  const { visualAssets, colors } = brandDesign.designSystem;
  const prompts: ImagePromptSpec[] = [];
  
  if (!visualAssets) {
    return [];
  }
  
  const { graphics } = visualAssets;
  
  // About page illustration
  prompts.push({
    purpose: 'about-photo',
    filename: 'about-hero.webp',
    prompt: `${visualAssets.photography.description}

Professional photo for an "About Us" page for a ${sitePlan.meta.category} company.
Show a team environment or professional workspace. Authentic, not overly staged.
Subject matter: ${visualAssets.photography.subjectMatter.join(', ')}.
Mood: welcoming, trustworthy, professional.
Location context: ${sitePlan.meta.city} area.`,
    aspectRatio: '4:3',
  });
  
  // Service-related illustrations (3 small ones)
  const serviceCategories = sitePlan.meta.category.split(' ');
  const mainService = serviceCategories[0] || 'Service';
  
  prompts.push({
    purpose: 'service-illustration',
    filename: 'service-1.webp',
    prompt: `${graphics.description}

Illustration for ${mainService} services. 
Style: ${graphics.illustrationStyle}.
Mood: ${graphics.mood}.
Color usage: ${graphics.colorUsage}.
Should work as a card image or icon illustration.`,
    aspectRatio: '1:1',
  });
  
  prompts.push({
    purpose: 'service-illustration',
    filename: 'service-2.webp',
    prompt: `${graphics.description}

Illustration representing quality and expertise in ${sitePlan.meta.category}.
Style: ${graphics.illustrationStyle}.
Abstract or semi-abstract representation.
Color palette: ${colors.primary.hex} as dominant.`,
    aspectRatio: '1:1',
  });
  
  prompts.push({
    purpose: 'decorative',
    filename: 'pattern-bg.webp',
    prompt: `${graphics.description}

Subtle decorative pattern for website backgrounds.
Patterns: ${graphics.patterns.join(', ')}.
Elements: ${graphics.decorativeElements.join(', ')}.
Very subtle, low contrast, tileable.
Use brand colors: ${colors.primary.hex}.`,
    aspectRatio: '1:1',
  });
  
  return prompts;
}

/**
 * Create full image generation plan for a page
 */
export function createImagePlan(
  brandDesign: BrandDesignOutput,
  sitePlan: SitePlannerOutput
): ImageGenerationPlan {
  return {
    hero: buildHeroPrompt(brandDesign, sitePlan),
    sections: buildSectionPrompts(brandDesign, sitePlan),
    decorative: buildDecorativePrompts(brandDesign, sitePlan),
  };
}

// ============================================================================
// IMAGE GENERATION
// ============================================================================

/**
 * Generate all images for the homepage
 */
export async function generateHomepageImages(
  brandDesign: BrandDesignOutput,
  sitePlan: SitePlannerOutput,
  onProgress?: (progress: ImageGenProgress) => void
): Promise<GeneratedImage[]> {
  const plan = createImagePlan(brandDesign, sitePlan);
  const allSpecs = [plan.hero, ...plan.sections, ...plan.decorative];
  const images: GeneratedImage[] = [];
  
  for (let i = 0; i < allSpecs.length; i++) {
    const spec = allSpecs[i];
    
    onProgress?.({
      current: i + 1,
      total: allSpecs.length,
      currentImage: spec.filename,
      status: 'generating',
    });
    
    try {
      const dataUrl = await callGeminiImage(spec.prompt, spec.aspectRatio);
      
      images.push({
        path: `public/images/${spec.filename}`,
        dataUrl,
        purpose: spec.purpose,
        prompt: spec.prompt,
        aspectRatio: spec.aspectRatio,
      });
    } catch (error) {
      console.error(`Failed to generate image ${spec.filename}:`, error);
      // Continue with other images even if one fails
    }
  }
  
  onProgress?.({
    current: allSpecs.length,
    total: allSpecs.length,
    currentImage: '',
    status: 'complete',
  });
  
  return images;
}

/**
 * Generate images for a specific page type
 */
export async function generatePageImages(
  page: PageBrief,
  brandDesign: BrandDesignOutput,
  sitePlan: SitePlannerOutput,
  onProgress?: (progress: ImageGenProgress) => void
): Promise<GeneratedImage[]> {
  // For now, only generate full image sets for homepage
  // Other pages get minimal or no custom images
  if (page.type === 'homepage') {
    return generateHomepageImages(brandDesign, sitePlan, onProgress);
  }
  
  // For about page, generate just one image
  if (page.type === 'about') {
    const { visualAssets, colors } = brandDesign.designSystem;
    if (!visualAssets) return [];
    
    onProgress?.({
      current: 1,
      total: 1,
      currentImage: 'about-hero.webp',
      status: 'generating',
    });
    
    try {
      const dataUrl = await callGeminiImage(
        `${visualAssets.photography.description}
        
Professional photo for an About Us page. Team or workspace environment.
Mood: ${visualAssets.photography.mood}.
Authentic and welcoming.`,
        '16:9'
      );
      
      onProgress?.({
        current: 1,
        total: 1,
        currentImage: '',
        status: 'complete',
      });
      
      return [{
        path: 'public/images/about-hero.webp',
        dataUrl,
        purpose: 'about-photo',
        prompt: 'About page hero image',
        aspectRatio: '16:9',
      }];
    } catch (error) {
      console.error('Failed to generate about image:', error);
      return [];
    }
  }
  
  // Other page types don't get custom images
  return [];
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Get category-specific subject description for prompts
 */
function getCategorySubject(category: string, city: string): string {
  const categoryLower = category.toLowerCase();
  
  if (categoryLower.includes('hvac') || categoryLower.includes('heating') || categoryLower.includes('cooling')) {
    return `Show a comfortable modern home interior with visible HVAC elements. A happy family or homeowner in their climate-controlled home in ${city}.`;
  }
  
  if (categoryLower.includes('plumb')) {
    return `Modern bathroom or kitchen with beautiful fixtures. Clean, fresh, well-maintained home in ${city}.`;
  }
  
  if (categoryLower.includes('electric')) {
    return `Modern, well-lit home interior with beautiful lighting fixtures. Safe, modern electrical installation. ${city} area home.`;
  }
  
  if (categoryLower.includes('roof')) {
    return `Beautiful home exterior with an impressive roof. Curb appeal shot of a well-maintained house in ${city}.`;
  }
  
  if (categoryLower.includes('lawn') || categoryLower.includes('landscape')) {
    return `Stunning landscaped yard or garden. Beautiful outdoor living space in ${city}.`;
  }
  
  if (categoryLower.includes('clean')) {
    return `Spotless, pristine home interior. Fresh, clean living space that sparkles. ${city} home.`;
  }
  
  if (categoryLower.includes('pest') || categoryLower.includes('exterminator')) {
    return `Happy family in a clean, pest-free home. Safe, protected living environment in ${city}.`;
  }
  
  // Default for general home services
  return `Professional home service in action or beautiful, well-maintained home in ${city}. Trustworthy, quality service vibes.`;
}

/**
 * Extract base64 data from data URL for ZIP packaging
 */
export function extractBase64FromDataUrl(dataUrl: string): { data: string; mimeType: string } | null {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  
  return {
    mimeType: match[1],
    data: match[2],
  };
}
