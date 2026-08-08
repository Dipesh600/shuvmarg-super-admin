import { api } from "./axios";

const mapFleetListItems = (items: Array<Record<string, any>> = []) => items.map((fleet) => ({
  ...fleet,
  _id: fleet.fleetId,
  fleetId: fleet.fleetCode || fleet.fleetId,
  operator: fleet.brand?.brandName || fleet.owner?.companyName || "N/A",
  route: fleet.route || "Unassigned",
  seatCapacity: fleet.totalSeats || 0,
}));

// ── Fleet Dispatch Board ────────────────────────────────────────────────────────
// Used by: /admin/fleets (Fleet Management page)
// Returns: APPROVED buses with setupComplete:true — the live dispatch board only.
export const getOperationalFleets = async () => {
  try {
    const { data } = await api.get("/fleet/getAllFleet?operational=true");
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
    const { data } = await api.get(`/fleet/getAllFleet?brandId=${brandId}`);
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
    const { data } = await api.get("/fleet/getAllFleet?approvalStatus=PENDING");
    return { ...data, data: mapFleetListItems(data?.data?.items) };
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// ── Single Fleet ────────────────────────────────────────────────────────────────
export const getFleetById = async (id: string) => {
  try {
    const { data } = await api.get(`/fleet/getById/${id}`);
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
