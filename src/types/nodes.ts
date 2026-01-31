// Node type constants
export const NODE_TYPES = {
	LLM: 'llm',
	OUTPUT: 'output',
	LOCATION: 'location',
	RESEARCH: 'research',
	PROVIDERS: 'providers',
	PROVIDER_ENRICHMENT: 'provider-enrichment',
	CATEGORY_SELECTOR: 'category-selector',
	WEB_DESIGNER: 'web-designer',
	IMAGE_GEN: 'image-gen',
	LOCAL_KNOWLEDGE: 'local-knowledge',
	SITE_PLANNER: 'site-planner',
	PROVIDER_PROFILE_GENERATOR: 'provider-profile-generator',
	EDITORIAL_CONTENT_GENERATOR: 'editorial-content-generator',
	COMPARISON_DATA: 'comparison-data',
	SEO_OPTIMIZATION: 'seo-optimization',
	DESIGN_PROMPT: 'design-prompt',
	IMAGE_SOURCE: 'image-source',
	BRAND_DESIGN: 'brand-design',
	DATA_VIEWER: 'data-viewer',
	CODE_GENERATION: 'code-generation',
	SCREENSHOT_REPLICATOR: 'screenshot-replicator',
} as const;

export type NodeType = (typeof NODE_TYPES)[keyof typeof NODE_TYPES];

// Node status for async operations
export type NodeStatus = 'idle' | 'loading' | 'success' | 'error';

// Base node data shared by all node types
export interface BaseNodeData {
	id: string;
	x: number;
	y: number;
	width: number;
	height: number;
	title: string;
	color: string;
	type: NodeType;
}

// LLM Node specific data
export interface LLMNodeData extends BaseNodeData {
	type: 'llm';
	text: string;
	provider: string;
	status: NodeStatus;
	response: string | null;
	error: string | null;
	useReasoning: boolean;
}

// Output Node specific data
export interface OutputNodeData extends BaseNodeData {
	type: 'output';
	text: string;
	displayValue: string | null;
	lastUpdated: number | null;
}

// GeoJSON geometry types for region boundaries
export type GeoJSONGeometry =
	| GeoJSON.Point
	| GeoJSON.MultiPoint
	| GeoJSON.LineString
	| GeoJSON.MultiLineString
	| GeoJSON.Polygon
	| GeoJSON.MultiPolygon
	| GeoJSON.GeometryCollection;

// Demographics data from Census Bureau API
export interface DemographicsData {
	population: number | null;
	medianHouseholdIncome: number | null;
	homeownershipRate: number | null;
	medianHomeValue: number | null;
	geographyLevel: 'county' | 'state' | 'place';
	geographyName: string;
}

// Demographics loading state
export type DemographicsStatus =
	| 'idle'
	| 'loading'
	| 'success'
	| 'error'
	| 'unavailable';

// Location data
export interface LocationData {
	name: string;
	county?: string; // County name for US locations
	state: string;
	country: string;
	lat: number;
	lng: number;
	geojson?: GeoJSONGeometry;
	demographics?: DemographicsData;
}

// Location Node specific data
export interface LocationNodeData extends BaseNodeData {
	type: 'location';
	text: string;
	selectedLocation: LocationData | null;
	demographicsStatus: DemographicsStatus;
	demographicsError: string | null;
}

// Research scan mode
export type ResearchScanMode = 'triage' | 'full';

// Category analysis result from SERP research
export interface CategoryAnalysisResult {
	category: string;
	tier: 'tier1' | 'tier2' | 'tier3' | 'conditional';
	serpQuality: 'Weak' | 'Medium' | 'Strong';
	serpScore: number;
	competition: 'Low' | 'Medium' | 'High';
	leadValue: string;
	urgency: 'Low' | 'Medium' | 'High';
	verdict: 'strong' | 'maybe' | 'skip';
	reasoning: string;
	fromCache: boolean;
	// New validation fields
	validationFlags?: string[];
	trendConfidence?: number;
	demandConfidence?: 'high' | 'medium' | 'low' | 'unvalidated';
	spikeDetected?: boolean;
	trendDirection?: 'growing' | 'declining' | 'flat' | 'volatile';
	// Manual override - user has validated this category manually
	manualOverride?: boolean;
}

// Validation summary for a research scan
export interface ValidationSummary {
	totalFlags: number;
	criticalWarnings: string[];
	trendsValidated: number;
	overriddenCount: number; // How many categories user manually validated
}

// Triage result for quick scan
export interface TriageResultData {
	overallSignal: 'promising' | 'neutral' | 'saturated';
	lsaPresent: boolean;
	aggregatorDominance: 'high' | 'medium' | 'low';
	adDensity: 'high' | 'medium' | 'low';
	recommendation: string;
	worthFullScan: boolean;
}

// Research progress tracking
export interface ResearchProgress {
	currentCategory: string | null;
	completedCount: number;
	totalCount: number;
	cacheHits: number;
	searchesUsed: number;
}

// Deep Research Node specific data
export interface DeepResearchNodeData extends BaseNodeData {
	type: 'research';
	text: string;
	scanMode: ResearchScanMode;
	status: NodeStatus;
	error: string | null;
	// Input city (from connected LocationNode)
	inputCity: string | null;
	inputState: string | null;
	// City profile traits
	cityTraits: string[];
	// Scan configuration
	maxSearches: number;
	enableDeepDive: boolean;
	// Results
	triageResult: TriageResultData | null;
	categoryResults: CategoryAnalysisResult[];
	topOpportunities: CategoryAnalysisResult[];
	skipList: { category: string; reason: string }[];
	// Validation summary
	validationSummary: ValidationSummary | null;
	// Progress
	progress: ResearchProgress;
	// Timestamps
	lastScanAt: number | null;
}

// Provider priority tier
export type ProviderPriority = 'P1' | 'P2' | 'P3' | 'P4' | 'skip';

// Provider scoring (5 factors, 1-5 each, max 25)
export interface ProviderScore {
	advertising: number; // LSAs, Google Ads, directories
	digitalPresence: number; // Website quality
	reviewVelocity: number; // Recent review activity
	sizeSignal: number; // Solo → small team → large
	reachability: number; // Phone/email available
	total: number;
	priority: ProviderPriority;
}

// Provider data from discovery
export interface ProviderData {
	id: string;
	name: string;
	phone: string | null;
	website: string | null;
	address: string | null;
	googleRating: number | null;
	googleReviewCount: number | null;
	hasLSA: boolean;
	hasGoogleAds: boolean;
	score: ProviderScore;
	reasoning: string;
	contacted: boolean; // Simple tracking
}

// Provider discovery progress
export interface ProviderDiscoveryProgress {
	currentSource: string | null;
	completed: boolean;
}

// Provider Discovery Node specific data
export interface ProviderDiscoveryNodeData extends BaseNodeData {
	type: 'providers';
	status: NodeStatus;
	error: string | null;
	// Input (from connected node)
	inputCategory: string | null;
	inputCity: string | null;
	inputState: string | null;
	// Manual category input (when connected to Location node only)
	manualCategory: string;
	// Configuration
	providerLimit: number; // How many providers to request (default 10, max ~20)
	// Results
	providers: ProviderData[];
	// Selection for export (IDs of providers selected to pass downstream)
	selectedProviderIds: string[];
	// Progress
	progress: ProviderDiscoveryProgress;
	// Timestamps
	lastDiscoveryAt: number | null;
}

// Category item within the Category Selector Node
export interface CategoryItem {
	id: string; // Unique ID for this slot (used as port ID)
	category: string; // Category name from research
	serpQuality: 'Weak' | 'Medium' | 'Strong';
	serpScore: number;
	leadValue: string;
	verdict: 'strong' | 'maybe' | 'skip';
	visible: boolean; // Controls port visibility
	order: number; // For reordering
}

// Category Selector Node output (per-port data sent downstream)
export interface CategoryPortOutput {
	category: string;
	city: string;
	state: string | null;
	serpQuality: 'Weak' | 'Medium' | 'Strong';
	serpScore: number;
	leadValue: string;
	verdict: 'strong' | 'maybe' | 'skip';
}

// Category Selector Node specific data
export interface CategorySelectorNodeData extends BaseNodeData {
	type: 'category-selector';
	// Input data (from connected Research node)
	inputCity: string | null;
	inputState: string | null;
	// Categories populated from upstream
	categories: CategoryItem[];
	// Timestamp
	lastUpdatedAt: number | null;
}

// Web Designer Node specific data
export interface WebDesignerNodeData extends BaseNodeData {
	type: 'web-designer';
	status: NodeStatus;
	error: string | null;
	// LLM Provider Selection
	provider: string;
	useReasoning: boolean;
	// Inputs (from connected nodes)
	inputCity: string | null;
	inputState: string | null;
	inputCategory: string | null;
	inputSerpScore: number | null;
	inputSerpQuality: 'Weak' | 'Medium' | 'Strong' | null;
	inputUrgency: 'extreme' | 'high' | 'medium' | 'low' | null;
	inputCompetition: 'low' | 'moderate' | 'high' | 'extreme' | null;
	// Generated output
	generatedPrompt: string | null;
	generatedBusinessName: string | null;
	// Timestamps
	lastGeneratedAt: number | null;
}

// Provider Enrichment progress tracking
export interface ProviderEnrichmentProgress {
	currentProvider: string | null;
	currentIndex: number;
	totalCount: number;
	completed: boolean;
	// Discovery phase tracking
	phase: 'discovery' | 'enrichment' | null;
	discoveredCount: number; // How many websites were discovered
}

// Provider Enrichment Node specific data
export interface ProviderEnrichmentNodeData extends BaseNodeData {
	type: 'provider-enrichment';
	status: NodeStatus;
	error: string | null;
	// Input from upstream Provider Discovery Node
	inputProviders: ProviderData[];
	inputCategory: string | null;
	inputCity: string | null;
	inputState: string | null;
	// Results (EnrichedProvider[] - imported from enrichedProvider.ts when used)
	enrichedProviders: unknown[]; // Use unknown to avoid circular import
	// Progress
	progress: ProviderEnrichmentProgress;
	// Settings
	skipWithoutWebsite: boolean; // Legacy - kept for compatibility
	discoverMissingWebsites: boolean; // New: try to find websites for providers without one
	// Manual website overrides (providerId -> websiteUrl)
	manualWebsites: Record<string, string>;
	// Timestamps
	lastEnrichmentAt: number | null;
}

// Aspect ratio types for image generation
export type AspectRatioPreset = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
export type AspectRatioMode = 'preset' | 'custom';

// Batch generated image for image generation node
export interface BatchGeneratedImage {
	dataUrl: string; // Base64 data URL
	publicUrl: string | null; // Supabase storage URL (for linking)
	index: number; // Position in batch (0-3)
}

// Image Generation Node specific data
export interface ImageGenNodeData extends BaseNodeData {
	type: 'image-gen';
	status: NodeStatus;
	error: string | null;
	// Prompt (local input, can be overridden by upstream)
	prompt: string;
	// Batch configuration (1-4 images in parallel)
	batchCount: number;
	// Aspect ratio configuration
	aspectRatioMode: AspectRatioMode;
	aspectRatio: AspectRatioPreset; // For preset mode
	customWidth: number | null; // For custom mode (e.g. 1440)
	customHeight: number | null; // For custom mode (e.g. 4500)
	// Generated output (batch)
	generatedImages: BatchGeneratedImage[]; // Array of generated images
	// Legacy single image support (for backward compatibility)
	generatedImage: string | null; // Base64 data URL
	publicUrl: string | null; // Supabase storage URL (for linking)
	// Timestamps
	lastGeneratedAt: number | null;
}

// Local Knowledge Node specific data
export interface LocalKnowledgeNodeData extends BaseNodeData {
	type: 'local-knowledge';
	status: NodeStatus;
	error: string | null;
	// Inputs (from connected nodes)
	inputCity: string | null;
	inputCounty: string | null;
	inputState: string | null;
	inputCategory: string | null;
	// Manual category input (when category not from upstream)
	manualCategory: string;
	// Generated output (LocalKnowledgeOutput from localKnowledge.ts)
	output: unknown | null; // Use unknown to avoid circular import
	// Timestamps
	lastGeneratedAt: number | null;
}

// Site depth configuration
export type SiteDepth = 'mvp' | 'standard' | 'comprehensive';

// Site Planner Node specific data
export interface SitePlannerNodeData extends BaseNodeData {
	type: 'site-planner';
	status: NodeStatus;
	error: string | null;
	// Configuration
	depth: SiteDepth;
	// Inputs (aggregated from multiple upstream nodes)
	inputCity: string | null;
	inputState: string | null;
	inputCategory: string | null;
	inputSerpScore: number | null;
	inputSerpQuality: 'Weak' | 'Medium' | 'Strong' | null;
	inputProviderCount: number;
	inputHasLocalKnowledge: boolean;
	// Generated output (SitePlannerOutput from sitePlanner.ts)
	output: unknown | null; // Use unknown to avoid circular import
	// Timestamps
	lastGeneratedAt: number | null;
}

// Editorial depth for provider profiles
export type EditorialDepth = 'brief' | 'standard' | 'detailed';

// Provider Profile Generation progress tracking
export interface ProfileGenerationProgress {
	currentProvider: string | null;
	currentIndex: number;
	totalCount: number;
	phase: 'preparing' | 'generating' | 'validating' | 'complete';
	completedProfiles: number;
}

// Provider Profile Generator Node specific data
export interface ProviderProfileGeneratorNodeData extends BaseNodeData {
	type: 'provider-profile-generator';
	status: NodeStatus;
	error: string | null;
	// Configuration
	editorialDepth: EditorialDepth;
	includeComparison: boolean;
	// Inputs (aggregated from multiple upstream nodes)
	inputCity: string | null;
	inputState: string | null;
	inputCategory: string | null;
	inputProviderCount: number;
	inputHasBlueprint: boolean;
	inputHasLocalKnowledge: boolean;
	// Progress tracking
	progress: ProfileGenerationProgress;
	// Generated output (GeneratedProviderProfile[] from generatedProfile.ts)
	output: unknown[] | null; // Use unknown to avoid circular import
	// Timestamps
	lastGeneratedAt: number | null;
}

// Editorial Content Generation progress tracking
export interface EditorialContentGenerationProgress {
	currentPage: string | null;
	currentIndex: number;
	totalCount: number;
	phase:
		| 'preparing'
		| 'generating'
		| 'injecting-local'
		| 'validating'
		| 'complete';
	completedPages: number;
	currentSection: string | null;
}

// Quality level for editorial content
export type EditorialQualityLevel = 'draft' | 'polished';

// Editorial page types for content generation
export type EditorialPageType =
	| 'service_page'
	| 'city_service_page'
	| 'cost_guide'
	| 'troubleshooting'
	| 'buying_guide'
	| 'diy_guide'
	| 'local_expertise'
	| 'about'
	| 'methodology';

// Editorial Content Generator Node specific data
// Available Claude models for editorial content generation
export type EditorialModelKey =
	| 'claude-haiku'
	| 'claude-sonnet'
	| 'claude-opus';

export interface EditorialContentGeneratorNodeData extends BaseNodeData {
	type: 'editorial-content-generator';
	status: NodeStatus;
	error: string | null;
	// Configuration
	contentTypes: EditorialPageType[];
	qualityLevel: EditorialQualityLevel;
	modelKey: EditorialModelKey;
	// Inputs (aggregated from multiple upstream nodes)
	inputCity: string | null;
	inputState: string | null;
	inputCategory: string | null;
	inputPageCount: number;
	inputHasBlueprint: boolean;
	inputHasLocalKnowledge: boolean;
	inputHasSerpData: boolean;
	// Progress tracking
	progress: EditorialContentGenerationProgress;
	// Generated output (GeneratedEditorialContent from editorialContent.ts)
	output: unknown | null; // Use unknown to avoid circular import
	// Timestamps
	lastGeneratedAt: number | null;
}

// Comparison Data Generation progress tracking
export interface ComparisonDataGenerationProgress {
	phase:
		| 'preparing'
		| 'analyzing'
		| 'generating-comparisons'
		| 'generating-pricing'
		| 'generating-analysis'
		| 'complete';
	currentStep: string | null;
	completedSteps: number;
	totalSteps: number;
}

// Comparison Data Node specific data
// Note: hasInputPort is false because we use custom multi-input ports
export interface ComparisonDataNodeData extends BaseNodeData {
	type: 'comparison-data';
	status: NodeStatus;
	error: string | null;
	// Configuration
	includePricing: boolean;
	includeWinnerBadges: boolean;
	// Inputs (aggregated from multiple upstream nodes)
	inputCity: string | null;
	inputState: string | null;
	inputCategory: string | null;
	inputProviderCount: number;
	inputHasBlueprint: boolean;
	inputHasLocalKnowledge: boolean;
	// Progress tracking
	progress: ComparisonDataGenerationProgress;
	// Generated output (GeneratedComparisonData from comparisonPage.ts)
	output: unknown | null; // Use unknown to avoid circular import
	// Timestamps
	lastGeneratedAt: number | null;
}

// SEO Optimization progress tracking
export interface SEOOptimizationProgress {
	phase:
		| 'preparing'
		| 'optimizing-meta'
		| 'generating-schema'
		| 'optimizing-links'
		| 'generating-sitemap'
		| 'validating'
		| 'complete';
	currentPage: string | null;
	completedPages: number;
	totalPages: number;
	currentStep: string | null;
}

// SEO Optimization Node specific data
// Note: hasInputPort is false because we use custom multi-input ports
export interface SEOOptimizationNodeData extends BaseNodeData {
	type: 'seo-optimization';
	status: NodeStatus;
	error: string | null;
	// Configuration
	schemaValidation: boolean;
	linkDensityTarget: number;
	// Inputs (aggregated from multiple upstream nodes)
	inputCity: string | null;
	inputState: string | null;
	inputCategory: string | null;
	inputPageCount: number;
	inputHasBlueprint: boolean;
	inputHasProviders: boolean;
	inputHasEditorial: boolean;
	inputHasComparison: boolean;
	// Progress tracking
	progress: SEOOptimizationProgress;
	// Generated output (SEOOptimizedPackage from seoPackage.ts)
	output: unknown | null; // Use unknown to avoid circular import
	// Timestamps
	lastOptimizedAt: number | null;
}

// Design Prompt Generator Node specific data
// Transforms Site Planner output into an image generation prompt
export interface DesignPromptNodeData extends BaseNodeData {
	type: 'design-prompt';
	status: NodeStatus;
	error: string | null;
	// Optional color override
	primaryColorOverride: string | null;
	// Inputs from Site Planner
	inputCity: string | null;
	inputState: string | null;
	inputCategory: string | null;
	inputBrandName: string | null;
	inputTagline: string | null;
	inputProviderCount: number;
	inputRegion: string | null;
	inputHasBlueprint: boolean;
	// Generated output
	generatedPrompt: string | null;
	// Timestamps
	lastGeneratedAt: number | null;
}

// Image Source Node specific data
// Allows selecting an image from the library to use as source for downstream nodes
export interface ImageSourceNodeData extends BaseNodeData {
	type: 'image-source';
	// Selected image from library
	selectedImageId: string | null;
	selectedImageUrl: string | null; // Base64 data URL or public URL
	// Metadata for display
	selectedImagePrompt: string | null;
	selectedImageAspectRatio: string | null;
}

// Brand Design extraction progress phases
export type BrandDesignPhase =
	| 'preparing'
	| 'extracting-global'
	| 'extracting-sections'
	| 'extracting-components'
	| 'merging'
	| 'generating-tailwind'
	| 'complete';

// Brand Design progress tracking
export interface BrandDesignProgress {
	phase: BrandDesignPhase;
	passesComplete: number;
	totalPasses: 3;
	currentPassName?: string;
}

// Brand Design Node specific data
// Extracts design system from screenshots using Claude vision
export interface BrandDesignNodeData extends BaseNodeData {
	type: 'brand-design';
	status: NodeStatus;
	error: string | null;
	// Input from upstream ImageGenNode
	inputScreenshotUrl: string | null;
	// Progress tracking for multi-pass extraction
	progress: BrandDesignProgress;
	// Generated output (BrandDesignOutput from brandDesign.ts)
	output: unknown | null; // Use unknown to avoid circular import
	// Timestamps
	lastExtractedAt: number | null;
}

// Data Viewer Node specific data
// Displays structured JSON output from upstream nodes
export interface DataViewerNodeData extends BaseNodeData {
	type: 'data-viewer';
	// Cached display value (stringified JSON)
	displayValue: string | null;
	// Source node type for context
	sourceNodeType: string | null;
	// Last updated timestamp
	lastUpdated: number | null;
}

// Code Generation progress tracking
export type CodeGenerationPhase =
	| 'preparing'
	| 'routing'
	| 'styling'
	| 'content'
	| 'assembling'
	| 'validating'
	| 'complete';

export interface CodeGenerationProgress {
	phase: CodeGenerationPhase;
	currentFile: string | null;
	filesGenerated: number;
	totalFiles: number;
	bytesGenerated: number;
}

// Code Generation output format
export type CodeOutputFormat = 'files' | 'zip';

// Code Generation Node specific data
// Final pipeline node: transforms all upstream outputs into deployable Next.js codebase
export interface CodeGenerationNodeData extends BaseNodeData {
	type: 'code-generation';
	status: NodeStatus;
	error: string | null;
	// Input tracking (6 inputs from upstream nodes)
	inputHasSitePlan: boolean;
	inputHasSEO: boolean;
	inputHasBrandDesign: boolean;
	inputHasEditorial: boolean;
	inputHasProfiles: boolean;
	inputHasComparison: boolean;
	// Derived metadata from inputs
	inputCity: string | null;
	inputState: string | null;
	inputCategory: string | null;
	inputPageCount: number;
	// Configuration
	outputFormat: CodeOutputFormat;
	includeReadme: boolean;
	/** Use LLM for page generation (Opus for homepage, Haiku for others) */
	useLLM: boolean;
	/** Generate images using Gemini Imagen 3 */
	generateImages: boolean;
	// Progress tracking
	progress: CodeGenerationProgress;
	// Generated output (GeneratedCodebase from codeGeneration.ts)
	output: unknown | null; // Use unknown to avoid circular import
	// Timestamps
	lastGeneratedAt: number | null;
}

// Screenshot Replicator progress tracking
export type ScreenshotReplicatorPhase =
	| 'idle'
	| 'analyzing'
	| 'generating-assets'
	| 'generating-code'
	| 'assembling'
	| 'complete';

export interface ScreenshotReplicatorProgress {
	phase: ScreenshotReplicatorPhase;
	currentPass?: string;
	passesComplete: number;
	totalPasses: number;
	currentAsset?: string;
	assetsGenerated: number;
	totalAssets: number;
	currentSection?: string;
	sectionsGenerated: number;
	totalSections: number;
	currentFile?: string;
	filesGenerated: number;
	bytesGenerated: number;
}

// Screenshot Replicator Node specific data
// Analyzes a screenshot and replicates it as React/Tailwind code
export interface ScreenshotReplicatorNodeData extends BaseNodeData {
	type: 'screenshot-replicator';
	status: NodeStatus;
	error: string | null;
	// Input from upstream ImageSourceNode or ImageGenNode
	inputScreenshotUrl: string | null;
	// Analysis results (ScreenshotAnalysis from screenshotReplicator.ts)
	analysis: unknown | null; // Use unknown to avoid circular import
	// Progress tracking
	progress: ScreenshotReplicatorProgress;
	// Generated output (ReplicatorOutput from screenshotReplicator.ts)
	output: unknown | null; // Use unknown to avoid circular import
	// Timestamps
	lastAnalyzedAt: number | null;
	lastGeneratedAt: number | null;
}

// Union type for all node types
export type NodeData =
	| LLMNodeData
	| OutputNodeData
	| LocationNodeData
	| DeepResearchNodeData
	| ProviderDiscoveryNodeData
	| ProviderEnrichmentNodeData
	| CategorySelectorNodeData
	| WebDesignerNodeData
	| ImageGenNodeData
	| LocalKnowledgeNodeData
	| SitePlannerNodeData
	| ProviderProfileGeneratorNodeData
	| EditorialContentGeneratorNodeData
	| ComparisonDataNodeData
	| SEOOptimizationNodeData
	| DesignPromptNodeData
	| ImageSourceNodeData
	| BrandDesignNodeData
	| DataViewerNodeData
	| CodeGenerationNodeData
	| ScreenshotReplicatorNodeData;

// Type guards for narrowing node types
export function isLLMNode(node: NodeData): node is LLMNodeData {
	return node.type === 'llm';
}

export function isOutputNode(node: NodeData): node is OutputNodeData {
	return node.type === 'output';
}

export function isLocationNode(node: NodeData): node is LocationNodeData {
	return node.type === 'location';
}

export function isResearchNode(node: NodeData): node is DeepResearchNodeData {
	return node.type === 'research';
}

export function isProviderNode(
	node: NodeData,
): node is ProviderDiscoveryNodeData {
	return node.type === 'providers';
}

export function isCategorySelectorNode(
	node: NodeData,
): node is CategorySelectorNodeData {
	return node.type === 'category-selector';
}

export function isWebDesignerNode(node: NodeData): node is WebDesignerNodeData {
	return node.type === 'web-designer';
}

export function isImageGenNode(node: NodeData): node is ImageGenNodeData {
	return node.type === 'image-gen';
}

export function isProviderEnrichmentNode(
	node: NodeData,
): node is ProviderEnrichmentNodeData {
	return node.type === 'provider-enrichment';
}

export function isLocalKnowledgeNode(
	node: NodeData,
): node is LocalKnowledgeNodeData {
	return node.type === 'local-knowledge';
}

export function isSitePlannerNode(node: NodeData): node is SitePlannerNodeData {
	return node.type === 'site-planner';
}

export function isProviderProfileGeneratorNode(
	node: NodeData,
): node is ProviderProfileGeneratorNodeData {
	return node.type === 'provider-profile-generator';
}

export function isEditorialContentGeneratorNode(
	node: NodeData,
): node is EditorialContentGeneratorNodeData {
	return node.type === 'editorial-content-generator';
}

export function isComparisonDataNode(
	node: NodeData,
): node is ComparisonDataNodeData {
	return node.type === 'comparison-data';
}

export function isSEOOptimizationNode(
	node: NodeData,
): node is SEOOptimizationNodeData {
	return node.type === 'seo-optimization';
}

export function isDesignPromptNode(
	node: NodeData,
): node is DesignPromptNodeData {
	return node.type === 'design-prompt';
}

export function isImageSourceNode(node: NodeData): node is ImageSourceNodeData {
	return node.type === 'image-source';
}

export function isBrandDesignNode(node: NodeData): node is BrandDesignNodeData {
	return node.type === 'brand-design';
}

export function isDataViewerNode(node: NodeData): node is DataViewerNodeData {
	return node.type === 'data-viewer';
}

export function isCodeGenerationNode(
	node: NodeData,
): node is CodeGenerationNodeData {
	return node.type === 'code-generation';
}

export function isScreenshotReplicatorNode(
	node: NodeData,
): node is ScreenshotReplicatorNodeData {
	return node.type === 'screenshot-replicator';
}

// Default node dimensions
export const NODE_DEFAULTS = {
	llm: {
		width: 320,
		height: 320,
		color: '#6366f1',
	},
	output: {
		width: 320,
		height: 280,
		color: '#10b981',
	},
	location: {
		width: 400,
		height: 480,
		color: '#0ea5e9',
	},
	research: {
		width: 480,
		height: 600,
		color: '#f97316',
	},
	providers: {
		width: 480,
		height: 520,
		color: '#14b8a6',
	},
	'category-selector': {
		width: 420,
		height: 480,
		color: '#8b5cf6', // Violet/purple
	},
	'web-designer': {
		width: 400,
		height: 420,
		color: '#ec4899', // Pink
	},
	'image-gen': {
		width: 380,
		height: 420,
		color: '#06b6d4', // Cyan/teal
	},
	'provider-enrichment': {
		width: 500,
		height: 560,
		color: '#a855f7', // Purple
	},
	'local-knowledge': {
		width: 420,
		height: 520,
		color: '#22c55e', // Green - representing local/organic knowledge
	},
	'site-planner': {
		width: 480,
		height: 600,
		color: '#3b82f6', // Blue - representing structured planning
	},
	'provider-profile-generator': {
		width: 480,
		height: 620,
		color: '#f59e0b', // Amber - representing profile/content generation
	},
	'editorial-content-generator': {
		width: 420,
		height: 520,
		color: '#10b981', // Emerald - representing editorial/content creation
	},
	'comparison-data': {
		width: 480,
		height: 580,
		color: '#ef4444', // Red - representing data/comparison analysis
	},
	'seo-optimization': {
		width: 500,
		height: 640,
		color: '#0d9488', // Teal - representing technical SEO
	},
	'design-prompt': {
		width: 420,
		height: 480,
		color: '#d946ef', // Fuchsia - representing design/creative
	},
	'image-source': {
		width: 340,
		height: 380,
		color: '#f472b6', // Pink - representing image source/selection
	},
	'brand-design': {
		width: 400,
		height: 550,
		color: '#6366f1', // Indigo - representing design/branding
	},
	'data-viewer': {
		width: 420,
		height: 480,
		color: '#64748b', // Slate - neutral for viewing data
	},
	'code-generation': {
		width: 520,
		height: 700,
		color: '#059669', // Emerald - representing code/generation
	},
	'screenshot-replicator': {
		width: 480,
		height: 650,
		color: '#7c3aed', // Violet - representing visual replication
	},
} as const;

// Port types
export type PortType = 'in' | 'out';

export interface HoveredPort {
	nodeId: string;
	type: PortType;
	portId?: string; // For multi-port nodes
}
