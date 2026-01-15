// US Census Bureau API integration
// Provides demographic data from the American Community Survey (ACS)

// FIPS codes for states, counties, and places
export interface FIPSCodes {
  state: string;
  county?: string;
  place?: string;  // For city/town level data
}

// Demographics data structure
export interface DemographicsData {
  population: number | null;
  medianHouseholdIncome: number | null;
  homeownershipRate: number | null;
  medianHomeValue: number | null;
  geographyLevel: 'place' | 'county' | 'state';
  geographyName: string;
}

// Location data for demographics lookup
export interface LocationForDemographics {
  name: string;
  county?: string;
  state: string;
  lat: number;
  lng: number;
}

// State name to FIPS code mapping
const STATE_FIPS: Record<string, string> = {
  'Alabama': '01', 'Alaska': '02', 'Arizona': '04', 'Arkansas': '05',
  'California': '06', 'Colorado': '08', 'Connecticut': '09', 'Delaware': '10',
  'District of Columbia': '11', 'Florida': '12', 'Georgia': '13', 'Hawaii': '15',
  'Idaho': '16', 'Illinois': '17', 'Indiana': '18', 'Iowa': '19',
  'Kansas': '20', 'Kentucky': '21', 'Louisiana': '22', 'Maine': '23',
  'Maryland': '24', 'Massachusetts': '25', 'Michigan': '26', 'Minnesota': '27',
  'Mississippi': '28', 'Missouri': '29', 'Montana': '30', 'Nebraska': '31',
  'Nevada': '32', 'New Hampshire': '33', 'New Jersey': '34', 'New Mexico': '35',
  'New York': '36', 'North Carolina': '37', 'North Dakota': '38', 'Ohio': '39',
  'Oklahoma': '40', 'Oregon': '41', 'Pennsylvania': '42', 'Rhode Island': '44',
  'South Carolina': '45', 'South Dakota': '46', 'Tennessee': '47', 'Texas': '48',
  'Utah': '49', 'Vermont': '50', 'Virginia': '51', 'Washington': '53',
  'West Virginia': '54', 'Wisconsin': '55', 'Wyoming': '56',
  'Puerto Rico': '72', 'Guam': '66', 'U.S. Virgin Islands': '78',
};

// Storage key for Census API key
const CENSUS_KEY_STORAGE = 'nodeBuilderCensusApiKey';

// Cache for FIPS lookups to avoid repeated API calls
const countyFipsCache: Map<string, Map<string, string>> = new Map();
const placeFipsCache: Map<string, Map<string, string>> = new Map();

// Get Census API key from localStorage or env
export function getCensusApiKey(): string {
  // Try env first
  const envKey = import.meta.env.VITE_CENSUS_BUREAU_API_KEY || '';
  if (envKey) return envKey;

  // Fall back to localStorage
  try {
    return localStorage.getItem(CENSUS_KEY_STORAGE) || '';
  } catch {
    return '';
  }
}

// Save Census API key to localStorage
export function saveCensusApiKey(key: string): void {
  localStorage.setItem(CENSUS_KEY_STORAGE, key);
}

// Check if Census API key is available
export function hasCensusApiKey(): boolean {
  return !!getCensusApiKey();
}

/**
 * Get state FIPS code from state name
 */
export function getStateFips(stateName: string): string | null {
  // Try exact match first
  if (STATE_FIPS[stateName]) {
    return STATE_FIPS[stateName];
  }
  
  // Try case-insensitive match
  const normalized = stateName.trim();
  for (const [name, fips] of Object.entries(STATE_FIPS)) {
    if (name.toLowerCase() === normalized.toLowerCase()) {
      return fips;
    }
  }
  
  return null;
}

/**
 * Normalize place/city name for matching
 * Handles variations like "Glendale city" vs "Glendale" vs "GLENDALE"
 */
function normalizePlaceName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+city$/i, '')
    .replace(/\s+town$/i, '')
    .replace(/\s+village$/i, '')
    .replace(/\s+borough$/i, '')
    .replace(/\s+cdp$/i, '')  // Census Designated Place
    .replace(/\s+municipality$/i, '')
    .trim();
}

/**
 * Normalize county name for matching
 * Handles variations like "Tulare County" vs "Tulare" vs "TULARE"
 */
function normalizeCountyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+county$/i, '')
    .replace(/\s+parish$/i, '')  // Louisiana uses "Parish"
    .replace(/\s+borough$/i, '') // Alaska uses "Borough"
    .replace(/\s+municipality$/i, '')
    .replace(/\s+census\s+area$/i, '') // Alaska census areas
    .replace(/\s+city$/i, '') // Independent cities like "Baltimore city"
    .trim();
}

/**
 * Fetch all places (cities/towns) in a state and build a name-to-FIPS mapping
 * Results are cached to avoid repeated API calls
 */
async function getPlaceFipsMap(stateFips: string): Promise<Map<string, string> | null> {
  const apiKey = getCensusApiKey();
  if (!apiKey) return null;

  // Check cache first
  if (placeFipsCache.has(stateFips)) {
    return placeFipsCache.get(stateFips)!;
  }

  try {
    // Fetch all places in the state
    const url = `https://api.census.gov/data/2022/acs/acs5?get=NAME&for=place:*&in=state:${stateFips}&key=${apiKey}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('Failed to fetch places:', response.status);
      return null;
    }

    const data: string[][] = await response.json();
    
    // Build the mapping (skip header row)
    const placeMap = new Map<string, string>();
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      // Format: [NAME, state, place] e.g. ["Glendale city, California", "06", "30000"]
      const fullName = row[0];
      const placeFips = row[row.length - 1]; // Place FIPS is last column
      
      // Store with normalized name as key
      const normalizedName = normalizePlaceName(fullName.split(',')[0]);
      placeMap.set(normalizedName, placeFips);
    }

    // Cache the result
    placeFipsCache.set(stateFips, placeMap);
    console.log(`Cached ${placeMap.size} places for state ${stateFips}`);
    return placeMap;
  } catch (error) {
    console.error('Failed to fetch place list:', error);
    return null;
  }
}

/**
 * Look up place FIPS code by place name and state
 */
export async function getPlaceFips(
  placeName: string,
  stateFips: string
): Promise<string | null> {
  const placeMap = await getPlaceFipsMap(stateFips);
  if (!placeMap) return null;

  const normalizedSearch = normalizePlaceName(placeName);
  
  // Try exact match first
  if (placeMap.has(normalizedSearch)) {
    return placeMap.get(normalizedSearch)!;
  }

  // Try partial match
  for (const [name, fips] of placeMap.entries()) {
    if (name === normalizedSearch || 
        name.startsWith(normalizedSearch) || 
        normalizedSearch.startsWith(name)) {
      return fips;
    }
  }

  return null;
}

/**
 * Fetch all counties in a state and build a name-to-FIPS mapping
 * Results are cached to avoid repeated API calls
 */
async function getCountyFipsMap(stateFips: string): Promise<Map<string, string> | null> {
  const apiKey = getCensusApiKey();
  if (!apiKey) return null;

  // Check cache first
  if (countyFipsCache.has(stateFips)) {
    return countyFipsCache.get(stateFips)!;
  }

  try {
    // Fetch all counties in the state
    const url = `https://api.census.gov/data/2022/acs/acs5?get=NAME&for=county:*&in=state:${stateFips}&key=${apiKey}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('Failed to fetch counties:', response.status);
      return null;
    }

    const data: string[][] = await response.json();
    
    // Build the mapping (skip header row)
    const countyMap = new Map<string, string>();
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      // Format: [NAME, state, county] e.g. ["Tulare County, California", "06", "107"]
      const name = row[0];
      const countyFips = row[row.length - 1]; // County FIPS is last column
      
      // Store with normalized name as key
      const normalizedName = normalizeCountyName(name.split(',')[0]);
      countyMap.set(normalizedName, countyFips);
    }

    // Cache the result
    countyFipsCache.set(stateFips, countyMap);
    return countyMap;
  } catch (error) {
    console.error('Failed to fetch county list:', error);
    return null;
  }
}

/**
 * Look up county FIPS code by county name and state
 */
export async function getCountyFips(
  countyName: string,
  stateFips: string
): Promise<string | null> {
  const countyMap = await getCountyFipsMap(stateFips);
  if (!countyMap) return null;

  const normalizedSearch = normalizeCountyName(countyName);
  
  // Try exact match first
  if (countyMap.has(normalizedSearch)) {
    return countyMap.get(normalizedSearch)!;
  }

  // Try partial match (for cases like searching "Tulare" in "Tulare County")
  for (const [name, fips] of countyMap.entries()) {
    if (name.includes(normalizedSearch) || normalizedSearch.includes(name)) {
      return fips;
    }
  }

  return null;
}

/**
 * Fetch demographics data from the American Community Survey (ACS)
 * Supports place (city), county, and state levels
 */
export async function fetchDemographics(
  fips: FIPSCodes
): Promise<DemographicsData | null> {
  const apiKey = getCensusApiKey();
  if (!apiKey) {
    console.warn('Census API key not configured');
    return null;
  }

  // ACS 5-year estimates - most complete coverage
  const baseUrl = 'https://api.census.gov/data/2022/acs/acs5';

  // Variables to fetch:
  // B01003_001E - Total Population
  // B19013_001E - Median Household Income
  // B25003_001E - Total Housing Units (Occupied)
  // B25003_002E - Owner-Occupied Housing Units
  // B25077_001E - Median Home Value
  const variables = [
    'NAME',
    'B01003_001E',
    'B19013_001E',
    'B25003_001E',
    'B25003_002E',
    'B25077_001E',
  ].join(',');

  try {
    let url: string;
    let geographyLevel: 'place' | 'county' | 'state';

    if (fips.place) {
      // Fetch place-level (city/town) data
      url = `${baseUrl}?get=${variables}&for=place:${fips.place}&in=state:${fips.state}&key=${apiKey}`;
      geographyLevel = 'place';
    } else if (fips.county) {
      // Fetch county-level data
      url = `${baseUrl}?get=${variables}&for=county:${fips.county}&in=state:${fips.state}&key=${apiKey}`;
      geographyLevel = 'county';
    } else {
      // Fetch state-level data as fallback
      url = `${baseUrl}?get=${variables}&for=state:${fips.state}&key=${apiKey}`;
      geographyLevel = 'state';
    }

    console.log(`Fetching ${geographyLevel} demographics:`, { 
      stateFips: fips.state, 
      countyFips: fips.county,
      placeFips: fips.place 
    });

    const response = await fetch(url);
    if (!response.ok) {
      console.error(`ACS ${geographyLevel} request failed:`, response.status);
      return null;
    }

    const data = await response.json();
    return parseACSResponse(data, geographyLevel);
  } catch (error) {
    console.error('Failed to fetch demographics:', error);
    return null;
  }
}

/**
 * Parse ACS API response into DemographicsData
 */
function parseACSResponse(
  data: string[][],
  geographyLevel: 'place' | 'county' | 'state'
): DemographicsData | null {
  if (!data || data.length < 2) {
    return null;
  }

  // First row is headers, second row is data
  const headers = data[0];
  const values = data[1];

  // Find indices
  const nameIdx = headers.indexOf('NAME');
  const popIdx = headers.indexOf('B01003_001E');
  const incomeIdx = headers.indexOf('B19013_001E');
  const totalHousingIdx = headers.indexOf('B25003_001E');
  const ownerOccupiedIdx = headers.indexOf('B25003_002E');
  const homeValueIdx = headers.indexOf('B25077_001E');

  // Parse values (Census API returns strings, -666666666 means not available)
  const parseValue = (idx: number): number | null => {
    if (idx === -1) return null;
    const val = parseInt(values[idx], 10);
    if (isNaN(val) || val < 0) return null;
    return val;
  };

  const population = parseValue(popIdx);
  const medianHouseholdIncome = parseValue(incomeIdx);
  const totalHousing = parseValue(totalHousingIdx);
  const ownerOccupied = parseValue(ownerOccupiedIdx);
  const medianHomeValue = parseValue(homeValueIdx);

  // Calculate homeownership rate
  let homeownershipRate: number | null = null;
  if (totalHousing && ownerOccupied && totalHousing > 0) {
    homeownershipRate = (ownerOccupied / totalHousing) * 100;
  }

  return {
    population,
    medianHouseholdIncome,
    homeownershipRate,
    medianHomeValue,
    geographyLevel,
    geographyName: nameIdx !== -1 ? values[nameIdx] : '',
  };
}

/**
 * Fetch demographics for a location
 * Tries in order: place (city) -> county -> state
 * This ensures we get the most specific data available
 */
export async function fetchDemographicsForLocation(
  location: LocationForDemographics
): Promise<DemographicsData | null> {
  const { name: placeName, county: countyName, state: stateName } = location;

  // Get state FIPS code
  const stateFips = getStateFips(stateName);
  if (!stateFips) {
    console.warn('Could not find FIPS code for state:', stateName);
    return null;
  }

  // STEP 1: Try place-level (city/town) data first
  if (placeName) {
    console.log(`Looking up place FIPS for: "${placeName}" in state ${stateName} (${stateFips})`);
    const placeFips = await getPlaceFips(placeName, stateFips);
    
    if (placeFips) {
      console.log(`Found place FIPS: ${placeFips} for ${placeName}`);
      const demographics = await fetchDemographics({ state: stateFips, place: placeFips });
      if (demographics) {
        console.log(`Got place-level demographics for ${placeName}:`, demographics.geographyName);
        return demographics;
      }
    } else {
      console.log(`No place FIPS found for "${placeName}", trying county...`);
    }
  }

  // STEP 2: Fall back to county-level data
  if (countyName) {
    console.log(`Looking up county FIPS for: "${countyName}" in state ${stateName} (${stateFips})`);
    const countyFips = await getCountyFips(countyName, stateFips);
    
    if (countyFips) {
      console.log(`Found county FIPS: ${countyFips} for ${countyName}`);
      const demographics = await fetchDemographics({ state: stateFips, county: countyFips });
      if (demographics) {
        console.log(`Got county-level demographics for ${countyName}:`, demographics.geographyName);
        return demographics;
      }
    } else {
      console.warn(`Could not find FIPS for county: "${countyName}" in state ${stateName}`);
    }
  }

  // STEP 3: Final fallback to state-level data
  console.warn('Falling back to state-level data for:', stateName);
  return fetchDemographics({ state: stateFips });
}
