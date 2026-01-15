import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
	Search,
	Loader2,
	X,
	Navigation,
	MapPin,
	Crosshair,
	Users,
	DollarSign,
	Home,
	TrendingUp,
	AlertCircle,
	Move,
	MousePointer2,
} from 'lucide-react';
import {
	MapContainer,
	TileLayer,
	Marker,
	useMap,
	useMapEvents,
	GeoJSON,
} from 'react-leaflet';
import L from 'leaflet';
import { LocationNodeData, HoveredPort, LocationData } from '@/types/nodes';
import { BaseNode } from '../base';
import { fetchDemographicsForLocation, hasCensusApiKey } from '@/api/census';
import { Scorecard } from './Scorecard';
import { SuburbSuggestions } from './SuburbSuggestions';
import { useComparison, generateLocationId } from '@/contexts';
import { SuburbResult } from '@/api/suburbs';
import { isMajorMetro } from './scoring';

// Custom marker icon (Leaflet default icons have path issues with bundlers)
const markerIcon = new L.Icon({
	iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
	iconRetinaUrl:
		'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
	shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
	iconSize: [25, 41],
	iconAnchor: [12, 41],
	popupAnchor: [1, -34],
	shadowSize: [41, 41],
});

// Component to capture map reference
interface MapRefHandlerProps {
	mapRef: React.MutableRefObject<L.Map | null>;
}

function MapRefHandler({ mapRef }: MapRefHandlerProps) {
	const map = useMap();

	useEffect(() => {
		mapRef.current = map;
	}, [map, mapRef]);

	return null;
}

// Component to fly to a location
interface FlyToLocationProps {
	center: [number, number];
	zoom: number;
}

function FlyToLocation({ center, zoom }: FlyToLocationProps) {
	const map = useMap();

	useEffect(() => {
		if (center) {
			map.flyTo(center, zoom, { duration: 1.5 });
		}
	}, [center, zoom, map]);

	return null;
}

// Component to handle map resize when container size changes
interface MapResizeHandlerProps {
	width: number;
	height: number;
}

function MapResizeHandler({ width, height }: MapResizeHandlerProps) {
	const map = useMap();

	useEffect(() => {
		// Small timeout to let the container finish resizing
		const timeoutId = setTimeout(() => {
			map.invalidateSize();
		}, 0);

		return () => clearTimeout(timeoutId);
	}, [width, height, map]);

	return null;
}

// Tool modes for the map
type MapTool = 'move' | 'select';

// Component to handle map click events in select mode
interface MapClickHandlerProps {
	tool: MapTool;
	onLocationClick: (lat: number, lng: number) => void;
}

function MapClickHandler({ tool, onLocationClick }: MapClickHandlerProps) {
	const map = useMap();

	// Enable/disable dragging based on tool mode
	useEffect(() => {
		if (tool === 'select') {
			map.dragging.disable();
		} else {
			map.dragging.enable();
		}
	}, [tool, map]);

	useMapEvents({
		click: (e) => {
			if (tool === 'select') {
				onLocationClick(e.latlng.lat, e.latlng.lng);
			}
		},
	});

	return null;
}

interface LocationNodeProps {
	node: LocationNodeData;
	updateNode: (id: string, updates: Partial<LocationNodeData>) => void;
	deleteNode: (id: string) => void;
	onMouseDown: (e: React.MouseEvent) => void;
	onResizeStart: (e: React.MouseEvent) => void;
	editingTitleId: string | null;
	setEditingTitleId: (id: string | null) => void;
	isConnectedOutput: boolean;
	hoveredPort: HoveredPort | null;
	setHoveredPort: (port: HoveredPort | null) => void;
	onOutputPortMouseDown: (e: React.MouseEvent) => void;
	onOutputPortMouseUp: () => void;
	connectingFrom: string | null;
	connectingTo: string | null;
}

interface NominatimResult {
	lat: string;
	lon: string;
	display_name: string;
	name?: string;
	address?: {
		city?: string;
		town?: string;
		village?: string;
		hamlet?: string;
		suburb?: string;
		county?: string;
		state?: string;
		region?: string;
		province?: string;
		country?: string;
	};
	geojson?: GeoJSON.Geometry;
}

export function LocationNode({
	node,
	updateNode,
	deleteNode,
	onMouseDown,
	onResizeStart,
	editingTitleId,
	setEditingTitleId,
	isConnectedOutput,
	hoveredPort,
	setHoveredPort,
	onOutputPortMouseDown,
	onOutputPortMouseUp,
	connectingFrom,
	connectingTo,
}: LocationNodeProps) {
	const [searchQuery, setSearchQuery] = useState('');
	const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
	const [isSearching, setIsSearching] = useState(false);
	const [isSelecting, setIsSelecting] = useState(false);
	const [showResults, setShowResults] = useState(false);
	const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
	const [mapZoom, setMapZoom] = useState<number | null>(null);
	const [activeTool, setActiveTool] = useState<MapTool>('move');
	const [showSuburbSuggestions, setShowSuburbSuggestions] = useState(false);
	const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const searchInputRef = useRef<HTMLDivElement>(null);
	const mapRef = useRef<L.Map | null>(null);

	// Comparison context
	const { addLocation, hasLocation, openPanel } = useComparison();

	// Default center: USA
	const defaultCenter: [number, number] = [39.8283, -98.5795];
	const defaultZoom = 4;

	// Check if current location is saved
	const isLocationSaved = node.selectedLocation
		? hasLocation(generateLocationId(node.selectedLocation))
		: false;

	// Perform search immediately
	const performSearch = useCallback(
		async (query: string): Promise<NominatimResult[]> => {
			if (!query.trim()) {
				setSearchResults([]);
				setShowResults(false);
				return [];
			}

			setIsSearching(true);
			try {
				const response = await fetch(
					`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&polygon_geojson=1`,
					{
						headers: {
							'Accept-Language': 'en',
						},
					}
				);
				const data: NominatimResult[] = await response.json();
				setSearchResults(data);
				setShowResults(true);
				return data;
			} catch (error) {
				console.error('Search failed:', error);
				setSearchResults([]);
				return [];
			} finally {
				setIsSearching(false);
			}
		},
		[]
	);

	// Debounced search
	const handleSearch = useCallback((query: string) => {
		setSearchQuery(query);

		if (searchTimeoutRef.current) {
			clearTimeout(searchTimeoutRef.current);
		}

		if (!query.trim()) {
			setSearchResults([]);
			setShowResults(false);
			return;
		}

		searchTimeoutRef.current = setTimeout(async () => {
			setIsSearching(true);
			try {
				const response = await fetch(
					`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&polygon_geojson=1`,
					{
						headers: {
							'Accept-Language': 'en',
						},
					}
				);
				const data: NominatimResult[] = await response.json();
				setSearchResults(data);
				setShowResults(true);
			} catch (error) {
				console.error('Search failed:', error);
				setSearchResults([]);
			} finally {
				setIsSearching(false);
			}
		}, 400);
	}, []);

	// Select a search result
	const handleSelectResult = useCallback(
		(result: NominatimResult) => {
			const lat = parseFloat(result.lat);
			const lng = parseFloat(result.lon);

			setMapCenter([lat, lng]);
			setMapZoom(12);
			setSearchQuery(result.display_name.split(',')[0]);
			setShowResults(false);

			// Also set the location
			const addr = result.address || {};
			const name =
				addr.city ||
				addr.town ||
				addr.village ||
				addr.hamlet ||
				addr.suburb ||
				result.name ||
				result.display_name.split(',')[0];
			const county = addr.county || '';
			const state = addr.state || addr.region || addr.province || '';
			const country = addr.country || '';

			console.log(
				'Selected location:',
				JSON.stringify({ name, county, state, country, lat, lng }, null, 2)
			);

			const location: LocationData = {
				name,
				county,
				state,
				country,
				lat,
				lng,
				geojson: result.geojson,
			};

			updateNode(node.id, {
				selectedLocation: location,
				demographicsStatus: 'idle',
				demographicsError: null,
			});
		},
		[node.id, updateNode]
	);

	// Handle Enter key
	const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
		const currentQuery = e.currentTarget.value;

		if (e.key === 'Enter' && currentQuery.trim()) {
			e.preventDefault();

			if (searchTimeoutRef.current) {
				clearTimeout(searchTimeoutRef.current);
			}

			if (searchResults.length > 0) {
				handleSelectResult(searchResults[0]);
			} else {
				const results = await performSearch(currentQuery);
				if (results.length > 0) {
					handleSelectResult(results[0]);
				}
			}
		} else if (e.key === 'Escape') {
			setShowResults(false);
		}
	};

	// Handle location selection from map click
	const handleLocationSelect = useCallback(
		(location: LocationData) => {
			updateNode(node.id, {
				selectedLocation: location,
				demographicsStatus: 'idle',
				demographicsError: null,
			});
		},
		[node.id, updateNode]
	);

	// Effect to fetch demographics when a new location is selected
	useEffect(() => {
		const selectedLocation = node.selectedLocation;

		// Only fetch if we have a location and status is idle (new selection)
		if (!selectedLocation || node.demographicsStatus !== 'idle') {
			return;
		}

		// Check if Census API key is configured
		if (!hasCensusApiKey()) {
			updateNode(node.id, {
				demographicsStatus: 'unavailable',
				demographicsError: 'Census API key not configured',
			});
			return;
		}

		// Only fetch for US locations (need a state name)
		if (!selectedLocation.state) {
			updateNode(node.id, {
				demographicsStatus: 'unavailable',
				demographicsError: 'Demographics only available for US locations',
			});
			return;
		}

		// Start fetching
		updateNode(node.id, {
			demographicsStatus: 'loading',
			demographicsError: null,
		});

		fetchDemographicsForLocation({
			name: selectedLocation.name,
			county: selectedLocation.county,
			state: selectedLocation.state,
			lat: selectedLocation.lat,
			lng: selectedLocation.lng,
		})
			.then((demographics) => {
				if (demographics) {
					updateNode(node.id, {
						selectedLocation: {
							...selectedLocation,
							demographics,
						},
						demographicsStatus: 'success',
						demographicsError: null,
					});
				} else {
					updateNode(node.id, {
						demographicsStatus: 'unavailable',
						demographicsError: 'Demographics not available for this location',
					});
				}
			})
			.catch((error) => {
				console.error('Failed to fetch demographics:', error);
				updateNode(node.id, {
					demographicsStatus: 'error',
					demographicsError: 'Failed to fetch demographics',
				});
			});
	}, [node.id, node.selectedLocation, node.demographicsStatus, updateNode]);

	// Select a region at the given coordinates
	const selectRegionAtCoords = useCallback(
		async (lat: number, lng: number) => {
			setIsSelecting(true);
			// Switch back to move tool after selection
			setActiveTool('move');

			try {
				// First, reverse geocode to get the address
				const reverseResponse = await fetch(
					`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`,
					{
						headers: {
							'Accept-Language': 'en',
						},
					}
				);
				const reverseData = await reverseResponse.json();

				if (reverseData && reverseData.address) {
					const addr = reverseData.address;
					const name =
						addr.city ||
						addr.town ||
						addr.village ||
						addr.hamlet ||
						addr.suburb ||
						addr.neighbourhood ||
						addr.county ||
						addr.municipality ||
						reverseData.name ||
						'Unknown Location';
					const county = addr.county || '';
					const state = addr.state || addr.region || addr.province || '';
					const country = addr.country || '';

					console.log('Selected region:', {
						name,
						county,
						state,
						country,
						lat,
						lng,
					});

					// Now search for the location to get its polygon boundary
					let geojson: GeoJSON.Geometry | undefined;
					const searchQuery =
						name +
						(state ? `, ${state}` : '') +
						(country ? `, ${country}` : '');

					try {
						const searchResponse = await fetch(
							`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&polygon_geojson=1`,
							{
								headers: {
									'Accept-Language': 'en',
								},
							}
						);
						const searchData = await searchResponse.json();
						if (searchData && searchData.length > 0 && searchData[0].geojson) {
							geojson = searchData[0].geojson;
						}
					} catch (searchError) {
						console.error('Search for boundary failed:', searchError);
					}

					handleLocationSelect({
						name,
						county,
						state,
						country,
						lat,
						lng,
						geojson,
					});
				}
			} catch (error) {
				console.error('Reverse geocoding failed:', error);
			} finally {
				setIsSelecting(false);
			}
		},
		[handleLocationSelect]
	);

	// Format output string
	const getOutputString = () => {
		if (!node.selectedLocation) return null;
		const { name, state, country } = node.selectedLocation;
		const parts = [name];
		if (state) parts.push(state);
		if (country) parts.push(country);
		return parts.join(', ');
	};

	// Format currency
	const formatCurrency = (value: number | null) => {
		if (value === null) return 'N/A';
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			maximumFractionDigits: 0,
		}).format(value);
	};

	// Format number with commas
	const formatNumber = (value: number | null) => {
		if (value === null) return 'N/A';
		return new Intl.NumberFormat('en-US').format(value);
	};

	// Format percentage
	const formatPercent = (value: number | null) => {
		if (value === null) return 'N/A';
		return `${value.toFixed(1)}%`;
	};

	// Handle saving location to comparison
	const handleSaveToCompare = useCallback(() => {
		if (node.selectedLocation && node.selectedLocation.demographics) {
			const success = addLocation(node.selectedLocation);
			if (success) {
				openPanel();
			}
		}
	}, [node.selectedLocation, addLocation, openPanel]);

	// Handle suburb selection from suggestions
	const handleSelectSuburb = useCallback(
		(suburb: SuburbResult) => {
			setShowSuburbSuggestions(false);

			// Fly to the suburb location
			setMapCenter([suburb.lat, suburb.lng]);
			setMapZoom(12);

			// Set the location
			const location: LocationData = {
				name: suburb.name,
				county: suburb.county,
				state: suburb.state,
				country: suburb.country,
				lat: suburb.lat,
				lng: suburb.lng,
				demographics: suburb.demographics,
			};

			updateNode(node.id, {
				selectedLocation: location,
				demographicsStatus: suburb.demographics ? 'success' : 'idle',
				demographicsError: null,
			});
		},
		[node.id, updateNode]
	);

	// Check if current location is a major metro (for showing suburb button)
	const showSuburbButton =
		node.selectedLocation?.demographics?.population &&
		isMajorMetro(node.selectedLocation.demographics.population);

	// Close search results when clicking outside
	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (
				searchInputRef.current &&
				!searchInputRef.current.contains(e.target as Node)
			) {
				setShowResults(false);
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	return (
		<BaseNode
			node={node}
			icon={<MapPin size={14} className="text-sky-400" />}
			isEditingTitle={editingTitleId === node.id}
			onTitleChange={(title) => updateNode(node.id, { title })}
			onEditTitleStart={() => setEditingTitleId(node.id)}
			onEditTitleEnd={() => setEditingTitleId(null)}
			onDelete={() => deleteNode(node.id)}
			onMouseDown={onMouseDown}
			onResizeStart={onResizeStart}
			hasInputPort={false}
			hasOutputPort={true}
			isConnectedOutput={isConnectedOutput}
			hoveredPort={hoveredPort}
			setHoveredPort={setHoveredPort}
			onOutputPortMouseDown={onOutputPortMouseDown}
			onOutputPortMouseUp={onOutputPortMouseUp}
			connectingFrom={connectingFrom}
			connectingTo={connectingTo}
			status={node.selectedLocation ? 'success' : 'idle'}
			hoverBorderClass="group-hover:border-sky-500/30"
			resizeHoverColor="hover:text-sky-400"
		>
			{/* Search Bar */}
			<div className="relative" ref={searchInputRef}>
				<div className="relative">
					<Search
						size={14}
						className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
					/>
					<input
						type="text"
						value={searchQuery}
						onChange={(e) => handleSearch(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder="Search for a city..."
						className="w-full bg-slate-950/60 border border-slate-700/50 rounded-lg pl-9 pr-8 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-sky-500/30"
					/>
					{isSearching && (
						<Loader2
							size={14}
							className="absolute right-3 top-1/2 -translate-y-1/2 text-sky-400 animate-spin"
						/>
					)}
					{searchQuery && !isSearching && (
						<button
							onClick={() => {
								setSearchQuery('');
								setSearchResults([]);
								setShowResults(false);
							}}
							className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
						>
							<X size={14} />
						</button>
					)}
				</div>

				{/* Search Results Dropdown */}
				{showResults && searchResults.length > 0 && (
					<div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 max-h-40 overflow-y-auto">
						{searchResults.map((result, index) => (
							<button
								key={index}
								onClick={() => handleSelectResult(result)}
								className="w-full px-3 py-2 text-left text-xs text-slate-300 hover:bg-slate-800 hover:text-sky-300 transition-colors flex items-start gap-2"
							>
								<Navigation
									size={12}
									className="shrink-0 mt-0.5 text-sky-500"
								/>
								<span className="line-clamp-2">{result.display_name}</span>
							</button>
						))}
					</div>
				)}
			</div>

			{/* Map Container */}
			<div
				className={`flex-1 rounded-lg overflow-hidden border border-slate-700/50 relative min-h-[150px] ${
					activeTool === 'select' ? 'cursor-crosshair' : ''
				}`}
			>
				{/* Tool toggle buttons */}
				<div className="absolute top-2 right-2 z-[500] flex flex-col gap-1 bg-slate-900/90 backdrop-blur-sm rounded-lg p-1 border border-slate-700/50 shadow-lg">
					<button
						onClick={() => setActiveTool('move')}
						title="Pan/Move Map"
						className={`p-2 rounded-md transition-all ${
							activeTool === 'move'
								? 'bg-sky-500 text-white shadow-md'
								: 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
						}`}
					>
						<Move size={16} />
					</button>
					<button
						onClick={() => setActiveTool('select')}
						title="Select Region"
						className={`p-2 rounded-md transition-all ${
							activeTool === 'select'
								? 'bg-sky-500 text-white shadow-md'
								: 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
						}`}
					>
						<MousePointer2 size={16} />
					</button>
				</div>

				{/* Tool mode indicator */}
				{activeTool === 'select' && (
					<div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[500] px-3 py-1.5 bg-sky-500/90 backdrop-blur-sm text-white text-xs font-medium rounded-full shadow-lg flex items-center gap-2">
						<Crosshair size={12} />
						Click to select a region
					</div>
				)}

				{/* Loading overlay */}
				{isSelecting && (
					<div className="absolute inset-0 z-[1000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center">
						<div className="flex items-center gap-2 text-sky-400">
							<Loader2 size={16} className="animate-spin" />
							<span className="text-xs uppercase tracking-wider">
								Getting location...
							</span>
						</div>
					</div>
				)}

				<MapContainer
					center={defaultCenter}
					zoom={defaultZoom}
					className="w-full h-full"
					style={{ background: '#0f172a' }}
					zoomControl={true}
				>
					<TileLayer
						attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
						url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
						className="map-tiles"
					/>
					<MapRefHandler mapRef={mapRef} />
					<MapResizeHandler width={node.width} height={node.height} />
					<MapClickHandler
						tool={activeTool}
						onLocationClick={selectRegionAtCoords}
					/>
					{mapCenter && mapZoom && (
						<FlyToLocation center={mapCenter} zoom={mapZoom} />
					)}
					{/* Region boundary outline */}
					{node.selectedLocation?.geojson && (
						<GeoJSON
							key={`${node.selectedLocation.lat}-${node.selectedLocation.lng}`}
							data={
								{
									type: 'Feature',
									properties: {},
									geometry: node.selectedLocation.geojson,
								} as GeoJSON.Feature
							}
							style={{
								color: '#0ea5e9',
								weight: 2,
								opacity: 0.8,
								fillColor: '#0ea5e9',
								fillOpacity: 0.15,
							}}
						/>
					)}
					{node.selectedLocation && (
						<Marker
							position={[node.selectedLocation.lat, node.selectedLocation.lng]}
							icon={markerIcon}
						/>
					)}
				</MapContainer>
			</div>

			{/* Selected Location Display */}
			<div className="bg-slate-950/60 border border-slate-700/50 rounded-lg px-3 py-2">
				{node.selectedLocation ? (
					<div className="flex items-center gap-2">
						<MapPin size={14} className="text-sky-400 shrink-0" />
						<span className="text-xs text-slate-200 truncate flex-1">
							{getOutputString()}
						</span>
						<button
							onClick={() => {
								updateNode(node.id, {
									selectedLocation: undefined,
									demographicsStatus: 'idle',
									demographicsError: null,
								});
							}}
							title="Clear selection"
							className="text-slate-500 hover:text-red-400 transition-colors shrink-0"
						>
							<X size={14} />
						</button>
					</div>
				) : (
					<span className="text-xs text-slate-600">
						Use the pointer tool to select a region
					</span>
				)}
			</div>

			{/* Demographics Panel */}
			{node.selectedLocation && (
				<div className="bg-slate-950/60 border border-slate-700/50 rounded-lg overflow-hidden">
					<div className="px-3 py-2 border-b border-slate-700/50 flex items-center justify-between">
						<span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
							Demographics
						</span>
						{node.demographicsStatus === 'loading' && (
							<Loader2 size={12} className="text-sky-400 animate-spin" />
						)}
						{node.demographicsStatus === 'success' &&
							node.selectedLocation.demographics && (
								<span className="text-[10px] text-slate-500">
									{node.selectedLocation.demographics.geographyLevel === 'place'
										? 'City'
										: node.selectedLocation.demographics.geographyLevel ===
											  'county'
											? 'County'
											: 'State'}{' '}
									level
								</span>
							)}
					</div>

					{node.demographicsStatus === 'loading' && (
						<div className="px-3 py-4 flex items-center justify-center gap-2 text-slate-500">
							<Loader2 size={14} className="animate-spin" />
							<span className="text-xs">Fetching demographics...</span>
						</div>
					)}

					{node.demographicsStatus === 'success' &&
						node.selectedLocation.demographics && (
							<>
								<div className="grid grid-cols-2 gap-px bg-slate-700/30">
									<div className="bg-slate-900/50 px-3 py-2 flex items-center gap-2">
										<Users size={12} className="text-sky-400 shrink-0" />
										<div className="min-w-0">
											<div className="text-[10px] text-slate-500">
												Population
											</div>
											<div className="text-xs text-slate-200 font-medium truncate">
												{formatNumber(
													node.selectedLocation.demographics.population
												)}
											</div>
										</div>
									</div>
									<div className="bg-slate-900/50 px-3 py-2 flex items-center gap-2">
										<DollarSign
											size={12}
											className="text-emerald-400 shrink-0"
										/>
										<div className="min-w-0">
											<div className="text-[10px] text-slate-500">
												Median Income
											</div>
											<div className="text-xs text-slate-200 font-medium truncate">
												{formatCurrency(
													node.selectedLocation.demographics
														.medianHouseholdIncome
												)}
											</div>
										</div>
									</div>
									<div className="bg-slate-900/50 px-3 py-2 flex items-center gap-2">
										<Home size={12} className="text-amber-400 shrink-0" />
										<div className="min-w-0">
											<div className="text-[10px] text-slate-500">
												Homeownership
											</div>
											<div className="text-xs text-slate-200 font-medium truncate">
												{formatPercent(
													node.selectedLocation.demographics.homeownershipRate
												)}
											</div>
										</div>
									</div>
									<div className="bg-slate-900/50 px-3 py-2 flex items-center gap-2">
										<TrendingUp
											size={12}
											className="text-violet-400 shrink-0"
										/>
										<div className="min-w-0">
											<div className="text-[10px] text-slate-500">
												Home Value
											</div>
											<div className="text-xs text-slate-200 font-medium truncate">
												{formatCurrency(
													node.selectedLocation.demographics.medianHomeValue
												)}
											</div>
										</div>
									</div>
								</div>
								<Scorecard
									demographics={node.selectedLocation.demographics}
									locationName={node.selectedLocation.name}
									locationState={node.selectedLocation.state}
									onFindSuburbs={
										showSuburbButton
											? () => setShowSuburbSuggestions(true)
											: undefined
									}
									onSaveToCompare={
										!isLocationSaved ? handleSaveToCompare : undefined
									}
								/>
							</>
						)}

					{(node.demographicsStatus === 'error' ||
						node.demographicsStatus === 'unavailable') && (
						<div className="px-3 py-3 flex items-center gap-2 text-slate-500">
							<AlertCircle size={12} className="shrink-0" />
							<span className="text-xs">
								{node.demographicsError || 'Demographics unavailable'}
							</span>
						</div>
					)}

					{node.demographicsStatus === 'idle' && (
						<div className="px-3 py-3 flex items-center gap-2 text-slate-500">
							<AlertCircle size={12} className="shrink-0" />
							<span className="text-xs">
								Configure Census API key in settings
							</span>
						</div>
					)}
				</div>
			)}

			{/* Suburb Suggestions Panel */}
			{showSuburbSuggestions && node.selectedLocation && (
				<div className="mt-2">
					<SuburbSuggestions
						metroName={node.selectedLocation.name}
						metroLat={node.selectedLocation.lat}
						metroLng={node.selectedLocation.lng}
						metroState={node.selectedLocation.state}
						onSelectSuburb={handleSelectSuburb}
						onClose={() => setShowSuburbSuggestions(false)}
					/>
				</div>
			)}
		</BaseNode>
	);
}

export default LocationNode;
