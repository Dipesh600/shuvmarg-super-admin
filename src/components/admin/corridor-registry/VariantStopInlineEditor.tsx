import { useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  GripVertical,
  Loader2,
  MapPin,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CorridorStop, StopSequenceEntry, VariantRouteStop } from "@/api/corridorWorkflowApi";

interface EditableStop {
  stopId: string;
  stopCode: string;
  name: string;
  district?: string | null;
  province?: string | null;
  isTerminal: boolean;
  distanceFromOriginKm: number | null;
  durationFromOriginMins: number | null;
  isMajor: boolean;
  /** inserted by user during this edit session — may lack distance/duration */
  isInserted?: boolean;
}

interface VariantStopInlineEditorProps {
  initialStops: VariantRouteStop[];
  allRegistryStops: CorridorStop[];
  isSaving: boolean;
  onSave: (stops: StopSequenceEntry[]) => void;
  onDiscard: () => void;
}

function stopToEditable(row: VariantRouteStop, isTerminal: boolean): EditableStop {
  return {
    stopId: row.stopId._id,
    stopCode: row.stopId.code,
    name: row.stopId.name,
    district: row.stopId.district,
    province: row.stopId.province,
    isTerminal,
    distanceFromOriginKm: row.distanceFromOriginKm ?? null,
    durationFromOriginMins: row.durationFromOriginMins ?? null,
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

  const [stops, setStops] = useState<EditableStop[]>(() =>
    initialStops.map((row, i) =>
      stopToEditable(row, row.stopId._id === originId || row.stopId._id === destinationId)
    )
  );
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
      .slice(0, 12);
  }, [allRegistryStops, existingStopIds, searchQuery]);

  const changes = useMemo(() => diff(initialStops, stops), [initialStops, stops]);
  const hasChanges = changes.removed > 0 || changes.added > 0 || changes.reordered;

  function move(index: number, direction: -1 | 1) {
    const next = [...stops];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    if (next[target].isTerminal || next[index].isTerminal) return;
    [next[index], next[target]] = [next[target], next[index]];
    setStops(next);
  }

  function remove(index: number) {
    if (stops[index].isTerminal) return;
    setStops(stops.filter((_, i) => i !== index));
  }

  function openInsert(afterIndex: number) {
    setInsertAtIndex(afterIndex);
    setSearchQuery("");
    setTimeout(() => searchRef.current?.focus(), 50);
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
      distanceFromOriginKm: null,
      durationFromOriginMins: null,
      isMajor: true,
      isInserted: true,
    };
    const next = [...stops];
    next.splice(insertAtIndex + 1, 0, newStop);
    setStops(next);
    setInsertAtIndex(null);
    setSearchQuery("");
  }

  function buildPayload(): StopSequenceEntry[] {
    return stops.map((s, i) => ({
      stopCode: s.stopCode,
      sequence: i + 1,
      isMajor: s.isMajor,
      distanceFromOriginKm: s.distanceFromOriginKm,
      durationFromOriginMins: s.durationFromOriginMins,
    }));
  }

  return (
    <div className="space-y-2">
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
          <span className="text-amber-200/50">—</span>
          <span className="text-amber-200/60">unsaved</span>
        </div>
      )}

      {/* Stop list */}
      <div className="space-y-0">
        {stops.map((stop, index) => {
          const isFirst = index === 0;
          const isLast = index === stops.length - 1;
          const canMoveUp = !stop.isTerminal && index > 1;
          const canMoveDown = !stop.isTerminal && index < stops.length - 2;
          const showInsertButton = !isLast && insertAtIndex !== index;

          return (
            <div key={`${stop.stopId}-${index}`}>
              {/* Stop row */}
              <article
                className={`group grid grid-cols-[28px_1fr_auto] gap-3 rounded-xl px-3 py-3 transition ${
                  stop.isTerminal
                    ? "border border-[#D3D925]/20 bg-[#D3D925]/[0.04]"
                    : stop.isInserted
                    ? "border border-sky-400/20 bg-sky-400/[0.04]"
                    : "border border-transparent hover:border-white/10 hover:bg-white/[0.02]"
                } ${index > 0 ? "mt-1" : ""}`}
              >
                {/* Sequence / grip */}
                <div className="flex flex-col items-center gap-0.5 pt-0.5">
                  <span className="flex size-5 items-center justify-center rounded-full bg-white/10 text-[9px] font-bold text-white/60">
                    {index + 1}
                  </span>
                  {!isLast && <span className="w-px flex-1 bg-white/10" />}
                </div>

                {/* Stop info */}
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-sm font-semibold text-white">
                    {stop.name}
                    {stop.isTerminal && (
                      <span className="rounded-full bg-[#D3D925]/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#D3D925]">
                        {isFirst ? "Origin" : "Destination"}
                      </span>
                    )}
                    {stop.isInserted && (
                      <span className="rounded-full bg-sky-400/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-sky-300">
                        New
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-white/40">
                    {[stop.district, stop.province].filter(Boolean).join(" · ") || stop.stopCode}
                    {stop.distanceFromOriginKm != null && (
                      <span className="ml-2 text-white/25">{stop.distanceFromOriginKm} km</span>
                    )}
                    {stop.isInserted && stop.distanceFromOriginKm == null && (
                      <span className="ml-2 italic text-amber-300/60">timing pending</span>
                    )}
                  </p>
                </div>

                {/* Controls */}
                <div className="flex items-start gap-1 pt-0.5">
                  {!stop.isTerminal && (
                    <>
                      <button
                        type="button"
                        aria-label="Move up"
                        disabled={!canMoveUp || isSaving}
                        onClick={() => move(index, -1)}
                        className="rounded p-1 text-white/30 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-25"
                      >
                        <ArrowUp className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label="Move down"
                        disabled={!canMoveDown || isSaving}
                        onClick={() => move(index, 1)}
                        className="rounded p-1 text-white/30 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-25"
                      >
                        <ArrowDown className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Remove ${stop.name}`}
                        disabled={isSaving}
                        onClick={() => remove(index)}
                        className="rounded p-1 text-white/25 hover:bg-red-400/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-25"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </>
                  )}
                  {stop.isTerminal && (
                    <span className="mt-0.5 rounded p-1 text-white/20">
                      <GripVertical className="size-3.5" />
                    </span>
                  )}
                </div>
              </article>

              {/* Insert between stops */}
              {showInsertButton && (
                <div className="relative my-0.5 flex items-center justify-center">
                  {insertAtIndex === index ? (
                    /* Search panel */
                    <div className="w-full rounded-xl border border-sky-400/25 bg-[#0f1823] p-3 shadow-lg">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex flex-1 items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-2.5 py-1.5">
                          <Search className="size-3.5 shrink-0 text-white/40" />
                          <input
                            ref={searchRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search stops to insert…"
                            className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/30"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => { setInsertAtIndex(null); setSearchQuery(""); }}
                          className="rounded p-1 text-white/35 hover:bg-white/10 hover:text-white"
                        >
                          <X className="size-4" />
                        </button>
                      </div>

                      {filteredRegistry.length === 0 ? (
                        <p className="mt-2 text-center text-xs text-white/35">
                          {searchQuery ? "No matching stops found." : "Type to search the stop registry."}
                        </p>
                      ) : (
                        <div className="mt-2 max-h-48 space-y-0.5 overflow-y-auto">
                          {filteredRegistry.map((s) => (
                            <button
                              key={s._id}
                              type="button"
                              onClick={() => insertStop(s)}
                              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left hover:bg-white/[0.06]"
                            >
                              <MapPin className="size-3.5 shrink-0 text-sky-300/70" />
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
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => openInsert(index)}
                      className="flex items-center gap-1.5 rounded-full border border-dashed border-white/15 px-3 py-1 text-[11px] text-white/30 opacity-0 transition hover:border-sky-400/40 hover:text-sky-300/70 hover:opacity-100 group-hover:opacity-100 focus:opacity-100 disabled:cursor-not-allowed"
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

      {/* Inserted stop timing notice */}
      {stops.some((s) => s.isInserted) && (
        <div className="rounded-lg border border-amber-300/15 bg-amber-300/[0.04] px-3 py-2 text-xs leading-5 text-amber-200/70">
          <strong className="text-amber-200">Timing note:</strong> Newly inserted stops show distance and duration as pending. Update these figures after the route has been reviewed operationally.
        </div>
      )}

      {/* Action row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <Button
          type="button"
          variant="ghost"
          disabled={isSaving}
          onClick={onDiscard}
          className="text-white/50 hover:bg-white/10 hover:text-white"
        >
          Discard changes
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
