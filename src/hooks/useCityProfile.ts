import { useMemo } from 'react';
import { DemographicsData } from '@/types/nodes';
import { CityProfile, detectCityProfile } from '@/api/serp/tiers';

interface UseCityProfileProps {
  demographics: DemographicsData | null | undefined;
  lat?: number;
  lng?: number;
}

interface UseCityProfileReturn {
  profile: CityProfile;
  hasTraits: boolean;
  traitCount: number;
}

/**
 * Hook to detect city profile from demographics data
 * Memoizes the detection to avoid recalculation
 */
export function useCityProfile({
  demographics,
  lat,
  lng,
}: UseCityProfileProps): UseCityProfileReturn {
  const profile = useMemo(() => {
    return detectCityProfile(demographics, lat, lng);
  }, [demographics, lat, lng]);

  const hasTraits = profile.traits.length > 0;
  const traitCount = profile.traits.length;

  return {
    profile,
    hasTraits,
    traitCount,
  };
}

export default useCityProfile;
