import { AdminStop, StopTreeNode, getStopId, getParentStopIdString } from "./stopRegistryTypes";

/**
 * Transforms a flat array of AdminStops into a hierarchical tree array.
 * Robust against self-parenting, circular parent chains, and missing parents (orphans).
 */
export function buildStopTree(stops: AdminStop[]): StopTreeNode[] {
  if (!Array.isArray(stops) || stops.length === 0) return [];

  const stopMap = new Map<string, AdminStop>();
  const childrenMap = new Map<string, AdminStop[]>();

  // 1. Index all stops
  stops.forEach((stop) => {
    const id = getStopId(stop);
    if (id) {
      stopMap.set(id, stop);
    }
  });

  // 2. Build parent -> children relationship
  stops.forEach((stop) => {
    const parentId = getParentStopIdString(stop);
    const stopId = getStopId(stop);

    // If it has a parent and parent exists in dataset and parent is not self
    if (parentId && parentId !== stopId && stopMap.has(parentId)) {
      const existing = childrenMap.get(parentId) || [];
      existing.push(stop);
      childrenMap.set(parentId, existing);
    }
  });

  // Helper recursive tree builder with visited tracking to prevent cycles
  function buildNodes(
    nodeStops: AdminStop[],
    depth: number,
    visited: Set<string>
  ): StopTreeNode[] {
    const sorted = [...nodeStops].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
    );

    return sorted.map((stop) => {
      const stopId = getStopId(stop);
      let childNodes: StopTreeNode[] = [];

      if (stopId && !visited.has(stopId)) {
        const children = childrenMap.get(stopId) || [];
        if (children.length > 0) {
          const nextVisited = new Set(visited).add(stopId);
          childNodes = buildNodes(children, depth + 1, nextVisited);
        }
      }

      return {
        stop,
        children: childNodes,
        depth,
      };
    });
  }

  // 3. Identify Root (Top-Level) Stops and Orphan Stops
  const rootStops: AdminStop[] = [];
  const rootIds = new Set<string>();

  stops.forEach((stop) => {
    const stopId = getStopId(stop);
    const parentId = getParentStopIdString(stop);

    // Root conditions:
    // a. No parent ID specified
    // b. Self-parenting (parentId === stopId)
    // c. Parent ID references a missing stop (orphan)
    if (!parentId || parentId === stopId || !stopMap.has(parentId)) {
      rootStops.push(stop);
      if (stopId) rootIds.add(stopId);
    }
  });

  // Fallback: If no top-level root stops were found but stops exist (pure cycle e.g. A -> B -> A),
  // pick the first stop in each cycle as a root to break the loop safely.
  if (rootStops.length === 0 && stops.length > 0) {
    stops.forEach((stop) => {
      const stopId = getStopId(stop);
      if (stopId && !rootIds.has(stopId)) {
        rootStops.push(stop);
        rootIds.add(stopId);
      }
    });
  }

  return buildNodes(rootStops, 0, new Set<string>());
}

/**
 * Returns immediate child stops for a parent stop ID.
 */
export function getChildStopsForParent(parentId: string, stops: AdminStop[]): AdminStop[] {
  if (!parentId || !Array.isArray(stops)) return [];
  return stops.filter((s) => {
    const pId = getParentStopIdString(s);
    return pId === parentId && getStopId(s) !== parentId;
  }).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Returns parent AdminStop object if found in dataset.
 */
export function findParentStop(stop: AdminStop | null | undefined, stops: AdminStop[]): AdminStop | null {
  const pId = getParentStopIdString(stop);
  if (!pId || !Array.isArray(stops)) return null;
  return stops.find((s) => getStopId(s) === pId) || null;
}

/**
 * Finds all ancestor stop IDs for a given stop ID (useful for expanding tree paths when filtered).
 */
export function getAncestorStopIds(stopId: string, stops: AdminStop[]): Set<string> {
  const ancestorIds = new Set<string>();
  if (!stopId || !Array.isArray(stops)) return ancestorIds;

  const stopMap = new Map<string, AdminStop>();
  stops.forEach((s) => {
    const id = getStopId(s);
    if (id) stopMap.set(id, s);
  });

  let current = stopMap.get(stopId);
  const visited = new Set<string>([stopId]);

  while (current) {
    const parentId = getParentStopIdString(current);
    if (!parentId || visited.has(parentId) || !stopMap.has(parentId)) {
      break;
    }
    ancestorIds.add(parentId);
    visited.add(parentId);
    current = stopMap.get(parentId);
  }

  return ancestorIds;
}

/**
 * Returns set of descendant IDs for a given stop ID (to prevent picking a descendant as parent).
 */
export function getDescendantStopIds(stopId: string, stops: AdminStop[]): Set<string> {
  const descendantIds = new Set<string>();
  if (!stopId || !Array.isArray(stops)) return descendantIds;

  const childrenMap = new Map<string, string[]>();
  stops.forEach((s) => {
    const sId = getStopId(s);
    const pId = getParentStopIdString(s);
    if (pId && sId && pId !== sId) {
      const list = childrenMap.get(pId) || [];
      list.push(sId);
      childrenMap.set(pId, list);
    }
  });

  function collect(id: string) {
    const children = childrenMap.get(id) || [];
    children.forEach((childId) => {
      if (!descendantIds.has(childId)) {
        descendantIds.add(childId);
        collect(childId);
      }
    });
  }

  collect(stopId);
  return descendantIds;
}
