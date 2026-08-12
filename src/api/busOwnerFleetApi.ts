import { api } from "./axios";
import type { DocumentBlobResult } from "./kycApi";

export type SecureFleetDocumentRequest = {
    fleetId: string;
    slot: "fleetImages" | "fitnessCert" | "insurance" | "bluebook" | "routePermit";
    imageIndex?: number;
};

export const fetchFleetDocumentAsBlob = async (
    request: SecureFleetDocumentRequest,
): Promise<DocumentBlobResult> => {
    try {
        const token = sessionStorage.getItem("sumarg_admin_token");
        const baseUrl = import.meta.env.VITE_API_URL;
        const params = new URLSearchParams();
        if (request.imageIndex !== undefined) params.set("imageIndex", String(request.imageIndex));
        const suffix = params.size > 0 ? `?${params}` : "";
        const response = await fetch(
            `${baseUrl}/api/admin/fleet/${encodeURIComponent(request.fleetId)}/documents/${encodeURIComponent(request.slot)}/view${suffix}`,
            { headers: { Authorization: `Bearer ${token}` } },
        );
        if (!response.ok) {
            const errorBody = await response.json().catch(() => null);
            return { error: errorBody?.message || `Failed to load fleet document (HTTP ${response.status})` };
        }
        const mimeType = response.headers.get("Content-Type") ?? "application/octet-stream";
        const blob = await response.blob();
        return { blobUrl: URL.createObjectURL(blob), mimeType };
    } catch (error: unknown) {
        return { error: error instanceof Error ? error.message : "Failed to load fleet document." };
    }
};

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

export type FleetDocumentReviewPayload = Record<
    "fleetImages" | "fitnessCert" | "insurance" | "bluebook" | "routePermit",
    { status: "approved" | "rejected" | "pending"; reason: string | null }
>;

export const updateFleetApprovalStatus = async (payload: {
    fleetId: string;
    status: "APPROVED" | "REJECTED";
    rejectionReason?: string;
    documentReviews?: Partial<FleetDocumentReviewPayload>;
}) => {
    const { data } = await api.patch("/fleet/update-status", payload);
    return data;
};

export const getFleetSetupStatus = async (id: string) => {
    const { data } = await api.get(`/fleet/${id}/setup-status`);
    return data;
};

export type SeatLayoutRevisionRecord = {
    _id: string;
    fleetId: string | { _id: string; busName: string; busNumber: string };
    status: string;
    classification: string;
    proposedSeatConfig: Record<string, unknown>;
    addedSeatLabels: string[];
    removedSeatLabels: string[];
    effectiveAt: string | null;
    reason?: string | null;
    createdAt: string;
};

export const getPendingSeatLayoutRevisions = async () => {
    const { data } = await api.get("/fleet/seat-layout-revisions");
    return (data?.data?.revisions || []) as SeatLayoutRevisionRecord[];
};

export const decideSeatLayoutRevision = async (payload: {
    revisionId: string;
    decision: "APPROVE" | "REJECT";
    effectiveAt?: string;
    rejectionReason?: string;
}) => {
    const { revisionId, ...body } = payload;
    const { data } = await api.patch(`/fleet/seat-layout-revisions/${revisionId}`, body);
    return data;
};
