// Winner Selection Logic for Comparison Data Generation
import { EnrichedProvider } from '@/types/enrichedProvider';
import { Winner, WinnerCategory } from '@/types/comparisonPage';

/**
 * Find the provider with the highest value for a given numeric property
 */
function maxBy<T>(
	items: T[],
	getValue: (item: T) => number | null,
): T | undefined {
	let maxItem: T | undefined;
	let maxValue = -Infinity;

	for (const item of items) {
		const value = getValue(item);
		if (value !== null && value > maxValue) {
			maxValue = value;
			maxItem = item;
		}
	}

	return maxItem;
}

/**
 * Calculate trust score from provider data
 * Returns 0-100 based on scoring factors
 */
export function calculateTrustScore(provider: EnrichedProvider): number {
	const { score, googleRating, googleReviewCount, enrichment } = provider;

	// Base score from provider scoring (0-25) -> (0-50)
	const baseScore = (score.total / 25) * 50;

	// Rating contribution (0-5) -> (0-20)
	const ratingScore = ((googleRating || 0) / 5) * 20;

	// Review count contribution (log scale, capped at 200 reviews)
	const reviewScore = Math.min(
		10,
		Math.log10(Math.max(1, googleReviewCount || 1)) * 5,
	);

	// Credentials bonus (0-10)
	let credentialsScore = 0;
	if (enrichment.credentials.licenseNumbers.length > 0) credentialsScore += 4;
	if (enrichment.credentials.insuranceMentioned) credentialsScore += 3;
	if (enrichment.credentials.certifications.length > 0) credentialsScore += 3;

	// Years in business bonus (0-10)
	const yearsInBusiness = enrichment.about.yearEstablished
		? new Date().getFullYear() - enrichment.about.yearEstablished
		: 0;
	const experienceScore = Math.min(10, yearsInBusiness);

	return Math.min(
		100,
		Math.round(
			baseScore +
				ratingScore +
				reviewScore +
				credentialsScore +
				experienceScore,
		),
	);
}

/**
 * Find the best value provider
 * Good trust score but lower pricing indicators
 */
function findBestValue(
	providers: EnrichedProvider[],
): EnrichedProvider | undefined {
	// Score each provider by value = trust score / pricing indicator
	const scored = providers.map((p) => {
		const trustScore = calculateTrustScore(p);
		// Use price range indicator: free estimates = lower cost, financing = higher cost projects
		const hasFreeEstimates = p.enrichment.pricing.freeEstimates;
		const hasFinancing = p.enrichment.pricing.financing;

		// Lower pricing indicator is better for value
		const pricingIndicator = hasFinancing ? 1.5 : hasFreeEstimates ? 0.8 : 1.0;

		// Value score: trust per pricing
		const valueScore = trustScore / pricingIndicator;

		return { provider: p, valueScore, trustScore };
	});

	// Filter to only include providers with decent trust scores (> 50)
	const qualityProviders = scored.filter((s) => s.trustScore > 50);

	if (qualityProviders.length === 0) {
		// Fall back to highest value score if no quality providers
		return maxBy(scored, (s) => s.valueScore)?.provider;
	}

	return maxBy(qualityProviders, (s) => s.valueScore)?.provider;
}

/**
 * Find the best provider for emergency services
 * Must have 24/7 service and good availability signals
 */
function findBestEmergency(
	providers: EnrichedProvider[],
): EnrichedProvider | undefined {
	const emergencyProviders = providers.filter(
		(p) => p.enrichment.emergencyService,
	);

	if (emergencyProviders.length === 0) {
		return undefined;
	}

	// Prefer providers with better trust scores among emergency providers
	return maxBy(emergencyProviders, calculateTrustScore);
}

/**
 * Get years in business for a provider
 */
function getYearsInBusiness(provider: EnrichedProvider): number {
	const yearEstablished = provider.enrichment.about.yearEstablished;
	if (!yearEstablished) return 0;
	return new Date().getFullYear() - yearEstablished;
}

/**
 * Generate a winner reason placeholder
 * This will be replaced by LLM-generated content
 */
function generateWinnerReasonPlaceholder(
	provider: EnrichedProvider,
	category: WinnerCategory,
): string {
	const name = provider.name;
	const trustScore = calculateTrustScore(provider);

	switch (category) {
		case 'Best Overall':
			return `${name} earned the Best Overall designation with a trust score of ${trustScore}/100, combining strong reviews, verified credentials, and consistent service quality.`;

		case 'Best Value':
			return `${name} offers exceptional value, providing quality service at competitive pricing with transparent estimates and no hidden fees.`;

		case 'Most Experienced':
			const years = getYearsInBusiness(provider);
			return `With ${years}+ years of experience, ${name} brings unmatched expertise and a proven track record in the local market.`;

		case 'Best for Emergency':
			return `${name} provides reliable 24/7 emergency service with fast response times and immediate availability for urgent situations.`;

		case 'Most Reviewed':
			const reviews = provider.googleReviewCount || 0;
			return `${name} has ${reviews} customer reviews, giving you the most feedback to help make your decision.`;

		default:
			return `${name} stands out in the ${category} category.`;
	}
}

/**
 * Get badge identifier for winner category
 */
function getBadgeForCategory(category: WinnerCategory): string {
	switch (category) {
		case 'Best Overall':
			return 'trophy';
		case 'Best Value':
			return 'dollar-sign';
		case 'Most Experienced':
			return 'award';
		case 'Best for Emergency':
			return 'clock';
		case 'Most Reviewed':
			return 'star';
		default:
			return 'badge';
	}
}

/**
 * Select winners for all categories
 */
export function selectWinners(providers: EnrichedProvider[]): Winner[] {
	if (providers.length === 0) {
		return [];
	}

	const winners: Winner[] = [];
	const usedProviderIds = new Set<string>();

	// Best Overall: Highest trust score
	const bestOverall = maxBy(providers, calculateTrustScore);
	if (bestOverall) {
		usedProviderIds.add(bestOverall.id);
		winners.push({
			category: 'Best Overall',
			providerId: bestOverall.id,
			providerName: bestOverall.name,
			reason: generateWinnerReasonPlaceholder(bestOverall, 'Best Overall'),
			badge: getBadgeForCategory('Best Overall'),
		});
	}

	// Best Value: Good trust score, lower pricing
	const bestValue = findBestValue(providers);
	if (bestValue && !usedProviderIds.has(bestValue.id)) {
		usedProviderIds.add(bestValue.id);
		winners.push({
			category: 'Best Value',
			providerId: bestValue.id,
			providerName: bestValue.name,
			reason: generateWinnerReasonPlaceholder(bestValue, 'Best Value'),
			badge: getBadgeForCategory('Best Value'),
		});
	}

	// Most Experienced: Longest in business
	const mostExperienced = maxBy(providers, (p) => getYearsInBusiness(p));
	if (
		mostExperienced &&
		getYearsInBusiness(mostExperienced) > 0 &&
		!usedProviderIds.has(mostExperienced.id)
	) {
		usedProviderIds.add(mostExperienced.id);
		winners.push({
			category: 'Most Experienced',
			providerId: mostExperienced.id,
			providerName: mostExperienced.name,
			reason: generateWinnerReasonPlaceholder(
				mostExperienced,
				'Most Experienced',
			),
			badge: getBadgeForCategory('Most Experienced'),
		});
	}

	// Best for Emergency: Has 24/7, fast response
	const bestEmergency = findBestEmergency(providers);
	if (bestEmergency && !usedProviderIds.has(bestEmergency.id)) {
		usedProviderIds.add(bestEmergency.id);
		winners.push({
			category: 'Best for Emergency',
			providerId: bestEmergency.id,
			providerName: bestEmergency.name,
			reason: generateWinnerReasonPlaceholder(
				bestEmergency,
				'Best for Emergency',
			),
			badge: getBadgeForCategory('Best for Emergency'),
		});
	}

	// Most Reviewed: Highest review count
	const mostReviewed = maxBy(providers, (p) => p.googleReviewCount || 0);
	if (
		mostReviewed &&
		(mostReviewed.googleReviewCount || 0) > 0 &&
		!usedProviderIds.has(mostReviewed.id)
	) {
		usedProviderIds.add(mostReviewed.id);
		winners.push({
			category: 'Most Reviewed',
			providerId: mostReviewed.id,
			providerName: mostReviewed.name,
			reason: generateWinnerReasonPlaceholder(mostReviewed, 'Most Reviewed'),
			badge: getBadgeForCategory('Most Reviewed'),
		});
	}

	return winners;
}
