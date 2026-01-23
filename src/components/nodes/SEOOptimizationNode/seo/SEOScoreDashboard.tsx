import {
	CheckCircle,
	AlertCircle,
	AlertTriangle,
	Info,
	Link,
	FileCode,
} from 'lucide-react';
import { SEOOptimizedPackage } from '@/types/seoPackage';

interface SEOScoreDashboardProps {
	output: SEOOptimizedPackage;
}

/**
 * Get score color based on value
 */
function getScoreColor(score: number): string {
	if (score >= 80) return 'text-green-400';
	if (score >= 60) return 'text-yellow-400';
	if (score >= 40) return 'text-orange-400';
	return 'text-red-400';
}

function getScoreBgColor(score: number): string {
	if (score >= 80) return 'bg-green-500/20';
	if (score >= 60) return 'bg-yellow-500/20';
	if (score >= 40) return 'bg-orange-500/20';
	return 'bg-red-500/20';
}

/**
 * SEOScoreDashboard - Shows overall SEO health and statistics
 */
export function SEOScoreDashboard({ output }: SEOScoreDashboardProps) {
	const { stats, validation } = output;

	// Count issues by severity
	const errorCount = output.pages.reduce(
		(sum, p) => sum + p.issues.filter((i) => i.severity === 'error').length,
		0,
	);
	const warningCount = output.pages.reduce(
		(sum, p) => sum + p.issues.filter((i) => i.severity === 'warning').length,
		0,
	);
	const infoCount = output.pages.reduce(
		(sum, p) => sum + p.issues.filter((i) => i.severity === 'info').length,
		0,
	);

	return (
		<div className="flex flex-col gap-3">
			{/* Overall Score */}
			<div className="flex items-center gap-3">
				<div
					className={`w-16 h-16 rounded-xl flex items-center justify-center ${getScoreBgColor(
						stats.avgSeoScore,
					)}`}
				>
					<span
						className={`text-2xl font-bold ${getScoreColor(stats.avgSeoScore)}`}
					>
						{stats.avgSeoScore}
					</span>
				</div>
				<div className="flex-1">
					<div className="text-sm font-medium text-white">SEO Score</div>
					<div className="text-xs text-slate-400">
						Average across {stats.totalPages} pages
					</div>
				</div>
			</div>

			{/* Validation Status */}
			<div className="grid grid-cols-2 gap-2 text-xs">
				<div
					className={`flex items-center gap-1.5 px-2 py-1.5 rounded ${
						validation.allPagesHaveTitle
							? 'bg-green-500/10 text-green-400'
							: 'bg-red-500/10 text-red-400'
					}`}
				>
					{validation.allPagesHaveTitle ? (
						<CheckCircle size={12} />
					) : (
						<AlertCircle size={12} />
					)}
					<span>Titles</span>
				</div>
				<div
					className={`flex items-center gap-1.5 px-2 py-1.5 rounded ${
						validation.allPagesHaveDescription
							? 'bg-green-500/10 text-green-400'
							: 'bg-red-500/10 text-red-400'
					}`}
				>
					{validation.allPagesHaveDescription ? (
						<CheckCircle size={12} />
					) : (
						<AlertCircle size={12} />
					)}
					<span>Descriptions</span>
				</div>
				<div
					className={`flex items-center gap-1.5 px-2 py-1.5 rounded ${
						validation.allPagesHaveCanonical
							? 'bg-green-500/10 text-green-400'
							: 'bg-red-500/10 text-red-400'
					}`}
				>
					{validation.allPagesHaveCanonical ? (
						<CheckCircle size={12} />
					) : (
						<AlertCircle size={12} />
					)}
					<span>Canonicals</span>
				</div>
				<div
					className={`flex items-center gap-1.5 px-2 py-1.5 rounded ${
						validation.allPagesHaveSchema
							? 'bg-green-500/10 text-green-400'
							: 'bg-amber-500/10 text-amber-400'
					}`}
				>
					{validation.allPagesHaveSchema ? (
						<CheckCircle size={12} />
					) : (
						<AlertTriangle size={12} />
					)}
					<span>Schema</span>
				</div>
			</div>

			{/* Statistics */}
			<div className="grid grid-cols-3 gap-2 text-xs">
				<div className="bg-slate-800/50 rounded px-2 py-1.5 text-center">
					<div className="text-teal-400 font-medium">{stats.totalPages}</div>
					<div className="text-slate-500">Pages</div>
				</div>
				<div className="bg-slate-800/50 rounded px-2 py-1.5 text-center">
					<div className="text-teal-400 font-medium">
						{stats.totalInternalLinks}
					</div>
					<div className="text-slate-500">Links</div>
				</div>
				<div className="bg-slate-800/50 rounded px-2 py-1.5 text-center">
					<div className="text-teal-400 font-medium">
						{validation.internalLinkCoverage}%
					</div>
					<div className="text-slate-500">Coverage</div>
				</div>
			</div>

			{/* Issues Summary */}
			<div className="flex items-center gap-2 text-xs">
				{errorCount > 0 && (
					<div className="flex items-center gap-1 bg-red-500/10 text-red-400 px-2 py-1 rounded">
						<AlertCircle size={10} />
						<span>{errorCount} errors</span>
					</div>
				)}
				{warningCount > 0 && (
					<div className="flex items-center gap-1 bg-amber-500/10 text-amber-400 px-2 py-1 rounded">
						<AlertTriangle size={10} />
						<span>{warningCount} warnings</span>
					</div>
				)}
				{infoCount > 0 && (
					<div className="flex items-center gap-1 bg-blue-500/10 text-blue-400 px-2 py-1 rounded">
						<Info size={10} />
						<span>{infoCount} info</span>
					</div>
				)}
				{errorCount === 0 && warningCount === 0 && (
					<div className="flex items-center gap-1 bg-green-500/10 text-green-400 px-2 py-1 rounded">
						<CheckCircle size={10} />
						<span>No issues</span>
					</div>
				)}
			</div>

			{/* Orphan Pages Warning */}
			{validation.orphanPages.length > 0 && (
				<div className="flex items-start gap-2 bg-amber-500/10 text-amber-400 px-2 py-1.5 rounded text-xs">
					<Link size={12} className="mt-0.5 shrink-0" />
					<span>
						{validation.orphanPages.length} orphan page
						{validation.orphanPages.length > 1 ? 's' : ''} (no incoming links)
					</span>
				</div>
			)}

			{/* Schema Types */}
			{stats.schemaTypesUsed.length > 0 && (
				<div className="flex flex-wrap gap-1">
					{stats.schemaTypesUsed.slice(0, 6).map((type) => (
						<div
							key={type}
							className="flex items-center gap-1 bg-slate-700/50 text-slate-300 px-1.5 py-0.5 rounded text-[10px]"
						>
							<FileCode size={9} />
							{type}
						</div>
					))}
					{stats.schemaTypesUsed.length > 6 && (
						<div className="bg-slate-700/50 text-slate-400 px-1.5 py-0.5 rounded text-[10px]">
							+{stats.schemaTypesUsed.length - 6} more
						</div>
					)}
				</div>
			)}
		</div>
	);
}

export default SEOScoreDashboard;
