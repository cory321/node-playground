import React, { useState } from 'react';
import {
	ChevronDown,
	ChevronRight,
	Star,
	MapPin,
	Award,
	FileText,
	Hash,
	Edit2,
	Check,
} from 'lucide-react';
import { GeneratedProviderProfile } from '@/types/generatedProfile';
import { OurTakeEditor } from './OurTakeEditor';

interface ProfilePreviewProps {
	profiles: GeneratedProviderProfile[];
	onUpdateProfile: (
		index: number,
		updates: Partial<GeneratedProviderProfile>
	) => void;
}

interface CollapsibleSectionProps {
	title: string;
	icon: React.ReactNode;
	defaultOpen?: boolean;
	children: React.ReactNode;
	badge?: string | number;
}

function CollapsibleSection({
	title,
	icon,
	defaultOpen = false,
	children,
	badge,
}: CollapsibleSectionProps) {
	const [isOpen, setIsOpen] = useState(defaultOpen);

	return (
		<div className="border border-slate-700/50 rounded-lg overflow-hidden">
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="w-full flex items-center gap-2 px-3 py-2 bg-slate-800/50 hover:bg-slate-800 transition-colors text-left"
			>
				{isOpen ? (
					<ChevronDown size={14} className="text-slate-400" />
				) : (
					<ChevronRight size={14} className="text-slate-400" />
				)}
				{icon}
				<span className="text-xs font-medium text-slate-300 flex-1">
					{title}
				</span>
				{badge !== undefined && (
					<span className="text-[10px] bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded">
						{badge}
					</span>
				)}
			</button>
			{isOpen && <div className="p-3 bg-slate-900/50">{children}</div>}
		</div>
	);
}

interface ProfileCardProps {
	profile: GeneratedProviderProfile;
	index: number;
	onUpdate: (updates: Partial<GeneratedProviderProfile>) => void;
}

function ProfileCard({ profile, index, onUpdate }: ProfileCardProps) {
	const [isExpanded, setIsExpanded] = useState(false);
	const [isEditingOurTake, setIsEditingOurTake] = useState(false);

	const trustColor = profile.content.trustScore.display.color;
	const trustLabel = profile.content.trustScore.display.label;
	const trustScore = Math.round(profile.content.trustScore.display.score);

	// Highlight local references in text
	const highlightLocalRefs = (text: string) => {
		let highlighted = text;
		for (const ref of profile.localReferences) {
			const regex = new RegExp(`(${ref})`, 'gi');
			highlighted = highlighted.replace(
				regex,
				'<mark class="bg-amber-500/20 text-amber-300 px-0.5 rounded">$1</mark>'
			);
		}
		return highlighted;
	};

	return (
		<div className="border border-slate-700/50 rounded-lg overflow-hidden">
			{/* Header */}
			<button
				onClick={() => setIsExpanded(!isExpanded)}
				className="w-full flex items-center gap-3 px-3 py-2 bg-slate-800/30 hover:bg-slate-800/50 transition-colors text-left"
			>
				{isExpanded ? (
					<ChevronDown size={14} className="text-slate-400 shrink-0" />
				) : (
					<ChevronRight size={14} className="text-slate-400 shrink-0" />
				)}
				<div className="flex-1 min-w-0">
					<div className="text-xs font-medium text-slate-200 truncate">
						{profile.content.headline.split(' - ')[0]}
					</div>
					<div className="text-[10px] text-slate-500 truncate">
						{profile.url}
					</div>
				</div>
				<div className="flex items-center gap-2 shrink-0">
					<span className={`text-xs font-medium ${trustColor}`}>
						{trustScore}
					</span>
					<span className="text-[10px] text-slate-500">
						{profile.wordCount} words
					</span>
				</div>
			</button>

			{/* Expanded Content */}
			{isExpanded && (
				<div className="p-3 space-y-3 bg-slate-900/30">
					{/* Trust Score */}
					<div className="flex items-center gap-2 text-xs">
						<Award size={12} className={trustColor} />
						<span className={trustColor}>{trustLabel}</span>
						<span className="text-slate-500">
							{profile.content.trustScore.explanation}
						</span>
					</div>

					{/* Introduction */}
					<div className="text-xs text-slate-400 leading-relaxed">
						<div
							dangerouslySetInnerHTML={{
								__html: highlightLocalRefs(profile.content.introduction),
							}}
						/>
					</div>

					{/* Our Take Section */}
					<div className="border border-slate-700/50 rounded-lg p-3 bg-slate-800/20">
						<div className="flex items-center justify-between mb-2">
							<div className="flex items-center gap-2">
								<FileText size={12} className="text-amber-400" />
								<span className="text-xs font-medium text-slate-300">
									Our Take
								</span>
							</div>
							<button
								onClick={() => setIsEditingOurTake(true)}
								className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-amber-400 transition-colors"
							>
								<Edit2 size={10} />
								Edit
							</button>
						</div>

						{isEditingOurTake ? (
							<OurTakeEditor
								ourTake={profile.content.ourTake}
								onSave={(updatedOurTake) => {
									onUpdate({
										content: {
											...profile.content,
											ourTake: updatedOurTake,
										},
									});
									setIsEditingOurTake(false);
								}}
								onCancel={() => setIsEditingOurTake(false)}
							/>
						) : (
							<>
								<div
									className="text-xs text-slate-400 leading-relaxed mb-2"
									dangerouslySetInnerHTML={{
										__html: highlightLocalRefs(
											profile.content.ourTake.assessment
										),
									}}
								/>

								{/* Strengths */}
								<div className="mb-2">
									<div className="text-[10px] text-green-400 font-medium mb-1">
										Strengths
									</div>
									<ul className="text-xs text-slate-400 space-y-0.5">
										{profile.content.ourTake.strengths.map((s, i) => (
											<li key={i} className="flex items-start gap-1.5">
												<Check
													size={10}
													className="text-green-500 mt-0.5 shrink-0"
												/>
												<span>{s}</span>
											</li>
										))}
									</ul>
								</div>

								{/* Considerations */}
								{profile.content.ourTake.considerations.length > 0 && (
									<div className="mb-2">
										<div className="text-[10px] text-yellow-400 font-medium mb-1">
											Considerations
										</div>
										<ul className="text-xs text-slate-400 space-y-0.5">
											{profile.content.ourTake.considerations.map((c, i) => (
												<li key={i} className="flex items-start gap-1.5">
													<span className="text-yellow-500 mt-0.5 shrink-0">
														-
													</span>
													<span>{c}</span>
												</li>
											))}
										</ul>
									</div>
								)}

								{/* Best For */}
								<div className="text-xs text-slate-500 italic">
									{profile.content.ourTake.bestFor}
								</div>
							</>
						)}
					</div>

					{/* FAQs */}
					<div className="space-y-1">
						<div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
							FAQs ({profile.content.faq.length})
						</div>
						{profile.content.faq.slice(0, 2).map((faq, i) => (
							<div key={i} className="text-xs">
								<div className="text-slate-300 font-medium">{faq.question}</div>
								<div className="text-slate-500 truncate">{faq.answer}</div>
							</div>
						))}
						{profile.content.faq.length > 2 && (
							<div className="text-[10px] text-slate-600">
								+{profile.content.faq.length - 2} more
							</div>
						)}
					</div>

					{/* Local References */}
					<div className="flex flex-wrap gap-1">
						<span className="text-[10px] text-slate-500">Local refs:</span>
						{profile.localReferences.slice(0, 5).map((ref, i) => (
							<span
								key={i}
								className="text-[10px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded"
							>
								{ref}
							</span>
						))}
						{profile.localReferences.length > 5 && (
							<span className="text-[10px] text-slate-600">
								+{profile.localReferences.length - 5}
							</span>
						)}
					</div>

					{/* Comparison */}
					{profile.content.comparison.totalInCity > 1 && (
						<div className="text-xs text-slate-500">
							Ranked #{profile.content.comparison.rankInCity} of{' '}
							{profile.content.comparison.totalInCity} providers
						</div>
					)}
				</div>
			)}
		</div>
	);
}

export function ProfilePreview({ profiles, onUpdateProfile }: ProfilePreviewProps) {
	const [showAll, setShowAll] = useState(false);

	const totalWords = profiles.reduce((sum, p) => sum + p.wordCount, 0);
	const avgScore = Math.round(
		profiles.reduce((sum, p) => sum + p.content.trustScore.display.score, 0) /
			profiles.length
	);
	const totalLocalRefs = profiles.reduce(
		(sum, p) => sum + p.localReferences.length,
		0
	);

	const displayProfiles = showAll ? profiles : profiles.slice(0, 3);

	return (
		<div className="space-y-3 mt-2 pt-2 border-t border-slate-700/50">
			{/* Summary Stats */}
			<div className="grid grid-cols-3 gap-2 text-center">
				<div className="bg-slate-800/30 rounded-lg p-2">
					<div className="text-lg font-semibold text-amber-400">
						{profiles.length}
					</div>
					<div className="text-[10px] text-slate-500">Profiles</div>
				</div>
				<div className="bg-slate-800/30 rounded-lg p-2">
					<div className="text-lg font-semibold text-green-400">{avgScore}</div>
					<div className="text-[10px] text-slate-500">Avg Score</div>
				</div>
				<div className="bg-slate-800/30 rounded-lg p-2">
					<div className="text-lg font-semibold text-blue-400">
						{(totalWords / 1000).toFixed(1)}k
					</div>
					<div className="text-[10px] text-slate-500">Words</div>
				</div>
			</div>

			{/* Local References Summary */}
			<div className="flex items-center gap-2 text-xs text-slate-500">
				<MapPin size={12} />
				<span>{totalLocalRefs} local references across all profiles</span>
			</div>

			{/* Profile Cards */}
			<div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
				{displayProfiles.map((profile, index) => (
					<ProfileCard
						key={profile.providerId}
						profile={profile}
						index={index}
						onUpdate={(updates) => onUpdateProfile(index, updates)}
					/>
				))}
			</div>

			{/* Show More/Less */}
			{profiles.length > 3 && (
				<button
					onClick={() => setShowAll(!showAll)}
					className="w-full text-xs text-slate-500 hover:text-slate-400 py-1"
				>
					{showAll
						? 'Show less'
						: `Show ${profiles.length - 3} more profiles`}
				</button>
			)}
		</div>
	);
}

export default ProfilePreview;
