import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  RefObject,
} from 'react';
import {
  CanvasTransform,
  Point,
  DragState,
  ResizeState,
  CANVAS_CONSTANTS,
} from '@/types/canvas';
import { HoveredPort } from '@/types/nodes';

// Context value type
interface CanvasContextValue {
  // Transform state
  transform: CanvasTransform;
  setTransform: React.Dispatch<React.SetStateAction<CanvasTransform>>;

  // Mouse position
  mousePos: Point;
  setMousePos: React.Dispatch<React.SetStateAction<Point>>;

  // Panning state
  isPanning: boolean;
  setIsPanning: React.Dispatch<React.SetStateAction<boolean>>;

  // Drag state
  draggingNode: DragState | null;
  setDraggingNode: React.Dispatch<React.SetStateAction<DragState | null>>;

  // Resize state
  resizingNode: ResizeState | null;
  setResizingNode: React.Dispatch<React.SetStateAction<ResizeState | null>>;

  // Connection state
  connectingFrom: string | null;
  setConnectingFrom: React.Dispatch<React.SetStateAction<string | null>>;
  connectingTo: string | null;
  setConnectingTo: React.Dispatch<React.SetStateAction<string | null>>;

  // Hovered port
  hoveredPort: HoveredPort | null;
  setHoveredPort: React.Dispatch<React.SetStateAction<HoveredPort | null>>;

  // Title editing
  editingTitleId: string | null;
  setEditingTitleId: React.Dispatch<React.SetStateAction<string | null>>;

  // Container ref
  containerRef: RefObject<HTMLDivElement> | null;
  setContainerRef: (ref: RefObject<HTMLDivElement>) => void;

  // Handlers
  handleZoom: (deltaY: number, deltaX: number, ctrlKey: boolean) => void;
  resetTransform: () => void;
}

// Create context
const CanvasContext = createContext<CanvasContextValue | null>(null);

// Default transform
const DEFAULT_TRANSFORM: CanvasTransform = { x: 0, y: 0, scale: 1 };

// Provider props
interface CanvasProviderProps {
  children: ReactNode;
}

// Provider component
export function CanvasProvider({ children }: CanvasProviderProps) {
  const [transform, setTransform] = useState<CanvasTransform>(DEFAULT_TRANSFORM);
  const [mousePos, setMousePos] = useState<Point>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [draggingNode, setDraggingNode] = useState<DragState | null>(null);
  const [resizingNode, setResizingNode] = useState<ResizeState | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [connectingTo, setConnectingTo] = useState<string | null>(null);
  const [hoveredPort, setHoveredPort] = useState<HoveredPort | null>(null);
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [containerRef, setContainerRefState] = useState<RefObject<HTMLDivElement> | null>(null);

  const setContainerRef = useCallback((ref: RefObject<HTMLDivElement>) => {
    setContainerRefState(ref);
  }, []);

  // Handle zoom (scroll wheel)
  const handleZoom = useCallback((deltaY: number, deltaX: number, ctrlKey: boolean) => {
    if (ctrlKey) {
      // Zoom
      const scaleChange = deltaY * -0.001;
      setTransform((prev) => ({
        ...prev,
        scale: Math.min(
          Math.max(prev.scale + scaleChange, CANVAS_CONSTANTS.MIN_SCALE),
          CANVAS_CONSTANTS.MAX_SCALE
        ),
      }));
    } else {
      // Pan
      setTransform((prev) => ({
        ...prev,
        x: prev.x - deltaX,
        y: prev.y - deltaY,
      }));
    }
  }, []);

  // Reset transform to default
  const resetTransform = useCallback(() => {
    setTransform(DEFAULT_TRANSFORM);
  }, []);

  const value: CanvasContextValue = {
    transform,
    setTransform,
    mousePos,
    setMousePos,
    isPanning,
    setIsPanning,
    draggingNode,
    setDraggingNode,
    resizingNode,
    setResizingNode,
    connectingFrom,
    setConnectingFrom,
    connectingTo,
    setConnectingTo,
    hoveredPort,
    setHoveredPort,
    editingTitleId,
    setEditingTitleId,
    containerRef,
    setContainerRef,
    handleZoom,
    resetTransform,
  };

  return <CanvasContext.Provider value={value}>{children}</CanvasContext.Provider>;
}

// Hook to use canvas context
export function useCanvas() {
  const context = useContext(CanvasContext);
  if (!context) {
    throw new Error('useCanvas must be used within a CanvasProvider');
  }
  return context;
}

export default CanvasContext;
