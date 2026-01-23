import React, { useState } from 'react';
import {
	ChevronDown,
	ChevronRight,
	Copy,
	Check,
	MapPin,
	Cloud,
	MessageSquare,
	AlertTriangle,
	TrendingUp,
} from 'lucide-react';
import { ContentHooks, MarketContext } from '@/types/localKnowledge';

interface ContentHooksPanelProps {
	hooks: ContentHooks;
	marketContext: MarketContext;
}

interface HookSectionProps {
	title: string;
	icon: React.ReactNode;
	items: string[];
	defaultOpen?: boolean;
}

function HookSection({ title, icon, items, defaultOpen = false }: HookSectionProps) {
	const [isOpen, setIsOpen] = useState(defaultOpen);
	const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

	const handleCopy = async (text: string, index: number) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopiedIndex(index);
			setTimeout(() => setCopiedIndex(null), 2000);
		} catch (err) {
			console.error('Failed to copy:', err);
		}
	};

	if (items.length === 0) return null;

	return (
		<div className="bg-slate-800/30 rounded-lg overflow-hidden">
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-700/30 transition-colors"
			>
				{isOpen ? (
					<ChevronDown size={14} className="text-slate-400" />
				) : (
					<ChevronRight size={14} className="text-slate-400" />
				)}
				<span className="text-slate-400">{icon}</span>
				<span className="text-xs font-medium text-slate-300 flex-1 text-left">
					{title}
				</span>
				<span className="text-xs text-slate-500 bg-slate-700/50 px-1.5 py-0.5 rounded">
					{items.length}
				</span>
			</button>
			{isOpen && (
				<div className="px-3 pb-2 space-y-1">
					{items.map((item, index) => (
						<div
							key={index}
							className="group flex items-start gap-2 text-xs text-slate-300 bg-slate-800/50 rounded px-2 py-1.5 hover:bg-slate-700/50 transition-colors"
						>
							<span className="flex-1">{item}</span>
							<button
								onClick={() => handleCopy(item, index)}
								className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-white transition-opacity"
								title="Copy to clipboard"
							>
								{copiedIndex === index ? (
									<Check size={12} className="text-green-400" />
								) : (
									<Copy size={12} />
								)}
							</button>
						</div>
					))}
				</div>
			)}
		</div>
	);
}

export function ContentHooksPanel({ hooks, marketContext }: ContentHooksPanelProps) {
	const [showMarket, setShowMarket] = useState(false);

	return (
		<div className="flex flex-col gap-2">
			{/* Content Hooks */}
			<HookSection
				title="Local Phrases"
				icon={<MessageSquare size={12} />}
				items={hooks.localPhrases}
				defaultOpen={true}
			/>
			<HookSection
				title="Neighborhoods"
				icon={<MapPin size={12} />}
				items={hooks.neighborhoodNames}
			/>
			<HookSection
				title="Climate Impact"
				icon={<Cloud size={12} />}
				items={hooks.climateContext}
			/>
			<HookSection
				title="Common Issues"
				icon={<AlertTriangle size={12} />}
				items={hooks.categorySpecificIssues}
			/>

			{/* Market Context (collapsible) */}
			{(marketContext.pricePosition ||
				marketContext.competitionLevel ||
				marketContext.seasonalPatterns.length > 0) && (
				<div className="bg-slate-800/30 rounded-lg overflow-hidden">
					<button
						onClick={() => setShowMarket(!showMarket)}
						className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-700/30 transition-colors"
					>
						{showMarket ? (
							<ChevronDown size={14} className="text-slate-400" />
						) : (
							<ChevronRight size={14} className="text-slate-400" />
						)}
						<span className="text-slate-400">
							<TrendingUp size={12} />
						</span>
						<span className="text-xs font-medium text-slate-300 flex-1 text-left">
							Market Context
						</span>
					</button>
					{showMarket && (
						<div className="px-3 pb-2 space-y-2">
							{marketContext.pricePosition && (
								<div className="text-xs">
									<span className="text-slate-500">Pricing: </span>
									<span className="text-slate-300">{marketContext.pricePosition}</span>
								</div>
							)}
							{marketContext.competitionLevel && (
								<div className="text-xs">
									<span className="text-slate-500">Competition: </span>
									<span className="text-slate-300">{marketContext.competitionLevel}</span>
								</div>
							)}
							{marketContext.seasonalPatterns.length > 0 && (
								<div className="text-xs">
									<span className="text-slate-500">Seasonal: </span>
									<span className="text-slate-300">
										{marketContext.seasonalPatterns.join('; ')}
									</span>
								</div>
							)}
						</div>
					)}
				</div>
			)}
		</div>
	);
}

export default ContentHooksPanel;
