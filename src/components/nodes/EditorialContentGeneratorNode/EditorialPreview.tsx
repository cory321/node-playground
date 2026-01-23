import React, { useState, useMemo } from 'react';
import {
	FileText,
	ChevronDown,
	ChevronRight,
	Copy,
	Check,
	ExternalLink,
	MapPin,
	Star,
} from 'lucide-react';
import {
	GeneratedEditorialContent,
	GeneratedContentPage,
	getContentTypeLabel,
} from '@/types/editorialContent';
import { EditorialPageType } from '@/types/nodes';

interface EditorialPreviewProps {
	content: GeneratedEditorialContent;
	onExport?: (format: 'json' | 'markdown') => void;
}

// Quality score color
function getQualityColor(score: number): string {
	if (score >= 80) return 'text-green-400';
	if (score >= 60) return 'text-yellow-400';
	return 'text-red-400';
}

// Quality score label
function getQualityLabel(score: number): string {
	if (score >= 80) return 'High';
	if (score >= 60) return 'Medium';
	return 'Low';
}

export function EditorialPreview({
	content,
	onExport,
}: EditorialPreviewProps) {
	const [selectedType, setSelectedType] = useState<EditorialPageType | 'all'>(
		'all'
	);
	const [expandedPage, setExpandedPage] = useState<string | null>(null);
	const [copied, setCopied] = useState(false);

	// Get unique content types from generated pages
	const availableTypes = useMemo(() => {
		const types = new Set<EditorialPageType>();
		content.pages.forEach((page) => types.add(page.type));
		return Array.from(types);
	}, [content.pages]);

	// Filter pages by selected type
	const filteredPages = useMemo(() => {
		if (selectedType === 'all') return content.pages;
		return content.pages.filter((page) => page.type === selectedType);
	}, [content.pages, selectedType]);

	// Copy JSON to clipboard
	const handleCopyJson = async () => {
		try {
			await navigator.clipboard.writeText(JSON.stringify(content, null, 2));
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (error) {
			console.error('Failed to copy:', error);
		}
	};

	// Render page card
	const renderPageCard = (page: GeneratedContentPage) => {
		const isExpanded = expandedPage === page.pageId;

		return (
			<div
				key={page.pageId}
				className="bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden"
			>
				{/* Page header */}
				<button
					onClick={() =>
						setExpandedPage(isExpanded ? null : page.pageId)
					}
					className="w-full flex items-center justify-between p-2 hover:bg-slate-700/30 transition-colors"
				>
					<div className="flex items-center gap-2 min-w-0">
						{isExpanded ? (
							<ChevronDown size={14} className="text-slate-400 flex-shrink-0" />
						) : (
							<ChevronRight size={14} className="text-slate-400 flex-shrink-0" />
						)}
						<FileText size={14} className="text-emerald-400 flex-shrink-0" />
						<span className="text-xs text-slate-300 truncate">
							{page.content.headline}
						</span>
					</div>

					<div className="flex items-center gap-2 flex-shrink-0">
						{/* Word count */}
						<span className="text-[10px] text-slate-500">
							{page.wordCount.toLocaleString()} words
						</span>

						{/* Quality score */}
						<div
							className={`flex items-center gap-1 ${getQualityColor(page.qualityScore)}`}
						>
							<Star size={10} />
							<span className="text-[10px]">{page.qualityScore}</span>
						</div>

						{/* Local references */}
						<div className="flex items-center gap-1 text-blue-400">
							<MapPin size={10} />
							<span className="text-[10px]">
								{page.localReferences.length}
							</span>
						</div>
					</div>
				</button>

				{/* Expanded content */}
				{isExpanded && (
					<div className="border-t border-slate-700/50 p-3 space-y-3">
						{/* URL */}
						<div className="flex items-center gap-2 text-xs">
							<span className="text-slate-500">URL:</span>
							<span className="text-emerald-400 font-mono">
								{page.url}
							</span>
						</div>

						{/* Type badge */}
						<div className="flex items-center gap-2">
							<span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] rounded">
								{getContentTypeLabel(page.type)}
							</span>
							<span
								className={`px-2 py-0.5 text-[10px] rounded ${
									page.qualityScore >= 80
										? 'bg-green-500/20 text-green-400'
										: page.qualityScore >= 60
											? 'bg-yellow-500/20 text-yellow-400'
											: 'bg-red-500/20 text-red-400'
								}`}
							>
								{getQualityLabel(page.qualityScore)} Quality
							</span>
						</div>

						{/* Introduction preview */}
						<div className="space-y-1">
							<span className="text-[10px] text-slate-500 uppercase tracking-wider">
								Introduction
							</span>
							<p className="text-xs text-slate-400 line-clamp-3">
								{page.content.introduction}
							</p>
						</div>

						{/* Sections */}
						<div className="space-y-1">
							<span className="text-[10px] text-slate-500 uppercase tracking-wider">
								Sections ({page.content.sections.length})
							</span>
							<div className="space-y-1">
								{page.content.sections.map((section, idx) => (
									<div
										key={section.id}
										className="flex items-center gap-2 text-xs text-slate-400"
									>
										<span className="text-slate-600">{idx + 1}.</span>
										<span className="truncate">{section.heading}</span>
									</div>
								))}
							</div>
						</div>

						{/* FAQs count */}
						{page.content.faq.length > 0 && (
							<div className="text-xs text-slate-400">
								{page.content.faq.length} FAQ
								{page.content.faq.length !== 1 ? 's' : ''}
							</div>
						)}

						{/* Local references */}
						{page.localReferences.length > 0 && (
							<div className="space-y-1">
								<span className="text-[10px] text-slate-500 uppercase tracking-wider">
									Local References
								</span>
								<div className="flex flex-wrap gap-1">
									{page.localReferences.slice(0, 5).map((ref, idx) => (
										<span
											key={idx}
											className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] rounded"
										>
											{ref}
										</span>
									))}
									{page.localReferences.length > 5 && (
										<span className="text-[10px] text-slate-500">
											+{page.localReferences.length - 5} more
										</span>
									)}
								</div>
							</div>
						)}
					</div>
				)}
			</div>
		);
	};

	return (
		<div className="space-y-3">
			{/* Summary stats */}
			<div className="flex items-center justify-between text-xs">
				<div className="flex items-center gap-3">
					<span className="text-slate-400">
						<span className="text-emerald-400 font-medium">
							{content.pages.length}
						</span>{' '}
						pages
					</span>
					<span className="text-slate-400">
						<span className="text-emerald-400 font-medium">
							{content.totalWordCount.toLocaleString()}
						</span>{' '}
						words
					</span>
					<span className="text-slate-400">
						<span className="text-blue-400 font-medium">
							{content.totalLocalReferences}
						</span>{' '}
						local refs
					</span>
				</div>

				{/* Copy button */}
				<button
					onClick={handleCopyJson}
					className="flex items-center gap-1 px-2 py-1 bg-slate-700/50 hover:bg-slate-700 rounded text-[10px] text-slate-400 hover:text-slate-300 transition-colors"
				>
					{copied ? (
						<>
							<Check size={10} className="text-green-400" />
							<span>Copied</span>
						</>
					) : (
						<>
							<Copy size={10} />
							<span>Copy JSON</span>
						</>
					)}
				</button>
			</div>

			{/* Type filter */}
			{availableTypes.length > 1 && (
				<div className="flex flex-wrap gap-1">
					<button
						onClick={() => setSelectedType('all')}
						className={`px-2 py-1 text-[10px] rounded transition-colors ${
							selectedType === 'all'
								? 'bg-emerald-500/20 text-emerald-400'
								: 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
						}`}
					>
						All ({content.pages.length})
					</button>
					{availableTypes.map((type) => {
						const count = content.pages.filter(
							(p) => p.type === type
						).length;
						return (
							<button
								key={type}
								onClick={() => setSelectedType(type)}
								className={`px-2 py-1 text-[10px] rounded transition-colors ${
									selectedType === type
										? 'bg-emerald-500/20 text-emerald-400'
										: 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
								}`}
							>
								{getContentTypeLabel(type)} ({count})
							</button>
						);
					})}
				</div>
			)}

			{/* Pages list */}
			<div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
				{filteredPages.map(renderPageCard)}
			</div>

			{/* Empty state */}
			{filteredPages.length === 0 && (
				<div className="text-center py-4 text-xs text-slate-500">
					No pages match the selected filter
				</div>
			)}
		</div>
	);
}

export default EditorialPreview;
