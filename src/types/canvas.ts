// Canvas transform state (pan & zoom)
export interface CanvasTransform {
	x: number;
	y: number;
	scale: number;
}

// Mouse position in canvas coordinates
export interface Point {
	x: number;
	y: number;
}

// Node drag state
export interface DragState {
	id: string;
	startX: number;
	startY: number;
	nodeX: number;
	nodeY: number;
}

// Node resize state
export interface ResizeState {
	id: string;
	startX: number;
	startY: number;
	startW: number;
	startH: number;
}

// Canvas constants
export const CANVAS_CONSTANTS = {
	GRID_SIZE: 25,
	MIN_NODE_WIDTH: 200,
	MIN_NODE_HEIGHT: 150,
	MIN_SCALE: 0.2,
	MAX_SCALE: 1,
} as const;
