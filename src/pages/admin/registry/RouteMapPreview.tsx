/**
 * GoogleRouteMap.tsx
 *
 * Google Maps route explorer for bus route discovery.
 *
 * Features:
 *   - Origin & destination inputs with Google Places Autocomplete
 *     (pre-filled from session stops, but freely editable)
 *   - Add / remove intermediate waypoints (stops the bus passes through)
 *   - Route is draggable — drag any point to reroute around a specific road
 *   - Multiple alternatives shown when no waypoints
 *   - "Use this route" confirms selection and passes the encoded polyline
 *     (exact road path) back to the parent for backend stop discovery
 *
 * The encoded polyline is what enables accurate stop discovery:
 * the backend samples it every 1km and reverse-geocodes each point to find
 * every town/village the route passes through.
 */

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Plus, Trash2, Navigation, Clock, AlertCircle,
  Loader2, GripVertical, ChevronRight, Check,
} from "lucide-react";

// ── Route colours ─────────────────────────────────────────────────────────────
const COLORS        = ["#3b82f6", "#f59e0b", "#22c55e", "#a855f7"];
const COLORS_ACTIVE = ["#60a5fa", "#fbbf24", "#4ade80", "#c084fc"];

// ── Dark map styles ───────────────────────────────────────────────────────────
const DARK_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: "geometry",          stylers: [{ color: "#1d2c4d" }] },
  { elementType: "labels.text.fill",  stylers: [{ color: "#8ec3b9" }] },
  { elementType: "labels.text.stroke",stylers: [{ color: "#1a3646" }] },
  { featureType: "landscape.natural", elementType: "geometry",         stylers: [{ color: "#023e58" }] },
  { featureType: "poi",               elementType: "geometry",         stylers: [{ color: "#283d6a" }] },
  { featureType: "road",              elementType: "geometry",         stylers: [{ color: "#304a7d" }] },
  { featureType: "road.highway",      elementType: "geometry",         stylers: [{ color: "#2c6675" }] },
  { featureType: "road.highway",      elementType: "labels.text.fill", stylers: [{ color: "#b0d5ce" }] },
  { featureType: "water",             elementType: "geometry",         stylers: [{ color: "#0e1626" }] },
];

// ── Script loader (singleton) ─────────────────────────────────────────────────
let _loading = false;
const _waiters: Array<() => void> = [];

function loadGoogleMaps(apiKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.maps) { resolve(); return; }
    if (_loading) { _waiters.push(resolve); return; }
    _loading = true;
    const s     = document.createElement("script");
    s.src       = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places`;
    s.async     = true;
    s.onload    = () => {
      _loading = false;
      resolve();
      _waiters.forEach(fn => fn());
      _waiters.length = 0;
    };
    s.onerror = () => {
      _loading = false;
      reject(new Error("Failed to load Google Maps. Check your API key."));
    };
    document.head.appendChild(s);
  });
}

// ── Types ─────────────────────────────────────────────────────────────────────
export interface GoogleRouteInfo {
  summary:         string;
  distanceKm:      number;
  durationMins:    number;
  routeIndex:      number;
  encodedPolyline: string;    // overview — simplified, kept as fallback
  stepPolylines:   string[];  // detailed: one encoded polyline per turn-by-turn step
}

type StoredRouteOption = {
  summary: string;
  distanceKm: number;
  durationMins: number;
  geometry: { type: "LineString"; coordinates: [number, number][] } | null;
};

interface Props {
  originName:      string;
  destinationName: string;
  disabled?:       boolean;
  onSelect:        (routeIndex: number, info: GoogleRouteInfo) => void;
}

const attachAutocomplete = (input: HTMLInputElement | null) => {
  if (!input || !window.google?.maps?.places) return;
  new google.maps.places.Autocomplete(input, {
    componentRestrictions: { country: "np" },
    fields: ["name", "geometry"],
  });
  input.addEventListener("keydown", event => {
    if (event.key === "Enter") event.preventDefault();
  });
};

// ── Waypoint input with Places Autocomplete ───────────────────────────────────
const WaypointInput: React.FC<{
  placeholder:   string;
  defaultValue?: string;
  inputRef:      React.RefObject<HTMLInputElement | null>;
  onRemove?:     () => void;
  showRemove?:   boolean;
}> = ({ placeholder, defaultValue = "", inputRef, onRemove, showRemove }) => (
  <div className="flex items-center gap-2">
    <GripVertical className="w-4 h-4 text-white/20 flex-shrink-0" />
    <input
      ref={inputRef}
      defaultValue={defaultValue}
      placeholder={placeholder}
      className="
        flex-1 px-4 py-2.5 rounded-xl bg-white/8 border border-white/10 text-white text-sm
        placeholder:text-white/30 outline-none focus:border-white/30 focus:bg-white/10
        transition-all duration-150
      "
    />
    {showRemove && (
      <button
        onClick={onRemove}
        className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-colors"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    )}
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────
export const GoogleRouteMap: React.FC<Props> = ({
  originName,
  destinationName,
  disabled,
  onSelect,
}) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? "";
  const keyMissing = !apiKey || apiKey === "your_google_maps_api_key_here";
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef          = useRef<google.maps.Map | null>(null);
  const renderersRef    = useRef<google.maps.DirectionsRenderer[]>([]);
  const directionsRef   = useRef<google.maps.DirectionsResult | null>(null);

  // Input refs for autocomplete attachment
  const originRef = useRef<HTMLInputElement>(null!);
  const destRef   = useRef<HTMLInputElement>(null!);
  const [waypointRefs, setWaypointRefs] = useState<React.RefObject<HTMLInputElement | null>[]>([]);

  const [routes,   setRoutes]   = useState<google.maps.DirectionsRoute[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [hovered,  setHovered]  = useState<number | null>(null);
  const [loading,  setLoading]  = useState(!keyMissing);
  const [searching,setSearching]= useState(false);
  const [error,    setError]    = useState<string | null>(
    keyMissing ? "VITE_GOOGLE_MAPS_API_KEY is not set in the frontend .env file." : null
  );
  const [mapsReady,setMapsReady]= useState(false);

  // ── Load Google Maps script ─────────────────────────────────────────────────
  useEffect(() => {
    if (keyMissing) return;
    loadGoogleMaps(apiKey).then(() => {
      setMapsReady(true);
      setLoading(false);
    }).catch(err => {
      setError(err.message);
      setLoading(false);
    });
  }, [apiKey, keyMissing]);

  // ── Create map + Autocomplete once Maps is ready ────────────────────────────
  useEffect(() => {
    if (!mapsReady || !mapContainerRef.current) return;

    const map = new google.maps.Map(mapContainerRef.current, {
      center:           { lat: 28.3949, lng: 84.124 },
      zoom:             7,
      mapTypeId:        google.maps.MapTypeId.ROADMAP,
      streetViewControl: false,
      mapTypeControl:   false,
      fullscreenControl: true,
      styles:           DARK_STYLES,
    });
    mapRef.current = map;

    // Attach autocomplete to origin and destination inputs
    attachAutocomplete(originRef.current);
    attachAutocomplete(destRef.current);
  }, [mapsReady]);

  // ── Re-attach autocomplete whenever new waypoint inputs appear ─────────────
  useEffect(() => {
    if (!mapsReady) return;
    waypointRefs.forEach(ref => {
      if (ref.current) attachAutocomplete(ref.current);
    });
  }, [mapsReady, waypointRefs]);

  // ── Search / refresh route ──────────────────────────────────────────────────
  const doSearch = useCallback(async () => {
    if (!mapRef.current) return;

    const originVal = originRef.current?.value?.trim();
    const destVal   = destRef.current?.value?.trim();

    if (!originVal || !destVal) {
      setError("Enter both an origin and a destination.");
      return;
    }

    setSearching(true);
    setError(null);
    setRoutes([]);
    setSelected(null);

    // Clear old renderers
    renderersRef.current.forEach(r => r.setMap(null));
    renderersRef.current = [];

    const waypointValues = waypointRefs
      .map(r => r.current?.value?.trim())
      .filter(Boolean) as string[];

    try {
      const service = new google.maps.DirectionsService();
      const result  = await service.route({
        origin:      originVal,
        destination: destVal,
        waypoints:   waypointValues.map(wp => ({ location: wp, stopover: true })),
        travelMode:  google.maps.TravelMode.DRIVING,
        // Alternatives only available when there are no waypoints
        provideRouteAlternatives: waypointValues.length === 0,
        region: "NP",
      });

      if (!result.routes.length) {
        setError(`No route found for "${originVal}" → "${destVal}".`);
        setSearching(false);
        return;
      }

      directionsRef.current = result;
      setRoutes(result.routes);

      // Render all alternatives (or single route with waypoints)
      result.routes.forEach((_, i) => {
        const isFirst = i === 0;
        const renderer = new google.maps.DirectionsRenderer({
          map:             mapRef.current!,
          directions:      result,
          routeIndex:      i,
          suppressMarkers: !isFirst,
          draggable:       isFirst,  // only the primary route is draggable
          polylineOptions: {
            strokeColor:   COLORS[i % COLORS.length],
            strokeWeight:  isFirst ? 6 : 4,
            strokeOpacity: isFirst ? 0.9 : 0.55,
            zIndex:        isFirst ? 10 : 5,
          },
        });

        // When admin drags the primary route, capture the updated directions
        if (isFirst) {
          renderer.addListener("directions_changed", () => {
            const updated = renderer.getDirections();
            if (updated) {
              directionsRef.current = updated;
              // Update routes state so route cards reflect the new distance/duration
              setRoutes([...updated.routes]);
              setSelected(null); // require re-selection after drag
            }
          });
        }

        renderersRef.current.push(renderer);
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Google Maps error: ${msg}`);
    }

    setSearching(false);
  }, [waypointRefs]);

  // Auto-search on mount once maps is ready
  useEffect(() => {
    if (!mapsReady) return;
    const timer = window.setTimeout(() => void doSearch(), 0);
    return () => window.clearTimeout(timer);
  }, [mapsReady, doSearch]);

  // ── Update polyline highlight on hover / select ─────────────────────────────
  useEffect(() => {
    renderersRef.current.forEach((renderer, i) => {
      const active = hovered === i || selected === i;
      renderer.setOptions({
        polylineOptions: {
          strokeColor:   active ? COLORS_ACTIVE[i % COLORS_ACTIVE.length] : COLORS[i % COLORS.length],
          strokeWeight:  active ? 8 : (i === 0 ? 5 : 3.5),
          strokeOpacity: active ? 1 : (i === 0 ? 0.85 : 0.5),
          zIndex:        active ? 20 : (i === 0 ? 10 : 5),
        },
      });
    });
  }, [hovered, selected]);

  // ── Confirm selection ───────────────────────────────────────────────────────
  const confirmSelection = (i: number) => {
    if (disabled) return;

    const dirs = directionsRef.current;
    if (!dirs || !dirs.routes[i]) return;

    const route = dirs.routes[i];
    const leg   = route.legs.reduce(
      (acc, l) => ({
        distance: { value: acc.distance.value + (l.distance?.value ?? 0) },
        duration: { value: acc.duration.value + (l.duration?.value ?? 0) },
      }),
      { distance: { value: 0 }, duration: { value: 0 } }
    );

    const distanceKm   = Math.round((leg.distance.value / 1000) * 10) / 10;
    const durationMins = Math.round(leg.duration.value / 60);

    // ── Collect STEP polylines (high-resolution) ──────────────────────────
    // overview_polyline is a lossy simplification that drops intermediate
    // points. Step polylines together form the full turn-by-turn geometry
    // with all the detail — critical for catching small villages every 1km.
    const stepPolylines: string[] = [];
    for (const routeLeg of route.legs) {
      if (!routeLeg.steps) continue;
      for (const step of routeLeg.steps) {
        // encoded_lat_lngs is the step-level encoded polyline
        const enc = step.encoded_lat_lngs || step.polyline?.points;
        if (enc) stepPolylines.push(enc);
      }
    }

    // Fall back to overview if steps had no polylines (shouldn't happen)
    const encodedPolyline = route.overview_polyline;
    if (!encodedPolyline && stepPolylines.length === 0) {
      setError("Could not extract route geometry. Try searching again.");
      return;
    }

    setSelected(i);
    onSelect(i, {
      routeIndex: i,
      summary:    route.summary || `Route ${i + 1}`,
      distanceKm,
      durationMins,
      encodedPolyline,   // overview — kept as fallback
      stepPolylines,     // detailed step geometry — used for stop discovery
    });
  };

  // ── Waypoint management ─────────────────────────────────────────────────────
  const addWaypoint = () => {
    setWaypointRefs(current => [...current, React.createRef<HTMLInputElement>()]);
  };
  const removeWaypoint = (i: number) => {
    setWaypointRefs(current => current.filter((_, index) => index !== i));
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* ── Search bar ── */}
      <div className="space-y-2 p-4 rounded-2xl bg-white/4 border border-white/10">
        <div className="space-y-2">
          {/* Origin */}
          <WaypointInput
            inputRef={originRef}
            placeholder="Origin (e.g. Malangwa, Rautahat)"
            defaultValue={originName ? `${originName}, Nepal` : ""}
            showRemove={false}
          />

          {/* Dynamic waypoints */}
          {waypointRefs.map((waypointRef, i) => (
            <WaypointInput
              key={i}
              inputRef={waypointRef}
              placeholder={`Via waypoint ${i + 1} (optional)`}
              showRemove
              onRemove={() => removeWaypoint(i)}
            />
          ))}

          {/* Destination */}
          <WaypointInput
            inputRef={destRef}
            placeholder="Destination (e.g. Kathmandu)"
            defaultValue={destinationName ? `${destinationName}, Nepal` : ""}
            showRemove={false}
          />
        </div>

        {/* Controls row */}
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={addWaypoint}
            className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add waypoint
          </button>

          <button
            onClick={doSearch}
            disabled={searching || !mapsReady}
            className="
              flex items-center gap-2 px-5 py-2 rounded-xl bg-[#D3D925] text-black
              text-sm font-bold hover:bg-[#bfc920] disabled:opacity-50 transition-all
            "
          >
            {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5" />}
            {searching ? "Searching…" : "Show Routes"}
          </button>
        </div>
      </div>

      {/* ── Map ── */}
      <div className="relative rounded-2xl overflow-hidden border border-white/10" style={{ height: 420 }}>
        <div ref={mapContainerRef} style={{ height: "100%", width: "100%" }} />

        {(loading || searching) && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#1d2c4d]/80 backdrop-blur-sm gap-3">
            <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
            <p className="text-white/50 text-sm">{loading ? "Loading Google Maps…" : "Finding routes…"}</p>
          </div>
        )}

        {error && !loading && !searching && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#1d2c4d]/90 backdrop-blur-sm gap-3 px-8 text-center">
            <AlertCircle className="w-6 h-6 text-red-400" />
            <p className="text-red-300 text-sm leading-relaxed">{error}</p>
            {keyMissing && (
              <p className="text-white/30 text-xs">
                Add <code className="text-white/50">VITE_GOOGLE_MAPS_API_KEY</code> to{" "}
                <code className="text-white/50">.env</code> and restart the dev server.
              </p>
            )}
          </div>
        )}

        {/* Drag tip */}
        {routes.length > 0 && selected === null && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10">
            <div className="px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm text-white/50 text-xs whitespace-nowrap">
              Drag the blue route to reroute · Click a card below to select
            </div>
          </div>
        )}
      </div>

      {/* ── Route cards ── */}
      {routes.length > 0 && (
        <>
          <p className="text-white/40 text-xs px-1">
            {routes.length > 1
              ? `${routes.length} route alternatives found. Select the one that matches the actual bus path.`
              : "Route loaded. Drag any point on the map to reroute around a specific road."}
          </p>

          <div className="grid grid-cols-1 gap-3">
            {routes.map((route, i) => {
              const legs      = route.legs;
              const totalDist = legs.reduce((s, l) => s + (l.distance?.value ?? 0), 0);
              const totalDur  = legs.reduce((s, l) => s + (l.duration?.value ?? 0), 0);
              const distKm    = Math.round((totalDist / 1000) * 10) / 10;
              const durMins   = Math.round(totalDur / 60);
              const active    = hovered === i || selected === i;
              const color     = active ? COLORS_ACTIVE[i % COLORS_ACTIVE.length] : COLORS[i % COLORS.length];
              const isSelected = selected === i;

              return (
                <div
                  key={i}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                  className={`
                    p-5 rounded-2xl border transition-all duration-150
                    ${active ? "border-white/25 bg-white/6 shadow-lg" : "border-white/10 bg-transparent"}
                  `}
                >
                  <div className="flex items-center gap-4">
                    {/* Colour dot + info */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-white/10"
                        style={{ background: color }}
                      />
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate" style={{ color: active ? color : "white" }}>
                          {i === 0 ? "Primary · " : `Option ${i + 1} · `}
                          {route.summary || `Route ${i + 1}`}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-white/40">
                          <span className="flex items-center gap-1">
                            <Navigation className="w-3 h-3" /> {distKm} km
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> ~{durMins} min
                          </span>
                          {i === 0 && (
                            <span className="text-white/25 text-[10px]">
                              Drag on map to adjust path
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Select button */}
                    {isSelected ? (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="w-7 h-7 rounded-full bg-[#D3D925] flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 text-black" strokeWidth={3} />
                        </div>
                        <span className="text-[#D3D925] text-xs font-bold">Selected</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => confirmSelection(i)}
                        disabled={disabled}
                        className="
                          flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl
                          bg-[#D3D925]/10 border border-[#D3D925]/30 text-[#D3D925] text-xs font-bold
                          hover:bg-[#D3D925]/20 disabled:opacity-50 transition-all
                        "
                      >
                        Use this route <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {selected !== null && (
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-green-500/10 border border-green-500/20">
              <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-green-300 text-sm font-semibold">Route confirmed</p>
                <p className="text-white/40 text-xs mt-0.5">
                  The exact road path has been captured. The system will now discover every
                  town and village this route passes through.
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

/**
 * Read-only renderer for alternatives returned by the backend Google Routes API.
 * Selection is made against these stored paths, never against a separate browser
 * Directions request, so the reviewed line is the line whose stops are discovered.
 */
export const GoogleStoredRouteMap: React.FC<{
  routeOptions: StoredRouteOption[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
}> = ({ routeOptions, selectedIndex, onSelect }) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? "";
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const polylinesRef = useRef<google.maps.Polyline[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [mapsReady, setMapsReady] = useState(Boolean(window.google?.maps));

  useEffect(() => {
    if (!apiKey || apiKey === "your_google_maps_api_key_here") {
      setError("Google Maps is not configured for this admin environment.");
      return;
    }
    loadGoogleMaps(apiKey).then(() => setMapsReady(true)).catch((loadError) => setError(loadError.message));
  }, [apiKey]);

  useEffect(() => {
    if (!mapsReady || !window.google?.maps || !mapContainerRef.current || routeOptions.length === 0) return;
    const map = new google.maps.Map(mapContainerRef.current, {
      center: { lat: 28.3949, lng: 84.124 }, zoom: 7,
      mapTypeId: google.maps.MapTypeId.ROADMAP, streetViewControl: false,
      mapTypeControl: false, fullscreenControl: true, styles: DARK_STYLES,
    });
    mapRef.current = map;
    const bounds = new google.maps.LatLngBounds();
    polylinesRef.current = routeOptions.map((route, index) => {
      const path = route.geometry?.coordinates.map(([lng, lat]) => ({ lat, lng })) ?? [];
      path.forEach((point) => bounds.extend(point));
      const isSelected = selectedIndex === index;
      const line = new google.maps.Polyline({
        path, map, clickable: true, geodesic: true,
        strokeColor: isSelected ? COLORS_ACTIVE[index % COLORS_ACTIVE.length] : COLORS[index % COLORS.length],
        strokeOpacity: isSelected ? 1 : 0.62, strokeWeight: isSelected ? 7 : 4,
        zIndex: isSelected ? 3 : 1,
      });
      line.addListener("click", () => onSelect(index));
      return line;
    });
    if (!bounds.isEmpty()) map.fitBounds(bounds, 48);
    return () => polylinesRef.current.forEach((line) => line.setMap(null));
  }, [mapsReady, routeOptions, selectedIndex, onSelect]);

  if (error) return <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200">{error}</div>;
  return <div ref={mapContainerRef} className="h-80 w-full rounded-2xl overflow-hidden border border-white/10 bg-[#101827]" />;
};
