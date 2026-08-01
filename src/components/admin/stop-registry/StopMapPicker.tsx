/// <reference types="google.maps" />
import { useEffect, useRef, useState } from "react";
import { Crosshair, Loader2, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loadGoogleMaps } from "@/lib/googleMapsLoader";
import { BOARDING_MAP_STYLES, boardingMarkerIcon } from
  "@/components/admin/boarding-location/boardingGoogleMapPresentation";
import type { AdminStop, StopCoordinates, StopMapSelection } from "./stopRegistryTypes";
import { buildStopMapSelection, validStopCoordinates } from "./stopMapSelection";

const NEPAL_CENTER: StopCoordinates = { lat: 28.3949, lng: 84.124 };
type GooglePlace = google.maps.places.PlaceResult | google.maps.GeocoderResult;

export function StopMapPicker({ value, parentStop, nearbyStops, onSelect }: {
  value: StopMapSelection | null;
  parentStop: AdminStop | null;
  nearbyStops: AdminStop[];
  onSelect: (selection: StopMapSelection) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const selectRef = useRef<((point: StopCoordinates, source: StopMapSelection["coordinateSource"], accuracy?: number, place?: GooglePlace) => void) | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const onSelectRef = useRef(onSelect);
  const initialRef = useRef({ value, parentStop, nearbyStops });
  const [searchText, setSearchText] = useState("");
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);

  useEffect(() => {
    let disposed = false;
    const listeners: google.maps.MapsEventListener[] = [];
    const markers: google.maps.Marker[] = [];
    loadGoogleMaps().then(() => {
      if (disposed || !containerRef.current || !searchRef.current) return;
      const initial = initialRef.current;
      const parentPosition = validStopCoordinates(initial.parentStop?.coordinates)
        ? initial.parentStop.coordinates : null;
      const focus = initial.value?.coordinates || parentPosition || NEPAL_CENTER;
      const map = new google.maps.Map(containerRef.current, {
        center: focus, zoom: initial.value || parentPosition ? 15 : 7,
        styles: BOARDING_MAP_STYLES, mapTypeControl: false,
        streetViewControl: true, fullscreenControl: true, gestureHandling: "greedy",
      });
      const selectedMarker = new google.maps.Marker({
        map, position: initial.value?.coordinates, draggable: true,
        icon: boardingMarkerIcon("#F97316", 9), title: "Selected stop position",
      });
      markers.push(selectedMarker);
      if (parentPosition) markers.push(new google.maps.Marker({
        map, position: parentPosition, icon: boardingMarkerIcon("#6B7280", 7),
        title: `Parent: ${initial.parentStop?.name}`,
      }));
      for (const stop of initial.nearbyStops) {
        if (!validStopCoordinates(stop.coordinates)) continue;
        markers.push(new google.maps.Marker({
          map, position: stop.coordinates, icon: boardingMarkerIcon("#D3D925", 5),
          title: `${stop.name} (${stop.code || "existing stop"})`,
        }));
      }
      const geocoder = new google.maps.Geocoder();
      geocoderRef.current = geocoder;
      const select = (point: StopCoordinates, source: StopMapSelection["coordinateSource"], accuracy?: number, place?: GooglePlace) => {
        selectedMarker.setPosition(point); map.panTo(point); map.setZoom(17); setError("");
        const publish = (result?: google.maps.GeocoderResult) => onSelectRef.current(
          buildStopMapSelection(point, source, place || result, accuracy),
        );
        if (place) publish();
        else geocoder.geocode({ location: point }, (results) => publish(results?.[0]));
      };
      selectRef.current = select;
      listeners.push(map.addListener("click", (event: google.maps.MapMouseEvent) => {
        if (event.latLng) select(event.latLng.toJSON(), "MAP_PIN");
      }));
      listeners.push(selectedMarker.addListener("dragend", () => {
        const position = selectedMarker.getPosition();
        if (position) select(position.toJSON(), "MAP_PIN");
      }));
      const autocomplete = new google.maps.places.Autocomplete(searchRef.current, {
        componentRestrictions: { country: "np" },
        fields: ["place_id", "name", "formatted_address", "address_components", "geometry"],
        bounds: parentPosition ? new google.maps.LatLngBounds(
          { lat: parentPosition.lat - 0.12, lng: parentPosition.lng - 0.12 },
          { lat: parentPosition.lat + 0.12, lng: parentPosition.lng + 0.12 },
        ) : undefined,
      });
      listeners.push(autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        const position = place.geometry?.location;
        if (position) {
          setSearchText(place.name || place.formatted_address || "");
          select(position.toJSON(), "GOOGLE_PLACE", undefined, place);
        }
      }));
      setLoading(false);
    }).catch((cause: Error) => { if (!disposed) { setError(cause.message); setLoading(false); } });
    return () => {
      disposed = true; selectRef.current = null; geocoderRef.current = null;
      listeners.forEach((listener) => listener.remove());
      markers.forEach((marker) => marker.setMap(null));
    };
  }, []);

  const search = () => {
    const query = searchText.trim();
    if (!query || !geocoderRef.current) return setError("Enter a stop, town, junction or landmark to search.");
    setSearching(true); setError("");
    geocoderRef.current.geocode({ address: query, componentRestrictions: { country: "NP" } }, (results, status) => {
      setSearching(false);
      const result = results?.[0]; const position = result?.geometry.location;
      if (status !== "OK" || !result || !position) return setError("No matching place was found. Try a nearby landmark or click the map.");
      setSearchText(result.formatted_address);
      selectRef.current?.(position.toJSON(), "GOOGLE_PLACE", undefined, result);
    });
  };

  const currentLocation = () => {
    if (!navigator.geolocation) return setError("Location access is unavailable. Search or click the map instead.");
    navigator.geolocation.getCurrentPosition((position) => selectRef.current?.({
      lat: position.coords.latitude, lng: position.coords.longitude,
    }, "ADMIN_GPS", position.coords.accuracy),
    () => setError("Your location could not be read. Search or click the map instead."),
    { enableHighAccuracy: true, timeout: 12_000 });
  };

  return <div className="relative min-h-[430px] overflow-hidden rounded-2xl border border-white/10 bg-[#121212]">
    <div ref={containerRef} className="absolute inset-0" />
    <form className="absolute left-3 right-3 top-3 z-10 flex gap-2 rounded-xl border border-white/10 bg-[#0a0a0a]/95 p-2 shadow-xl" onSubmit={(event) => { event.preventDefault(); search(); }}>
      <MapPin className="ml-2 mt-2 size-4 shrink-0 text-[#F97316]" />
      <Input ref={searchRef} value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Search stop, town, junction or landmark" className="h-9 border-0 bg-transparent text-sm focus-visible:ring-0" />
      <Button type="submit" size="sm" className="h-9 bg-[#F97316] text-black hover:bg-[#fb923c]" disabled={searching}>{searching ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}<span className="hidden sm:inline">Search</span></Button>
      <Button type="button" variant="outline" size="sm" className="h-9" onClick={currentLocation}><Crosshair className="size-4" /><span className="hidden xl:inline">Current location</span></Button>
    </form>
    {loading && <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#121212]"><Loader2 className="size-6 animate-spin text-[#F97316]" /></div>}
    {error && <p className="absolute bottom-14 left-3 right-3 z-10 rounded-lg bg-red-950/90 px-3 py-2 text-xs text-red-100">{error}</p>}
    <div className="pointer-events-none absolute bottom-5 left-3 z-10 rounded-lg bg-[#0a0a0a]/90 px-3 py-2 text-[11px] text-white/70">Search, click, or drag · Orange: selected · Grey: parent · Lime: nearby stop</div>
  </div>;
}
