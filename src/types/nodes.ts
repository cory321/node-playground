// Node type constants
export const NODE_TYPES = {
	LLM: 'llm',
	OUTPUT: 'output',
	LOCATION: 'location',
	RESEARCH: 'research',
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
	tier: 'tier1' | 'tier2' | 'tier3';
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

// Union type for all node types
export type NodeData = LLMNodeData | OutputNodeData | LocationNodeData | DeepResearchNodeData;

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
} as const;

// Port types
export type PortType = 'in' | 'out';

export interface HoveredPort {
	nodeId: string;
	type: PortType;
}
