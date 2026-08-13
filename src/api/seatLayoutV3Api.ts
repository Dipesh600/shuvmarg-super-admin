import { api } from "@/api/axios";
import type { SeatLayoutRevision, SeatLayoutTemplate, SeatLayoutV3, TemplateDetail, VehicleCategory } from "@/features/seat-layout-v3/types";

const data = <T>(response: { data: { data: T } }) => response.data.data;
export const listSeatLayoutTemplates = async () => data<SeatLayoutTemplate[]>(await api.get("/seat-layout-v3/templates"));
export const getSeatLayoutTemplate = async (id: string) => data<TemplateDetail>(await api.get(`/seat-layout-v3/templates/${id}`));
export const createSeatLayoutTemplate = async (input: { templateCode: string; name: string; vehicleCategory: VehicleCategory }) =>
  data<SeatLayoutTemplate>(await api.post("/seat-layout-v3/templates", input));
export const createSeatLayoutRevision = async (templateId: string, layout: SeatLayoutV3, changeSummary: string) =>
  data<SeatLayoutRevision>(await api.post(`/seat-layout-v3/templates/${templateId}/revisions`, { layout, changeSummary }));
export const publishSeatLayoutRevision = async (templateId: string, revisionId: string) =>
  data<SeatLayoutRevision>(await api.post(`/seat-layout-v3/templates/${templateId}/revisions/${revisionId}/publish`));
export const listSeatLayoutChangeRequests = async () => data<Array<{ id: string; fleetId: string; fromRevisionId: string; proposedRevisionId: string; status: string; requestedAt: string }>>(await api.get("/seat-layout-v3/change-requests?status=PENDING"));
export const reviewSeatLayoutChange = async (requestId: string, decision: "approve" | "reject", note?: string) =>
  data<unknown>(await api.post(`/seat-layout-v3/change-requests/${requestId}/${decision}`, decision === "reject" ? { note } : {}));
