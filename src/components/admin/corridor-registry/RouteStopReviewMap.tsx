/// <reference types="google.maps" />
import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import { loadGoogleMaps } from "@/lib/googleMapsLoader";
import type { RouteOption, VariantStopCandidate } from "@/api/corridorWorkflowApi";

interface RouteStopReviewMapProps {
  selectedRoute: RouteOption | null;
  candidates: VariantStopCandidate[];
}

const MARKER_COLORS = {
  terminal: "#D3D925",
  existing: "#34D399",
  suggestion: "#F97316",
  created: "#38BDF8",
  excluded: "#9CA3AF",
};

function decodePolyline(encoded: string) {
  const path: google.maps.LatLngLiteral[] = [];
  let index = 0;
  let latitude = 0;
  let longitude = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20 && index < encoded.length);

    latitude += result & 1 ? ~(result >> 1) : result >> 1;
    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20 && index < encoded.length);

    longitude += result & 1 ? ~(result >> 1) : result >> 1;
    path.push({ lat: latitude / 1e5, lng: longitude / 1e5 });
  }

  return path;
}

function candidatePosition(candidate: VariantStopCandidate) {
  const coordinate = candidate.coords || candidate.coordinates || candidate.resolvedStop?.coordinates || candidate.matchedStop?.coordinates;
  if (!coordinate || !Number.isFinite(coordinate.lat) || !Number.isFinite(coordinate.lng)) return null;
  return coordinate;
}

function markerColor(candidate: VariantStopCandidate) {
  if (candidate.isTerminal) return MARKER_COLORS.terminal;
  if (candidate.reviewStatus === "EXCLUDE") return MARKER_COLORS.excluded;
  if (candidate.reviewStatus === "CREATE_NEW") return MARKER_COLORS.created;
  if (candidate.matchedStop || candidate.resolvedStop) return MARKER_COLORS.existing;
  return MARKER_COLORS.suggestion;
}

function markerTitle(candidate: VariantStopCandidate) {
  if (candidate.isTerminal) return `${candidate.sequence}. ${candidate.displayName} — terminal`;
  if (candidate.matchedStop || candidate.resolvedStop) return `${candidate.sequence}. ${candidate.displayName} — Shuvmarg stop match`;
  return `${candidate.sequence}. ${candidate.displayName} — Google suggestion`;
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="size-2.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

export function RouteStopReviewMap({ selectedRoute, candidates }: RouteStopReviewMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const hasFittedBoundsRef = useRef<boolean>(false);
  const prevRouteKeyRef = useRef<string>("");
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");

  const routeKey = selectedRoute?.id || "";
  if (prevRouteKeyRef.current !== routeKey) {
    prevRouteKeyRef.current = routeKey;
    hasFittedBoundsRef.current = false;
  }

  useEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | undefined;

    const render = async () => {
      try {
        await loadGoogleMaps();
        if (cancelled || !containerRef.current) return;

        const map = mapRef.current || new google.maps.Map(containerRef.current, {
          center: { lat: 28.3949, lng: 84.124 },
          zoom: 7,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          gestureHandling: "cooperative",
        });

        mapRef.current = map;
        const bounds = new google.maps.LatLngBounds();
        const overlays: Array<google.maps.Polyline | google.maps.Marker> = [];

        if (selectedRoute?.encodedPolyline) {
          const path = decodePolyline(selectedRoute.encodedPolyline);
          path.forEach((point) => bounds.extend(point));
          overlays.push(new google.maps.Polyline({
            map,
            path,
            strokeColor: "#D3D925",
            strokeOpacity: 0.9,
            strokeWeight: 5,
            zIndex: 1,
          }));
        }

        const MAP_PIN_PATH =
          "M 12 0 C 5.37 0 0 5.37 0 12 C 0 20.5 12 34 12 34 C 12 34 24 20.5 24 12 C 24 5.37 18.63 0 12 0 Z";

        candidates.forEach((candidate) => {
          const position = candidatePosition(candidate);
          if (!position) return;
          bounds.extend(position);
          overlays.push(
            new google.maps.Marker({
              map,
              position,
              title: markerTitle(candidate),
              label: {
                text: String(candidate.sequence),
                color: candidate.reviewStatus === "EXCLUDE" ? "#555555" : "#000000",
                fontWeight: "800",
                fontSize: String(candidate.sequence).length > 2 ? "8.5px" : "10px",
                fontFamily: "Inter, system-ui, sans-serif",
              },
              icon: {
                path: MAP_PIN_PATH,
                scale: candidate.isTerminal ? 1.2 : 1.0,
                fillColor: markerColor(candidate),
                fillOpacity: candidate.reviewStatus === "EXCLUDE" ? 0.6 : 1,
                strokeColor: "#111111",
                strokeWeight: 1.5,
                anchor: new google.maps.Point(12, 34),
                labelOrigin: new google.maps.Point(12, 12),
              },
              zIndex: candidate.isTerminal ? 10 : 5,
            })
          );
        });

        if (!bounds.isEmpty() && !hasFittedBoundsRef.current) {
          map.fitBounds(bounds, 44);
          hasFittedBoundsRef.current = true;
        }
        setState("ready");
        cleanup = () => overlays.forEach((overlay) => overlay.setMap(null));
      } catch (caught) {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : "Unable to load the route-stop review map.");
          setState("error");
        }
      }
    };

    setState("loading");
    void render();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [candidates, selectedRoute]);

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div>
          <p className="text-sm font-bold text-white">Stops on the selected road path</p>
          <p className="mt-0.5 text-xs text-white/40">Use Shuvmarg stops when they match. Create new Stops only when the place is genuinely missing.</p>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-semibold text-white/45">
          <LegendDot color={MARKER_COLORS.terminal} label="terminal" />
          <LegendDot color={MARKER_COLORS.existing} label="existing stop" />
          <LegendDot color={MARKER_COLORS.suggestion} label="Google suggestion" />
          <LegendDot color={MARKER_COLORS.created} label="new stop" />
          <LegendDot color={MARKER_COLORS.excluded} label="excluded" />
        </div>
      </div>

      <div className="relative h-72 sm:h-80">
        <div ref={containerRef} className="h-full w-full" />
        {state === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-[#111]/75 text-sm text-white/55">
            <Loader2 className="size-4 animate-spin text-[#D3D925]" />
            Loading reviewed stops on map…
          </div>
        )}
        {state === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
            <MapPin className="mb-2 size-6 text-white/25" />
            <p className="text-sm font-semibold text-white/70">Stop review map unavailable</p>
            <p className="mt-1 max-w-sm text-xs leading-5 text-white/40">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
