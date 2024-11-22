"use client";

import { cn } from '@/lib/utils';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import { MapPin, Trash2 } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!;

interface Location {
  id: string;
  name: string;
  coordinates: [number, number];
}

export function Map() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const midpointMarkerRef = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-74.5, 40],
      zoom: 9
    });

    const geocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      mapboxgl: mapboxgl,
      marker: false,
    });

    map.current.addControl(geocoder);

    geocoder.on('result', (e) => {
      const { result } = e;
      const newLocation: Location = {
        id: Math.random().toString(36).substring(7),
        name: result.place_name,
        coordinates: result.center as [number, number],
      };

      const marker = new mapboxgl.Marker({ color: '#EF4444' })
        .setLngLat(newLocation.coordinates)
        .setPopup(new mapboxgl.Popup().setHTML(newLocation.name))
        .addTo(map.current!);

      markersRef.current[newLocation.id] = marker;
      setLocations(prev => [...prev, newLocation]);
      
      if (locations.length >= 1) {
        calculateMidpoint([...locations, newLocation]);
      }
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  const calculateMidpoint = (locs: Location[]) => {
    if (locs.length < 2) return;

    const sumLat = locs.reduce((sum, loc) => sum + loc.coordinates[1], 0);
    const sumLng = locs.reduce((sum, loc) => sum + loc.coordinates[0], 0);
    const midpoint: [number, number] = [
      sumLng / locs.length,
      sumLat / locs.length
    ];

    if (midpointMarkerRef.current) {
      midpointMarkerRef.current.remove();
    }

    midpointMarkerRef.current = new mapboxgl.Marker({ color: '#22C55E' })
      .setLngLat(midpoint)
      .setPopup(new mapboxgl.Popup().setHTML('Optimal Meeting Point'))
      .addTo(map.current!);

    const bounds = new mapboxgl.LngLatBounds();
    locs.forEach(loc => bounds.extend(loc.coordinates));
    bounds.extend(midpoint);
    
    map.current?.fitBounds(bounds, {
      padding: 50,
      duration: 1000
    });

    toast.success('Midpoint calculated!');
  };

  const removeLocation = (id: string) => {
    markersRef.current[id]?.remove();
    delete markersRef.current[id];
    setLocations(prev => {
      const newLocations = prev.filter(loc => loc.id !== id);
      if (newLocations.length >= 2) {
        calculateMidpoint(newLocations);
      } else if (midpointMarkerRef.current) {
        midpointMarkerRef.current.remove();
        midpointMarkerRef.current = null;
      }
      return newLocations;
    });
  };

  return (
    <div className="flex-1 grid grid-cols-[300px,1fr]">
      <div className="bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Selected Locations</h2>
        {locations.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Search for and select locations on the map to find the optimal meeting point.
          </p>
        ) : (
          <ul className="space-y-2">
            {locations.map((location) => (
              <li 
                key={location.id} 
                className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <span className="text-sm text-gray-900 dark:text-gray-100 truncate flex-1">
                  {location.name}
                </span>
                <button
                  onClick={() => removeLocation(location.id)}
                  className="ml-2 p-1 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
        {locations.length >= 2 && (
          <button
            onClick={() => calculateMidpoint(locations)}
            className={cn(
              "mt-4 w-full flex items-center justify-center px-4 py-2 border border-transparent",
              "text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700",
              "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            )}
          >
            <MapPin className="mr-2 h-4 w-4" />
            Recalculate Midpoint
          </button>
        )}
      </div>
      <div ref={mapContainer} className="h-[calc(100vh-73px)]" />
    </div>
  );
}