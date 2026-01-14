import React, { useState } from 'react';
import { Copy, Monitor, CheckCircle, Clock } from 'lucide-react';
import { OutputNodeData, HoveredPort } from '@/types/nodes';
import { BaseNode } from '../base';

interface OutputNodeProps {
  node: OutputNodeData;
  updateNode: (id: string, updates: Partial<OutputNodeData>) => void;
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
  incomingData: string | null;
}

export function OutputNode({
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
}: OutputNodeProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const textToCopy = incomingData || node.displayValue || '';
    if (!textToCopy) return;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const displayContent = incomingData || node.displayValue || '';
  const hasContent = !!displayContent;
  const lastUpdated = node.lastUpdated ? new Date(node.lastUpdated) : null;

  const footerExtra = lastUpdated ? (
    <span className="flex items-center gap-1 text-slate-500">
      <Clock size={10} />
      {lastUpdated.toLocaleTimeString()}
    </span>
  ) : undefined;

  return (
    <BaseNode
      node={node}
      icon={<Monitor size={14} className="text-emerald-400" />}
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
      status={hasContent ? 'success' : 'idle'}
      hoverBorderClass="group-hover:border-emerald-500/30"
      resizeHoverColor="hover:text-emerald-400"
      footerExtra={footerExtra}
    >
      {/* Copy Button & Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {hasContent ? (
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
        {hasContent && (
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
        )}
      </div>

      {/* Content Display */}
      <div className="flex-1 bg-slate-950/60 border border-slate-800/50 rounded-xl overflow-hidden min-h-0">
        {hasContent ? (
          <div className="h-full overflow-y-auto p-4">
            <pre className="text-sm text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">
              {displayContent}
            </pre>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 mx-auto border border-dashed border-slate-700 rounded-full flex items-center justify-center">
                <Monitor size={20} className="text-slate-700" />
              </div>
              <p className="text-[10px] text-slate-700 uppercase tracking-[0.2em]">
                Connect an LLM node
              </p>
            </div>
          </div>
        )}
      </div>
    </BaseNode>
  );
}

export default OutputNode;
