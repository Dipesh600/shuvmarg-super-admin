import { api } from "./axios";

/* ─── Types ──────────────────────────────────────────────────────────────── */
export interface CreateTemplatePayload {
  templateName: string;
  seatConfig: object;
  userId: string;
}

export interface UpdateTemplatePayload {
  templateName?: string;
  seatConfig?: object;
  isActive?: boolean;
}

/* ─── API calls ──────────────────────────────────────────────────────────── */
export const getAllSeatsTemplate = async () => {
  const { data } = await api.get("/templates/all");
  return data;
};

export const createTemplateForOwner = async (payload: CreateTemplatePayload) => {
  const { data } = await api.post("/templates/create", payload);
  return data;
};

export const getTemplatesByUser = async (userId: string) => {
  const { data } = await api.get(`/templates/user/${userId}`);
  return data;
};

export const getSeatTemplateById = async (id: string) => {
  const { data } = await api.get(`/templates/${id}`);
  return data;
};

export const updateSeatTemplate = async (id: string, payload: UpdateTemplatePayload) => {
  const { data } = await api.patch(`/templates/${id}`, payload);
  return data;
};

export const deleteSeatTemplateStatus = async (id: string) => {
  const { data } = await api.delete(`/templates/${id}`);
  return data;
};

export const toggleSeatTemplateStatus = async (id: string) => {
  const { data } = await api.patch(`/templates/toggleStatus/${id}`);
  return data;
};
