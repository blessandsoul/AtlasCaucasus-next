'use client';

import { useEffect, useRef } from 'react';
import type { ItineraryStep } from '@/features/tours/types/tour.types';
import { cn } from '@/lib/utils';

interface ItineraryMapProps {
  steps: ItineraryStep[];
  className?: string;
}

export const ItineraryMap = ({ steps, className }: ItineraryMapProps): React.ReactElement | null => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);

  // Filter steps that have valid coordinates (resolved from locationId)
  const geoSteps = steps.filter(
    (s) => s.latitude != null && s.longitude != null
  );

  useEffect(() => {
    if (geoSteps.length === 0 || !mapRef.current) return;
    if (mapInstanceRef.current) return; // Already initialized

    let cancelled = false;

    const initMap = async (): Promise<void> => {
      const L = (await import('leaflet')).default;

      // Inject leaflet CSS if not already present
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      if (cancelled || !mapRef.current) return;

      // Create map
      const map = L.map(mapRef.current, {
        scrollWheelZoom: false,
        zoomControl: true,
        attributionControl: true,
      });

      mapInstanceRef.current = map;

      // Use OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);

      // Create labeled markers for each geo-located itinerary step
      const markers = geoSteps.map((step) => {
        const label = step.locationName || step.title;
        const escapedLabel = label.replace(/'/g, '&#39;').replace(/"/g, '&quot;');
        const icon = L.divIcon({
          className: 'itinerary-marker',
          html: `<div style="
            display: flex;
            align-items: center;
            gap: 6px;
            white-space: nowrap;
          ">
            <div style="
              width: 12px;
              height: 12px;
              border-radius: 50%;
              background: hsl(221.2, 83.2%, 53.3%);
              box-shadow: 0 0 0 3px white, 0 2px 6px rgba(0,0,0,0.3);
              flex-shrink: 0;
            "></div>
            <span style="
              background: white;
              padding: 2px 8px;
              border-radius: 4px;
              font-size: 12px;
              font-weight: 600;
              color: #1a1a1a;
              box-shadow: 0 1px 4px rgba(0,0,0,0.15);
              line-height: 1.4;
            ">${escapedLabel}</span>
          </div>`,
          iconSize: [0, 0],
          iconAnchor: [6, 6],
        });

        const marker = L.marker([step.latitude!, step.longitude!], { icon }).addTo(map);
        marker.bindPopup(`<strong>${escapedLabel}</strong>`);

        return marker;
      });

      // Draw a polyline connecting the steps in order
      if (geoSteps.length >= 2) {
        const latlngs = geoSteps.map(
          (s) => [s.latitude!, s.longitude!] as [number, number]
        );

        L.polyline(latlngs, {
          color: 'hsl(221.2, 83.2%, 53.3%)',
          weight: 3,
          opacity: 0.7,
          dashArray: '8, 8',
        }).addTo(map);
      }

      // Fit bounds to show all markers
      if (markers.length > 0) {
        const group = L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.15));
      }
    };

    initMap();

    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        (mapInstanceRef.current as { remove: () => void }).remove();
        mapInstanceRef.current = null;
      }
    };
  }, [geoSteps.length]);

  if (geoSteps.length === 0) return null;

  return (
    <div
      className={cn(
        'relative z-0 w-full h-[300px] md:h-[350px] rounded-xl overflow-hidden border border-border isolate',
        className
      )}
    >
      <div ref={mapRef} className="absolute inset-0" />
    </div>
  );
};
