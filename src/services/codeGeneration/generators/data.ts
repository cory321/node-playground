// Data Generator
// Generates JSON data files and data accessor utilities

import { CodeGenInputs, GeneratedFile } from '@/types/codeGeneration';

export interface GeneratorOptions {
	onFile?: (file: GeneratedFile) => void;
	abortSignal?: AbortSignal;
}

/**
 * Generate data files and accessors
 */
export async function generateDataFiles(
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

	// Generate JSON data files for public/data/
	emit({
		path: 'public/data/sitePlan.json',
		content: JSON.stringify(sanitizeSitePlan(inputs.sitePlan), null, 2),
		type: 'data',
		encoding: 'utf-8',
	});

	emit({
		path: 'public/data/providers.json',
		content: JSON.stringify(sanitizeProviders(inputs.sitePlan.providers || []), null, 2),
		type: 'data',
		encoding: 'utf-8',
	});

	emit({
		path: 'public/data/editorial.json',
		content: JSON.stringify(inputs.editorialContent || { pages: [] }, null, 2),
		type: 'data',
		encoding: 'utf-8',
	});

	emit({
		path: 'public/data/comparisons.json',
		content: JSON.stringify(inputs.comparisonData || { comparisonPages: [], pricingPages: [] }, null, 2),
		type: 'data',
		encoding: 'utf-8',
	});

	emit({
		path: 'public/data/seo.json',
		content: JSON.stringify(sanitizeSEO(inputs.seoPackage), null, 2),
		type: 'data',
		encoding: 'utf-8',
	});

	// Generate data accessor utilities
	emit({
		path: 'src/lib/data/sitePlan.ts',
		content: generateSitePlanAccessor(inputs),
		type: 'lib',
		encoding: 'utf-8',
	});

	emit({
		path: 'src/lib/data/providers.ts',
		content: generateProvidersAccessor(inputs),
		type: 'lib',
		encoding: 'utf-8',
	});

	emit({
		path: 'src/lib/data/editorial.ts',
		content: generateEditorialAccessor(inputs),
		type: 'lib',
		encoding: 'utf-8',
	});

	emit({
		path: 'src/lib/data/comparisons.ts',
		content: generateComparisonsAccessor(inputs),
		type: 'lib',
		encoding: 'utf-8',
	});

	emit({
		path: 'src/lib/data/seo.ts',
		content: generateSEOAccessor(inputs),
		type: 'lib',
		encoding: 'utf-8',
	});

	// Data index export
	emit({
		path: 'src/lib/data/index.ts',
		content: `export { getSitePlan, getPageById, getPagesByType } from './sitePlan';
export { getProviders, getProviderById, getProviderProfile } from './providers';
export { getEditorialPage, getEditorialPages } from './editorial';
export { getComparisonData, getPricingData } from './comparisons';
export { getSEOForPage, getAllSEOPages } from './seo';
`,
		type: 'lib',
		encoding: 'utf-8',
	});

	return files;
}

/**
 * Sanitize site plan for JSON output (remove circular refs, functions, etc.)
 */
function sanitizeSitePlan(sitePlan: any): any {
	return {
		brand: sitePlan.brand,
		structure: sitePlan.structure,
		pages: sitePlan.pages.map((p: any) => ({
			id: p.id,
			type: p.type,
			url: p.url,
			priority: p.priority,
			seo: p.seo,
		})),
		contentClusters: sitePlan.contentClusters,
		meta: sitePlan.meta,
	};
}

/**
 * Sanitize providers for JSON output
 */
function sanitizeProviders(providers: any[]): any[] {
	return providers.map((p) => ({
		id: p.id,
		name: p.name,
		phone: p.phone,
		website: p.website,
		address: p.address,
		googleRating: p.googleRating,
		googleReviewCount: p.googleReviewCount,
		hasLSA: p.hasLSA,
		score: p.score,
		enrichment: p.enrichment ? {
			services: p.enrichment.services,
			pricing: p.enrichment.pricing,
			about: p.enrichment.about,
			credentials: p.enrichment.credentials,
			serviceArea: p.enrichment.serviceArea,
			emergencyService: p.enrichment.emergencyService,
		} : null,
	}));
}

/**
 * Sanitize SEO package for JSON output
 */
function sanitizeSEO(seoPackage: any): any {
	return {
		pages: seoPackage.pages.map((p: any) => ({
			pageId: p.pageId,
			url: p.url,
			type: p.type,
			meta: p.meta,
			schema: p.schema,
			breadcrumbs: p.breadcrumbs,
		})),
		siteWide: seoPackage.siteWide,
		generatedAt: seoPackage.generatedAt,
	};
}

/**
 * Generate site plan accessor
 */
function generateSitePlanAccessor(inputs: CodeGenInputs): string {
	return `import sitePlanData from '@/../public/data/sitePlan.json';

interface PageBrief {
  id: string;
  type: string;
  url: string;
  priority: number;
  seo?: {
    titleTemplate: string;
    descriptionTemplate: string;
  };
}

interface SitePlan {
  brand: {
    name: string;
    tagline?: string;
    domain: string;
  };
  pages: PageBrief[];
  meta: {
    city: string;
    state: string;
    category: string;
    pageCount: number;
  };
}

/**
 * Get the full site plan
 */
export function getSitePlan(): SitePlan {
  return sitePlanData as SitePlan;
}

/**
 * Get a page by its ID
 */
export function getPageById(id: string): PageBrief | undefined {
  return (sitePlanData as SitePlan).pages.find((p) => p.id === id);
}

/**
 * Get pages by type
 */
export function getPagesByType(type: string): PageBrief[] {
  return (sitePlanData as SitePlan).pages.filter((p) => p.type === type);
}
`;
}

/**
 * Generate providers accessor
 */
function generateProvidersAccessor(inputs: CodeGenInputs): string {
	return `import providersData from '@/../public/data/providers.json';

interface Provider {
  id: string;
  name: string;
  phone?: string;
  website?: string;
  address?: string;
  googleRating?: number;
  googleReviewCount?: number;
  hasLSA?: boolean;
  score?: {
    total: number;
    priority: string;
  };
  enrichment?: {
    services?: string[];
    pricing?: {
      listed?: Array<{ service: string; price: string }>;
      freeEstimates?: boolean;
    };
    about?: {
      companyStory?: string;
      yearEstablished?: number;
    };
    credentials?: {
      licenseNumbers?: string[];
      certifications?: string[];
    };
    serviceArea?: string[];
    emergencyService?: boolean;
  };
}

/**
 * Get all providers
 */
export function getProviders(): Provider[] {
  return providersData as Provider[];
}

/**
 * Get provider by ID
 */
export function getProviderById(id: string): Provider | undefined {
  return (providersData as Provider[]).find((p) => p.id === id);
}

/**
 * Get provider profile for a page
 */
export function getProviderProfile(pageId: string): Provider | undefined {
  // Extract provider slug from pageId (format: provider-profile-{slug})
  const slug = pageId.replace('provider-profile-', '');
  return (providersData as Provider[]).find(
    (p) => p.name?.toLowerCase().replace(/\\s+/g, '-') === slug
  );
}
`;
}

/**
 * Generate editorial accessor
 */
function generateEditorialAccessor(inputs: CodeGenInputs): string {
	return `import editorialData from '@/../public/data/editorial.json';

interface ContentSection {
  heading: string;
  content: string;
}

interface EditorialPage {
  pageId: string;
  type: string;
  url: string;
  content: {
    headline: string;
    introduction: string;
    sections: ContentSection[];
    faq?: Array<{ question: string; answer: string }>;
  };
  wordCount?: number;
}

interface EditorialContent {
  pages: EditorialPage[];
  totalWordCount?: number;
}

/**
 * Get editorial page by ID
 */
export function getEditorialPage(pageId: string): EditorialPage | undefined {
  return (editorialData as EditorialContent).pages.find((p) => p.pageId === pageId);
}

/**
 * Get all editorial pages
 */
export function getEditorialPages(): EditorialPage[] {
  return (editorialData as EditorialContent).pages;
}

/**
 * Get editorial pages by type
 */
export function getEditorialPagesByType(type: string): EditorialPage[] {
  return (editorialData as EditorialContent).pages.filter((p) => p.type === type);
}
`;
}

/**
 * Generate comparisons accessor
 */
function generateComparisonsAccessor(inputs: CodeGenInputs): string {
	return `import comparisonsData from '@/../public/data/comparisons.json';

interface ComparisonPage {
  pageId: string;
  city: string;
  url: string;
  content: {
    headline: string;
    introduction: string;
    comparisonTable?: unknown;
    winners?: Array<{ category: string; provider: string }>;
  };
}

interface PricingPage {
  pageId: string;
  serviceType: string;
  url: string;
  content: {
    headline: string;
    priceTable?: unknown;
    costFactors?: string[];
  };
}

interface ComparisonData {
  comparisonPages: ComparisonPage[];
  pricingPages: PricingPage[];
  marketStats?: unknown;
}

/**
 * Get comparison data by page ID
 */
export function getComparisonData(pageId: string): ComparisonPage | undefined {
  return (comparisonsData as ComparisonData).comparisonPages.find(
    (p) => p.pageId === pageId
  );
}

/**
 * Get pricing data by page ID
 */
export function getPricingData(pageId: string): PricingPage | undefined {
  return (comparisonsData as ComparisonData).pricingPages.find(
    (p) => p.pageId === pageId
  );
}

/**
 * Get all comparison pages
 */
export function getAllComparisonPages(): ComparisonPage[] {
  return (comparisonsData as ComparisonData).comparisonPages;
}

/**
 * Get all pricing pages
 */
export function getAllPricingPages(): PricingPage[] {
  return (comparisonsData as ComparisonData).pricingPages;
}
`;
}

/**
 * Generate SEO accessor
 */
function generateSEOAccessor(inputs: CodeGenInputs): string {
	return `import seoData from '@/../public/data/seo.json';

interface SEOPage {
  pageId: string;
  url: string;
  type: string;
  meta: {
    title: string;
    description: string;
    canonical: string;
    robots?: string;
    openGraph?: {
      title?: string;
      description?: string;
    };
    twitter?: {
      title?: string;
      description?: string;
    };
  };
  schema?: Array<{
    type: string;
    json: Record<string, unknown>;
  }>;
  breadcrumbs?: Array<{
    name: string;
    url: string;
  }>;
}

interface SEOPackage {
  pages: SEOPage[];
  siteWide?: {
    organizationSchema?: Record<string, unknown>;
    websiteSchema?: Record<string, unknown>;
  };
  generatedAt: string;
}

/**
 * Get SEO data for a specific page
 */
export function getSEOForPage(pageId: string): SEOPage | undefined {
  return (seoData as SEOPackage).pages.find((p) => p.pageId === pageId);
}

/**
 * Get SEO data for a page by URL
 */
export function getSEOForUrl(url: string): SEOPage | undefined {
  return (seoData as SEOPackage).pages.find((p) => p.url === url);
}

/**
 * Get all SEO pages
 */
export function getAllSEOPages(): SEOPage[] {
  return (seoData as SEOPackage).pages;
}

/**
 * Get site-wide SEO data
 */
export function getSiteWideSEO(): SEOPackage['siteWide'] {
  return (seoData as SEOPackage).siteWide;
}
`;
}
