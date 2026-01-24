import { useCallback } from 'react';
import {
	NodeData,
	LLMNodeData,
	CategoryAnalysisResult,
	ProviderData,
	LocationData,
	isLLMNode,
	isLocationNode,
	isResearchNode,
	isProviderNode,
	isProviderEnrichmentNode,
	isCategorySelectorNode,
	isWebDesignerNode,
	isImageGenNode,
	isImageSourceNode,
	isLocalKnowledgeNode,
	isSitePlannerNode,
	isEditorialContentGeneratorNode,
	isComparisonDataNode,
	isDesignPromptNode,
	isSEOOptimizationNode,
	isBrandDesignNode,
	isProviderProfileGeneratorNode,
	DemographicsData,
} from '@/types/nodes';
import { EnrichedProvider } from '@/types/enrichedProvider';
import { LocalKnowledgeOutput } from '@/types/localKnowledge';
import { SitePlannerOutput } from '@/types/sitePlanner';
import { GeneratedEditorialContent } from '@/types/editorialContent';
import { GeneratedComparisonData } from '@/types/comparisonPage';
import { SEOOptimizedPackage } from '@/types/seoPackage';
import { BrandDesignOutput } from '@/types/brandDesign';
import { GeneratedProviderProfile } from '@/types/generatedProfile';
import { Connection } from '@/types/connections';
import { callLLM } from '@/api/llm';
import { getLeadEconomics } from '@/api/serp/tiers';

interface UseChainExecutionProps {
	nodes: NodeData[];
	setNodes: React.Dispatch<React.SetStateAction<NodeData[]>>;
	connections: Connection[];
}

// Location data for research node input
interface LocationInputData {
	city: string;
	state: string | null;
	lat?: number;
	lng?: number;
	demographics?: {
		population: number | null;
		medianHouseholdIncome: number | null;
		homeownershipRate: number | null;
		medianHomeValue: number | null;
	};
}

// Category Selector node input data (from Research node)
interface CategorySelectorInputData {
	city: string;
	state: string | null;
	categories: CategoryAnalysisResult[];
}

// Provider discovery node input data
interface ProviderInputData {
	category?: string;
	city: string;
	state: string | null;
	serpQuality?: 'Weak' | 'Medium' | 'Strong';
	leadValue?: string;
	verdict?: 'strong' | 'maybe' | 'skip';
}

// Web Designer node input data
interface WebDesignerInputData {
	city: string;
	state: string | null;
	category: string | null;
	serpScore?: number;
	serpQuality?: 'Weak' | 'Medium' | 'Strong';
	urgency?: 'extreme' | 'high' | 'medium' | 'low';
	competition?: 'low' | 'moderate' | 'high' | 'extreme';
}

// Provider Enrichment node input data
interface ProviderEnrichmentInputData {
	providers: ProviderData[];
	category?: string;
	city?: string;
	state?: string | null;
}

// Local Knowledge node input data
interface LocalKnowledgeInputData {
	city: string;
	county?: string;
	state: string | null;
	category?: string;
}

// Site Planner node input data (aggregated from multiple upstream nodes)
interface SitePlannerInputData {
	location: LocationData | null;
	serp: {
		category: string;
		serpQuality: 'Weak' | 'Medium' | 'Strong';
		serpScore: number;
	} | null;
	providers: EnrichedProvider[];
	localKnowledge: LocalKnowledgeOutput | null;
}

// Provider Profile Generator node input data (aggregated from multiple upstream nodes)
interface ProfileGeneratorInputData {
	blueprint: SitePlannerOutput | null;
	providers: EnrichedProvider[];
	localKnowledge: LocalKnowledgeOutput | null;
}

// Editorial Content Generator node input data (aggregated from multiple upstream nodes)
interface EditorialContentInputData {
	blueprint: SitePlannerOutput | null;
	localKnowledge: LocalKnowledgeOutput | null;
	serpData: CategoryAnalysisResult | null;
}

// Comparison Data node input data (aggregated from multiple upstream nodes)
interface ComparisonDataInputData {
	blueprint: SitePlannerOutput | null;
	enrichedProviders: EnrichedProvider[];
	localKnowledge: LocalKnowledgeOutput | null;
}

// SEO Optimization node input data (aggregated from multiple upstream nodes)
// Note: enrichedProviders are accessed via blueprint.providers (pass-through from site planner)
interface SEOOptimizationInputData {
	blueprint: SitePlannerOutput | null;
	editorialContent: GeneratedEditorialContent | null;
	comparisonData: GeneratedComparisonData | null;
}

// Data Viewer node input data (structured data from any node with output)
interface StructuredDataInput {
	data: unknown;
	sourceNodeType: string;
	sourceNodeTitle: string;
}

interface UseChainExecutionReturn {
	executeLLMNode: (nodeId: string) => Promise<string | undefined>;
	executeChain: (startNodeId: string) => Promise<void>;
	getIncomingData: (nodeId: string) => string | null;
	getIncomingLocationData: (nodeId: string) => LocationInputData | null;
	getIncomingCategorySelectorData: (
		nodeId: string,
	) => CategorySelectorInputData | null;
	getIncomingProviderData: (nodeId: string) => ProviderInputData | null;
	getIncomingProviderEnrichmentData: (
		nodeId: string,
	) => ProviderEnrichmentInputData | null;
	getIncomingWebDesignerData: (nodeId: string) => WebDesignerInputData | null;
	getIncomingLocalKnowledgeData: (
		nodeId: string,
	) => LocalKnowledgeInputData | null;
	getIncomingSitePlannerData: (nodeId: string) => SitePlannerInputData | null;
	getIncomingProfileGeneratorData: (
		nodeId: string,
	) => ProfileGeneratorInputData | null;
	getIncomingEditorialContentData: (
		nodeId: string,
	) => EditorialContentInputData | null;
	getIncomingComparisonDataData: (
		nodeId: string,
	) => ComparisonDataInputData | null;
	getIncomingSEOOptimizationData: (
		nodeId: string,
	) => SEOOptimizationInputData | null;
	getIncomingDesignPromptData: (
		nodeId: string,
	) => SitePlannerOutput | null;
	getIncomingBrandDesignData: (
		nodeId: string,
	) => { screenshotUrl: string } | null;
	getIncomingStructuredData: (
		nodeId: string,
	) => StructuredDataInput | null;
	getDownstreamNodes: (nodeId: string) => string[];
	getUpstreamNodes: (nodeId: string) => string[];
}

/**
 * Hook for managing chain execution - propagating LLM responses through connected nodes
 */
export function useChainExecution({
	nodes,
	setNodes,
	connections,
}: UseChainExecutionProps): UseChainExecutionReturn {
	// Get all downstream node IDs (nodes that this node outputs to)
	const getDownstreamNodes = useCallback(
		(nodeId: string): string[] => {
			return connections.filter((c) => c.fromId === nodeId).map((c) => c.toId);
		},
		[connections],
	);

	// Get all upstream node IDs (nodes that feed into this node)
	const getUpstreamNodes = useCallback(
		(nodeId: string): string[] => {
			return connections.filter((c) => c.toId === nodeId).map((c) => c.fromId);
		},
		[connections],
	);

	// Get the incoming data for a node (response from upstream nodes)
	const getIncomingData = useCallback(
		(nodeId: string): string | null => {
			const upstreamIds = getUpstreamNodes(nodeId);
			const upstreamNodes = nodes.filter((n) => upstreamIds.includes(n.id));

			// Collect responses from all upstream nodes
			const responses = upstreamNodes
				.map((n) => {
					if (isLLMNode(n) && n.response) {
						return n.response;
					}
					if (isLocationNode(n) && n.selectedLocation) {
						const { name, state, country } = n.selectedLocation;
						const parts = [name];
						if (state) parts.push(state);
						if (country) parts.push(country);
						return parts.join(', ');
					}
					if (isResearchNode(n) && n.categoryResults.length > 0) {
						// Format research results as markdown table
						const city = n.inputCity || 'Unknown';
						const state = n.inputState || '';
						let output = `# QUICK SCAN: ${city}${state ? `, ${state}` : ''}\n\n`;
						output += `| Category | SERP Quality | Competition | Lead Value | Urgency | Verdict |\n`;
						output += `|----------|--------------|-------------|------------|---------|--------|\n`;

						for (const result of n.categoryResults) {
							const verdictEmoji =
								result.verdict === 'strong'
									? '✅'
									: result.verdict === 'maybe'
										? '⚠️'
										: '❌';
							output += `| ${result.category} | ${result.serpQuality} (${result.serpScore}/10) | ${result.competition} | ${result.leadValue} | ${result.urgency} | ${verdictEmoji} |\n`;
						}

						if (n.topOpportunities.length > 0) {
							output += `\n## Top ${n.topOpportunities.length} Opportunities\n\n`;
							n.topOpportunities.forEach((opp, i) => {
								output += `### #${i + 1}: ${opp.category}\n`;
								output += `- ${opp.reasoning}\n`;
								output += `- Lead Value: ${opp.leadValue}\n\n`;
							});
						}

						if (n.skipList.length > 0) {
							output += `\n## Skip List\n\n`;
							n.skipList.forEach(({ category, reason }) => {
								output += `- **${category}**: ${reason}\n`;
							});
						}

						return output;
					}
					// WebDesignerNode - output the generated prompt
					if (isWebDesignerNode(n) && n.generatedPrompt) {
						return n.generatedPrompt;
					}
					// ImageGenNode - output the generated image as data URL
					if (isImageGenNode(n) && n.generatedImage) {
						return n.generatedImage;
					}
					// DesignPromptNode - output the generated design prompt
					if (isDesignPromptNode(n) && n.generatedPrompt) {
						return n.generatedPrompt;
					}
					// ImageSourceNode - output the selected image URL
					if (isImageSourceNode(n) && n.selectedImageUrl) {
						return n.selectedImageUrl;
					}
					return null;
				})
				.filter(Boolean) as string[];

			return responses.length > 0 ? responses.join('\n\n---\n\n') : null;
		},
		[nodes, getUpstreamNodes],
	);

	// Get structured location data for research node input
	const getIncomingLocationData = useCallback(
		(nodeId: string): LocationInputData | null => {
			const upstreamIds = getUpstreamNodes(nodeId);
			const upstreamNodes = nodes.filter((n) => upstreamIds.includes(n.id));

			// Find location node in upstream
			for (const n of upstreamNodes) {
				if (isLocationNode(n) && n.selectedLocation) {
					const loc = n.selectedLocation;
					return {
						city: loc.name,
						state: loc.state || null,
						lat: loc.lat,
						lng: loc.lng,
						demographics: loc.demographics
							? {
									population: loc.demographics.population,
									medianHouseholdIncome: loc.demographics.medianHouseholdIncome,
									homeownershipRate: loc.demographics.homeownershipRate,
									medianHomeValue: loc.demographics.medianHomeValue,
								}
							: undefined,
					};
				}
			}

			return null;
		},
		[nodes, getUpstreamNodes],
	);

	// Get structured data for category selector node input (from Research node)
	const getIncomingCategorySelectorData = useCallback(
		(nodeId: string): CategorySelectorInputData | null => {
			const upstreamIds = getUpstreamNodes(nodeId);
			const upstreamNodes = nodes.filter((n) => upstreamIds.includes(n.id));

			// Find research node in upstream
			for (const n of upstreamNodes) {
				if (isResearchNode(n) && n.inputCity && n.categoryResults.length > 0) {
					return {
						city: n.inputCity,
						state: n.inputState || null,
						categories: n.categoryResults,
					};
				}
			}

			return null;
		},
		[nodes, getUpstreamNodes],
	);

	// Get structured data for provider discovery node input
	// Can come from: CategorySelectorNode (port-specific), Research node, or Location node
	const getIncomingProviderData = useCallback(
		(nodeId: string): ProviderInputData | null => {
			// Find the connection TO this node to check for port-specific routing
			const incomingConnection = connections.find((c) => c.toId === nodeId);
			if (!incomingConnection) return null;

			const upstreamNode = nodes.find(
				(n) => n.id === incomingConnection.fromId,
			);
			if (!upstreamNode) return null;

			// Check if upstream is a CategorySelector with a specific port
			if (isCategorySelectorNode(upstreamNode) && incomingConnection.fromPort) {
				const portId = incomingConnection.fromPort;
				const category = upstreamNode.categories.find((c) => c.id === portId);

				if (category && category.visible && upstreamNode.inputCity) {
					return {
						category: category.category,
						city: upstreamNode.inputCity,
						state: upstreamNode.inputState || null,
						serpQuality: category.serpQuality,
						leadValue: category.leadValue,
						verdict: category.verdict,
					};
				}
			}

			// Check for research node (has category from selected opportunity)
			if (isResearchNode(upstreamNode) && upstreamNode.inputCity) {
				// If research node has top opportunities, use the first one's category
				const topOpp = upstreamNode.topOpportunities[0];
				return {
					category: topOpp?.category,
					city: upstreamNode.inputCity,
					state: upstreamNode.inputState || null,
					serpQuality: topOpp?.serpQuality,
					leadValue: topOpp?.leadValue,
					verdict: topOpp?.verdict,
				};
			}

			// Fall back to location node
			if (isLocationNode(upstreamNode) && upstreamNode.selectedLocation) {
				return {
					city: upstreamNode.selectedLocation.name,
					state: upstreamNode.selectedLocation.state || null,
				};
			}

			return null;
		},
		[nodes, connections],
	);

	// Get structured data for Provider Enrichment node input
	// Comes from Provider Discovery Node - passes through only SELECTED providers
	const getIncomingProviderEnrichmentData = useCallback(
		(nodeId: string): ProviderEnrichmentInputData | null => {
			// Find the connection TO this node
			const incomingConnection = connections.find((c) => c.toId === nodeId);
			if (!incomingConnection) return null;

			const upstreamNode = nodes.find(
				(n) => n.id === incomingConnection.fromId,
			);
			if (!upstreamNode) return null;

			// Check if upstream is a Provider Discovery node with providers
			if (isProviderNode(upstreamNode) && upstreamNode.providers.length > 0) {
				// Filter to only selected providers (if none selected, return empty array)
				const selectedIds = upstreamNode.selectedProviderIds || [];
				const selectedProviders = upstreamNode.providers.filter((p) =>
					selectedIds.includes(p.id),
				);

				return {
					providers: selectedProviders,
					category: upstreamNode.inputCategory || undefined,
					city: upstreamNode.inputCity || undefined,
					state: upstreamNode.inputState,
				};
			}

			return null;
		},
		[nodes, connections],
	);

	// Get structured data for Web Designer node input
	// Can come from: CategorySelectorNode (port-specific), Research node, or Location node
	const getIncomingWebDesignerData = useCallback(
		(nodeId: string): WebDesignerInputData | null => {
			// Find the connection TO this node to check for port-specific routing
			const incomingConnection = connections.find((c) => c.toId === nodeId);
			if (!incomingConnection) return null;

			const upstreamNode = nodes.find(
				(n) => n.id === incomingConnection.fromId,
			);
			if (!upstreamNode) return null;

			// Check if upstream is a CategorySelector with a specific port
			if (isCategorySelectorNode(upstreamNode) && incomingConnection.fromPort) {
				const portId = incomingConnection.fromPort;
				const category = upstreamNode.categories.find((c) => c.id === portId);

				if (category && category.visible && upstreamNode.inputCity) {
					// Get lead economics for urgency/competition
					const economics = getLeadEconomics(category.category);

					return {
						city: upstreamNode.inputCity,
						state: upstreamNode.inputState || null,
						category: category.category,
						serpScore: category.serpScore,
						serpQuality: category.serpQuality,
						urgency: economics?.urgency,
						competition: economics?.competitionLevel,
					};
				}
			}

			// Check for research node (has category from top opportunity)
			if (isResearchNode(upstreamNode) && upstreamNode.inputCity) {
				const topOpp = upstreamNode.topOpportunities[0];
				const economics = topOpp ? getLeadEconomics(topOpp.category) : null;

				return {
					city: upstreamNode.inputCity,
					state: upstreamNode.inputState || null,
					category: topOpp?.category || null,
					serpScore: topOpp?.serpScore,
					serpQuality: topOpp?.serpQuality,
					urgency: economics?.urgency,
					competition: economics?.competitionLevel,
				};
			}

			// Fall back to location node (no category)
			if (isLocationNode(upstreamNode) && upstreamNode.selectedLocation) {
				return {
					city: upstreamNode.selectedLocation.name,
					state: upstreamNode.selectedLocation.state || null,
					category: null,
				};
			}

			return null;
		},
		[nodes, connections],
	);

	// Get structured data for Local Knowledge node input
	// Can come from: CategorySelectorNode (port-specific), ProviderDiscoveryNode, or Location node
	const getIncomingLocalKnowledgeData = useCallback(
		(nodeId: string): LocalKnowledgeInputData | null => {
			// Find the connection TO this node to check for port-specific routing
			const incomingConnection = connections.find((c) => c.toId === nodeId);
			if (!incomingConnection) return null;

			const upstreamNode = nodes.find(
				(n) => n.id === incomingConnection.fromId,
			);
			if (!upstreamNode) return null;

			// Check if upstream is a CategorySelector with a specific port
			if (isCategorySelectorNode(upstreamNode) && incomingConnection.fromPort) {
				const portId = incomingConnection.fromPort;
				const category = upstreamNode.categories.find((c) => c.id === portId);

				if (category && category.visible && upstreamNode.inputCity) {
					return {
						city: upstreamNode.inputCity,
						state: upstreamNode.inputState || null,
						category: category.category,
					};
				}
			}

			// Check for Provider Discovery node (has category and location)
			if (isProviderNode(upstreamNode) && upstreamNode.inputCity) {
				return {
					city: upstreamNode.inputCity,
					state: upstreamNode.inputState || null,
					category:
						upstreamNode.inputCategory ||
						upstreamNode.manualCategory ||
						undefined,
				};
			}

			// Check for research node (has category from top opportunity)
			if (isResearchNode(upstreamNode) && upstreamNode.inputCity) {
				const topOpp = upstreamNode.topOpportunities[0];
				return {
					city: upstreamNode.inputCity,
					state: upstreamNode.inputState || null,
					category: topOpp?.category,
				};
			}

			// Fall back to location node (no category - user must enter manually)
			if (isLocationNode(upstreamNode) && upstreamNode.selectedLocation) {
				return {
					city: upstreamNode.selectedLocation.name,
					county: upstreamNode.selectedLocation.county,
					state: upstreamNode.selectedLocation.state || null,
				};
			}

			return null;
		},
		[nodes, connections],
	);

	// Get aggregated data for Site Planner node input
	// Uses 2 input ports:
	// - local-knowledge: LocalKnowledgeNode (provides location + category + content hooks) - REQUIRED
	// - providers: ProviderEnrichmentNode (optional competitor data)
	const getIncomingSitePlannerData = useCallback(
		(nodeId: string): SitePlannerInputData | null => {
			// Get all connections TO this node
			const incomingConnections = connections.filter((c) => c.toId === nodeId);

			const result: SitePlannerInputData = {
				location: null,
				serp: null,
				providers: [],
				localKnowledge: null,
			};

			for (const conn of incomingConnections) {
				const upstreamNode = nodes.find((n) => n.id === conn.fromId);
				if (!upstreamNode) continue;

				// Determine which input port this connection is for
				const targetPort = conn.toPort;

				// Local Knowledge port - provides location, category, and content hooks
				if (targetPort === 'local-knowledge' || !targetPort) {
					if (isLocalKnowledgeNode(upstreamNode) && upstreamNode.output) {
						const lkOutput = upstreamNode.output as LocalKnowledgeOutput;
						result.localKnowledge = lkOutput;

						// Extract location from Local Knowledge meta
						if (lkOutput.meta) {
							result.location = {
								name: lkOutput.meta.city,
								state: lkOutput.meta.state,
								country: 'US',
								lat: 0,
								lng: 0,
							};

							// Extract category from Local Knowledge meta
							if (lkOutput.meta.category) {
								result.serp = {
									category: lkOutput.meta.category,
									serpQuality: 'Medium', // Default since LK doesn't have SERP score
									serpScore: 5,
								};
							}
						}
					}
				}

				// Providers port - optional enriched competitor data
				if (targetPort === 'providers' || !targetPort) {
					if (
						isProviderEnrichmentNode(upstreamNode) &&
						upstreamNode.enrichedProviders &&
						upstreamNode.enrichedProviders.length > 0
					) {
						result.providers = upstreamNode.enrichedProviders as EnrichedProvider[];
					}
				}
			}

			// Return null if we don't have Local Knowledge (the required input)
			if (!result.localKnowledge) {
				return null;
			}

			return result;
		},
		[nodes, connections]
	);

	// Get aggregated data for Provider Profile Generator node input
	// Uses 1 input port:
	// - blueprint: SitePlannerNode output - REQUIRED (includes localKnowledge and providers)
	const getIncomingProfileGeneratorData = useCallback(
		(nodeId: string): ProfileGeneratorInputData | null => {
			// Get all connections TO this node
			const incomingConnections = connections.filter((c) => c.toId === nodeId);

			const result: ProfileGeneratorInputData = {
				blueprint: null,
				providers: [],
				localKnowledge: null,
			};

			for (const conn of incomingConnections) {
				const upstreamNode = nodes.find((n) => n.id === conn.fromId);
				if (!upstreamNode) continue;

				// Blueprint port - comes from Site Planner node
				if (isSitePlannerNode(upstreamNode) && upstreamNode.output) {
					result.blueprint = upstreamNode.output as SitePlannerOutput;
				}
			}

			// Extract localKnowledge and providers from blueprint (passed through from Site Planner)
			if (result.blueprint) {
				if (result.blueprint.localKnowledge) {
					result.localKnowledge = result.blueprint.localKnowledge;
				}
				if (result.blueprint.providers && result.blueprint.providers.length > 0) {
					result.providers = result.blueprint.providers;
				}
			}

			// Return null if we don't have all required inputs
			if (!result.blueprint || result.providers.length === 0 || !result.localKnowledge) {
				return null;
			}

			return result;
		},
		[nodes, connections]
	);

	// Get aggregated data for Editorial Content Generator node input
	// Uses 2 input ports:
	// - blueprint: SitePlannerNode output - REQUIRED (includes localKnowledge)
	// - serp: CategorySelectorNode - OPTIONAL (for competitor content gap analysis)
	const getIncomingEditorialContentData = useCallback(
		(nodeId: string): EditorialContentInputData | null => {
			// Get all connections TO this node
			const incomingConnections = connections.filter((c) => c.toId === nodeId);

			const result: EditorialContentInputData = {
				blueprint: null,
				localKnowledge: null,
				serpData: null,
			};

			for (const conn of incomingConnections) {
				const upstreamNode = nodes.find((n) => n.id === conn.fromId);
				if (!upstreamNode) continue;

				// Determine which input port this connection is for
				const targetPort = conn.toPort;

				// Blueprint port - comes from Site Planner node
				if (targetPort === 'blueprint' || !targetPort) {
					if (isSitePlannerNode(upstreamNode) && upstreamNode.output) {
						result.blueprint = upstreamNode.output as SitePlannerOutput;
					}
				}

				// SERP port - optional, comes from CategorySelector node
				if (targetPort === 'serp') {
					if (isCategorySelectorNode(upstreamNode)) {
						// Get the category from the connection's fromPort
						const category = upstreamNode.categories.find(
							(c) => c.id === conn.fromPort
						);
						if (category && category.visible) {
							result.serpData = {
								category: category.category,
								tier: 'tier1',
								serpQuality: category.serpQuality,
								serpScore: category.serpScore,
								competition: 'Medium',
								leadValue: category.leadValue,
								urgency: 'Medium',
								verdict: category.verdict,
								reasoning: '',
								fromCache: false,
							};
						}
					}
				}
			}

			// Extract localKnowledge from blueprint (passed through from Site Planner)
			if (result.blueprint?.localKnowledge) {
				result.localKnowledge = result.blueprint.localKnowledge;
			}

			// Return null if we don't have the required inputs
			if (!result.blueprint || !result.localKnowledge) {
				return null;
			}

			return result;
		},
		[nodes, connections]
	);

	// Get incoming data for Comparison Data node (from Site Planner only - providers and localKnowledge are passed through)
	const getIncomingComparisonDataData = useCallback(
		(nodeId: string): ComparisonDataInputData | null => {
			// Get all connections TO this node
			const incomingConnections = connections.filter((c) => c.toId === nodeId);

			let blueprint: SitePlannerOutput | null = null;

			for (const conn of incomingConnections) {
				const upstreamNode = nodes.find((n) => n.id === conn.fromId);
				if (!upstreamNode) continue;

				// Determine which input port this connection is for
				const targetPort = conn.toPort;

				// Blueprint port - comes from Site Planner node
				if (targetPort === 'blueprint') {
					if (isSitePlannerNode(upstreamNode) && upstreamNode.output) {
						blueprint = upstreamNode.output as SitePlannerOutput;
					}
				}
			}

			// Return null if we don't have the blueprint
			if (!blueprint) {
				return null;
			}

			// Extract enrichedProviders and localKnowledge from the blueprint's pass-through fields
			return {
				blueprint,
				enrichedProviders: blueprint.providers || [],
				localKnowledge: blueprint.localKnowledge || null,
			};
		},
		[nodes, connections]
	);

	// Get incoming data for SEO Optimization node
	// Uses 3 input ports:
	// - blueprint (required): SitePlannerNode output (includes enriched providers via blueprint.providers)
	// - editorial (optional): EditorialContentGeneratorNode output
	// - comparison (optional): ComparisonDataNode output
	const getIncomingSEOOptimizationData = useCallback(
		(nodeId: string): SEOOptimizationInputData | null => {
			// Get all connections TO this node
			const incomingConnections = connections.filter((c) => c.toId === nodeId);

			const result: SEOOptimizationInputData = {
				blueprint: null,
				editorialContent: null,
				comparisonData: null,
			};

			for (const conn of incomingConnections) {
				const upstreamNode = nodes.find((n) => n.id === conn.fromId);
				if (!upstreamNode) continue;

				// Determine which input port this connection is for
				const targetPort = conn.toPort;

				// Blueprint port - comes from Site Planner node (includes enriched providers)
				if (targetPort === 'blueprint') {
					if (isSitePlannerNode(upstreamNode) && upstreamNode.output) {
						result.blueprint = upstreamNode.output as SitePlannerOutput;
					}
				}

				// Editorial port - comes from Editorial Content Generator node
				if (targetPort === 'editorial') {
					if (isEditorialContentGeneratorNode(upstreamNode) && upstreamNode.output) {
						result.editorialContent = upstreamNode.output as GeneratedEditorialContent;
					}
				}

				// Comparison port - comes from Comparison Data node
				if (targetPort === 'comparison') {
					if (isComparisonDataNode(upstreamNode) && upstreamNode.output) {
						result.comparisonData = upstreamNode.output as GeneratedComparisonData;
					}
				}
			}

			// Return null if we don't have the required blueprint (which includes providers)
			if (!result.blueprint || !result.blueprint.providers?.length) {
				return null;
			}

			return result;
		},
		[nodes, connections]
	);

	// Get incoming data for Design Prompt Generator node
	// Takes SitePlannerOutput from upstream Site Planner node
	const getIncomingDesignPromptData = useCallback(
		(nodeId: string): SitePlannerOutput | null => {
			// Find the connection TO this node
			const incomingConnection = connections.find((c) => c.toId === nodeId);
			if (!incomingConnection) return null;

			const upstreamNode = nodes.find(
				(n) => n.id === incomingConnection.fromId,
			);
			if (!upstreamNode) return null;

			// Check if upstream is a Site Planner node with output
			if (isSitePlannerNode(upstreamNode) && upstreamNode.output) {
				return upstreamNode.output as SitePlannerOutput;
			}

			return null;
		},
		[nodes, connections]
	);

	// Get incoming data for Brand Design node
	// Takes screenshot URL from upstream ImageGenNode or ImageSourceNode
	const getIncomingBrandDesignData = useCallback(
		(nodeId: string): { screenshotUrl: string } | null => {
			// Find the connection TO this node
			const incomingConnection = connections.find((c) => c.toId === nodeId);
			if (!incomingConnection) return null;

			const upstreamNode = nodes.find(
				(n) => n.id === incomingConnection.fromId,
			);
			if (!upstreamNode) return null;

			// Check if upstream is an Image Gen node with generated image
			if (isImageGenNode(upstreamNode)) {
				// Prefer public URL, fallback to base64
				const screenshotUrl = upstreamNode.publicUrl || upstreamNode.generatedImage;
				if (screenshotUrl) {
					return { screenshotUrl };
				}
			}

			// Check if upstream is an Image Source node with selected image
			if (upstreamNode.type === 'image-source' && 'selectedImageUrl' in upstreamNode) {
				const screenshotUrl = upstreamNode.selectedImageUrl as string | null;
				if (screenshotUrl) {
					return { screenshotUrl };
				}
			}

			return null;
		},
		[nodes, connections]
	);

	// Get incoming structured data for Data Viewer node
	// This extracts the `output` field from any upstream node that has one
	const getIncomingStructuredData = useCallback(
		(nodeId: string): StructuredDataInput | null => {
			// Find the connection TO this node
			const incomingConnection = connections.find((c) => c.toId === nodeId);
			if (!incomingConnection) return null;

			const upstreamNode = nodes.find(
				(n) => n.id === incomingConnection.fromId,
			);
			if (!upstreamNode) return null;

			// Check if the upstream node has an output field with data
			// We check for various node types that have structured output
			const nodeWithOutput = upstreamNode as NodeData & { output?: unknown };
			
			if (nodeWithOutput.output !== undefined && nodeWithOutput.output !== null) {
				return {
					data: nodeWithOutput.output,
					sourceNodeType: upstreamNode.type,
					sourceNodeTitle: upstreamNode.title,
				};
			}

			// Also check for LLM response
			if (isLLMNode(upstreamNode) && upstreamNode.response) {
				return {
					data: upstreamNode.response,
					sourceNodeType: upstreamNode.type,
					sourceNodeTitle: upstreamNode.title,
				};
			}

			// Check for enrichedProviders from ProviderEnrichmentNode
			if (isProviderEnrichmentNode(upstreamNode) && upstreamNode.enrichedProviders && upstreamNode.enrichedProviders.length > 0) {
				return {
					data: upstreamNode.enrichedProviders,
					sourceNodeType: upstreamNode.type,
					sourceNodeTitle: upstreamNode.title,
				};
			}

			return null;
		},
		[nodes, connections]
	);

	// Get incoming data for Code Generation node
	// Uses 4 input ports (editorial/comparison come through SEO package's sourceData):
	// - sitePlan (required): SitePlannerNode output
	// - seoPackage (required): SEOOptimizationNode output (includes editorial/comparison in sourceData)
	// - brandDesign (required): BrandDesignNode output
	// - profiles (optional): ProviderProfileGeneratorNode output
	const getIncomingCodeGenerationData = useCallback(
		(nodeId: string): {
			sitePlan: SitePlannerOutput | null;
			seoPackage: SEOOptimizedPackage | null;
			brandDesign: BrandDesignOutput | null;
			providerProfiles: GeneratedProviderProfile[];
		} | null => {
			const incomingConnections = connections.filter((c) => c.toId === nodeId);

			const result: {
				sitePlan: SitePlannerOutput | null;
				seoPackage: SEOOptimizedPackage | null;
				brandDesign: BrandDesignOutput | null;
				providerProfiles: GeneratedProviderProfile[];
			} = {
				sitePlan: null,
				seoPackage: null,
				brandDesign: null,
				providerProfiles: [],
			};

			for (const conn of incomingConnections) {
				const upstreamNode = nodes.find((n) => n.id === conn.fromId);
				if (!upstreamNode) continue;

				const targetPort = conn.toPort;

				// Site Plan port - comes from Site Planner node
				if (targetPort === 'sitePlan' && isSitePlannerNode(upstreamNode) && upstreamNode.output) {
					result.sitePlan = upstreamNode.output as SitePlannerOutput;
				}

				// SEO Package port - comes from SEO Optimization node
				// Note: editorial/comparison data are accessed via seoPackage.sourceData
				if (targetPort === 'seoPackage' && isSEOOptimizationNode(upstreamNode) && upstreamNode.output) {
					result.seoPackage = upstreamNode.output as SEOOptimizedPackage;
				}

				// Brand Design port - comes from Brand Design node
				if (targetPort === 'brandDesign' && isBrandDesignNode(upstreamNode) && upstreamNode.output) {
					result.brandDesign = upstreamNode.output as BrandDesignOutput;
				}

				// Profiles port - comes from Provider Profile Generator node
				if (targetPort === 'profiles' && isProviderProfileGeneratorNode(upstreamNode) && upstreamNode.output) {
					result.providerProfiles = upstreamNode.output as GeneratedProviderProfile[];
				}
			}

			// Return null if we don't have the required inputs
			if (!result.sitePlan || !result.seoPackage || !result.brandDesign) {
				return null;
			}

			return result;
		},
		[nodes, connections]
	);

	// Propagate data to downstream output nodes
	const propagateToOutputNodes = useCallback(
		(sourceNodeId: string, responseData: string) => {
			const downstreamIds = getDownstreamNodes(sourceNodeId);

			setNodes((prevNodes) =>
				prevNodes.map((node) => {
					if (downstreamIds.includes(node.id) && node.type === 'output') {
						return {
							...node,
							displayValue: responseData,
							lastUpdated: Date.now(),
						};
					}
					return node;
				}),
			);
		},
		[getDownstreamNodes, setNodes],
	);

	// Execute an LLM node
	const executeLLMNode = useCallback(
		async (nodeId: string): Promise<string | undefined> => {
			const node = nodes.find((n) => n.id === nodeId);
			if (!node || !isLLMNode(node)) return;

			const incomingData = getIncomingData(nodeId);

			// Set loading state
			setNodes((prevNodes) =>
				prevNodes.map((n) =>
					n.id === nodeId ? { ...n, status: 'loading', error: null } : n,
				),
			);

			try {
				const response = await callLLM(
					node.provider || 'claude-sonnet',
					node.text,
					node.provider,
					incomingData || '',
					node.useReasoning || false,
				);

				// Set success state and store response
				setNodes((prevNodes) =>
					prevNodes.map((n) =>
						n.id === nodeId
							? { ...n, status: 'success', response, error: null }
							: n,
					),
				);

				// Propagate to downstream output nodes
				propagateToOutputNodes(nodeId, response);

				return response;
			} catch (error) {
				// Set error state
				const errorMessage =
					error instanceof Error ? error.message : 'Unknown error';
				setNodes((prevNodes) =>
					prevNodes.map((n) =>
						n.id === nodeId
							? { ...n, status: 'error', error: errorMessage, response: null }
							: n,
					),
				);
				throw error;
			}
		},
		[nodes, setNodes, getIncomingData, propagateToOutputNodes],
	);

	// Execute a chain starting from a specific node
	const executeChain = useCallback(
		async (startNodeId: string) => {
			await executeLLMNode(startNodeId);
		},
		[executeLLMNode],
	);

	return {
		executeLLMNode,
		executeChain,
		getIncomingData,
		getIncomingLocationData,
		getIncomingCategorySelectorData,
		getIncomingProviderData,
		getIncomingProviderEnrichmentData,
		getIncomingWebDesignerData,
		getIncomingLocalKnowledgeData,
		getIncomingSitePlannerData,
		getIncomingProfileGeneratorData,
		getIncomingEditorialContentData,
		getIncomingComparisonDataData,
		getIncomingSEOOptimizationData,
		getIncomingDesignPromptData,
		getIncomingBrandDesignData,
		getIncomingStructuredData,
		getIncomingCodeGenerationData,
		getDownstreamNodes,
		getUpstreamNodes,
	};
}

export default useChainExecution;
