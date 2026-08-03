import { api } from "./axios";

// ── Shared types ───────────────────────────────────────────────────────────────

export interface PartnerLead {
  _id: string;
  phone: string;
  fullName: string | null;
  district: string | null;
  entityType: "busOwner" | "agent";
  leadType: "contact_form" | "otp_verified";
  phoneVerified: boolean;
  status: "new" | "contacted" | "converted";
  source: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeadListResponse {
  success: boolean;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  data: PartnerLead[];
}

export interface LeadStats {
  total: number;
  new: number;
  contacted: number;
  converted: number;
  contactForm: number;
  otpVerified: number;
  conversionRate: string;
}

export interface GetLeadsParams {
  leadType?: "contact_form" | "otp_verified";
  status?: "new" | "contacted" | "converted";
  search?: string;
  page?: number;
  limit?: number;
}

// ── Bus Owner lead API ─────────────────────────────────────────────────────────

export const getPartnerLeads = (params?: GetLeadsParams) =>
  api.get<LeadListResponse>("/partner-leads", { params });

export const getPartnerLeadStats = () =>
  api.get<{ success: boolean; data: LeadStats }>("/partner-leads/stats");

export const updatePartnerLead = (
  id: string,
  payload: { status?: PartnerLead["status"]; notes?: string }
) =>
  api.patch<{ success: boolean; message: string; data: PartnerLead }>(
    `/partner-leads/${id}`,
    payload
  );

// ── Agent lead API ─────────────────────────────────────────────────────────────

export const getAgentLeads = (params?: GetLeadsParams) =>
  api.get<LeadListResponse>("/agent-leads", { params });

export const getAgentLeadStats = () =>
  api.get<{ success: boolean; data: LeadStats }>("/agent-leads/stats");

export const updateAgentLead = (
  id: string,
  payload: { status?: PartnerLead["status"]; notes?: string }
) =>
  api.patch<{ success: boolean; message: string; data: PartnerLead }>(
    `/agent-leads/${id}`,
    payload
  );
