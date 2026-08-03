import type { BoardingLocationType } from "./boardingLocationTypes";
import { isGooglePlusCode, normalizeGooglePlaceAddress } from "@/lib/googlePlaceFormatting";

type GooglePlaceDetails = {
  name?: string;
  formatted_address?: string;
  address_components?: google.maps.GeocoderAddressComponent[];
  types?: string[];
};

const NAME_COMPONENTS = [
  "premise", "establishment", "point_of_interest", "bus_station",
  "transit_station", "neighborhood", "sublocality", "locality", "route",
];

export function getSuggestedPlaceName(place?: GooglePlaceDetails) {
  if (place?.name?.trim() && !isGooglePlusCode(place.name)) return place.name.trim();
  const component = place?.address_components?.find((item) =>
    NAME_COMPONENTS.some((type) => item.types.includes(type)),
  );
  return component?.long_name?.trim()
    || normalizeGooglePlaceAddress(place)?.split(",")[0]?.trim()
    || undefined;
}

export function getSuggestedLocationType(types: string[] = []): BoardingLocationType {
  if (types.includes("bus_station") || types.includes("transit_station")) return "BUS_PARK";
  if (types.includes("parking")) return "BUS_BAY";
  if (types.includes("establishment") || types.includes("point_of_interest")) return "LANDMARK";
  return "ROADSIDE";
}
