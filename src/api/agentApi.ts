import { api } from "./axios";

export interface AgentListRecord {
  _id?: string;
  id: string;
  agentId?: string;
  name?: string;
  phone?: string;
  email?: string;
  profileImg?: string;
  location?: string;
  applicationStatus: string;
  commission?: string;
  totalBookings?: number;
  createdAt?: string;
  submittedAt?: string;
  agentType?: string;
}

export interface AgentBrandOption {
  _id: string;
  brandId?: string;
  brandName: string;
  brandCode?: string;
  baseCity?: string;
}

export interface AgentRouteServiceOption {
  _id?: string;
  variantId: string;
  origin?: string;
  destination?: string;
  routeName?: string;
  patternName?: string;
  status?: string;
}

type AgentListResponse = { data: AgentListRecord[] };
export type AgentKycDocument = { type: string; verified?: boolean | null; rejectionReason?: string | null; previewUrl?: string; fileKey?: string };
export type AgentKycResponse = {
  data: {
    profile: { name: string; phone: string; email: string; address?: string; profilePicture?: string; createdAt?: string };
    agentDetails?: {
      _id?: string; agentId?: string; agentType?: string; businessName?: string; businessType?: string;
      claimedMonthlyVolume?: string; commissionRate?: number; district?: string; municipality?: string;
      operationType?: string; shopAddress?: string; settlementMethod?: string; submittedAt?: string;
      adminNotes?: string; moreInfoRequest?: string; rejectionReason?: string;
      user?: { name?: string; phone?: string; email?: string };
      documents?: AgentKycDocument[];
      applicationStatus?: string; bankName?: string; esewaNumber?: string; khaltiNumber?: string;
    };
  };
};

// ── AGENT QUERIES ──────────────────────────────────────────────────────────────

// get all agents (optional ?status=PENDING&type=DEFAULT)
const getAllAgents = async (params?: { status?: string; type?: string }) => {
  const { data } = await api.get<AgentListResponse>("/getAllAgents", { params });
  return data;
};

// get agent dashboard stats
const getAgentDashboardData = async () => {
  const { data } = await api.get("/agentDashboard");
  return data;
};

// get pending applications only
const getPendingAgentApplications = async () => {
  const { data } = await api.get<AgentListResponse>("/getAllAgents", { params: { status: "PENDING" } });
  return data;
};

// get MORE_INFO applications
const getMoreInfoAgentApplications = async () => {
  const { data } = await api.get<AgentListResponse>("/getAllAgents", { params: { status: "MORE_INFO" } });
  return data;
};

// get agent detail by userId / agentId / Agent._id (returns profile + KYC docs with presigned URLs)
const getAgentById = async (id: string) => {
  const { data } = await api.post<AgentKycResponse>("/getAgentDetails", { id });
  return data;
};

// search users by phone or name (for the "Find User" step in agent onboarding)
const searchUsersByPhone = async (query: string) => {
  const { data } = await api.get("/getAllUsers", {
    params: { search: query, limit: 8 },
  });
  return data;
};

// ── ADMIN-INITIATED AGENT CREATION ────────────────────────────────────────────

// Step 1 — Convert existing user account to agent role (creates bare Agent doc)
const makeUserAgent = async (userId: string) => {
  const { data } = await api.post("/makeUserAgent", { id: userId });
  return data;
};

// Step 2 — Fill agent profile fields + auto-approve OPERATOR_LINKED agents
export type FinalizeAgentPayload = {
  id: string;                          // Agent._id returned from makeUserAgent
  agentType: "DEFAULT" | "OPERATOR_LINKED";
  // Operator link (OPERATOR_LINKED only)
  linkedOperatorId?: string;
  busAccessScope?: "ALL_OPERATOR_BUSES" | "SPECIFIC_ROUTES";
  allowedRouteIds?: string[];
  // Personal
  district?: string;
  municipality?: string;
  // Business
  businessName?: string;
  shopAddress?: string;
  operationType?: string;
  claimedMonthlyVolume?: string;
  currentOperators?: string;
  // Settlement (optional — can be filled later)
  settlementMethod?: "BANK" | "ESEWA" | "KHALTI";
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
  esewaNumber?: string;
  khaltiNumber?: string;
  // Admin config
  commissionRate?: number;
  minSettlementThreshold?: number;
  adminNotes?: string;
};

const finalizeAgentSetup = async (payload: FinalizeAgentPayload) => {
  const { data } = await api.patch("/finalizeAgentSetup", payload);
  return data;
};

// ── OPERATOR BRANDS ────────────────────────────────────────────────────────────

// Get all operator brands (for OPERATOR_LINKED agent brand selector dropdown)
const getAllBrands = async () => {
  const { data } = await api.get<{ data: AgentBrandOption[] }>("/brands");
  return data;
};

// Get route services for a brand (for SPECIFIC_ROUTES picker)
const getBrandRouteServices = async (brandId: string) => {
  const { data } = await api.get<{ data: AgentRouteServiceOption[] }>(`/brands/${brandId}/route-services`);
  return data;
};

// ── ONBOARDING REVIEW ─────────────────────────────────────────────────────────

export type AgentReviewPayload = {
  id: string;
  applicationStatus?: "APPROVED" | "REJECTED" | "MORE_INFO" | "SUSPENDED";
  rejectionReason?: string;
  moreInfoRequest?: string;
  isPermanentlyRejected?: boolean;
  commissionRate?: number;
  minSettlementThreshold?: number;
  adminNotes?: string;
  documentVerifications?: {
    type: string;
    verified?: boolean;
    rejectionReason?: string;
  }[];
};

const reviewAgentApplication = async (payload: AgentReviewPayload) => {
  const { data } = await api.patch("/agentKycStatus", payload);
  return data;
};

export {
  getAllAgents,
  getAgentDashboardData,
  getPendingAgentApplications,
  getMoreInfoAgentApplications,
  getAgentById,
  searchUsersByPhone,
  makeUserAgent,
  finalizeAgentSetup,
  getAllBrands,
  getBrandRouteServices,
  reviewAgentApplication,
};
