import { useEffect, useMemo, useRef } from "react";
import L, { type Marker as LeafletMarker } from "leaflet";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import type { BoardingCoordinates } from "./boardingLocationTypes";
import { BoardingMapSearch } from "./BoardingMapSearch";
import { NEPAL_CENTER } from "./boardingLocationMapUtils";

const markerIcon = L.divIcon({
  className: "",
  html: '<span style="display:block;width:24px;height:24px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#EA4B2A;border:3px solid white;box-shadow:0 4px 16px rgba(0,0,0,.45)"></span>',
  iconSize: [22, 22],
  iconAnchor: [11, 22],
});

const stopIcon = L.divIcon({
  className: "",
  html: '<span style="display:block;width:14px;height:14px;border-radius:50%;background:#30343B;border:3px solid white;box-shadow:0 3px 12px rgba(0,0,0,.4)"></span>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

function MapEvents({ onChange }: { onChange: (value: BoardingCoordinates) => void }) {
  useMapEvents({
    click(event) {
      onChange({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });
  return null;
}

function Recenter({ position }: { position: BoardingCoordinates | null }) {
  const map = useMap();
  const previous = useRef<string>("");
  useEffect(() => {
    if (!position) return;
    const key = `${position.lat}:${position.lng}`;
    if (key !== previous.current) map.flyTo([position.lat, position.lng], 16);
    previous.current = key;
  }, [map, position]);
  return null;
}

export function BoardingLocationMapPicker({
  value,
  center,
  onChange,
}: {
  value: BoardingCoordinates | null;
  center: BoardingCoordinates | null;
  onChange: (value: BoardingCoordinates) => void;
}) {
  const initialCenter = useMemo<[number, number]>(() => {
    const point = value || center;
    return point ? [point.lat, point.lng] : NEPAL_CENTER;
  }, [center, value]);

  return (
    <div className="relative h-full min-h-[420px] overflow-hidden rounded-2xl border border-white/10 bg-[#121212]">
      <BoardingMapSearch onSelect={onChange} />
      <MapContainer center={initialCenter} zoom={value || center ? 15 : 7} className="h-full min-h-[420px] w-full">
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <MapEvents onChange={onChange} />
        <Recenter position={value || center} />
        {center && <Marker interactive={false} icon={stopIcon} position={[center.lat, center.lng]} />}
        {value && (
          <Marker
            draggable
            icon={markerIcon}
            position={[value.lat, value.lng]}
            eventHandlers={{
              dragend(event) {
                const marker = event.target as LeafletMarker;
                const point = marker.getLatLng();
                onChange({ lat: point.lat, lng: point.lng });
              },
            }}
          />
        )}
      </MapContainer>
      <div className="pointer-events-none absolute bottom-7 left-3 z-[500] rounded-lg bg-[#0a0a0a]/85 px-3 py-2 text-[11px] text-white/70">
        Grey: route stop · Orange: exact boarding place
      </div>
    </div>
  );
}
