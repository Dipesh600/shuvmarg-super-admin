import { api } from "./axios";

// ─── Types ────────────────────────────────────────────────────────────────────

export type DiscoveryStatus =
  | "DRAFT"
  | "ROUTE_SELECTED"
  | "STOPS_DISCOVERED"
  | "APPROVED"
  | "PUBLISHED"
  | "REJECTED";

export type AdminAction = "PENDING" | "APPROVED" | "REJECTED" | "EDITED" | "MERGED";

export interface RouteOption {
  providerRouteId: string;
  summary: string;
  distanceKm: number;
  durationMins: number;
  geometry: { type: "LineString"; coordinates: [number, number][] } | null;
  provider: "MAPBOX";
}

export interface DiscoveredStop {
  _id: string;
  candidateName: string;
  candidateCoordinates: { lat: number; lng: number };
  googlePlaceId?: string;
  distanceFromOriginKm: number;
  durationFromOriginMins: number;
  sequenceOrder: number;
  adminAction: AdminAction;
  routeStopId: string | null;
  mergedIntoRouteStopId: string | null;
  source?: string;
}

export interface DiscoverySession {
  _id: string;
  originStopId: { _id: string; name: string; code: string; coordinates?: any } | string;
  destinationStopId: { _id: string; name: string; code: string; coordinates?: any } | string;
  status: DiscoveryStatus;
  routeOptions: RouteOption[];
  selectedRouteOptionIndex: number | null;
  discoveredStops: DiscoveredStop[];
  publishedVariant?: { variantId: string; routeStopSequence: any[] };
  isLlmRefined?: boolean;
  llmJobStatus?: "IDLE" | "PROCESSING" | "DONE" | "FAILED";
  llmJobError?: string | null;
  createdBy?: { name: string; email: string };
  approvedBy?: { name: string; email: string };
  createdAt: string;
  updatedAt: string;
}

export interface ListSessionsParams {
  status?: DiscoveryStatus;
  originStopId?: string;
  destinationStopId?: string;
  page?: number;
  limit?: number;
}

// ─── API calls ────────────────────────────────────────────────────────────────

/** Create a new discovery session for an O→D pair */
export const createDiscoverySession = async (payload: {
  originStopId: string;
  destinationStopId: string;
}) => {
  const { data } = await api.post("/registry/discovery", payload);
  return data;
};

/** List sessions with optional filters */
export const listDiscoverySessions = async (params: ListSessionsParams = {}) => {
  const { data } = await api.get("/registry/discovery", { params });
  return data;
};

/** Get a single session (fully populated) */
export const getDiscoverySession = async (id: string) => {
  const { data } = await api.get(`/registry/discovery/${id}`);
  return data;
};

/** Admin picks a route — from Google Maps (with metadata + step polylines for detailed stop discovery) */
export const selectRouteOption = async (
  id: string,
  routeOptionIndex: number,
  routeMetadata?: {
    summary:          string;
    distanceKm:       number;
    durationMins:     number;
    provider:         string;
    encodedPolyline:  string;    // overview — fallback
    stepPolylines:    string[];  // detailed step-level polylines for stop discovery
  }
) => {
  const { data } = await api.patch(`/registry/discovery/${id}/select-route`, {
    routeOptionIndex,
    ...routeMetadata,
  });
  return data;
};

/** Admin patches a single discovered stop (approve / reject / edit / merge) */
export const patchDiscoveredStop = async (
  sessionId: string,
  stopId: string,
  patch: {
    adminAction?: AdminAction;
    candidateName?: string;
    candidateCoordinates?: { lat: number; lng: number };
    routeStopId?: string | null;
    mergedIntoRouteStopId?: string | null;
  }
) => {
  const { data } = await api.patch(
    `/registry/discovery/${sessionId}/stops/${stopId}`,
    patch
  );
  return data;
};

/** Approve the full session */
export const approveSession = async (id: string) => {
  const { data } = await api.patch(`/registry/discovery/${id}/approve`);
  return data;
};

/** Reject the session */
export const rejectSession = async (id: string) => {
  const { data } = await api.patch(`/registry/discovery/${id}/reject`);
  return data;
};

/** Publish: writes Corridor + Variant + RouteStops to live registry */
export const publishSession = async (
  id: string,
  payload: { variantName?: string } = {}
) => {
  const { data } = await api.post(`/registry/discovery/${id}/publish`, payload);
  return data;
};

/** Manually re-trigger Mapbox route fetch */
export const manualSetRouteOptions = async (id: string, routeOptions: RouteOption[]) => {
  const { data } = await api.patch(`/registry/discovery/${id}/route-options`, {
    routeOptions,
  });
  return data;
};

/** Refine discovered stops with LLM — streams thinking via SSE */
export const refineStopsWithLLM = async (
  id: string,
  onChunk?: (text: string) => void
): Promise<{ success: boolean; message?: string; data?: DiscoverySession }> => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const token  = sessionStorage.getItem("sumarg_admin_token");

  const response = await fetch(`${apiUrl}/api/admin/registry/discovery/${id}/refine-stops`, {
    method: "PATCH",
    headers: {
      "Authorization": `Bearer ${token ?? ""}`,
      "Accept":        "text/event-stream",
    },
  });

  if (!response.ok || !response.body) {
    throw new Error(`Server error: ${response.status} ${response.statusText}`);
  }

  const reader  = response.body.getReader();
  const decoder = new TextDecoder();
  let   buffer  = "";

  return new Promise((resolve, reject) => {
    const read = async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? ""; // keep incomplete last line

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data: ")) continue;

            const json = trimmed.slice(6);
            try {
              const event = JSON.parse(json);

              if (event.text && typeof onChunk === "function") {
                onChunk(event.text);
              }

              if (event.complete) {
                resolve({ success: true, data: event.data });
                return;
              }

              if (event.error) {
                reject(new Error(event.message ?? "Minimax refinement failed."));
                return;
              }
            } catch {
              // Ignore malformed SSE lines
            }
          }
        }
        // Stream ended without complete event (shouldn't happen normally)
        resolve({ success: true });
      } catch (err: any) {
        reject(err);
      }
    };

    read();
  });
};
