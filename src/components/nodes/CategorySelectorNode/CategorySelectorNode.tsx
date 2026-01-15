import React, { useEffect, useMemo } from 'react';
import {
  Layers,
  Link2Off,
  MapPin,
  Eye,
  EyeOff,
} from 'lucide-react';
import { 
  CategorySelectorNodeData, 
  CategoryItem, 
  CategoryAnalysisResult,
  HoveredPort,
} from '@/types/nodes';
import { Connection } from '@/types/connections';
import { BaseNode, Port } from '../base';
import { CategoryRow } from './CategoryRow';
import { MultiPort } from './MultiPort';
import { MULTI_PORT_BASE_OFFSET, MULTI_PORT_SPACING } from '@/utils/geometry';

interface CategorySelectorNodeProps {
  node: CategorySelectorNodeData;
  updateNode: (id: string, updates: Partial<CategorySelectorNodeData>) => void;
  deleteNode: (id: string) => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onResizeStart: (e: React.MouseEvent) => void;
  editingTitleId: string | null;
  setEditingTitleId: (id: string | null) => void;
  isConnectedInput: boolean;
  hoveredPort: HoveredPort | null;
  setHoveredPort: (port: HoveredPort | null) => void;
  onInputPortMouseDown: (e: React.MouseEvent) => void;
  onInputPortMouseUp: () => void;
  onOutputPortMouseDown: (e: React.MouseEvent, portId: string) => void;
  onOutputPortMouseUp: (portId: string) => void;
  connectingFrom: string | null;
  connectingTo: string | null;
  // Incoming data from upstream Research node
  incomingData: {
    city: string;
    state: string | null;
    categories: CategoryAnalysisResult[];
  } | null;
  // Port connection status
  getPortConnections: (portId: string) => Connection[];
}

/**
 * Calculate opportunity score for sorting categories.
 * Higher score = better opportunity.
 */
function calculateOpportunityScore(cat: CategoryItem): number {
  // Verdict score: strong=100, maybe=50, skip=0
  const verdictScore = cat.verdict === 'strong' ? 100 : cat.verdict === 'maybe' ? 50 : 0;
  
  // SERP quality score: Weak=30 (less competition = better), Medium=15, Strong=0
  const serpScore = cat.serpQuality === 'Weak' ? 30 : cat.serpQuality === 'Medium' ? 15 : 0;
  
  // SERP numeric score: invert so lower competition scores higher (max ~20 points)
  // serpScore typically ranges 0-100, so we invert and scale
  const invertedSerpScore = Math.max(0, 20 - (cat.serpScore / 5));
  
  return verdictScore + serpScore + invertedSerpScore;
}

/**
 * Sort categories by opportunity, with top 3 at the top.
 */
function sortByOpportunity(categories: CategoryItem[]): CategoryItem[] {
  return [...categories].sort((a, b) => {
    const scoreA = calculateOpportunityScore(a);
    const scoreB = calculateOpportunityScore(b);
    return scoreB - scoreA; // Descending (best first)
  });
}

/**
 * CategorySelectorNode - Receives category opportunities from Deep Research Node
 * and exposes each visible category as an independent output port.
 * Enables fan-out to multiple downstream Provider Discovery nodes.
 */
export function CategorySelectorNode({
  node,
  updateNode,
  deleteNode,
  onMouseDown,
  onResizeStart,
  editingTitleId,
  setEditingTitleId,
  isConnectedInput,
  hoveredPort,
  setHoveredPort,
  onInputPortMouseDown,
  onInputPortMouseUp,
  onOutputPortMouseDown,
  onOutputPortMouseUp,
  connectingFrom,
  connectingTo,
  incomingData,
  getPortConnections,
}: CategorySelectorNodeProps) {
  // Sync categories from upstream when data changes
  // Use stable string keys for comparison to avoid reference equality issues
  const incomingCategoriesKey = incomingData?.categories
    ?.map((c) => c.category)
    .join(',') || '';
  const currentCategoriesKey = node.categories.map((c) => c.category).join(',');
  const incomingCity = incomingData?.city || null;
  const incomingState = incomingData?.state || null;

  useEffect(() => {
    if (!incomingData?.categories || incomingData.categories.length === 0) {
      return;
    }

    // Check if we need to update using stable string keys
    const cityChanged = node.inputCity !== incomingCity;
    const stateChanged = node.inputState !== incomingState;
    const categoriesChanged = currentCategoriesKey !== incomingCategoriesKey;

    if (cityChanged || stateChanged || categoriesChanged) {
      // Convert CategoryAnalysisResult[] to CategoryItem[]
      // We need to access node.categories here but don't include it in deps
      // to avoid infinite loops - use a ref pattern or accept stale visibility
      const newCategories: CategoryItem[] = incomingData.categories.map((cat, index) => {
        // Default visibility: show non-skip categories
        return {
          id: `cat-${index}`,
          category: cat.category,
          serpQuality: cat.serpQuality,
          serpScore: cat.serpScore,
          leadValue: cat.leadValue,
          verdict: cat.verdict,
          visible: cat.verdict !== 'skip',
          order: index,
        };
      });

      // Sort by opportunity quality
      const sortedCategories = sortByOpportunity(newCategories);

      updateNode(node.id, {
        inputCity: incomingCity,
        inputState: incomingState,
        categories: sortedCategories,
        lastUpdatedAt: Date.now(),
      });
    }
  }, [
    incomingCategoriesKey,
    currentCategoriesKey,
    incomingCity,
    incomingState,
    node.id,
    node.inputCity,
    node.inputState,
    updateNode,
    incomingData?.categories,
  ]);

  // Handle category visibility toggle
  const handleToggleVisible = (categoryId: string) => {
    const updatedCategories = node.categories.map((cat) =>
      cat.id === categoryId ? { ...cat, visible: !cat.visible } : cat
    );
    updateNode(node.id, { categories: updatedCategories });
  };

  // Toggle all visibility
  const handleToggleAll = (visible: boolean) => {
    const updatedCategories = node.categories.map((cat) => ({
      ...cat,
      visible,
    }));
    updateNode(node.id, { categories: updatedCategories });
  };

  // Calculate visible categories and their port configs
  const visibleCategories = useMemo(() => 
    node.categories.filter((c) => c.visible),
    [node.categories]
  );

  const portConfigs = useMemo(() => 
    visibleCategories.map((cat, index) => ({
      id: cat.id,
      label: cat.category,
      // Calculate Y offset: base offset + (visible index * spacing) + center of row
      yOffset: MULTI_PORT_BASE_OFFSET + (index * MULTI_PORT_SPACING) + (MULTI_PORT_SPACING / 2) - 12,
    })),
    [visibleCategories]
  );

  // Get connected port IDs
  const connectedPorts = useMemo(() => {
    const connected = new Set<string>();
    node.categories.forEach((cat) => {
      if (getPortConnections(cat.id).length > 0) {
        connected.add(cat.id);
      }
    });
    return connected;
  }, [node.categories, getPortConnections]);

  // Stats
  const visibleCount = visibleCategories.length;
  const totalCount = node.categories.length;

  // Check if any connection is active (for port highlighting)
  const isOutputActive = connectingFrom === node.id || 
    (connectingTo !== null && connectingTo !== node.id);

  return (
    <BaseNode
      node={node}
      icon={<Layers size={14} className="text-violet-400" />}
      isEditingTitle={editingTitleId === node.id}
      onTitleChange={(title) => updateNode(node.id, { title })}
      onEditTitleStart={() => setEditingTitleId(node.id)}
      onEditTitleEnd={() => setEditingTitleId(null)}
      onDelete={() => deleteNode(node.id)}
      onMouseDown={onMouseDown}
      onResizeStart={onResizeStart}
      hasInputPort={true}
      hasOutputPort={false} // We handle output ports manually with MultiPort
      isConnectedInput={isConnectedInput}
      isConnectedOutput={connectedPorts.size > 0}
      hoveredPort={hoveredPort}
      setHoveredPort={setHoveredPort}
      onInputPortMouseDown={onInputPortMouseDown}
      onInputPortMouseUp={onInputPortMouseUp}
      connectingFrom={connectingFrom}
      connectingTo={connectingTo}
      borderClass="border-slate-700/50"
      hoverBorderClass="group-hover:border-violet-500/30"
      resizeHoverColor="hover:text-violet-400"
      extraPorts={
        <MultiPort
          nodeId={node.id}
          ports={portConfigs}
          connectedPorts={connectedPorts}
          hoveredPort={hoveredPort}
          setHoveredPort={setHoveredPort}
          onPortMouseDown={onOutputPortMouseDown}
          onPortMouseUp={onOutputPortMouseUp}
          isActive={isOutputActive}
        />
      }
    >
      {/* No Connection State */}
      {!incomingData?.city ? (
        <div className="flex items-center gap-2 px-3 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg">
          <Link2Off size={14} className="text-slate-500" />
          <span className="text-xs text-slate-500">
            Connect a Deep Research Node to receive categories
          </span>
        </div>
      ) : (
        <>
          {/* Location Display */}
          <div className="px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin size={12} className="text-violet-400" />
                <span className="text-xs text-slate-300">
                  {incomingData.city}
                  {incomingData.state && `, ${incomingData.state}`}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">
                {visibleCount} of {totalCount} visible
              </span>
            </div>
          </div>

          {/* Toggle All Controls */}
          {totalCount > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleToggleAll(true)}
                className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-[10px] text-slate-400 hover:text-violet-300 bg-slate-800/50 hover:bg-violet-500/10 border border-slate-700/50 hover:border-violet-500/30 rounded transition-all"
              >
                <Eye size={12} />
                Show All
              </button>
              <button
                onClick={() => handleToggleAll(false)}
                className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-[10px] text-slate-400 hover:text-slate-300 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 rounded transition-all"
              >
                <EyeOff size={12} />
                Hide All
              </button>
            </div>
          )}

          {/* Category List */}
          {node.categories.length > 0 ? (
            <div className="flex flex-col gap-1 overflow-y-auto flex-1 min-h-0 pr-1">
              {node.categories.map((item, index) => (
                <CategoryRow
                  key={item.id}
                  item={item}
                  onToggleVisible={handleToggleVisible}
                  isConnected={connectedPorts.has(item.id)}
                  rank={index < 3 ? index + 1 : undefined}
                />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-4 text-xs text-slate-500">
              No categories available. Run a full scan in the Research node.
            </div>
          )}
        </>
      )}
    </BaseNode>
  );
}

export default CategorySelectorNode;
