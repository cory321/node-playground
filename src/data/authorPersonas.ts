// Author personas for E-E-A-T compliance in editorial content
// Each persona is mapped to specific content types for consistency

import { EditorialPageType } from '@/types/editorialContent';

export interface AuthorPersona {
	id: string;
	name: string;
	title: string;
	bio: string;
	useFor: EditorialPageType[];
}

/**
 * Technical expert persona - for hands-on guides and troubleshooting
 */
export const technicalExpert: AuthorPersona = {
	id: 'technical-expert',
	name: 'Mike Rodriguez',
	title: 'Home Services Expert',
	bio: '15+ years experience in residential services. Former contractor turned consumer advocate.',
	useFor: ['troubleshooting', 'diy_guide', 'buying_guide'],
};

/**
 * Local market analyst persona - for cost and local market content
 */
export const localEditor: AuthorPersona = {
	id: 'local-editor',
	name: 'Sarah Chen',
	title: 'Local Market Analyst',
	bio: 'Researching and writing about home services markets since 2019. Focused on helping homeowners make informed decisions.',
	useFor: ['cost_guide', 'local_expertise'],
};

/**
 * Editorial team persona - for general service pages and about content
 */
export const editorialTeam: AuthorPersona = {
	id: 'editorial-team',
	name: 'Editorial Team',
	title: '', // Will be dynamically set based on brand
	bio: 'Our team of local researchers and home service experts.',
	useFor: ['service_page', 'city_service_page', 'about', 'methodology'],
};

/**
 * All available author personas
 */
export const authorPersonas: AuthorPersona[] = [
	technicalExpert,
	localEditor,
	editorialTeam,
];

/**
 * Get the appropriate author persona for a content type
 */
export function getAuthorForContentType(
	contentType: EditorialPageType,
	brandName?: string
): AuthorPersona {
	// Find the persona that includes this content type
	const persona = authorPersonas.find((p) =>
		p.useFor.includes(contentType)
	);

	if (!persona) {
		// Default to editorial team
		return editorialTeam;
	}

	// For editorial team, customize title with brand name
	if (persona.id === 'editorial-team' && brandName) {
		return {
			...persona,
			title: brandName,
		};
	}

	return persona;
}

/**
 * Get author persona by ID
 */
export function getAuthorById(id: string): AuthorPersona | undefined {
	return authorPersonas.find((p) => p.id === id);
}
