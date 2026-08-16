import { useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Clock,
  GripVertical,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Route,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CorridorStop, StopSequenceEntry, VariantRouteStop } from "@/api/corridorWorkflowApi";

interface EditableStop {
  stopId: string;
  stopCode: string;
  name: string;
  district?: string | null;
  province?: string | null;
  isTerminal: boolean;
  distanceFromOriginKm: number;
  durationFromOriginMins: number;
  isMajor: boolean;
  isInserted?: boolean;
}

interface VariantStopInlineEditorProps {
  initialStops: VariantRouteStop[];
  allRegistryStops: CorridorStop[];
  isSaving: boolean;
  onSave: (stops: StopSequenceEntry[]) => void;
  onDiscard: () => void;
}

/**
 * Ensures distances and durations are strictly non-decreasing along the stop sequence.
 * Linearly interpolates values for newly inserted or reordered stops between known anchor points.
 */
function recalculateMonotonicTimings(rawStops: EditableStop[]): EditableStop[] {
  if (rawStops.length === 0) return rawStops;
  const stops = rawStops.map((s) => ({ ...s }));
  const n = stops.length;

  // Origin is always 0 km and 0 mins
  stops[0].distanceFromOriginKm = 0;
  stops[0].durationFromOriginMins = 0;

  if (n === 1) return stops;

  // Ensure destination terminal has reasonable anchor values
  const last = stops[n - 1];
  if (!last.durationFromOriginMins || last.durationFromOriginMins <= 0) {
    const maxDur = stops.reduce((max, s) => Math.max(max, s.durationFromOriginMins || 0), 0);
    last.durationFromOriginMins = maxDur > 0 ? maxDur + 15 : (n - 1) * 35;
  }
  if (!last.distanceFromOriginKm || last.distanceFromOriginKm <= 0) {
    const maxDist = stops.reduce((max, s) => Math.max(max, s.distanceFromOriginKm || 0), 0);
    last.distanceFromOriginKm = maxDist > 0 ? Math.round((maxDist + 10) * 10) / 10 : (n - 1) * 25;
  }

  // 1. Interpolate Durations (strictly non-decreasing)
  let anchorIdx = 0;
  while (anchorIdx < n - 1) {
    let nextAnchorIdx = n - 1;
    for (let j = anchorIdx + 1; j < n - 1; j++) {
      const val = stops[j].durationFromOriginMins;
      const targetVal = stops[n - 1].durationFromOriginMins;
      // An anchor must be strictly greater than previous anchor and less than or equal to terminal
      if (val > stops[anchorIdx].durationFromOriginMins && val <= targetVal && !stops[j].isInserted) {
        nextAnchorIdx = j;
        break;
      }
    }
    const startDur = stops[anchorIdx].durationFromOriginMins;
    const endDur = stops[nextAnchorIdx].durationFromOriginMins;
    const gap = nextAnchorIdx - anchorIdx;
    for (let k = anchorIdx + 1; k < nextAnchorIdx; k++) {
      const fraction = (k - anchorIdx) / gap;
      stops[k].durationFromOriginMins = Math.round(startDur + fraction * (endDur - startDur));
    }
    anchorIdx = nextAnchorIdx;
  }

  // 2. Interpolate Distances (strictly non-decreasing)
  anchorIdx = 0;
  while (anchorIdx < n - 1) {
    let nextAnchorIdx = n - 1;
    for (let j = anchorIdx + 1; j < n - 1; j++) {
      const val = stops[j].distanceFromOriginKm;
      const targetVal = stops[n - 1].distanceFromOriginKm;
      if (val > stops[anchorIdx].distanceFromOriginKm && val <= targetVal && !stops[j].isInserted) {
        nextAnchorIdx = j;
        break;
      }
    }
    const startDist = stops[anchorIdx].distanceFromOriginKm;
    const endDist = stops[nextAnchorIdx].distanceFromOriginKm;
    const gap = nextAnchorIdx - anchorIdx;
    for (let k = anchorIdx + 1; k < nextAnchorIdx; k++) {
      const fraction = (k - anchorIdx) / gap;
      stops[k].distanceFromOriginKm = Math.round((startDist + fraction * (endDist - startDist)) * 10) / 10;
    }
    anchorIdx = nextAnchorIdx;
  }

  return stops;
}

function stopToEditable(row: VariantRouteStop, isTerminal: boolean): EditableStop {
  return {
    stopId: row.stopId._id,
    stopCode: row.stopId.code,
    name: row.stopId.name,
    district: row.stopId.district,
    province: row.stopId.province,
    isTerminal,
    distanceFromOriginKm: row.distanceFromOriginKm ?? 0,
    durationFromOriginMins: row.durationFromOriginMins ?? 0,
    isMajor: row.isMajor,
    isInserted: false,
  };
}

function diff(original: VariantRouteStop[], current: EditableStop[]) {
  const originalIds = new Set(original.map((s) => s.stopId._id));
  const currentIds = new Set(current.map((s) => s.stopId));
  const removed = original.filter((s) => !currentIds.has(s.stopId._id)).length;
  const added = current.filter((s) => !originalIds.has(s.stopId)).length;
  const reordered = original.some((s, i) => {
    const currentIndex = current.findIndex((c) => c.stopId === s.stopId._id);
    return currentIndex !== -1 && currentIndex !== i;
  });
  return { removed, added, reordered };
}

export function VariantStopInlineEditor({
  initialStops,
  allRegistryStops,
  isSaving,
  onSave,
  onDiscard,
}: VariantStopInlineEditorProps) {
  const originId = initialStops[0]?.stopId._id;
  const destinationId = initialStops.at(-1)?.stopId._id;

  const [stops, setStops] = useState<EditableStop[]>(() => {
    const base = initialStops.map((row) =>
      stopToEditable(row, row.stopId._id === originId || row.stopId._id === destinationId)
    );
    return recalculateMonotonicTimings(base);
  });

  // editingTimingIdx = index of stop currently editing km/mins manually
  const [editingTimingIdx, setEditingTimingIdx] = useState<number | null>(null);
  const [manualDist, setManualDist] = useState("");
  const [manualDur, setManualDur] = useState("");

  // insertAtIndex = index AFTER which we're inserting. null = closed.
  const [insertAtIndex, setInsertAtIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const existingStopIds = useMemo(() => new Set(stops.map((s) => s.stopId)), [stops]);

  const filteredRegistry = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allRegistryStops
      .filter(
        (s) =>
          s.isRouteStop &&
          !existingStopIds.has(s._id) &&
          (q === "" ||
            s.name.toLowerCase().includes(q) ||
            s.code.toLowerCase().includes(q) ||
            (s.district || "").toLowerCase().includes(q))
      )
      .slice(0, 15);
  }, [allRegistryStops, existingStopIds, searchQuery]);

  const changes = useMemo(() => diff(initialStops, stops), [initialStops, stops]);
  const hasChanges = changes.removed > 0 || changes.added > 0 || changes.reordered;

  function move(index: number, direction: -1 | 1) {
    const next = [...stops];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    if (next[target].isTerminal || next[index].isTerminal) return;
    [next[index], next[target]] = [next[target], next[index]];
    setStops(recalculateMonotonicTimings(next));
  }

  function remove(index: number) {
    if (stops[index].isTerminal) return;
    const remaining = stops.filter((_, i) => i !== index);
    setStops(recalculateMonotonicTimings(remaining));
  }

  function openInsert(afterIndex: number) {
    setInsertAtIndex(afterIndex);
    setSearchQuery("");
    setTimeout(() => searchRef.current?.focus(), 60);
  }

  function closeInsert() {
    setInsertAtIndex(null);
    setSearchQuery("");
  }

  function insertStop(registryStop: CorridorStop) {
    if (insertAtIndex === null) return;
    const newStop: EditableStop = {
      stopId: registryStop._id,
      stopCode: registryStop.code,
      name: registryStop.name,
      district: registryStop.district,
      province: registryStop.province,
      isTerminal: false,
      distanceFromOriginKm: 0,
      durationFromOriginMins: 0,
      isMajor: true,
      isInserted: true,
    };
    const next = [...stops];
    next.splice(insertAtIndex + 1, 0, newStop);
    setStops(recalculateMonotonicTimings(next));
    closeInsert();
  }

  function startEditTiming(index: number) {
    setEditingTimingIdx(index);
    setManualDist(String(stops[index].distanceFromOriginKm));
    setManualDur(String(stops[index].durationFromOriginMins));
  }

  function saveManualTiming(index: number) {
    const distNum = parseFloat(manualDist);
    const durNum = parseInt(manualDur, 10);
    if (!isNaN(distNum) && !isNaN(durNum) && distNum >= 0 && durNum >= 0) {
      const next = [...stops];
      next[index] = {
        ...next[index],
        distanceFromOriginKm: Math.round(distNum * 10) / 10,
        durationFromOriginMins: durNum,
        isInserted: false, // treat as user-confirmed anchor
      };
      setStops(next);
    }
    setEditingTimingIdx(null);
  }

  function buildPayload(): StopSequenceEntry[] {
    const normalized = recalculateMonotonicTimings(stops);
    return normalized.map((s, i) => ({
      stopCode: s.stopCode,
      sequence: i + 1,
      isMajor: s.isMajor,
      distanceFromOriginKm: s.distanceFromOriginKm,
      durationFromOriginMins: s.durationFromOriginMins,
    }));
  }

  return (
    <div className="space-y-3">
      {/* Diff summary */}
      {hasChanges && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-amber-300/20 bg-amber-300/[0.05] px-3 py-2 text-xs text-amber-200">
          <CheckCircle2 className="size-3.5 shrink-0 text-amber-300" />
          <span>
            {[
              changes.removed > 0 && `${changes.removed} removed`,
              changes.added > 0 && `${changes.added} added`,
              changes.reordered && "reordered",
            ]
              .filter(Boolean)
              .join(" · ")}
          </span>
          <span className="ml-auto text-amber-200/50 font-mono text-[11px]">Timings auto-adjusted</span>
        </div>
      )}

      {/* Stop list */}
      <div className="space-y-0">
        {stops.map((stop, index) => {
          const isFirst = index === 0;
          const isLast = index === stops.length - 1;
          const canMoveUp = !stop.isTerminal && index > 1;
          const canMoveDown = !stop.isTerminal && index < stops.length - 2;
          const showInsertZone = !isLast;
          const isInsertOpen = insertAtIndex === index;
          const isEditingTiming = editingTimingIdx === index;

          return (
            <div key={`${stop.stopId}-${index}`}>
              {/* ─── Stop row ─── */}
              <div
                className={`grid grid-cols-[28px_1fr_auto] items-start gap-3 rounded-xl px-3 py-3 transition ${
                  stop.isTerminal
                    ? "border border-[#D3D925]/20 bg-[#D3D925]/[0.04]"
                    : stop.isInserted
                    ? "border border-sky-400/25 bg-sky-400/[0.05]"
                    : "border border-transparent hover:border-white/8 hover:bg-white/[0.015]"
                } ${index > 0 ? "mt-1" : ""}`}
              >
                {/* Sequence bubble */}
                <div className="flex flex-col items-center gap-0.5 pt-0.5">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[9px] font-bold text-white/70">
                    {index + 1}
                  </span>
                </div>

                {/* Stop info */}
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-1.5 text-sm font-semibold text-white">
                    {stop.name}
                    {stop.isTerminal && (
                      <span className="rounded-full bg-[#D3D925]/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#D3D925]">
                        {isFirst ? "Origin" : "Destination"}
                      </span>
                    )}
                    {stop.isInserted && (
                      <span className="rounded-full bg-sky-400/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-sky-300">
                        Added
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-white/40">
                    {[stop.district, stop.province].filter(Boolean).join(" · ") || stop.stopCode}
                  </p>

                  {/* Distance & Duration Display / Inline Editing */}
                  {isEditingTiming ? (
                    <div className="mt-2 flex items-center gap-2 rounded-lg border border-white/15 bg-black/40 p-2">
                      <div className="flex items-center gap-1">
                        <Route className="size-3 text-white/40" />
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={manualDist}
                          onChange={(e) => setManualDist(e.target.value)}
                          className="w-16 rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono text-white outline-none focus:ring-1 focus:ring-[#D3D925]"
                          placeholder="km"
                        />
                        <span className="text-[10px] text-white/40">km</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="size-3 text-white/40" />
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={manualDur}
                          onChange={(e) => setManualDur(e.target.value)}
                          className="w-16 rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono text-white outline-none focus:ring-1 focus:ring-[#D3D925]"
                          placeholder="min"
                        />
                        <span className="text-[10px] text-white/40">min</span>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => saveManualTiming(index)}
                        className="h-6 bg-[#D3D925] px-2 text-[10px] font-bold text-black hover:bg-[#D9CD25]"
                      >
                        Set
                      </Button>
                      <button
                        type="button"
                        onClick={() => setEditingTimingIdx(null)}
                        className="rounded p-1 text-white/40 hover:text-white"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="mt-1 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded bg-white/[0.04] px-1.5 py-0.5 text-[11px] font-mono text-white/60">
                        <Route className="size-2.5 text-white/30" />
                        {stop.distanceFromOriginKm} km
                      </span>
                      <span className="inline-flex items-center gap-1 rounded bg-white/[0.04] px-1.5 py-0.5 text-[11px] font-mono text-white/60">
                        <Clock className="size-2.5 text-white/30" />
                        {stop.durationFromOriginMins} min
                      </span>
                      {!isFirst && (
                        <button
                          type="button"
                          onClick={() => startEditTiming(index)}
                          className="text-[10px] text-white/25 hover:text-[#D3D925]"
                          title="Edit timing manually"
                        >
                          <Pencil className="size-2.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Controls */}
                <div className="flex items-center gap-0.5">
                  {stop.isTerminal ? (
                    <GripVertical className="size-4 text-white/15" />
                  ) : (
                    <>
                      <button
                        type="button"
                        aria-label="Move up"
                        disabled={!canMoveUp || isSaving}
                        onClick={() => move(index, -1)}
                        className="rounded p-1 text-white/35 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-20"
                      >
                        <ArrowUp className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label="Move down"
                        disabled={!canMoveDown || isSaving}
                        onClick={() => move(index, 1)}
                        className="rounded p-1 text-white/35 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-20"
                      >
                        <ArrowDown className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Remove ${stop.name}`}
                        disabled={isSaving}
                        onClick={() => remove(index)}
                        className="rounded p-1 text-white/25 transition hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-20"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* ─── Insert zone between stops ─── */}
              {showInsertZone && (
                <div className="my-1 px-2">
                  {isInsertOpen ? (
                    /* Search panel */
                    <div className="rounded-xl border border-sky-400/30 bg-[#0c1620] p-3 shadow-xl">
                      <div className="flex items-center gap-2">
                        <div className="flex flex-1 items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-2.5 py-2">
                          <Search className="size-3.5 shrink-0 text-white/40" />
                          <input
                            ref={insertAtIndex === index ? searchRef : undefined}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search registry stops to insert…"
                            className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/30"
                          />
                          {searchQuery && (
                            <button
                              type="button"
                              onClick={() => setSearchQuery("")}
                              className="text-white/30 hover:text-white"
                            >
                              <X className="size-3.5" />
                            </button>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={closeInsert}
                          className="rounded-lg p-2 text-white/35 hover:bg-white/10 hover:text-white"
                        >
                          <X className="size-4" />
                        </button>
                      </div>

                      {searchQuery.trim() === "" ? (
                        <p className="mt-2 text-center text-xs text-white/30">
                          Type a stop name, code or district to search the registry.
                        </p>
                      ) : filteredRegistry.length === 0 ? (
                        <p className="mt-2 text-center text-xs text-white/30">
                          No matching stops found in registry.
                        </p>
                      ) : (
                        <div className="mt-2 max-h-44 space-y-0.5 overflow-y-auto">
                          {filteredRegistry.map((s) => (
                            <button
                              key={s._id}
                              type="button"
                              onClick={() => insertStop(s)}
                              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition hover:bg-white/[0.07]"
                            >
                              <MapPin className="size-3.5 shrink-0 text-sky-400/70" />
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-white">{s.name}</p>
                                <p className="text-[11px] text-white/40">
                                  {[s.district, s.province].filter(Boolean).join(" · ") || s.code}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Always-visible insert button */
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => openInsert(index)}
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-white/10 py-1 text-[11px] text-white/25 transition hover:border-sky-400/30 hover:bg-sky-400/[0.04] hover:text-sky-300/70 disabled:cursor-not-allowed"
                      aria-label={`Insert stop after ${stop.name}`}
                    >
                      <Plus className="size-3" />
                      Insert stop here
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Action row */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3">
        <Button
          type="button"
          variant="ghost"
          disabled={isSaving}
          onClick={onDiscard}
          className="text-white/45 hover:bg-white/8 hover:text-white"
        >
          Discard
        </Button>
        <Button
          type="button"
          disabled={isSaving || !hasChanges || stops.length < 2}
          onClick={() => onSave(buildPayload())}
          className="bg-[#D3D925] font-bold text-black hover:bg-[#D9CD25] disabled:opacity-40"
        >
          {isSaving && <Loader2 className="mr-2 size-4 animate-spin" />}
          Apply changes
        </Button>
      </div>
    </div>
  );
}
