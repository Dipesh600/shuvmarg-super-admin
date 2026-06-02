import { api } from "./axios";

// ─── Fleet Profile Workstation ───────────────────────────────────────────────────
// Single endpoint returns the complete operational profile for one fleet.
// Used by: /admin/fleets/:id/workstation (Fleet Profile Workstation)

export const getFleetWorkstation = async (fleetId: string) => {
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
export const updateTripStatus = async (fleetId: string, tripId: string, payload: { status: string, cancellationReason?: string }) => {
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
