import { api } from "./axios";

export const createFleetForOwner = async (payload: FormData) => {
    try {
        const { data } = await api.post("/fleet/createForOwner", payload, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return data;
    } catch (error) {
        console.error("Error creating fleet processing multipart data:", error);
        throw error;
    }
};

export const getFleetsByOwner = async (ownerId: string, brandId?: string) => {
    try {
        const url = brandId ? `/fleet/owner/${ownerId}?brandId=${brandId}` : `/fleet/owner/${ownerId}`;
        const { data } = await api.get(url);
        return data;
    } catch (error) {
        console.error("Error fetching fleets by owner:", error);
        throw error;
    }
};

export const getFleetDetailById = async (id: string) => {
    try {
        const { data } = await api.get(`/fleet/details/${id}`);
        return data;
    } catch (error) {
        console.error("Error fetching fleet detail by id:", error);
        throw error;
    }
};

export const updateFleetByAdmin = async (id: string, payload: FormData) => {
    try {
        const { data } = await api.patch(`/fleet/update/${id}`, payload, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return data;
    } catch (error) {
        console.error("Error updating fleet with multipart data:", error);
        throw error;
    }
};

export const deleteFleetByAdmin = async (id: string) => {
    try {
        const { data } = await api.delete(`/fleet/delete/${id}`);
        return data;
    } catch (error) {
        console.error("Error deleting fleet:", error);
        throw error;
    }
};

export const resubmitFleetById = async (id: string) => {
    try {
        const { data } = await api.patch(`/fleet/resubmit/${id}`);
        return data;
    } catch (error) {
        console.error("Error resubmitting fleet:", error);
        throw error;
    }
};

export const reuploadFleetDocument = async (id: string, docSlot: string, file: File) => {
    try {
        const fd = new FormData();
        fd.append("docSlot", docSlot);
        fd.append(docSlot, file);
        const { data } = await api.patch(`/fleet/reupload-doc/${id}`, fd, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return data;
    } catch (error) {
        console.error("Error reuploading fleet document:", error);
        throw error;
    }
};

export const getFleetSetupStatus = async (id: string) => {
    const { data } = await api.get(`/fleet/${id}/setup-status`);
    return data;
};