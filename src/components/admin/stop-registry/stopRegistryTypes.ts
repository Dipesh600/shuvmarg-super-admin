export interface AdminStopParent {
  id?: string;
  _id?: string;
  name: string;
  code?: string;
}

export interface AdminStop {
  id?: string;
  _id?: string;
  code: string;
  name: string;
  type: string;
  province: string | null;
  district: string | null;
  municipality: string | null;
  aliases: string[];
  coordinates?: {
    lat: number | null;
    lng: number | null;
  } | null;
  parentStopId: string | AdminStopParent | null;
  isSearchable: boolean;
  isRouteStop: boolean;
  verificationStatus: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StopTreeNode {
  stop: AdminStop;
  children: StopTreeNode[];
  depth: number;
  isOrphan?: boolean;
}

export interface StopFilterState {
  search: string;
  role: "all" | "searchable" | "route_stop" | "both" | "neither";
  status: "all" | "ACTIVE" | "INACTIVE";
  verification: "all" | "VERIFIED" | "PENDING" | "REJECTED";
  parentRelation: "all" | "top_level" | "child" | "has_children";
}

export interface StopFormState {
  code: string;
  name: string;
  type: string;
  province: string;
  district: string;
  municipality: string;
  aliases: string;
  lat: string;
  lng: string;
  isSearchable: boolean;
  isRouteStop: boolean;
  parentStopId: string;
}

export interface ScanReportSummary {
  total: number;
  new: number;
  skippedCode: number;
  skippedIdentity: number;
  skippedBatch: number;
  invalid: number;
}

export interface BulkStopItem {
  code?: string;
  name: string;
  type?: string;
  province?: string;
  district?: string;
  municipality?: string;
  aliases?: string[];
  coordinates?: { lat: number; lng: number };
  existingStop?: { code?: string; name?: string };
  conflictReason?: string;
  _sourceIndex?: number;
}

export interface BulkStopError {
  index: number | null;
  code?: string;
  message?: string;
  error?: string;
}

export interface ScanReport {
  toInsert: BulkStopItem[];
  duplicateCode: BulkStopItem[];
  duplicateIdentity: BulkStopItem[];
  duplicateWithinBatch: BulkStopItem[];
  invalid: BulkStopError[];
  summary: ScanReportSummary;
}

export function getStopId(stop: AdminStop | null | undefined): string {
  if (!stop) return "";
  return stop._id || stop.id || "";
}

export function getParentStopIdString(stop: AdminStop | null | undefined): string | null {
  if (!stop || !stop.parentStopId) return null;
  if (typeof stop.parentStopId === "string") return stop.parentStopId;
  return stop.parentStopId._id || stop.parentStopId.id || null;
}

export function getParentStopName(stop: AdminStop | null | undefined, allStops: AdminStop[]): string | null {
  if (!stop || !stop.parentStopId) return null;
  if (typeof stop.parentStopId === "object" && stop.parentStopId.name) {
    return stop.parentStopId.name;
  }
  const parentIdStr = getParentStopIdString(stop);
  if (!parentIdStr) return null;
  const found = allStops.find((s) => getStopId(s) === parentIdStr);
  return found ? found.name : null;
}
