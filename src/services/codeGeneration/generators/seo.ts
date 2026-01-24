// SEO Generator
// Generates sitemap.ts, robots.ts, and SEO utilities

import { CodeGenInputs, GeneratedFile } from '@/types/codeGeneration';

export interface GeneratorOptions {
	onFile?: (file: GeneratedFile) => void;
	abortSignal?: AbortSignal;
}

/**
 * Generate SEO-related files
 */
export async function generateSEOFiles(
	inputs: CodeGenInputs,
	options: GeneratorOptions = {}
): Promise<GeneratedFile[]> {
	const { onFile, abortSignal } = options;
	const files: GeneratedFile[] = [];

	const emit = (file: GeneratedFile) => {
		files.push(file);
		onFile?.(file);
	};

	if (abortSignal?.aborted) return files;

	const { sitePlan, seoPackage } = inputs;

	// Generate sitemap.ts
	emit({
		path: 'src/app/sitemap.ts',
		content: generateSitemap(inputs),
		type: 'page',
		encoding: 'utf-8',
	});

	// Generate robots.ts
	emit({
		path: 'src/app/robots.ts',
		content: generateRobots(inputs),
		type: 'page',
		encoding: 'utf-8',
	});

	// Generate metadata utility
	emit({
		path: 'src/lib/seo/generateMetadata.ts',
		content: generateMetadataUtil(inputs),
		type: 'lib',
		encoding: 'utf-8',
	});

	// Generate JSON-LD utility
	emit({
		path: 'src/lib/seo/jsonLd.tsx',
		content: generateJsonLdUtil(),
		type: 'lib',
		encoding: 'utf-8',
	});

	// SEO index export
	emit({
		path: 'src/lib/seo/index.ts',
		content: `export { generatePageMetadata } from './generateMetadata';
export { JsonLd } from './jsonLd';
`,
		type: 'lib',
		encoding: 'utf-8',
	});

	return files;
}

/**
 * Generate sitemap.ts
 */
function generateSitemap(inputs: CodeGenInputs): string {
	const { sitePlan } = inputs;
	const baseUrl = sitePlan.structure?.baseUrl || `https://${sitePlan.brand.domain}`;

	return `import { MetadataRoute } from 'next';
import { getSitePlan } from '@/lib/data/sitePlan';

export default function sitemap(): MetadataRoute.Sitemap {
  const sitePlan = getSitePlan();
  const baseUrl = '${baseUrl}';

  const pages = sitePlan.pages.map((page) => ({
    url: \`\${baseUrl}\${page.url}\`,
    lastModified: new Date(),
    changeFrequency: getChangeFrequency(page.type) as 'weekly' | 'monthly' | 'yearly',
    priority: getPriority(page.priority),
  }));

  return pages;
}

function getChangeFrequency(pageType: string): string {
  switch (pageType) {
    case 'homepage':
    case 'provider_listing':
    case 'comparison':
      return 'weekly';
    case 'provider_profile':
    case 'cost_guide':
      return 'monthly';
    case 'about':
    case 'methodology':
    case 'legal':
      return 'yearly';
    default:
      return 'monthly';
  }
}

function getPriority(priority: number): number {
  switch (priority) {
    case 1:
      return 1.0;
    case 2:
      return 0.8;
    case 3:
      return 0.6;
    default:
      return 0.5;
  }
}
`;
}

/**
 * Generate robots.ts
 */
function generateRobots(inputs: CodeGenInputs): string {
	const { sitePlan } = inputs;
	const baseUrl = sitePlan.structure?.baseUrl || `https://${sitePlan.brand.domain}`;

	return `import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin/'],
    },
    sitemap: '${baseUrl}/sitemap.xml',
  };
}
`;
}

/**
 * Generate metadata utility
 */
function generateMetadataUtil(inputs: CodeGenInputs): string {
	const { sitePlan } = inputs;
	const baseUrl = sitePlan.structure?.baseUrl || `https://${sitePlan.brand.domain}`;

	return `import { Metadata } from 'next';
import { getSEOForPage } from '@/lib/data/seo';

interface PageMetadataOptions {
  pageId: string;
  fallbackTitle?: string;
  fallbackDescription?: string;
}

/**
 * Generate page metadata from SEO package
 */
export function generatePageMetadata({
  pageId,
  fallbackTitle,
  fallbackDescription,
}: PageMetadataOptions): Metadata {
  const seoData = getSEOForPage(pageId);

  if (!seoData) {
    return {
      title: fallbackTitle || '${sitePlan.brand.name}',
      description: fallbackDescription || '${sitePlan.brand.tagline || 'Your trusted local resource'}',
    };
  }

  return {
    title: seoData.meta.title,
    description: seoData.meta.description,
    alternates: {
      canonical: seoData.meta.canonical,
    },
    openGraph: {
      title: seoData.meta.openGraph?.title || seoData.meta.title,
      description: seoData.meta.openGraph?.description || seoData.meta.description,
      url: seoData.meta.canonical,
      siteName: '${sitePlan.brand.name}',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: seoData.meta.twitter?.title || seoData.meta.title,
      description: seoData.meta.twitter?.description || seoData.meta.description,
    },
    robots: seoData.meta.robots,
  };
}

/**
 * Build canonical URL
 */
export function buildCanonicalUrl(path: string): string {
  const baseUrl = '${baseUrl}';
  return \`\${baseUrl}\${path}\`;
}
`;
}

/**
 * Generate JSON-LD utility component
 */
function generateJsonLdUtil(): string {
	return `interface JsonLdProps {
  schemas: Array<{
    type: string;
    json: Record<string, unknown>;
  }>;
}

/**
 * Inject JSON-LD structured data
 */
export function JsonLd({ schemas }: JsonLdProps) {
  if (!schemas || schemas.length === 0) return null;

  return (
    <>
      {schemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema.json),
          }}
        />
      ))}
    </>
  );
}

/**
 * Create Organization schema
 */
export function createOrganizationSchema(options: {
  name: string;
  url: string;
  logo?: string;
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: options.name,
    url: options.url,
    ...(options.logo && { logo: options.logo }),
  };
}

/**
 * Create LocalBusiness schema
 */
export function createLocalBusinessSchema(options: {
  name: string;
  address?: {
    streetAddress?: string;
    city: string;
    state: string;
    postalCode?: string;
  };
  phone?: string;
  rating?: {
    value: number;
    count: number;
  };
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: options.name,
    ...(options.address && {
      address: {
        '@type': 'PostalAddress',
        addressLocality: options.address.city,
        addressRegion: options.address.state,
        ...(options.address.streetAddress && {
          streetAddress: options.address.streetAddress,
        }),
        ...(options.address.postalCode && {
          postalCode: options.address.postalCode,
        }),
      },
    }),
    ...(options.phone && { telephone: options.phone }),
    ...(options.rating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: options.rating.value,
        reviewCount: options.rating.count,
      },
    }),
  };
}

/**
 * Create FAQPage schema
 */
export function createFAQSchema(
  faqs: Array<{ question: string; answer: string }>
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

/**
 * Create BreadcrumbList schema
 */
export function createBreadcrumbSchema(
  items: Array<{ name: string; url: string }>
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export default JsonLd;
`;
}
