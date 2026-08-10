import axios from "axios";
import { api } from "./axios";

function workflowError(error: unknown, fallback: string): never {
  if (axios.isAxiosError(error)) {
    if (error.code === "ECONNABORTED") {
      throw new Error("The route save timed out. Your draft is preserved; retry the save.");
    }
    const response = error.response?.data as { message?: string } | undefined;
    throw new Error(response?.message || fallback);
  }
  throw error;
}

export type VariantDirection = "FORWARD" | "RETURN";
export type CorridorStatus = "PENDING" | "ACTIVE" | "INACTIVE";
export type VariantStatus = "DRAFT" | "ACTIVE" | "INACTIVE" | "ARCHIVED";
export type VariantType = "STANDARD" | "HIGHWAY" | "EXPRESSWAY" | "MOUNTAIN" | "LOCAL";

export interface CorridorStop {
  _id: string;
  id?: string;
  code: string;
  name: string;
  parentStopId?: string | { _id: string; id?: string } | null;
  type?: string;
  province?: string | null;
  district?: string | null;
  municipality?: string | null;
  coordinates?: { lat: number; lng: number } | null;
  isRouteStop?: boolean;
  status?: string;
  verificationStatus?: string;
}

export interface RouteCorridor {
  _id: string;
  code: string;
  originId: CorridorStop;
  destinationId: CorridorStop;
  notes?: string | null;
  status: CorridorStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface RouteVariant {
  _id: string;
  corridorId: string;
  code: string;
  name: string | null;
  type: VariantType | null;
  direction?: VariantDirection;
  status: VariantStatus;
  distanceKm?: number | null;
  durationMinutes?: number | null;
  routeStopCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface RouteOption {
  id: string;
  label: string;
  distanceKm: number;
  durationMinutes: number;
  encodedPolyline?: string;
  isRecommended?: boolean;
  description?: string | null;
  roadLabels?: string[];
}

export interface RouteGuidancePlace {
  placeId: string;
  name: string;
  address?: string | null;
  coordinates?: { lat: number; lng: number } | null;
}

export interface VariantDraftTerminal {
  stopId: string;
  id?: string;
  _id?: string;
  name: string;
  code: string;
}

export type VariantStopCandidateReviewStatus = "UNREVIEWED" | "USE_EXISTING" | "CREATE_NEW" | "EXCLUDE";

export interface ProposedCanonicalStop {
  name: string;
  code?: string | null;
  type: string;
  province?: string | null;
  district?: string | null;
  municipality?: string | null;
  coordinates?: {
    lat: number;
    lng: number;
  } | null;
  isSearchable?: boolean;
  isRouteStop?: boolean;
  coordinateSource?: "GOOGLE_PLACE" | "MAP_PIN" | "ADMIN_GPS" | "DISCOVERY";
  coordinateProvider?: "GOOGLE" | "MAPBOX" | null;
  coordinatePlaceId?: string | null;
  coordinateSuggestedAddress?: string | null;
}

export interface VariantStopCandidate {
  id?: string;
  _id?: string;
  candidateKey?: string;
  sequence: number;
  isTerminal: boolean;
  source?: "GOOGLE_PLACES" | "PLATFORM_STOP" | string | null;
  discoveryMethod?: "CANONICAL_REGISTRY" | "SEARCH_ALONG_ROUTE" | "REVERSE_GEOCODE" | null;
  providerTypes?: string[];
  classification?: {
    entityType: "ROUTE_STOP" | "SERVICE_AREA" | "BOARDING_LOCATION";
    confidence: "HIGH" | "MEDIUM" | "LOW";
    reasonCodes: string[];
    suggestedParentStop?: CorridorStop | null;
    coverageZone?: "ORIGIN_40KM" | "MIDDLE" | "DESTINATION_40KM";
    distanceToRouteMeters?: number | null;
  };
  displayName: string;
  formattedAddress?: string | null;
  suggestedStop?: ProposedCanonicalStop | null;
  coords?: {
    lat: number;
    lng: number;
  } | null;
  coordinates?: {
    lat: number;
    lng: number;
  } | null;
  distanceKm?: number | null;
  durationMinutes?: number | null;
  reviewStatus: VariantStopCandidateReviewStatus;
  matchedStop?: CorridorStop | null;
  resolvedStop?: CorridorStop | null;
  proposedStop?: ProposedCanonicalStop | null;
}

export interface VariantDraft {
  _id: string;
  id?: string;
  corridorId: string;
  code: string;
  direction: VariantDirection;
  status: "DRAFT" | "ROUTE_SELECTED" | "STOP_CANDIDATES_READY" | "READY_TO_COMMIT" | "COMMITTED";
  originTerminal?: VariantDraftTerminal;
  destinationTerminal?: VariantDraftTerminal;
  routeOptions?: RouteOption[];
  selectedRouteOptionId?: string | null;
  name?: string | null;
  type?: VariantType | null;
  workflowStatus?: "TERMINALS_SELECTED" | "OPTIONS_READY" | "ROUTE_SELECTED" | "STOP_CANDIDATES_READY";
  stopCandidates?: VariantStopCandidate[];
  candidates?: VariantStopCandidate[];
  nextAction?: "SELECT_PATH" | "REVIEW_STOPS" | "NAME_PATH" | "READY_TO_SAVE";
  routeDataVersion?: number;
  candidateEngineVersion?: number | null;
  warnings?: string[];
}

interface RegistryResponse<T> {
  data: T;
  message?: string;
}

export interface CreateCorridorInput {
  originCode: string;
  destinationCode: string;
  notes?: string;
}

export interface CreateVariantDraftInput {
  direction: VariantDirection;
  originTerminalStopId?: string;
  destinationTerminalStopId?: string;
}

export interface UpdateVariantDetailsInput {
  name: string;
  type: VariantType;
}

export type ResolveVariantStopCandidateInput =
  | {
      reviewStatus: "USE_EXISTING";
      stopId: string;
    }
  | {
      reviewStatus: "CREATE_NEW";
      proposedStop: ProposedCanonicalStop;
    }
  | {
      reviewStatus: "EXCLUDE";
    };

export async function listCorridors(): Promise<RegistryResponse<RouteCorridor[]>> {
  const { data } = await api.get("/registry/corridors");
  return data;
}

export async function listRegistryStops(): Promise<RegistryResponse<CorridorStop[]>> {
  const { data } = await api.get("/registry/stops");
  return data;
}

export async function createRouteCorridor(input: CreateCorridorInput): Promise<RegistryResponse<RouteCorridor>> {
  const { data } = await api.post("/registry/corridors", input);
  return data;
}

export async function updateRouteCorridor(
  corridorId: string,
  payload: { notes?: string; status?: CorridorStatus },
): Promise<RegistryResponse<RouteCorridor>> {
  const { data } = await api.patch(`/registry/corridors/${corridorId}`, payload);
  return data;
}

export async function removeRouteCorridor(corridorId: string): Promise<RegistryResponse<void>> {
  const { data } = await api.delete(`/registry/corridors/${corridorId}`);
  return data;
}

export async function listCorridorVariants(corridorId: string): Promise<RegistryResponse<RouteVariant[]>> {
  const { data } = await api.get(`/registry/corridors/${corridorId}/variants`);
  return data;
}

export async function updateRouteVariant(
  variantId: string,
  payload: Partial<Pick<RouteVariant, "name" | "type" | "distanceKm" | "durationMinutes" | "status">>,
): Promise<RegistryResponse<RouteVariant>> {
  const { data } = await api.patch(`/registry/variants/${variantId}`, payload);
  return data;
}

export async function removeRouteVariant(variantId: string): Promise<RegistryResponse<void>> {
  const { data } = await api.delete(`/registry/variants/${variantId}`);
  return data;
}

// Variant-draft endpoints are intentionally isolated here. The wizard owns this
// workflow; it does not reuse the retired discovery API or browser routing.
export async function createVariantDraft(
  corridorId: string,
  input: CreateVariantDraftInput,
): Promise<RegistryResponse<VariantDraft>> {
  const { data } = await api.post(`/registry/corridors/${corridorId}/variant-drafts`, input);
  return data;
}

export async function getVariantDraft(draftId: string): Promise<RegistryResponse<VariantDraft>> {
  const { data } = await api.get(`/registry/variant-drafts/${draftId}`, {
    params: { includeRouteGeometry: true },
  });
  return data;
}

export async function refreshVariantDraftRoutes(
  draftId: string,
  input: { viaStopIds?: string[]; viaPlaceIds?: string[] } = {},
): Promise<RegistryResponse<VariantDraft>> {
  const { data } = await api.post(`/registry/variant-drafts/${draftId}/route-options`, input);
  return data;
}

export async function searchVariantDraftGuidancePlaces(
  draftId: string,
  query: string,
): Promise<RegistryResponse<RouteGuidancePlace[]>> {
  try {
    const { data } = await api.get(`/registry/variant-drafts/${draftId}/guidance-places`, {
      params: { q: query },
    });
    return data;
  } catch (error: unknown) {
    workflowError(error, "Unable to search Google places for route guidance.");
  }
}

export async function selectVariantDraftRoute(
  draftId: string,
  routeOptionId: string,
): Promise<RegistryResponse<VariantDraft>> {
  const { data } = await api.patch(`/registry/variant-drafts/${draftId}/select-route`, { routeOptionId });
  return data;
}

export async function updateVariantDraftDetails(
  draftId: string,
  input: UpdateVariantDetailsInput,
): Promise<RegistryResponse<VariantDraft>> {
  const { data } = await api.patch(`/registry/variant-drafts/${draftId}/details`, input);
  return data;
}

export async function discoverVariantDraftStopCandidates(draftId: string): Promise<RegistryResponse<VariantDraft>> {
  const { data } = await api.post(`/registry/variant-drafts/${draftId}/stop-candidates`);
  return data;
}

export async function resolveVariantDraftStopCandidate(
  draftId: string,
  candidateId: string,
  payload: ResolveVariantStopCandidateInput,
): Promise<RegistryResponse<VariantDraft>> {
  try {
    const { data } = await api.patch(`/registry/variant-drafts/${draftId}/stop-candidates/${candidateId}`, payload);
    return data;
  } catch (error: unknown) {
    workflowError(error, "Unable to update this route-stop decision.");
  }
}

export async function applyAllMatchedVariantDraftStopCandidates(
  draftId: string,
): Promise<RegistryResponse<VariantDraft>> {
  try {
    const { data } = await api.patch(
      `/registry/variant-drafts/${draftId}/stop-candidates/use-existing`,
    );
    return data;
  } catch (error: unknown) {
    workflowError(error, "Unable to select the existing Stop matches.");
  }
}

export async function commitVariantDraft(draftId: string): Promise<RegistryResponse<VariantDraft>> {
  try {
    const { data } = await api.post(
      `/registry/variant-drafts/${draftId}/commit`,
      undefined,
      { timeout: 30_000 },
    );
    return data;
  } catch (error: unknown) {
    workflowError(error, "Unable to save this route path.");
  }
}

export async function activateVariantDraft(draftId: string): Promise<RegistryResponse<RouteVariant>> {
  const { data } = await api.post(`/registry/variant-drafts/${draftId}/activate`);
  return data;
}
