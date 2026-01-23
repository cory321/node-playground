import React from 'react';
import { AlertTriangle, Copy, Check } from 'lucide-react';
import { SEOOptimizedPackage } from '@/types/seoPackage';

interface LinkVisualizerProps {
	output: SEOOptimizedPackage;
}

/**
 * LinkVisualizer - Shows internal link statistics and orphan pages
 */
export function LinkVisualizer({ output }: LinkVisualizerProps) {
	const { stats, validation, pages } = output;
	const [copied, setCopied] = React.useState(false);

	// Get top linked pages
	const linkCounts = new Map<string, number>();
	for (const page of pages) {
		for (const link of page.internalLinks) {
			const count = linkCounts.get(link.targetPageId) || 0;
			linkCounts.set(link.targetPageId, count + 1);
		}
	}

	const topLinked = Array.from(linkCounts.entries())
		.sort((a, b) => b[1] - a[1])
		.slice(0, 5);

	// Export sitemap
	const handleCopySitemap = () => {
		navigator.clipboard.writeText(output.siteWide.sitemap.xml);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<div className="flex flex-col gap-3">
			{/* Link Statistics */}
			<div className="grid grid-cols-3 gap-2 text-xs">
				<div className="bg-slate-800/50 rounded px-2 py-1.5 text-center">
					<div className="text-teal-400 font-medium">
						{stats.totalInternalLinks}
					</div>
					<div className="text-slate-500">Total Links</div>
				</div>
				<div className="bg-slate-800/50 rounded px-2 py-1.5 text-center">
					<div className="text-teal-400 font-medium">
						{stats.avgLinksPerPage}
					</div>
					<div className="text-slate-500">Avg/Page</div>
				</div>
				<div className="bg-slate-800/50 rounded px-2 py-1.5 text-center">
					<div
						className={`font-medium ${
							validation.internalLinkCoverage >= 90
								? 'text-green-400'
								: validation.internalLinkCoverage >= 70
									? 'text-amber-400'
									: 'text-red-400'
						}`}
					>
						{validation.internalLinkCoverage}%
					</div>
					<div className="text-slate-500">Coverage</div>
				</div>
			</div>

			{/* Orphan Pages Warning */}
			{validation.orphanPages.length > 0 && (
				<div className="bg-amber-500/10 rounded p-2">
					<div className="flex items-center gap-1.5 text-xs text-amber-400 mb-1">
						<AlertTriangle size={12} />
						<span>Orphan Pages ({validation.orphanPages.length})</span>
					</div>
					<div className="max-h-16 overflow-y-auto text-[10px] text-slate-300 space-y-0.5">
						{validation.orphanPages.map((pageId) => {
							const page = pages.find((p) => p.pageId === pageId);
							return (
								<div key={pageId} className="truncate">
									{page?.url || pageId}
								</div>
							);
						})}
					</div>
				</div>
			)}

			{/* Top Linked Pages */}
			{topLinked.length > 0 && (
				<div>
					<div className="text-xs text-slate-400 mb-1">Most Linked Pages</div>
					<div className="space-y-0.5">
						{topLinked.map(([pageId, count]) => {
							const page = pages.find((p) => p.pageId === pageId);
							return (
								<div
									key={pageId}
									className="flex items-center justify-between text-[10px] bg-slate-800/30 px-2 py-1 rounded"
								>
									<span className="text-slate-300 truncate max-w-[70%]">
										{page?.url || pageId}
									</span>
									<span className="text-teal-400 font-medium">
										{count} links
									</span>
								</div>
							);
						})}
					</div>
				</div>
			)}

			{/* Sitemap Export */}
			<div className="flex items-center gap-2">
				<button
					onClick={handleCopySitemap}
					className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 bg-slate-700/50 hover:bg-slate-700 text-xs text-slate-300 rounded transition-colors"
				>
					{copied ? <Check size={12} /> : <Copy size={12} />}
					{copied ? 'Copied!' : 'Copy sitemap.xml'}
				</button>
				<div className="text-[10px] text-slate-500">
					{output.siteWide.sitemap.urls.length} URLs
				</div>
			</div>
		</div>
	);
}

export default LinkVisualizer;
