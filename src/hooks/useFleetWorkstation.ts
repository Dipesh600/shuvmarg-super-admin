import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getFleetWorkstation, getTripManifest, updateTripStatus, reassignTripDriver } from "@/api/fleetWorkstationApi";

/**
 * Fetch the complete Fleet Workstation payload.
 * Stale time: 60s — operational data should refresh frequently but not spam.
 */
export const useFleetWorkstation = (fleetId: string) => {
    return useQuery({
        queryKey: ["fleetWorkstation", fleetId],
        queryFn: () => getFleetWorkstation(fleetId),
        staleTime: 60 * 1000,
        refetchOnWindowFocus: true,
        enabled: !!fleetId,
    });
};

/**
 * Fetch the passenger manifest for a specific trip.
 * Only fires when explicitly enabled (lazy-load on row expand).
 */
export const useTripManifest = (fleetId: string, tripId: string, enabled: boolean) => {
    return useQuery({
        queryKey: ["tripManifest", fleetId, tripId],
        queryFn: () => getTripManifest(fleetId, tripId),
        staleTime: 2 * 60 * 1000,
        refetchOnWindowFocus: false,
        enabled: !!fleetId && !!tripId && enabled,
    });
};

export const useUpdateTripStatus = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ fleetId, tripId, payload }: { fleetId: string; tripId: string; payload: { status: string; cancellationReason?: string } }) =>
            updateTripStatus(fleetId, tripId, payload),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["fleetWorkstation", variables.fleetId] });
            queryClient.invalidateQueries({ queryKey: ["tripManifest", variables.fleetId, variables.tripId] });
        },
    });
};

export const useReassignTripDriver = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ fleetId, tripId, payload }: { fleetId: string; tripId: string; payload: { driverId: string; reason?: string } }) =>
            reassignTripDriver(fleetId, tripId, payload),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["fleetWorkstation", variables.fleetId] });
            queryClient.invalidateQueries({ queryKey: ["tripManifest", variables.fleetId, variables.tripId] });
        },
    });
};
