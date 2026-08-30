import { api } from "./axios";

export interface BusRouteStopInput {
    name: string;
    estimatedMinutes: number;
    fareOffset: number;
}

export interface BusRoutePayload {
    routeName: string;
    from: string;
    to: string;
    distance: string;
    duration: string;
    basePrice: number;
    isRoundTrip: boolean;
    returnRouteId: string | null;
    ownerId?: string;
    status?: "ACTIVE" | "INACTIVE";
    stops?: BusRouteStopInput[];
}

export interface BusRouteRecord extends BusRoutePayload {
    _id: string;
}

type BusRouteListResponse = { success?: boolean; data: BusRouteRecord[] };

export const createBusRoute = async (payload: BusRoutePayload) => {
    try {
        const { data } = await api.post("/busRoutes/create", payload);
        return data;
    } catch (error) {
        console.error("Error creating bus route:", error);
        throw error;
    }
};

export const createGlobalRoute = async (payload: Record<string, unknown>) => {
    try {
        const { data } = await api.post("/busRoutes/createGlobal", payload);
        return data;
    } catch (error) {
        console.error("Error creating global route:", error);
        throw error;
    }
};

export const getGlobalRoutes = async () => {
    try {
        const { data } = await api.get("/busRoutes/global");
        return data;
    } catch (error) {
        console.error("Error fetching global routes:", error);
        throw error;
    }
};

export const getBusRoutesByOwner = async (ownerId: string) => {
    try {
        const { data } = await api.get<BusRouteListResponse>(`/busRoutes/owner/${ownerId}`);
        return data;
    } catch (error) {
        console.error("Error fetching bus routes by owner:", error);
        throw error;
    }
};

export const getBusRouteById = async (id: string) => {
    try {
        const { data } = await api.get(`/busRoutes/${id}`);
        return data;
    } catch (error) {
        console.error("Error fetching bus route by id:", error);
        throw error;
    }
};

export const updateBusRoute = async (id: string, payload: BusRoutePayload) => {
    try {
        // According to the user, the backend uses patch
        const { data } = await api.patch(`/busRoutes/${id}`, payload);
        return data;
    } catch (error) {
        console.error("Error updating bus route:", error);
        throw error;
    }
};

export const deleteBusRoute = async (id: string) => {
    try {
        const { data } = await api.delete(`/busRoutes/${id}`);
        return data;
    } catch (error) {
        console.error("Error deleting bus route:", error);
        throw error;
    }
};
