import { api } from "./axios";

export type RegistryCorridor = { _id: string; code?: string; status?: string; originId?: { name?: string }; destinationId?: { name?: string } };
export type RouteRequestRecord = {
    _id: string;
    originCity?: string;
    destinationCity?: string;
    viaStops?: string[];
    status: string;
    createdAt?: string;
    resolvedAt?: string;
    rejectionReason?: string;
    adminNotes?: string;
    resolvedBy?: { name?: string };
    ownerId?: { name?: string; phone?: string };
    brandId?: { brandName?: string; brandCode?: string };
    fleetId?: { busName?: string; busNumber?: string; approvalStatus?: string; corridorId?: RegistryCorridor };
};
export type RouteRequestReviewPayload = {
    action: "APPROVE" | "REJECT";
    corridorId?: string;
    createCorridor?: boolean;
    originCode?: string;
    destinationCode?: string;
    rejectionReason?: string;
    adminNotes?: string;
};

// ── Stop Registry (Layer 3 — The foundation) ─────────────────────────────────

export const createStop = async (payload: { 
    code?: string; 
    name: string; 
    type?: string; 
    province?: string; 
    district?: string; 
    municipality?: string; 
    status?: string; 
    aliases?: string[];
    isSearchable?: boolean;
    isRouteStop?: boolean;
    parentStopId?: string | null;
    coordinates?: { lat: number; lng: number };
    coordinateSource?: "GOOGLE_PLACE" | "MAP_PIN" | "ADMIN_GPS" | "DISCOVERY";
    coordinateAccuracyMeters?: number | null;
    coordinateCapturedAt?: string;
    coordinateProvider?: "GOOGLE" | "MAPBOX" | null;
    coordinatePlaceId?: string | null;
    coordinateSuggestedAddress?: string | null;
}) => {
    const { data } = await api.post("/registry/stops", payload);
    return data;
};

export const getAllStops = async () => {
    const { data } = await api.get("/registry/stops");
    return data;
};

export const searchStops = async (q: string) => {
    const { data } = await api.get("/registry/stops/search", { params: { q } });
    return data;
};

export type BulkStopEntry = {
    code?: string;
    name: string;
    type?: string;
    province?: string;
    district?: string;
    municipality?: string;
    aliases?: string | string[];
    coordinates?: { lat: number; lng: number };

};

/** Dry-run scan — checks for duplicates. Does NOT write anything. */
export const previewBulkStops = async (stops: BulkStopEntry[]) => {
    const { data } = await api.post("/registry/stops/bulk-preview", stops);
    return data;
};

/** Performs the actual import. Server re-sanitizes and re-checks before writing. */
export const bulkImportStops = async (stops: BulkStopEntry[]) => {
    const { data } = await api.post("/registry/stops/bulk-import", stops);
    return data;
};

// ── Route Corridors (Layer 1) ──────────────────────────────────────────────────

export const createCorridor = async (payload: {
    originCode: string;
    destinationCode: string;
    isSymmetric?: boolean;
    notes?: string;
}) => {
    const { data } = await api.post("/registry/corridors", payload);
    return data;
};

export const getAllCorridors = async () => {
    const { data } = await api.get<{ data: RegistryCorridor[] }>("/registry/corridors");
    return data;
};

// ── Route Variants (Layer 2) ───────────────────────────────────────────────────

export const createVariant = async (payload: {
    corridorId: string;
    name: string;
    type?: string;
    distanceKm?: number;
    durationMinutes?: number;
    autoGenerateReturn?: boolean;
}) => {
    const { data } = await api.post("/registry/variants", payload);
    return data;
};

export const getVariantsByCorridor = async (corridorId: string) => {
    const { data } = await api.get(`/registry/corridors/${corridorId}/variants`);
    return data;
};

// ── Route Stop Mapping (Layer 4) ───────────────────────────────────────────────

export const setVariantStops = async (variantId: string, stops: Array<{
    stopCode: string;
    sequence: number;
    isMajor?: boolean;
    estimatedMinutesFromOrigin?: number;
}>) => {
    const { data } = await api.put(`/registry/variants/${variantId}/stops`, { stops });
    return data;
};

export const getStopsForVariant = async (variantId: string) => {
    const { data } = await api.get(`/registry/variants/${variantId}/stops`);
    return data;
};

// ── CRUD: Update & Delete ──────────────────────────────────────────────────────

export const updateStop = async (id: string, payload: {
    name?: string;
    type?: string;
    province?: string | null;
    district?: string | null;
    municipality?: string | null;
    aliases?: string[];
    coordinates?: { lat: number; lng: number };
    coordinateSource?: "GOOGLE_PLACE" | "MAP_PIN" | "ADMIN_GPS" | "DISCOVERY";
    coordinateAccuracyMeters?: number | null;
    coordinateCapturedAt?: string;
    coordinateProvider?: "GOOGLE" | "MAPBOX" | null;
    coordinatePlaceId?: string | null;
    coordinateSuggestedAddress?: string | null;
    status?: string;
    isSearchable?: boolean;
    isRouteStop?: boolean;
    parentStopId?: string | null;
}) => {
    const { data } = await api.patch(`/registry/stops/${id}`, payload);
    return data;
};

export const deleteStop = async (id: string) => {
    const { data } = await api.delete(`/registry/stops/${id}`);
    return data;
};

export const updateCorridor = async (id: string, payload: { notes?: string; isSymmetric?: boolean; status?: string }) => {
    const { data } = await api.patch(`/registry/corridors/${id}`, payload);
    return data;
};

export const deleteCorridor = async (id: string) => {
    const { data } = await api.delete(`/registry/corridors/${id}`);
    return data;
};

export const updateVariant = async (id: string, payload: { name?: string; type?: string; distanceKm?: number; durationMinutes?: number }) => {
    const { data } = await api.patch(`/registry/variants/${id}`, payload);
    return data;
};

export const deleteVariant = async (id: string) => {
    const { data } = await api.delete(`/registry/variants/${id}`);
    return data;
};

// ── Operator Route Config ──────────────────────────────────────────────────────

type ApiListResponse<T> = { success: boolean; results: number; data: T[] };
type ApiItemResponse<T> = { success: boolean; data: T };

export type OperatorStopBehavior = "BOARDING_ONLY" | "DROPPING_ONLY" | "BOTH" | "REST_STOP";

export interface OperatorBoardingPoint {
    _id: string;
    name?: string;
    landmark?: string;
}

export interface OperatorRouteTiming {
    stopId: string;
    estimatedArrival: string;
    estimatedDeparture?: string;
    haltDuration?: number;
    dayOffset: number;
    stopBehavior: OperatorStopBehavior;
}

export interface OperatorBoardingConfig {
    stopId: string;
    boardingPointIds: string[];
}

export interface OperatorRouteStop {
    _id: string;
    sequence?: number;
    stopId: { _id: string; name?: string; code?: string; type?: string };
    isActive: boolean;
    boardingPoints?: OperatorBoardingPoint[];
    timing?: OperatorRouteTiming | null;
}

export interface AvailableOperatorVariant {
    _id: string;
    name: string;
    direction?: string;
    patternCount: number;
    corridorId?: {
        _id?: string;
        originId?: { name?: string };
        destinationId?: { name?: string };
    };
}

export interface OperatorRouteConfigEdit {
    _id: string;
    patternName?: string;
    status?: string;
    fleetId?: string | null;
    returnOverridden?: boolean;
    variantId?: { _id: string; name?: string };
}

export interface OperatorRouteConfigPayload {
    activeStops: string[];
    boardingConfig: OperatorBoardingConfig[];
    timingConfig: OperatorRouteTiming[];
    returnActiveStops?: string[];
    returnBoardingConfig?: OperatorBoardingConfig[];
    returnTimingConfig?: OperatorRouteTiming[];
    returnOverridden?: boolean;
}

export interface CreateOperatorRouteConfigPayload extends OperatorRouteConfigPayload {
    brandId: string;
    variantId: string;
    patternName: string;
    fleetId?: string;
    status?: "ACTIVE" | "DRAFT";
}

export type UpdateOperatorRouteConfigPayload = Partial<OperatorRouteConfigPayload> & {
    notes?: string;
    patternName?: string;
    fleetId?: string;
    status?: "ACTIVE" | "DRAFT";
};

export interface ReturnVariantStopsResult {
    hasReturnVariant: boolean;
    stops: OperatorRouteStop[];
    returnOverridden: boolean;
    returnVariantId?: string;
    configId?: string | null;
}

// Get all available variants an operator can choose from
export const getAvailableVariants = async (brandId?: string, fleetId?: string, corridorId?: string) => {
    const params = { ...(brandId ? { brandId } : {}), ...(fleetId ? { fleetId } : {}), ...(corridorId ? { corridorId } : {}) };
    const { data } = await api.get<ApiListResponse<AvailableOperatorVariant>>("/operator-config/variants", { params });
    return data;
};

// Get all service configs for a specific brand
export const getOperatorConfigs = async (brandId: string, fleetId?: string) => {
    const { data } = await api.get(`/operator-config/${brandId}`, { params: fleetId ? { fleetId } : {} });
    return data;
};

// Get variant stops with brand's current selection state (configId for pattern precision)
export const getVariantStopsWithConfig = async (brandId: string, variantId: string, configId?: string, fleetId?: string) => {
    const params = { ...(configId ? { configId } : {}), ...(fleetId ? { fleetId } : {}) };
    const { data } = await api.get<ApiListResponse<OperatorRouteStop>>(`/operator-config/${brandId}/variant/${variantId}/stops`, { params });
    return data;
};

// Get RETURN direction stops for a forward variant — powers the Return tab in RouteConfigModal
export const getReturnVariantStops = async (brandId: string, variantId: string, configId?: string, fleetId?: string) => {
    const params = { ...(configId ? { configId } : {}), ...(fleetId ? { fleetId } : {}) };
    const { data } = await api.get<ApiItemResponse<ReturnVariantStopsResult>>(`/operator-config/${brandId}/variant/${variantId}/return-stops`, { params });
    return data;
};

// List all named patterns for a variant — powers the schedule creation dropdown
export const listPatternsForVariant = async (brandId: string, variantId: string) => {
    const { data } = await api.get(`/operator-config/${brandId}/variant/${variantId}/patterns`);
    return data;
};

// Save brand's service configuration for a named pattern on a variant
export const upsertOperatorConfig = async (payload: CreateOperatorRouteConfigPayload) => {
    const { data } = await api.post("/operator-config", payload);
    return data;
};

// Update stops/timing on an existing config (blocked if ACTIVE schedules exist)
export const updateConfig = async (configId: string, payload: UpdateOperatorRouteConfigPayload) => {
    const { data } = await api.patch(`/operator-config/${configId}`, payload);
    return data;
};

// Toggle route config ACTIVE <-> INACTIVE
export const toggleConfigStatus = async (configId: string) => {
    const { data } = await api.patch(`/operator-config/${configId}/status`);
    return data;
};

// Set a pattern as the default for its variant
export const setDefaultPattern = async (configId: string, brandId: string) => {
    const { data } = await api.patch(`/operator-config/${configId}/set-default`, { brandId });
    return data;
};

// Delete a route config (blocked if any schedules reference it)
export const deleteRouteConfig = async (configId: string) => {
    const { data } = await api.delete(`/operator-config/${configId}`);
    return data;
};


// ── Route Requests ─────────────────────────────────────────────────────────────

export const getAllRouteRequests = async (status?: string) => {
    const { data } = await api.get<{ data: RouteRequestRecord[] }>("/registry/route-requests", {
        params: status ? { status } : {},
    });
    return data;
};

export const getRouteRequestById = async (id: string) => {
    const { data } = await api.get(`/registry/route-requests/${id}`);
    return data;
};

export const reviewRouteRequest = async (
    id: string,
    payload: RouteRequestReviewPayload
) => {
    const { data } = await api.patch(`/registry/route-requests/${id}`, payload);
    return data;
};
