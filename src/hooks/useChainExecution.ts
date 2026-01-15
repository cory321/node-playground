import { useCallback } from 'react';
import { NodeData, LLMNodeData, isLLMNode, isLocationNode, isResearchNode, DemographicsData } from '@/types/nodes';
import { Connection } from '@/types/connections';
import { callLLM } from '@/api/llm';

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

interface UseChainExecutionReturn {
  executeLLMNode: (nodeId: string) => Promise<string | undefined>;
  executeChain: (startNodeId: string) => Promise<void>;
  getIncomingData: (nodeId: string) => string | null;
  getIncomingLocationData: (nodeId: string) => LocationInputData | null;
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
    getDownstreamNodes,
    getUpstreamNodes,
  };
}

export default useChainExecution;
