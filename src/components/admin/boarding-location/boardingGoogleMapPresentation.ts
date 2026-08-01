/// <reference types="google.maps" />

export const BOARDING_MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#202124" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#c7c9cc" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#202124" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#35373a" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#505257" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#282a2d" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#121c25" }] },
];

export function boardingMarkerIcon(color: string, scale: number): google.maps.Symbol {
  return {
    path: google.maps.SymbolPath.CIRCLE,
    fillColor: color, fillOpacity: 1,
    strokeColor: "#ffffff", strokeWeight: 2, scale,
  };
}
