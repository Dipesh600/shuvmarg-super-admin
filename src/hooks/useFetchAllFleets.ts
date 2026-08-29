import { getOperationalFleets, getBrandFleets, getFleetDashboardData, getFleetById } from "@/api/fleetApi";
import { useQuery } from "@tanstack/react-query";

// ── Live Dispatch Board ──────────────────────────────────────────────────────────
// Only returns APPROVED, setupComplete:true buses — the live fleet.
// Used by: /admin/fleets (Fleet Management page)
export const useAllFleets = () => {
    return useQuery({
        queryKey: ["getOperationalFleets"],
        queryFn: getOperationalFleets,
        staleTime: 2 * 60 * 1000, // 2 min — ops data should be fairly fresh
        refetchOnWindowFocus: true,
    });
};

// ── Brand Asset Registry ─────────────────────────────────────────────────────────
// Returns ALL buses for a brand regardless of lifecycle state.
// Used by: Bus Owner detail panel (Fleet tab)
export const useBrandFleets = (brandId: string) => {
    return useQuery({
        queryKey: ["getBrandFleets", brandId],
        queryFn: () => getBrandFleets(brandId),
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        enabled: !!brandId,
    });
};

export const useFleetById = (id: string) => {
    return useQuery({
        queryKey: ["getFleetById", id],
        queryFn: () => getFleetById(id),
        staleTime: 5 * 60 * 1000,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        enabled: !!id,
    });
};

export const useFleetDashboard = () => {
    return useQuery({
        queryKey: ["getFleetDashboard"],
        queryFn: getFleetDashboardData,
        staleTime: 2 * 60 * 1000, // 2 min — dashboard stats should be fairly fresh
        refetchOnWindowFocus: true,
    });
};
