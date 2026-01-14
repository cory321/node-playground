import { useCallback } from 'react';
import { DragState } from '@/types/canvas';
import { NodeData } from '@/types/nodes';

interface UseNodeDragProps {
  updateNode: (id: string, updates: Partial<NodeData>) => void;
  scale: number;
}

interface UseNodeDragReturn {
  startDrag: (e: React.MouseEvent, node: NodeData) => DragState;
  updateDrag: (e: React.MouseEvent, dragState: DragState) => void;
}

export function useNodeDrag({ updateNode, scale }: UseNodeDragProps): UseNodeDragReturn {
  // Start dragging a node
  const startDrag = useCallback(
    (e: React.MouseEvent, node: NodeData): DragState => {
      return {
        id: node.id,
        startX: e.clientX,
        startY: e.clientY,
        nodeX: node.x,
        nodeY: node.y,
      };
    },
    []
  );

  // Update node position during drag
  const updateDrag = useCallback(
    (e: React.MouseEvent, dragState: DragState) => {
      const dx = (e.clientX - dragState.startX) / scale;
      const dy = (e.clientY - dragState.startY) / scale;
      updateNode(dragState.id, {
        x: dragState.nodeX + dx,
        y: dragState.nodeY + dy,
      });
    },
    [updateNode, scale]
  );

  return { startDrag, updateDrag };
}

export default useNodeDrag;
