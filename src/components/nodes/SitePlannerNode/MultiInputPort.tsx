import React from 'react';
import { HoveredPort } from '@/types/nodes';
import { Users, BookOpen, LucideIcon } from 'lucide-react';

// Input port configuration for Site Planner
export interface InputPortConfig {
	id: string;
	label: string;
	icon: LucideIcon;
	yOffset: number; // Y offset from top of node
	required: boolean;
}

// Default ports for Site Planner node
// Local Knowledge provides location + category, so we only need 2 ports
export const SITE_PLANNER_INPUT_PORTS: InputPortConfig[] = [
	{ id: 'local-knowledge', label: 'Local Knowledge', icon: BookOpen, yOffset: 100, required: true },
	{ id: 'providers', label: 'Providers', icon: Users, yOffset: 144, required: false },
];

// Port spacing constant for connection layer calculations
export const SITE_PLANNER_INPUT_BASE_OFFSET = 100;
export const SITE_PLANNER_INPUT_SPACING = 44;

interface MultiInputPortProps {
	nodeId: string;
	ports: InputPortConfig[];
	connectedPorts: Set<string>;
	readyPorts: Set<string>; // Ports that have valid data
	hoveredPort: HoveredPort | null;
	setHoveredPort: (port: HoveredPort | null) => void;
	onPortMouseDown: (e: React.MouseEvent, portId: string) => void;
	onPortMouseUp: (portId: string) => void;
	isActive: boolean; // True when any connection is being dragged
}

// Port colors for multi-input (using blue theme for Site Planner)
const PORT_COLORS = {
	default: { border: 'border-slate-600', bg: 'bg-slate-600' },
	connected: { border: 'border-blue-500', bg: 'bg-blue-500' },
	ready: { border: 'border-green-500', bg: 'bg-green-500' },
	hovered: { border: 'border-blue-400', bg: 'bg-blue-400' },
	active: { border: 'border-blue-400', bg: 'bg-blue-400' },
	required: { border: 'border-amber-500/50', bg: 'bg-slate-700' },
};

/**
 * MultiInputPort - Renders multiple input ports on the left edge of a node
 * Each port is positioned at a specific Y offset to align with content rows
 */
export function MultiInputPort({
	nodeId,
	ports,
	connectedPorts,
	readyPorts,
	hoveredPort,
	setHoveredPort,
	onPortMouseDown,
	onPortMouseUp,
	isActive,
}: MultiInputPortProps) {
	return (
		<>
			{ports.map((port) => {
				const isConnected = connectedPorts.has(port.id);
				const isReady = readyPorts.has(port.id);
				const isHovered =
					hoveredPort?.nodeId === nodeId &&
					hoveredPort?.type === 'in' &&
					hoveredPort?.portId === port.id;

				// Determine colors based on state
				let colors = PORT_COLORS.default;
				if (isActive) {
					colors = PORT_COLORS.active;
				} else if (isHovered) {
					colors = PORT_COLORS.hovered;
				} else if (isReady) {
					colors = PORT_COLORS.ready;
				} else if (isConnected) {
					colors = PORT_COLORS.connected;
				} else if (port.required) {
					colors = PORT_COLORS.required;
				}

				const Icon = port.icon;

				return (
					<div
						key={port.id}
						className="absolute flex items-center z-20"
						style={{ 
							top: port.yOffset - 12, // Center the port vertically
							left: -12, // Position port circle on the edge
						}}
					>
						{/* Port label with icon - positioned to the left of port */}
						<div
							className={`absolute right-full mr-2 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider whitespace-nowrap transition-opacity ${
								isConnected || isReady ? 'text-slate-400' : 'text-slate-600'
							} ${isHovered ? 'opacity-100' : 'opacity-70'}`}
						>
							<Icon size={10} />
							<span>{port.label}</span>
							{port.required && !isConnected && !isReady && (
								<span className="text-amber-500">*</span>
							)}
						</div>
						{/* Port circle */}
						<div
							className={`w-6 h-6 bg-[#020617] border-2 rounded-full cursor-crosshair transition-all flex items-center justify-center
                ${colors.border}
                ${isHovered ? 'scale-150 shadow-[0_0_15px_rgba(59,130,246,0.6)]' : ''}
                ${isActive && !isHovered ? 'scale-110' : ''}
              `}
							onMouseDown={(e) => onPortMouseDown(e, port.id)}
							onMouseUp={() => onPortMouseUp(port.id)}
							onMouseEnter={() =>
								setHoveredPort({ nodeId, type: 'in', portId: port.id })
							}
							onMouseLeave={() => setHoveredPort(null)}
							title={`Input: ${port.label}${port.required ? ' (required)' : ''}`}
						>
							<div
								className={`w-2 h-2 rounded-full transition-colors ${colors.bg}`}
							/>
						</div>
					</div>
				);
			})}
		</>
	);
}

export default MultiInputPort;
