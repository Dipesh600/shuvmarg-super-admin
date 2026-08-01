import { api } from "@/api/axios";
import type { BoardingCoordinates, BoardingLocation } from "./boardingLocationTypes";

type LocationPayload = {
  stopId: string;
  name: string;
  aliases: string[];
  landmark: string | null;
  address: string | null;
  coordinates: BoardingCoordinates;
  verificationStatus: string;
  status: string;
};

export async function listBoardingLocations(stopId: string) {
  const response = await api.get("/registry/boarding-locations", {
    params: { stopId },
  });
  return response.data.data as BoardingLocation[];
}

export async function createBoardingLocation(payload: LocationPayload) {
  const response = await api.post("/registry/boarding-locations", payload);
  return response.data.data as {
    location: BoardingLocation;
    nearbyWarnings: BoardingLocation[];
  };
}

export async function updateBoardingLocation(
  id: string,
  payload: Partial<LocationPayload>,
) {
  const response = await api.patch(`/registry/boarding-locations/${id}`, payload);
  return response.data.data as BoardingLocation;
}

export async function deactivateBoardingLocation(id: string) {
  const response = await api.patch(
    `/registry/boarding-locations/${id}/deactivate`,
  );
  return response.data.data as BoardingLocation;
}

export async function findNearbyBoardingLocations(
  stopId: string,
  coordinates: BoardingCoordinates,
  excludeId?: string,
) {
  const response = await api.get("/registry/boarding-locations/nearby", {
    params: {
      stopId, lat: coordinates.lat, lng: coordinates.lng, excludeId,
    },
  });
  return response.data.data as BoardingLocation[];
}
