import type { BoardingCoordinates } from "./boardingLocationTypes";

export const NEPAL_CENTER: [number, number] = [28.3949, 84.124];

export function validCoordinates(
  coordinates?: { lat: number | null; lng: number | null } | null,
): coordinates is BoardingCoordinates {
  return Number.isFinite(coordinates?.lat) && Number.isFinite(coordinates?.lng) &&
    Number(coordinates?.lat) >= -90 && Number(coordinates?.lat) <= 90 &&
    Number(coordinates?.lng) >= -180 && Number(coordinates?.lng) <= 180;
}

export function distanceMeters(
  left: BoardingCoordinates,
  right: BoardingCoordinates,
) {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const latDelta = radians(right.lat - left.lat);
  const lngDelta = radians(right.lng - left.lng);
  const value = Math.sin(latDelta / 2) ** 2 +
    Math.cos(radians(left.lat)) * Math.cos(radians(right.lat)) *
    Math.sin(lngDelta / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}
