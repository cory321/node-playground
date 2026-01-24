// Route Generator
// Generates route structure files from SitePlan pages

import { CodeGenInputs, GeneratedFile, urlToFilePath } from '@/types/codeGeneration';
import { PageBrief, PageType } from '@/types/sitePlanner';

export interface GeneratorOptions {
	onFile?: (file: GeneratedFile) => void;
	abortSignal?: AbortSignal;
}

/**
 * Generate route-related files from site plan
 * This creates the generateStaticParams utilities for dynamic routes
 */
export async function generateRouteFiles(
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

	// Analyze pages to determine dynamic routes needed
	const pagesByType = groupPagesByType(inputs.sitePlan.pages);

	// Generate route utilities
	emit({
		path: 'src/lib/routes/index.ts',
		content: generateRouteUtilities(inputs),
		type: 'lib',
		encoding: 'utf-8',
	});

	// Generate static params generators
	emit({
		path: 'src/lib/routes/staticParams.ts',
		content: generateStaticParamsHelpers(inputs, pagesByType),
		type: 'lib',
		encoding: 'utf-8',
	});

	return files;
}

/**
 * Group pages by their type for route analysis
 */
function groupPagesByType(pages: PageBrief[]): Record<PageType, PageBrief[]> {
	const grouped: Record<string, PageBrief[]> = {};

	for (const page of pages) {
		if (!grouped[page.type]) {
			grouped[page.type] = [];
		}
		grouped[page.type].push(page);
	}

	return grouped as Record<PageType, PageBrief[]>;
}

/**
 * Generate route utility functions
 */
function generateRouteUtilities(inputs: CodeGenInputs): string {
	const { sitePlan } = inputs;

	return `// Route utilities for ${sitePlan.brand.name}
// Auto-generated - do not edit

import { getSitePlan } from '@/lib/data/sitePlan';

/**
 * Get all page URLs from the site plan
 */
export function getAllPageUrls(): string[] {
  const sitePlan = getSitePlan();
  return sitePlan.pages.map(page => page.url);
}

/**
 * Get page by URL
 */
export function getPageByUrl(url: string) {
  const sitePlan = getSitePlan();
  return sitePlan.pages.find(page => page.url === url);
}

/**
 * Get page by ID
 */
export function getPageById(id: string) {
  const sitePlan = getSitePlan();
  return sitePlan.pages.find(page => page.id === id);
}

/**
 * Get pages by type
 */
export function getPagesByType(type: string) {
  const sitePlan = getSitePlan();
  return sitePlan.pages.filter(page => page.type === type);
}

/**
 * Parse URL segments
 */
export function parseUrlSegments(url: string): string[] {
  return url.split('/').filter(Boolean);
}

/**
 * Build URL from segments
 */
export function buildUrl(...segments: string[]): string {
  return '/' + segments.filter(Boolean).join('/');
}
`;
}

/**
 * Generate static params helper functions
 */
function generateStaticParamsHelpers(
	inputs: CodeGenInputs,
	pagesByType: Record<PageType, PageBrief[]>
): string {
	const { sitePlan } = inputs;

	// Extract unique cities and services
	const cities = new Set<string>();
	const services = new Set<string>();
	const providers = new Set<string>();

	for (const page of sitePlan.pages) {
		const segments = page.url.split('/').filter(Boolean);

		if (page.type === 'city_service' && segments.length >= 2) {
			cities.add(segments[0]);
			services.add(segments[1]);
		} else if (page.type === 'provider_listing' && segments.length >= 2) {
			cities.add(segments[0]);
		} else if (page.type === 'provider_profile' && segments.length >= 2) {
			providers.add(segments[segments.length - 1]);
		} else if (page.type === 'service_hub' && segments.length >= 1) {
			services.add(segments[0]);
		}
	}

	return `// Static params generators for ${sitePlan.brand.name}
// Auto-generated - do not edit

import { getSitePlan } from '@/lib/data/sitePlan';

/**
 * Generate static params for city pages
 */
export function generateCityParams() {
  const sitePlan = getSitePlan();
  const cities = new Set<string>();
  
  sitePlan.pages
    .filter(p => p.type === 'city_service' || p.type === 'provider_listing')
    .forEach(page => {
      const segments = page.url.split('/').filter(Boolean);
      if (segments.length > 0) {
        cities.add(segments[0]);
      }
    });
  
  return Array.from(cities).map(city => ({ city }));
}

/**
 * Generate static params for service pages
 */
export function generateServiceParams() {
  const sitePlan = getSitePlan();
  const services = new Set<string>();
  
  sitePlan.pages
    .filter(p => p.type === 'service_hub' || p.type === 'service_detail')
    .forEach(page => {
      const segments = page.url.split('/').filter(Boolean);
      if (segments.length > 0) {
        services.add(segments[0]);
      }
    });
  
  return Array.from(services).map(service => ({ 'service-slug': service }));
}

/**
 * Generate static params for city+service pages
 */
export function generateCityServiceParams() {
  const sitePlan = getSitePlan();
  
  return sitePlan.pages
    .filter(p => p.type === 'city_service')
    .map(page => {
      const segments = page.url.split('/').filter(Boolean);
      return {
        city: segments[0],
        'service-slug': segments[1],
      };
    });
}

/**
 * Generate static params for provider profile pages
 */
export function generateProviderParams() {
  const sitePlan = getSitePlan();
  
  return sitePlan.pages
    .filter(p => p.type === 'provider_profile')
    .map(page => {
      const segments = page.url.split('/').filter(Boolean);
      return {
        'provider-slug': segments[segments.length - 1],
      };
    });
}

/**
 * Generate static params for guide pages
 */
export function generateGuideParams() {
  const sitePlan = getSitePlan();
  
  return sitePlan.pages
    .filter(p => p.type === 'cost_guide' || p.type === 'troubleshooting')
    .map(page => {
      const segments = page.url.split('/').filter(Boolean);
      return {
        'topic-slug': segments[segments.length - 1],
      };
    });
}

// Pre-computed static values for build-time optimization
export const STATIC_CITIES = ${JSON.stringify(Array.from(cities))};
export const STATIC_SERVICES = ${JSON.stringify(Array.from(services))};
export const STATIC_PROVIDERS = ${JSON.stringify(Array.from(providers))};
`;
}

/**
 * Convert page URL to filesystem path
 */
export function pageToFilePath(page: PageBrief): string {
	return urlToFilePath(page.url);
}

/**
 * Determine if a page type uses dynamic routing
 */
export function isDynamicPageType(type: PageType): boolean {
	const dynamicTypes: PageType[] = [
		'city_service',
		'provider_profile',
		'provider_listing',
		'cost_guide',
		'troubleshooting',
		'service_hub',
		'service_detail',
		'comparison',
	];
	return dynamicTypes.includes(type);
}
