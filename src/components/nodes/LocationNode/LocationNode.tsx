import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Loader2, X, Navigation, MapPin } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { LocationNodeData, HoveredPort, LocationData } from '@/types/nodes';
import { BaseNode } from '../base';

// Custom marker icon (Leaflet default icons have path issues with bundlers)
const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Component to handle map click events
interface MapClickHandlerProps {
  onLocationSelect: (location: LocationData) => void;
  setIsSelecting: (selecting: boolean) => void;
}

function MapClickHandler({ onLocationSelect, setIsSelecting }: MapClickHandlerProps) {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      setIsSelecting(true);

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
          {
            headers: {
              'Accept-Language': 'en',
            },
          }
        );
        const data = await response.json();

        if (data && data.address) {
          const addr = data.address;
          const name =
            addr.city ||
            addr.town ||
            addr.village ||
            addr.hamlet ||
            addr.suburb ||
            addr.neighbourhood ||
            addr.county ||
            addr.municipality ||
            data.name ||
            'Unknown Location';
          const state = addr.state || addr.region || addr.province || '';
          const country = addr.country || '';

          onLocationSelect({
            name,
            state,
            country,
            lat,
            lng,
          });
        }
      } catch (error) {
        console.error('Reverse geocoding failed:', error);
      } finally {
        setIsSelecting(false);
      }
    },
  });

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
    state?: string;
    region?: string;
    province?: string;
    country?: string;
  };
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
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<HTMLDivElement>(null);

  // Default center: USA
  const defaultCenter: [number, number] = [39.8283, -98.5795];
  const defaultZoom = 4;

  // Perform search immediately
  const performSearch = useCallback(async (query: string): Promise<NominatimResult[]> => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return [];
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
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
  }, []);

  // Debounced search
  const handleSearch = useCallback(
    (query: string) => {
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
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
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
    },
    []
  );

  // Select a search result
  const handleSelectResult = (result: NominatimResult) => {
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
    const state = addr.state || addr.region || addr.province || '';
    const country = addr.country || '';

    updateNode(node.id, {
      selectedLocation: { name, state, country, lat, lng },
    });
  };

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
  const handleLocationSelect = (location: LocationData) => {
    updateNode(node.id, { selectedLocation: location });
  };

  // Format output string
  const getOutputString = () => {
    if (!node.selectedLocation) return null;
    const { name, state, country } = node.selectedLocation;
    const parts = [name];
    if (state) parts.push(state);
    if (country) parts.push(country);
    return parts.join(', ');
  };

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchInputRef.current && !searchInputRef.current.contains(e.target as Node)) {
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
                <Navigation size={12} className="shrink-0 mt-0.5 text-sky-500" />
                <span className="line-clamp-2">{result.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map Container */}
      <div className="flex-1 rounded-lg overflow-hidden border border-slate-700/50 relative min-h-[150px]">
        {isSelecting && (
          <div className="absolute inset-0 z-[1000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center">
            <div className="flex items-center gap-2 text-sky-400">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-xs uppercase tracking-wider">Getting location...</span>
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
          <MapClickHandler
            onLocationSelect={handleLocationSelect}
            setIsSelecting={setIsSelecting}
          />
          {mapCenter && mapZoom && <FlyToLocation center={mapCenter} zoom={mapZoom} />}
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
            <span className="text-xs text-slate-200 truncate">{getOutputString()}</span>
          </div>
        ) : (
          <span className="text-xs text-slate-600">Click on the map to select a location</span>
        )}
      </div>
    </BaseNode>
  );
}

export default LocationNode;
