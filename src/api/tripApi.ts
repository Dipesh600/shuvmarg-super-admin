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
