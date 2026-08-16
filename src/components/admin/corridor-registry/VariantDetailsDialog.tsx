import { useState } from "react";
import { GitBranch, Loader2, MapPin, Pencil, PencilLine, Play, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  activateVariantDraft,
  createRouteVariantRevision,
  getRouteVariantDetails,
  putVariantStops,
  type CorridorStop,
  type RouteVariant,
  type StopSequenceEntry,
} from "@/api/corridorWorkflowApi";
import { VariantStopInlineEditor } from "./VariantStopInlineEditor";

export function VariantDetailsDialog({
  variant,
  open,
  allRegistryStops,
  onOpenChange,
  onRevise,
  onResume,
  onActivate,
  onStopsUpdated,
}: {
  variant: RouteVariant | null;
  open: boolean;
  allRegistryStops: CorridorStop[];
  onOpenChange: (open: boolean) => void;
  onRevise: (variant: RouteVariant) => void;
  onResume: (variant: RouteVariant) => void;
  onActivate: (variant: RouteVariant) => void;
  onStopsUpdated: () => void;
}) {
  const [editMode, setEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  // Confirmation step for ACTIVE variant — shows before auto-revision + activate
  const [confirmingActive, setConfirmingActive] = useState<StopSequenceEntry[] | null>(null);

  const query = useQuery({
    queryKey: ["route-variant-details", variant?._id],
    queryFn: () => getRouteVariantDetails(variant?._id || ""),
    enabled: open && Boolean(variant?._id),
  });
  const details = query.data?.data;
  const current = details?.variant || variant;

  function closeEdit() {
    setEditMode(false);
    setSaveError(null);
    setConfirmingActive(null);
  }

  function handleDialogClose(isOpen: boolean) {
    if (!isOpen) closeEdit();
    onOpenChange(isOpen);
  }

  async function applyEditOnDraft(stops: StopSequenceEntry[]) {
    if (!details) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      await putVariantStops(details.variant._id, stops);
      await query.refetch();
      onStopsUpdated();
      closeEdit();
    } catch (error: unknown) {
      setSaveError(error instanceof Error ? error.message : "Unable to save the updated stop sequence.");
    } finally {
      setIsSaving(false);
    }
  }

  async function applyEditOnActive(stops: StopSequenceEntry[]) {
    // Show confirmation before touching the live route
    setConfirmingActive(stops);
  }

  async function confirmActiveEdit() {
    if (!details || !confirmingActive) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      // 1. Create a revision DRAFT (clones stops from current active)
      const revisionResponse = await createRouteVariantRevision(details.variant._id);
      const revisionId = revisionResponse.data.variant._id;
      // 2. Replace the revision's stop sequence with what admin edited
      await putVariantStops(revisionId, confirmingActive);
      // 3. Activate the revision (supersedes the current ACTIVE variant)
      await activateVariantDraft(revisionId);
      await query.refetch();
      onStopsUpdated();
      closeEdit();
    } catch (error: unknown) {
      setSaveError(error instanceof Error ? error.message : "Unable to apply the route change.");
    } finally {
      setIsSaving(false);
    }
  }

  const isActive = details?.variant.status === "ACTIVE";
  const isDraft = details?.variant.status === "DRAFT";

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="max-h-[88vh] max-w-3xl overflow-y-auto border-white/10 bg-[#101010] text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="size-5 text-[#D3D925]" />
            {current?.name || "Route path"}
          </DialogTitle>
          <DialogDescription className="text-white/45">
            {current?.code} · {current?.direction} · revision {current?.revisionNumber || 1}
          </DialogDescription>
        </DialogHeader>

        {query.isLoading ? (
          <div className="flex min-h-56 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-[#D3D925]" />
          </div>
        ) : query.isError ? (
          <div className="rounded-xl border border-red-400/20 bg-red-400/5 p-5 text-sm text-red-200">
            Unable to load this route path.
          </div>
        ) : details && (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <Metric label="Status" value={details.variant.status} />
              <Metric label="Distance" value={details.variant.distanceKm ? `${details.variant.distanceKm} km` : "Pending"} />
              <Metric label="Duration" value={details.variant.durationMinutes ? `${details.variant.durationMinutes} min` : "Pending"} />
            </div>

            {/* Stops section */}
            <section className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
              <div className="flex items-center justify-between gap-3">
                <h4 className="font-bold">Canonical route stops</h4>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/40">{details.stops.length} stops</span>
                  {details.stops.length >= 2 && !editMode && (
                    <button
                      type="button"
                      onClick={() => setEditMode(true)}
                      className="flex items-center gap-1.5 rounded-lg border border-white/15 px-2.5 py-1.5 text-[10px] font-semibold text-white/60 transition hover:border-white/25 hover:bg-white/10 hover:text-white"
                    >
                      <PencilLine className="size-3" />
                      Edit stops
                    </button>
                  )}
                  {editMode && (
                    <button
                      type="button"
                      onClick={closeEdit}
                      disabled={isSaving}
                      className="flex items-center gap-1 rounded-lg border border-white/15 px-2 py-1.5 text-[10px] text-white/40 hover:bg-white/10 hover:text-white disabled:opacity-40"
                    >
                      <X className="size-3" />
                      Cancel
                    </button>
                  )}
                </div>
              </div>

              {saveError && (
                <div className="mt-3 rounded-lg border border-red-400/20 bg-red-400/[0.06] px-3 py-2 text-xs text-red-200">
                  {saveError}
                </div>
              )}

              {/* Active variant — confirm dialog before edit */}
              {confirmingActive && (
                <div className="mt-4 rounded-xl border border-amber-300/25 bg-amber-300/[0.06] p-4">
                  <p className="text-sm font-semibold text-amber-100">Apply stop changes to live route?</p>
                  <p className="mt-1 text-xs leading-5 text-amber-100/60">
                    This will create a safe revision draft with your changes, then immediately activate it. The current live route stays intact until you confirm.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isSaving}
                      onClick={() => setConfirmingActive(null)}
                      className="border-white/15 text-white"
                    >
                      Go back
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={isSaving}
                      onClick={() => void confirmActiveEdit()}
                      className="bg-[#D3D925] font-bold text-black hover:bg-[#D9CD25]"
                    >
                      {isSaving && <Loader2 className="mr-2 size-3.5 animate-spin" />}
                      Confirm &amp; activate revision
                    </Button>
                  </div>
                </div>
              )}

              {!confirmingActive && editMode && details.stops.length >= 2 ? (
                <div className="mt-4">
                  {isActive && (
                    <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-300/20 bg-amber-300/[0.05] px-3 py-2 text-xs leading-5 text-amber-200/80">
                      <MapPin className="mt-0.5 size-3.5 shrink-0 text-amber-300" />
                      Changes to a live route are applied via a safe revision draft. The existing live route remains unchanged until you confirm.
                    </div>
                  )}
                  <VariantStopInlineEditor
                    initialStops={details.stops}
                    allRegistryStops={allRegistryStops}
                    isSaving={isSaving}
                    onSave={isActive ? applyEditOnActive : applyEditOnDraft}
                    onDiscard={closeEdit}
                  />
                </div>
              ) : !confirmingActive && (
                details.stops.length === 0 ? (
                  <div className="mt-4 rounded-lg border border-dashed border-amber-300/20 bg-amber-300/[0.04] p-5 text-center">
                    <p className="text-sm font-semibold text-amber-100/80">Route setup is not finished</p>
                    <p className="mt-1 text-xs leading-5 text-white/40">
                      No canonical route-stop sequence has been saved yet. Resume setup to select a road path and review its stops.
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 space-y-0">
                    {details.stops.map((row, index) => (
                      <div key={row._id} className="grid grid-cols-[34px_1fr_auto] gap-3">
                        <div className="flex flex-col items-center">
                          <span className="flex size-6 items-center justify-center rounded-full border border-[#D3D925]/35 bg-[#D3D925]/10 text-[10px] font-bold text-[#D3D925]">
                            {row.sequence}
                          </span>
                          {index < details.stops.length - 1 && <span className="min-h-8 w-px flex-1 bg-white/10" />}
                        </div>
                        <div className="pb-4">
                          <p className="text-sm font-semibold">{row.stopId?.name || "Missing Stop"}</p>
                          <p className="mt-0.5 text-xs text-white/40">
                            {[row.stopId?.district, row.stopId?.province].filter(Boolean).join(", ") || row.stopId?.code}
                          </p>
                        </div>
                        <div className="pb-4 text-right text-xs text-white/40">
                          {row.distanceFromOriginKm ?? "—"} km<br />{row.durationFromOriginMins ?? 0} min
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </section>

            {/* Bottom action row */}
            {!editMode && !confirmingActive && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 p-4">
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 size-4 text-white/35" />
                  <p className="max-w-lg text-xs leading-5 text-white/45">
                    Live route definitions are read-only. Revision creates a safe draft, preserving this version for fleets, schedules, trips and history.
                  </p>
                </div>
                {isDraft ? (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => onResume(details.variant)} className="border-white/15 text-white">
                      <Pencil className="mr-2 size-4" />Resume setup
                    </Button>
                    {details.stops.length >= 2 && (
                      <Button onClick={() => onActivate(details.variant)} className="bg-[#D3D925] font-bold text-black hover:bg-[#D9CD25]">
                        <Play className="mr-2 size-4" />Activate route
                      </Button>
                    )}
                  </div>
                ) : (
                  <Button onClick={() => onRevise(details.variant)} className="bg-[#D3D925] font-bold text-black hover:bg-[#D9CD25]">
                    <Pencil className="mr-2 size-4" />Revise route
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-white/35">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}
