import { api } from "./axios";

export const createBusRoute = async (payload: any) => {
    try {
        const { data } = await api.post("/busRoutes/create", payload);
        return data;
    } catch (error) {
        console.error("Error creating bus route:", error);
        throw error;
    }
};

export const getBusRoutesByOwner = async (ownerId: string) => {
    try {
        const { data } = await api.get(`/busRoutes/owner/${ownerId}`);
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

export const updateBusRoute = async (id: string, payload: any) => {
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