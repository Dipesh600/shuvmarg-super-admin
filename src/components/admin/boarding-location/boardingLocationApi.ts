import { api } from "@/api/axios";
import type { BoardingAssignmentReview, BoardingCoordinates, BoardingLocation } from "./boardingLocationTypes";

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

export async function listBoardingAssignmentReviews(status = "PENDING_REVIEW") {
  const response = await api.get("/registry/operator-boarding-assignments", {
    params: { status },
  });
  return response.data.data as BoardingAssignmentReview[];
}

export async function reviewBoardingAssignment(
  id: string, status: "ACTIVE" | "REJECTED", rejectionReason?: string,
) {
  const response = await api.patch(
    `/registry/operator-boarding-assignments/${id}/review`,
    { status, rejectionReason },
  );
  return response.data.data as BoardingAssignmentReview;
}
