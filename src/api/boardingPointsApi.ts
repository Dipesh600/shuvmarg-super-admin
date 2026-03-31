import { api } from "./axios";

export const createBoardingPoint = async (payload: any) => {
    try {
        const { data } = await api.post("/boardingPoints/create", payload);
        return data;
    } catch (error) {
        console.error("Error creating boarding point:", error);
        throw error;
    }
};

export const getBoardingPointsByOwner = async (ownerId: string) => {
    try {
        const { data } = await api.get(`/boardingPoints/owner/${ownerId}`);
        return data;
    } catch (error) {
        console.error("Error fetching boarding points by owner:", error);
        throw error;
    }
};

export const getBoardingPointById = async (id: string) => {
    try {
        const { data } = await api.get(`/boardingPoints/${id}`);
        return data;
    } catch (error) {
        console.error("Error fetching boarding point by id:", error);
        throw error;
    }
};

export const updateBoardingPoint = async (id: string, payload: any) => {
    try {
        const { data } = await api.patch(`/boardingPoints/${id}`, payload);
        return data;
    } catch (error) {
        console.error("Error updating boarding point:", error);
        throw error;
    }
};

export const deleteBoardingPoint = async (id: string) => {
    try {
        const { data } = await api.delete(`/boardingPoints/${id}`);
        return data;
    } catch (error) {
        console.error("Error deleting boarding point:", error);
        throw error;
    }
};
