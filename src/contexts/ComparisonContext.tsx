import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { DemographicsData, LocationData } from '@/types/nodes';
import { ScorecardResult, calculateScorecard } from '@/components/nodes/LocationNode/scoring';

// A saved location for comparison
export interface SavedLocation {
	id: string;
	name: string;
	county?: string;
	state: string;
	country: string;
	lat: number;
	lng: number;
	demographics: DemographicsData;
	scorecard: ScorecardResult;
	savedAt: number;
}

// Comparison context state
interface ComparisonState {
	locations: SavedLocation[];
	maxLocations: number;
	isOpen: boolean;
}

// Comparison context actions
interface ComparisonActions {
	addLocation: (location: LocationData) => boolean;
	removeLocation: (id: string) => void;
	clearLocations: () => void;
	hasLocation: (locationId: string) => boolean;
	openPanel: () => void;
	closePanel: () => void;
	togglePanel: () => void;
}

type ComparisonContextType = ComparisonState & ComparisonActions;

const ComparisonContext = createContext<ComparisonContextType | null>(null);

// Storage key for persistence
const STORAGE_KEY = 'nodeBuilder_savedLocations';
const MAX_LOCATIONS = 10;

// Generate a unique ID for a location
function generateLocationId(location: LocationData): string {
	return `${location.name}-${location.state}-${location.lat.toFixed(4)}-${location.lng.toFixed(4)}`;
}

// Load saved locations from localStorage
function loadSavedLocations(): SavedLocation[] {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			const parsed = JSON.parse(stored);
			// Recalculate scorecards in case the scoring logic has changed
			return parsed.map((loc: SavedLocation) => ({
				...loc,
				scorecard: calculateScorecard(loc.demographics),
			}));
		}
	} catch (error) {
		console.error('Failed to load saved locations:', error);
	}
	return [];
}

// Save locations to localStorage
function saveToStorage(locations: SavedLocation[]): void {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(locations));
	} catch (error) {
		console.error('Failed to save locations:', error);
	}
}

interface ComparisonProviderProps {
	children: React.ReactNode;
}

export function ComparisonProvider({ children }: ComparisonProviderProps) {
	const [locations, setLocations] = useState<SavedLocation[]>([]);
	const [isOpen, setIsOpen] = useState(false);

	// Load saved locations on mount
	useEffect(() => {
		const saved = loadSavedLocations();
		setLocations(saved);
	}, []);

	// Save to storage when locations change
	useEffect(() => {
		saveToStorage(locations);
	}, [locations]);

	// Add a location to the comparison list
	const addLocation = useCallback((location: LocationData): boolean => {
		if (!location.demographics) {
			console.warn('Cannot save location without demographics');
			return false;
		}

		const id = generateLocationId(location);

		// Check if already saved
		if (locations.some((l) => l.id === id)) {
			console.log('Location already saved:', id);
			return false;
		}

		// Check max limit
		if (locations.length >= MAX_LOCATIONS) {
			console.warn('Maximum locations reached');
			return false;
		}

		const scorecard = calculateScorecard(location.demographics);

		const newLocation: SavedLocation = {
			id,
			name: location.name,
			county: location.county,
			state: location.state,
			country: location.country,
			lat: location.lat,
			lng: location.lng,
			demographics: location.demographics,
			scorecard,
			savedAt: Date.now(),
		};

		setLocations((prev) => {
			const updated = [...prev, newLocation];
			// Sort by score (highest first) on add
			return updated.sort((a, b) => b.scorecard.totalScore - a.scorecard.totalScore);
		});

		return true;
	}, [locations]);

	// Remove a location
	const removeLocation = useCallback((id: string): void => {
		setLocations((prev) => prev.filter((l) => l.id !== id));
	}, []);

	// Clear all locations
	const clearLocations = useCallback((): void => {
		setLocations([]);
	}, []);

	// Check if a location is already saved
	const hasLocation = useCallback((locationId: string): boolean => {
		return locations.some((l) => l.id === locationId);
	}, [locations]);

	// Panel visibility controls
	const openPanel = useCallback(() => setIsOpen(true), []);
	const closePanel = useCallback(() => setIsOpen(false), []);
	const togglePanel = useCallback(() => setIsOpen((prev) => !prev), []);

	const value: ComparisonContextType = {
		locations,
		maxLocations: MAX_LOCATIONS,
		isOpen,
		addLocation,
		removeLocation,
		clearLocations,
		hasLocation,
		openPanel,
		closePanel,
		togglePanel,
	};

	return (
		<ComparisonContext.Provider value={value}>
			{children}
		</ComparisonContext.Provider>
	);
}

// Hook to use the comparison context
export function useComparison(): ComparisonContextType {
	const context = useContext(ComparisonContext);
	if (!context) {
		throw new Error('useComparison must be used within a ComparisonProvider');
	}
	return context;
}

// Hook to get just the location count (for badges/indicators)
export function useComparisonCount(): number {
	const { locations } = useComparison();
	return locations.length;
}

// Hook to check if a specific location is saved
export function useIsLocationSaved(location: LocationData | null): boolean {
	const { hasLocation } = useComparison();
	if (!location) return false;
	const id = generateLocationId(location);
	return hasLocation(id);
}

// Helper to generate location ID externally
export { generateLocationId };

export default ComparisonContext;
