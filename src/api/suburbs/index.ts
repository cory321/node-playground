/**
 * Suburb Discovery API
 * Finds nearby suburbs/cities within a metropolitan area
 * Uses Nominatim for geocoding and Census for demographics
 */

import { fetchDemographicsForLocation } from '../census';
import { DemographicsData } from '@/types/nodes';
import { calculateScorecard, Grade, ScorecardResult } from '@/components/nodes/LocationNode/scoring';

// Suburb discovery result
export interface SuburbResult {
	name: string;
	displayName: string;
	county?: string;
	state: string;
	country: string;
	lat: number;
	lng: number;
	distance: number; // km from metro center
	population?: number;
	// Quick score preview (loaded lazily)
	demographics?: DemographicsData;
	scorecard?: ScorecardResult;
	isLoading?: boolean;
}

// Nominatim search result
interface NominatimPlace {
	place_id: number;
	lat: string;
	lon: string;
	display_name: string;
	name?: string;
	type: string;
	class: string;
	importance: number;
	address?: {
		city?: string;
		town?: string;
		village?: string;
		hamlet?: string;
		suburb?: string;
		county?: string;
		state?: string;
		country?: string;
	};
	extratags?: {
		population?: string;
	};
}

/**
 * Calculate distance between two coordinates in km
 */
function calculateDistance(
	lat1: number,
	lng1: number,
	lat2: number,
	lng2: number
): number {
	const R = 6371; // Earth's radius in km
	const dLat = ((lat2 - lat1) * Math.PI) / 180;
	const dLng = ((lng2 - lng1) * Math.PI) / 180;
	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos((lat1 * Math.PI) / 180) *
			Math.cos((lat2 * Math.PI) / 180) *
			Math.sin(dLng / 2) *
			Math.sin(dLng / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return R * c;
}

/**
 * Search for places near a given location
 * Uses Nominatim's structured search to find cities, towns, and villages
 */
async function searchNearbyPlaces(
	lat: number,
	lng: number,
	state: string,
	radiusKm: number = 80
): Promise<NominatimPlace[]> {
	// Calculate bounding box
	const latOffset = radiusKm / 111; // 1 degree latitude ≈ 111 km
	const lngOffset = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));

	const minLat = lat - latOffset;
	const maxLat = lat + latOffset;
	const minLng = lng - lngOffset;
	const maxLng = lng + lngOffset;

	// Search for cities and towns in the state within the bounding box
	const searchUrl = `https://nominatim.openstreetmap.org/search?format=json&state=${encodeURIComponent(state)}&featuretype=city&bounded=1&viewbox=${minLng},${maxLat},${maxLng},${minLat}&limit=50&addressdetails=1&extratags=1`;

	try {
		const response = await fetch(searchUrl, {
			headers: {
				'Accept-Language': 'en',
				'User-Agent': 'NodeBuilder/1.0',
			},
		});

		if (!response.ok) {
			console.error('Nominatim search failed:', response.status);
			return [];
		}

		const data: NominatimPlace[] = await response.json();
		return data;
	} catch (error) {
		console.error('Failed to search nearby places:', error);
		return [];
	}
}

/**
 * Get well-known suburbs for major US metros
 * Fallback data for common metros
 */
const KNOWN_SUBURBS: Record<string, { name: string; state: string }[]> = {
	// Texas metros
	'Austin': [
		{ name: 'Round Rock', state: 'Texas' },
		{ name: 'Cedar Park', state: 'Texas' },
		{ name: 'Pflugerville', state: 'Texas' },
		{ name: 'Georgetown', state: 'Texas' },
		{ name: 'Leander', state: 'Texas' },
		{ name: 'San Marcos', state: 'Texas' },
		{ name: 'Kyle', state: 'Texas' },
		{ name: 'Buda', state: 'Texas' },
	],
	'Dallas': [
		{ name: 'Plano', state: 'Texas' },
		{ name: 'Frisco', state: 'Texas' },
		{ name: 'McKinney', state: 'Texas' },
		{ name: 'Allen', state: 'Texas' },
		{ name: 'Richardson', state: 'Texas' },
		{ name: 'Carrollton', state: 'Texas' },
		{ name: 'Denton', state: 'Texas' },
		{ name: 'Flower Mound', state: 'Texas' },
	],
	'Houston': [
		{ name: 'Sugar Land', state: 'Texas' },
		{ name: 'Katy', state: 'Texas' },
		{ name: 'The Woodlands', state: 'Texas' },
		{ name: 'Pearland', state: 'Texas' },
		{ name: 'League City', state: 'Texas' },
		{ name: 'Missouri City', state: 'Texas' },
		{ name: 'Baytown', state: 'Texas' },
		{ name: 'Conroe', state: 'Texas' },
	],
	'San Antonio': [
		{ name: 'New Braunfels', state: 'Texas' },
		{ name: 'Boerne', state: 'Texas' },
		{ name: 'Schertz', state: 'Texas' },
		{ name: 'Cibolo', state: 'Texas' },
		{ name: 'Universal City', state: 'Texas' },
		{ name: 'Seguin', state: 'Texas' },
	],
	// Arizona
	'Phoenix': [
		{ name: 'Scottsdale', state: 'Arizona' },
		{ name: 'Gilbert', state: 'Arizona' },
		{ name: 'Chandler', state: 'Arizona' },
		{ name: 'Mesa', state: 'Arizona' },
		{ name: 'Tempe', state: 'Arizona' },
		{ name: 'Peoria', state: 'Arizona' },
		{ name: 'Glendale', state: 'Arizona' },
		{ name: 'Surprise', state: 'Arizona' },
	],
	// California
	'Los Angeles': [
		{ name: 'Pasadena', state: 'California' },
		{ name: 'Burbank', state: 'California' },
		{ name: 'Santa Monica', state: 'California' },
		{ name: 'Torrance', state: 'California' },
		{ name: 'Irvine', state: 'California' },
		{ name: 'Huntington Beach', state: 'California' },
		{ name: 'Costa Mesa', state: 'California' },
		{ name: 'Newport Beach', state: 'California' },
	],
	'San Francisco': [
		{ name: 'Oakland', state: 'California' },
		{ name: 'Berkeley', state: 'California' },
		{ name: 'Fremont', state: 'California' },
		{ name: 'Walnut Creek', state: 'California' },
		{ name: 'San Mateo', state: 'California' },
		{ name: 'Palo Alto', state: 'California' },
		{ name: 'Mountain View', state: 'California' },
		{ name: 'Sunnyvale', state: 'California' },
	],
	'San Diego': [
		{ name: 'Chula Vista', state: 'California' },
		{ name: 'Oceanside', state: 'California' },
		{ name: 'Carlsbad', state: 'California' },
		{ name: 'Escondido', state: 'California' },
		{ name: 'La Mesa', state: 'California' },
		{ name: 'El Cajon', state: 'California' },
		{ name: 'Encinitas', state: 'California' },
	],
	// Florida
	'Miami': [
		{ name: 'Fort Lauderdale', state: 'Florida' },
		{ name: 'Boca Raton', state: 'Florida' },
		{ name: 'Coral Gables', state: 'Florida' },
		{ name: 'Pembroke Pines', state: 'Florida' },
		{ name: 'Hollywood', state: 'Florida' },
		{ name: 'Coral Springs', state: 'Florida' },
		{ name: 'Doral', state: 'Florida' },
	],
	'Tampa': [
		{ name: 'St. Petersburg', state: 'Florida' },
		{ name: 'Clearwater', state: 'Florida' },
		{ name: 'Brandon', state: 'Florida' },
		{ name: 'Palm Harbor', state: 'Florida' },
		{ name: 'Lakeland', state: 'Florida' },
		{ name: 'Wesley Chapel', state: 'Florida' },
	],
	'Orlando': [
		{ name: 'Winter Park', state: 'Florida' },
		{ name: 'Kissimmee', state: 'Florida' },
		{ name: 'Altamonte Springs', state: 'Florida' },
		{ name: 'Oviedo', state: 'Florida' },
		{ name: 'Lake Mary', state: 'Florida' },
		{ name: 'Sanford', state: 'Florida' },
	],
	// Other major metros
	'Seattle': [
		{ name: 'Bellevue', state: 'Washington' },
		{ name: 'Tacoma', state: 'Washington' },
		{ name: 'Redmond', state: 'Washington' },
		{ name: 'Kirkland', state: 'Washington' },
		{ name: 'Renton', state: 'Washington' },
		{ name: 'Kent', state: 'Washington' },
		{ name: 'Everett', state: 'Washington' },
	],
	'Denver': [
		{ name: 'Aurora', state: 'Colorado' },
		{ name: 'Lakewood', state: 'Colorado' },
		{ name: 'Arvada', state: 'Colorado' },
		{ name: 'Westminster', state: 'Colorado' },
		{ name: 'Boulder', state: 'Colorado' },
		{ name: 'Centennial', state: 'Colorado' },
		{ name: 'Littleton', state: 'Colorado' },
	],
	'Atlanta': [
		{ name: 'Marietta', state: 'Georgia' },
		{ name: 'Alpharetta', state: 'Georgia' },
		{ name: 'Roswell', state: 'Georgia' },
		{ name: 'Sandy Springs', state: 'Georgia' },
		{ name: 'Johns Creek', state: 'Georgia' },
		{ name: 'Smyrna', state: 'Georgia' },
		{ name: 'Kennesaw', state: 'Georgia' },
	],
	'Chicago': [
		{ name: 'Naperville', state: 'Illinois' },
		{ name: 'Aurora', state: 'Illinois' },
		{ name: 'Evanston', state: 'Illinois' },
		{ name: 'Schaumburg', state: 'Illinois' },
		{ name: 'Oak Park', state: 'Illinois' },
		{ name: 'Skokie', state: 'Illinois' },
		{ name: 'Arlington Heights', state: 'Illinois' },
	],
	'New York': [
		{ name: 'Jersey City', state: 'New Jersey' },
		{ name: 'Newark', state: 'New Jersey' },
		{ name: 'Yonkers', state: 'New York' },
		{ name: 'White Plains', state: 'New York' },
		{ name: 'Stamford', state: 'Connecticut' },
		{ name: 'New Rochelle', state: 'New York' },
	],
	'Boston': [
		{ name: 'Cambridge', state: 'Massachusetts' },
		{ name: 'Somerville', state: 'Massachusetts' },
		{ name: 'Brookline', state: 'Massachusetts' },
		{ name: 'Newton', state: 'Massachusetts' },
		{ name: 'Quincy', state: 'Massachusetts' },
		{ name: 'Waltham', state: 'Massachusetts' },
	],
	'Philadelphia': [
		{ name: 'Cherry Hill', state: 'New Jersey' },
		{ name: 'King of Prussia', state: 'Pennsylvania' },
		{ name: 'Wilmington', state: 'Delaware' },
		{ name: 'Media', state: 'Pennsylvania' },
		{ name: 'Ardmore', state: 'Pennsylvania' },
	],
	'Las Vegas': [
		{ name: 'Henderson', state: 'Nevada' },
		{ name: 'North Las Vegas', state: 'Nevada' },
		{ name: 'Summerlin', state: 'Nevada' },
		{ name: 'Paradise', state: 'Nevada' },
	],
};

/**
 * Search for a specific city to get its coordinates
 */
async function geocodeCity(
	cityName: string,
	state: string
): Promise<{ lat: number; lng: number } | null> {
	const searchUrl = `https://nominatim.openstreetmap.org/search?format=json&city=${encodeURIComponent(cityName)}&state=${encodeURIComponent(state)}&country=USA&limit=1`;

	try {
		const response = await fetch(searchUrl, {
			headers: {
				'Accept-Language': 'en',
				'User-Agent': 'NodeBuilder/1.0',
			},
		});

		if (!response.ok) return null;

		const data: NominatimPlace[] = await response.json();
		if (data.length > 0) {
			return {
				lat: parseFloat(data[0].lat),
				lng: parseFloat(data[0].lon),
			};
		}
		return null;
	} catch {
		return null;
	}
}

/**
 * Discover suburbs near a major metro
 * Returns a list of suburbs with basic info, demographics loaded on demand
 */
export async function discoverSuburbs(
	metroName: string,
	metroLat: number,
	metroLng: number,
	metroState: string,
	options: {
		radiusKm?: number;
		maxResults?: number;
		minPopulation?: number;
		maxPopulation?: number;
	} = {}
): Promise<SuburbResult[]> {
	const {
		radiusKm = 80,
		maxResults = 15,
		minPopulation = 20000,
		maxPopulation = 300000,
	} = options;

	const suburbs: SuburbResult[] = [];

	// First, try known suburbs for major metros
	const normalizedMetro = metroName.trim();
	const knownSuburbs = KNOWN_SUBURBS[normalizedMetro];

	if (knownSuburbs) {
		console.log(`Found ${knownSuburbs.length} known suburbs for ${normalizedMetro}`);

		// Geocode each known suburb
		const geocodePromises = knownSuburbs.slice(0, maxResults).map(async (suburb) => {
			const coords = await geocodeCity(suburb.name, suburb.state);
			if (coords) {
				const distance = calculateDistance(
					metroLat,
					metroLng,
					coords.lat,
					coords.lng
				);
				return {
					name: suburb.name,
					displayName: `${suburb.name}, ${suburb.state}`,
					state: suburb.state,
					country: 'United States',
					lat: coords.lat,
					lng: coords.lng,
					distance,
				} as SuburbResult;
			}
			return null;
		});

		const results = await Promise.all(geocodePromises);
		suburbs.push(...results.filter((r): r is SuburbResult => r !== null));
	}

	// Also search Nominatim for additional nearby places
	const nearbyPlaces = await searchNearbyPlaces(
		metroLat,
		metroLng,
		metroState,
		radiusKm
	);

	for (const place of nearbyPlaces) {
		// Skip if already added from known suburbs
		const placeName =
			place.address?.city ||
			place.address?.town ||
			place.name ||
			place.display_name.split(',')[0];

		if (suburbs.some((s) => s.name.toLowerCase() === placeName.toLowerCase())) {
			continue;
		}

		// Skip if it's the metro itself
		if (placeName.toLowerCase() === metroName.toLowerCase()) {
			continue;
		}

		const lat = parseFloat(place.lat);
		const lng = parseFloat(place.lon);
		const distance = calculateDistance(metroLat, metroLng, lat, lng);

		// Skip if outside radius
		if (distance > radiusKm) continue;

		// Check population if available
		const population = place.extratags?.population
			? parseInt(place.extratags.population, 10)
			: undefined;

		if (population) {
			if (population < minPopulation || population > maxPopulation) continue;
		}

		suburbs.push({
			name: placeName,
			displayName: place.display_name,
			county: place.address?.county,
			state: place.address?.state || metroState,
			country: place.address?.country || 'United States',
			lat,
			lng,
			distance,
			population,
		});
	}

	// Sort by distance and limit results
	return suburbs
		.sort((a, b) => a.distance - b.distance)
		.slice(0, maxResults);
}

/**
 * Load demographics and scorecard for a suburb
 */
export async function loadSuburbDemographics(
	suburb: SuburbResult
): Promise<SuburbResult> {
	try {
		const demographics = await fetchDemographicsForLocation({
			name: suburb.name,
			county: suburb.county,
			state: suburb.state,
			lat: suburb.lat,
			lng: suburb.lng,
		});

		if (demographics) {
			const scorecard = calculateScorecard(demographics);
			return {
				...suburb,
				demographics,
				scorecard,
				population: demographics.population ?? suburb.population,
				isLoading: false,
			};
		}
	} catch (error) {
		console.error(`Failed to load demographics for ${suburb.name}:`, error);
	}

	return {
		...suburb,
		isLoading: false,
	};
}

/**
 * Load demographics for multiple suburbs in parallel
 */
export async function loadAllSuburbDemographics(
	suburbs: SuburbResult[],
	concurrency: number = 3
): Promise<SuburbResult[]> {
	const results: SuburbResult[] = [];

	// Process in batches to avoid overwhelming the API
	for (let i = 0; i < suburbs.length; i += concurrency) {
		const batch = suburbs.slice(i, i + concurrency);
		const batchResults = await Promise.all(
			batch.map((s) => loadSuburbDemographics(s))
		);
		results.push(...batchResults);
	}

	// Sort by score (highest first)
	return results.sort((a, b) => {
		const scoreA = a.scorecard?.totalScore ?? 0;
		const scoreB = b.scorecard?.totalScore ?? 0;
		return scoreB - scoreA;
	});
}

/**
 * Get grade color class for display
 */
export function getGradeColorClass(grade: Grade): string {
	switch (grade) {
		case 'A':
		case 'B':
			return 'text-emerald-400';
		case 'C':
		case 'D':
			return 'text-amber-400';
		case 'F':
			return 'text-red-400';
	}
}

/**
 * Get grade background color class
 */
export function getGradeBgClass(grade: Grade): string {
	switch (grade) {
		case 'A':
		case 'B':
			return 'bg-emerald-500/20 border-emerald-500/30';
		case 'C':
		case 'D':
			return 'bg-amber-500/20 border-amber-500/30';
		case 'F':
			return 'bg-red-500/20 border-red-500/30';
	}
}
