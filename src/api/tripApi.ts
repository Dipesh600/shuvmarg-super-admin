import { api } from "./axios";

export const createTripForOwner = async (payload: {
  busId: string;
  routeId: string;
  seatTemplateId: string;
  tripDate: string;
  departureTime: string;
  arrivalTime: string;
  shift: string;
  tripFare: number;
  recurrence: string;
  autoGenerateUntil: string;
  ownerId: string;
}) => {
    try {
        const { data } = await api.post("/trips/create", payload);
        return data;
    } catch (error) {
        console.error("Error creating trip:", error);
        throw error;
    }
};

export const getTripsByOwner = async (ownerId: string) => {
    try {
        const { data } = await api.get(`/trips/owner/${ownerId}`);
        return data;
    } catch (error) {
        console.error("Error fetching trips for owner:", error);
        throw error;
    }
};

export const getTripById = async (id: string) => {
    try {
        const { data } = await api.get(`/trips/details/${id}`);
        return data;
    } catch (error) {
        console.error("Error fetching trip details:", error);
        throw error;
    }
};

export const updateTripByAdmin = async (id: string, payload: {
  busId?: string;
  routeId?: string;
  seatTemplateId?: string;
  tripDate?: string;
  departureTime?: string;
  arrivalTime?: string;
  shift?: string;
  tripFare?: number;
  recurrence?: string;
  autoGenerateUntil?: string;
}) => {
    try {
        const { data } = await api.patch(`/trips/update/${id}`, payload);
        return data;
    } catch (error) {
        console.error("Error updating trip:", error);
        throw error;
    }
};

export const deleteTripByAdmin = async (id: string) => {
    try {
        const { data } = await api.delete(`/trips/delete/${id}`);
        return data;
    } catch (error) {
        console.error("Error deleting trip:", error);
        throw error;
    }
};

// ── Types for trip management view ────────────────────────────────────────

export type TripStatus = "scheduled" | "boarding" | "in_transit" | "completed" | "cancelled";

export interface AdminTrip {
  _id: string;
  tripDate: string;
  departureTime: string;
  arrivalTime?: string;
  tripFare?: number;
  status: TripStatus;
  isActive: boolean;
  routeId?: { _id: string; routeName?: string; from?: string; to?: string };
  busId?:   { _id: string; busNumber?: string; busName?: string };
  ownerId?: { _id: string; name?: string; email?: string };
  createdAt: string;
}

export interface TripListResponse {
  trips: AdminTrip[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

// ── New endpoints ─────────────────────────────────────────────────────────

export const getAllTrips = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
  date?: string;
}): Promise<TripListResponse> => {
  try {
    const { data } = await api.get("/trips/all", { params });
    return data.data;
  } catch (error) {
    console.error("Error fetching all trips:", error);
    throw error;
  }
};

export const updateTripStatus = async (
  tripId: string,
  status: TripStatus
): Promise<AdminTrip> => {
  try {
    const { data } = await api.patch(`/trips/status/${tripId}`, { status });
    return data.data;
  } catch (error) {
    console.error("Error updating trip status:", error);
    throw error;
  }
};

