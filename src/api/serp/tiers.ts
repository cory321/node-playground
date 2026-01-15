import { DemographicsData } from '@/types/nodes';

// City profile detected from demographics
export interface CityProfile {
  isCollegeTown: boolean; // age 18-24 > 15%
  isRetirement: boolean; // age 65+ > 20%
  isHighIncome: boolean; // median income > $100K
  isCoastal: boolean; // proximity to coast (lat/lng check)
  isTourism: boolean; // manual flag for now
  traits: string[]; // Human-readable trait names
  tier2Categories: string[]; // Categories to scan based on profile
}

// Tier configuration
export interface TierConfig {
  id: 'tier1' | 'tier2' | 'tier3';
  name: string;
  description: string;
  categories: string[];
}

// Known aggregator domains to detect weak SERPs
export const AGGREGATOR_DOMAINS = [
  'yelp.com',
  'angi.com',
  'thumbtack.com',
  'homeadvisor.com',
  'houzz.com',
  'bark.com',
  'porch.com',
  'networx.com',
  'homeservices.com',
  'angieslist.com',
  'taskrabbit.com',
  'handy.com',
];

// Tier 1: Core categories - always scan (highest hit rate)
export const TIER1_CATEGORIES: string[] = [
  'appliance repair',
  'house cleaning',
  'junk removal',
  'hvac repair',
  'garage door repair',
  'mobile pet grooming',
];

// Tier 2: Market-conditional categories
export const TIER2_CONDITIONS: {
  condition: keyof CityProfile;
  categories: string[];
  trait: string;
}[] = [
  {
    condition: 'isCollegeTown',
    categories: ['carpet cleaning', 'moving service'],
    trait: 'College Town',
  },
  {
    condition: 'isCoastal',
    categories: ['vacation rental cleaning', 'boat detailing'],
    trait: 'Coastal',
  },
  {
    condition: 'isRetirement',
    categories: ['senior home care', 'estate cleanout'],
    trait: 'Retirement Community',
  },
  {
    condition: 'isHighIncome',
    categories: ['pool service', 'landscaping'],
    trait: 'High Income',
  },
  {
    condition: 'isTourism',
    categories: ['event catering', 'photography'],
    trait: 'Tourism Hub',
  },
];

// Tier 3: Deep dive categories (related/long-tail)
export const TIER3_EXPANSIONS: Record<string, string[]> = {
  'appliance repair': [
    'washer repair',
    'refrigerator repair',
    'dishwasher repair',
  ],
  'hvac repair': ['ac repair', 'furnace repair', 'heating repair'],
  'house cleaning': ['deep cleaning', 'move out cleaning', 'maid service'],
  'junk removal': ['furniture removal', 'appliance hauling', 'estate cleanout'],
  'garage door repair': [
    'garage door installation',
    'garage door opener repair',
  ],
  'mobile pet grooming': ['dog grooming', 'cat grooming'],
};

// Quick triage search query
export const TRIAGE_QUERY = 'home services near me';

// Scan configuration defaults
export interface ScanConfig {
  maxSearchesPerCity: number;
  deepDiveThreshold: number; // Score >= this to trigger Tier 3
  cacheExpiryDays: number;
  enableDeepDive: boolean;
  delayBetweenSearchesMs: number;
}

export const DEFAULT_SCAN_CONFIG: ScanConfig = {
  maxSearchesPerCity: 12,
  deepDiveThreshold: 7,
  cacheExpiryDays: 7,
  enableDeepDive: true,
  delayBetweenSearchesMs: 200,
};

/**
 * Detect city profile from demographics data
 */
export function detectCityProfile(
  demographics: DemographicsData | null | undefined,
  lat?: number,
  lng?: number
): CityProfile {
  const profile: CityProfile = {
    isCollegeTown: false,
    isRetirement: false,
    isHighIncome: false,
    isCoastal: false,
    isTourism: false,
    traits: [],
    tier2Categories: [],
  };

  if (!demographics) {
    return profile;
  }

  // High income detection (median household income > $100K)
  if (
    demographics.medianHouseholdIncome &&
    demographics.medianHouseholdIncome > 100000
  ) {
    profile.isHighIncome = true;
    profile.traits.push('High Income');
  }

  // Coastal detection (within ~50 miles of US coastlines)
  // Simplified check using longitude for US coasts
  if (lat !== undefined && lng !== undefined) {
    const isEastCoast = lng > -82 && lng < -66 && lat > 24 && lat < 48;
    const isWestCoast = lng > -130 && lng < -117 && lat > 32 && lat < 49;
    const isGulfCoast = lng > -98 && lng < -80 && lat > 24 && lat < 32;

    if (isEastCoast || isWestCoast || isGulfCoast) {
      profile.isCoastal = true;
      profile.traits.push('Coastal');
    }
  }

  // College town and retirement detection would need age demographics
  // which aren't currently in DemographicsData, so we'll use population-based heuristics

  // Small-medium cities with high homeownership often have retirees
  if (
    demographics.population &&
    demographics.homeownershipRate &&
    demographics.population > 20000 &&
    demographics.population < 100000 &&
    demographics.homeownershipRate > 70
  ) {
    profile.isRetirement = true;
    profile.traits.push('Retirement Community');
  }

  // Compute Tier 2 categories based on detected traits
  for (const condition of TIER2_CONDITIONS) {
    if (profile[condition.condition]) {
      profile.tier2Categories.push(...condition.categories);
    }
  }

  return profile;
}

/**
 * Get all categories to scan for a city based on profile and config
 */
export function getCategoriesToScan(
  profile: CityProfile,
  config: ScanConfig = DEFAULT_SCAN_CONFIG
): {
  tier1: string[];
  tier2: string[];
  total: number;
} {
  const tier1 = [...TIER1_CATEGORIES];
  const tier2 = [...new Set(profile.tier2Categories)]; // Dedupe

  // Respect max searches limit
  const total = Math.min(tier1.length + tier2.length, config.maxSearchesPerCity);

  return {
    tier1: tier1.slice(0, Math.min(tier1.length, config.maxSearchesPerCity)),
    tier2: tier2.slice(
      0,
      Math.max(0, config.maxSearchesPerCity - tier1.length)
    ),
    total,
  };
}

/**
 * Get Tier 3 expansion categories for a given category
 */
export function getTier3Categories(
  category: string,
  score: number,
  config: ScanConfig = DEFAULT_SCAN_CONFIG
): string[] {
  if (!config.enableDeepDive || score < config.deepDiveThreshold) {
    return [];
  }

  const normalizedCategory = category.toLowerCase();
  return TIER3_EXPANSIONS[normalizedCategory] || [];
}

/**
 * Check if a domain is a known aggregator
 */
export function isAggregatorDomain(domain: string): boolean {
  const normalized = domain.toLowerCase().replace(/^www\./, '');
  return AGGREGATOR_DOMAINS.some(
    (agg) => normalized === agg || normalized.endsWith(`.${agg}`)
  );
}

/**
 * Get the tier label for a category
 */
export function getCategoryTier(
  category: string,
  profile: CityProfile
): 'tier1' | 'tier2' | 'tier3' {
  if (TIER1_CATEGORIES.includes(category.toLowerCase())) {
    return 'tier1';
  }
  if (profile.tier2Categories.includes(category.toLowerCase())) {
    return 'tier2';
  }
  return 'tier3';
}
