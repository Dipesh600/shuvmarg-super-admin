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
    departureTime: string;
    arrivalTime: string;
    shift?: string;
    recurrence: string;
    daysOfWeek?: number[];
    effectiveFrom: string;
    effectiveUntil?: string | null;
    fareOverride?: number;
    operationalModel?: string;
    versionNumber?: number;
    pendingVersionId?: string | null;
    suspensionReason?: string;
    suspendUntil?: string | null;
    tripCount?: number;
    nextTripDate?: string | null;
    driverId?: { _id: string; fullName?: string; licenseNumber?: string; status?: string } | null;
    variantId?: {
        _id?: string;
        code?: string;
        name?: string;
        direction?: string;
        corridorId?: {
            originId?: { name?: string };
            destinationId?: { name?: string };
        };
    } | null;
}

export interface WorkstationFinancialPeriod {
    gross: number;
    originalTotal: number;
    discountsGiven: number;
    commission: number;
    refunds: number;
    refundCount: number;
    net: number;
    bookingCount: number;
    passengerCount: number;
}

export interface WorkstationFinancials {
    commissionRate: number;
    thisMonth: WorkstationFinancialPeriod;
    lastMonth: WorkstationFinancialPeriod;
    allTime: WorkstationFinancialPeriod;
}

export interface ManifestPassenger {
    name: string;
    age?: number;
    gender?: string;
    idType?: string;
    seatNo?: string;
}

export interface ManifestBooking {
    _id: string;
    ticketId?: string;
    status: string;
    bookedAt: string;
    boardingConfirmed?: boolean;
    passengerDetails?: ManifestPassenger[];
    boardingPoint?: { name?: string; time?: string };
    droppingPoint?: { name?: string; time?: string };
    originalAmount?: number;
    discountAmount?: number;
    couponCode?: string;
    smMoneyUsed?: number;
    gatewayAmount?: number;
    totalAmount?: number;
    paymentMethod?: string;
    transactionId?: string;
    bookedVia?: string;
    cancellationReason?: string;
    refundId?: { refundAmount?: number; status?: string; processedAt?: string } | null;
}

export interface TripManifestSummary {
    totalBookings: number;
    totalPassengers: number;
    totalRevenue: number;
    boardedCount: number;
    cancelledCount: number;
    noShowCount: number;
    refundedAmount: number;
}

export interface TripManifestData {
    trip: Pick<WorkstationTrip, "_id" | "tripId" | "tripDate" | "departureTime" | "arrivalTime" | "status" | "shift">;
    bookings: ManifestBooking[];
    summary: TripManifestSummary;
}

export interface TripManifestResponse {
    success: boolean;
    data: TripManifestData;
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
    completedTrips?: WorkstationTrip[];
    cancelledTrips?: WorkstationTrip[];
    timelineTrips?: WorkstationTrip[];
    financials?: WorkstationFinancials | null;
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
        const { data } = await api.get<FleetWorkstationResponse>(`/fleet/${fleetId}/workstation`);
        return data;
    } catch (error) {
        console.error("[fleetWorkstationApi] getFleetWorkstation:", error);
        throw error;
    }
};

// ─── Trip Manifest ───────────────────────────────────────────────────────────────
// Per-trip passenger manifest. Lazy-loaded when admin expands a trip row.
export const getTripManifest = async (fleetId: string, tripId: string): Promise<TripManifestResponse> => {
    try {
        const { data } = await api.get<TripManifestResponse>(`/fleet/${fleetId}/trips/${tripId}/manifest`);
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
