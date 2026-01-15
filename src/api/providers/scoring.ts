import { ProviderScore, ProviderPriority } from '@/types/nodes';
import { RawProviderData } from './types';

/**
 * Score advertising activity (1-5)
 * 5: Running Google LSAs (paying per lead already!)
 * 4: Running Google Ads
 * 3: Listed on paid directories (Angi, HomeAdvisor)
 * 2: Free listings only (Yelp, Google Maps)
 * 1: No online presence at all
 */
export function scoreAdvertising(
  provider: RawProviderData,
  context: { hasLSA: boolean; hasGoogleAds: boolean }
): number {
  if (context.hasLSA) return 5;
  if (context.hasGoogleAds) return 4;
  // If they have a website and reviews, they're at least on free listings
  if (provider.website && provider.reviews && provider.reviews > 0) return 2;
  if (provider.reviews && provider.reviews > 0) return 2;
  return 1;
}

/**
 * Score digital presence (1-5)
 * 5: Professional website, but not dominant in SEO
 * 4: Basic website, outdated or template
 * 3: No website, but active on Yelp/Google
 * 2: Minimal presence, hard to find
 * 1: Cannot find online at all
 */
export function scoreDigitalPresence(provider: RawProviderData): number {
  const hasWebsite = !!provider.website;
  const hasGoodReviews = (provider.reviews || 0) > 10;
  const hasRating = (provider.rating || 0) > 0;

  if (hasWebsite && hasGoodReviews) return 5;
  if (hasWebsite) return 4;
  if (hasRating && hasGoodReviews) return 3;
  if (hasRating) return 2;
  return 1;
}

/**
 * Score review velocity (1-5)
 * We can't know exact review dates from SerpAPI, but we can infer from review count
 * 5: Many reviews (50+) = likely active business
 * 4: Good reviews (20-49)
 * 3: Some reviews (10-19)
 * 2: Few reviews (1-9)
 * 1: No reviews
 */
export function scoreReviewVelocity(provider: RawProviderData): number {
  const reviews = provider.reviews || 0;

  if (reviews >= 50) return 5;
  if (reviews >= 20) return 4;
  if (reviews >= 10) return 3;
  if (reviews >= 1) return 2;
  return 1;
}

/**
 * Score size signals (1-5) - Sweet spot is 2-4
 * 5: Solo operator (hungry, but may lack capacity)
 * 4: Small team (2-5 people) — IDEAL
 * 3: Medium company (6-15) — Good
 * 2: Large local company — May have established lead sources
 * 1: National franchise — Often have corporate lead contracts
 * 
 * We infer size from business name patterns and review count
 */
const FRANCHISE_PATTERNS = [
  /^sears/i,
  /^home\s*depot/i,
  /^lowe'?s/i,
  /^1-?800-?got-?junk/i,
  /^servpro/i,
  /^servicemaster/i,
  /^molly\s*maid/i,
  /^merry\s*maids/i,
  /^stanley\s*steemer/i,
  /^roto-?rooter/i,
  /^mr\.?\s*appliance/i,
  /^mr\.?\s*electric/i,
  /^one\s*hour\s*heating/i,
  /^benjamin\s*franklin\s*plumbing/i,
  /^home\s*instead/i,
  /^visiting\s*angels/i,
  /^comfort\s*keepers/i,
  /^vacasa/i,
  /^evolve/i,
];

export function scoreSizeSignal(provider: RawProviderData): number {
  const name = provider.title.toLowerCase();
  const reviews = provider.reviews || 0;

  // Check for national franchises
  for (const pattern of FRANCHISE_PATTERNS) {
    if (pattern.test(name)) {
      return 1; // National franchise
    }
  }

  // Infer size from review count and name patterns
  // Very high review counts might indicate larger companies
  if (reviews > 500) return 2; // Probably large local company
  if (reviews > 200) return 3; // Medium company

  // Look for "& Son", "Bros", "Family" patterns indicating small operations
  if (/(&\s*son|bros\.?|brothers|family)/i.test(name)) {
    return 4; // Small team - IDEAL
  }

  // Low review count suggests smaller operator
  if (reviews < 20) return 5; // Likely solo or very small

  return 4; // Default to small team
}

/**
 * Score reachability (1-5)
 * 5: Phone number available
 * 4: Website available (can find contact info)
 * 3: Has address only
 * 2: Only listing, minimal info
 * 1: No way to contact directly
 */
export function scoreReachability(provider: RawProviderData): number {
  const hasPhone = !!provider.phone;
  const hasWebsite = !!provider.website;
  const hasAddress = !!provider.address;

  if (hasPhone) return 5;
  if (hasWebsite) return 4;
  if (hasAddress) return 3;
  return 2; // They're in the local pack, so some way exists
}

/**
 * Get priority tier from total score
 * P1 (20-25): Contact immediately - High likelihood of buying
 * P2 (15-19): Strong candidate - Contact in first wave
 * P3 (10-14): Maybe - Contact if P1/P2 don't pan out
 * P4 (5-9): Cold - Unlikely buyer, skip unless desperate
 * skip (<5): Can't reach or no need for leads
 */
export function getPriority(total: number): ProviderPriority {
  if (total >= 20) return 'P1';
  if (total >= 15) return 'P2';
  if (total >= 10) return 'P3';
  if (total >= 5) return 'P4';
  return 'skip';
}

/**
 * Generate reasoning for the score
 */
export function generateReasoning(
  provider: RawProviderData,
  score: ProviderScore,
  context: { hasLSA: boolean; hasGoogleAds: boolean }
): string {
  const reasons: string[] = [];

  if (context.hasLSA) {
    reasons.push('Running Google LSAs (already paying for leads)');
  } else if (context.hasGoogleAds) {
    reasons.push('Running Google Ads');
  }

  if (provider.website) {
    reasons.push('Has website');
  } else {
    reasons.push('Website missing from Google Business Profile');
  }

  const reviews = provider.reviews || 0;
  if (reviews >= 50) {
    reasons.push(`Active with ${reviews} reviews`);
  } else if (reviews >= 10) {
    reasons.push(`${reviews} reviews`);
  } else if (reviews > 0) {
    reasons.push(`Only ${reviews} reviews (smaller operator)`);
  }

  if (provider.phone) {
    reasons.push('Phone available');
  }

  if (score.sizeSignal === 1) {
    reasons.push('National franchise - may have corporate contracts');
  } else if (score.sizeSignal >= 4) {
    reasons.push('Small team - ideal lead buyer');
  }

  return reasons.join('. ');
}

/**
 * Score a single provider using the 25-point framework
 */
export function scoreProvider(
  provider: RawProviderData,
  context: { hasLSA: boolean; hasGoogleAds: boolean }
): ProviderScore {
  const advertising = scoreAdvertising(provider, context);
  const digitalPresence = scoreDigitalPresence(provider);
  const reviewVelocity = scoreReviewVelocity(provider);
  const sizeSignal = scoreSizeSignal(provider);
  const reachability = scoreReachability(provider);

  const total = advertising + digitalPresence + reviewVelocity + sizeSignal + reachability;
  const priority = getPriority(total);

  return {
    advertising,
    digitalPresence,
    reviewVelocity,
    sizeSignal,
    reachability,
    total,
    priority,
  };
}
