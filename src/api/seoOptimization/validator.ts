// SEO Validator
// Validates SEO package against best practices and rules

import {
	SEOOptimizedPage,
	SEOOptimizedPackage,
	SEOIssue,
	SEOWarning,
	SchemaError,
	PageValidation,
	DEFAULT_VALIDATION_RULES,
	SEOValidationRules,
} from '@/types/seoPackage';

// ============================================================================
// TITLE VALIDATION
// ============================================================================

/**
 * Validate title tag
 */
export function validateTitle(
	title: string,
	titleLength: number,
	rules: SEOValidationRules['title'],
	keyword?: string,
	location?: string,
): SEOIssue[] {
	const issues: SEOIssue[] = [];

	// Length check
	if (titleLength < rules.minLength) {
		issues.push({
			type: 'title_too_short',
			severity: 'warning',
			message: `Title is too short (${titleLength} chars). Recommended: ${rules.minLength}-${rules.maxLength} characters.`,
			field: 'title',
			value: titleLength,
			suggestion: 'Add more descriptive keywords or location to the title.',
		});
	}

	if (titleLength > rules.maxLength) {
		issues.push({
			type: 'title_too_long',
			severity: 'error',
			message: `Title is too long (${titleLength} chars). Maximum: ${rules.maxLength} characters.`,
			field: 'title',
			value: titleLength,
			suggestion: 'Shorten the title while keeping important keywords.',
		});
	}

	// Keyword check
	if (keyword && rules.mustInclude.includes('keyword')) {
		const lowerTitle = title.toLowerCase();
		const lowerKeyword = keyword.toLowerCase();
		if (!lowerTitle.includes(lowerKeyword)) {
			issues.push({
				type: 'title_missing_keyword',
				severity: 'warning',
				message: `Title should include the primary keyword "${keyword}".`,
				field: 'title',
				value: title,
				suggestion: `Add "${keyword}" to the title.`,
			});
		}
	}

	// Location check
	if (location && rules.mustInclude.includes('location')) {
		const lowerTitle = title.toLowerCase();
		const lowerLocation = location.toLowerCase();
		if (!lowerTitle.includes(lowerLocation)) {
			issues.push({
				type: 'title_missing_location',
				severity: 'info',
				message: `Consider including location "${location}" in the title for local SEO.`,
				field: 'title',
				value: title,
			});
		}
	}

	// Forbidden patterns
	for (const pattern of rules.mustNotInclude) {
		if (title.includes(pattern)) {
			issues.push({
				type: 'title_has_forbidden_pattern',
				severity: 'info',
				message: `Title contains overused pattern "${pattern}".`,
				field: 'title',
				value: title,
				suggestion: `Consider removing or replacing "${pattern}".`,
			});
		}
	}

	return issues;
}

// ============================================================================
// DESCRIPTION VALIDATION
// ============================================================================

/**
 * Validate meta description
 */
export function validateDescription(
	description: string,
	descriptionLength: number,
	rules: SEOValidationRules['description'],
	keyword?: string,
): SEOIssue[] {
	const issues: SEOIssue[] = [];

	// Length check
	if (descriptionLength < rules.minLength) {
		issues.push({
			type: 'description_too_short',
			severity: 'warning',
			message: `Description is too short (${descriptionLength} chars). Recommended: ${rules.minLength}-${rules.maxLength} characters.`,
			field: 'description',
			value: descriptionLength,
			suggestion: 'Add more compelling content about the page.',
		});
	}

	if (descriptionLength > rules.maxLength) {
		issues.push({
			type: 'description_too_long',
			severity: 'warning',
			message: `Description is too long (${descriptionLength} chars). It may be truncated in search results.`,
			field: 'description',
			value: descriptionLength,
			suggestion: 'Shorten to 160 characters or less.',
		});
	}

	// Keyword check
	if (keyword && rules.mustInclude.includes('keyword')) {
		const lowerDesc = description.toLowerCase();
		const lowerKeyword = keyword.toLowerCase();
		if (!lowerDesc.includes(lowerKeyword)) {
			issues.push({
				type: 'description_missing_keyword',
				severity: 'info',
				message: `Description should include the primary keyword "${keyword}".`,
				field: 'description',
				value: description,
			});
		}
	}

	return issues;
}

// ============================================================================
// HEADING VALIDATION
// ============================================================================

/**
 * Validate heading structure
 */
export function validateHeadings(
	h1: string,
	h2s: string[],
	rules: SEOValidationRules['h1'],
	keyword?: string,
): SEOIssue[] {
	const issues: SEOIssue[] = [];

	// H1 required check
	if (rules.required && !h1) {
		issues.push({
			type: 'missing_h1',
			severity: 'error',
			message: 'Page is missing an H1 heading.',
			field: 'h1',
			suggestion: 'Add a unique, descriptive H1 heading.',
		});
	}

	// H1 keyword check
	if (h1 && keyword && rules.mustInclude.includes('keyword')) {
		const lowerH1 = h1.toLowerCase();
		const lowerKeyword = keyword.toLowerCase();
		if (!lowerH1.includes(lowerKeyword)) {
			issues.push({
				type: 'h1_missing_keyword',
				severity: 'info',
				message: `H1 should include the primary keyword "${keyword}".`,
				field: 'h1',
				value: h1,
			});
		}
	}

	// H1 length check
	if (h1 && h1.length > 70) {
		issues.push({
			type: 'h1_too_long',
			severity: 'info',
			message: `H1 is quite long (${h1.length} chars). Consider shortening.`,
			field: 'h1',
			value: h1.length,
		});
	}

	// Check for H2s (good practice)
	if (h2s.length === 0) {
		issues.push({
			type: 'no_h2_headings',
			severity: 'info',
			message: 'Page has no H2 headings. Consider adding section headings.',
			field: 'h2s',
		});
	}

	return issues;
}

// ============================================================================
// SCHEMA VALIDATION
// ============================================================================

/**
 * Validate schema markup for a page
 */
export function validateSchemaMarkup(
	schemas: Array<{ type: string; valid: boolean; errors?: string[] }>,
	pageType: string,
	rules: SEOValidationRules['schema'],
): { issues: SEOIssue[]; schemaErrors: SchemaError[] } {
	const issues: SEOIssue[] = [];
	const schemaErrors: SchemaError[] = [];

	const schemaTypes = schemas.map((s) => s.type);

	// Check required schemas
	for (const required of rules.required) {
		if (!schemaTypes.includes(required)) {
			issues.push({
				type: 'missing_required_schema',
				severity: 'error',
				message: `Missing required ${required} schema.`,
				field: 'schema',
				value: required,
			});
		}
	}

	// Check provider-specific requirements
	if (pageType === 'provider_profile') {
		for (const required of rules.providerRequired) {
			if (!schemaTypes.includes(required)) {
				issues.push({
					type: 'missing_provider_schema',
					severity: 'warning',
					message: `Provider profile should have ${required} schema.`,
					field: 'schema',
					value: required,
				});
			}
		}
	}

	// Check article-specific requirements
	const articleTypes = [
		'cost_guide',
		'troubleshooting',
		'buying_guide',
		'guide',
		'article',
	];
	if (articleTypes.includes(pageType)) {
		for (const required of rules.articleRequired) {
			if (!schemaTypes.includes(required)) {
				issues.push({
					type: 'missing_article_schema',
					severity: 'info',
					message: `Article page should consider ${required} schema.`,
					field: 'schema',
					value: required,
				});
			}
		}
	}

	// Collect schema validation errors
	for (const schema of schemas) {
		if (!schema.valid && schema.errors) {
			for (const error of schema.errors) {
				schemaErrors.push({
					schemaType: schema.type,
					property: '',
					message: error,
					severity: 'error',
				});
			}
		}
	}

	return { issues, schemaErrors };
}

// ============================================================================
// LINK VALIDATION
// ============================================================================

/**
 * Validate internal links
 */
export function validateInternalLinks(
	linkCount: number,
	pageType: string,
	rules: SEOValidationRules['internalLinks'],
): SEOIssue[] {
	const issues: SEOIssue[] = [];

	const minLinks = rules[pageType]?.min ?? 5;

	if (linkCount < minLinks) {
		issues.push({
			type: 'insufficient_internal_links',
			severity: 'warning',
			message: `Page has only ${linkCount} internal links. Recommended minimum: ${minLinks}.`,
			field: 'internalLinks',
			value: linkCount,
			suggestion: 'Add more relevant internal links to improve crawlability.',
		});
	}

	return issues;
}

// ============================================================================
// PAGE VALIDATION
// ============================================================================

/**
 * Validate a single page
 */
export function validatePage(
	page: SEOOptimizedPage,
	rules: SEOValidationRules = DEFAULT_VALIDATION_RULES,
	keyword?: string,
	location?: string,
): SEOIssue[] {
	const allIssues: SEOIssue[] = [];

	// Title validation
	allIssues.push(
		...validateTitle(
			page.meta.title,
			page.meta.titleLength,
			rules.title,
			keyword,
			location,
		),
	);

	// Description validation
	allIssues.push(
		...validateDescription(
			page.meta.description,
			page.meta.descriptionLength,
			rules.description,
			keyword,
		),
	);

	// Heading validation
	allIssues.push(
		...validateHeadings(page.headings.h1, page.headings.h2s, rules.h1, keyword),
	);

	// Schema validation
	const { issues: schemaIssues } = validateSchemaMarkup(
		page.schema,
		page.type,
		rules.schema,
	);
	allIssues.push(...schemaIssues);

	// Link validation
	allIssues.push(
		...validateInternalLinks(
			page.internalLinks.length,
			page.type,
			rules.internalLinks,
		),
	);

	// Canonical check
	if (!page.meta.canonical) {
		allIssues.push({
			type: 'missing_canonical',
			severity: 'error',
			message: 'Page is missing a canonical URL.',
			field: 'canonical',
		});
	}

	return allIssues;
}

// ============================================================================
// PACKAGE VALIDATION
// ============================================================================

/**
 * Validate the entire SEO package
 */
export function validateSEOPackage(
	pkg: SEOOptimizedPackage,
	_rules: SEOValidationRules = DEFAULT_VALIDATION_RULES,
): PageValidation {
	const allSchemaErrors: SchemaError[] = [];
	const warnings: SEOWarning[] = [];

	// Collect all issues and check basic requirements
	let allHaveTitle = true;
	let allHaveDescription = true;
	let allHaveCanonical = true;
	let allHaveSchema = true;

	const pagesWithoutTitle: string[] = [];
	const pagesWithoutDescription: string[] = [];
	const pagesWithoutCanonical: string[] = [];
	const pagesWithoutSchema: string[] = [];

	for (const page of pkg.pages) {
		if (!page.meta.title) {
			allHaveTitle = false;
			pagesWithoutTitle.push(page.pageId);
		}
		if (!page.meta.description) {
			allHaveDescription = false;
			pagesWithoutDescription.push(page.pageId);
		}
		if (!page.meta.canonical) {
			allHaveCanonical = false;
			pagesWithoutCanonical.push(page.pageId);
		}
		if (page.schema.length === 0) {
			allHaveSchema = false;
			pagesWithoutSchema.push(page.pageId);
		}

		// Collect schema errors
		for (const schema of page.schema) {
			if (!schema.valid && schema.errors) {
				for (const error of schema.errors) {
					allSchemaErrors.push({
						schemaType: schema.type,
						property: page.pageId,
						message: error,
						severity: 'error',
					});
				}
			}
		}
	}

	// Generate warnings
	if (pagesWithoutTitle.length > 0) {
		warnings.push({
			type: 'pages_without_title',
			message: `${pagesWithoutTitle.length} pages are missing titles.`,
			affectedPages: pagesWithoutTitle,
		});
	}

	if (pagesWithoutDescription.length > 0) {
		warnings.push({
			type: 'pages_without_description',
			message: `${pagesWithoutDescription.length} pages are missing meta descriptions.`,
			affectedPages: pagesWithoutDescription,
		});
	}

	if (pagesWithoutSchema.length > 0) {
		warnings.push({
			type: 'pages_without_schema',
			message: `${pagesWithoutSchema.length} pages have no schema markup.`,
			affectedPages: pagesWithoutSchema,
		});
	}

	// Calculate link coverage
	const linkedPageIds = new Set<string>();
	for (const page of pkg.pages) {
		for (const link of page.internalLinks) {
			linkedPageIds.add(link.targetPageId);
		}
	}
	const linkCoverage = Math.round(
		(linkedPageIds.size / Math.max(pkg.pages.length, 1)) * 100,
	);

	// Find orphan pages
	const orphanPages = pkg.pages
		.filter((p) => !linkedPageIds.has(p.pageId))
		.filter((p) => !['homepage', 'legal', 'privacy', 'terms'].includes(p.type))
		.map((p) => p.pageId);

	if (orphanPages.length > 0) {
		warnings.push({
			type: 'orphan_pages',
			message: `${orphanPages.length} pages have no incoming internal links.`,
			affectedPages: orphanPages,
		});
	}

	return {
		allPagesHaveTitle: allHaveTitle,
		allPagesHaveDescription: allHaveDescription,
		allPagesHaveCanonical: allHaveCanonical,
		allPagesHaveSchema: allHaveSchema,
		internalLinkCoverage: linkCoverage,
		orphanPages,
		schemaErrors: allSchemaErrors,
		warnings,
	};
}

/**
 * Calculate suggestions for a page
 */
export function generateSuggestions(page: SEOOptimizedPage): string[] {
	const suggestions: string[] = [];

	// Based on issues
	const errorCount = page.issues.filter((i) => i.severity === 'error').length;
	const warningCount = page.issues.filter(
		(i) => i.severity === 'warning',
	).length;

	if (errorCount > 0) {
		suggestions.push(`Fix ${errorCount} critical SEO issues first.`);
	}

	if (warningCount > 0) {
		suggestions.push(
			`Address ${warningCount} SEO warnings to improve ranking.`,
		);
	}

	// Score-based suggestions
	if (page.seoScore < 50) {
		suggestions.push('This page needs significant SEO improvements.');
	} else if (page.seoScore < 70) {
		suggestions.push('Good foundation, but room for optimization.');
	} else if (page.seoScore < 90) {
		suggestions.push('Well-optimized page. Minor tweaks can help.');
	}

	// Specific suggestions
	if (page.internalLinks.length < 5) {
		suggestions.push('Add more internal links to related content.');
	}

	if (page.schema.length < 2) {
		suggestions.push('Consider adding more schema types (FAQ, Review, etc.).');
	}

	if (page.meta.titleLength < 40) {
		suggestions.push('Title could be more descriptive.');
	}

	return suggestions;
}
