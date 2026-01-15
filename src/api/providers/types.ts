import { ProviderData, ProviderScore } from '@/types/nodes';

// Raw provider data from SerpAPI local pack
export interface RawProviderData {
  position: number;
  title: string;
  place_id?: string;
  address?: string;
  phone?: string;
  rating?: number;
  reviews?: number;
  type?: string;
  website?: string;
  thumbnail?: string;
  extensions?: string[];
  service_options?: {
    offers_online_appointments?: boolean;
  };
}

// SERP local pack response from SerpAPI
export interface LocalPackResponse {
  local_results?: RawProviderData[];
  ads?: {
    position: number;
    title: string;
    phone?: string;
    displayed_link?: string;
  }[];
  local_service_ads?: {
    title: string;
    phone?: string;
    website?: string;
  }[];
}

// Discovery result
export interface DiscoveryResult {
  providers: ProviderData[];
  fromCache: boolean;
  error: string | null;
}

// Cached provider data
export interface CachedProviderData {
  query: string;
  city: string;
  state: string | null;
  providers: ProviderData[];
  createdAt: Date;
  expiresAt: Date;
  fromCache: boolean;
}
