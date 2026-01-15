// Node type constants
export const NODE_TYPES = {
	LLM: 'llm',
	OUTPUT: 'output',
	LOCATION: 'location',
	RESEARCH: 'research',
	PROVIDERS: 'providers',
	CATEGORY_SELECTOR: 'category-selector',
	WEB_DESIGNER: 'web-designer',
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
	// Results
	providers: ProviderData[];
	// Progress
	progress: ProviderDiscoveryProgress;
	// Timestamps
	lastDiscoveryAt: number | null;
}

// Category item within the Category Selector Node
export interface CategoryItem {
	id: string;           // Unique ID for this slot (used as port ID)
	category: string;     // Category name from research
	serpQuality: 'Weak' | 'Medium' | 'Strong';
	serpScore: number;
	leadValue: string;
	verdict: 'strong' | 'maybe' | 'skip';
	visible: boolean;     // Controls port visibility
	order: number;        // For reordering
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

// Union type for all node types
export type NodeData = LLMNodeData | OutputNodeData | LocationNodeData | DeepResearchNodeData | ProviderDiscoveryNodeData | CategorySelectorNodeData | WebDesignerNodeData;

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

export function isProviderNode(node: NodeData): node is ProviderDiscoveryNodeData {
	return node.type === 'providers';
}

export function isCategorySelectorNode(node: NodeData): node is CategorySelectorNodeData {
	return node.type === 'category-selector';
}

export function isWebDesignerNode(node: NodeData): node is WebDesignerNodeData {
	return node.type === 'web-designer';
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
} as const;

// Port types
export type PortType = 'in' | 'out';

export interface HoveredPort {
	nodeId: string;
	type: PortType;
	portId?: string; // For multi-port nodes
}
