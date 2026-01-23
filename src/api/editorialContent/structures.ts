// Content type structures and specifications
// Defines section requirements, word counts, and local reference targets for each content type

import { EditorialPageType } from '@/types/editorialContent';

// ============================================================================
// CONTENT TYPE STRUCTURE
// ============================================================================

export interface ContentTypeStructure {
	type: EditorialPageType;
	label: string;
	wordCountMin: number;
	wordCountMax: number;
	sections: string[];
	localReferencesMin: number;
	ctaType: 'find_providers' | 'get_quote' | 'learn_more' | 'contact';
	requiresData?: string[]; // Special data requirements
	faqCount: number;
	keyTakeawaysCount: number;
}

// ============================================================================
// SERVICE PAGE (1200-2000 words)
// ============================================================================

export const servicePageStructure: ContentTypeStructure = {
	type: 'service_page',
	label: 'Service Page',
	wordCountMin: 1200,
	wordCountMax: 2000,
	sections: [
		'What is {service}',
		'Types of {service}',
		'When you need {service}',
		'{Region}-specific considerations',
		'How to choose a {service} provider',
		'Cost overview',
		'DIY vs Professional',
	],
	localReferencesMin: 5,
	ctaType: 'find_providers',
	faqCount: 5,
	keyTakeawaysCount: 4,
};

// ============================================================================
// CITY SERVICE PAGE (1000-1600 words)
// ============================================================================

export const cityServicePageStructure: ContentTypeStructure = {
	type: 'city_service_page',
	label: 'City Service Page',
	wordCountMin: 1000,
	wordCountMax: 1600,
	sections: [
		'{Service} in {City}',
		'Local {service} considerations',
		'Top providers in {City}',
		'Pricing in {City}',
		'What to look for locally',
	],
	localReferencesMin: 6,
	ctaType: 'find_providers',
	faqCount: 4,
	keyTakeawaysCount: 3,
};

// ============================================================================
// COST GUIDE (1000-1800 words)
// ============================================================================

export const costGuideStructure: ContentTypeStructure = {
	type: 'cost_guide',
	label: 'Cost Guide',
	wordCountMin: 1000,
	wordCountMax: 1800,
	sections: [
		'Quick answer box', // Featured snippet target
		'Detailed pricing breakdown',
		'Factors affecting cost',
		'Price by city comparison',
		'Real examples',
		'How to save money',
		'Red flags and scams',
		'Methodology',
	],
	localReferencesMin: 3,
	ctaType: 'get_quote',
	requiresData: ['pricing_table', 'city_comparison'],
	faqCount: 4,
	keyTakeawaysCount: 4,
};

// ============================================================================
// TROUBLESHOOTING ARTICLE (800-1200 words)
// ============================================================================

export const troubleshootingStructure: ContentTypeStructure = {
	type: 'troubleshooting',
	label: 'Troubleshooting',
	wordCountMin: 800,
	wordCountMax: 1200,
	sections: [
		'Problem overview',
		'Common causes',
		'DIY diagnosis steps',
		'When to call a professional',
		'Expected repair costs',
		'Prevention tips',
	],
	localReferencesMin: 2,
	ctaType: 'find_providers',
	faqCount: 3,
	keyTakeawaysCount: 3,
};

// ============================================================================
// BUYING GUIDE (1500-2500 words)
// ============================================================================

export const buyingGuideStructure: ContentTypeStructure = {
	type: 'buying_guide',
	label: 'Buying Guide',
	wordCountMin: 1500,
	wordCountMax: 2500,
	sections: [
		'Overview and importance',
		'Types and options',
		'Features to consider',
		'Price ranges',
		'Top brands',
		'Installation considerations',
		'Local factors',
		'Maintenance requirements',
	],
	localReferencesMin: 4,
	ctaType: 'get_quote',
	faqCount: 5,
	keyTakeawaysCount: 5,
};

// ============================================================================
// DIY GUIDE (1000-1500 words)
// ============================================================================

export const diyGuideStructure: ContentTypeStructure = {
	type: 'diy_guide',
	label: 'DIY Guide',
	wordCountMin: 1000,
	wordCountMax: 1500,
	sections: [
		'Overview',
		'Tools and materials needed',
		'Safety precautions',
		'Step-by-step instructions',
		'Common mistakes to avoid',
		'When to hire a professional',
	],
	localReferencesMin: 2,
	ctaType: 'learn_more',
	faqCount: 4,
	keyTakeawaysCount: 4,
};

// ============================================================================
// LOCAL EXPERTISE (800-1200 words)
// ============================================================================

export const localExpertiseStructure: ContentTypeStructure = {
	type: 'local_expertise',
	label: 'Local Expertise',
	wordCountMin: 800,
	wordCountMax: 1200,
	sections: [
		'Local market overview',
		'Regional factors',
		'Seasonal patterns',
		'Local tips and insights',
		'Neighborhood considerations',
	],
	localReferencesMin: 8, // Heavily local-focused
	ctaType: 'find_providers',
	faqCount: 3,
	keyTakeawaysCount: 3,
};

// ============================================================================
// ABOUT PAGE (600-1000 words)
// ============================================================================

export const aboutPageStructure: ContentTypeStructure = {
	type: 'about',
	label: 'About Page',
	wordCountMin: 600,
	wordCountMax: 1000,
	sections: [
		'Our mission',
		'How we help',
		'Our research process',
		'Our team',
		'Contact us',
	],
	localReferencesMin: 3,
	ctaType: 'contact',
	faqCount: 0,
	keyTakeawaysCount: 0,
};

// ============================================================================
// METHODOLOGY PAGE (800-1200 words)
// ============================================================================

export const methodologyPageStructure: ContentTypeStructure = {
	type: 'methodology',
	label: 'Methodology',
	wordCountMin: 800,
	wordCountMax: 1200,
	sections: [
		'How we research',
		'Our evaluation criteria',
		'Data sources',
		'How we verify information',
		'Editorial standards',
		'How to suggest corrections',
	],
	localReferencesMin: 1,
	ctaType: 'contact',
	faqCount: 3,
	keyTakeawaysCount: 0,
};

// ============================================================================
// STRUCTURE REGISTRY
// ============================================================================

export const contentTypeStructures: Record<
	EditorialPageType,
	ContentTypeStructure
> = {
	service_page: servicePageStructure,
	city_service_page: cityServicePageStructure,
	cost_guide: costGuideStructure,
	troubleshooting: troubleshootingStructure,
	buying_guide: buyingGuideStructure,
	diy_guide: diyGuideStructure,
	local_expertise: localExpertiseStructure,
	about: aboutPageStructure,
	methodology: methodologyPageStructure,
};

/**
 * Get the structure for a content type
 */
export function getContentTypeStructure(
	type: EditorialPageType
): ContentTypeStructure {
	return contentTypeStructures[type];
}

/**
 * Calculate target word count for a quality level
 */
export function getTargetWordCount(
	type: EditorialPageType,
	qualityLevel: 'draft' | 'polished'
): number {
	const structure = getContentTypeStructure(type);
	// Draft: aim for minimum, Polished: aim for midpoint to max
	if (qualityLevel === 'draft') {
		return structure.wordCountMin;
	}
	return Math.round(
		(structure.wordCountMin + structure.wordCountMax) / 2
	);
}

/**
 * Get section templates with variable substitution
 */
export function getSectionTemplates(
	type: EditorialPageType,
	variables: {
		service?: string;
		city?: string;
		region?: string;
	}
): string[] {
	const structure = getContentTypeStructure(type);
	return structure.sections.map((section) => {
		let result = section;
		if (variables.service) {
			result = result.replace(/{service}/gi, variables.service);
		}
		if (variables.city) {
			result = result.replace(/{city}/gi, variables.city);
		}
		if (variables.region) {
			result = result.replace(/{region}/gi, variables.region);
		}
		return result;
	});
}

/**
 * Get content type category for grouping
 */
export function getContentTypeGroup(
	type: EditorialPageType
): 'core' | 'guides' | 'supporting' {
	switch (type) {
		case 'service_page':
		case 'city_service_page':
			return 'core';
		case 'cost_guide':
		case 'troubleshooting':
		case 'buying_guide':
		case 'diy_guide':
			return 'guides';
		case 'local_expertise':
		case 'about':
		case 'methodology':
			return 'supporting';
	}
}
