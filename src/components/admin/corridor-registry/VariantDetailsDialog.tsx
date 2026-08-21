import { useState } from "react";
import {
  Building2,
  Bus,
  GitBranch,
  History,
  Loader2,
  MapPin,
  Pencil,
  PencilLine,
  Play,
  RotateCcw,
  Route,
  Trash2,
  X,
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  activateVariantDraft,
  createRouteVariantRevision,
  deleteHistoricalRevision,
  getRouteVariantDetails,
  putVariantStops,
  rollbackVariantRevision,
  type CorridorStop,
  type HistoricalRevision,
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
  onStopsUpdated: (updatedVariant?: RouteVariant) => void;
}) {
  const [activeTab, setActiveTab] = useState("stops");
  const [editMode, setEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveErrorIsInfo, setSaveErrorIsInfo] = useState(false);
  const [confirmingActive, setConfirmingActive] = useState<StopSequenceEntry[] | null>(null);

  // Rollback confirmation state
  const [rollbackTarget, setRollbackTarget] = useState<HistoricalRevision | null>(null);
  // Delete revision confirmation state
  const [deleteTarget, setDeleteTarget] = useState<HistoricalRevision | null>(null);

  const currentVariantId = variant?._id;

  const query = useQuery({
    queryKey: ["route-variant-details", currentVariantId],
    queryFn: () => getRouteVariantDetails(currentVariantId || ""),
    enabled: open && Boolean(currentVariantId),
  });
  const details = query.data?.data;
  const current = details?.variant || variant;

  const rollbackMutation = useMutation({
    mutationFn: (targetId: string) => rollbackVariantRevision(targetId),
    onSuccess: (res) => {
      toast.success("Route rolled back successfully to previous version.");
      setRollbackTarget(null);
      void query.refetch();
      if (res?.data?.variant) {
        onStopsUpdated(res.data.variant);
      }
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to rollback route.");
    },
  });

  const deleteRevisionMutation = useMutation({
    mutationFn: (targetId: string) => deleteHistoricalRevision(targetId),
    onSuccess: (res) => {
      toast.success(res?.data?.message || "Revision deleted.");
      setDeleteTarget(null);
      void query.refetch();
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to delete revision.");
    },
  });

  function closeEdit() {
    setEditMode(false);
    setSaveError(null);
    setSaveErrorIsInfo(false);
    setConfirmingActive(null);
  }

  function handleDialogClose(isOpen: boolean) {
    if (!isOpen) {
      closeEdit();
      setRollbackTarget(null);
      setDeleteTarget(null);
    }
    onOpenChange(isOpen);
  }

  async function applyEditOnDraft(stops: StopSequenceEntry[]) {
    if (!details) return;
    setIsSaving(true);
    setSaveError(null);
    setSaveErrorIsInfo(false);
    try {
      await putVariantStops(details.variant._id, stops);
      await query.refetch();
      onStopsUpdated(details.variant);
      closeEdit();
    } catch (error: unknown) {
      setSaveError(error instanceof Error ? error.message : "Unable to save the updated stop sequence.");
    } finally {
      setIsSaving(false);
    }
  }

  async function applyEditOnActive(stops: StopSequenceEntry[]) {
    setConfirmingActive(stops);
  }

  async function confirmActiveEdit() {
    if (!details || !confirmingActive) return;
    setIsSaving(true);
    setSaveError(null);
    setSaveErrorIsInfo(false);
    try {
      const revisionResponse = await createRouteVariantRevision(details.variant._id);
      const revision = revisionResponse.data.variant;
      const revisionId = revision._id;

      await putVariantStops(revisionId, confirmingActive);

      let activatedVariant = revision;
      try {
        const activateRes = await activateVariantDraft(revisionId);
        if (activateRes?.data) activatedVariant = activateRes.data;
      } catch (activationError: unknown) {
        const msg = activationError instanceof Error ? activationError.message : "";
        setSaveError(
          "Your stop changes were saved in a revision draft, but the route family was not activated. " +
          (msg || "Open the saved draft, resolve its activation requirements, and try again.")
        );
        setSaveErrorIsInfo(true);
        await query.refetch();
        onStopsUpdated(revision);
        setConfirmingActive(null);
        setEditMode(false);
        return;
      }

      onStopsUpdated(activatedVariant);
      closeEdit();
    } catch (error: unknown) {
      setSaveError(error instanceof Error ? error.message : "Unable to apply the route change.");
    } finally {
      setIsSaving(false);
    }
  }

  const isActive = details?.variant.status === "ACTIVE";
  const isDraft = details?.variant.status === "DRAFT";
  const isRevisionDraft = Boolean(isDraft && details?.variant.revisionOfVariantId);
  const referencingBrands = details?.referencingBrands || [];
  const revisionHistory = details?.revisionHistory || [];

  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogClose}>
        <DialogContent className="max-h-[88vh] max-w-3xl overflow-y-auto border-white/10 bg-[#101010] text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitBranch className="size-5 text-[#D3D925]" />
              <span>{current?.name || "Route path"}</span>
              {current?.revisionNumber && current.revisionNumber > 1 && (
                <span className="rounded bg-[#D3D925]/15 px-2 py-0.5 text-xs font-bold text-[#D3D925]">
                  v{current.revisionNumber}
                </span>
              )}
            </DialogTitle>
            <DialogDescription className="text-white/45">
              {current?.code} · {current?.direction} · {isRevisionDraft ? "Pending paired revision" : `Status: ${current?.status}`}
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
              {/* Quick Metrics */}
              <div className="grid gap-3 sm:grid-cols-4">
                <Metric label="Status" value={details.variant.status} />
                <Metric label="Distance" value={details.variant.distanceKm ? `${details.variant.distanceKm} km` : "Pending"} />
                <Metric label="Duration" value={details.variant.durationMinutes ? `${details.variant.durationMinutes} min` : "Pending"} />
                <Metric label="Active Schedules" value={String(details.activeScheduleCount || 0)} />
              </div>

              {isRevisionDraft && (
                <section className="rounded-xl border border-[#D3D925]/20 bg-[#D3D925]/[0.05] p-4">
                  <p className="text-sm font-bold text-[#D3D925]">Revision workspace · v{details.variant.revisionNumber || 2}</p>
                  <p className="mt-1 text-xs leading-5 text-white/55">
                    Review and edit the existing route directly here. Forward and return drafts are one revision unit, and the current live pair remains unchanged until you activate this revision.
                  </p>
                </section>
              )}

              {/* Tabs Navigation */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 border border-white/10 bg-white/[0.03]">
                  <TabsTrigger value="stops" className="flex items-center gap-1.5 text-xs font-semibold data-[state=active]:bg-[#D3D925] data-[state=active]:text-black">
                    <Route className="size-3.5" />
                    <span>Route Stops ({details.stops.length})</span>
                  </TabsTrigger>
                  <TabsTrigger value="fleet" className="flex items-center gap-1.5 text-xs font-semibold data-[state=active]:bg-[#D3D925] data-[state=active]:text-black">
                    <Bus className="size-3.5" />
                    <span>Operating Fleet ({referencingBrands.length})</span>
                  </TabsTrigger>
                  <TabsTrigger value="history" className="flex items-center gap-1.5 text-xs font-semibold data-[state=active]:bg-[#D3D925] data-[state=active]:text-black">
                    <History className="size-3.5" />
                    <span>Revision History ({revisionHistory.length})</span>
                  </TabsTrigger>
                </TabsList>

                {/* TAB 1: Route Stops */}
                <TabsContent value="stops" className="mt-4 space-y-4">
                  <section className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <h4 className="font-bold text-white">Canonical route stops</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-white/40">{details.stops.length} stops</span>
                        {(isActive || isRevisionDraft) && details.stops.length >= 2 && !editMode && (
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
                      <div className={`mt-3 rounded-lg border px-3 py-2 text-xs ${
                        saveErrorIsInfo
                          ? "border-sky-400/20 bg-sky-400/[0.06] text-sky-200"
                          : "border-red-400/20 bg-red-400/[0.06] text-red-200"
                      }`}>
                        {saveError}
                      </div>
                    )}

                    {confirmingActive && (
                      <div className="mt-4 rounded-xl border border-amber-300/25 bg-amber-300/[0.06] p-4">
                        <p className="text-sm font-semibold text-amber-100">Apply stop changes to live route?</p>
                        <p className="mt-1 text-xs leading-5 text-amber-100/60">
                          This will create a safe revision draft with your changes, update the return route sequence, and immediately activate it. The current live route is safely preserved in Revision History.
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
                        {(isActive || isRevisionDraft) && (
                          <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-300/20 bg-amber-300/[0.05] px-3 py-2 text-xs leading-5 text-amber-200/80">
                            <MapPin className="mt-0.5 size-3.5 shrink-0 text-amber-300" />
                            {isRevisionDraft
                              ? "You are editing a pending revision. Its paired direction is synchronized automatically; the live route remains unchanged until activation."
                              : "Changes to a live route are applied via a safe revision. The existing live route remains unchanged until you confirm."}
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
                                <p className="text-sm font-semibold text-white">{row.stopId?.name || "Missing Stop"}</p>
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
                </TabsContent>

                {/* TAB 2: Operating Fleet & Brands */}
                <TabsContent value="fleet" className="mt-4 space-y-4">
                  <section className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="font-bold text-white">Referencing Operator Brands &amp; Fleets</h4>
                      <span className="text-xs text-white/40">{referencingBrands.length} brands</span>
                    </div>

                    {referencingBrands.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-xs text-white/40">
                        <Building2 className="mx-auto mb-2 size-6 text-white/20" />
                        No bus owners or travel brands are currently operating on this route variant.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {referencingBrands.map((brand) => (
                          <div key={brand._id} className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <div className="flex size-8 items-center justify-center rounded-lg bg-[#D3D925]/10 font-bold text-[#D3D925]">
                                  {brand.brandName.charAt(0)}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-white">{brand.brandName}</p>
                                  <p className="text-[11px] text-white/40">{brand.brandCode} {brand.contactPhone ? `· ${brand.contactPhone}` : ""}</p>
                                </div>
                              </div>
                              <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white/70">
                                {brand.buses.length} {brand.buses.length === 1 ? "bus" : "buses"} assigned
                              </span>
                            </div>

                            {brand.buses.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-1.5 border-t border-white/5 pt-2.5">
                                {brand.buses.map((bus) => (
                                  <span key={bus._id} className="inline-flex items-center gap-1 rounded border border-white/10 bg-black/30 px-2 py-1 text-[11px] font-medium text-white/80">
                                    <Bus className="size-3 text-[#D3D925]" />
                                    {bus.busNumber}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                </TabsContent>

                {/* TAB 3: Revision History */}
                <TabsContent value="history" className="mt-4 space-y-4">
                  <section className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-white">Route Revision History</h4>
                        <p className="text-xs text-white/40">Past versions of this route path. Restore previous stops or remove unused revisions.</p>
                      </div>
                      <span className="text-xs text-white/40">{revisionHistory.length} previous version{revisionHistory.length === 1 ? "" : "s"}</span>
                    </div>

                    {revisionHistory.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-xs text-white/40">
                        <History className="mx-auto mb-2 size-6 text-white/20" />
                        This is the initial version (v{details.variant.revisionNumber || 1}). When you edit and activate new revisions, prior versions will be archived here.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {revisionHistory.map((rev) => (
                          <div key={rev._id} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] p-3 transition hover:border-white/20 hover:bg-white/[0.04]">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="rounded bg-white/10 px-1.5 py-0.5 text-[11px] font-bold text-white">
                                  v{rev.revisionNumber || 1}
                                </span>
                                <span className="text-xs font-semibold text-white/70">{rev.code}</span>
                                <span className="rounded-full bg-white/5 px-2 py-0.5 text-[9px] font-semibold uppercase text-white/40">
                                  {rev.status}
                                </span>
                              </div>
                              <p className="mt-1 text-xs text-white/40">
                                {rev.stopCount} stops · {rev.distanceKm ? `${rev.distanceKm} km` : "—"} · {rev.durationMinutes ? `${rev.durationMinutes} min` : "—"}
                              </p>
                              {rev.createdAt && (
                                <p className="mt-0.5 text-[10px] text-white/25">
                                  Created {new Date(rev.createdAt).toLocaleDateString()}
                                  {rev.createdBy?.name ? ` by ${rev.createdBy.name}` : ""}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => setRollbackTarget(rev)}
                                className="h-7 gap-1 border-white/15 px-2.5 text-[11px] font-semibold text-white hover:bg-white/10 hover:text-white"
                              >
                                <RotateCcw className="size-3 text-[#D3D925]" />
                                Rollback
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => setDeleteTarget(rev)}
                                className="h-7 p-1.5 text-white/30 hover:bg-red-500/10 hover:text-red-300"
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                </TabsContent>
              </Tabs>

              {/* Bottom action row */}
              {!editMode && !confirmingActive && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 p-4">
                  <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 size-4 text-white/35" />
                    <p className="max-w-lg text-xs leading-5 text-white/45">
                      {isRevisionDraft
                        ? "This pending revision belongs to the existing live route; it is not a new route setup. Activating it replaces both directions together."
                        : "Live route definitions are preserved. Editing creates a safe revision draft, synchronizing reciprocal return sequences and keeping audit history intact."}
                    </p>
                  </div>
                  {isRevisionDraft ? (
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setEditMode(true)} className="border-white/15 text-white">
                        <Pencil className="mr-2 size-4" />Edit revision
                      </Button>
                      <Button onClick={() => onActivate(details.variant)} className="bg-[#D3D925] font-bold text-black hover:bg-[#D9CD25]">
                        <Play className="mr-2 size-4" />Activate revision
                      </Button>
                    </div>
                  ) : isDraft ? (
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
                  ) : isActive ? (
                    <Button onClick={() => onRevise(details.variant)} className="bg-[#D3D925] font-bold text-black hover:bg-[#D9CD25]">
                      <Pencil className="mr-2 size-4" />Revise route
                    </Button>
                  ) : (
                    <p className="text-xs text-white/45">Historical versions are restored from Revision History; only the current active route can be revised.</p>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Rollback Confirmation Modal */}
      <Dialog open={Boolean(rollbackTarget)} onOpenChange={(o) => !o && setRollbackTarget(null)}>
        <DialogContent className="border-white/10 bg-[#111] text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="size-5 text-[#D3D925]" />
              Rollback to v{rollbackTarget?.revisionNumber || 1}?
            </DialogTitle>
            <DialogDescription className="text-white/50">
              This will restore the {rollbackTarget?.stopCount} stops and travel timings from revision v{rollbackTarget?.revisionNumber}.
              A fresh active revision will be created, companion return stops will update automatically, and active fleet configurations will migrate seamlessly.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setRollbackTarget(null)}
              className="border-white/15 text-white"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={rollbackMutation.isPending}
              onClick={() => rollbackTarget && rollbackMutation.mutate(rollbackTarget._id)}
              className="bg-[#D3D925] font-bold text-black hover:bg-[#D9CD25]"
            >
              {rollbackMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Confirm rollback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete/Archive Revision Confirmation Modal */}
      <Dialog open={Boolean(deleteTarget)} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="border-white/10 bg-[#111] text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <Trash2 className="size-5" />
              Delete revision v{deleteTarget?.revisionNumber || 1}?
            </DialogTitle>
            <DialogDescription className="text-white/50">
              If this historical version has zero completed trips, it will be permanently deleted. If historical trips reference it, it will be archived to preserve passenger ticket records.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              className="border-white/15 text-white"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteRevisionMutation.isPending}
              onClick={() => deleteTarget && deleteRevisionMutation.mutate(deleteTarget._id)}
            >
              {deleteRevisionMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Delete revision
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
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
