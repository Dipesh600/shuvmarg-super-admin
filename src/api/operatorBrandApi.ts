import { api } from "./axios";

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
    const { data } = await api.get(`/brands/${brandId}`);
    return data;
};

export const getBrandsByOwner = async (ownerId: string) => {
    const { data } = await api.get(`/owners/${ownerId}/brands`);
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
    const { data } = await api.get(`/brands/${brandId}/route-services`);
    return data;
};

// Schedules for a brand — lists all Schedule records
export const getBrandSchedules = async (brandId: string, params?: { status?: string }) => {
    const { data } = await api.get(`/brands/${brandId}/schedules`, { params });
    return data;
};

// Full financial overview for a brand (KPIs, chart, fleet breakdown, settlements)
export const getBrandFinancials = async (brandId: string) => {
    const { data } = await api.get(`/brands/${brandId}/financials`);
    return data;
};
