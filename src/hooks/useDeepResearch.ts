import { useCallback, useState, useRef } from 'react';
import {
  DeepResearchNodeData,
  CategoryAnalysisResult,
  TriageResultData,
  ResearchProgress,
  ValidationSummary,
} from '@/types/nodes';
import {
  fetchSerpData,
  runTriageSearch,
  hasSerpApiKey,
  getCategoriesToScan,
  getCategoryTier,
  DEFAULT_SCAN_CONFIG,
  validateMarketKeywordWithSerpData,
  hasValidationApi,
  isAggregatorDomain,
} from '@/api/serp';
import type { SerpSignals } from '@/api/serp';
import { analyzeSerpWithClaude, generateTriageAnalysis, analyzeSerpWithValidation } from '@/api/serp/analyzer';
import { CityProfile } from '@/api/serp/tiers';

interface UseDeepResearchProps {
  nodeId: string;
  node: DeepResearchNodeData;
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
  setManualOverride: (category: string, override: boolean) => void;
  isScanning: boolean;
  hasApiKey: boolean;
}

export function useDeepResearch({
  nodeId,
  node,
  updateNode,
}: UseDeepResearchProps): UseDeepResearchReturn {
  const [isScanning, setIsScanning] = useState(false);
  const abortRef = useRef(false);

  const hasApiKey = hasSerpApiKey();

  // Manual override handler - allows user to validate flagged categories manually
  const setManualOverride = useCallback(
    (category: string, override: boolean) => {
      const updatedResults = node.categoryResults.map((r) =>
        r.category === category ? { ...r, manualOverride: override } : r
      );

      // Recalculate validation summary with override count
      const overriddenCount = updatedResults.filter((r) => r.manualOverride).length;
      const validationSummary: ValidationSummary = {
        ...node.validationSummary,
        totalFlags: node.validationSummary?.totalFlags ?? 0,
        criticalWarnings: node.validationSummary?.criticalWarnings ?? [],
        trendsValidated: node.validationSummary?.trendsValidated ?? 0,
        overriddenCount,
      };

      updateNode(nodeId, {
        categoryResults: updatedResults,
        validationSummary,
      });
    },
    [nodeId, node.categoryResults, node.validationSummary, updateNode]
  );

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

  // Run full tiered scan with validation
  const runFullScan = useCallback(
    async (city: string, state: string | null, profile: CityProfile) => {
      if (isScanning || !hasApiKey) return;

      setIsScanning(true);
      abortRef.current = false;
      resetProgress();

      const enableValidation = hasValidationApi();

      updateNode(nodeId, {
        status: 'loading',
        inputCity: city,
        inputState: state,
        cityTraits: profile.traits,
        validationSummary: null,
      });

      try {
        const { tier1, tier2, conditional, total } = getCategoriesToScan(
          profile,
          DEFAULT_SCAN_CONFIG
        );
        const allCategories = [...tier1, ...tier2, ...conditional];

        updateProgress({
          totalCount: total,
        });

        const results: CategoryAnalysisResult[] = [];
        let cacheHits = 0;
        let searchesUsed = 0;
        let trendsValidated = 0;
        const allFlags: string[] = [];

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

          let analysis: CategoryAnalysisResult;
          let fromCache = false;

          // For tier1/conditional categories with validation enabled, use the consolidated
          // single-call approach to avoid duplicate SERP API calls and data contradictions
          if (enableValidation && (tier === 'tier1' || tier === 'conditional')) {
            try {
              // Single call that fetches both trend validation AND SERP data
              const validationResult = await validateMarketKeywordWithSerpData(
                category,
                city,
                state
              );
              trendsValidated++;
              searchesUsed++; // This makes one SERP API call

              if (abortRef.current) break;

              // Construct SerpSignals from the validation result for aggregator analysis
              const topDomains = validationResult.organicResults
                .slice(0, 5)
                .map((r) => r.domain);
              const aggregatorPositions: number[] = [];
              topDomains.forEach((domain, idx) => {
                if (isAggregatorDomain(domain)) {
                  aggregatorPositions.push(idx + 1); // 1-indexed
                }
              });

              const serpSignals: SerpSignals = {
                hasLSAs: validationResult.demandSignals.lsaPresent,
                lsaCount: validationResult.demandSignals.lsaCount,
                localPackCount: validationResult.demandSignals.localPackCount,
                topOrganicDomains: topDomains,
                adCount: validationResult.demandSignals.paidAdsCount,
                aggregatorPositions,
                totalResults: validationResult.totalResults,
              };

              // Use the enhanced validation-aware analysis with consistent data
              analysis = await analyzeSerpWithValidation(
                category,
                city,
                state,
                serpSignals,
                validationResult.trendValidation,
                validationResult.demandSignals,
                tier
              );

              // Collect flags
              if (analysis.validationFlags) {
                allFlags.push(...analysis.validationFlags);
              }
            } catch (validationErr) {
              console.warn(`Validation error for ${category}:`, validationErr);
              // Fall back to legacy fetchSerpData + standard analysis
              const serpResult = await fetchSerpData(category, city, state);
              if (serpResult.fromCache) {
                cacheHits++;
              } else {
                searchesUsed++;
              }
              if (serpResult.error) {
                console.warn(`Error fetching ${category}:`, serpResult.error);
                continue;
              }
              fromCache = serpResult.fromCache;
              analysis = await analyzeSerpWithClaude(
                category,
                city,
                state,
                serpResult.signals,
                tier
              );
            }
          } else {
            // Use legacy fetchSerpData for lower tiers or when validation is disabled
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

            fromCache = serpResult.fromCache;
            analysis = await analyzeSerpWithClaude(
              category,
              city,
              state,
              serpResult.signals,
              tier
            );
          }

          if (abortRef.current) break;

          analysis.fromCache = fromCache;
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
          if (!fromCache && i < allCategories.length - 1) {
            await new Promise((resolve) =>
              setTimeout(resolve, DEFAULT_SCAN_CONFIG.delayBetweenSearchesMs)
            );
          }
        }

        if (abortRef.current) return;

        // Calculate top opportunities and skip list
        // Now considers validation flags when sorting
        const strongOpps = results
          .filter((r) => r.verdict === 'strong')
          .sort((a, b) => {
            // Prioritize results without validation flags
            const aHasFlags = (a.validationFlags?.length ?? 0) > 0;
            const bHasFlags = (b.validationFlags?.length ?? 0) > 0;
            if (aHasFlags !== bHasFlags) {
              return aHasFlags ? 1 : -1;
            }
            return b.serpScore - a.serpScore;
          })
          .slice(0, 3);

        const skipList = results
          .filter((r) => r.verdict === 'skip')
          .map((r) => ({
            category: r.category,
            reason: r.validationFlags?.[0] || r.reasoning.split('.')[0] || 'Not recommended',
          }));

        // Generate validation summary
        const criticalWarnings = [...new Set(allFlags.filter(
          (f) =>
            f.includes('SPIKE_ANOMALY') ||
            f.includes('SEVERE_DECLINE') ||
            f.includes('DATA_CONFLICT') ||
            f.includes('INSUFFICIENT_TREND_DATA') ||
            f.includes('NO_SEARCH_INTEREST')
        ))];

        const validationSummary: ValidationSummary = {
          totalFlags: allFlags.length,
          criticalWarnings,
          trendsValidated,
          overriddenCount: 0,
        };

        updateNode(nodeId, {
          status: 'success',
          categoryResults: results,
          topOpportunities: strongOpps,
          skipList,
          validationSummary,
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
    setManualOverride,
    isScanning,
    hasApiKey,
  };
}

export default useDeepResearch;
