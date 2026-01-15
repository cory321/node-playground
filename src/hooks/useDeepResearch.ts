import { useCallback, useState, useRef } from 'react';
import {
  DeepResearchNodeData,
  CategoryAnalysisResult,
  TriageResultData,
  ResearchProgress,
} from '@/types/nodes';
import {
  fetchSerpData,
  runTriageSearch,
  hasSerpApiKey,
  getCategoriesToScan,
  getCategoryTier,
  DEFAULT_SCAN_CONFIG,
} from '@/api/serp';
import { analyzeSerpWithClaude, generateTriageAnalysis } from '@/api/serp/analyzer';
import { CityProfile } from '@/api/serp/tiers';

interface UseDeepResearchProps {
  nodeId: string;
  updateNode: (id: string, updates: Partial<DeepResearchNodeData>) => void;
}

interface UseDeepResearchReturn {
  runTriageScan: (city: string, state: string | null) => Promise<void>;
  runFullScan: (
    city: string,
    state: string | null,
    profile: CityProfile
  ) => Promise<void>;
  stopScan: () => void;
  isScanning: boolean;
  hasApiKey: boolean;
}

export function useDeepResearch({
  nodeId,
  updateNode,
}: UseDeepResearchProps): UseDeepResearchReturn {
  const [isScanning, setIsScanning] = useState(false);
  const abortRef = useRef(false);

  const hasApiKey = hasSerpApiKey();

  // Reset progress
  const resetProgress = useCallback(() => {
    updateNode(nodeId, {
      progress: {
        currentCategory: null,
        completedCount: 0,
        totalCount: 0,
        cacheHits: 0,
        searchesUsed: 0,
      },
      categoryResults: [],
      topOpportunities: [],
      skipList: [],
      triageResult: null,
      error: null,
    });
  }, [nodeId, updateNode]);

  // Update progress
  const updateProgress = useCallback(
    (progress: Partial<ResearchProgress>) => {
      updateNode(nodeId, {
        progress: {
          currentCategory: null,
          completedCount: 0,
          totalCount: 0,
          cacheHits: 0,
          searchesUsed: 0,
          ...progress,
        } as ResearchProgress,
      });
    },
    [nodeId, updateNode]
  );

  // Run quick triage scan (1 search)
  const runTriageScan = useCallback(
    async (city: string, state: string | null) => {
      if (isScanning || !hasApiKey) return;

      setIsScanning(true);
      abortRef.current = false;
      resetProgress();

      updateNode(nodeId, {
        status: 'loading',
        inputCity: city,
        inputState: state,
      });

      updateProgress({
        currentCategory: 'home services near me',
        totalCount: 1,
      });

      try {
        // Run triage search
        const serpResult = await runTriageSearch(city, state);

        if (abortRef.current) return;

        if (serpResult.error) {
          throw new Error(serpResult.error);
        }

        // Analyze with Claude
        const triageResult = await generateTriageAnalysis(
          city,
          state,
          serpResult.signals
        );

        if (abortRef.current) return;

        const triageData: TriageResultData = {
          overallSignal: triageResult.overallSignal,
          lsaPresent: triageResult.lsaPresent,
          aggregatorDominance: triageResult.aggregatorDominance,
          adDensity: triageResult.adDensity,
          recommendation: triageResult.recommendation,
          worthFullScan: triageResult.worthFullScan,
        };

        updateNode(nodeId, {
          status: 'success',
          triageResult: triageData,
          progress: {
            currentCategory: null,
            completedCount: 1,
            totalCount: 1,
            cacheHits: serpResult.fromCache ? 1 : 0,
            searchesUsed: serpResult.fromCache ? 0 : 1,
          },
          lastScanAt: Date.now(),
        });
      } catch (err) {
        if (!abortRef.current) {
          updateNode(nodeId, {
            status: 'error',
            error: err instanceof Error ? err.message : 'Unknown error',
          });
        }
      } finally {
        setIsScanning(false);
      }
    },
    [isScanning, hasApiKey, nodeId, updateNode, resetProgress, updateProgress]
  );

  // Run full tiered scan
  const runFullScan = useCallback(
    async (city: string, state: string | null, profile: CityProfile) => {
      if (isScanning || !hasApiKey) return;

      setIsScanning(true);
      abortRef.current = false;
      resetProgress();

      updateNode(nodeId, {
        status: 'loading',
        inputCity: city,
        inputState: state,
        cityTraits: profile.traits,
      });

      try {
        const { tier1, tier2, total } = getCategoriesToScan(
          profile,
          DEFAULT_SCAN_CONFIG
        );
        const allCategories = [...tier1, ...tier2];

        updateProgress({
          totalCount: total,
        });

        const results: CategoryAnalysisResult[] = [];
        let cacheHits = 0;
        let searchesUsed = 0;

        // Process each category
        for (let i = 0; i < allCategories.length; i++) {
          if (abortRef.current) break;

          const category = allCategories[i];
          const tier = getCategoryTier(category, profile);

          updateProgress({
            currentCategory: category,
            completedCount: i,
            totalCount: total,
            cacheHits,
            searchesUsed,
          });

          // Fetch SERP data
          const serpResult = await fetchSerpData(category, city, state);

          if (abortRef.current) break;

          if (serpResult.fromCache) {
            cacheHits++;
          } else {
            searchesUsed++;
          }

          if (serpResult.error) {
            console.warn(`Error fetching ${category}:`, serpResult.error);
            continue;
          }

          // Analyze with Claude
          const analysis = await analyzeSerpWithClaude(
            category,
            city,
            state,
            serpResult.signals,
            tier
          );

          if (abortRef.current) break;

          analysis.fromCache = serpResult.fromCache;
          results.push(analysis);

          // Update results in real-time (streaming)
          updateNode(nodeId, {
            categoryResults: [...results],
            progress: {
              currentCategory: category,
              completedCount: i + 1,
              totalCount: total,
              cacheHits,
              searchesUsed,
            },
          });

          // Small delay between searches to avoid rate limiting
          if (!serpResult.fromCache && i < allCategories.length - 1) {
            await new Promise((resolve) =>
              setTimeout(resolve, DEFAULT_SCAN_CONFIG.delayBetweenSearchesMs)
            );
          }
        }

        if (abortRef.current) return;

        // Calculate top opportunities and skip list
        const strongOpps = results
          .filter((r) => r.verdict === 'strong')
          .sort((a, b) => b.serpScore - a.serpScore)
          .slice(0, 3);

        const skipList = results
          .filter((r) => r.verdict === 'skip')
          .map((r) => ({
            category: r.category,
            reason: r.reasoning.split('.')[0] || 'Not recommended',
          }));

        updateNode(nodeId, {
          status: 'success',
          categoryResults: results,
          topOpportunities: strongOpps,
          skipList,
          progress: {
            currentCategory: null,
            completedCount: results.length,
            totalCount: total,
            cacheHits,
            searchesUsed,
          },
          lastScanAt: Date.now(),
        });
      } catch (err) {
        if (!abortRef.current) {
          updateNode(nodeId, {
            status: 'error',
            error: err instanceof Error ? err.message : 'Unknown error',
          });
        }
      } finally {
        setIsScanning(false);
      }
    },
    [isScanning, hasApiKey, nodeId, updateNode, resetProgress, updateProgress]
  );

  // Stop current scan
  const stopScan = useCallback(() => {
    abortRef.current = true;
    setIsScanning(false);
    updateNode(nodeId, {
      status: 'idle',
      progress: {
        currentCategory: null,
        completedCount: 0,
        totalCount: 0,
        cacheHits: 0,
        searchesUsed: 0,
      },
    });
  }, [nodeId, updateNode]);

  return {
    runTriageScan,
    runFullScan,
    stopScan,
    isScanning,
    hasApiKey,
  };
}

export default useDeepResearch;
