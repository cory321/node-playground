import { useCallback } from 'react';
import { ResizeState, CANVAS_CONSTANTS } from '@/types/canvas';
import { NodeData } from '@/types/nodes';

interface UseNodeResizeProps {
  updateNode: (id: string, updates: Partial<NodeData>) => void;
  scale: number;
}

interface UseNodeResizeReturn {
  startResize: (e: React.MouseEvent, node: NodeData) => ResizeState;
  updateResize: (e: React.MouseEvent, resizeState: ResizeState) => void;
}

export function useNodeResize({ updateNode, scale }: UseNodeResizeProps): UseNodeResizeReturn {
  // Start resizing a node
  const startResize = useCallback(
    (e: React.MouseEvent, node: NodeData): ResizeState => {
      e.stopPropagation();
      e.preventDefault();
      return {
        id: node.id,
        startX: e.clientX,
        startY: e.clientY,
        startW: node.width,
        startH: node.height,
      };
    },
    []
  );

  // Update node size during resize
  const updateResize = useCallback(
    (e: React.MouseEvent, resizeState: ResizeState) => {
      const dw = (e.clientX - resizeState.startX) / scale;
      const dh = (e.clientY - resizeState.startY) / scale;
      updateNode(resizeState.id, {
        width: Math.max(CANVAS_CONSTANTS.MIN_NODE_WIDTH, resizeState.startW + dw),
        height: Math.max(CANVAS_CONSTANTS.MIN_NODE_HEIGHT, resizeState.startH + dh),
      });
    },
    [updateNode, scale]
  );

  return { startResize, updateResize };
}

export default useNodeResize;
