import { api } from "./axios";

export const createAmenity = async (payload: any) => {
    try {
        const { data } = await api.post("/amenities/create", payload);
        return data;
    } catch (error) {
        console.error("Error creating amenity:", error);
        throw error;
    }
};

export const getAmenitiesByOwner = async (ownerId: string) => {
    try {
        const { data } = await api.get(`/amenities/owner/${ownerId}`);
        return data;
    } catch (error) {
        console.error("Error fetching amenities by owner:", error);
        throw error;
    }
};

export const getAmenityById = async (id: string) => {
    try {
        const { data } = await api.get(`/amenities/${id}`);
        return data;
    } catch (error) {
        console.error("Error fetching amenity by id:", error);
        throw error;
    }
};

export const updateAmenity = async (id: string, payload: any) => {
    try {
        const { data } = await api.patch(`/amenities/${id}`, payload);
        return data;
    } catch (error) {
        console.error("Error updating amenity:", error);
        throw error;
    }
};

export const deleteAmenity = async (id: string) => {
    try {
        const { data } = await api.delete(`/amenities/${id}`);
        return data;
    } catch (error) {
        console.error("Error deleting amenity:", error);
        throw error;
    }
};
