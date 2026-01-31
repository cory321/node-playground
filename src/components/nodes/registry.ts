import {
	Brain,
	Monitor,
	MapPin,
	Search,
	Users,
	Layers,
	Palette,
	Image as ImageIcon,
	ImagePlus,
	Sparkles,
	BookOpen,
	FileText,
	UserCircle,
	Newspaper,
	BarChart3,
	Shield,
	Wand2,
	Paintbrush,
	Code2,
	Copy,
	LucideIcon,
} from 'lucide-react';
import {
	NodeType,
	NodeData,
	LLMNodeData,
	OutputNodeData,
	LocationNodeData,
	DeepResearchNodeData,
	ProviderDiscoveryNodeData,
	ProviderEnrichmentNodeData,
	CategorySelectorNodeData,
	WebDesignerNodeData,
	ImageGenNodeData,
	LocalKnowledgeNodeData,
	SitePlannerNodeData,
	ProviderProfileGeneratorNodeData,
	EditorialContentGeneratorNodeData,
	ComparisonDataNodeData,
	SEOOptimizationNodeData,
	DesignPromptNodeData,
	ImageSourceNodeData,
	BrandDesignNodeData,
	DataViewerNodeData,
	CodeGenerationNodeData,
	ScreenshotReplicatorNodeData,
	NODE_DEFAULTS,
} from '@/types/nodes';

// Node component props interface (minimal common props)
export interface NodeComponentProps<T extends NodeData = NodeData> {
	node: T;
	updateNode: (id: string, updates: Partial<T>) => void;
	deleteNode: (id: string) => void;
	// ... additional props handled by the renderer
}

// Node type configuration
export interface NodeTypeConfig {
	type: NodeType;
	label: string;
	icon: LucideIcon;
	color: string;
	defaultWidth: number;
	defaultHeight: number;
	hasInputPort: boolean;
	hasOutputPort: boolean;
	createDefaultData: (id: string, x: number, y: number) => NodeData;
}

// Registry map
const registry = new Map<NodeType, NodeTypeConfig>();

// Register LLM node type
registry.set('llm', {
	type: 'llm',
	label: 'LLM Node',
	icon: Brain,
	color: NODE_DEFAULTS.llm.color,
	defaultWidth: NODE_DEFAULTS.llm.width,
	defaultHeight: NODE_DEFAULTS.llm.height,
	hasInputPort: true,
	hasOutputPort: true,
	createDefaultData: (id: string, x: number, y: number): LLMNodeData => ({
		id,
		x,
		y,
		width: NODE_DEFAULTS.llm.width,
		height: NODE_DEFAULTS.llm.height,
		title: 'LLM Node',
		text: '',
		color: NODE_DEFAULTS.llm.color,
		type: 'llm',
		provider: 'claude-sonnet',
		status: 'idle',
		response: null,
		error: null,
		useReasoning: false,
	}),
});

// Register Output node type
registry.set('output', {
	type: 'output',
	label: 'Output',
	icon: Monitor,
	color: NODE_DEFAULTS.output.color,
	defaultWidth: NODE_DEFAULTS.output.width,
	defaultHeight: NODE_DEFAULTS.output.height,
	hasInputPort: true,
	hasOutputPort: false,
	createDefaultData: (id: string, x: number, y: number): OutputNodeData => ({
		id,
		x,
		y,
		width: NODE_DEFAULTS.output.width,
		height: NODE_DEFAULTS.output.height,
		title: 'Output',
		text: '',
		color: NODE_DEFAULTS.output.color,
		type: 'output',
		displayValue: null,
		lastUpdated: null,
	}),
});

// Register Location node type
registry.set('location', {
	type: 'location',
	label: 'Location Picker',
	icon: MapPin,
	color: NODE_DEFAULTS.location.color,
	defaultWidth: NODE_DEFAULTS.location.width,
	defaultHeight: NODE_DEFAULTS.location.height,
	hasInputPort: false,
	hasOutputPort: true,
	createDefaultData: (id: string, x: number, y: number): LocationNodeData => ({
		id,
		x,
		y,
		width: NODE_DEFAULTS.location.width,
		height: NODE_DEFAULTS.location.height,
		title: 'Location Picker',
		text: '',
		color: NODE_DEFAULTS.location.color,
		type: 'location',
		selectedLocation: null,
		demographicsStatus: 'idle',
		demographicsError: null,
	}),
});

// Register Deep Research node type
registry.set('research', {
	type: 'research',
	label: 'Deep Research',
	icon: Search,
	color: NODE_DEFAULTS.research.color,
	defaultWidth: NODE_DEFAULTS.research.width,
	defaultHeight: NODE_DEFAULTS.research.height,
	hasInputPort: true,
	hasOutputPort: true,
	createDefaultData: (
		id: string,
		x: number,
		y: number,
	): DeepResearchNodeData => ({
		id,
		x,
		y,
		width: NODE_DEFAULTS.research.width,
		height: NODE_DEFAULTS.research.height,
		title: 'Deep Research',
		text: '',
		color: NODE_DEFAULTS.research.color,
		type: 'research',
		scanMode: 'full',
		status: 'idle',
		error: null,
		inputCity: null,
		inputState: null,
		cityTraits: [],
		maxSearches: 12,
		enableDeepDive: true,
		triageResult: null,
		categoryResults: [],
		topOpportunities: [],
		skipList: [],
		validationSummary: null,
		progress: {
			currentCategory: null,
			completedCount: 0,
			totalCount: 0,
			cacheHits: 0,
			searchesUsed: 0,
		},
		lastScanAt: null,
	}),
});

// Register Provider Discovery node type
registry.set('providers', {
	type: 'providers',
	label: 'Provider Discovery',
	icon: Users,
	color: NODE_DEFAULTS.providers.color,
	defaultWidth: NODE_DEFAULTS.providers.width,
	defaultHeight: NODE_DEFAULTS.providers.height,
	hasInputPort: true,
	hasOutputPort: true,
	createDefaultData: (
		id: string,
		x: number,
		y: number,
	): ProviderDiscoveryNodeData => ({
		id,
		x,
		y,
		width: NODE_DEFAULTS.providers.width,
		height: NODE_DEFAULTS.providers.height,
		title: 'Provider Discovery',
		color: NODE_DEFAULTS.providers.color,
		type: 'providers',
		status: 'idle',
		error: null,
		inputCategory: null,
		inputCity: null,
		inputState: null,
		manualCategory: '',
		providerLimit: 10, // Default to 10 providers (uses Google Maps engine)
		providers: [],
		selectedProviderIds: [], // Empty by default - user must select providers to export
		progress: {
			currentSource: null,
			completed: false,
		},
		lastDiscoveryAt: null,
	}),
});

// Register Provider Enrichment node type
registry.set('provider-enrichment', {
	type: 'provider-enrichment',
	label: 'Provider Enrichment',
	icon: Sparkles,
	color: NODE_DEFAULTS['provider-enrichment'].color,
	defaultWidth: NODE_DEFAULTS['provider-enrichment'].width,
	defaultHeight: NODE_DEFAULTS['provider-enrichment'].height,
	hasInputPort: true,
	hasOutputPort: true,
	createDefaultData: (
		id: string,
		x: number,
		y: number,
	): ProviderEnrichmentNodeData => ({
		id,
		x,
		y,
		width: NODE_DEFAULTS['provider-enrichment'].width,
		height: NODE_DEFAULTS['provider-enrichment'].height,
		title: 'Provider Enrichment',
		color: NODE_DEFAULTS['provider-enrichment'].color,
		type: 'provider-enrichment',
		status: 'idle',
		error: null,
		inputProviders: [],
		inputCategory: null,
		inputCity: null,
		inputState: null,
		enrichedProviders: [],
		progress: {
			currentProvider: null,
			currentIndex: 0,
			totalCount: 0,
			completed: false,
			phase: null,
			discoveredCount: 0,
		},
		skipWithoutWebsite: false,
		discoverMissingWebsites: true,
		manualWebsites: {},
		lastEnrichmentAt: null,
	}),
});

// Register Category Selector node type
registry.set('category-selector', {
	type: 'category-selector',
	label: 'Category Selector',
	icon: Layers,
	color: NODE_DEFAULTS['category-selector'].color,
	defaultWidth: NODE_DEFAULTS['category-selector'].width,
	defaultHeight: NODE_DEFAULTS['category-selector'].height,
	hasInputPort: true,
	hasOutputPort: false, // Custom multi-port handling
	createDefaultData: (
		id: string,
		x: number,
		y: number,
	): CategorySelectorNodeData => ({
		id,
		x,
		y,
		width: NODE_DEFAULTS['category-selector'].width,
		height: NODE_DEFAULTS['category-selector'].height,
		title: 'Category Selector',
		color: NODE_DEFAULTS['category-selector'].color,
		type: 'category-selector',
		inputCity: null,
		inputState: null,
		categories: [],
		lastUpdatedAt: null,
	}),
});

// Register Web Designer node type
registry.set('web-designer', {
	type: 'web-designer',
	label: 'Web Designer',
	icon: Palette,
	color: NODE_DEFAULTS['web-designer'].color,
	defaultWidth: NODE_DEFAULTS['web-designer'].width,
	defaultHeight: NODE_DEFAULTS['web-designer'].height,
	hasInputPort: true,
	hasOutputPort: true,
	createDefaultData: (
		id: string,
		x: number,
		y: number,
	): WebDesignerNodeData => ({
		id,
		x,
		y,
		width: NODE_DEFAULTS['web-designer'].width,
		height: NODE_DEFAULTS['web-designer'].height,
		title: 'Web Designer',
		color: NODE_DEFAULTS['web-designer'].color,
		type: 'web-designer',
		status: 'idle',
		error: null,
		provider: 'gemini-pro',
		useReasoning: false,
		inputCity: null,
		inputState: null,
		inputCategory: null,
		inputSerpScore: null,
		inputSerpQuality: null,
		inputUrgency: null,
		inputCompetition: null,
		generatedPrompt: null,
		generatedBusinessName: null,
		lastGeneratedAt: null,
	}),
});

// Register Image Generation node type
registry.set('image-gen', {
	type: 'image-gen',
	label: 'Image Generator',
	icon: ImageIcon,
	color: NODE_DEFAULTS['image-gen'].color,
	defaultWidth: NODE_DEFAULTS['image-gen'].width,
	defaultHeight: NODE_DEFAULTS['image-gen'].height,
	hasInputPort: true,
	hasOutputPort: true,
	createDefaultData: (id: string, x: number, y: number): ImageGenNodeData => ({
		id,
		x,
		y,
		width: NODE_DEFAULTS['image-gen'].width,
		height: NODE_DEFAULTS['image-gen'].height,
		title: 'Image Generator',
		color: NODE_DEFAULTS['image-gen'].color,
		type: 'image-gen',
		status: 'idle',
		error: null,
		prompt: '',
		batchCount: 1,
		aspectRatioMode: 'preset',
		aspectRatio: '1:1',
		customWidth: null,
		customHeight: null,
		generatedImages: [],
		generatedImage: null,
		publicUrl: null,
		lastGeneratedAt: null,
	}),
});

// Register Local Knowledge node type
registry.set('local-knowledge', {
	type: 'local-knowledge',
	label: 'Local Knowledge',
	icon: BookOpen,
	color: NODE_DEFAULTS['local-knowledge'].color,
	defaultWidth: NODE_DEFAULTS['local-knowledge'].width,
	defaultHeight: NODE_DEFAULTS['local-knowledge'].height,
	hasInputPort: true,
	hasOutputPort: true,
	createDefaultData: (
		id: string,
		x: number,
		y: number,
	): LocalKnowledgeNodeData => ({
		id,
		x,
		y,
		width: NODE_DEFAULTS['local-knowledge'].width,
		height: NODE_DEFAULTS['local-knowledge'].height,
		title: 'Local Knowledge',
		color: NODE_DEFAULTS['local-knowledge'].color,
		type: 'local-knowledge',
		status: 'idle',
		error: null,
		inputCity: null,
		inputCounty: null,
		inputState: null,
		inputCategory: null,
		manualCategory: '',
		output: null,
		lastGeneratedAt: null,
	}),
});

// Register Site Planner node type
// Note: hasInputPort is false because we use custom multi-input ports
registry.set('site-planner', {
	type: 'site-planner',
	label: 'Site Planner',
	icon: FileText,
	color: NODE_DEFAULTS['site-planner'].color,
	defaultWidth: NODE_DEFAULTS['site-planner'].width,
	defaultHeight: NODE_DEFAULTS['site-planner'].height,
	hasInputPort: false, // Uses custom multi-input ports
	hasOutputPort: true,
	createDefaultData: (
		id: string,
		x: number,
		y: number,
	): SitePlannerNodeData => ({
		id,
		x,
		y,
		width: NODE_DEFAULTS['site-planner'].width,
		height: NODE_DEFAULTS['site-planner'].height,
		title: 'Site Planner',
		color: NODE_DEFAULTS['site-planner'].color,
		type: 'site-planner',
		status: 'idle',
		error: null,
		depth: 'standard',
		inputCity: null,
		inputState: null,
		inputCategory: null,
		inputSerpScore: null,
		inputSerpQuality: null,
		inputProviderCount: 0,
		inputHasLocalKnowledge: false,
		output: null,
		lastGeneratedAt: null,
	}),
});

// Register Provider Profile Generator node type
// Note: hasInputPort is false because we use custom multi-input ports
registry.set('provider-profile-generator', {
	type: 'provider-profile-generator',
	label: 'Profile Generator',
	icon: UserCircle,
	color: NODE_DEFAULTS['provider-profile-generator'].color,
	defaultWidth: NODE_DEFAULTS['provider-profile-generator'].width,
	defaultHeight: NODE_DEFAULTS['provider-profile-generator'].height,
	hasInputPort: false, // Uses custom multi-input ports
	hasOutputPort: true,
	createDefaultData: (
		id: string,
		x: number,
		y: number,
	): ProviderProfileGeneratorNodeData => ({
		id,
		x,
		y,
		width: NODE_DEFAULTS['provider-profile-generator'].width,
		height: NODE_DEFAULTS['provider-profile-generator'].height,
		title: 'Profile Generator',
		color: NODE_DEFAULTS['provider-profile-generator'].color,
		type: 'provider-profile-generator',
		status: 'idle',
		error: null,
		editorialDepth: 'standard',
		includeComparison: true,
		inputCity: null,
		inputState: null,
		inputCategory: null,
		inputProviderCount: 0,
		inputHasBlueprint: false,
		inputHasLocalKnowledge: false,
		progress: {
			currentProvider: null,
			currentIndex: 0,
			totalCount: 0,
			phase: 'preparing',
			completedProfiles: 0,
		},
		output: null,
		lastGeneratedAt: null,
	}),
});

// Register Editorial Content Generator node type
// Note: hasInputPort is false because we use custom multi-input ports
registry.set('editorial-content-generator', {
	type: 'editorial-content-generator',
	label: 'Editorial Content',
	icon: Newspaper,
	color: NODE_DEFAULTS['editorial-content-generator'].color,
	defaultWidth: NODE_DEFAULTS['editorial-content-generator'].width,
	defaultHeight: NODE_DEFAULTS['editorial-content-generator'].height,
	hasInputPort: false, // Uses custom multi-input ports
	hasOutputPort: true,
	createDefaultData: (
		id: string,
		x: number,
		y: number,
	): EditorialContentGeneratorNodeData => ({
		id,
		x,
		y,
		width: NODE_DEFAULTS['editorial-content-generator'].width,
		height: NODE_DEFAULTS['editorial-content-generator'].height,
		title: 'Editorial Content',
		color: NODE_DEFAULTS['editorial-content-generator'].color,
		type: 'editorial-content-generator',
		status: 'idle',
		error: null,
		contentTypes: ['service_page', 'cost_guide'],
		qualityLevel: 'draft',
		modelKey: 'claude-haiku',
		inputCity: null,
		inputState: null,
		inputCategory: null,
		inputPageCount: 0,
		inputHasBlueprint: false,
		inputHasLocalKnowledge: false,
		inputHasSerpData: false,
		progress: {
			currentPage: null,
			currentIndex: 0,
			totalCount: 0,
			phase: 'preparing',
			completedPages: 0,
			currentSection: null,
		},
		output: null,
		lastGeneratedAt: null,
	}),
});

// Register Comparison Data node type
// Note: hasInputPort is false because we use custom multi-input ports
registry.set('comparison-data', {
	type: 'comparison-data',
	label: 'Comparison Data',
	icon: BarChart3,
	color: NODE_DEFAULTS['comparison-data'].color,
	defaultWidth: NODE_DEFAULTS['comparison-data'].width,
	defaultHeight: NODE_DEFAULTS['comparison-data'].height,
	hasInputPort: false, // Uses custom multi-input ports
	hasOutputPort: true,
	createDefaultData: (
		id: string,
		x: number,
		y: number,
	): ComparisonDataNodeData => ({
		id,
		x,
		y,
		width: NODE_DEFAULTS['comparison-data'].width,
		height: NODE_DEFAULTS['comparison-data'].height,
		title: 'Comparison Data',
		color: NODE_DEFAULTS['comparison-data'].color,
		type: 'comparison-data',
		status: 'idle',
		error: null,
		includePricing: true,
		includeWinnerBadges: true,
		inputCity: null,
		inputState: null,
		inputCategory: null,
		inputProviderCount: 0,
		inputHasBlueprint: false,
		inputHasLocalKnowledge: false,
		progress: {
			phase: 'preparing',
			currentStep: null,
			completedSteps: 0,
			totalSteps: 0,
		},
		output: null,
		lastGeneratedAt: null,
	}),
});

// Register SEO Optimization node type
// Note: hasInputPort is false because we use custom multi-input ports
registry.set('seo-optimization', {
	type: 'seo-optimization',
	label: 'SEO Optimization',
	icon: Shield,
	color: NODE_DEFAULTS['seo-optimization'].color,
	defaultWidth: NODE_DEFAULTS['seo-optimization'].width,
	defaultHeight: NODE_DEFAULTS['seo-optimization'].height,
	hasInputPort: false, // Uses custom multi-input ports
	hasOutputPort: true,
	createDefaultData: (
		id: string,
		x: number,
		y: number,
	): SEOOptimizationNodeData => ({
		id,
		x,
		y,
		width: NODE_DEFAULTS['seo-optimization'].width,
		height: NODE_DEFAULTS['seo-optimization'].height,
		title: 'SEO Optimization',
		color: NODE_DEFAULTS['seo-optimization'].color,
		type: 'seo-optimization',
		status: 'idle',
		error: null,
		schemaValidation: true,
		linkDensityTarget: 10,
		inputCity: null,
		inputState: null,
		inputCategory: null,
		inputPageCount: 0,
		inputHasBlueprint: false,
		inputHasProviders: false,
		inputHasEditorial: false,
		inputHasComparison: false,
		progress: {
			phase: 'preparing',
			currentPage: null,
			completedPages: 0,
			totalPages: 0,
			currentStep: null,
		},
		output: null,
		lastOptimizedAt: null,
	}),
});

// Register Design Prompt Generator node type
// Takes Site Planner output and generates Gemini image prompts
registry.set('design-prompt', {
	type: 'design-prompt',
	label: 'Design Prompt',
	icon: Wand2,
	color: NODE_DEFAULTS['design-prompt'].color,
	defaultWidth: NODE_DEFAULTS['design-prompt'].width,
	defaultHeight: NODE_DEFAULTS['design-prompt'].height,
	hasInputPort: true,
	hasOutputPort: true,
	createDefaultData: (
		id: string,
		x: number,
		y: number,
	): DesignPromptNodeData => ({
		id,
		x,
		y,
		width: NODE_DEFAULTS['design-prompt'].width,
		height: NODE_DEFAULTS['design-prompt'].height,
		title: 'Design Prompt',
		color: NODE_DEFAULTS['design-prompt'].color,
		type: 'design-prompt',
		status: 'idle',
		error: null,
		primaryColorOverride: null,
		inputCity: null,
		inputState: null,
		inputCategory: null,
		inputBrandName: null,
		inputTagline: null,
		inputProviderCount: 0,
		inputRegion: null,
		inputHasBlueprint: false,
		generatedPrompt: null,
		lastGeneratedAt: null,
	}),
});

// Register Image Source node type
// Allows selecting an image from the library to use as input source
registry.set('image-source', {
	type: 'image-source',
	label: 'Image Source',
	icon: ImagePlus,
	color: NODE_DEFAULTS['image-source'].color,
	defaultWidth: NODE_DEFAULTS['image-source'].width,
	defaultHeight: NODE_DEFAULTS['image-source'].height,
	hasInputPort: false,
	hasOutputPort: true,
	createDefaultData: (
		id: string,
		x: number,
		y: number,
	): ImageSourceNodeData => ({
		id,
		x,
		y,
		width: NODE_DEFAULTS['image-source'].width,
		height: NODE_DEFAULTS['image-source'].height,
		title: 'Image Source',
		color: NODE_DEFAULTS['image-source'].color,
		type: 'image-source',
		selectedImageId: null,
		selectedImageUrl: null,
		selectedImagePrompt: null,
		selectedImageAspectRatio: null,
	}),
});

// Register Brand Design node type
// Extracts design system from screenshots using Claude vision
registry.set('brand-design', {
	type: 'brand-design',
	label: 'Brand Design',
	icon: Paintbrush,
	color: NODE_DEFAULTS['brand-design'].color,
	defaultWidth: NODE_DEFAULTS['brand-design'].width,
	defaultHeight: NODE_DEFAULTS['brand-design'].height,
	hasInputPort: true,
	hasOutputPort: true,
	createDefaultData: (
		id: string,
		x: number,
		y: number,
	): BrandDesignNodeData => ({
		id,
		x,
		y,
		width: NODE_DEFAULTS['brand-design'].width,
		height: NODE_DEFAULTS['brand-design'].height,
		title: 'Brand Design',
		color: NODE_DEFAULTS['brand-design'].color,
		type: 'brand-design',
		status: 'idle',
		error: null,
		inputScreenshotUrl: null,
		progress: {
			phase: 'preparing',
			passesComplete: 0,
			totalPasses: 3,
		},
		output: null,
		lastExtractedAt: null,
	}),
});

// Register Data Viewer node type
// Displays structured JSON output from any upstream node
registry.set('data-viewer', {
	type: 'data-viewer',
	label: 'Data Viewer',
	icon: Code2,
	color: NODE_DEFAULTS['data-viewer'].color,
	defaultWidth: NODE_DEFAULTS['data-viewer'].width,
	defaultHeight: NODE_DEFAULTS['data-viewer'].height,
	hasInputPort: true,
	hasOutputPort: false,
	createDefaultData: (
		id: string,
		x: number,
		y: number,
	): DataViewerNodeData => ({
		id,
		x,
		y,
		width: NODE_DEFAULTS['data-viewer'].width,
		height: NODE_DEFAULTS['data-viewer'].height,
		title: 'Data Viewer',
		color: NODE_DEFAULTS['data-viewer'].color,
		type: 'data-viewer',
		displayValue: null,
		sourceNodeType: null,
		lastUpdated: null,
	}),
});

// Register Code Generation node type
// Final pipeline node: transforms all upstream outputs into deployable Next.js codebase
registry.set('code-generation', {
	type: 'code-generation',
	label: 'Code Generation',
	icon: Code2,
	color: NODE_DEFAULTS['code-generation'].color,
	defaultWidth: NODE_DEFAULTS['code-generation'].width,
	defaultHeight: NODE_DEFAULTS['code-generation'].height,
	hasInputPort: false, // Uses custom multi-input ports
	hasOutputPort: true,
	createDefaultData: (
		id: string,
		x: number,
		y: number,
	): CodeGenerationNodeData => ({
		id,
		x,
		y,
		width: NODE_DEFAULTS['code-generation'].width,
		height: NODE_DEFAULTS['code-generation'].height,
		title: 'Code Generation',
		color: NODE_DEFAULTS['code-generation'].color,
		type: 'code-generation',
		status: 'idle',
		error: null,
		inputHasSitePlan: false,
		inputHasSEO: false,
		inputHasBrandDesign: false,
		inputHasEditorial: false,
		inputHasProfiles: false,
		inputHasComparison: false,
		inputCity: null,
		inputState: null,
		inputCategory: null,
		inputPageCount: 0,
		outputFormat: 'files',
		includeReadme: true,
		useLLM: false,
		generateImages: false,
		progress: {
			phase: 'preparing',
			currentFile: null,
			filesGenerated: 0,
			totalFiles: 0,
			bytesGenerated: 0,
		},
		output: null,
		lastGeneratedAt: null,
	}),
});

// Register Screenshot Replicator node type
// Analyzes a screenshot and replicates it as React/Tailwind code
registry.set('screenshot-replicator', {
	type: 'screenshot-replicator',
	label: 'Screenshot Replicator',
	icon: Copy,
	color: NODE_DEFAULTS['screenshot-replicator'].color,
	defaultWidth: NODE_DEFAULTS['screenshot-replicator'].width,
	defaultHeight: NODE_DEFAULTS['screenshot-replicator'].height,
	hasInputPort: true,
	hasOutputPort: true,
	createDefaultData: (
		id: string,
		x: number,
		y: number,
	): ScreenshotReplicatorNodeData => ({
		id,
		x,
		y,
		width: NODE_DEFAULTS['screenshot-replicator'].width,
		height: NODE_DEFAULTS['screenshot-replicator'].height,
		title: 'Screenshot Replicator',
		color: NODE_DEFAULTS['screenshot-replicator'].color,
		type: 'screenshot-replicator',
		status: 'idle',
		error: null,
		inputScreenshotUrl: null,
		analysis: null,
		progress: {
			phase: 'idle',
			passesComplete: 0,
			totalPasses: 6,
			assetsGenerated: 0,
			totalAssets: 0,
			sectionsGenerated: 0,
			totalSections: 0,
			filesGenerated: 0,
			bytesGenerated: 0,
		},
		output: null,
		lastAnalyzedAt: null,
		lastGeneratedAt: null,
	}),
});

// Get a node type config
export function getNodeTypeConfig(type: NodeType): NodeTypeConfig | undefined {
	return registry.get(type);
}

// Get all registered node types
export function getAllNodeTypes(): NodeTypeConfig[] {
	return Array.from(registry.values());
}

// Register a new node type (for extensibility)
export function registerNodeType(config: NodeTypeConfig): void {
	registry.set(config.type, config);
}

// Create a new node of a given type
export function createNode(
	type: NodeType,
	x: number,
	y: number,
	id?: string,
): NodeData | undefined {
	const config = registry.get(type);
	if (!config) return undefined;

	return config.createDefaultData(id || Date.now().toString(), x, y);
}

// Check if a node type is registered
export function isNodeTypeRegistered(type: string): type is NodeType {
	return registry.has(type as NodeType);
}

export default registry;
