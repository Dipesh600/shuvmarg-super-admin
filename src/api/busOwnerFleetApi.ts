import { api } from "./axios";
import type { DocumentBlobResult } from "./kycApi";
import type { SeatLayoutV3 } from "@/features/seat-layout-v3/types";

export type SecureFleetDocumentRequest = {
    fleetId: string;
    slot: "fleetImages" | "fitnessCert" | "insurance" | "bluebook" | "routePermit";
    imageIndex?: number;
};

export interface OwnerFleetOption {
    _id: string;
    fleetId: string;
    busName: string;
    busNumber: string;
    busType: string;
    totalSeats: number;
    seatLayout?: string | { assigned?: boolean; totalPlaces?: number; layout?: unknown };
    registrationYear?: number;
    status: string;
    approvalStatus: string;
    setupComplete?: boolean;
}

export interface FleetAmenity {
    _id?: string;
    id?: string;
    name: string;
    description?: string;
    status?: boolean;
}

export interface FleetDocumentDescriptor {
    present: boolean;
    status?: string;
    reason?: string | null;
    validTill?: string | null;
    policyNumber?: string | null;
    uploadedAt?: string | null;
    count?: number;
}

export interface FleetDetail {
    _id?: string;
    fleetId: string;
    fleetCode?: string | null;
    status: string;
    approvalStatus: string;
    setupComplete?: boolean;
    owner: { ownerId: string; ownerCode?: string | null; companyName?: string; ownerName?: string; phone?: string; email?: string };
    assignment: {
        route?: string;
        operatorId?: string | null;
        operatorName?: string | null;
        corridor?: { corridorId: string; code?: string | null; origin?: string | null; destination?: string | null; status?: string | null } | null;
        routeRequest?: { routeRequestId: string; origin?: string | null; destination?: string | null; viaStops?: string[]; status?: string | null } | null;
    };
    vehicle: {
        busName: string;
        busNumber: string;
        busType: string;
        vehicleType?: string;
        totalSeats: number;
        registrationYear?: number | null;
        seatConfig?: SeatLayoutV3;
        features: FleetAmenity[];
    };
    documents?: Record<string, FleetDocumentDescriptor | undefined>;
    reviewRequirements?: Record<string, { status?: string; reason?: string | null }>;
    rejectionReason?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
    route?: {
        origin?: string | null;
        destination?: string | null;
        returnEnabled?: boolean;
        servedStops: Array<{
            stopId?: string | null;
            name?: string;
            usage?: string;
            meetingDetails?: { counterNumber?: string; contactPhone?: string };
        }>;
        addedPlaces: Array<{ clientKey?: string; name?: string; address?: string; usage?: string }>;
    } | null;
    seatLayout?: { assigned?: boolean; totalPlaces?: number; layout?: SeatLayoutV3 };
    review?: {
        approvedAt?: string | null;
        rejectedAt?: string | null;
        submittedAt?: string | null;
        rejectionReason?: string | null;
    };
}

export type FleetDetailResponse = { success: boolean; data: FleetDetail };

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
        const { data } = await api.get<FleetDetailResponse>(`/fleet/details/${id}`);
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
    fleetId?: string;
    brandId?: string | null;
    busName?: string;
    busNumber?: string;
    approvalStatus?: string;
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

export interface AdminFleetRouteSetupPayload {
    brandId: string;
    originStopId: string;
    destinationStopId: string;
    corridorId: string;
    variantId: string;
    direction: "FORWARD" | "RETURN";
    servedStops: Array<{
        stopId: string;
        sequence: number;
        usage: "PICKUP" | "DROP" | "BOTH";
        boardingMode: "STOP_FALLBACK";
        boardingLocationIds: string[];
        customBoardingPoints: [];
    }>;
    returnEnabled: boolean;
    resolutionStatus: "AVAILABLE";
    unresolvedPlaces: [];
}

export const saveFleetRouteSetupByAdmin = async (fleetId: string, payload: AdminFleetRouteSetupPayload) => {
    const { data } = await api.put(`/fleet/${fleetId}/route-setup`, payload);
    return data;
};
