import { api } from "./axios";
import type { FleetRow } from "@/components/data_tables/fleet/columns";
import type { FleetDetailResponse } from "./busOwnerFleetApi";

type FleetListSource = {
  fleetId: string;
  fleetCode?: string | null;
  busName?: string;
  busNumber?: string;
  busType?: string;
  status?: string;
  approvalStatus?: string;
  totalSeats?: number;
  route?: string | null;
  brand?: { brandName?: string | null } | null;
  owner?: { companyName?: string | null } | null;
};

type FleetListResponse = {
  success: boolean;
  data: { items: FleetListSource[] };
};

const mapFleetListItems = (items: FleetListSource[] = []): FleetRow[] => items.map((fleet) => ({
  ...fleet,
  _id: fleet.fleetId,
  fleetId: fleet.fleetCode || fleet.fleetId,
  busName: fleet.busName || "Unnamed bus",
  busNumber: fleet.busNumber || "N/A",
  busType: fleet.busType || "N/A",
  status: fleet.status || "INACTIVE",
  approvalStatus: fleet.approvalStatus || "PENDING",
  operator: fleet.brand?.brandName || fleet.owner?.companyName || "N/A",
  route: fleet.route || "Unassigned",
  seatCapacity: fleet.totalSeats || 0,
}));

// ── Fleet Dispatch Board ────────────────────────────────────────────────────────
// Used by: /admin/fleets (Fleet Management page)
// Returns: APPROVED buses with setupComplete:true — the live dispatch board only.
export const getOperationalFleets = async () => {
  try {
    const { data } = await api.get<FleetListResponse>("/fleet/getAllFleet?operational=true");
    return { ...data, data: mapFleetListItems(data?.data?.items) };
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// ── Brand Asset Registry ────────────────────────────────────────────────────────
// Used by: Bus Owner detail panel (Fleet tab)
// Returns: ALL buses for a given brand regardless of lifecycle state.
export const getBrandFleets = async (brandId: string) => {
  try {
    const { data } = await api.get<FleetListResponse>(`/fleet/getAllFleet?brandId=${brandId}`);
    return { ...data, data: mapFleetListItems(data?.data?.items) };
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// ── KYC / Approval Queue ────────────────────────────────────────────────────────
// Used by: Admin KYC page
// Returns: Buses with approvalStatus=PENDING awaiting admin sign-off.
export const getPendingFleets = async () => {
  try {
    const { data } = await api.get<FleetListResponse>("/fleet/getAllFleet?approvalStatus=PENDING");
    return { ...data, data: mapFleetListItems(data?.data?.items) };
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// ── Single Fleet ────────────────────────────────────────────────────────────────
export const getFleetById = async (id: string) => {
  try {
    const { data } = await api.get<FleetDetailResponse>(`/fleet/getById/${id}`);
    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// ── Dashboard Stats ─────────────────────────────────────────────────────────────
export const getFleetDashboardData = async () => {
  try {
    const { data } = await api.get("/fleet/fleetDashboard");
    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
