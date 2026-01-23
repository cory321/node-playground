// Market Statistics Calculator for Comparison Data Generation
import { EnrichedProvider } from '@/types/enrichedProvider';
import { MarketStatistics } from '@/types/comparisonPage';
import { calculateTrustScore } from './winnerSelector';

/**
 * Calculate market statistics from enriched providers
 */
export function calculateMarketStats(
	providers: EnrichedProvider[],
	city: string
): MarketStatistics {
	if (providers.length === 0) {
		return {
			totalProviders: 0,
			byCity: {},
			averageRating: 0,
			averageTrustScore: 0,
			priceRanges: {},
			topRated: [],
			licenseComplianceRate: 0,
		};
	}

	// Total providers
	const totalProviders = providers.length;

	// By city - group providers by their service area cities
	const byCity: Record<string, number> = {};
	byCity[city] = providers.length; // All providers serve the main city

	// Also count additional cities from service areas
	for (const provider of providers) {
		for (const serviceCity of provider.enrichment.serviceArea) {
			const normalizedCity = serviceCity.trim();
			if (normalizedCity && normalizedCity !== city) {
				byCity[normalizedCity] = (byCity[normalizedCity] || 0) + 1;
			}
		}
	}

	// Average rating
	const providersWithRating = providers.filter((p) => p.googleRating !== null);
	const averageRating =
		providersWithRating.length > 0
			? providersWithRating.reduce((sum, p) => sum + (p.googleRating || 0), 0) /
			  providersWithRating.length
			: 0;

	// Average trust score
	const trustScores = providers.map(calculateTrustScore);
	const averageTrustScore =
		trustScores.reduce((sum, score) => sum + score, 0) / providers.length;

	// Price ranges by service
	const priceRanges: Record<string, { low: number; high: number }> = {};
	for (const provider of providers) {
		for (const { service, price } of provider.enrichment.pricing.listed) {
			const normalizedService = service.toLowerCase().trim();
			const parsed = parsePriceRange(price);
			
			if (parsed) {
				if (!priceRanges[normalizedService]) {
					priceRanges[normalizedService] = { low: Infinity, high: -Infinity };
				}
				priceRanges[normalizedService].low = Math.min(
					priceRanges[normalizedService].low,
					parsed.low
				);
				priceRanges[normalizedService].high = Math.max(
					priceRanges[normalizedService].high,
					parsed.high
				);
			}
		}
	}

	// Clean up price ranges - replace Infinity with 0
	for (const service of Object.keys(priceRanges)) {
		if (priceRanges[service].low === Infinity) {
			priceRanges[service].low = 0;
		}
		if (priceRanges[service].high === -Infinity) {
			priceRanges[service].high = 0;
		}
	}

	// Top rated providers (top 5 by rating)
	const topRated = [...providers]
		.filter((p) => p.googleRating !== null)
		.sort((a, b) => (b.googleRating || 0) - (a.googleRating || 0))
		.slice(0, 5)
		.map((p) => ({
			id: p.id,
			name: p.name,
			rating: p.googleRating || 0,
		}));

	// License compliance rate
	const providersWithLicense = providers.filter(
		(p) => p.enrichment.credentials.licenseNumbers.length > 0
	);
	const licenseComplianceRate =
		Math.round((providersWithLicense.length / totalProviders) * 100);

	return {
		totalProviders,
		byCity,
		averageRating: Math.round(averageRating * 10) / 10,
		averageTrustScore: Math.round(averageTrustScore),
		priceRanges,
		topRated,
		licenseComplianceRate,
	};
}

/**
 * Parse a price string to extract low and high values
 */
function parsePriceRange(priceStr: string): { low: number; high: number } | null {
	if (!priceStr) return null;

	// Remove common prefixes
	const cleaned = priceStr
		.replace(/starting at/i, '')
		.replace(/from/i, '')
		.replace(/up to/i, '')
		.trim();

	// Match price ranges like "$100-$200"
	const rangeMatch = cleaned.match(/\$?([\d,]+)\s*[-–]\s*\$?([\d,]+)/);
	if (rangeMatch) {
		const low = parseFloat(rangeMatch[1].replace(/,/g, ''));
		const high = parseFloat(rangeMatch[2].replace(/,/g, ''));
		return { low, high };
	}

	// Match single price
	const singleMatch = cleaned.match(/\$?([\d,]+)/);
	if (singleMatch) {
		const value = parseFloat(singleMatch[1].replace(/,/g, ''));
		return { low: value, high: value };
	}

	return null;
}

/**
 * Calculate additional market insights
 */
export interface MarketInsights {
	hasStrongCompetition: boolean;
	averageYearsExperience: number;
	emergencyServiceRate: number;
	topServicesOffered: string[];
	reviewVelocityTrend: 'growing' | 'stable' | 'declining';
}

export function calculateMarketInsights(
	providers: EnrichedProvider[]
): MarketInsights {
	if (providers.length === 0) {
		return {
			hasStrongCompetition: false,
			averageYearsExperience: 0,
			emergencyServiceRate: 0,
			topServicesOffered: [],
			reviewVelocityTrend: 'stable',
		};
	}

	// Strong competition if many high-rated providers
	const highRatedCount = providers.filter(
		(p) => (p.googleRating || 0) >= 4.5
	).length;
	const hasStrongCompetition = highRatedCount >= providers.length * 0.5;

	// Average years experience
	const currentYear = new Date().getFullYear();
	const providersWithYear = providers.filter(
		(p) => p.enrichment.about.yearEstablished !== null
	);
	const averageYearsExperience =
		providersWithYear.length > 0
			? providersWithYear.reduce(
					(sum, p) => sum + (currentYear - (p.enrichment.about.yearEstablished || currentYear)),
					0
			  ) / providersWithYear.length
			: 0;

	// Emergency service rate
	const emergencyProviders = providers.filter(
		(p) => p.enrichment.emergencyService
	);
	const emergencyServiceRate = Math.round(
		(emergencyProviders.length / providers.length) * 100
	);

	// Top services offered (count frequency)
	const serviceCount: Record<string, number> = {};
	for (const provider of providers) {
		for (const service of provider.enrichment.services) {
			const normalized = service.toLowerCase().trim();
			serviceCount[normalized] = (serviceCount[normalized] || 0) + 1;
		}
	}
	const topServicesOffered = Object.entries(serviceCount)
		.sort((a, b) => b[1] - a[1])
		.slice(0, 5)
		.map(([service]) =>
			(service || 'Service')
				.split(' ')
				.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
				.join(' ')
		);

	// Review velocity trend (simplified - based on review count distribution)
	const reviewCounts = providers
		.map((p) => p.googleReviewCount || 0)
		.filter((c) => c > 0);
	const avgReviews =
		reviewCounts.length > 0
			? reviewCounts.reduce((a, b) => a + b, 0) / reviewCounts.length
			: 0;
	
	// If many providers have high review counts, market is mature/growing
	const reviewVelocityTrend: 'growing' | 'stable' | 'declining' =
		avgReviews > 100 ? 'growing' : avgReviews > 30 ? 'stable' : 'declining';

	return {
		hasStrongCompetition,
		averageYearsExperience: Math.round(averageYearsExperience),
		emergencyServiceRate,
		topServicesOffered,
		reviewVelocityTrend,
	};
}
