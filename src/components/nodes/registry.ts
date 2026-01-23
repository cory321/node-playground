import {
	Brain,
	Monitor,
	MapPin,
	Search,
	Users,
	Layers,
	Palette,
	Image as ImageIcon,
	Sparkles,
	BookOpen,
	FileText,
	UserCircle,
	Newspaper,
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
		aspectRatioMode: 'preset',
		aspectRatio: '1:1',
		customWidth: null,
		customHeight: null,
		generatedImage: null,
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
