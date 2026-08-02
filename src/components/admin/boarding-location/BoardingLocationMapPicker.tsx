/// <reference types="google.maps" />
import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { loadGoogleMaps } from "@/lib/googleMapsLoader";
import type { AdminStop } from "@/components/admin/stop-registry/stopRegistryTypes";
import type { BoardingCoordinates, BoardingLocation, BoardingMapSelection } from "./boardingLocationTypes";
import { NEPAL_CENTER, validCoordinates } from "./boardingLocationMapUtils";
import { BOARDING_MAP_STYLES, boardingMarkerIcon } from "./boardingGoogleMapPresentation";
import { getSuggestedLocationType, getSuggestedPlaceName } from "./boardingGooglePlaceDetails";
import { BoardingLocationMapToolbar } from "./BoardingLocationMapToolbar";
import { normalizeGooglePlaceAddress } from "@/lib/googlePlaceFormatting";
import {
  boardingPlaceLookupQuery, routeStopLookupQuery,
} from "./boardingRouteStopMapContext";

type GoogleResult = google.maps.places.PlaceResult | google.maps.GeocoderResult;

export function BoardingLocationMapPicker({
  value, routeStop, existingLocations, onChange,
}: {
  value: BoardingCoordinates | null;
  routeStop: AdminStop;
  existingLocations: BoardingLocation[];
  onChange: (selection: BoardingMapSelection) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const onChangeRef = useRef(onChange);
  const initialRef = useRef({ value, routeStop, existingLocations });
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const selectRef = useRef<((point: BoardingCoordinates, source: BoardingMapSelection["coordinateSource"], accuracy?: number, place?: GoogleResult) => void) | null>(null);
  const [searchText, setSearchText] = useState("");
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [contextStatus, setContextStatus] = useState<"LOCATING" | "LOCATED" | "MISSING">(
    validCoordinates(routeStop.coordinates) ? "LOCATED" : "LOCATING",
  );
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  useEffect(() => {
    let disposed = false;
    const listeners: google.maps.MapsEventListener[] = [];
    const markers: google.maps.Marker[] = [];

    loadGoogleMaps().then(() => {
      if (disposed || !containerRef.current || !searchRef.current) return;
      const initial = initialRef.current;
      const routePosition = validCoordinates(initial.routeStop.coordinates)
        ? initial.routeStop.coordinates : null;
      const focus = initial.value || routePosition || { lat: NEPAL_CENTER[0], lng: NEPAL_CENTER[1] };
      const map = new google.maps.Map(containerRef.current, {
        center: focus,
        zoom: initial.value || routePosition ? 16 : 7,
        styles: BOARDING_MAP_STYLES,
        mapTypeControl: false,
        streetViewControl: true,
        fullscreenControl: true,
        gestureHandling: "greedy",
      });
      const geocoder = new google.maps.Geocoder();
      geocoderRef.current = geocoder;
      const proposed = new google.maps.Marker({
        map, position: initial.value || undefined, draggable: true,
        icon: boardingMarkerIcon("#F97316", 9), title: "Proposed boarding place",
      });
      markers.push(proposed);
      const routeStopMarker = new google.maps.Marker({
        map, position: routePosition || undefined,
        icon: boardingMarkerIcon("#555B65", 7),
        title: `Route stop: ${initial.routeStop.name}`,
      });
      markers.push(routeStopMarker);
      for (const location of initial.existingLocations.filter((item) => item.status === "ACTIVE")) {
        markers.push(new google.maps.Marker({
          map, position: location.coordinates, icon: boardingMarkerIcon("#EA4B2A", 6),
          title: location.name,
        }));
      }

      const select = (point: BoardingCoordinates, source: BoardingMapSelection["coordinateSource"], accuracy?: number, place?: GoogleResult) => {
        proposed.setPosition(point);
        map.panTo(point);
        const publish = (result?: google.maps.GeocoderResult) => onChangeRef.current({
          coordinates: point,
          coordinateSource: source,
          coordinateAccuracyMeters: accuracy ?? null,
          capturedAt: new Date().toISOString(),
          suggestedName: getSuggestedPlaceName(place || result),
          suggestedLocationType: getSuggestedLocationType((place || result)?.types),
          providerMetadata: {
            provider: "GOOGLE",
            placeId: place?.place_id || result?.place_id || null,
            suggestedAddress: normalizeGooglePlaceAddress(place || result),
          },
        });
        if (place) publish();
        else geocoder.geocode({ location: point }, (results) => publish(results?.[0]));
      };
      selectRef.current = select;
      listeners.push(map.addListener("click", (event: google.maps.MapMouseEvent) => {
        if (event.latLng) select(event.latLng.toJSON(), "MAP_PIN");
      }));
      listeners.push(proposed.addListener("dragend", () => {
        const position = proposed.getPosition();
        if (position) select(position.toJSON(), "MAP_PIN");
      }));
      const autocomplete = new google.maps.places.Autocomplete(searchRef.current, {
        componentRestrictions: { country: "np" },
        fields: ["place_id", "name", "formatted_address", "address_components", "types", "geometry"],
        bounds: routePosition ? new google.maps.LatLngBounds(
          { lat: routePosition.lat - 0.08, lng: routePosition.lng - 0.08 },
          { lat: routePosition.lat + 0.08, lng: routePosition.lng + 0.08 },
        ) : undefined,
        strictBounds: false,
      });
      listeners.push(autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        const position = place.geometry?.location;
        if (position) {
          setSearchText(place.name || normalizeGooglePlaceAddress(place) || "");
          select(position.toJSON(), "GOOGLE_PLACE", undefined, place);
        }
      }));
      if (routePosition) {
        setContextStatus("LOCATED");
        setLoading(false);
      } else {
        geocoder.geocode({
          address: routeStopLookupQuery(initial.routeStop),
          componentRestrictions: { country: "NP" },
        }, (results, status) => {
          if (disposed) return;
          const position = results?.[0]?.geometry.location;
          if (status !== "OK" || !position) {
            setContextStatus("MISSING");
            setError(`Google Maps could not locate ${initial.routeStop.name}. Search nearby or set the stop coordinates first.`);
            setLoading(false);
            return;
          }
          const resolved = position.toJSON();
          routeStopMarker.setPosition(resolved);
          autocomplete.setBounds(new google.maps.LatLngBounds(
            { lat: resolved.lat - 0.08, lng: resolved.lng - 0.08 },
            { lat: resolved.lat + 0.08, lng: resolved.lng + 0.08 },
          ));
          if (!initial.value) { map.setCenter(resolved); map.setZoom(16); }
          setContextStatus("LOCATED");
          setLoading(false);
        });
      }
    }).catch((cause: Error) => {
      if (!disposed) { setError(cause.message); setLoading(false); }
    });

    return () => {
      disposed = true;
      selectRef.current = null;
      geocoderRef.current = null;
      listeners.forEach((listener) => listener.remove());
      markers.forEach((marker) => marker.setMap(null));
    };
  }, []);

  const searchMap = () => {
    const query = searchText.trim();
    if (!query || !geocoderRef.current) {
      setError("Enter a place, landmark, gate or counter to search the map.");
      return;
    }
    setSearching(true); setError("");
    geocoderRef.current.geocode(
      {
        address: boardingPlaceLookupQuery(query, routeStop),
        componentRestrictions: { country: "NP" },
      },
      (results, status) => {
        setSearching(false);
        const result = results?.[0];
        const position = result?.geometry.location;
        if (status !== "OK" || !result || !position) {
          setError("No matching place was found. Try a nearby landmark or place the pin manually.");
          return;
        }
        setSearchText(normalizeGooglePlaceAddress(result) || result.formatted_address);
        selectRef.current?.(position.toJSON(), "GOOGLE_PLACE", undefined, result);
      },
    );
  };

  const useCurrentLocation = () => navigator.geolocation?.getCurrentPosition(
    (position) => selectRef.current?.(
      { lat: position.coords.latitude, lng: position.coords.longitude },
      "ADMIN_GPS", position.coords.accuracy,
    ),
    () => setError("Your current position could not be read. Use search or place the marker manually."),
    { enableHighAccuracy: true, timeout: 12_000 },
  );

  return (
    <div className="relative min-h-[460px] overflow-hidden rounded-2xl border border-white/10 bg-[#121212]">
      <div ref={containerRef} className="absolute inset-0" />
      <BoardingLocationMapToolbar inputRef={searchRef} value={searchText} placeholder={`Search a boarding place near ${routeStop.name}`} searching={searching} onChange={setSearchText} onSearch={searchMap} onCurrentLocation={useCurrentLocation} />
      <div className="pointer-events-none absolute left-3 top-[68px] z-10 flex items-center gap-2 rounded-lg border border-white/10 bg-[#0a0a0a]/90 px-3 py-2 text-xs text-white/80 shadow-lg">
        <span className="size-2.5 rounded-full bg-[#555B65] ring-2 ring-white/20" />
        {contextStatus === "LOCATING" ? "Locating route stop…" : <>Route stop: <strong className="text-white">{routeStop.name}</strong>{contextStatus === "MISSING" && " (not located)"}</>}
      </div>
      {loading && <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#121212]"><Loader2 className="size-6 animate-spin text-[#F97316]" /></div>}
      {error && <p className="absolute bottom-14 left-3 right-3 z-10 rounded-lg bg-red-950/90 px-3 py-2 text-xs text-red-100">{error}</p>}
      <div className="pointer-events-none absolute bottom-7 left-3 z-10 rounded-lg bg-[#0a0a0a]/90 px-3 py-2 text-[11px] text-white/70">Grey: route stop · Small orange: saved place · Large orange: your new draggable point</div>
    </div>
  );
}
