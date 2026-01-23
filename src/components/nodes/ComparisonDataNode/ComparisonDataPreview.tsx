import React, { useState } from 'react';
import { Table, Trophy, DollarSign, BarChart3 } from 'lucide-react';
import { GeneratedComparisonData } from '@/types/comparisonPage';
import { ComparisonTablePreview } from './ComparisonTablePreview';
import { WinnerBadge } from './WinnerBadge';

type PreviewTab = 'table' | 'winners' | 'stats';

interface ComparisonDataPreviewProps {
	output: GeneratedComparisonData;
}

/**
 * ComparisonDataPreview - Full preview with tabs for different views
 */
export function ComparisonDataPreview({ output }: ComparisonDataPreviewProps) {
	const [activeTab, setActiveTab] = useState<PreviewTab>('table');

	const firstPage = output.comparisonPages[0];
	const stats = output.marketStats;

	const tabs: { id: PreviewTab; label: string; icon: React.ReactNode }[] = [
		{ id: 'table', label: 'Table', icon: <Table size={12} /> },
		{ id: 'winners', label: 'Winners', icon: <Trophy size={12} /> },
		{ id: 'stats', label: 'Stats', icon: <BarChart3 size={12} /> },
	];

	return (
		<div className="flex flex-col gap-2 mt-2">
			{/* Tabs */}
			<div className="flex gap-1 p-0.5 bg-slate-800/50 rounded-lg">
				{tabs.map((tab) => (
					<button
						key={tab.id}
						onClick={() => setActiveTab(tab.id)}
						className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded text-xs font-medium transition-all ${
							activeTab === tab.id
								? 'bg-red-500 text-white'
								: 'text-slate-400 hover:text-white hover:bg-slate-700/50'
						}`}
					>
						{tab.icon}
						{tab.label}
					</button>
				))}
			</div>

			{/* Tab Content */}
			<div className="min-h-[120px]">
				{activeTab === 'table' && firstPage && (
					<ComparisonTablePreview table={firstPage.content.comparisonTable} />
				)}

				{activeTab === 'winners' && firstPage && (
					<div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto">
						{firstPage.content.winners.length > 0 ? (
							firstPage.content.winners
								.slice(0, 3)
								.map((winner) => (
									<WinnerBadge key={winner.category} winner={winner} compact />
								))
						) : (
							<div className="text-xs text-slate-500 text-center py-4">
								No winners selected
							</div>
						)}
						{firstPage.content.winners.length > 3 && (
							<div className="text-xs text-slate-500 text-center">
								+{firstPage.content.winners.length - 3} more
							</div>
						)}
					</div>
				)}

				{activeTab === 'stats' && (
					<div className="grid grid-cols-2 gap-2">
						<StatCard
							label="Providers"
							value={stats.totalProviders.toString()}
							icon={<BarChart3 size={12} className="text-red-400" />}
						/>
						<StatCard
							label="Avg Rating"
							value={stats.averageRating.toFixed(1)}
							icon={<Trophy size={12} className="text-amber-400" />}
						/>
						<StatCard
							label="Avg Trust"
							value={`${stats.averageTrustScore}/100`}
							icon={<BarChart3 size={12} className="text-green-400" />}
						/>
						<StatCard
							label="Licensed"
							value={`${stats.licenseComplianceRate}%`}
							icon={<DollarSign size={12} className="text-blue-400" />}
						/>
					</div>
				)}
			</div>

			{/* Summary Footer */}
			<div className="text-xs text-slate-500 border-t border-slate-800 pt-2 mt-1">
				{output.comparisonPages.length} comparison page
				{output.comparisonPages.length !== 1 ? 's' : ''}
				{output.pricingPages.length > 0 && (
					<>
						{' '}
						• {output.pricingPages.length} pricing page
						{output.pricingPages.length !== 1 ? 's' : ''}
					</>
				)}
			</div>
		</div>
	);
}

interface StatCardProps {
	label: string;
	value: string;
	icon: React.ReactNode;
}

function StatCard({ label, value, icon }: StatCardProps) {
	return (
		<div className="flex items-center gap-2 p-2 bg-slate-800/50 rounded-lg">
			{icon}
			<div className="flex-1 min-w-0">
				<div className="text-xs text-slate-400">{label}</div>
				<div className="text-sm font-medium text-white">{value}</div>
			</div>
		</div>
	);
}

export default ComparisonDataPreview;
