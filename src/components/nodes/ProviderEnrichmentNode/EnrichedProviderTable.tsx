import React, { useState, useCallback } from 'react';
import {
	ChevronDown,
	ChevronUp,
	Star,
	Phone,
	Globe,
	MapPin,
	Clock,
	Shield,
	Wrench,
	MessageSquare,
	DollarSign,
	Users,
	Building2,
	AlertCircle,
	Search,
	ExternalLink,
	Copy,
	Check,
	X,
	Edit2,
	Save,
} from 'lucide-react';
import { EnrichedProvider } from '@/types/enrichedProvider';
import { ProviderData } from '@/types/nodes';
import { EnrichmentBadge } from './EnrichmentBadge';

interface EnrichedProviderTableProps {
	providers: EnrichedProvider[];
}

interface ProviderRowProps {
	provider: EnrichedProvider;
	isExpanded: boolean;
	onToggleExpand: () => void;
}

function ProviderRow({
	provider,
	isExpanded,
	onToggleExpand,
}: ProviderRowProps) {
	const { enrichment, websiteDiscovery } = provider;
	const hasError = !!enrichment.scrapingError;

	// Check if website was discovered via search
	const wasDiscovered =
		websiteDiscovery?.discoverySource === 'serp_organic' ||
		websiteDiscovery?.discoverySource === 'phone_lookup';

	return (
		<div className="border-b border-slate-700/30 last:border-b-0">
			{/* Main Row */}
			<div
				className="flex items-center gap-2 px-2 py-2 hover:bg-slate-800/30 cursor-pointer transition-colors"
				onClick={onToggleExpand}
			>
				{/* Confidence Badge */}
				<EnrichmentBadge confidence={enrichment.scrapingConfidence} />

				{/* Provider Name */}
				<div className="flex-1 min-w-0 flex items-center gap-1.5">
					<span className="text-xs font-medium truncate text-slate-200">
						{provider.name}
					</span>
					{wasDiscovered && (
						<span
							className="shrink-0 flex items-center gap-0.5 px-1 py-0.5 text-[8px] uppercase tracking-wider bg-cyan-500/20 text-cyan-400 rounded border border-cyan-500/30"
							title={`Website discovered via search (${websiteDiscovery?.discoveryConfidence}% confidence)`}
						>
							<Search size={8} />
							Found
						</span>
					)}
					{hasError && (
						<AlertCircle size={10} className="text-red-400 shrink-0" />
					)}
				</div>

				{/* Services Count */}
				{enrichment.services.length > 0 && (
					<span className="text-[10px] text-purple-300 font-mono">
						{enrichment.services.length} services
					</span>
				)}

				{/* Rating */}
				{provider.googleRating && (
					<div className="flex items-center gap-1 text-[10px] text-amber-400">
						<Star size={10} className="fill-current" />
						<span>{provider.googleRating.toFixed(1)}</span>
					</div>
				)}

				{/* Expand Icon */}
				<span className="text-slate-500">
					{isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
				</span>
			</div>

			{/* Expanded Details */}
			{isExpanded && (
				<div className="px-3 pb-3 pt-1 bg-slate-800/20 space-y-3">
					{/* Error Display */}
					{hasError && (
						<div className="flex items-start gap-2 px-2 py-1.5 bg-red-500/10 border border-red-500/20 rounded text-[10px]">
							<AlertCircle size={12} className="text-red-400 shrink-0 mt-0.5" />
							<span className="text-red-300">{enrichment.scrapingError}</span>
						</div>
					)}

					{/* Contact Info */}
					<div className="flex flex-wrap gap-3 text-[10px]">
						{provider.phone && (
							<a
								href={`tel:${provider.phone}`}
								onClick={(e) => e.stopPropagation()}
								className="flex items-center gap-1 text-purple-400 hover:text-purple-300"
							>
								<Phone size={10} />
								{provider.phone}
							</a>
						)}
						{provider.website && (
							<a
								href={provider.website}
								target="_blank"
								rel="noopener noreferrer"
								onClick={(e) => e.stopPropagation()}
								className={`flex items-center gap-1 ${
									wasDiscovered
										? 'text-cyan-400 hover:text-cyan-300'
										: 'text-purple-400 hover:text-purple-300'
								}`}
							>
								{wasDiscovered ? <Search size={10} /> : <Globe size={10} />}
								{wasDiscovered ? 'Discovered Website' : 'Website'}
							</a>
						)}
						{provider.address && (
							<span className="flex items-center gap-1 text-slate-400">
								<MapPin size={10} />
								{provider.address}
							</span>
						)}
					</div>

					{/* Services */}
					{enrichment.services.length > 0 && (
						<div className="space-y-1">
							<div className="flex items-center gap-1 text-[10px] text-slate-500">
								<Wrench size={10} />
								<span>Services</span>
							</div>
							<div className="flex flex-wrap gap-1">
								{enrichment.services.slice(0, 6).map((service, i) => (
									<span
										key={i}
										className="px-1.5 py-0.5 text-[9px] bg-purple-500/20 text-purple-300 rounded"
									>
										{service}
									</span>
								))}
								{enrichment.services.length > 6 && (
									<span className="px-1.5 py-0.5 text-[9px] bg-slate-600/50 text-slate-400 rounded">
										+{enrichment.services.length - 6} more
									</span>
								)}
							</div>
						</div>
					)}

					{/* Credentials */}
					{(enrichment.credentials.certifications.length > 0 ||
						enrichment.credentials.licenseNumbers.length > 0 ||
						enrichment.credentials.insuranceMentioned) && (
						<div className="space-y-1">
							<div className="flex items-center gap-1 text-[10px] text-slate-500">
								<Shield size={10} />
								<span>Credentials</span>
							</div>
							<div className="flex flex-wrap gap-1">
								{enrichment.credentials.insuranceMentioned && (
									<span className="px-1.5 py-0.5 text-[9px] bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">
										Insured
									</span>
								)}
								{enrichment.credentials.licenseNumbers
									.slice(0, 2)
									.map((lic, i) => (
										<span
											key={i}
											className="px-1.5 py-0.5 text-[9px] bg-blue-500/20 text-blue-300 rounded"
										>
											Lic: {lic}
										</span>
									))}
								{enrichment.credentials.certifications
									.slice(0, 3)
									.map((cert, i) => (
										<span
											key={i}
											className="px-1.5 py-0.5 text-[9px] bg-slate-600/50 text-slate-300 rounded"
										>
											{cert}
										</span>
									))}
							</div>
						</div>
					)}

					{/* Pricing Info */}
					{(enrichment.pricing.freeEstimates ||
						enrichment.pricing.financing ||
						enrichment.pricing.listed.length > 0) && (
						<div className="space-y-1">
							<div className="flex items-center gap-1 text-[10px] text-slate-500">
								<DollarSign size={10} />
								<span>Pricing</span>
							</div>
							<div className="flex flex-wrap gap-1">
								{enrichment.pricing.freeEstimates && (
									<span className="px-1.5 py-0.5 text-[9px] bg-emerald-500/20 text-emerald-300 rounded">
										Free Estimates
									</span>
								)}
								{enrichment.pricing.financing && (
									<span className="px-1.5 py-0.5 text-[9px] bg-blue-500/20 text-blue-300 rounded">
										Financing
									</span>
								)}
								{enrichment.pricing.listed.slice(0, 3).map((item, i) => (
									<span
										key={i}
										className="px-1.5 py-0.5 text-[9px] bg-slate-600/50 text-slate-300 rounded"
									>
										{item.service}: {item.price}
									</span>
								))}
							</div>
						</div>
					)}

					{/* About */}
					{(enrichment.about.yearEstablished ||
						enrichment.about.teamSize ||
						enrichment.about.ownerName) && (
						<div className="space-y-1">
							<div className="flex items-center gap-1 text-[10px] text-slate-500">
								<Building2 size={10} />
								<span>About</span>
							</div>
							<div className="flex flex-wrap gap-2 text-[10px] text-slate-300">
								{enrichment.about.yearEstablished && (
									<span>Est. {enrichment.about.yearEstablished}</span>
								)}
								{enrichment.about.teamSize && (
									<span>{enrichment.about.teamSize}</span>
								)}
								{enrichment.about.ownerName && (
									<span>Owner: {enrichment.about.ownerName}</span>
								)}
							</div>
						</div>
					)}

					{/* Hours & Emergency */}
					<div className="flex flex-wrap gap-2">
						{enrichment.emergencyService && (
							<span className="flex items-center gap-1 px-1.5 py-0.5 text-[9px] bg-red-500/20 text-red-300 rounded border border-red-500/30">
								<Clock size={9} />
								24/7 Emergency
							</span>
						)}
						{enrichment.hours && Object.keys(enrichment.hours).length > 0 && (
							<span className="flex items-center gap-1 px-1.5 py-0.5 text-[9px] bg-slate-600/50 text-slate-300 rounded">
								<Clock size={9} />
								Hours Listed
							</span>
						)}
					</div>

					{/* Testimonials Count */}
					{enrichment.testimonials.length > 0 && (
						<div className="flex items-center gap-1 text-[10px] text-slate-400">
							<MessageSquare size={10} />
							<span>{enrichment.testimonials.length} testimonials found</span>
						</div>
					)}

					{/* Service Area */}
					{enrichment.serviceArea.length > 0 && (
						<div className="flex items-center gap-1 text-[10px] text-slate-400">
							<MapPin size={10} />
							<span>
								Serves: {enrichment.serviceArea.slice(0, 5).join(', ')}
							</span>
							{enrichment.serviceArea.length > 5 && (
								<span className="text-slate-500">
									+{enrichment.serviceArea.length - 5} more
								</span>
							)}
						</div>
					)}

					{/* Brands */}
					{enrichment.brands.length > 0 && (
						<div className="flex flex-wrap gap-1">
							{enrichment.brands.slice(0, 5).map((brand, i) => (
								<span
									key={i}
									className="px-1.5 py-0.5 text-[9px] bg-slate-700/50 text-slate-300 rounded"
								>
									{brand}
								</span>
							))}
						</div>
					)}
				</div>
			)}
		</div>
	);
}

export function EnrichedProviderTable({
	providers,
}: EnrichedProviderTableProps) {
	const [expandedId, setExpandedId] = useState<string | null>(null);

	if (providers.length === 0) {
		return (
			<div className="text-center py-4 text-slate-500 text-xs">
				No enriched providers
			</div>
		);
	}

	// Sort by confidence (highest first)
	const sortedProviders = [...providers].sort(
		(a, b) => b.enrichment.scrapingConfidence - a.enrichment.scrapingConfidence,
	);

	return (
		<div className="bg-slate-800/30 border border-slate-700/50 rounded-lg overflow-hidden max-h-72 overflow-y-auto">
			{sortedProviders.map((provider) => (
				<ProviderRow
					key={provider.id}
					provider={provider}
					isExpanded={expandedId === provider.id}
					onToggleExpand={() =>
						setExpandedId(expandedId === provider.id ? null : provider.id)
					}
				/>
			))}
		</div>
	);
}

/**
 * Build search text for clipboard (phone + address)
 */
function buildSearchText(phone: string | null, address: string | null): string {
	const parts: string[] = [];
	if (phone) parts.push(phone);
	if (address) parts.push(address);
	return parts.join(' ');
}

/**
 * Component to display providers missing websites with manual search and entry
 */
interface MissingWebsitesListProps {
	providers: ProviderData[];
	manualWebsites: Record<string, string>;
	onWebsiteUpdate: (providerId: string, website: string | null) => void;
}

/**
 * Single row for a provider missing a website
 */
interface MissingProviderRowProps {
	provider: ProviderData;
	manualWebsite: string | undefined;
	onWebsiteUpdate: (providerId: string, website: string | null) => void;
}

function MissingProviderRow({
	provider,
	manualWebsite,
	onWebsiteUpdate,
}: MissingProviderRowProps) {
	const [copied, setCopied] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [inputValue, setInputValue] = useState(manualWebsite || '');

	const hasWebsite = !!manualWebsite;
	const canSearch = !!provider.phone || !!provider.address;

	// Copy phone/address to clipboard and open Google
	const handleCopyAndSearch = useCallback(
		async (e: React.MouseEvent) => {
			e.preventDefault();
			e.stopPropagation();

			const searchText = buildSearchText(provider.phone, provider.address);
			if (searchText) {
				try {
					await navigator.clipboard.writeText(searchText);
					setCopied(true);
					setTimeout(() => setCopied(false), 2000);
				} catch (err) {
					console.error('Failed to copy:', err);
				}
			}

			// Open blank Google search
			window.open('https://www.google.com', '_blank', 'noopener,noreferrer');
		},
		[provider.phone, provider.address],
	);

	// Save the entered website
	const handleSave = useCallback(
		(e: React.MouseEvent) => {
			e.preventDefault();
			e.stopPropagation();

			const trimmed = inputValue.trim();
			if (trimmed) {
				// Add https:// if no protocol specified
				const url = trimmed.match(/^https?:\/\//)
					? trimmed
					: `https://${trimmed}`;
				onWebsiteUpdate(provider.id, url);
			}
			setIsEditing(false);
		},
		[inputValue, provider.id, onWebsiteUpdate],
	);

	// Clear the saved website
	const handleClear = useCallback(
		(e: React.MouseEvent) => {
			e.preventDefault();
			e.stopPropagation();
			onWebsiteUpdate(provider.id, null);
			setInputValue('');
			setIsEditing(false);
		},
		[provider.id, onWebsiteUpdate],
	);

	// Start editing
	const handleEdit = useCallback((e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsEditing(true);
	}, []);

	// Cancel editing
	const handleCancel = useCallback(
		(e: React.MouseEvent) => {
			e.preventDefault();
			e.stopPropagation();
			setInputValue(manualWebsite || '');
			setIsEditing(false);
		},
		[manualWebsite],
	);

	// If website has been saved, show saved state
	if (hasWebsite && !isEditing) {
		return (
			<div className="flex items-center gap-2 px-2 py-1.5 border-b border-slate-700/30 last:border-b-0 bg-emerald-500/5">
				<div className="flex-1 min-w-0">
					<span className="text-xs text-slate-300 truncate block">
						{provider.name}
					</span>
					<a
						href={manualWebsite}
						target="_blank"
						rel="noopener noreferrer"
						onClick={(e) => e.stopPropagation()}
						className="text-[10px] text-emerald-400 hover:text-emerald-300 font-mono truncate block"
					>
						{manualWebsite.replace(/^https?:\/\//, '')}
					</a>
				</div>
				<div className="shrink-0 flex items-center gap-1">
					<span className="flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] bg-emerald-500/20 text-emerald-400 rounded">
						<Check size={8} />
						Saved
					</span>
					<button
						onClick={handleEdit}
						className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
						title="Edit website"
					>
						<Edit2 size={10} />
					</button>
					<button
						onClick={handleClear}
						className="p-1 text-slate-500 hover:text-red-400 transition-colors"
						title="Clear website"
					>
						<X size={10} />
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="px-2 py-1.5 border-b border-slate-700/30 last:border-b-0 hover:bg-slate-800/30 space-y-1.5">
			{/* Provider info row */}
			<div className="flex items-center gap-2">
				<div className="flex-1 min-w-0">
					<span className="text-xs text-slate-300 truncate block">
						{provider.name}
					</span>
					<span className="text-[10px] text-slate-500 font-mono truncate block">
						{provider.phone || provider.address || 'No contact info'}
					</span>
				</div>
				{canSearch && (
					<button
						onClick={handleCopyAndSearch}
						className={`shrink-0 flex items-center gap-1 px-2 py-1 text-[10px] font-medium border rounded transition-colors ${
							copied
								? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
								: 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border-cyan-500/30'
						}`}
						title="Copy phone/address to clipboard and open Google"
					>
						{copied ? (
							<>
								<Check size={10} />
								<span>Copied!</span>
							</>
						) : (
							<>
								<Copy size={10} />
								<span>Copy & Search</span>
								<ExternalLink size={8} />
							</>
						)}
					</button>
				)}
			</div>

			{/* Website input row */}
			<div className="flex items-center gap-1.5">
				<input
					type="text"
					value={inputValue}
					onChange={(e) => setInputValue(e.target.value)}
					placeholder="Enter website URL..."
					onClick={(e) => e.stopPropagation()}
					onKeyDown={(e) => {
						e.stopPropagation();
						if (e.key === 'Enter') {
							handleSave(e as unknown as React.MouseEvent);
						} else if (e.key === 'Escape') {
							handleCancel(e as unknown as React.MouseEvent);
						}
					}}
					className="flex-1 px-2 py-1 text-[10px] bg-slate-800/80 border border-slate-600/50 rounded text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20"
				/>
				<button
					onClick={handleSave}
					disabled={!inputValue.trim()}
					className={`shrink-0 flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded transition-colors ${
						inputValue.trim()
							? 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30'
							: 'bg-slate-700/30 text-slate-600 border border-slate-600/30 cursor-not-allowed'
					}`}
					title="Save website"
				>
					<Save size={10} />
					<span>Save</span>
				</button>
				{isEditing && (
					<button
						onClick={handleCancel}
						className="shrink-0 p-1 text-slate-500 hover:text-slate-300 transition-colors"
						title="Cancel"
					>
						<X size={12} />
					</button>
				)}
			</div>
		</div>
	);
}

export function MissingWebsitesList({
	providers,
	manualWebsites,
	onWebsiteUpdate,
}: MissingWebsitesListProps) {
	// Filter to only providers without websites (original or manual)
	const missingWebsites = providers.filter(
		(p) => !p.website && !manualWebsites[p.id],
	);
	// Providers with manually added websites
	const withManualWebsites = providers.filter(
		(p) => !p.website && manualWebsites[p.id],
	);

	const totalMissing = missingWebsites.length;
	const totalWithManual = withManualWebsites.length;
	const total = totalMissing + totalWithManual;

	if (total === 0) {
		return null;
	}

	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2 text-[10px] text-amber-400">
					<AlertCircle size={10} />
					<span>
						{totalMissing > 0
							? `${totalMissing} provider${totalMissing !== 1 ? 's' : ''} missing websites`
							: 'All websites added'}
					</span>
				</div>
				{totalWithManual > 0 && (
					<span className="text-[10px] text-emerald-400">
						{totalWithManual} manually added
					</span>
				)}
			</div>

			<div className="bg-slate-800/30 border border-slate-700/50 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
				{/* Providers with manually added websites first */}
				{withManualWebsites.map((provider) => (
					<MissingProviderRow
						key={provider.id}
						provider={provider}
						manualWebsite={manualWebsites[provider.id]}
						onWebsiteUpdate={onWebsiteUpdate}
					/>
				))}

				{/* Providers still missing websites */}
				{missingWebsites.map((provider) => (
					<MissingProviderRow
						key={provider.id}
						provider={provider}
						manualWebsite={undefined}
						onWebsiteUpdate={onWebsiteUpdate}
					/>
				))}
			</div>

			<p className="text-[9px] text-slate-500 italic">
				Click "Copy & Search" to open Google and paste the phone/address. Enter
				the website URL and click Save.
			</p>
		</div>
	);
}

export default EnrichedProviderTable;
