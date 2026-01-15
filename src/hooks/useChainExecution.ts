import { useCallback } from 'react';
import { 
  NodeData, 
  LLMNodeData, 
  CategoryAnalysisResult,
  isLLMNode, 
  isLocationNode, 
  isResearchNode, 
  isProviderNode, 
  isCategorySelectorNode,
  isWebDesignerNode,
  DemographicsData,
} from '@/types/nodes';
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

interface UseChainExecutionReturn {
  executeLLMNode: (nodeId: string) => Promise<string | undefined>;
  executeChain: (startNodeId: string) => Promise<void>;
  getIncomingData: (nodeId: string) => string | null;
  getIncomingLocationData: (nodeId: string) => LocationInputData | null;
  getIncomingCategorySelectorData: (nodeId: string) => CategorySelectorInputData | null;
  getIncomingProviderData: (nodeId: string) => ProviderInputData | null;
  getIncomingWebDesignerData: (nodeId: string) => WebDesignerInputData | null;
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
    [connections]
  );

  // Get all upstream node IDs (nodes that feed into this node)
  const getUpstreamNodes = useCallback(
    (nodeId: string): string[] => {
      return connections.filter((c) => c.toId === nodeId).map((c) => c.fromId);
    },
    [connections]
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
              const verdictEmoji = result.verdict === 'strong' ? '✅' : result.verdict === 'maybe' ? '⚠️' : '❌';
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
          return null;
        })
        .filter(Boolean) as string[];

      return responses.length > 0 ? responses.join('\n\n---\n\n') : null;
    },
    [nodes, getUpstreamNodes]
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
    [nodes, getUpstreamNodes]
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
    [nodes, getUpstreamNodes]
  );

  // Get structured data for provider discovery node input
  // Can come from: CategorySelectorNode (port-specific), Research node, or Location node
  const getIncomingProviderData = useCallback(
    (nodeId: string): ProviderInputData | null => {
      // Find the connection TO this node to check for port-specific routing
      const incomingConnection = connections.find((c) => c.toId === nodeId);
      if (!incomingConnection) return null;

      const upstreamNode = nodes.find((n) => n.id === incomingConnection.fromId);
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
    [nodes, connections]
  );

  // Get structured data for Web Designer node input
  // Can come from: CategorySelectorNode (port-specific), Research node, or Location node
  const getIncomingWebDesignerData = useCallback(
    (nodeId: string): WebDesignerInputData | null => {
      // Find the connection TO this node to check for port-specific routing
      const incomingConnection = connections.find((c) => c.toId === nodeId);
      if (!incomingConnection) return null;

      const upstreamNode = nodes.find((n) => n.id === incomingConnection.fromId);
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
        })
      );
    },
    [getDownstreamNodes, setNodes]
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
          n.id === nodeId ? { ...n, status: 'loading', error: null } : n
        )
      );

      try {
        const response = await callLLM(
          node.provider || 'claude-sonnet',
          node.text,
          node.provider,
          incomingData || '',
          node.useReasoning || false
        );

        // Set success state and store response
        setNodes((prevNodes) =>
          prevNodes.map((n) =>
            n.id === nodeId
              ? { ...n, status: 'success', response, error: null }
              : n
          )
        );

        // Propagate to downstream output nodes
        propagateToOutputNodes(nodeId, response);

        return response;
      } catch (error) {
        // Set error state
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setNodes((prevNodes) =>
          prevNodes.map((n) =>
            n.id === nodeId
              ? { ...n, status: 'error', error: errorMessage, response: null }
              : n
          )
        );
        throw error;
      }
    },
    [nodes, setNodes, getIncomingData, propagateToOutputNodes]
  );

  // Execute a chain starting from a specific node
  const executeChain = useCallback(
    async (startNodeId: string) => {
      await executeLLMNode(startNodeId);
    },
    [executeLLMNode]
  );

  return {
    executeLLMNode,
    executeChain,
    getIncomingData,
    getIncomingLocationData,
    getIncomingCategorySelectorData,
    getIncomingProviderData,
    getIncomingWebDesignerData,
    getDownstreamNodes,
    getUpstreamNodes,
  };
}

export default useChainExecution;
