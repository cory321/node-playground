// Editorial depth options for profile generation
export type EditorialDepth = 'brief' | 'standard' | 'detailed';

// Trust score visual display configuration
export interface TrustScoreDisplay {
	score: number; // 0-100
	tier: 'excellent' | 'good' | 'fair' | 'needs-improvement';
	color: string; // Tailwind color class
	label: string; // "Excellent", "Good", etc.
}

// SEO metadata for provider profile page
export interface ProfileSEO {
	title: string; // Full title tag
	metaDescription: string; // Full meta description
	canonicalUrl: string;
}

// Contact section content
export interface ContactSection {
	phone: string;
	address: string;
	hours: string;
	serviceArea: string;
	emergencyNote?: string;
}

// Individual service item
export interface ServiceItem {
	name: string;
	description: string; // 2-3 sentences each
	priceRange?: string;
}

// Services section content
export interface ServicesSection {
	heading: string;
	intro: string;
	services: ServiceItem[];
}

// License display information
export interface LicenseDisplay {
	display: string; // "License #1234567 - Active"
	verificationLink: string;
	explanation: string;
}

// Credentials section content
export interface CredentialsSection {
	heading: string;
	license: LicenseDisplay;
	insurance: string;
	certifications: string[];
	yearsInBusiness: string;
}

// Byline for editorial content
export interface EditorialByline {
	author: string;
	title: string;
	date: string;
}

// "Our Take" editorial section - the key differentiator
export interface OurTakeSection {
	heading: string; // "Our Assessment"
	assessment: string; // 150-200 words, editorial
	strengths: string[]; // 2-3 bullet points
	considerations: string[]; // 1-2 bullet points (honest)
	bestFor: string; // "Best for homeowners who..."
	pricePosition: string; // "Mid-range pricing for the area"
	byline: EditorialByline;
}

// Service area section content
export interface ServiceAreaSection {
	heading: string;
	description: string;
	cities: string[];
	mapEmbed?: string;
}

// FAQ item
export interface FAQItem {
	question: string;
	answer: string;
}

// Alternative provider for comparison
export interface AlternativeProvider {
	providerId: string;
	name: string;
	comparison: string; // "More affordable but fewer reviews"
}

// Comparison context section
export interface ComparisonSection {
	rankInCity: number;
	totalInCity: number;
	highlights: string[]; // What makes them stand out
	alternatives: AlternativeProvider[];
}

// Trust score section
export interface TrustScoreSection {
	display: TrustScoreDisplay;
	explanation: string; // Brief explanation
}

// Full content structure for a provider profile
export interface ProfileContent {
	headline: string; // H1
	introduction: string; // 100-150 words

	trustScore: TrustScoreSection;
	contactSection: ContactSection;
	servicesSection: ServicesSection;
	credentialsSection: CredentialsSection;
	ourTake: OurTakeSection;
	serviceAreaSection: ServiceAreaSection;
	faq: FAQItem[]; // 3-5 FAQs specific to this provider
	comparison: ComparisonSection;
}

// Schema.org structured data
export interface ProfileSchema {
	localBusiness: object; // Full JSON-LD
	aggregateRating: object;
	reviews?: object[];
}

// Internal link opportunity
export interface InternalLink {
	targetPageId: string;
	anchorText: string;
	placement: string; // Where in content
}

// Complete generated provider profile
export interface GeneratedProviderProfile {
	providerId: string;
	pageId: string; // Reference to SitePage
	url: string;

	seo: ProfileSEO;
	content: ProfileContent;
	schema: ProfileSchema;

	internalLinks: InternalLink[];
	wordCount: number;
	localReferences: string[]; // Track local mentions for QA
	generatedAt: string;
}

// Profile generation progress tracking
export interface ProfileGenerationProgress {
	currentProvider: string | null;
	currentIndex: number;
	totalCount: number;
	phase: 'preparing' | 'generating' | 'validating' | 'complete';
	completedProfiles: number;
}

// Node configuration
export interface ProviderProfileGeneratorConfig {
	editorialDepth: EditorialDepth;
	includeComparison: boolean;
}

// Input for profile generation
export interface ProfileGeneratorInput {
	providers: unknown[]; // EnrichedProvider[] - use unknown to avoid circular import
	blueprint: unknown; // SitePlannerOutput
	localKnowledge: unknown; // LocalKnowledgeOutput
}

// LLM generation request types (for edge function)
export interface OurTakeGenerationRequest {
	providerName: string;
	category: string;
	city: string;
	state: string;
	trustScore: number;
	googleRating: number | null;
	reviewCount: number | null;
	yearsInBusiness: number | null;
	licenseStatus: string;
	specialties: string[];
	pricePosition: string;
	rank: number;
	totalProviders: number;
	avgRating: number;
	localKnowledgeHooks: string[];
	editorialDepth: EditorialDepth;
}

export interface OurTakeGenerationResponse {
	assessment: string;
	strengths: string[];
	considerations: string[];
	bestFor: string;
	pricePosition: string;
}

export interface FAQGenerationRequest {
	providerName: string;
	category: string;
	city: string;
	state: string;
	services: string[];
	serviceArea: string[];
	credentials: {
		licenseNumbers: string[];
		certifications: string[];
		yearsInBusiness: number | null;
	};
	localKnowledgeHooks: string[];
}

export interface FAQGenerationResponse {
	faqs: FAQItem[];
}

export interface IntroGenerationRequest {
	providerName: string;
	category: string;
	city: string;
	state: string;
	yearsInBusiness: number | null;
	specialties: string[];
	localKnowledgeHooks: string[];
	editorialDepth: EditorialDepth;
}

export interface IntroGenerationResponse {
	introduction: string;
	localReferencesUsed: string[];
}

// Combined edge function request
export interface ProfileContentGenerationRequest {
	type: 'our-take' | 'faq' | 'intro';
	data: OurTakeGenerationRequest | FAQGenerationRequest | IntroGenerationRequest;
}

export interface ProfileContentGenerationResponse {
	type: 'our-take' | 'faq' | 'intro';
	result: OurTakeGenerationResponse | FAQGenerationResponse | IntroGenerationResponse;
}
