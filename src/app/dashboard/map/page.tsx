'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getAllClinics } from '@/lib/firestore';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Search, Building2, Phone, Navigation, MapPin, Locate } from 'lucide-react';
import type { ClinicUser } from '@/types';

// ─── Fallback region coordinates ─────────────────────────────────────────────
const REGION_COORDS: Record<string, [number, number]> = {
  'Toshkent shahri': [41.2995, 69.2401],
  'Toshkent': [41.1123, 69.4076],
  'Samarqand': [39.6542, 66.9597],
  'Buxoro': [39.7747, 64.4286],
  'Namangan': [40.9983, 71.6726],
  'Andijon': [40.7821, 72.3440],
  "Farg'ona": [40.3834, 71.7882],
  'Qashqadaryo': [38.8600, 65.7900],
  'Surxondaryo': [37.9400, 67.5700],
  'Jizzax': [40.1200, 67.8500],
  'Sirdaryo': [40.8400, 68.6500],
  'Xorazm': [41.3600, 60.3600],
  'Navoiy': [40.0900, 65.3800],
  "Qoraqalpog'iston": [43.8000, 59.6000],
};

function getApproxCoords(clinic: ClinicUser): [number, number] {
  if (clinic.region && REGION_COORDS[clinic.region]) {
    const [lat, lng] = REGION_COORDS[clinic.region];
    return [lat + (Math.random() - 0.5) * 0.08, lng + (Math.random() - 0.5) * 0.08];
  }
  return [41.2995 + (Math.random() - 0.5) * 2, 64.5853 + (Math.random() - 0.5) * 5];
}

function getClinicCoords(clinic: ClinicUser): [number, number] {
  if (clinic.lat && clinic.lng) return [clinic.lat, clinic.lng];
  return getApproxCoords(clinic);
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function MapPage() {
  const { userRole } = useAuth();
  const { t } = useLanguage();
  const [clinics, setClinics] = useState<ClinicUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<ClinicUser | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locating, setLocating] = useState(false);
  const [sortByNearest, setSortByNearest] = useState(false);
  const [addressSearch, setAddressSearch] = useState('');
  const [geocoding, setGeocoding] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leafletMapRef = useRef<any>(null);

  useEffect(() => {
    getAllClinics()
      .then(setClinics)
      .catch(() => toast.error(t.common.error))
      .finally(() => setLoading(false));
  }, [t.common.error]);

  // Nominatim geocoding — free OpenStreetMap API, no key needed
  const geocodeAndFly = useCallback(async () => {
    if (!addressSearch.trim() || !leafletMapRef.current) return;
    setGeocoding(true);
    try {
      const query = encodeURIComponent(addressSearch + ', Uzbekistan');
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`,
        { headers: { 'Accept-Language': 'uz,ru;q=0.9', 'User-Agent': 'SmartMedicalAssociation/1.0' } }
      );
      const data = await res.json() as { lat: string; lon: string; display_name: string }[];
      if (data.length === 0) {
        toast.error('Manzil topilmadi. Aniqroq kiriting.');
        return;
      }
      const { lat, lon } = data[0];
      leafletMapRef.current.flyTo([parseFloat(lat), parseFloat(lon)], 14, { animate: true, duration: 1.5 });
      toast.success(`Manzil topildi: ${data[0].display_name.split(',').slice(0, 2).join(',')}`);
    } catch {
      toast.error('Manzil qidirishda xato');
    } finally {
      setGeocoding(false);
    }
  }, [addressSearch]);

  const locateUser = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('Geolokatsiya qo\'llab-quvvatlanmaydi');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude]);
        setSortByNearest(true);
        setLocating(false);
        toast.success('Sizning joylashuvingiz aniqlandi');
      },
      () => {
        toast.error('Joylashuv aniqlanmadi. Ruxsat bering.');
        setLocating(false);
      },
      { timeout: 10000 }
    );
  }, []);

  const filtered = clinics.filter(
    (c) =>
      !search ||
      c.clinicName?.toLowerCase().includes(search.toLowerCase()) ||
      c.region?.toLowerCase().includes(search.toLowerCase()) ||
      c.district?.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = sortByNearest && userLocation
    ? [...filtered].sort((a, b) => {
        const [uLat, uLng] = userLocation;
        const [aLat, aLng] = getClinicCoords(a);
        const [bLat, bLng] = getClinicCoords(b);
        return haversineKm(uLat, uLng, aLat, aLng) - haversineKm(uLat, uLng, bLat, bLng);
      })
    : filtered;

  // Build Leaflet map
  useEffect(() => {
    if (loading || !mapRef.current) return;

    import('leaflet').then((L) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
      }

      const map = L.map(mapRef.current!).setView([41.2995, 64.5853], 6);
      leafletMapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);

      // ── User location marker ───────────────────────────────────────────
      if (userLocation) {
        const userIcon = L.divIcon({
          html: `<div style="width:18px;height:18px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(59,130,246,0.6);"></div>`,
          iconSize: [18, 18],
          iconAnchor: [9, 9],
          className: '',
        });
        L.marker(userLocation, { icon: userIcon })
          .addTo(map)
          .bindPopup('<strong>Sizning joylashuvingiz</strong>')
          .openPopup();
        map.setView(userLocation, 10);
      }

      // ── Clinic markers ─────────────────────────────────────────────────
      sorted.forEach((clinic) => {
        const isPinned = !!(clinic.lat && clinic.lng);
        // Green = exact location pinned by clinic, Orange = approximate (region-based)
        const color = isPinned ? '#16a34a' : '#f97316';
        const borderColor = isPinned ? '#14532d' : '#9a3412';
        const size = isPinned ? 16 : 13;

        const icon = L.divIcon({
          html: `<div style="width:${size}px;height:${size}px;background:${color};border:2.5px solid ${borderColor};border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
          className: '',
        });

        const [lat, lng] = getClinicCoords(clinic);
        const distText = userLocation
          ? `<br/><span style="color:#64748b;font-size:11px">📍 ${haversineKm(userLocation[0], userLocation[1], lat, lng).toFixed(1)} km uzoqlikda</span>`
          : '';

        const marker = L.marker([lat, lng], { icon }).addTo(map);
        marker.bindPopup(`
          <div style="min-width:200px;font-family:sans-serif">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
              <div style="width:10px;height:10px;background:${color};border-radius:50%;flex-shrink:0"></div>
              <strong style="font-size:13px">${clinic.clinicName || 'Klinika'}</strong>
            </div>
            <span style="font-size:11px;color:#64748b">${clinic.region ?? ''}${clinic.district ? ', ' + clinic.district : ''}</span>
            ${clinic.phone ? `<br/><span style="font-size:11px">📞 ${clinic.phone}</span>` : ''}
            ${distText}
            <br/><span style="font-size:10px;color:${isPinned ? '#16a34a' : '#f97316'}">${isPinned ? '✅ Aniq manzil' : '⚠️ Taxminiy manzil'}</span>
          </div>
        `);
        marker.on('click', () => setSelected(clinic));
      });
    });

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, sorted.length, search, userLocation]);

  const pinnedCount = clinics.filter((c) => c.locationPinned).length;

  return (
    <div className="space-y-4">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t.map.title}</h1>
          <p className="text-sm text-muted-foreground">{t.map.subtitle}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground border rounded-full px-3 py-1">
            <span className="h-2.5 w-2.5 rounded-full bg-green-600 inline-block" />
            Aniq manzil ({pinnedCount})
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground border rounded-full px-3 py-1">
            <span className="h-2.5 w-2.5 rounded-full bg-orange-500 inline-block" />
            Taxminiy ({clinics.length - pinnedCount})
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-13rem)]">
        {/* Sidebar */}
        <div className="lg:w-80 shrink-0 flex flex-col gap-3 overflow-hidden">
          {/* Clinic name search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t.map.searchPlaceholder}
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Nominatim address search — flies map to any address in Uzbekistan */}
          <div className="flex gap-1.5">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Manzil bo'yicha qidirish..."
                className="pl-9 text-sm"
                value={addressSearch}
                onChange={(e) => setAddressSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && geocodeAndFly()}
              />
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={geocodeAndFly}
              disabled={geocoding || !addressSearch.trim()}
              className="shrink-0 px-3"
            >
              {geocoding
                ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
                : <Navigation className="h-3.5 w-3.5" />}
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant={sortByNearest ? 'default' : 'outline'}
              onClick={locateUser}
              disabled={locating}
              className="flex-1 text-xs gap-1"
            >
              <Locate className="h-3.5 w-3.5" />
              {locating ? 'Aniqlanmoqda...' : sortByNearest ? 'Eng yaqin (faol)' : 'Eng yaqinini top'}
            </Button>
            {sortByNearest && (
              <Button size="sm" variant="outline" onClick={() => setSortByNearest(false)} className="text-xs">
                Bekor
              </Button>
            )}
          </div>

          <p className="text-xs text-muted-foreground">{sorted.length} ta klinika</p>

          <div className="overflow-y-auto space-y-2 flex-1">
            {loading ? (
              [1, 2, 3, 4].map((i) => (
                <Card key={i}><CardContent className="p-3"><Skeleton className="h-14 w-full" /></CardContent></Card>
              ))
            ) : sorted.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">{t.map.noResults}</p>
              </div>
            ) : (
              sorted.map((clinic, idx) => {
                const isPinned = !!(clinic.lat && clinic.lng);
                const distKm = userLocation
                  ? haversineKm(userLocation[0], userLocation[1], ...getClinicCoords(clinic)).toFixed(1)
                  : null;
                return (
                  <Card
                    key={clinic.uid ?? idx}
                    className={`cursor-pointer transition-all hover:shadow-md ${selected?.uid === clinic.uid ? 'ring-2 ring-slate-900' : ''}`}
                    onClick={() => setSelected(clinic)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{clinic.clinicName || t.common.noData}</p>
                          <p className="text-xs text-muted-foreground">{clinic.region}{clinic.district ? `, ${clinic.district}` : ''}</p>
                          {clinic.phone && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Phone className="h-3 w-3" />{clinic.phone}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className={`h-2 w-2 rounded-full ${isPinned ? 'bg-green-600' : 'bg-orange-400'}`} />
                          {distKm && (
                            <span className="text-[10px] text-muted-foreground">{distKm} km</span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 rounded-lg overflow-hidden border relative">
          {loading ? (
            <div className="h-full flex items-center justify-center bg-slate-50 text-muted-foreground">
              <p>{t.map.loading}</p>
            </div>
          ) : (
            <div ref={mapRef} className="h-full w-full" />
          )}
        </div>
      </div>

      {/* Selected clinic panel */}
      {selected && (
        <Card className="border-slate-900">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold">{selected.clinicName}</h3>
                  <Badge variant={selected.locationPinned ? 'default' : 'secondary'} className="text-xs">
                    {selected.locationPinned ? (
                      <><MapPin className="h-3 w-3 mr-1" />Aniq manzil</>
                    ) : (
                      <><Navigation className="h-3 w-3 mr-1" />Taxminiy</>
                    )}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {selected.region}{selected.district ? `, ${selected.district}` : ''}{selected.address ? ` • ${selected.address}` : ''}
                </p>
                {selected.phone && <p className="text-sm mt-1">📞 {selected.phone}</p>}
                {selected.specialties && selected.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selected.specialties.slice(0, 5).map((s) => (
                      <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-right shrink-0">
                {userRole === 'admin' && (
                  <p className="text-xs text-muted-foreground">
                    {t.clinics.licenseExpiry}: {selected.licenseExpiry ? new Date(selected.licenseExpiry).toLocaleDateString('uz-UZ') : '-'}
                  </p>
                )}
                {userLocation && selected.lat && selected.lng && (
                  <p className="text-xs text-muted-foreground mt-1">
                    📍 {haversineKm(userLocation[0], userLocation[1], selected.lat, selected.lng).toFixed(1)} km uzoqlikda
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
