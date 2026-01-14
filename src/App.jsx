import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
	Plus,
	Trash2,
	Maximize2,
	Move,
	Share2,
	MousePointer2,
	Edit2,
	Check,
	Save,
	FolderOpen,
	X,
	Download,
	Upload,
} from 'lucide-react';

// --- Constants ---
const GRID_SIZE = 25;
const MIN_WIDTH = 200;
const MIN_HEIGHT = 150;

const App = () => {
	// --- State ---
	const [nodes, setNodes] = useState([
		{
			id: '1',
			x: 100,
			y: 150,
			width: 280,
			height: 220,
			title: 'Input Source',
			text: 'Type your prompt here...',
			color: '#6366f1',
		},
		{
			id: '2',
			x: 550,
			y: 300,
			width: 280,
			height: 220,
			title: 'Process Logic',
			text: 'Refine the output...',
			color: '#a855f7',
		},
	]);
	const [connections, setConnections] = useState([
		{ id: 'c1', fromId: '1', toId: '2' },
	]);
	const [draggingNode, setDraggingNode] = useState(null);
	const [resizingNode, setResizingNode] = useState(null);
	const [connectingFrom, setConnectingFrom] = useState(null); // dragging FROM output, looking for input
	const [connectingTo, setConnectingTo] = useState(null); // dragging TO find output (reverse connection)
	const [hoveredPort, setHoveredPort] = useState(null); // {nodeId, type}
	const [editingTitleId, setEditingTitleId] = useState(null);
	const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
	const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
	const [isPanning, setIsPanning] = useState(false);
	const [showSaveModal, setShowSaveModal] = useState(false);
	const [showLoadModal, setShowLoadModal] = useState(false);
	const [saveName, setSaveName] = useState('');
	const [savedSetups, setSavedSetups] = useState([]);

	const containerRef = useRef(null);

	// Load saved setups from localStorage on mount
	useEffect(() => {
		const saved = localStorage.getItem('nodeBuilderSetups');
		if (saved) {
			setSavedSetups(JSON.parse(saved));
		}
	}, []);

	// --- Handlers ---

	const addNode = () => {
		const newNode = {
			id: Date.now().toString(),
			x: (window.innerWidth / 2 - transform.x - 140) / transform.scale,
			y: (window.innerHeight / 2 - transform.y - 110) / transform.scale,
			width: 280,
			height: 220,
			title: 'New Node',
			text: '',
			color: ['#6366f1', '#a855f7', '#ec4899', '#06b6d4', '#10b981'][
				Math.floor(Math.random() * 5)
			],
		};
		setNodes([...nodes, newNode]);
	};

	const deleteNode = (id) => {
		setNodes(nodes.filter((n) => n.id !== id));
		setConnections(connections.filter((c) => c.fromId !== id && c.toId !== id));
	};

	const updateNode = (id, updates) => {
		setNodes(nodes.map((n) => (n.id === id ? { ...n, ...updates } : n)));
	};

	// --- Save/Load Functions ---

	const saveSetup = () => {
		if (!saveName.trim()) return;

		const newSetup = {
			id: Date.now().toString(),
			name: saveName.trim(),
			createdAt: new Date().toISOString(),
			nodes: nodes,
			connections: connections,
			transform: transform,
		};

		const updatedSetups = [...savedSetups, newSetup];
		setSavedSetups(updatedSetups);
		localStorage.setItem('nodeBuilderSetups', JSON.stringify(updatedSetups));
		setSaveName('');
		setShowSaveModal(false);
	};

	const loadSetup = (setup) => {
		setNodes(setup.nodes);
		setConnections(setup.connections);
		if (setup.transform) {
			setTransform(setup.transform);
		}
		setShowLoadModal(false);
	};

	const deleteSetup = (id, e) => {
		e.stopPropagation();
		const updatedSetups = savedSetups.filter((s) => s.id !== id);
		setSavedSetups(updatedSetups);
		localStorage.setItem('nodeBuilderSetups', JSON.stringify(updatedSetups));
	};

	const exportSetup = () => {
		const data = {
			name: 'Node Builder Export',
			exportedAt: new Date().toISOString(),
			nodes: nodes,
			connections: connections,
			transform: transform,
		};
		const blob = new Blob([JSON.stringify(data, null, 2)], {
			type: 'application/json',
		});
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `node-setup-${Date.now()}.json`;
		a.click();
		URL.revokeObjectURL(url);
	};

	const importSetup = (e) => {
		const file = e.target.files[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (event) => {
			try {
				const data = JSON.parse(event.target.result);
				if (data.nodes && data.connections) {
					setNodes(data.nodes);
					setConnections(data.connections);
					if (data.transform) {
						setTransform(data.transform);
					}
				}
			} catch (err) {
				console.error('Failed to import setup:', err);
			}
		};
		reader.readAsText(file);
		e.target.value = '';
	};

	// --- Interaction Logic ---

	const handleMouseDown = (e, node) => {
		if (e.button !== 0 || editingTitleId) return;
		e.stopPropagation();
		setDraggingNode({
			id: node.id,
			startX: e.clientX,
			startY: e.clientY,
			nodeX: node.x,
			nodeY: node.y,
		});
	};

	const handleResizeStart = (e, node) => {
		e.stopPropagation();
		e.preventDefault();
		setResizingNode({
			id: node.id,
			startX: e.clientX,
			startY: e.clientY,
			startW: node.width,
			startH: node.height,
		});
	};

	const startConnectionFromOutput = (e, nodeId) => {
		e.stopPropagation();
		// Check if this output has existing connections
		const existingConnections = connections.filter((c) => c.fromId === nodeId);
		if (existingConnections.length > 0) {
			// Disconnect all and start reverse connection from the first target
			// (user can reconnect the target input to a different output)
			const targetId = existingConnections[0].toId;
			setConnections(connections.filter((c) => c.fromId !== nodeId));
			setConnectingTo(targetId);
		} else {
			// No existing connections, start a new forward connection
			setConnectingFrom(nodeId);
		}
	};

	const startConnectionFromInput = (e, nodeId) => {
		e.stopPropagation();
		// Find existing connection to this input and disconnect it
		const existingConnection = connections.find((c) => c.toId === nodeId);
		if (existingConnection) {
			// Remove the connection and start dragging from its source
			setConnections(connections.filter((c) => c.id !== existingConnection.id));
			setConnectingFrom(existingConnection.fromId);
		} else {
			// No existing connection - start a reverse connection (looking for an output)
			setConnectingTo(nodeId);
		}
	};

	const completeConnectionToInput = (toId) => {
		if (connectingFrom && connectingFrom !== toId) {
			const exists = connections.find(
				(c) => c.fromId === connectingFrom && c.toId === toId
			);
			if (!exists) {
				setConnections([
					...connections,
					{ id: `c-${Date.now()}`, fromId: connectingFrom, toId },
				]);
			}
		}
		setConnectingFrom(null);
	};

	const completeConnectionToOutput = (fromId) => {
		if (connectingTo && connectingTo !== fromId) {
			const exists = connections.find(
				(c) => c.fromId === fromId && c.toId === connectingTo
			);
			if (!exists) {
				setConnections([
					...connections,
					{ id: `c-${Date.now()}`, fromId, toId: connectingTo },
				]);
			}
		}
		setConnectingTo(null);
	};

	const handleMouseMove = useCallback(
		(e) => {
			const rect = containerRef.current.getBoundingClientRect();
			const x = (e.clientX - rect.left - transform.x) / transform.scale;
			const y = (e.clientY - rect.top - transform.y) / transform.scale;
			setMousePos({ x, y });

			if (draggingNode) {
				const dx = (e.clientX - draggingNode.startX) / transform.scale;
				const dy = (e.clientY - draggingNode.startY) / transform.scale;
				updateNode(draggingNode.id, {
					x: draggingNode.nodeX + dx,
					y: draggingNode.nodeY + dy,
				});
			}

			if (resizingNode) {
				const dw = (e.clientX - resizingNode.startX) / transform.scale;
				const dh = (e.clientY - resizingNode.startY) / transform.scale;
				updateNode(resizingNode.id, {
					width: Math.max(MIN_WIDTH, resizingNode.startW + dw),
					height: Math.max(MIN_HEIGHT, resizingNode.startH + dh),
				});
			}

			if (isPanning) {
				setTransform((prev) => ({
					...prev,
					x: prev.x + e.movementX,
					y: prev.y + e.movementY,
				}));
			}
		},
		[draggingNode, resizingNode, isPanning, transform]
	);

	const handleMouseUp = () => {
		setDraggingNode(null);
		setResizingNode(null);
		setIsPanning(false);
		if (connectingFrom) setConnectingFrom(null);
		if (connectingTo) setConnectingTo(null);
	};

	const onWheel = (e) => {
		if (e.ctrlKey) {
			const scaleChange = e.deltaY * -0.001;
			setTransform((prev) => ({
				...prev,
				scale: Math.min(Math.max(prev.scale + scaleChange, 0.2), 2),
			}));
		} else {
			setTransform((prev) => ({
				...prev,
				x: prev.x - e.deltaX,
				y: prev.y - e.deltaY,
			}));
		}
	};

	// --- Render Helpers ---

	const getConnectorPos = (nodeId, type) => {
		const node = nodes.find((n) => n.id === nodeId);
		if (!node) return { x: 0, y: 0 };
		return {
			x: type === 'out' ? node.x + node.width : node.x,
			y: node.y + 60,
		};
	};

	const renderConnection = (fromId, toId, isTentative = false) => {
		const start = getConnectorPos(fromId, 'out');
		const end = isTentative ? mousePos : getConnectorPos(toId, 'in');

		const dist = Math.abs(end.x - start.x);
		const horizontalOffset = Math.min(dist * 0.5, 150);

		const d = `M ${start.x} ${start.y} C ${start.x + horizontalOffset} ${start.y}, ${end.x - horizontalOffset} ${end.y}, ${end.x} ${end.y}`;

		return (
			<g key={isTentative ? 'tentative' : `${fromId}-${toId}`}>
				{/* Background glow path */}
				<path
					d={d}
					fill="none"
					stroke={isTentative ? '#6366f1' : 'url(#gradLine)'}
					strokeWidth={isTentative ? 4 : 6}
					strokeOpacity={isTentative ? 0.2 : 0.15}
					strokeLinecap="round"
					className="blur-md"
				/>
				{/* Main path */}
				<path
					d={d}
					fill="none"
					stroke={isTentative ? '#6366f1' : 'url(#gradLine)'}
					strokeWidth={isTentative ? 2 : 3}
					strokeDasharray={isTentative ? '8,8' : 'none'}
					strokeLinecap="round"
					className={
						isTentative
							? 'animate-[dash_1s_linear_infinite]'
							: 'drop-shadow-[0_0_8px_rgba(99,102,241,0.4)]'
					}
				/>
				{/* Energy Pulse (Only for established links) */}
				{!isTentative && (
					<path
						d={d}
						fill="none"
						stroke="white"
						strokeWidth="2"
						strokeDasharray="20, 100"
						strokeLinecap="round"
						className="animate-[pulse_3s_linear_infinite] opacity-60 mix-blend-overlay"
					/>
				)}
			</g>
		);
	};

	// Reverse connection: from mouse to input port (looking for an output to connect)
	const renderReverseConnection = (toId) => {
		const start = mousePos;
		const end = getConnectorPos(toId, 'in');

		const dist = Math.abs(end.x - start.x);
		const horizontalOffset = Math.min(dist * 0.5, 150);

		const d = `M ${start.x} ${start.y} C ${start.x + horizontalOffset} ${start.y}, ${end.x - horizontalOffset} ${end.y}, ${end.x} ${end.y}`;

		return (
			<g key="tentative-reverse">
				{/* Background glow path */}
				<path
					d={d}
					fill="none"
					stroke="#a855f7"
					strokeWidth={4}
					strokeOpacity={0.2}
					strokeLinecap="round"
					className="blur-md"
				/>
				{/* Main path */}
				<path
					d={d}
					fill="none"
					stroke="#a855f7"
					strokeWidth={2}
					strokeDasharray="8,8"
					strokeLinecap="round"
					className="animate-[dash_1s_linear_infinite]"
				/>
			</g>
		);
	};

	return (
		<div
			className="w-full h-screen bg-[#020617] text-slate-200 overflow-hidden font-sans selection:bg-indigo-500/30 touch-none"
			ref={containerRef}
			onMouseMove={handleMouseMove}
			onMouseUp={handleMouseUp}
			onWheel={onWheel}
			onMouseDown={(e) => {
				if (e.button === 1 || e.altKey || e.target === containerRef.current) {
					setIsPanning(true);
					setEditingTitleId(null);
				}
			}}
		>
			<style>{`
        @keyframes dash { to { stroke-dashoffset: -16; } }
        @keyframes pulse { 0% { stroke-dashoffset: 120; } 100% { stroke-dashoffset: -120; } }
      `}</style>

			{/* HUD / Toolbar */}
			<div className="fixed top-6 left-6 z-50 flex flex-col gap-4">
				<div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 p-2 rounded-2xl flex items-center gap-2 shadow-2xl relative z-10">
					<button
						onClick={addNode}
						className="p-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/20 group relative"
					>
						<Plus size={20} />
						<span className="absolute -bottom-10 left-1/2 -translate-x-1/2 z-10 bg-slate-900 text-[10px] px-2 py-1 rounded border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none uppercase tracking-tighter whitespace-nowrap">
							Add Node
						</span>
					</button>
					<div className="h-6 w-px bg-slate-700 mx-1" />
					<button
						onClick={() => setShowSaveModal(true)}
						className="p-3 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-emerald-400 group relative"
					>
						<Save size={20} />
						<span className="absolute -bottom-10 left-1/2 -translate-x-1/2 z-10 bg-slate-900 text-[10px] px-2 py-1 rounded border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none uppercase tracking-tighter whitespace-nowrap">
							Save Setup
						</span>
					</button>
					<button
						onClick={() => setShowLoadModal(true)}
						className="p-3 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-cyan-400 group relative"
					>
						<FolderOpen size={20} />
						<span className="absolute -bottom-10 left-1/2 -translate-x-1/2 z-10 bg-slate-900 text-[10px] px-2 py-1 rounded border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none uppercase tracking-tighter whitespace-nowrap">
							Load Setup
						</span>
					</button>
					<div className="h-6 w-px bg-slate-700 mx-1" />
					<button
						onClick={exportSetup}
						className="p-3 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-purple-400 group relative"
					>
						<Download size={20} />
						<span className="absolute -bottom-10 left-1/2 -translate-x-1/2 z-10 bg-slate-900 text-[10px] px-2 py-1 rounded border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none uppercase tracking-tighter whitespace-nowrap">
							Export
						</span>
					</button>
					<label className="p-3 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-amber-400 cursor-pointer group relative">
						<Upload size={20} />
						<input
							type="file"
							accept=".json"
							onChange={importSetup}
							className="hidden"
						/>
						<span className="absolute -bottom-10 left-1/2 -translate-x-1/2 z-10 bg-slate-900 text-[10px] px-2 py-1 rounded border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none uppercase tracking-tighter whitespace-nowrap">
							Import
						</span>
					</label>
				</div>

				<div className="bg-slate-900/50 backdrop-blur-md border border-slate-800/50 px-4 py-2 rounded-xl text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em]">
					NET_OS // NODES: {nodes.length.toString().padStart(2, '0')} // LINKS:{' '}
					{connections.length.toString().padStart(2, '0')}
				</div>
			</div>

			{/* Grid Background */}
			<div
				className="absolute inset-0 pointer-events-none"
				style={{
					backgroundImage: `
            radial-gradient(circle at 1px 1px, #1e293b 1px, transparent 0),
            linear-gradient(to right, #0f172a11 1px, transparent 1px),
            linear-gradient(to bottom, #0f172a11 1px, transparent 1px)
          `,
					backgroundSize: `
            ${GRID_SIZE * transform.scale}px ${GRID_SIZE * transform.scale}px,
            ${GRID_SIZE * 5 * transform.scale}px ${GRID_SIZE * 5 * transform.scale}px,
            ${GRID_SIZE * 5 * transform.scale}px ${GRID_SIZE * 5 * transform.scale}px
          `,
					backgroundPosition: `${transform.x}px ${transform.y}px`,
				}}
			/>

			{/* Infinite Canvas */}
			<div
				className="absolute inset-0 origin-top-left"
				style={{
					transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
				}}
			>
				{/* SVG Connections */}
				<svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
					<defs>
						<linearGradient id="gradLine" x1="0%" y1="0%" x2="100%" y2="0%">
							<stop offset="0%" stopColor="#6366f1" />
							<stop offset="100%" stopColor="#a855f7" />
						</linearGradient>
					</defs>
					{connections.map((conn) => renderConnection(conn.fromId, conn.toId))}
					{connectingFrom && renderConnection(connectingFrom, null, true)}
					{connectingTo && renderReverseConnection(connectingTo)}
				</svg>

				{/* Nodes */}
				{nodes.map((node) => (
					<div
						key={node.id}
						className="absolute select-none group"
						style={{
							left: node.x,
							top: node.y,
							width: node.width,
							height: node.height,
							zIndex: draggingNode?.id === node.id ? 100 : 10,
						}}
					>
						{/* Input Port (Left) - Drag from here to disconnect, or drop here to connect */}
						<div
							className={`absolute -left-3 top-14 w-6 h-6 bg-[#020617] border-2 rounded-full cursor-crosshair z-20 transition-all flex items-center justify-center 
                ${hoveredPort?.nodeId === node.id && hoveredPort?.type === 'in' ? 'border-indigo-400 scale-150 shadow-[0_0_15px_rgba(99,102,241,0.6)]' : connections.some((c) => c.toId === node.id) ? 'border-purple-500' : 'border-slate-700'}`}
							onMouseDown={(e) => startConnectionFromInput(e, node.id)}
							onMouseUp={() => completeConnectionToInput(node.id)}
							onMouseEnter={() =>
								setHoveredPort({ nodeId: node.id, type: 'in' })
							}
							onMouseLeave={() => setHoveredPort(null)}
						>
							<div
								className={`w-2 h-2 rounded-full transition-colors ${hoveredPort?.nodeId === node.id && hoveredPort?.type === 'in' ? 'bg-indigo-400' : connections.some((c) => c.toId === node.id) ? 'bg-purple-500' : 'bg-slate-700'}`}
							/>
						</div>

						{/* Output Port (Right) - Drag from here to create/disconnect, or drop here for reverse connection */}
						<div
							className={`absolute -right-3 top-14 w-6 h-6 bg-[#020617] border-2 rounded-full cursor-crosshair z-20 transition-all flex items-center justify-center
                ${connectingFrom === node.id || connectingTo === node.id ? 'border-indigo-400 scale-125' : hoveredPort?.nodeId === node.id && hoveredPort?.type === 'out' ? 'border-indigo-400 scale-150 shadow-[0_0_15px_rgba(99,102,241,0.6)]' : connections.some((c) => c.fromId === node.id) ? 'border-indigo-500' : 'border-slate-700'}`}
							onMouseDown={(e) => startConnectionFromOutput(e, node.id)}
							onMouseUp={() => completeConnectionToOutput(node.id)}
							onMouseEnter={() =>
								setHoveredPort({ nodeId: node.id, type: 'out' })
							}
							onMouseLeave={() => setHoveredPort(null)}
						>
							<div
								className={`w-2 h-2 rounded-full transition-colors ${connectingFrom === node.id || connectingTo === node.id ? 'bg-indigo-400' : hoveredPort?.nodeId === node.id && hoveredPort?.type === 'out' ? 'bg-indigo-400' : connections.some((c) => c.fromId === node.id) ? 'bg-indigo-500' : 'bg-slate-700'}`}
							/>
						</div>

						{/* Resize Handle (Bottom Right) */}
						<div
							className="absolute -right-1 -bottom-1 w-5 h-5 cursor-nwse-resize z-30 flex items-end justify-end p-1 text-slate-600 hover:text-indigo-400 transition-colors"
							onMouseDown={(e) => handleResizeStart(e, node)}
						>
							<div className="w-2 h-2 border-r-2 border-b-2 border-current" />
						</div>

						{/* Main Node Card */}
						<div className="w-full h-full bg-slate-900/60 backdrop-blur-2xl border border-slate-700/50 rounded-2xl flex flex-col overflow-hidden shadow-2xl transition-all group-hover:border-slate-600/50">
							{/* Header */}
							<div
								className="p-4 flex items-center justify-between cursor-move active:cursor-grabbing border-b border-slate-700/30"
								style={{ backgroundColor: `${node.color}15` }}
								onMouseDown={(e) => handleMouseDown(e, node)}
								onDoubleClick={() => setEditingTitleId(node.id)}
							>
								<div className="flex items-center gap-3 overflow-hidden flex-1 mr-2">
									<div
										className="w-2 h-2 shrink-0 rounded-full animate-pulse"
										style={{ backgroundColor: node.color }}
									/>
									{editingTitleId === node.id ? (
										<input
											autoFocus
											value={node.title}
											onBlur={() => setEditingTitleId(null)}
											onKeyDown={(e) =>
												e.key === 'Enter' && setEditingTitleId(null)
											}
											onChange={(e) =>
												updateNode(node.id, { title: e.target.value })
											}
											className="bg-slate-950 border border-indigo-500/50 rounded px-1 text-xs font-semibold w-full outline-none text-indigo-100"
										/>
									) : (
										<span className="font-semibold text-xs tracking-wide text-slate-100 uppercase truncate">
											{node.title}
										</span>
									)}
								</div>
								<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
									<button
										onClick={() =>
											setEditingTitleId(
												node.id === editingTitleId ? null : node.id
											)
										}
										className="p-1 hover:text-indigo-400 transition-colors"
									>
										{editingTitleId === node.id ? (
											<Check size={14} />
										) : (
											<Edit2 size={14} />
										)}
									</button>
									<button
										onClick={() => deleteNode(node.id)}
										className="p-1 hover:text-red-400 transition-colors"
									>
										<Trash2 size={14} />
									</button>
								</div>
							</div>

							{/* Body */}
							<div className="p-4 flex-1 flex flex-col gap-3 min-h-0">
								<textarea
									value={node.text}
									onChange={(e) =>
										updateNode(node.id, { text: e.target.value })
									}
									placeholder="Enter logic or prompts..."
									className="w-full flex-1 bg-slate-950/40 border border-slate-800/80 rounded-xl p-3 text-sm text-slate-300 placeholder:text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 resize-none transition-all scrollbar-hide"
								/>

								<div className="flex items-center justify-between text-[9px] text-slate-600 font-mono tracking-tighter shrink-0">
									<span className="flex items-center gap-1 uppercase">
										<Move size={10} /> {Math.round(node.x)}:{Math.round(node.y)}
									</span>
									<span className="uppercase">
										{node.width}x{node.height}
									</span>
								</div>
							</div>

							{/* Status Bar */}
							<div className="h-1 w-full bg-slate-800/50">
								<div
									className="h-full bg-indigo-500/40 animate-[pulse_2s_infinite]"
									style={{ width: '40%', backgroundColor: node.color }}
								/>
							</div>
						</div>
					</div>
				))}
			</div>

			{/* Empty State */}
			{nodes.length === 0 && (
				<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
					<div className="text-center space-y-4 animate-in fade-in zoom-in duration-700">
						<div className="w-20 h-20 mx-auto border-2 border-indigo-500/20 rounded-full flex items-center justify-center animate-pulse">
							<Plus size={40} className="text-indigo-500/40" />
						</div>
						<h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent uppercase tracking-widest">
							System Offline
						</h2>
						<p className="text-slate-600 font-mono text-[10px] uppercase tracking-[0.2em]">
							Add node to initialize neural network
						</p>
					</div>
				</div>
			)}

			{/* Save Modal */}
			{showSaveModal && (
				<div
					className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
					onClick={() => setShowSaveModal(false)}
				>
					<div
						className="bg-slate-900/95 backdrop-blur-2xl border border-slate-700/50 rounded-3xl p-6 w-full max-w-md shadow-2xl shadow-indigo-500/10 animate-in zoom-in-95 fade-in duration-200"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="flex items-center justify-between mb-6">
							<div className="flex items-center gap-3">
								<div className="p-2 bg-emerald-500/20 rounded-xl">
									<Save size={20} className="text-emerald-400" />
								</div>
								<h2 className="text-lg font-bold uppercase tracking-widest text-slate-100">
									Save Setup
								</h2>
							</div>
							<button
								onClick={() => setShowSaveModal(false)}
								className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-slate-200"
							>
								<X size={20} />
							</button>
						</div>

						<div className="space-y-4">
							<div>
								<label className="block text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-2">
									Setup Name
								</label>
								<input
									type="text"
									value={saveName}
									onChange={(e) => setSaveName(e.target.value)}
									onKeyDown={(e) => e.key === 'Enter' && saveSetup()}
									placeholder="My Awesome Flow..."
									autoFocus
									className="w-full bg-slate-950/60 border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all"
								/>
							</div>

							<div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono uppercase tracking-wider">
								<span className="flex items-center gap-1">
									<div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
									{nodes.length} Nodes
								</span>
								<span className="text-slate-700">•</span>
								<span className="flex items-center gap-1">
									<div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
									{connections.length} Links
								</span>
							</div>

							<button
								onClick={saveSetup}
								disabled={!saveName.trim()}
								className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed rounded-xl text-sm font-semibold uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 disabled:shadow-none"
							>
								Save to Library
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Load Modal */}
			{showLoadModal && (
				<div
					className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
					onClick={() => setShowLoadModal(false)}
				>
					<div
						className="bg-slate-900/95 backdrop-blur-2xl border border-slate-700/50 rounded-3xl p-6 w-full max-w-lg shadow-2xl shadow-cyan-500/10 animate-in zoom-in-95 fade-in duration-200"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="flex items-center justify-between mb-6">
							<div className="flex items-center gap-3">
								<div className="p-2 bg-cyan-500/20 rounded-xl">
									<FolderOpen size={20} className="text-cyan-400" />
								</div>
								<h2 className="text-lg font-bold uppercase tracking-widest text-slate-100">
									Load Setup
								</h2>
							</div>
							<button
								onClick={() => setShowLoadModal(false)}
								className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-slate-200"
							>
								<X size={20} />
							</button>
						</div>

						{savedSetups.length === 0 ? (
							<div className="text-center py-12">
								<div className="w-16 h-16 mx-auto mb-4 border-2 border-slate-700/50 rounded-full flex items-center justify-center">
									<FolderOpen size={28} className="text-slate-600" />
								</div>
								<p className="text-slate-500 text-sm mb-1">
									No saved setups yet
								</p>
								<p className="text-slate-600 text-[10px] font-mono uppercase tracking-[0.2em]">
									Save your current setup to get started
								</p>
							</div>
						) : (
							<div className="space-y-2 max-h-80 overflow-y-auto pr-1 scrollbar-hide">
								{savedSetups.map((setup) => (
									<div
										key={setup.id}
										onClick={() => loadSetup(setup)}
										className="group bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/30 hover:border-cyan-500/30 rounded-xl p-4 cursor-pointer transition-all"
									>
										<div className="flex items-start justify-between gap-3">
											<div className="flex-1 min-w-0">
												<h3 className="font-semibold text-slate-200 truncate group-hover:text-cyan-300 transition-colors">
													{setup.name}
												</h3>
												<div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-500 font-mono uppercase tracking-wider">
													<span className="flex items-center gap-1">
														<div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
														{setup.nodes.length} Nodes
													</span>
													<span className="flex items-center gap-1">
														<div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
														{setup.connections.length} Links
													</span>
												</div>
												<p className="text-[10px] text-slate-600 mt-2">
													{new Date(setup.createdAt).toLocaleDateString(
														'en-US',
														{
															month: 'short',
															day: 'numeric',
															year: 'numeric',
															hour: '2-digit',
															minute: '2-digit',
														}
													)}
												</p>
											</div>
											<button
												onClick={(e) => deleteSetup(setup.id, e)}
												className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 rounded-lg transition-all text-slate-500 hover:text-red-400"
											>
												<Trash2 size={14} />
											</button>
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
};

export default App;
