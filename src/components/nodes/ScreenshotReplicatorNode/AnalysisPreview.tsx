import React from 'react';
import { Layers, Type, Palette, Image as ImageIcon } from 'lucide-react';
import { ScreenshotAnalysis, DiscoveredSection } from '@/types/screenshotReplicator';

interface AnalysisPreviewProps {
	analysis: ScreenshotAnalysis;
}

export function AnalysisPreview({ analysis }: AnalysisPreviewProps) {
	const { sections, assets, designTokens, meta } = analysis;

	return (
		<div className="space-y-3">
			{/* Confidence Score */}
			<div className="flex items-center justify-between">
				<span className="text-[10px] uppercase tracking-wider text-slate-500">
					Confidence
				</span>
				<div className="flex items-center gap-2">
					<div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
						<div
							className={`h-full rounded-full ${
								meta.analysisConfidence >= 80
									? 'bg-green-500'
									: meta.analysisConfidence >= 60
									? 'bg-yellow-500'
									: 'bg-red-500'
							}`}
							style={{ width: `${meta.analysisConfidence}%` }}
						/>
					</div>
					<span className="text-[10px] text-slate-400">{meta.analysisConfidence}%</span>
				</div>
			</div>

			{/* Sections List */}
			<div>
				<div className="flex items-center gap-1 mb-2">
					<Layers size={12} className="text-violet-400" />
					<span className="text-[10px] uppercase tracking-wider text-slate-400">
						Sections ({sections.length})
					</span>
				</div>
				<div className="space-y-1">
					{sections.map((section, i) => (
						<SectionItem key={i} section={section} />
					))}
				</div>
			</div>

			{/* Design Tokens Summary */}
			<div>
				<div className="flex items-center gap-1 mb-2">
					<Palette size={12} className="text-purple-400" />
					<span className="text-[10px] uppercase tracking-wider text-slate-400">
						Design Tokens
					</span>
				</div>
				<div className="grid grid-cols-4 gap-1">
					<ColorSwatch color={designTokens.colors.primary} label="Primary" />
					{designTokens.colors.secondary && (
						<ColorSwatch color={designTokens.colors.secondary} label="Secondary" />
					)}
					<ColorSwatch color={designTokens.colors.background} label="BG" />
					<ColorSwatch color={designTokens.colors.text} label="Text" />
				</div>
			</div>

			{/* Assets Summary */}
			<div>
				<div className="flex items-center gap-1 mb-2">
					<ImageIcon size={12} className="text-pink-400" />
					<span className="text-[10px] uppercase tracking-wider text-slate-400">
						Assets ({assets.length})
					</span>
				</div>
				<div className="flex flex-wrap gap-1">
					{getAssetTypeCounts(assets).map(({ type, count }) => (
						<span
							key={type}
							className="px-1.5 py-0.5 bg-slate-700 rounded text-[9px] text-slate-300"
						>
							{count} {type}
						</span>
					))}
				</div>
			</div>

			{/* Text Stats */}
			<div>
				<div className="flex items-center gap-1 mb-2">
					<Type size={12} className="text-blue-400" />
					<span className="text-[10px] uppercase tracking-wider text-slate-400">
						Text Content
					</span>
				</div>
				<span className="text-[10px] text-slate-300">
					{meta.totalWords.toLocaleString()} words extracted
				</span>
			</div>
		</div>
	);
}

// Helper component for section items
function SectionItem({ section }: { section: DiscoveredSection }) {
	const textCount = 
		section.text.headings.length +
		section.text.paragraphs.length +
		section.text.buttons.length +
		section.text.links.length;

	return (
		<div className="flex items-center justify-between px-2 py-1 bg-slate-700/50 rounded text-[10px]">
			<span className="text-slate-300">{section.name}</span>
			<div className="flex items-center gap-2 text-slate-500">
				<span>{section.assetIds.length} assets</span>
				<span>{textCount} texts</span>
			</div>
		</div>
	);
}

// Helper component for color swatches
function ColorSwatch({ color, label }: { color: string; label: string }) {
	return (
		<div className="flex flex-col items-center gap-0.5">
			<div
				className="w-6 h-6 rounded border border-slate-600"
				style={{ backgroundColor: color }}
			/>
			<span className="text-[8px] text-slate-500">{label}</span>
		</div>
	);
}

// Helper to count assets by type
function getAssetTypeCounts(assets: ScreenshotAnalysis['assets']) {
	const counts: Record<string, number> = {};
	for (const asset of assets) {
		counts[asset.type] = (counts[asset.type] || 0) + 1;
	}
	return Object.entries(counts).map(([type, count]) => ({ type, count }));
}

export default AnalysisPreview;
