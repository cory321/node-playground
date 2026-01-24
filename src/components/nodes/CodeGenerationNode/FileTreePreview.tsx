import React, { useState, useMemo } from 'react';
import {
	ChevronRight,
	ChevronDown,
	File,
	Folder,
	FolderOpen,
} from 'lucide-react';
import { FileTreeNode, formatBytes } from '@/types/codeGeneration';

interface FileTreePreviewProps {
	tree: FileTreeNode;
	onFileSelect?: (path: string) => void;
	selectedFile?: string | null;
	maxHeight?: number;
}

interface TreeNodeProps {
	node: FileTreeNode;
	depth: number;
	onFileSelect?: (path: string) => void;
	selectedFile?: string | null;
	expandedPaths: Set<string>;
	toggleExpanded: (path: string) => void;
}

function TreeNodeComponent({
	node,
	depth,
	onFileSelect,
	selectedFile,
	expandedPaths,
	toggleExpanded,
}: TreeNodeProps) {
	const isExpanded = expandedPaths.has(node.path);
	const isSelected = selectedFile === node.path;
	const isDirectory = node.type === 'directory';

	const handleClick = () => {
		if (isDirectory) {
			toggleExpanded(node.path);
		} else if (onFileSelect) {
			onFileSelect(node.path);
		}
	};

	// Get file extension for icon styling
	const getFileColor = (name: string): string => {
		const ext = name.split('.').pop()?.toLowerCase();
		switch (ext) {
			case 'tsx':
			case 'ts':
				return 'text-blue-400';
			case 'css':
				return 'text-purple-400';
			case 'json':
				return 'text-yellow-400';
			case 'js':
				return 'text-yellow-500';
			case 'md':
				return 'text-slate-400';
			default:
				return 'text-slate-500';
		}
	};

	return (
		<div>
			<div
				className={`flex items-center gap-1 py-0.5 px-1 rounded cursor-pointer transition-colors ${
					isSelected
						? 'bg-emerald-500/20 text-emerald-300'
						: 'hover:bg-slate-700/50 text-slate-300'
				}`}
				style={{ paddingLeft: `${depth * 12 + 4}px` }}
				onClick={handleClick}
			>
				{/* Expand/collapse icon for directories */}
				{isDirectory ? (
					<span className="w-4 h-4 flex items-center justify-center text-slate-500">
						{isExpanded ? (
							<ChevronDown size={12} />
						) : (
							<ChevronRight size={12} />
						)}
					</span>
				) : (
					<span className="w-4" />
				)}

				{/* Icon */}
				{isDirectory ? (
					isExpanded ? (
						<FolderOpen size={14} className="text-emerald-400" />
					) : (
						<Folder size={14} className="text-emerald-500" />
					)
				) : (
					<File size={14} className={getFileColor(node.name)} />
				)}

				{/* Name */}
				<span className="text-xs truncate flex-1">{node.name}</span>

				{/* Size for files */}
				{!isDirectory && node.size !== undefined && (
					<span className="text-[10px] text-slate-500 ml-2">
						{formatBytes(node.size)}
					</span>
				)}
			</div>

			{/* Children */}
			{isDirectory && isExpanded && node.children && (
				<div>
					{node.children.map((child) => (
						<TreeNodeComponent
							key={child.path}
							node={child}
							depth={depth + 1}
							onFileSelect={onFileSelect}
							selectedFile={selectedFile}
							expandedPaths={expandedPaths}
							toggleExpanded={toggleExpanded}
						/>
					))}
				</div>
			)}
		</div>
	);
}

export function FileTreePreview({
	tree,
	onFileSelect,
	selectedFile,
	maxHeight = 300,
}: FileTreePreviewProps) {
	// Start with top-level directories expanded
	const [expandedPaths, setExpandedPaths] = useState<Set<string>>(() => {
		const initial = new Set<string>();
		initial.add(''); // Root
		if (tree.children) {
			tree.children.forEach((child) => {
				if (child.type === 'directory') {
					initial.add(child.path);
					// Also expand src
					if (child.name === 'src' && child.children) {
						child.children.forEach((subChild) => {
							if (subChild.type === 'directory') {
								initial.add(subChild.path);
							}
						});
					}
				}
			});
		}
		return initial;
	});

	const toggleExpanded = (path: string) => {
		setExpandedPaths((prev) => {
			const next = new Set(prev);
			if (next.has(path)) {
				next.delete(path);
			} else {
				next.add(path);
			}
			return next;
		});
	};

	// Calculate stats
	const stats = useMemo(() => {
		let fileCount = 0;
		let totalSize = 0;

		const countFiles = (node: FileTreeNode) => {
			if (node.type === 'file') {
				fileCount++;
				totalSize += node.size || 0;
			}
			if (node.children) {
				node.children.forEach(countFiles);
			}
		};

		countFiles(tree);
		return { fileCount, totalSize };
	}, [tree]);

	return (
		<div className="bg-slate-800/50 rounded-lg border border-slate-700 overflow-hidden">
			{/* Header */}
			<div className="flex items-center justify-between px-3 py-2 border-b border-slate-700 bg-slate-800/30">
				<span className="text-xs font-medium text-slate-400">File Tree</span>
				<span className="text-[10px] text-slate-500">
					{stats.fileCount} files • {formatBytes(stats.totalSize)}
				</span>
			</div>

			{/* Tree */}
			<div
				className="overflow-y-auto p-1 font-mono"
				style={{ maxHeight: `${maxHeight}px` }}
			>
				{tree.children && tree.children.length > 0 ? (
					tree.children.map((child) => (
						<TreeNodeComponent
							key={child.path}
							node={child}
							depth={0}
							onFileSelect={onFileSelect}
							selectedFile={selectedFile}
							expandedPaths={expandedPaths}
							toggleExpanded={toggleExpanded}
						/>
					))
				) : (
					<div className="text-center py-4 text-slate-500 text-xs">
						No files generated
					</div>
				)}
			</div>
		</div>
	);
}

export default FileTreePreview;
