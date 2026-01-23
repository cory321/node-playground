// Pricing Analysis for Comparison Data Generation
import { EnrichedProvider } from '@/types/enrichedProvider';
import { LocalKnowledgeOutput } from '@/types/localKnowledge';
import {
	QuickAnswerPricing,
	PriceTable,
	PriceTableRow,
	CityPriceComparison,
	CostFactor,
	RealPriceExample,
} from '@/types/comparisonPage';

/**
 * Parse a price string to get numeric value
 * Handles formats like "$150", "$150-$300", "Starting at $99"
 */
function parsePriceString(priceStr: string): { low: number; high: number } | null {
	if (!priceStr) return null;

	// Remove common prefixes
	const cleaned = priceStr
		.replace(/starting at/i, '')
		.replace(/from/i, '')
		.replace(/up to/i, '')
		.trim();

	// Match price ranges like "$100-$200" or "$100 - $200"
	const rangeMatch = cleaned.match(/\$?([\d,]+)\s*[-–]\s*\$?([\d,]+)/);
	if (rangeMatch) {
		const low = parseFloat(rangeMatch[1].replace(/,/g, ''));
		const high = parseFloat(rangeMatch[2].replace(/,/g, ''));
		return { low, high };
	}

	// Match single price like "$150" or "$150+"
	const singleMatch = cleaned.match(/\$?([\d,]+)/);
	if (singleMatch) {
		const value = parseFloat(singleMatch[1].replace(/,/g, ''));
		return { low: value, high: value };
	}

	return null;
}

/**
 * Format a price for display
 */
function formatPrice(value: number): string {
	if (value >= 1000) {
		return `$${(value / 1000).toFixed(1)}k`;
	}
	return `$${Math.round(value)}`;
}

/**
 * Aggregate pricing data from all providers
 */
export interface AggregatedPricing {
	services: Map<string, { prices: number[]; examples: Array<{ price: string; provider: string }> }>;
	hasAnyPricing: boolean;
	providersWithPricing: number;
	totalProviders: number;
}

export function aggregatePricingData(providers: EnrichedProvider[]): AggregatedPricing {
	const services = new Map<string, { prices: number[]; examples: Array<{ price: string; provider: string }> }>();
	let providersWithPricing = 0;

	for (const provider of providers) {
		const listedPrices = provider.enrichment.pricing.listed;
		if (listedPrices.length > 0) {
			providersWithPricing++;

			for (const { service, price } of listedPrices) {
				const normalizedService = service.toLowerCase().trim();
				const parsed = parsePriceString(price);

				if (!services.has(normalizedService)) {
					services.set(normalizedService, { prices: [], examples: [] });
				}

				const serviceData = services.get(normalizedService)!;
				if (parsed) {
					serviceData.prices.push(parsed.low, parsed.high);
				}
				serviceData.examples.push({ price, provider: provider.name });
			}
		}
	}

	return {
		services,
		hasAnyPricing: services.size > 0,
		providersWithPricing,
		totalProviders: providers.length,
	};
}

/**
 * Generate quick answer pricing summary
 */
export function generateQuickAnswer(
	aggregated: AggregatedPricing,
	category: string
): QuickAnswerPricing {
	// Collect all prices across services
	const allPrices: number[] = [];
	for (const [, data] of aggregated.services) {
		allPrices.push(...data.prices);
	}

	if (allPrices.length === 0) {
		return {
			averageCost: 'Varies by service',
			range: {
				low: 'Call for estimate',
				high: 'Depends on scope',
			},
			disclaimer:
				'Pricing varies by specific service, scope of work, and provider. Get multiple quotes for accurate pricing.',
		};
	}

	const sortedPrices = allPrices.sort((a, b) => a - b);
	const low = sortedPrices[0];
	const high = sortedPrices[sortedPrices.length - 1];
	const average = allPrices.reduce((sum, p) => sum + p, 0) / allPrices.length;

	return {
		averageCost: formatPrice(average),
		range: {
			low: formatPrice(low),
			high: formatPrice(high),
		},
		disclaimer: `Based on ${aggregated.providersWithPricing} local ${category.toLowerCase()} providers. Actual prices may vary based on specific needs and conditions.`,
	};
}

/**
 * Generate price table from aggregated data
 */
export function generatePriceTable(aggregated: AggregatedPricing): PriceTable {
	const rows: PriceTableRow[] = [];

	for (const [service, data] of aggregated.services) {
		if (data.prices.length === 0) continue;

		const sortedPrices = data.prices.sort((a, b) => a - b);
		const low = sortedPrices[0];
		const high = sortedPrices[sortedPrices.length - 1];
		const average = data.prices.reduce((sum, p) => sum + p, 0) / data.prices.length;

		// Capitalize service name
		const serviceName = (service || 'Service')
			.split(' ')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');

		rows.push({
			service: serviceName,
			lowPrice: formatPrice(low),
			highPrice: formatPrice(high),
			average: formatPrice(average),
			notes: data.examples.length > 1 
				? `Based on ${data.examples.length} providers` 
				: 'Limited data',
		});
	}

	// Sort by average price (extract number from string)
	rows.sort((a, b) => {
		const aVal = parseFloat(a.average.replace(/[^0-9.]/g, ''));
		const bVal = parseFloat(b.average.replace(/[^0-9.]/g, ''));
		return aVal - bVal;
	});

	return {
		columns: ['Service', 'Low', 'High', 'Average', 'Notes'],
		rows,
	};
}

/**
 * Generate city price comparisons
 */
export function generateCityComparison(
	providers: EnrichedProvider[],
	localKnowledge: LocalKnowledgeOutput
): CityPriceComparison[] {
	// Since all providers are typically from the same city in this context,
	// we'll use local knowledge price position to generate comparison
	const { pricePosition } = localKnowledge.marketContext;
	
	// Parse price position to determine percentage
	let vsRegionalAvg = '+0%';
	if (pricePosition.toLowerCase().includes('higher') || pricePosition.toLowerCase().includes('above')) {
		vsRegionalAvg = '+10-15%';
	} else if (pricePosition.toLowerCase().includes('lower') || pricePosition.toLowerCase().includes('below')) {
		vsRegionalAvg = '-5-10%';
	} else if (pricePosition.toLowerCase().includes('average') || pricePosition.toLowerCase().includes('typical')) {
		vsRegionalAvg = '+0%';
	}

	const city = localKnowledge.meta.city;
	const nearbyRef = localKnowledge.regionalIdentity.nearbyReference;

	return [
		{
			city: city,
			averagePrice: 'Market rate',
			vsRegionalAvg,
			notes: pricePosition,
		},
		{
			city: `${localKnowledge.regionalIdentity.region} average`,
			averagePrice: 'Regional baseline',
			vsRegionalAvg: '0%',
			notes: nearbyRef,
		},
	];
}

/**
 * Generate cost factors that affect pricing
 */
export function generateCostFactors(category: string): CostFactor[] {
	// Common cost factors applicable to most service categories
	return [
		{
			factor: 'Scope of work',
			impact: 'Major',
			explanation: 'Larger or more complex jobs naturally cost more. Get a detailed estimate based on your specific needs.',
		},
		{
			factor: 'Material costs',
			impact: 'Moderate to Major',
			explanation: 'Premium materials, name brands, or specialty items add to the total cost.',
		},
		{
			factor: 'Emergency or after-hours service',
			impact: 'Moderate',
			explanation: 'Expect 20-50% higher rates for same-day, weekend, or after-hours service.',
		},
		{
			factor: 'Accessibility',
			impact: 'Minor to Moderate',
			explanation: 'Difficult access, limited parking, or multi-story buildings may increase labor time and costs.',
		},
		{
			factor: 'Season and demand',
			impact: 'Minor',
			explanation: 'Peak seasons may have higher prices or longer wait times. Off-season may offer better rates.',
		},
		{
			factor: 'Permits and inspections',
			impact: 'Variable',
			explanation: 'Some work requires permits that add to the total project cost.',
		},
	];
}

/**
 * Generate real (or realistic) price examples
 */
export function generateRealExamples(
	aggregated: AggregatedPricing,
	city: string
): RealPriceExample[] {
	const examples: RealPriceExample[] = [];
	const currentDate = new Date().toISOString().split('T')[0];

	for (const [service, data] of aggregated.services) {
		if (data.examples.length === 0) continue;

		// Take first example for this service
		const example = data.examples[0];
		
		// Capitalize service name
		const serviceName = (service || 'Service')
			.split(' ')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');

		examples.push({
			description: serviceName,
			price: example.price,
			city,
			date: currentDate,
		});

		// Limit to 5 examples
		if (examples.length >= 5) break;
	}

	return examples;
}

/**
 * Generate saving tips for the category
 */
export function generateSavingTips(): string[] {
	return [
		'Get at least 3 quotes from different providers to compare pricing and services.',
		'Ask about any current promotions or discounts for first-time customers.',
		'Schedule service during off-peak seasons when providers may offer better rates.',
		'Bundle multiple services together for potential package discounts.',
		'Ask if paying in cash offers any discount (some providers offer 2-5% off).',
		'Check for senior, military, or first responder discounts.',
		'Consider scheduling non-urgent work in advance rather than emergency calls.',
	];
}

/**
 * Generate red flags to watch for
 */
export function generateRedFlags(): string[] {
	return [
		'Unusually low quotes that seem too good to be true.',
		'Pressure tactics or demands for immediate payment.',
		'Refusal to provide a written estimate or contract.',
		'No verifiable license, insurance, or business address.',
		'Asking for large upfront payments before work begins.',
		'Vague pricing with many potential "additional charges."',
		'No references or unwillingness to share past work examples.',
		'Only accepts cash or requires unusual payment methods.',
	];
}

/**
 * Generate pricing methodology explanation
 */
export function generatePricingMethodology(
	aggregated: AggregatedPricing,
	category: string
): string {
	return `Our pricing data comes from ${aggregated.providersWithPricing} verified ${category.toLowerCase()} providers in the area. We collect published pricing from provider websites, service menus, and direct inquiries. Prices are updated regularly to reflect current market conditions. Note that actual quotes may vary based on your specific situation, the scope of work required, and current material costs. We recommend getting multiple quotes for any significant project.`;
}
