import { useEffect, useRef } from 'react';
import { useGeolocation } from '@/hooks/useGeolocation';

interface MapWidgetProps {
  markers?: Array<{ lat: number; lng: number; label?: string; color?: string }>;
  center?: { lat: number; lng: number };
  zoom?: number;
  height?: string;
  showUserLocation?: boolean;
}

export function MapWidget({
  markers = [],
  center,
  zoom = 15,
  height = '400px',
  showUserLocation = true,
}: MapWidgetProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const { latitude, longitude } = useGeolocation();
  
  const mapCenter = center || (latitude && longitude ? { lat: latitude, lng: longitude } : null);

  useEffect(() => {
    if (!mapRef.current || !mapCenter) return;

    // For production, you would integrate with Google Maps, Mapbox, or Leaflet
    // This is a placeholder that shows the structure
    // Example: const map = new google.maps.Map(mapRef.current, { center: mapCenter, zoom });
  }, [mapCenter, zoom, markers]);

  return (
    <div
      ref={mapRef}
      className="w-full bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden"
      style={{ height }}
      role="img"
      aria-label="Map showing location"
    >
      {/* Placeholder map - Replace with actual map component */}
      <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <p className="text-sm">Map View</p>
          {(center || (latitude && longitude)) && (
            <p className="text-xs mt-2">
              {center ? `${center.lat.toFixed(4)}, ${center.lng.toFixed(4)}` : `${latitude?.toFixed(4)}, ${longitude?.toFixed(4)}`}
            </p>
          )}
          {showUserLocation && latitude && longitude && !center && (
            <p className="text-xs mt-1 text-primary">Your location: {latitude.toFixed(4)}, {longitude.toFixed(4)}</p>
          )}
        </div>
      </div>
    </div>
  );
}

