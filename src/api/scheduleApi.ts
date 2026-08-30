import { api } from "./axios";
import type { TripBus, TripDriver, TripVariant } from "./tripApi";

export type ScheduleStatus = "DRAFT" | "ACTIVE" | "SUSPENDED" | "INACTIVE";
export type ScheduleRecurrence = "DAILY" | "WEEKLY" | "CUSTOM";
export type ScheduleOperationalModel = "TURNAROUND" | "RELAY";

export interface AdminSchedule {
    _id: string;
    brandId?: { _id: string; brandName?: string };
    busId?: TripBus;
    variantId?: TripVariant & { code?: string; type?: string; returnVariantId?: string };
    operatorRouteConfigId?: string;
    driverId?: TripDriver & { licenseNumber?: string; status?: string };
    departureTime: string;
    arrivalTime: string;
    shift: "day" | "night";
    recurrence: ScheduleRecurrence;
    daysOfWeek?: number[];
    effectiveFrom: string;
    effectiveUntil?: string | null;
    fareOverride?: number;
    operationalModel?: ScheduleOperationalModel;
    layoverMinutes?: number;
    returnScheduleId?: string | null;
    status: ScheduleStatus;
    versionNumber?: number;
    pendingVersionId?: string | null;
    suspensionReason?: string;
    suspendUntil?: string | null;
    tripCount?: number;
    nextTripDate?: string | null;
    createdAt?: string;
}

export interface CreateSchedulePayload {
    brandId: string;
    busId: string;
    variantId?: string;
    operatorRouteConfigId?: string;
    driverId?: string;
    departureTime: string;
    arrivalTime: string;
    shift: "day" | "night";
    recurrence: ScheduleRecurrence;
    daysOfWeek?: number[];
    effectiveFrom: string;
    effectiveUntil?: string;
    fareOverride?: number;
    notes?: string;
    advanceBookingDays?: number;
    bookingCutoffHours?: number;
    advanceGenerationDays?: number;
    operationalModel?: ScheduleOperationalModel;
    layoverMinutes?: number;
    returnScheduleId?: string;
}

export interface ScheduleMutationResponse {
    success: boolean;
    message?: string;
    data?: AdminSchedule;
}

type ScheduleListResponse = { success: boolean; results: number; data: AdminSchedule[] };

// ─── Schedule CRUD ─────────────────────────────────────────────────────────────

/** Create a new schedule (starts as DRAFT) */
export const createSchedule = async (payload: {
    brandId: string;
    busId: string;
    variantId?: string;
    operatorRouteConfigId?: string;
    driverId?: string;
    departureTime: string;          // "HH:MM"
    arrivalTime: string;            // "HH:MM"
    shift: "day" | "night";
    recurrence: "DAILY" | "WEEKLY" | "CUSTOM";
    daysOfWeek?: number[];          // 0-6 (Sun-Sat)
    effectiveFrom: string;          // ISO date string
    effectiveUntil?: string;        // ISO date string, optional
    fareOverride?: number;
    notes?: string;
    // ── Booking window ──────────────────────────────────────────────────────
    advanceBookingDays?: number;    // how many days ahead passengers can book (default 60)
    bookingCutoffHours?: number;    // close booking N hours before departure (default 2)
    advanceGenerationDays?: number; // rolling trip window (default 60)
    // ── Return trip linking ─────────────────────────────────────────────────
    operationalModel?: "TURNAROUND" | "RELAY";
    layoverMinutes?: number;        // rest at destination before return (default 60)
    returnScheduleId?: string;      // linked return schedule ID (set post-creation)
}) => {
    const { data } = await api.post<ScheduleMutationResponse>("/schedules", payload);
    return data;
};

/** Get all schedules for a brand */
export const getSchedulesByBrand = async (brandId: string, params?: { status?: string }) => {
    const { data } = await api.get<ScheduleListResponse>(`/brands/${brandId}/schedules`, { params });
    return data;
};

/** Get all schedules platform-wide (paginated) */
export const getAllSchedules = async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    brandId?: string;
    busId?: string;
}) => {
    const { data } = await api.get("/schedules", { params });
    return data;
};

/** Get a single schedule by ID with full population */
export const getScheduleById = async (scheduleId: string) => {
    const { data } = await api.get(`/schedules/${scheduleId}`);
    return data;
};

/** Get all trip instances generated from a schedule */
export const getTripsBySchedule = async (
    scheduleId: string,
    params?: { status?: string; from?: string; to?: string }
) => {
    const { data } = await api.get(`/schedules/${scheduleId}/trips`, { params });
    return data;
};

/** Update a DRAFT or SUSPENDED schedule */
export const updateSchedule = async (scheduleId: string, payload: Partial<CreateSchedulePayload>) => {
    const { data } = await api.patch<ScheduleMutationResponse>(`/schedules/${scheduleId}`, payload);
    return data;
};

// ─── Schedule Lifecycle ────────────────────────────────────────────────────────

/** DRAFT/SUSPENDED → ACTIVE: admin activates (no trips generated yet) */
export const activateSchedule = async (scheduleId: string) => {
    const { data } = await api.patch<ScheduleMutationResponse>(`/schedules/${scheduleId}/activate`);
    return data;
};

/** ACTIVE → GO LIVE: triggers burst trip generation (two-phase confirmation) */
export const goLiveSchedule = async (scheduleId: string) => {
    const { data } = await api.patch<ScheduleMutationResponse>(`/schedules/${scheduleId}/go-live`);
    return data;
};

/** ACTIVE → SUSPENDED: stops future trip generation, past trips unaffected.
 * @param suspendUntil - optional ISO date string for auto-resume (maintenance windows) */
export const suspendSchedule = async (scheduleId: string, reason: string, suspendUntil?: string) => {
    const { data } = await api.patch<ScheduleMutationResponse>(`/schedules/${scheduleId}/suspend`, { reason, suspendUntil });
    return data;
};

/** SUSPENDED → ACTIVE: re-activates and burst-generates trips from today.
 * This is the Workstation "Resume Operations" action — NOT the Setup Wizard. */
export const resumeSchedule = async (scheduleId: string) => {
    const { data } = await api.patch<ScheduleMutationResponse>(`/schedules/${scheduleId}/resume`);
    return data;
};

/** ACTIVE → VERSIONED: creates a new schedule version with updated timings,
 * sealing the current schedule on (effectiveFrom - 1 day).
 * This is the industry-standard way to change timings without breaking live bookings. */
export const createScheduleVersion = async (
    scheduleId: string,
    payload: {
        departureTime: string;   // "HH:MM"
        arrivalTime: string;     // "HH:MM"
        effectiveFrom: string;   // ISO date — must be future date
        fareOverride?: number;
        notes?: string;
    }
) => {
    const { data } = await api.post<ScheduleMutationResponse>(`/schedules/${scheduleId}/version`, payload);
    return data;
};

/** ANY → INACTIVE: permanent soft-delete, stops generation forever */
export const deactivateSchedule = async (scheduleId: string, reason?: string) => {
    const { data } = await api.patch<ScheduleMutationResponse>(`/schedules/${scheduleId}/deactivate`, { reason });
    return data;
};

/** DRAFT ONLY → HARD DELETE: removes record completely */
export const deleteSchedule = async (scheduleId: string) => {
    const { data } = await api.delete<ScheduleMutationResponse>(`/schedules/${scheduleId}`);
    return data;
};

// ─── Manual Trip Generation ────────────────────────────────────────────────────

/** Admin: manually generate trips for a specific date from all active schedules */
export const generateTripsForDate = async (date: string) => {
    const { data } = await api.post("/schedules/generate", { date });
    return data;
};
