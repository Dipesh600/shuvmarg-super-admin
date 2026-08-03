import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { getAllStops, createStop, updateStop, deleteStop } from "@/api/platformRegistryApi";
import { getStopId, getParentStopIdString } from "./stopRegistryTypes";
import type { AdminStop, StopFilterState, StopFormState } from "./stopRegistryTypes";
import { buildStopTree, getAncestorStopIds, getChildStopsForParent } from "./stopRegistryTree";
import { filterStops, DEFAULT_STOP_FILTERS } from "./stopRegistryFilters";
import { StopRegistryHeader } from "./StopRegistryHeader";
import { StopRegistryToolbar } from "./StopRegistryToolbar";
import { StopExplorer } from "./StopExplorer";
import { StopInspector } from "./StopInspector";
import { StopEditorSheet } from "./StopEditorSheet";
import { StopEmptyState } from "./StopEmptyState";
import { BulkImportStopsModal } from "./import/BulkImportStopsModal";

interface ApiErrorShape {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

const EMPTY_FORM: StopFormState = {
  code: "",
  name: "",
  type: "CITY",
  province: "",
  district: "",
  municipality: "",
  aliases: "",
  mapSelection: null,
  isSearchable: true,
  isRouteStop: false,
  parentStopId: "none",
};

export const StopRegistryWorkspace: React.FC = () => {
  const qc = useQueryClient();

  // State
  const [filters, setFilters] = useState<StopFilterState>(DEFAULT_STOP_FILTERS);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(new Set());

  // Modal & Sheet state
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [editingStop, setEditingStop] = useState<AdminStop | null>(null);
  const [deletingStop, setDeletingStop] = useState<AdminStop | null>(null);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);

  // Form State
  const [formState, setFormState] = useState<StopFormState>(EMPTY_FORM);

  // Fetch stops
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["stops"],
    queryFn: getAllStops,
  });

  const allStops: AdminStop[] = useMemo(() => {
    return Array.isArray(data?.data) ? (data.data as AdminStop[]) : [];
  }, [data]);

  // Apply filters
  const filteredStops = useMemo(() => {
    return filterStops(allStops, filters);
  }, [allStops, filters]);

  // Build hierarchical tree
  const treeNodes = useMemo(() => {
    return buildStopTree(filteredStops);
  }, [filteredStops]);

  // Auto-expand ancestors when search or active filters are applied
  const hasActiveFilters = useMemo(() => {
    return (
      filters.search.trim().length > 0 ||
      filters.role !== "all" ||
      filters.verification !== "all" ||
      filters.parentRelation !== "all"
    );
  }, [filters]);

  const effectiveExpandedNodeIds = useMemo(() => {
    if (!hasActiveFilters || filteredStops.length === 0) {
      return expandedNodeIds;
    }
    const autoSet = new Set(expandedNodeIds);
    filteredStops.forEach((stop) => {
      const id = getStopId(stop);
      if (id) {
        const ancestorIds = getAncestorStopIds(id, allStops);
        ancestorIds.forEach((aId) => autoSet.add(aId));
      }
    });
    return autoSet;
  }, [hasActiveFilters, filteredStops, allStops, expandedNodeIds]);

  // Maintain selected stop object
  const selectedStop = useMemo(() => {
    if (!selectedStopId) return null;
    return allStops.find((s) => getStopId(s) === selectedStopId) || null;
  }, [selectedStopId, allStops]);

  // Expansion toggle handler
  const handleToggleExpand = (stopId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNodeIds((prev) => {
      const next = new Set(prev);
      if (next.has(stopId)) {
        next.delete(stopId);
      } else {
        next.add(stopId);
      }
      return next;
    });
  };

  // Open Edit Sheet
  const handleOpenEdit = (stop: AdminStop) => {
    setEditingStop(stop);
    const parentId = getParentStopIdString(stop);
    setFormState({
      code: stop.code || "",
      name: stop.name || "",
      type: stop.type || "CITY",
      province: stop.province || "",
      district: stop.district || "",
      municipality: stop.municipality || "",
      aliases: Array.isArray(stop.aliases) ? stop.aliases.join(", ") : "",
      mapSelection:
        Number.isFinite(stop.coordinates?.lat) && Number.isFinite(stop.coordinates?.lng)
          ? {
              coordinates: {
                lat: Number(stop.coordinates?.lat), lng: Number(stop.coordinates?.lng),
              },
              coordinateSource: stop.coordinateSource || "MAP_PIN",
              coordinateAccuracyMeters: stop.coordinateAccuracyMeters ?? null,
              coordinateCapturedAt: stop.coordinateCapturedAt || new Date().toISOString(),
              coordinateProvider: stop.coordinateProvider ?? null,
              coordinatePlaceId: stop.coordinatePlaceId ?? null,
              coordinateSuggestedAddress: stop.coordinateSuggestedAddress ?? null,
            }
          : null,
      isSearchable: stop.isSearchable ?? true,
      isRouteStop: stop.isRouteStop ?? false,
      parentStopId: parentId || "none",
    });
  };

  // Open Add Sheet
  const handleOpenAdd = () => {
    setEditingStop(null);
    setFormState(EMPTY_FORM);
    setIsAddSheetOpen(true);
  };

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: createStop,
    onSuccess: (res: { data?: AdminStop }) => {
      qc.invalidateQueries({ queryKey: ["stops"] });
      toast.success("Stop registered successfully.");
      setIsAddSheetOpen(false);
      setFormState(EMPTY_FORM);
      const newStop = res?.data;
      if (newStop) {
        const newId = getStopId(newStop);
        if (newId) setSelectedStopId(newId);
      }
    },
    onError: (e: unknown) => {
      const err = e as ApiErrorShape;
      const msg = err.response?.data?.message || err.message || "Failed to register stop.";
      toast.error(msg);
    },
  });

  // Edit Mutation
  const editMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      updateStop(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stops"] });
      toast.success("Stop updated successfully.");
      setEditingStop(null);
      setFormState(EMPTY_FORM);
    },
    onError: (e: unknown) => {
      const err = e as ApiErrorShape;
      const msg = err.response?.data?.message || err.message || "Failed to update stop.";
      toast.error(msg);
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteStop(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stops"] });
      toast.success("Stop removed from registry.");
      if (deletingStop && getStopId(deletingStop) === selectedStopId) {
        setSelectedStopId(null);
      }
      setDeletingStop(null);
    },
    onError: (e: unknown) => {
      const err = e as ApiErrorShape;
      const msg = err.response?.data?.message || err.message || "Failed to remove stop.";
      toast.error(msg);
      setDeletingStop(null);
    },
  });

  // Form Submit Handler
  const handleFormSubmit = () => {
    const aliasesArray = formState.aliases
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (!formState.mapSelection) {
      return toast.error("Select the stop position on the map before saving.");
    }

    const payload: Parameters<typeof createStop>[0] = {
      name: formState.name.trim(),
      type: formState.type,
      province: formState.province.trim() || undefined,
      district: formState.district.trim() || undefined,
      municipality: formState.municipality.trim() || undefined,
      aliases: aliasesArray,
      isSearchable: formState.isSearchable,
      isRouteStop: formState.isRouteStop,
      parentStopId: formState.parentStopId === "none" ? null : formState.parentStopId,
      coordinates: formState.mapSelection.coordinates,
      coordinateSource: formState.mapSelection.coordinateSource,
      coordinateAccuracyMeters: formState.mapSelection.coordinateAccuracyMeters,
      coordinateCapturedAt: formState.mapSelection.coordinateCapturedAt,
      coordinateProvider: formState.mapSelection.coordinateProvider,
      coordinatePlaceId: formState.mapSelection.coordinatePlaceId,
      coordinateSuggestedAddress: formState.mapSelection.coordinateSuggestedAddress,
    };

    if (editingStop) {
      const editId = getStopId(editingStop);
      if (editId) {
        editMutation.mutate({
          id: editId,
          payload: {
            ...payload,
          },
        });
      }
    } else {
      if (formState.code.trim()) {
        payload.code = formState.code.trim().toUpperCase();
      }
      createMutation.mutate(payload);
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    setFilters(DEFAULT_STOP_FILTERS);
  };

  // Child count check for deleting stop confirmation warning
  const deletingStopChildren = useMemo(() => {
    if (!deletingStop) return [];
    const delId = getStopId(deletingStop);
    return delId ? getChildStopsForParent(delId, allStops) : [];
  }, [deletingStop, allStops]);

  return (
    <div className="space-y-5 text-white">
      {/* Header */}
      <StopRegistryHeader
        stops={allStops}
        onAddStop={handleOpenAdd}
        onImportStops={() => setIsBulkImportOpen(true)}
      />

      {/* Toolbar */}
      <StopRegistryToolbar
        filters={filters}
        onFilterChange={setFilters}
        onResetFilters={handleResetFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Main Workspace Body */}
      {isLoading ? (
        <StopEmptyState type="loading" />
      ) : isError ? (
        <StopEmptyState
          type="error"
          errorMessage={(error as ApiErrorShape)?.message}
          onRetry={refetch}
        />
      ) : allStops.length === 0 ? (
        <StopEmptyState
          type="no_records"
          onAddStop={handleOpenAdd}
          onImportStops={() => setIsBulkImportOpen(true)}
        />
      ) : filteredStops.length === 0 ? (
        <StopEmptyState
          type="no_filter_match"
          onResetFilters={handleResetFilters}
        />
      ) : (
        /* Target Desktop Split Layout: Explorer (60%) & Inspector (40%) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Explorer Column */}
          <div className="lg:col-span-7 xl:col-span-7">
            <StopExplorer
              treeNodes={treeNodes}
              selectedStopId={selectedStopId}
              expandedNodeIds={effectiveExpandedNodeIds}
              onToggleExpand={handleToggleExpand}
              onSelectStop={(stop) => {
                const sId = getStopId(stop);
                if (sId) setSelectedStopId(sId);
              }}
            />
          </div>

          {/* Inspector Column */}
          <div className="lg:col-span-5 xl:col-span-5">
            <StopInspector
              stop={selectedStop}
              allStops={allStops}
              onEdit={handleOpenEdit}
              onDelete={(stop) => setDeletingStop(stop)}
              onSelectStop={(stopId) => setSelectedStopId(stopId)}
            />
          </div>
        </div>
      )}

      {/* Add / Edit Side Sheet */}
      <StopEditorSheet
        open={isAddSheetOpen || !!editingStop}
        onClose={() => {
          setIsAddSheetOpen(false);
          setEditingStop(null);
          setFormState(EMPTY_FORM);
        }}
        formState={formState}
        onFormChange={setFormState}
        onSubmit={handleFormSubmit}
        isSubmitting={createMutation.isPending || editMutation.isPending}
        editingStop={editingStop}
        allStops={allStops}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingStop} onOpenChange={() => setDeletingStop(null)}>
        <DialogContent
          aria-describedby={undefined}
          className="sm:max-w-[440px] rounded-2xl border-none shadow-2xl p-0 overflow-hidden bg-[#0a0a0a]"
        >
          <div className="bg-[#121212] p-6 text-white text-center border-b border-white/5 space-y-3">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-500">
              <Trash2 className="w-6 h-6" />
            </div>
            <DialogTitle className="text-lg font-bold">Remove Stop Node</DialogTitle>
            <p className="text-white/60 text-xs leading-relaxed">
              Are you sure you want to remove <span className="font-bold text-white">&quot;{deletingStop?.name}&quot;</span> ({deletingStop?.code || "No Code"}) from the global registry?
            </p>

            {deletingStopChildren.length > 0 && (
              <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-left flex items-start gap-2.5 text-xs text-yellow-300">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>
                  Warning: This stop has <span className="font-bold">{deletingStopChildren.length} child sub-stop(s)</span> assigned to it. Removing it will detach parent references.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="p-6 bg-[#0a0a0a] gap-2 sm:justify-center flex-row">
            <Button
              variant="outline"
              onClick={() => setDeletingStop(null)}
              className="font-bold rounded-xl h-10 w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (deletingStop) {
                  const delId = getStopId(deletingStop);
                  if (delId) deleteMutation.mutate(delId);
                }
              }}
              className="font-bold rounded-xl h-10 w-full sm:w-auto px-6 gap-2"
            >
              {deleteMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Delete Permanently</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Import Modal */}
      <BulkImportStopsModal
        open={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        onSuccess={() => qc.invalidateQueries({ queryKey: ["stops"] })}
      />
    </div>
  );
};
