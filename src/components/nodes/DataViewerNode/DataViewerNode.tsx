import React, { useState, useMemo } from 'react';
import {
  Copy,
  Code2,
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { DataViewerNodeData, HoveredPort } from '@/types/nodes';
import { BaseNode } from '../base';

// Structured data from upstream nodes
interface StructuredDataInput {
  data: unknown;
  sourceNodeType: string;
  sourceNodeTitle: string;
}

interface DataViewerNodeProps {
  node: DataViewerNodeData;
  updateNode: (id: string, updates: Partial<DataViewerNodeData>) => void;
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
  incomingData: StructuredDataInput | null;
}

// Collapsible JSON viewer component
function JsonValue({
  value,
  depth = 0,
  keyName,
}: {
  value: unknown;
  depth?: number;
  keyName?: string;
}) {
  const [isExpanded, setIsExpanded] = useState(depth < 2);
  const indent = depth * 12;

  // Primitive values
  if (value === null) {
    return (
      <span className="text-slate-500 italic">null</span>
    );
  }

  if (typeof value === 'undefined') {
    return (
      <span className="text-slate-500 italic">undefined</span>
    );
  }

  if (typeof value === 'string') {
    // Check if it's a URL
    if (value.startsWith('http://') || value.startsWith('https://')) {
      return (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-emerald-400 hover:text-emerald-300 underline break-all"
          onClick={(e) => e.stopPropagation()}
        >
          "{value.length > 50 ? value.slice(0, 50) + '...' : value}"
        </a>
      );
    }
    // Check if it's a color hex
    if (/^#[0-9a-fA-F]{3,8}$/.test(value)) {
      return (
        <span className="inline-flex items-center gap-1">
          <span
            className="inline-block w-3 h-3 rounded border border-slate-600"
            style={{ backgroundColor: value }}
          />
          <span className="text-amber-400">"{value}"</span>
        </span>
      );
    }
    return (
      <span className="text-amber-400 break-all">
        "{value.length > 100 ? value.slice(0, 100) + '...' : value}"
      </span>
    );
  }

  if (typeof value === 'number') {
    return <span className="text-cyan-400">{value}</span>;
  }

  if (typeof value === 'boolean') {
    return <span className="text-purple-400">{value ? 'true' : 'false'}</span>;
  }

  // Arrays
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-slate-500">[]</span>;
    }

    return (
      <div className="inline">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="inline-flex items-center gap-0.5 text-slate-400 hover:text-white transition-colors"
        >
          {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          <span className="text-slate-500">[{value.length}]</span>
        </button>
        {isExpanded && (
          <div className="ml-3 border-l border-slate-700/50 pl-2">
            {value.map((item, index) => (
              <div key={index} style={{ marginLeft: indent }}>
                <span className="text-slate-500 mr-1">{index}:</span>
                <JsonValue value={item} depth={depth + 1} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Objects
  if (typeof value === 'object') {
    const entries = Object.entries(value);
    if (entries.length === 0) {
      return <span className="text-slate-500">{'{}'}</span>;
    }

    return (
      <div className="inline">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="inline-flex items-center gap-0.5 text-slate-400 hover:text-white transition-colors"
        >
          {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          <span className="text-slate-500">{'{...}'}</span>
        </button>
        {isExpanded && (
          <div className="ml-3 border-l border-slate-700/50 pl-2">
            {entries.map(([key, val]) => (
              <div key={key} style={{ marginLeft: indent }}>
                <span className="text-indigo-400">{key}</span>
                <span className="text-slate-500">: </span>
                <JsonValue value={val} depth={depth + 1} keyName={key} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return <span className="text-slate-500">{String(value)}</span>;
}

export function DataViewerNode({
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
  incomingData,
}: DataViewerNodeProps) {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'tree' | 'raw'>('tree');

  // Generate formatted JSON string
  const jsonString = useMemo(() => {
    if (!incomingData?.data) return null;
    try {
      return JSON.stringify(incomingData.data, null, 2);
    } catch {
      return null;
    }
  }, [incomingData]);

  const handleCopy = async () => {
    if (!jsonString) return;

    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const hasData = !!incomingData?.data;
  const lastUpdated = node.lastUpdated ? new Date(node.lastUpdated) : null;

  const footerExtra = lastUpdated ? (
    <span className="flex items-center gap-1 text-slate-500">
      <Clock size={10} />
      {lastUpdated.toLocaleTimeString()}
    </span>
  ) : undefined;

  // Get source node display name
  const getSourceLabel = (type: string): string => {
    const labels: Record<string, string> = {
      'brand-design': 'Brand Design',
      'site-planner': 'Site Planner',
      'local-knowledge': 'Local Knowledge',
      'comparison-data': 'Comparison Data',
      'editorial-content-generator': 'Editorial Content',
      'provider-enrichment': 'Provider Enrichment',
      'provider-profile-generator': 'Profile Generator',
      'seo-optimization': 'SEO Optimization',
      llm: 'LLM',
    };
    return labels[type] || type;
  };

  return (
    <BaseNode
      node={node}
      icon={<Code2 size={14} className="text-slate-400" />}
      isEditingTitle={editingTitleId === node.id}
      onTitleChange={(title) => updateNode(node.id, { title })}
      onEditTitleStart={() => setEditingTitleId(node.id)}
      onEditTitleEnd={() => setEditingTitleId(null)}
      onDelete={() => deleteNode(node.id)}
      onMouseDown={onMouseDown}
      onResizeStart={onResizeStart}
      hasInputPort={true}
      hasOutputPort={false}
      isConnectedInput={isConnectedInput}
      hoveredPort={hoveredPort}
      setHoveredPort={setHoveredPort}
      onInputPortMouseDown={onInputPortMouseDown}
      onInputPortMouseUp={onInputPortMouseUp}
      status={hasData ? 'success' : 'idle'}
      hoverBorderClass="group-hover:border-slate-500/30"
      resizeHoverColor="hover:text-slate-400"
      footerExtra={footerExtra}
    >
      {/* Header Bar with Status and Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {hasData ? (
            <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-emerald-400">
              <CheckCircle size={12} />
              Data Received
            </span>
          ) : (
            <span className="text-[10px] uppercase tracking-wider text-slate-600">
              Awaiting input...
            </span>
          )}
        </div>
        {hasData && (
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex bg-slate-800/60 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('tree')}
                className={`px-2 py-1 text-[9px] uppercase tracking-wider rounded transition-all ${
                  viewMode === 'tree'
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-500 hover:text-white'
                }`}
              >
                Tree
              </button>
              <button
                onClick={() => setViewMode('raw')}
                className={`px-2 py-1 text-[9px] uppercase tracking-wider rounded transition-all ${
                  viewMode === 'raw'
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-500 hover:text-white'
                }`}
              >
                Raw
              </button>
            </div>
            {/* Copy Button */}
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider transition-all ${
                copied
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-slate-800/60 text-slate-400 hover:bg-slate-700/60 hover:text-slate-200'
              }`}
            >
              {copied ? <CheckCircle size={12} /> : <Copy size={12} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        )}
      </div>

      {/* Source Node Info */}
      {hasData && incomingData && (
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/40 border border-slate-700/30 rounded-lg">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">
            Source:
          </span>
          <span className="text-xs text-slate-300">
            {incomingData.sourceNodeTitle}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 bg-slate-700/50 text-slate-400 rounded">
            {getSourceLabel(incomingData.sourceNodeType)}
          </span>
        </div>
      )}

      {/* Content Display */}
      <div className="flex-1 bg-slate-950/60 border border-slate-800/50 rounded-xl overflow-hidden min-h-0">
        {hasData && incomingData ? (
          viewMode === 'tree' ? (
            <div className="h-full overflow-y-auto p-4">
              <div className="font-mono text-xs leading-relaxed">
                <JsonValue value={incomingData.data} depth={0} />
              </div>
            </div>
          ) : (
            <div className="h-full overflow-y-auto p-4">
              <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">
                {jsonString}
              </pre>
            </div>
          )
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 mx-auto border border-dashed border-slate-700 rounded-full flex items-center justify-center">
                <Code2 size={20} className="text-slate-700" />
              </div>
              <p className="text-[10px] text-slate-700 uppercase tracking-[0.2em]">
                Connect a node with output
              </p>
              <p className="text-[9px] text-slate-600 max-w-[200px]">
                Works with Brand Design, Site Planner, and other nodes
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Data Stats */}
      {hasData && jsonString && (
        <div className="flex items-center gap-4 text-[9px] text-slate-500 uppercase tracking-wider">
          <span>
            {jsonString.length.toLocaleString()} chars
          </span>
          <span>
            {jsonString.split('\n').length.toLocaleString()} lines
          </span>
        </div>
      )}
    </BaseNode>
  );
}

export default DataViewerNode;
