import { api } from "./axios";

export const getAllSeatsTemplate = async () => {
    try {
        const { data } = await api.get("/templates/all");
        return data;
    } catch (error) {
        console.error("Error fetching all seat templates:", error);
        throw error;
    }
};

export const createTemplateForOwner = async (payload: {
    templateName: string;
    aCount: string;
    bCount: string;
    cCount: string;
    userId: string;
}) => {
    try {
        const { data } = await api.post("/templates/create", payload);
        return data;
    } catch (error) {
        console.error("Error creating seat template:", error);
        throw error;
    }
};

export const getTemplatesByUser = async (userId: string) => {
    try {
        const { data } = await api.get(`/templates/user/${userId}`);
        return data;
    } catch (error) {
        console.error("Error fetching seat templates for user:", error);
        throw error;
    }
};

export const getSeatTemplateById = async (id: string) => {
    try {
        const { data } = await api.get(`/templates/${id}`);
        return data;
    } catch (error) {
        console.error("Error fetching seat template by id:", error);
        throw error;
    }
};

export const updateSeatTemplate = async (id: string, payload: {
    templateName: string;
    aCount: string;
    bCount: string;
    cCount: string;
}) => {
    try {
        const { data } = await api.patch(`/templates/${id}`, payload);
        return data;
    } catch (error) {
        console.error("Error updating seat template:", error);
        throw error;
    }
};

export const deleteSeatTemplateStatus = async (id: string) => {
    try {
        const { data } = await api.delete(`/templates/${id}`);
        return data;
    } catch (error) {
        console.error("Error deleting seat template:", error);
        throw error;
    }
};

export const toggleSeatTemplateStatus = async (id: string) => {
    try {
        const { data } = await api.patch(`/templates/toggleStatus/${id}`);
        return data;
    } catch (error) {
        console.error("Error toggling seat template status:", error);
        throw error;
    }
};
