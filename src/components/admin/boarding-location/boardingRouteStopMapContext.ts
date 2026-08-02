import type { AdminStop } from "@/components/admin/stop-registry/stopRegistryTypes";

function uniqueParts(values: Array<string | null | undefined>) {
  const seen = new Set<string>();
  return values.flatMap((value) => value?.split(",") || [])
    .map((value) => value.trim()).filter(Boolean).filter((value) => {
      const key = value.toLocaleLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function routeStopLookupQuery(stop: AdminStop) {
  return uniqueParts([
    stop.name, stop.municipality, stop.district, stop.province, "Nepal",
  ]).join(", ");
}

export function boardingPlaceLookupQuery(query: string, stop: AdminStop) {
  return uniqueParts([
    query, stop.municipality, stop.district, stop.province, "Nepal",
  ]).join(", ");
}
