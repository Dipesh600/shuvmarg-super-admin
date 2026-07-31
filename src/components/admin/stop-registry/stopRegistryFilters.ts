import { AdminStop, StopFilterState, getStopId, getParentStopIdString } from "./stopRegistryTypes";

export const DEFAULT_STOP_FILTERS: StopFilterState = {
  search: "",
  role: "all",
  status: "all",
  verification: "all",
  parentRelation: "all",
};

/**
 * Checks if a single stop matches the specified filters.
 */
export function matchesStopCriteria(stop: AdminStop, filters: StopFilterState): boolean {
  // 1. Text Search (name, code, aliases, district, municipality, province)
  if (filters.search.trim()) {
    const q = filters.search.trim().toLowerCase();
    const nameMatch = stop.name ? stop.name.toLowerCase().includes(q) : false;
    const codeMatch = stop.code ? stop.code.toLowerCase().includes(q) : false;
    const provinceMatch = stop.province ? stop.province.toLowerCase().includes(q) : false;
    const districtMatch = stop.district ? stop.district.toLowerCase().includes(q) : false;
    const muniMatch = stop.municipality ? stop.municipality.toLowerCase().includes(q) : false;
    const aliasMatch = Array.isArray(stop.aliases)
      ? stop.aliases.some((a) => typeof a === "string" && a.toLowerCase().includes(q))
      : false;

    if (!nameMatch && !codeMatch && !provinceMatch && !districtMatch && !muniMatch && !aliasMatch) {
      return false;
    }
  }

  // 2. Role filter
  if (filters.role !== "all") {
    if (filters.role === "searchable" && !stop.isSearchable) return false;
    if (filters.role === "route_stop" && !stop.isRouteStop) return false;
    if (filters.role === "both" && (!stop.isSearchable || !stop.isRouteStop)) return false;
    if (filters.role === "neither" && (stop.isSearchable || stop.isRouteStop)) return false;
  }

  // 3. Status filter
  if (filters.status !== "all") {
    const stopStatus = (stop.status || "ACTIVE").toUpperCase();
    if (stopStatus !== filters.status.toUpperCase()) return false;
  }

  // 4. Verification filter
  if (filters.verification !== "all") {
    const stopVer = (stop.verificationStatus || "VERIFIED").toUpperCase();
    if (stopVer !== filters.verification.toUpperCase()) return false;
  }

  return true;
}

/**
 * Filters the list of stops while preserving parent/ancestor records if any of their children match.
 */
export function filterStops(allStops: AdminStop[], filters: StopFilterState): AdminStop[] {
  if (!Array.isArray(allStops) || allStops.length === 0) return [];

  // Index stops and compute parent -> children relationships
  const stopMap = new Map<string, AdminStop>();
  const parentIdSet = new Set<string>();

  allStops.forEach((stop) => {
    const id = getStopId(stop);
    if (id) stopMap.set(id, stop);

    const parentId = getParentStopIdString(stop);
    if (parentId && parentId !== id) {
      parentIdSet.add(parentId);
    }
  });

  // Identify directly matching stops (applying criteria + parentRelation check)
  const directlyMatchingIds = new Set<string>();

  allStops.forEach((stop) => {
    const stopId = getStopId(stop);
    if (!stopId) return;

    if (!matchesStopCriteria(stop, filters)) return;

    // Apply parent relationship filter
    const parentId = getParentStopIdString(stop);
    const isTopLevel = !parentId || parentId === stopId || !stopMap.has(parentId);
    const isChild = !isTopLevel;
    const hasChildren = parentIdSet.has(stopId);

    if (filters.parentRelation !== "all") {
      if (filters.parentRelation === "top_level" && !isTopLevel) return;
      if (filters.parentRelation === "child" && !isChild) return;
      if (filters.parentRelation === "has_children" && !hasChildren) return;
    }

    directlyMatchingIds.add(stopId);
  });

  // Include ancestors of all directly matching stops so the tree structure remains intact
  const finalIncludedIds = new Set<string>(directlyMatchingIds);

  directlyMatchingIds.forEach((matchedId) => {
    let current = stopMap.get(matchedId);
    const visited = new Set<string>([matchedId]);

    while (current) {
      const parentId = getParentStopIdString(current);
      if (!parentId || visited.has(parentId) || !stopMap.has(parentId)) {
        break;
      }
      finalIncludedIds.add(parentId);
      visited.add(parentId);
      current = stopMap.get(parentId);
    }
  });

  return allStops.filter((stop) => {
    const id = getStopId(stop);
    return id ? finalIncludedIds.has(id) : false;
  });
}
