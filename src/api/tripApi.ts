import { api } from "./axios";

// ── Types for Trip Control Center ────────────────────────────────────────

/** Matches backend tripModel.js exactly: "in-transit" (hyphenated) */
export type TripStatus = "scheduled" | "boarding" | "in-transit" | "completed" | "cancelled";

export type ExceptionType = "NONE" | "CANCELLED" | "RESCHEDULED" | "EXTRA_RUN";

export interface BookingStats {
    booked: number;
    cancelled: number;
    noShow: number;
    pending: number;
    seatsSold: number;
    revenue: number;
    boardingConfirmed: number;
}

export interface RefundStats {
    pendingCount: number;
    pendingAmount: number;
}

export interface TripBrand {
    _id: string;
    brandName: string;
    brandCode?: string;
    logo?: string;
}

export interface TripBus {
    _id: string;
    busNumber?: string;
    busName?: string;
    totalSeats?: number;
}

export interface TripOwner {
    _id: string;
    name?: string;
    email?: string;
}

export interface TripDriver {
    _id: string;
    fullName?: string;
    phone?: string;
}

export interface TripVariant {
    _id: string;
    name?: string;
    direction?: string;
    corridorId?: {
        originId?: { name: string };
        destinationId?: { name: string };
    };
}

export interface AdminTrip {
    _id: string;
    tripId?: string;
    tripDate: string;
    departureTime: string;
    arrivalTime?: string;
    tripFare?: number;
    status: TripStatus;
    exceptionType?: ExceptionType;
    isActive: boolean;
    directionLabel?: string;
    fromStopName?: string;
    toStopName?: string;
    cancellationReason?: string;
    rescheduleReason?: string;
    originalDepartureTime?: string;
    originalArrivalTime?: string;
    actualDepartureTime?: string;
    actualArrivalTime?: string;
    bookingClosesAt?: string;
    shift?: string;
    // Populated references
    brandId?: TripBrand;
    busId?: TripBus;
    ownerId?: TripOwner;
    driverId?: TripDriver;
    variantId?: TripVariant;
    scheduleId?: { _id: string; departureTime?: string; recurrence?: string; versionNumber?: number };
    // Enriched by overview/search endpoints
    bookingStats?: BookingStats;
    refundStats?: RefundStats;
    // Legacy
    routeId?: { _id: string; routeName?: string; from?: string; to?: string };
    createdAt: string;
}

export interface Pagination {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface TripListResponse {
    trips: AdminTrip[];
    pagination: Pagination;
}

// ── Legacy CRUD (preserved for backward compat) ──────────────────────────

export const createTripForOwner = async (payload: {
    busId: string;
    routeId: string;
    seatTemplateId: string;
    tripDate: string;
    departureTime: string;
    arrivalTime: string;
    shift: string;
    tripFare: number;
    recurrence: string;
    autoGenerateUntil: string;
    ownerId: string;
}) => {
    const { data } = await api.post("/trips/create", payload);
    return data;
};

export const getTripsByOwner = async (ownerId: string) => {
    const { data } = await api.get(`/trips/owner/${ownerId}`);
    return data;
};

export const getTripById = async (id: string) => {
    const { data } = await api.get(`/trips/details/${id}`);
    return data;
};

export const updateTripByAdmin = async (id: string, payload: Record<string, unknown>) => {
    const { data } = await api.patch(`/trips/update/${id}`, payload);
    return data;
};

export const deleteTripByAdmin = async (id: string) => {
    const { data } = await api.delete(`/trips/delete/${id}`);
    return data;
};

export const getAllTrips = async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    date?: string;
}): Promise<TripListResponse> => {
    const { data } = await api.get("/trips/all", { params });
    return data.data;
};

export const updateTripStatus = async (
    tripId: string,
    status: TripStatus
): Promise<AdminTrip> => {
    const { data } = await api.patch(`/trips/status/${tripId}`, { status });
    return data.data;
};

// ── Driver Assignment ─────────────────────────────────────────────────────

export const assignDriverToTrip = async (tripId: string, driverId: string) => {
    const { data } = await api.patch(`/trips/assign-driver/${tripId}`, { driverId });
    return data;
};

export const getDriversByBrand = async (brandId: string) => {
    const { data } = await api.get(`/brands/${brandId}/drivers`);
    return data;
};

// ── Trip Control Center Endpoints ─────────────────────────────────────────

/** KPI overview for exception triage */
export interface OverviewKPIs {
    todayExceptions: number;
    totalExceptions: number;
    revenueAtRisk: number;
    stuckTrips: number;
    pendingRefunds: number;
}

export interface OverviewResponse {
    kpis: OverviewKPIs;
    exceptions: {
        trips: AdminTrip[];
        pagination: Pagination;
    };
    stuckTrips: AdminTrip[];
}

export const getTripOverview = async (params?: {
    page?: number;
    limit?: number;
    brandId?: string;
    from?: string;
    to?: string;
}): Promise<OverviewResponse> => {
    const { data } = await api.get("/trips/overview", { params });
    return data.data;
};

/** Schedule health monitoring */
export interface ScheduleHealthEntry {
    schedule: {
        _id: string;
        status: string;
        departureTime: string;
        arrivalTime: string;
        recurrence: string;
        daysOfWeek?: number[];
        advanceGenerationDays?: number;
        versionNumber?: number;
        suspensionReason?: string;
        suspendUntil?: string;
        suspendedAt?: string;
        operationalModel?: string;
        brandId?: TripBrand;
        busId?: TripBus & { totalSeats?: number };
        driverId?: TripDriver;
        variantId?: TripVariant;
    };
    health: {
        expectedHorizon: string;
        actualHorizon: string | null;
        gapDays: number;
        hasGap: boolean;
        status: "CRITICAL" | "WARNING" | "HEALTHY";
        totalTrips: number;
        upcomingTrips: number;
        cancelledTrips: number;
        missingDates: string[];
        missingCount: number;
        lastGeneratedDate: string | null;
        lastGeneratedAt: string | null;
        firstTripDate: string | null;
        windowDays: number;
    };
    suspensionInfo?: {
        suspendedAt: string;
        daysSuspended: number;
        missedTrips: number;
        autoResumeDate: string | null;
        reason: string | null;
    } | null;
}

export interface ScheduleHealthKPIs {
    totalActive: number;
    totalSuspended: number;
    critical: number;
    warnings: number;
    healthy: number;
    totalMissing: number;
}

export interface ScheduleHealthResponse {
    kpis: ScheduleHealthKPIs;
    schedules: ScheduleHealthEntry[];
    suspended: ScheduleHealthEntry[];
}

export const getScheduleHealth = async (params?: {
    brandId?: string;
}): Promise<ScheduleHealthResponse> => {
    const { data } = await api.get("/trips/schedule-health", { params });
    return data.data;
};

/** Burst-generate trips for a specific schedule to fill gaps */
export const burstGenerateTrips = async (scheduleId: string, days?: number): Promise<{
    generated: number;
    skipped: number;
    errors: number;
}> => {
    const { data } = await api.post(`/schedules/${scheduleId}/burst`, { days });
    return data.data;
};

/** Enhanced global trip search */
export interface TripSearchResponse {
    trips: AdminTrip[];
    pagination: Pagination;
}

export const searchTrips = async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    date?: string;
    from?: string;
    to?: string;
    brandId?: string;
    search?: string;
}): Promise<TripSearchResponse> => {
    const { data } = await api.get("/trips/search", { params });
    return data.data;
};

// ── Route Performance ─────────────────────────────────────────────────────────

export type PerformanceTier = "CRITICAL" | "LOW" | "MODERATE" | "HEALTHY" | "NO_DATA";

export interface RouteMetrics {
    windowDays: number;
    totalTrips: number;
    completedTrips: number;
    cancelledTrips: number;
    runTrips: number;
    completionRate: number | null;
    cancellationRate: number | null;
    totalSeatsSold: number;
    totalRevenue: number;
    avgRevenuePerTrip: number;
    loadFactor: number | null;
    busSeats: number;
    performance: PerformanceTier;
}

export interface RoutePerformanceEntry {
    schedule: {
        _id: string;
        status: string;
        departureTime: string;
        arrivalTime: string;
        recurrence: string;
        daysOfWeek?: number[];
        brandId?: TripBrand;
        busId?: TripBus;
        variantId?: TripVariant;
    };
    metrics: RouteMetrics;
}

export interface RoutePerformanceKPIs {
    avgLoadFactor: number;
    avgCompletionRate: number;
    topRevenue: number;
    totalRoutes: number;
    critical: number;
    low: number;
    healthy: number;
}

export interface RoutePerformanceResponse {
    routes: RoutePerformanceEntry[];
    kpis: RoutePerformanceKPIs;
    windowDays: number;
}

export const getRoutePerformance = async (params?: {
    brandId?: string;
    days?: number;
}): Promise<RoutePerformanceResponse> => {
    const { data } = await api.get("/trips/route-performance", { params });
    return data.data;
};

