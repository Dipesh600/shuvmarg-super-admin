import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Route } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  activateVariantDraft,
  createRouteVariantRevision,
  createRouteCorridor,
  listCorridorVariants,
  listCorridors,
  listRegistryStops,
  removeRouteCorridor,
  removeRouteVariant,
  updateRouteCorridor,
  type RouteCorridor,
  type RouteVariant,
  type VariantDirection,
} from "@/api/corridorWorkflowApi";
import { CorridorCreateDialog } from "./CorridorCreateDialog";
import { CorridorDetailPanel } from "./CorridorDetailPanel";
import { CorridorExplorer } from "./CorridorExplorer";
import { VariantDraftWizard } from "./VariantDraftWizard";
import { VariantDetailsDialog } from "./VariantDetailsDialog";

interface ApiError {
  response?: {
    data?: {
      code?: string;
      message?: string;
      details?: { corridorId?: string };
    };
  };
  message?: string;
}

function messageFor(error: unknown, fallback: string) {
  const apiError = error as ApiError;
  return apiError.response?.data?.message || apiError.message || fallback;
}

export function CorridorWorkspace() {
  const queryClient = useQueryClient();
  const [selectedCorridorId, setSelectedCorridorId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingCorridor, setEditingCorridor] = useState<RouteCorridor | null>(null);
  const [deletingCorridor, setDeletingCorridor] = useState<RouteCorridor | null>(null);
  const [deletingVariant, setDeletingVariant] = useState<RouteVariant | null>(null);
  const [viewingVariant, setViewingVariant] = useState<RouteVariant | null>(null);
  const [wizard, setWizard] = useState<{ open: boolean; corridor: RouteCorridor | null; direction: VariantDirection; draftId: string | null }>({ open: false, corridor: null, direction: "FORWARD", draftId: null });
  const [notes, setNotes] = useState("");

  const corridorsQuery = useQuery({ queryKey: ["corridors"], queryFn: listCorridors });
  const stopsQuery = useQuery({ queryKey: ["stops"], queryFn: listRegistryStops });
  const corridors = useMemo(() => corridorsQuery.data?.data || [], [corridorsQuery.data]);
  const stops = useMemo(() => stopsQuery.data?.data || [], [stopsQuery.data]);
  const selectedCorridor = useMemo(() => corridors.find((corridor) => corridor._id === selectedCorridorId) || null, [corridors, selectedCorridorId]);
  const variantsQuery = useQuery({ queryKey: ["corridor-variants", selectedCorridorId], queryFn: () => listCorridorVariants(selectedCorridorId || ""), enabled: Boolean(selectedCorridorId) });
  const variants = variantsQuery.data?.data || [];

  const createMutation = useMutation({
    mutationFn: createRouteCorridor,
    onSuccess: (response) => {
      void queryClient.invalidateQueries({ queryKey: ["corridors"] });
      setSelectedCorridorId(response.data._id);
      setCreateOpen(false);
      toast.success("Corridor declared as a draft.");
    },
    onError: (error) => {
      const apiError = error as ApiError;
      const existingCorridorId = apiError.response?.data?.details?.corridorId;
      if (apiError.response?.data?.code === "CORRIDOR_PAIR_CONFLICT" && existingCorridorId) {
        setCreateOpen(false);
        setSelectedCorridorId(existingCorridorId);
        toast.info("That direction-neutral corridor already exists. Opened it for you.");
        return;
      }
      toast.error(messageFor(error, "Unable to declare corridor."));
    },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, value }: { id: string; value: string }) => updateRouteCorridor(id, { notes: value.trim() || undefined }),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ["corridors"] }); setEditingCorridor(null); toast.success("Corridor updated."); },
    onError: (error) => toast.error(messageFor(error, "Unable to update corridor.")),
  });
  const deleteCorridorMutation = useMutation({
    mutationFn: removeRouteCorridor,
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ["corridors"] }); setSelectedCorridorId(null); setDeletingCorridor(null); toast.success("Corridor deleted."); },
    onError: (error) => { toast.error(messageFor(error, "Unable to delete corridor.")); setDeletingCorridor(null); },
  });
  const deleteVariantMutation = useMutation({
    mutationFn: removeRouteVariant,
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ["corridor-variants", selectedCorridorId] }); setDeletingVariant(null); toast.success("Route variant deleted."); },
    onError: (error) => { toast.error(messageFor(error, "Unable to delete route variant.")); setDeletingVariant(null); },
  });
  const activateVariantMutation = useMutation({
    mutationFn: activateVariantDraft,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["corridor-variants", selectedCorridorId] });
      void queryClient.invalidateQueries({ queryKey: ["corridors"] });
      toast.success("Route variant activated.");
    },
    onError: (error) => toast.error(messageFor(error, "This draft is not ready to activate yet.")),
  });
  const reviseVariantMutation = useMutation({
    mutationFn: createRouteVariantRevision,
    onSuccess: (response) => {
      const revision = response.data.variant;
      setViewingVariant(null);
      void queryClient.invalidateQueries({ queryKey: ["corridor-variants", selectedCorridorId] });
      if (selectedCorridor) setWizard({ open: true, corridor: selectedCorridor, direction: revision.direction || "FORWARD", draftId: revision._id });
      toast.success("Safe revision draft created. The live route remains unchanged.");
    },
    onError: (error) => toast.error(messageFor(error, "Unable to create a route revision.")),
  });

  const openEditCorridor = () => {
    if (!selectedCorridor) return;
    setNotes(selectedCorridor.notes || "");
    setEditingCorridor(selectedCorridor);
  };
  const openVariantWizard = (direction: VariantDirection) => {
    if (!selectedCorridor) return;
    setWizard({ open: true, corridor: selectedCorridor, direction, draftId: null });
  };
  const resumeVariantDraft = (variant: RouteVariant) => {
    if (!selectedCorridor) return;
    setWizard({ open: true, corridor: selectedCorridor, direction: variant.direction || "FORWARD", draftId: variant._id });
  };
  const closeRouteBuilder = () => setWizard((current) => ({ ...current, open: false }));
  const showRouteBuilder = wizard.open && wizard.corridor;

  return (
    <div className="space-y-5">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><h2 className="flex items-center gap-2 text-2xl font-bold text-white"><Route className="size-5 text-[#D3D925]" />Corridor network</h2><p className="mt-1 max-w-2xl text-sm text-white/50">Declare direction-neutral intercity connections, then build and review one physical route variant per direction.</p></div>
        <Button type="button" onClick={() => setCreateOpen(true)} disabled={stops.length < 2} className="gap-2 bg-[#D3D925] font-bold text-black hover:bg-[#D9CD25]"><Plus className="size-4" />Declare corridor</Button>
      </header>

      {stopsQuery.isLoading ? <div className="flex min-h-80 items-center justify-center rounded-2xl border border-white/10"><Loader2 className="size-5 animate-spin text-[#D3D925]" /></div> : stops.length < 2 ? <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center"><p className="font-semibold text-white/70">Add at least two stops first</p><p className="mt-1 text-sm text-white/40">Corridor endpoints always come from the canonical Stop Registry.</p></div> : corridorsQuery.isError ? <div className="rounded-2xl border border-red-400/20 bg-red-500/5 p-8 text-center"><p className="font-semibold text-red-200">Unable to load corridors</p><Button type="button" size="sm" variant="outline" onClick={() => void corridorsQuery.refetch()} className="mt-3 border-white/15 text-white">Retry</Button></div> : <div className="grid gap-5 xl:grid-cols-[minmax(280px,0.34fr)_minmax(0,1fr)]"><CorridorExplorer corridors={corridors} selectedCorridorId={selectedCorridorId} onSelect={(id) => { closeRouteBuilder(); setSelectedCorridorId(id); }} />{showRouteBuilder ? <VariantDraftWizard corridor={wizard.corridor} stops={stops} open={wizard.open} initialDirection={wizard.direction} initialDraftId={wizard.draftId} onOpenChange={(open) => setWizard((current) => ({ ...current, open }))} onDraftCreated={() => void queryClient.invalidateQueries({ queryKey: ["corridor-variants", selectedCorridorId] })} /> : <CorridorDetailPanel corridor={selectedCorridor} variants={variants} variantsLoading={variantsQuery.isLoading} onStartVariant={openVariantWizard} onEditCorridor={openEditCorridor} onDeleteCorridor={() => selectedCorridor && setDeletingCorridor(selectedCorridor)} onDeleteVariant={setDeletingVariant} onResumeVariant={resumeVariantDraft} onActivateVariant={(variant) => activateVariantMutation.mutate(variant._id)} onViewVariant={setViewingVariant} />}</div>}

      <CorridorCreateDialog open={createOpen} stops={stops} isSaving={createMutation.isPending} onOpenChange={setCreateOpen} onSubmit={(input) => createMutation.mutate(input)} />
      <VariantDetailsDialog variant={viewingVariant} open={Boolean(viewingVariant)} onOpenChange={(open) => !open && setViewingVariant(null)} onRevise={(variant) => reviseVariantMutation.mutate(variant._id)} />

      <Dialog open={Boolean(editingCorridor)} onOpenChange={(open) => !open && setEditingCorridor(null)}><DialogContent className="border-white/10 bg-[#111] text-white"><DialogHeader><DialogTitle>Edit corridor note</DialogTitle><DialogDescription className="text-white/45">Endpoints stay immutable. Variants supply the actual roads and stop sequence.</DialogDescription></DialogHeader><div className="space-y-2"><Label className="text-xs font-semibold text-white/65">Operating note</Label><Textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="border-white/10 bg-white/[0.04] text-white" /></div><DialogFooter><Button type="button" variant="outline" onClick={() => setEditingCorridor(null)} className="border-white/15 text-white">Cancel</Button><Button type="button" disabled={!editingCorridor || updateMutation.isPending} onClick={() => editingCorridor && updateMutation.mutate({ id: editingCorridor._id, value: notes })} className="bg-[#D3D925] font-bold text-black hover:bg-[#D9CD25]">{updateMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}Save</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={Boolean(deletingCorridor)} onOpenChange={(open) => !open && setDeletingCorridor(null)}><DialogContent className="border-white/10 bg-[#111] text-white"><DialogHeader><DialogTitle>Delete corridor?</DialogTitle><DialogDescription className="text-white/45">A truly empty corridor can be deleted even if its status is stale. Existing drafts, operational variants, or fleet references must be handled first.</DialogDescription></DialogHeader><DialogFooter><Button type="button" variant="outline" onClick={() => setDeletingCorridor(null)} className="border-white/15 text-white">Cancel</Button><Button type="button" variant="destructive" disabled={!deletingCorridor || deleteCorridorMutation.isPending} onClick={() => deletingCorridor && deleteCorridorMutation.mutate(deletingCorridor._id)}>{deleteCorridorMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}Delete corridor</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={Boolean(deletingVariant)} onOpenChange={(open) => !open && setDeletingVariant(null)}><DialogContent className="border-white/10 bg-[#111] text-white"><DialogHeader><DialogTitle>Delete route draft?</DialogTitle><DialogDescription className="text-white/45">Only an unused draft can be permanently deleted. Operational variants remain preserved for route and booking history.</DialogDescription></DialogHeader><DialogFooter><Button type="button" variant="outline" onClick={() => setDeletingVariant(null)} className="border-white/15 text-white">Cancel</Button><Button type="button" variant="destructive" disabled={!deletingVariant || deletingVariant.status !== "DRAFT" || deleteVariantMutation.isPending} onClick={() => deletingVariant?.status === "DRAFT" && deleteVariantMutation.mutate(deletingVariant._id)}>{deleteVariantMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}Delete draft</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
}
