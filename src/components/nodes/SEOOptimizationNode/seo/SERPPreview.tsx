import { useState } from 'react';
import { ChevronDown, ExternalLink } from 'lucide-react';
import { SEOOptimizedPage } from '@/types/seoPackage';

interface SERPPreviewProps {
	pages: SEOOptimizedPage[];
}

/**
 * Get length indicator color
 */
function getLengthColor(length: number, min: number, max: number): string {
	if (length < min) return 'text-amber-400';
	if (length > max) return 'text-red-400';
	return 'text-green-400';
}

/**
 * SERPPreview - Shows how pages will appear in Google search results
 */
export function SERPPreview({ pages }: SERPPreviewProps) {
	const [selectedIndex, setSelectedIndex] = useState(0);

	if (pages.length === 0) {
		return (
			<div className="text-xs text-slate-500 text-center py-4">
				No pages to preview
			</div>
		);
	}

	const page = pages[selectedIndex];

	return (
		<div className="flex flex-col gap-2">
			{/* Page Selector */}
			<div className="relative">
				<select
					value={selectedIndex}
					onChange={(e) => setSelectedIndex(Number(e.target.value))}
					className="w-full bg-slate-800/50 border border-slate-700 rounded px-2 py-1.5 text-xs text-white appearance-none cursor-pointer pr-6"
				>
					{pages.map((p, i) => (
						<option key={p.pageId} value={i}>
							{p.url} ({p.type})
						</option>
					))}
				</select>
				<ChevronDown
					size={12}
					className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
				/>
			</div>

			{/* SERP Preview */}
			<div className="bg-white rounded-lg p-3 text-left">
				{/* Title */}
				<div className="text-[#1a0dab] text-sm font-medium leading-tight hover:underline cursor-pointer truncate">
					{page.meta.title}
				</div>

				{/* URL */}
				<div className="flex items-center gap-1 text-[#006621] text-xs mt-0.5 truncate">
					<span>{page.meta.canonical}</span>
					<ExternalLink size={10} className="shrink-0" />
				</div>

				{/* Description */}
				<div className="text-[#545454] text-xs mt-1 line-clamp-2">
					{page.meta.description}
				</div>
			</div>

			{/* Character Counts */}
			<div className="flex justify-between text-[10px]">
				<div className="flex items-center gap-2">
					<span className="text-slate-500">Title:</span>
					<span className={getLengthColor(page.meta.titleLength, 30, 60)}>
						{page.meta.titleLength}/60
					</span>
				</div>
				<div className="flex items-center gap-2">
					<span className="text-slate-500">Description:</span>
					<span
						className={getLengthColor(page.meta.descriptionLength, 120, 160)}
					>
						{page.meta.descriptionLength}/160
					</span>
				</div>
			</div>

			{/* Quick Stats */}
			<div className="flex gap-2 text-[10px]">
				<div className="bg-slate-800/50 px-2 py-1 rounded flex items-center gap-1">
					<span className="text-slate-500">Schema:</span>
					<span className="text-teal-400">{page.schema.length}</span>
				</div>
				<div className="bg-slate-800/50 px-2 py-1 rounded flex items-center gap-1">
					<span className="text-slate-500">Links:</span>
					<span className="text-teal-400">{page.internalLinks.length}</span>
				</div>
				<div className="bg-slate-800/50 px-2 py-1 rounded flex items-center gap-1">
					<span className="text-slate-500">Score:</span>
					<span className={getLengthColor(page.seoScore, 70, 999)}>
						{page.seoScore}
					</span>
				</div>
			</div>
		</div>
	);
}

export default SERPPreview;
