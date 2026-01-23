import React, { useState } from 'react';
import {
	ChevronDown,
	ChevronRight,
	FileText,
	Layers,
	Link,
	Calendar,
	Building,
} from 'lucide-react';
import { SitePlannerOutput, PageBrief, PageType } from '@/types/sitePlanner';

interface SitePlannerPreviewProps {
	output: SitePlannerOutput;
}

export function SitePlannerPreview({ output }: SitePlannerPreviewProps) {
	const [expandedSections, setExpandedSections] = useState<Set<string>>(
		new Set(['brand'])
	);

	const toggleSection = (section: string) => {
		const newExpanded = new Set(expandedSections);
		if (newExpanded.has(section)) {
			newExpanded.delete(section);
		} else {
			newExpanded.add(section);
		}
		setExpandedSections(newExpanded);
	};

	// Group pages by type
	const pagesByType = output.pages.reduce(
		(acc, page) => {
			if (!acc[page.type]) {
				acc[page.type] = [];
			}
			acc[page.type].push(page);
			return acc;
		},
		{} as Record<PageType, PageBrief[]>
	);

	return (
		<div className="flex flex-col gap-2 mt-1">
			{/* Brand Section */}
			<CollapsibleSection
				title="Brand Identity"
				icon={<Building size={12} />}
				isExpanded={expandedSections.has('brand')}
				onToggle={() => toggleSection('brand')}
			>
				<div className="flex flex-col gap-2">
					<div className="text-white font-medium">{output.brand.name}</div>
					<div className="text-slate-400 text-xs italic">
						"{output.brand.tagline}"
					</div>
					<div className="text-blue-400 text-xs">{output.brand.domain}</div>
					<div className="flex flex-wrap gap-1 mt-1">
						{output.brand.voiceTone.personality.map((trait) => (
							<span
								key={trait}
								className="px-2 py-0.5 bg-slate-700/50 text-slate-300 rounded text-[10px]"
							>
								{trait}
							</span>
						))}
					</div>
				</div>
			</CollapsibleSection>

			{/* Pages Section */}
			<CollapsibleSection
				title={`Pages (${output.pages.length})`}
				icon={<FileText size={12} />}
				isExpanded={expandedSections.has('pages')}
				onToggle={() => toggleSection('pages')}
			>
				<div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
					{Object.entries(pagesByType).map(([type, pages]) => (
						<div key={type}>
							<div className="text-xs text-slate-400 font-medium mb-1 capitalize">
								{type.replace(/_/g, ' ')} ({pages.length})
							</div>
							<div className="flex flex-col gap-1 pl-2">
								{pages.slice(0, 3).map((page) => (
									<PageRow key={page.id} page={page} />
								))}
								{pages.length > 3 && (
									<div className="text-[10px] text-slate-500">
										+{pages.length - 3} more
									</div>
								)}
							</div>
						</div>
					))}
				</div>
			</CollapsibleSection>

			{/* Clusters Section */}
			<CollapsibleSection
				title={`Content Clusters (${output.contentClusters.length})`}
				icon={<Layers size={12} />}
				isExpanded={expandedSections.has('clusters')}
				onToggle={() => toggleSection('clusters')}
			>
				<div className="flex flex-col gap-2">
					{output.contentClusters.map((cluster) => (
						<div key={cluster.name} className="bg-slate-800/30 rounded p-2">
							<div className="text-white text-xs font-medium">
								{cluster.name}
							</div>
							<div className="text-[10px] text-slate-500 mt-1">
								Pillar: {cluster.pillarPageId}
							</div>
							<div className="text-[10px] text-slate-500">
								{cluster.supportingPageIds.length} supporting pages
							</div>
						</div>
					))}
				</div>
			</CollapsibleSection>

			{/* Launch Phases Section */}
			<CollapsibleSection
				title="Launch Phases"
				icon={<Calendar size={12} />}
				isExpanded={expandedSections.has('phases')}
				onToggle={() => toggleSection('phases')}
			>
				<div className="flex flex-col gap-2">
					{output.launchPhases.map((phase) => (
						<div key={phase.phase} className="flex items-center gap-2">
							<span
								className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
									phase.phase === 1
										? 'bg-green-500/20 text-green-400'
										: phase.phase === 2
											? 'bg-blue-500/20 text-blue-400'
											: 'bg-purple-500/20 text-purple-400'
								}`}
							>
								{phase.phase}
							</span>
							<div className="flex-1">
								<div className="text-white text-xs font-medium">
									{phase.name}
								</div>
								<div className="text-[10px] text-slate-500">
									{phase.pageIds.length} pages
								</div>
							</div>
						</div>
					))}
				</div>
			</CollapsibleSection>

			{/* Linking Rules Section */}
			<CollapsibleSection
				title={`Linking Rules (${output.internalLinking.rules.length})`}
				icon={<Link size={12} />}
				isExpanded={expandedSections.has('linking')}
				onToggle={() => toggleSection('linking')}
			>
				<div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
					{output.internalLinking.rules.map((rule, i) => (
						<div
							key={i}
							className="flex items-center gap-2 text-[10px] text-slate-400"
						>
							<span className="text-slate-500 capitalize">
								{rule.fromType.replace(/_/g, ' ')}
							</span>
							<span className="text-slate-600">→</span>
							<span className="text-blue-400 capitalize">
								{rule.toType.replace(/_/g, ' ')}
							</span>
							{rule.required && (
								<span className="text-amber-400 text-[8px]">required</span>
							)}
						</div>
					))}
				</div>
			</CollapsibleSection>

			{/* Meta info */}
			<div className="text-[10px] text-slate-500 text-center mt-1">
				Generated {new Date(output.meta.generatedAt).toLocaleString()}
			</div>
		</div>
	);
}

// Collapsible section component
function CollapsibleSection({
	title,
	icon,
	isExpanded,
	onToggle,
	children,
}: {
	title: string;
	icon: React.ReactNode;
	isExpanded: boolean;
	onToggle: () => void;
	children: React.ReactNode;
}) {
	return (
		<div className="bg-slate-800/50 rounded-lg overflow-hidden">
			<button
				onClick={onToggle}
				className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-700/30 transition-colors"
			>
				{isExpanded ? (
					<ChevronDown size={12} className="text-slate-400" />
				) : (
					<ChevronRight size={12} className="text-slate-400" />
				)}
				<span className="text-blue-400">{icon}</span>
				<span className="text-xs text-white font-medium">{title}</span>
			</button>
			{isExpanded && <div className="px-3 pb-3">{children}</div>}
		</div>
	);
}

// Page row component
function PageRow({ page }: { page: PageBrief }) {
	const priorityColors = {
		1: 'bg-green-500/20 text-green-400',
		2: 'bg-blue-500/20 text-blue-400',
		3: 'bg-purple-500/20 text-purple-400',
	};

	return (
		<div className="flex items-center gap-2 text-[11px]">
			<span
				className={`w-4 h-4 rounded flex items-center justify-center text-[9px] font-bold ${priorityColors[page.priority]}`}
			>
				{page.priority}
			</span>
			<span className="text-slate-300 truncate flex-1" title={page.url}>
				{page.url}
			</span>
			<span className="text-slate-500">{page.content.targetWordCount}w</span>
		</div>
	);
}

export default SitePlannerPreview;
