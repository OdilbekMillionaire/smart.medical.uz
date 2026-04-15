'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  lat?: number;
  lng?: number;
  onChange: (lat: number, lng: number) => void;
  onClear?: () => void;
}

// Uzbekistan center
const UZ_LAT = 41.2995;
const UZ_LNG = 69.2401;
const DEFAULT_ZOOM = 6;
const PINNED_ZOOM = 14;

export default function ClinicLocationPicker({ lat, lng, onChange, onClear }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerRef = useRef<any>(null);
  const [geoLoading, setGeoLoading] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const L = require('leaflet');

    // Green drop-pin icon
    const greenIcon = L.divIcon({
      className: '',
      html: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
        <path d="M16 0C7.163 0 0 7.163 0 16c0 10.667 16 26 16 26S32 26.667 32 16C32 7.163 24.837 0 16 0z" fill="#16a34a"/>
        <circle cx="16" cy="16" r="7" fill="white"/>
        <circle cx="16" cy="16" r="4" fill="#16a34a"/>
      </svg>`,
      iconSize: [32, 42],
      iconAnchor: [16, 42],
      popupAnchor: [0, -42],
    });

    const initLat = lat ?? UZ_LAT;
    const initLng = lng ?? UZ_LNG;
    const initZoom = lat && lng ? PINNED_ZOOM : DEFAULT_ZOOM;

    const map = L.map(containerRef.current, {
      center: [initLat, initLng],
      zoom: initZoom,
      zoomControl: true,
    });
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Place existing marker
    if (lat && lng) {
      markerRef.current = L.marker([lat, lng], { icon: greenIcon, draggable: true }).addTo(map);
      markerRef.current.on('dragend', () => {
        const pos = markerRef.current.getLatLng();
        onChange(round(pos.lat), round(pos.lng));
      });
    }

    // Click to place/move marker
    map.on('click', (e: { latlng: { lat: number; lng: number } }) => {
      const newLat = round(e.latlng.lat);
      const newLng = round(e.latlng.lng);
      if (markerRef.current) {
        markerRef.current.setLatLng([newLat, newLng]);
      } else {
        markerRef.current = L.marker([newLat, newLng], { icon: greenIcon, draggable: true }).addTo(map);
        markerRef.current.on('dragend', () => {
          const pos = markerRef.current.getLatLng();
          onChange(round(pos.lat), round(pos.lng));
        });
      }
      onChange(newLat, newLng);
    });

    // Fix tile misalignment
    setTimeout(() => map.invalidateSize(), 150);

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep marker in sync when lat/lng prop changes externally
  useEffect(() => {
    if (!mapRef.current) return;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const L = require('leaflet');
    if (lat && lng) {
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      }
      mapRef.current.setView([lat, lng], PINNED_ZOOM);
    } else {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      mapRef.current.setView([UZ_LAT, UZ_LNG], DEFAULT_ZOOM);
    }
    void L; // suppress unused warning
  }, [lat, lng]);

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newLat = round(pos.coords.latitude);
        const newLng = round(pos.coords.longitude);
        onChange(newLat, newLng);
        setGeoLoading(false);
      },
      () => setGeoLoading(false),
      { timeout: 8000 }
    );
  };

  return (
    <div className="space-y-2">
      {/* Controls row */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-green-600 shrink-0" />
          Xaritaga bosing yoki pin-ni sudrang
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1.5"
            onClick={useMyLocation}
            disabled={geoLoading}
          >
            {geoLoading
              ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
              : <Navigation className="w-3 h-3" />}
            Mening joylashuvim
          </Button>
          {lat && lng && onClear && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-red-500 hover:text-red-700 gap-1"
              onClick={onClear}
            >
              <X className="w-3 h-3" /> O&apos;chirish
            </Button>
          )}
        </div>
      </div>

      {/* Map container — single, full-width */}
      <div
        ref={containerRef}
        className="w-full rounded-xl border border-slate-200 overflow-hidden shadow-sm"
        style={{ height: 320 }}
      />

      {/* Coordinates display */}
      {lat && lng ? (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
          <MapPin className="w-3.5 h-3.5 text-green-600 shrink-0" />
          <span className="text-xs font-mono text-green-700 font-medium">{lat}, {lng}</span>
          <span className="ml-auto text-xs text-green-600 font-medium">✓ Belgilangan</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 bg-slate-50 border border-dashed border-slate-200 rounded-lg px-3 py-1.5">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-xs text-slate-400">Hali belgilanmagan — joylashuvni aniqlash uchun xaritaga bosing</span>
        </div>
      )}
    </div>
  );
}

function round(n: number) {
  return Math.round(n * 1e6) / 1e6;
}
