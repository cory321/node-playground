import { Point } from '@/types/canvas';
import { NodeData } from '@/types/nodes';

/**
 * Get the position of a node's connector port
 */
export function getConnectorPos(
	node: NodeData | undefined,
	type: 'in' | 'out'
): Point {
	if (!node) return { x: 0, y: 0 };
	return {
		x: type === 'out' ? node.x + node.width : node.x,
		y: node.y + 60, // Port is positioned 60px from top
	};
}

// Constants for multi-port layout (matches CategorySelectorNode row layout)
export const MULTI_PORT_BASE_OFFSET = 140; // Below header + summary section
export const MULTI_PORT_SPACING = 44; // Matches category row height

// Constants for Site Planner multi-input port layout
export const SITE_PLANNER_INPUT_BASE_OFFSET = 100; // Below header
export const SITE_PLANNER_INPUT_SPACING = 44; // Matches input row height

// Constants for Provider Profile Generator multi-input port layout
export const PROFILE_GENERATOR_INPUT_BASE_OFFSET = 100; // Below header
export const PROFILE_GENERATOR_INPUT_SPACING = 44; // Matches input row height

/**
 * Get the position of a multi-port connector (for nodes with multiple output ports)
 * Used by CategorySelectorNode where each visible category has its own output port
 */
export function getMultiPortConnectorPos(
	node: NodeData | undefined,
	type: 'in' | 'out',
	portIndex: number,
	baseOffset: number = MULTI_PORT_BASE_OFFSET,
	portSpacing: number = MULTI_PORT_SPACING
): Point {
	if (!node) return { x: 0, y: 0 };
	return {
		x: type === 'out' ? node.x + node.width : node.x,
		y: node.y + baseOffset + portIndex * portSpacing,
	};
}

/**
 * Generate SVG path for a connection curve
 */
export function getConnectionPath(start: Point, end: Point): string {
	const dist = Math.abs(end.x - start.x);
	const horizontalOffset = Math.min(dist * 0.5, 150);

	return `M ${start.x} ${start.y} C ${start.x + horizontalOffset} ${start.y}, ${end.x - horizontalOffset} ${end.y}, ${end.x} ${end.y}`;
}

/**
 * Convert screen coordinates to canvas coordinates
 */
export function screenToCanvas(
	screenX: number,
	screenY: number,
	containerRect: DOMRect,
	transform: { x: number; y: number; scale: number }
): Point {
	return {
		x: (screenX - containerRect.left - transform.x) / transform.scale,
		y: (screenY - containerRect.top - transform.y) / transform.scale,
	};
}

/**
 * Convert canvas coordinates to screen coordinates
 */
export function canvasToScreen(
	canvasX: number,
	canvasY: number,
	containerRect: DOMRect,
	transform: { x: number; y: number; scale: number }
): Point {
	return {
		x: canvasX * transform.scale + transform.x + containerRect.left,
		y: canvasY * transform.scale + transform.y + containerRect.top,
	};
}

/**
 * Calculate the center position for a new node
 */
export function getCenterPosition(
	windowWidth: number,
	windowHeight: number,
	transform: { x: number; y: number; scale: number },
	nodeWidth: number,
	nodeHeight: number
): Point {
	return {
		x: (windowWidth / 2 - transform.x - nodeWidth / 2) / transform.scale,
		y: (windowHeight / 2 - transform.y - nodeHeight / 2) / transform.scale,
	};
}
