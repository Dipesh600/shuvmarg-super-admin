import { api } from "./axios";

export interface BoardingPointLocationInput {
    pointName: string;
    landmark: string;
    time: string;
    contactNumber: string;
}

export interface BoardingPointPayload {
    city: string;
    description?: string;
    ownerId?: string;
    status?: boolean;
    boardingPoints: BoardingPointLocationInput[];
}

export interface BoardingPointGroup extends BoardingPointPayload {
    _id: string;
    createdAt: string;
}

type BoardingPointResponse = { data: BoardingPointGroup };
type BoardingPointListResponse = { data: BoardingPointGroup[] };

export const createBoardingPoint = async (payload: BoardingPointPayload) => {
    try {
        const { data } = await api.post("/boardingPoints/create", payload);
        return data;
    } catch (error) {
        console.error("Error creating boarding point:", error);
        throw error;
    }
};

export const getPointsByCity = async (city: string, ownerId?: string, type?: string) => {
    try {
        const params = new URLSearchParams();
        if (ownerId) params.append("ownerId", ownerId);
        if (type) params.append("type", type);
        
        const { data } = await api.get<BoardingPointListResponse>(`/boardingPoints/city/${city}?${params.toString()}`);
        return data;
    } catch (error) {
        console.error("Error fetching boarding points by city:", error);
        throw error;
    }
};

export const getBoardingPointsByOwner = async (ownerId: string) => {
    try {
        const { data } = await api.get<BoardingPointListResponse>(`/boardingPoints/owner/${ownerId}`);
        return data;
    } catch (error) {
        console.error("Error fetching boarding points by owner:", error);
        throw error;
    }
};

export const getBoardingPointById = async (id: string) => {
    try {
        const { data } = await api.get<BoardingPointResponse>(`/boardingPoints/${id}`);
        return data;
    } catch (error) {
        console.error("Error fetching boarding point by id:", error);
        throw error;
    }
};

export const updateBoardingPoint = async (id: string, payload: BoardingPointPayload) => {
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
