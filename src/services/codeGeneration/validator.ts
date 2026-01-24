// Input validation for code generation
// Validates all upstream node outputs before generation begins

import { SitePlannerOutput } from '@/types/sitePlanner';
import { SEOOptimizedPackage } from '@/types/seoPackage';
import { BrandDesignOutput } from '@/types/brandDesign';
import { GeneratedEditorialContent } from '@/types/editorialContent';
import { GeneratedProviderProfile } from '@/types/generatedProfile';
import { GeneratedComparisonData } from '@/types/comparisonPage';
import {
	CodeGenInputs,
	CodeValidationResult,
	CodeValidationError,
	CodeValidationWarning,
} from '@/types/codeGeneration';

/**
 * Validate all inputs before code generation
 * Returns validation result with errors and warnings
 */
export function validateInputs(inputs: CodeGenInputs): CodeValidationResult {
	const errors: CodeValidationError[] = [];
	const warnings: CodeValidationWarning[] = [];

	// Validate required inputs
	validateSitePlan(inputs.sitePlan, errors, warnings);
	validateSEOPackage(inputs.seoPackage, inputs.sitePlan, errors, warnings);
	validateBrandDesign(inputs.brandDesign, errors, warnings);

	// Validate optional inputs (generate warnings, not errors)
	validateEditorialContent(inputs.editorialContent, inputs.sitePlan, warnings);
	validateProviderProfiles(inputs.providerProfiles, inputs.sitePlan, warnings);
	validateComparisonData(inputs.comparisonData, inputs.sitePlan, warnings);

	return {
		valid: errors.length === 0,
		errors,
		warnings,
	};
}

/**
 * Validate Site Planner output (REQUIRED)
 */
function validateSitePlan(
	sitePlan: SitePlannerOutput,
	errors: CodeValidationError[],
	warnings: CodeValidationWarning[]
): void {
	if (!sitePlan) {
		errors.push({
			type: 'missing_page',
			message: 'Site Plan is required for code generation',
		});
		return;
	}

	// Validate brand
	if (!sitePlan.brand?.name) {
		errors.push({
			type: 'missing_content',
			message: 'Site Plan must include brand name',
		});
	}

	if (!sitePlan.brand?.domain) {
		errors.push({
			type: 'missing_content',
			message: 'Site Plan must include domain',
		});
	}

	// Validate pages array
	if (!sitePlan.pages || sitePlan.pages.length === 0) {
		errors.push({
			type: 'missing_page',
			message: 'Site Plan must include at least one page',
		});
		return;
	}

	// Validate each page has required fields
	for (const page of sitePlan.pages) {
		if (!page.id) {
			errors.push({
				type: 'invalid_route',
				message: 'Page missing id',
				pageId: 'unknown',
			});
		}

		if (!page.url) {
			errors.push({
				type: 'invalid_route',
				message: `Page ${page.id} missing url`,
				pageId: page.id,
			});
		}

		if (!page.type) {
			errors.push({
				type: 'type_error',
				message: `Page ${page.id} missing type`,
				pageId: page.id,
			});
		}
	}

	// Check for duplicate URLs
	const urls = sitePlan.pages.map((p) => p.url);
	const duplicates = urls.filter((url, i) => urls.indexOf(url) !== i);
	if (duplicates.length > 0) {
		errors.push({
			type: 'invalid_route',
			message: `Duplicate URLs found: ${duplicates.join(', ')}`,
		});
	}

	// Warn if no providers passed through
	if (!sitePlan.providers || sitePlan.providers.length === 0) {
		warnings.push({
			type: 'incomplete_data',
			message: 'No providers in Site Plan - provider pages may be empty',
		});
	}

	// Warn if no local knowledge
	if (!sitePlan.localKnowledge) {
		warnings.push({
			type: 'incomplete_data',
			message: 'No local knowledge in Site Plan - local context will be limited',
		});
	}
}

/**
 * Validate SEO Package (REQUIRED)
 */
function validateSEOPackage(
	seoPackage: SEOOptimizedPackage,
	sitePlan: SitePlannerOutput,
	errors: CodeValidationError[],
	warnings: CodeValidationWarning[]
): void {
	if (!seoPackage) {
		errors.push({
			type: 'missing_content',
			message: 'SEO Package is required for code generation',
		});
		return;
	}

	if (!seoPackage.pages || seoPackage.pages.length === 0) {
		errors.push({
			type: 'missing_content',
			message: 'SEO Package must include page-level SEO data',
		});
		return;
	}

	// Check that SEO pages match Site Plan pages
	if (sitePlan?.pages) {
		const seoPageIds = new Set(seoPackage.pages.map((p) => p.pageId));
		const missingSeO = sitePlan.pages.filter((p) => !seoPageIds.has(p.id));

		if (missingSeO.length > 0) {
			warnings.push({
				type: 'incomplete_data',
				message: `${missingSeO.length} pages missing SEO data`,
				affectedPages: missingSeO.map((p) => p.id),
			});
		}
	}

	// Validate site-wide SEO
	if (!seoPackage.siteWide?.sitemap) {
		warnings.push({
			type: 'fallback_used',
			message: 'No sitemap data - will generate from pages',
		});
	}
}

/**
 * Validate Brand Design (REQUIRED)
 */
function validateBrandDesign(
	brandDesign: BrandDesignOutput,
	errors: CodeValidationError[],
	warnings: CodeValidationWarning[]
): void {
	if (!brandDesign) {
		errors.push({
			type: 'missing_content',
			message: 'Brand Design is required for code generation',
		});
		return;
	}

	if (!brandDesign.designSystem) {
		errors.push({
			type: 'missing_content',
			message: 'Brand Design must include design system',
		});
		return;
	}

	// Validate colors
	if (!brandDesign.designSystem.colors?.primary) {
		errors.push({
			type: 'missing_content',
			message: 'Brand Design must include primary color',
		});
	}

	// Validate typography
	if (!brandDesign.designSystem.typography?.fontFamily) {
		warnings.push({
			type: 'fallback_used',
			message: 'No font family specified - using system defaults',
		});
	}

	// Validate sections for homepage
	if (
		!brandDesign.designSystem.sections ||
		brandDesign.designSystem.sections.length === 0
	) {
		warnings.push({
			type: 'incomplete_data',
			message: 'No section styles defined - homepage will use defaults',
		});
	}
}

/**
 * Validate Editorial Content (OPTIONAL)
 */
function validateEditorialContent(
	editorial: GeneratedEditorialContent | null,
	sitePlan: SitePlannerOutput,
	warnings: CodeValidationWarning[]
): void {
	if (!editorial) {
		warnings.push({
			type: 'missing_optional',
			message: 'No editorial content - service pages will have minimal content',
		});
		return;
	}

	if (!editorial.pages || editorial.pages.length === 0) {
		warnings.push({
			type: 'incomplete_data',
			message: 'Editorial content has no pages',
		});
		return;
	}

	// Check coverage
	if (sitePlan?.pages) {
		const editorialIds = new Set(editorial.pages.map((p) => p.pageId));
		const editorialPageTypes = [
			'service_hub',
			'service_detail',
			'city_service',
			'cost_guide',
			'troubleshooting',
			'about',
			'methodology',
		];

		const needsEditorial = sitePlan.pages.filter((p) =>
			editorialPageTypes.includes(p.type)
		);
		const missing = needsEditorial.filter((p) => !editorialIds.has(p.id));

		if (missing.length > 0) {
			warnings.push({
				type: 'incomplete_data',
				message: `${missing.length} pages missing editorial content`,
				affectedPages: missing.slice(0, 5).map((p) => p.id),
			});
		}
	}
}

/**
 * Validate Provider Profiles (OPTIONAL)
 */
function validateProviderProfiles(
	profiles: GeneratedProviderProfile[],
	sitePlan: SitePlannerOutput,
	warnings: CodeValidationWarning[]
): void {
	if (!profiles || profiles.length === 0) {
		warnings.push({
			type: 'missing_optional',
			message: 'No provider profiles - provider pages will have minimal content',
		});
		return;
	}

	// Check coverage
	if (sitePlan?.pages) {
		const profileIds = new Set(profiles.map((p) => p.pageId));
		const providerPages = sitePlan.pages.filter(
			(p) => p.type === 'provider_profile'
		);
		const missing = providerPages.filter((p) => !profileIds.has(p.id));

		if (missing.length > 0) {
			warnings.push({
				type: 'incomplete_data',
				message: `${missing.length} provider pages missing profile content`,
				affectedPages: missing.slice(0, 5).map((p) => p.id),
			});
		}
	}
}

/**
 * Validate Comparison Data (OPTIONAL)
 */
function validateComparisonData(
	comparison: GeneratedComparisonData | null,
	sitePlan: SitePlannerOutput,
	warnings: CodeValidationWarning[]
): void {
	if (!comparison) {
		warnings.push({
			type: 'missing_optional',
			message: 'No comparison data - comparison pages will have minimal content',
		});
		return;
	}

	// Check coverage
	if (sitePlan?.pages) {
		const comparisonPages = sitePlan.pages.filter(
			(p) => p.type === 'comparison' || p.type === 'cost_guide'
		);

		const hasComparisonData =
			comparison.comparisonPages && comparison.comparisonPages.length > 0;
		const hasPricingData =
			comparison.pricingPages && comparison.pricingPages.length > 0;

		if (comparisonPages.length > 0 && !hasComparisonData && !hasPricingData) {
			warnings.push({
				type: 'incomplete_data',
				message: 'Comparison/pricing pages defined but no comparison data',
				affectedPages: comparisonPages.slice(0, 5).map((p) => p.id),
			});
		}
	}
}

/**
 * Quick validation check - returns true if required inputs are present
 */
export function hasRequiredInputs(inputs: Partial<CodeGenInputs>): boolean {
	return !!(inputs.sitePlan && inputs.seoPackage && inputs.brandDesign);
}

/**
 * Get count of available optional inputs
 */
export function countOptionalInputs(inputs: Partial<CodeGenInputs>): {
	editorial: boolean;
	profiles: number;
	comparison: boolean;
} {
	return {
		editorial: !!inputs.editorialContent?.pages?.length,
		profiles: inputs.providerProfiles?.length ?? 0,
		comparison: !!(
			inputs.comparisonData?.comparisonPages?.length ||
			inputs.comparisonData?.pricingPages?.length
		),
	};
}
