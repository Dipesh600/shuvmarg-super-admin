import { api } from "./axios";

export type ConductorStatus = "AVAILABLE" | "ON_DUTY" | "OFF_DUTY" | "SUSPENDED" | "INACTIVE";
export type ConductorAccessStatus = "NOT_LINKED" | "INVITED" | "ACTIVE" | "SUSPENDED" | "REMOVED";
export type ConductorInvitationDeliveryStatus = "NOT_REQUIRED" | "PENDING" | "QUEUED" | "FAILED";

export interface ConductorTripSummary {
  _id: string;
  tripId?: string;
  tripDate: string;
  departureTime: string;
  arrivalTime?: string;
  status: string;
  bus?: { _id: string; busName?: string; busNumber?: string } | null;
  route?: { _id: string; routeName?: string; fromCity?: string; toCity?: string } | null;
}

export interface ConductorStatusHistory {
  from: ConductorStatus;
  to: ConductorStatus;
  actorId?: string | null;
  at: string;
  reason?: string | null;
}

export interface ConductorProfile {
  _id: string;
  brandId: string | { _id: string; brandName: string };
  ownerId: string;
  userId?: string | null;
  fullName: string;
  phone: string;
  notes?: string | null;
  status: ConductorStatus;
  accessStatus: ConductorAccessStatus;
  invitationDeliveryStatus: ConductorInvitationDeliveryStatus;
  phoneVerified: boolean;
  invitedAt?: string | null;
  activatedAt?: string | null;
  invitationLastAttemptAt?: string | null;
  createdBy: "ADMIN" | "OPERATOR";
  removedAt?: string | null;
  suspensionReason?: string | null;
  createdAt?: string;
  updatedAt?: string;
  assignedTrips: ConductorTripSummary[];
  statusHistory: ConductorStatusHistory[];
}

export interface CreateConductorPayload {
  brandId: string;
  name: string;
  phone: string;
  resendInvite?: boolean;
}

export const getConductorsByBrand = async (
  brandId: string,
  params?: { status?: ConductorStatus },
): Promise<{ success: boolean; results: number; data: ConductorProfile[] }> => {
  const { data } = await api.get(`/brands/${encodeURIComponent(brandId)}/conductors`, { params });
  return data;
};

export const createConductor = async (payload: CreateConductorPayload) => {
  const { data } = await api.post("/conductors", payload);
  return data as { success: boolean; message: string };
};

export const updateConductor = async (
  conductorId: string,
  payload: { fullName?: string; phone?: string; notes?: string | null },
) => {
  const { data } = await api.patch(`/conductors/${encodeURIComponent(conductorId)}`, payload);
  return data as { success: boolean; message: string; data: ConductorProfile };
};

export const updateConductorStatus = async (
  conductorId: string,
  status: "AVAILABLE" | "OFF_DUTY" | "SUSPENDED",
  reason?: string,
) => {
  const { data } = await api.patch(`/conductors/${encodeURIComponent(conductorId)}/status`, { status, reason });
  return data as { success: boolean; message: string; data: ConductorProfile };
};
