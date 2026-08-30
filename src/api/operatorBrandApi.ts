import { api } from "./axios";
import type { OperatorRouteTiming } from "./platformRegistryApi";

export interface BrandRouteServiceConfig {
    _id: string;
    patternName?: string;
    status: string;
    isLive?: boolean;
    activeStops?: Array<{ _id: string; name?: string; code?: string; type?: string }>;
    timingConfig?: OperatorRouteTiming[];
    returnTimingConfig?: OperatorRouteTiming[];
    returnOverridden?: boolean;
    variantId?: {
        _id: string;
        name?: string;
        code?: string;
        type?: string;
        direction?: string;
        returnVariantId?: string;
        corridorId?: {
            _id?: string;
            originId?: { name?: string; code?: string };
            destinationId?: { name?: string; code?: string };
        };
    };
    scheduleStats?: { total: number; active: number; suspended: number; draft: number };
}

export interface OperatorBrandSummary {
    _id: string;
    brandName: string;
    brandCode?: string;
    status: string;
    fleetCount?: number;
    commissionRate?: number;
    logo?: string;
    baseCity?: string; contactEmail?: string; contactPhone?: string;
}
export interface OperatorBrandDetail extends OperatorBrandSummary {
    baseCity?: string; contactEmail?: string; contactPhone?: string; createdAt?: string;
    ownerId?: { _id?: string; name?: string; phone?: string };
    bankDetails?: { bankName?: string };
}
export interface BrandFinancials {
    kpis: { totalGross: number; totalBookings: number; totalTickets: number };
    thisMonth: { revenue: number; bookings: number };
    settlements: { pending: number; pendingCount: number };
    monthlyChart: Array<{ label: string; revenue: number; bookings: number }>;
    trips: { completed: number; scheduled: number; inTransit: number; cancelled: number };
    fleetBreakdown: Array<{ busId?: string; bus?: { busName?: string; busNumber?: string }; tickets: number; revenue: number }>;
}

export interface BrandRouteServicesResponse {
    success: boolean;
    results: number;
    data: BrandRouteServiceConfig[];
    summary: { totalRoutes: number; activeRoutes: number; totalSchedules: number; activeSchedules: number };
}

export const createBrand = async (payload: {
    ownerId: string;
    brandName: string;
    contactEmail?: string;
    contactPhone?: string;
    baseCity?: string;
    commissionRate?: number;
    notes?: string;
}) => {
    const { data } = await api.post("/brands", payload);
    return data;
};

export const getAllBrands = async (params?: { page?: number; limit?: number; status?: string; search?: string }) => {
    const { data } = await api.get("/brands", { params });
    return data;
};

export const getBrandById = async (brandId: string) => {
    const { data } = await api.get<{ data: OperatorBrandDetail }>(`/brands/${brandId}`);
    return data;
};

export const getBrandsByOwner = async (ownerId: string) => {
    const { data } = await api.get<{ data: OperatorBrandSummary[] }>(`/owners/${ownerId}/brands`);
    return data;
};

export const updateBrandStatus = async (brandId: string, payload: { status: string; reason?: string }) => {
    const { data } = await api.patch(`/brands/${brandId}/status`, payload);
    return data;
};

export interface BrandUpdatePayload {
    brandName: string;
    baseCity: string;
    contactEmail: string;
    contactPhone: string;
    commissionRate: number;
}

export const updateBrand = async (brandId: string, payload: BrandUpdatePayload) => {
    const { data } = await api.patch(`/brands/${brandId}`, payload);
    return data;
};

// Route Services — returns OperatorRouteConfigs with corridor, stops, and live schedule counts
export const getBrandRouteServices = async (brandId: string) => {
    const { data } = await api.get<BrandRouteServicesResponse>(`/brands/${brandId}/route-services`);
    return data;
};

// Schedules for a brand — lists all Schedule records
export const getBrandSchedules = async (brandId: string, params?: { status?: string }) => {
    const { data } = await api.get(`/brands/${brandId}/schedules`, { params });
    return data;
};

// Full financial overview for a brand (KPIs, chart, fleet breakdown, settlements)
export const getBrandFinancials = async (brandId: string) => {
    const { data } = await api.get<{ data: BrandFinancials }>(`/brands/${brandId}/financials`);
    return data;
};
