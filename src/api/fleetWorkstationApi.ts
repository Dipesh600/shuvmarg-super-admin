import { api } from "./axios";
import type { AdminTrip, TripStatus } from "@/api/tripApi";

export interface WorkstationTripStats {
    occupancyPct?: number;
    booked?: number;
    seatsSold?: number;
    totalBooked?: number;
    boardingConfirmed?: number;
    revenue?: number;
}

export interface WorkstationTrip extends AdminTrip {
    stats?: WorkstationTripStats;
}

export interface WorkstationSchedule {
    _id: string;
    status: string;
    departureTime?: string;
    arrivalTime?: string;
    operationalModel?: string;
}

export interface WorkstationFleet {
    _id: string;
    busName: string;
    busNumber: string;
    busType?: string;
    vehicleType?: string;
    totalSeats: number;
    status: string;
    averageRating: number;
    totalReviews: number;
    corridorId?: {
        originId?: { name?: string };
        destinationId?: { name?: string };
    } | null;
    brandId?: {
        brandName?: string;
        commissionRate?: number;
    } | null;
}

export interface WorkstationToday {
    trip?: WorkstationTrip | null;
    stats?: WorkstationTripStats;
}

export interface FleetWorkstationData {
    fleet?: WorkstationFleet | null;
    today?: WorkstationToday | null;
    schedules?: WorkstationSchedule[];
    recentTrips?: WorkstationTrip[];
    upcomingTrips?: WorkstationTrip[];
    financials?: unknown;
}

export interface FleetWorkstationResponse {
    success?: boolean;
    data?: FleetWorkstationData;
}

// ─── Fleet Profile Workstation ───────────────────────────────────────────────────
// Single endpoint returns the complete operational profile for one fleet.
// Used by: /admin/fleets/:id/workstation (Fleet Profile Workstation)

export const getFleetWorkstation = async (fleetId: string): Promise<FleetWorkstationResponse> => {
    try {
        const { data } = await api.get(`/fleet/${fleetId}/workstation`);
        return data;
    } catch (error) {
        console.error("[fleetWorkstationApi] getFleetWorkstation:", error);
        throw error;
    }
};

// ─── Trip Manifest ───────────────────────────────────────────────────────────────
// Per-trip passenger manifest. Lazy-loaded when admin expands a trip row.
export const getTripManifest = async (fleetId: string, tripId: string) => {
    try {
        const { data } = await api.get(`/fleet/${fleetId}/trips/${tripId}/manifest`);
        return data;
    } catch (error) {
        console.error("[fleetWorkstationApi] getTripManifest:", error);
        throw error;
    }
};
// ─── Trip Actions ────────────────────────────────────────────────────────────────
export const updateTripStatus = async (fleetId: string, tripId: string, payload: { status: TripStatus, cancellationReason?: string }) => {
    try {
        const { data } = await api.patch(`/fleet/${fleetId}/trips/${tripId}/status`, payload);
        return data;
    } catch (error) {
        console.error("[fleetWorkstationApi] updateTripStatus:", error);
        throw error;
    }
};

export const reassignTripDriver = async (fleetId: string, tripId: string, payload: { driverId: string, reason?: string }) => {
    try {
        const { data } = await api.patch(`/fleet/${fleetId}/trips/${tripId}/driver`, payload);
        return data;
    } catch (error) {
        console.error("[fleetWorkstationApi] reassignTripDriver:", error);
        throw error;
    }
};
