/// <reference types="google.maps" />
import type { StopCoordinates, StopMapSelection } from "./stopRegistryTypes";

type PlaceLike = {
  name?: string;
  formatted_address?: string;
  place_id?: string;
  address_components?: google.maps.GeocoderAddressComponent[];
};

function component(place: PlaceLike | undefined, types: string[]) {
  return place?.address_components?.find((item) =>
    types.some((type) => item.types.includes(type)),
  )?.long_name;
}

export function buildStopMapSelection(
  coordinates: StopCoordinates,
  source: StopMapSelection["coordinateSource"],
  place?: PlaceLike,
  accuracy?: number,
): StopMapSelection {
  return {
    coordinates,
    coordinateSource: source,
    coordinateAccuracyMeters: accuracy ?? null,
    coordinateCapturedAt: new Date().toISOString(),
    coordinateProvider: "GOOGLE",
    coordinatePlaceId: place?.place_id || null,
    coordinateSuggestedAddress: place?.formatted_address || null,
    suggestedName: place?.name || place?.formatted_address?.split(",")[0]?.trim(),
    suggestedProvince: component(place, ["administrative_area_level_1"]),
    suggestedDistrict: component(place, ["administrative_area_level_2"]),
    suggestedMunicipality: component(place, [
      "locality", "administrative_area_level_3", "sublocality",
    ]),
  };
}

export function validStopCoordinates(
  coordinates?: { lat: number | null; lng: number | null } | null,
): coordinates is StopCoordinates {
  return Number.isFinite(coordinates?.lat) && Number.isFinite(coordinates?.lng) &&
    Number(coordinates?.lat) >= -90 && Number(coordinates?.lat) <= 90 &&
    Number(coordinates?.lng) >= -180 && Number(coordinates?.lng) <= 180;
}

export function stopDistanceMeters(left: StopCoordinates, right: StopCoordinates) {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const latDelta = radians(right.lat - left.lat);
  const lngDelta = radians(right.lng - left.lng);
  const value = Math.sin(latDelta / 2) ** 2 +
    Math.cos(radians(left.lat)) * Math.cos(radians(right.lat)) *
    Math.sin(lngDelta / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}
