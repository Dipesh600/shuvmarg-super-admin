import { api } from "./axios";
import type { DocumentBlobResult } from "./kycApi";

export type SecureFleetDocumentRequest = {
    fleetId: string;
    slot: "fleetImages" | "fitnessCert" | "insurance" | "bluebook" | "routePermit";
    imageIndex?: number;
};

export interface OwnerFleetOption {
    _id: string;
    busName: string;
    busNumber: string;
}

type OwnerFleetListResponse = { success: boolean; data: OwnerFleetOption[] };

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

export const uploadFleetDocumentByAdmin = async (
    fleetId: string,
    slot: SecureFleetDocumentRequest["slot"],
    files: Record<string, File>,
    metadata: Record<string, string> = {},
) => {
    const payload = new FormData();
    Object.entries(files).forEach(([field, file]) => payload.append(field, file));
    Object.entries(metadata).forEach(([field, value]) => {
        if (value) payload.append(field, value);
    });
    const { data } = await api.put(`/fleet/${fleetId}/documents/${slot}`, payload, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
};

export const notifyAdminCreatedFleet = async (fleetId: string) => {
    const { data } = await api.post<{
        success: true;
        notification: { status: "DELIVERED" | "FAILED" | "PROCESSING"; alreadyDelivered: boolean };
    }>(`/fleet/${fleetId}/notify-created`);
    return data;
};

export const getFleetsByOwner = async (ownerId: string, brandId?: string) => {
    try {
        const url = brandId ? `/fleet/owner/${ownerId}?brandId=${brandId}` : `/fleet/owner/${ownerId}`;
        const { data } = await api.get<OwnerFleetListResponse>(url);
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

export type FleetApprovalDecision = {
    fleetId: string;
    status: "APPROVED" | "REJECTED";
    rejectionReason?: string;
    reviews: Record<string, { status: "APPROVED" | "REJECTED"; reason?: string | null }>;
};

export const decideFleetApproval = async (decision: FleetApprovalDecision) => {
    const { data } = await api.patch("/fleet/update-status", decision);
    return data;
};

export const saveFleetReviewItem = async (
    fleetId: string,
    key: string,
    review: { status: "APPROVED" | "REJECTED"; reason?: string | null },
) => {
    const { data } = await api.patch(`/fleet/${fleetId}/reviews/${key}`, review);
    return data;
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

export const reuploadFleetDocument = async (id: string, docSlot: string, files: File[]) => {
    try {
        const slot = docSlot as SecureFleetDocumentRequest["slot"];
        if (slot === "fleetImages") {
            if (files.length !== 4) throw new Error("Select four photos in this order: front, side, back, inside.");
            return uploadFleetDocumentByAdmin(id, slot, {
                imageFront: files[0], imageSide: files[1], imageBack: files[2], imageInside: files[3],
            }, { changeReason: "Replacing rejected fleet photos" });
        }
        return uploadFleetDocumentByAdmin(id, slot, { [slot]: files[0] }, {
            changeReason: "Replacing rejected fleet document",
        });
    } catch (error) {
        console.error("Error reuploading fleet document:", error);
        throw error;
    }
};

export type FleetSetupStepKey =
    | "routeAssigned"
    | "routeConfigured"
    | "driverAssigned"
    | "scheduleCreated"
    | "activated";

export interface FleetSetupStatus {
    steps: Record<FleetSetupStepKey, boolean>;
    scheduleId?: string | null;
    isFullyOperational?: boolean;
    assignedCorridor?: {
        _id?: string;
        code?: string;
        originId?: { name?: string };
        destinationId?: { name?: string };
    } | null;
    assignedRouteConfigs?: Array<{
        _id: string;
        variantId?: { direction?: "FORWARD" | "RETURN" };
        activeStops?: unknown[];
    }>;
    assignedDriver?: { fullName?: string; licenseType?: string } | null;
    fleetData?: { busNumber?: string } | null;
    outboundScheduleData?: {
        variantId?: { direction?: "FORWARD" | "RETURN" };
        status?: string;
        departureTime?: string;
        arrivalTime?: string;
        operationalModel?: string;
    } | null;
    returnScheduleData?: {
        departureTime?: string;
        arrivalTime?: string;
    } | null;
}

export const getFleetSetupStatus = async (id: string): Promise<{ success: boolean; data: FleetSetupStatus }> => {
    const { data } = await api.get(`/fleet/${id}/setup-status`);
    return data;
};
