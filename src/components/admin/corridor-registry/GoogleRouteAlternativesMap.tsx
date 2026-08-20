/// <reference types="google.maps" />
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, MapPin, Maximize2, Minimize2, X } from "lucide-react";
import { loadGoogleMaps } from "@/lib/googleMapsLoader";
import type { CorridorStop, RouteOption } from "@/api/corridorWorkflowApi";

interface GoogleRouteAlternativesMapProps {
  options: RouteOption[];
  selectedOptionId: string | null;
  originTerminal: CorridorStop | undefined;
  destinationTerminal: CorridorStop | undefined;
  onSelect: (optionId: string) => void;
}

function decodePolyline(encoded: string) {
  const path: google.maps.LatLngLiteral[] = [];
  let index = 0;
  let latitude = 0;
  let longitude = 0;
  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;
    do { byte = encoded.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20 && index < encoded.length);
    latitude += result & 1 ? ~(result >> 1) : result >> 1;
    shift = 0;
    result = 0;
    do { byte = encoded.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20 && index < encoded.length);
    longitude += result & 1 ? ~(result >> 1) : result >> 1;
    path.push({ lat: latitude / 1e5, lng: longitude / 1e5 });
  }
  return path;
}

function isCoordinate(value: CorridorStop["coordinates"]): value is { lat: number; lng: number } {
  return Boolean(value && Number.isFinite(value.lat) && Number.isFinite(value.lng));
}

export function GoogleRouteAlternativesMap({ options, selectedOptionId, originTerminal, destinationTerminal, onSelect }: GoogleRouteAlternativesMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!isFullscreen) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsFullscreen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isFullscreen]);

  useEffect(() => {
    let cancelled = false;
    const render = async () => {
      try {
        await loadGoogleMaps();
        if (cancelled || !containerRef.current) return;
        const container = containerRef.current;
        const map = mapRef.current && mapContainerRef.current === container
          ? mapRef.current
          : new google.maps.Map(container, { center: { lat: 28.3949, lng: 84.124 }, zoom: 7, mapTypeControl: false, streetViewControl: false, fullscreenControl: false, gestureHandling: "cooperative" });
        mapRef.current = map;
        mapContainerRef.current = container;
        const bounds = new google.maps.LatLngBounds();
        const renderables: Array<google.maps.Polyline | google.maps.Marker> = [];
        const listeners: google.maps.MapsEventListener[] = [];
        options.forEach((option) => {
          if (!option.encodedPolyline) return;
          const path = decodePolyline(option.encodedPolyline);
          if (!path.length) return;
          path.forEach((point) => bounds.extend(point));
          const selected = option.id === selectedOptionId;
          const polyline = new google.maps.Polyline({ map, path, strokeColor: selected ? "#D3D925" : "#9CA3AF", strokeOpacity: selected ? 0.95 : 0.52, strokeWeight: selected ? 6 : 4, zIndex: selected ? 2 : 1, clickable: true });
          listeners.push(polyline.addListener("click", () => onSelect(option.id)));
          renderables.push(polyline);
        });
        const MAP_PIN_PATH =
          "M 12 0 C 5.37 0 0 5.37 0 12 C 0 20.5 12 34 12 34 C 12 34 24 20.5 24 12 C 24 5.37 18.63 0 12 0 Z";

        [
          [originTerminal, "A"],
          [destinationTerminal, "B"],
        ].forEach(([terminal, label]) => {
          const point = terminal as CorridorStop | undefined;
          if (!point || !isCoordinate(point.coordinates)) return;
          bounds.extend(point.coordinates);
          renderables.push(
            new google.maps.Marker({
              map,
              position: point.coordinates,
              title: point.name,
              label: {
                text: label as string,
                color: "#111111",
                fontWeight: "900",
                fontSize: "12px",
              },
              icon: {
                path: MAP_PIN_PATH,
                scale: 1.25,
                fillColor: "#D3D925",
                fillOpacity: 1,
                strokeColor: "#111111",
                strokeWeight: 2,
                anchor: new google.maps.Point(12, 34),
                labelOrigin: new google.maps.Point(12, 12),
              },
              zIndex: 10,
            })
          );
        });
        if (!bounds.isEmpty()) map.fitBounds(bounds, 48);
        setState("ready");
        return () => { listeners.forEach((listener) => listener.remove()); renderables.forEach((overlay) => overlay.setMap(null)); };
      } catch (caught) {
        if (!cancelled) { setError(caught instanceof Error ? caught.message : "Unable to load the route map."); setState("error"); }
      }
      return undefined;
    };
    let cleanup: (() => void) | undefined;
    void render().then((dispose) => { cleanup = dispose; });
    return () => { cancelled = true; cleanup?.(); };
  }, [destinationTerminal, isFullscreen, onSelect, options, originTerminal, selectedOptionId]);

  const mapSurface = (
      <div className={`relative overflow-hidden border border-white/10 bg-[#111] transition-all ${isFullscreen ? "h-full w-full rounded-2xl shadow-2xl" : "h-72 rounded-2xl sm:h-96"}`}>
        <div ref={containerRef} className="h-full w-full" />
        {state === "loading" && <div className="absolute inset-0 flex items-center justify-center gap-2 bg-[#111]/75 text-sm text-white/55"><Loader2 className="size-4 animate-spin text-[#D3D925]" />Loading mapped alternatives…</div>}
        {state === "error" && <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center"><MapPin className="mb-2 size-6 text-white/25" /><p className="text-sm font-semibold text-white/70">Map preview unavailable</p><p className="mt-1 max-w-sm text-xs leading-5 text-white/40">{error}</p></div>}
        <button
          type="button"
          onClick={() => setIsFullscreen((value) => !value)}
          className="absolute right-3 top-3 flex items-center gap-2 rounded-lg border border-white/15 bg-[#111]/90 px-3 py-2 text-xs font-semibold text-white/75 shadow-lg transition hover:bg-[#191919] hover:text-white"
          aria-label={isFullscreen ? "Exit full-screen map" : "Open full-screen map"}
        >
          {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
          <span className="hidden sm:inline">{isFullscreen ? "Exit full screen" : "Full screen"}</span>
        </button>
        {isFullscreen && (
          <button type="button" onClick={() => setIsFullscreen(false)} className="absolute left-3 top-3 rounded-lg border border-white/15 bg-[#111]/90 p-2 text-white/70 hover:text-white" aria-label="Close full-screen map">
            <X className="size-4" />
          </button>
        )}
        <div className="pointer-events-none absolute bottom-3 left-3 rounded-lg border border-white/10 bg-[#111]/90 px-2.5 py-1.5 text-[10px] font-medium text-white/55">Routes are supplied by the backend. Click a line to select it.</div>
      </div>
  );

  if (isFullscreen) {
    return createPortal(
      <div className="fixed inset-0 z-[200] bg-black/85 p-4 backdrop-blur-sm sm:p-8">
        {mapSurface}
      </div>,
      document.body,
    );
  }

  return mapSurface;
}
