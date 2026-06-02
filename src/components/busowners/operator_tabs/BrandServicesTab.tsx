import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Route, MapPin, Loader2, Navigation, Calendar,
  CheckCircle2, Clock, AlertCircle, ArrowRight, Plus,
  Pencil, Trash2, ToggleLeft, ToggleRight, MoreVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { getBrandRouteServices } from "@/api/operatorBrandApi";
import { toggleConfigStatus, deleteRouteConfig } from "@/api/platformRegistryApi";
import RouteConfigModal from "./RouteConfigModal";
import { toast } from "sonner";

// ─── Status pill ────────────────────────────────────────────────────────────────
const ConfigStatus = ({ status, isLive }: { status: string; isLive: boolean }) => {
  if (isLive)
    return (
      <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Live
      </span>
    );
  if (status === "ACTIVE")
    return (
      <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full border border-blue-200">
        <CheckCircle2 className="w-3 h-3" />
        Configured
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest bg-muted text-muted-foreground px-2.5 py-1 rounded-full border border-border">
      {status}
    </span>
  );
};

// ─── Schedule stat pill ─────────────────────────────────────────────────────────
const ScheduleStat = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <div className={`flex flex-col items-center px-3 py-1.5 rounded-lg border ${color}`}>
    <span className="text-lg font-black leading-none">{value}</span>
    <span className="text-[9px] font-bold uppercase tracking-widest mt-0.5 opacity-70">{label}</span>
  </div>
);

// ─── Main ───────────────────────────────────────────────────────────────────────
const BrandServicesTab = ({ brandId }: { brandId: string }) => {
  const qc = useQueryClient();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<any>(null);
  const [deletingConfig, setDeletingConfig] = useState<any>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["brand-route-services", brandId],
    queryFn: () => getBrandRouteServices(brandId),
    enabled: !!brandId,
  });

  const configs = data?.data || [];
  const summary = data?.summary || { totalRoutes: 0, activeRoutes: 0, totalSchedules: 0, activeSchedules: 0 };

  // Each config from the API is already one complete bidirectional service.
  // No pairing logic needed — the API filters to forward-only and the return
  // direction is stored inline (returnTimingConfig / returnActiveStops).
  const groupedConfigs = configs;


  // Toggle ACTIVE ↔ INACTIVE
  const toggleMut = useMutation({
    mutationFn: (configId: string) => toggleConfigStatus(configId),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["brand-route-services", brandId] });
      toast.success(res?.message || "Status updated.");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to toggle status."),
  });

  // Delete config
  const deleteMut = useMutation({
    mutationFn: (configId: string) => deleteRouteConfig(configId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["brand-route-services", brandId] });
      toast.success("Route configuration deleted.");
      setDeletingConfig(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to delete configuration.");
      setDeletingConfig(null);
    },
  });

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
      <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
      <p className="text-xs font-black uppercase tracking-widest">Loading Route Services</p>
    </div>
  );

  if (isError) return (
    <div className="flex flex-col items-center justify-center py-24 text-center text-destructive">
      <AlertCircle className="h-10 w-10 mb-3 opacity-50" />
      <p className="font-black text-sm">Failed to load route services.</p>
    </div>
  );

  if (configs.length === 0) return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 bg-muted/50 rounded-2xl flex items-center justify-center mb-5 border-2 border-dashed border-muted">
        <Route className="h-8 w-8 text-muted-foreground opacity-40" />
      </div>
      <p className="text-xl font-black tracking-tighter">No Route Services</p>
      <p className="text-sm text-muted-foreground font-medium mt-1 max-w-xs mb-5">
        This brand hasn't been configured on any platform routes yet.
      </p>
      <Button className="h-10 rounded-xl font-bold bg-primary text-primary-foreground" onClick={() => setCreateModalOpen(true)}>
        <Plus className="w-4 h-4 mr-2" />Add Route Service
      </Button>
      <RouteConfigModal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} brandId={brandId} />
    </div>
  );

  return (
    <div className="space-y-6 p-1 animate-in fade-in duration-300">

      {/* Summary Header Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Routes",    value: summary.totalRoutes,     icon: Route,        color: "bg-background border-border" },
          { label: "Active Routes",   value: summary.activeRoutes,    icon: CheckCircle2, color: "bg-emerald-50 border-emerald-200 text-emerald-800" },
          { label: "Total Schedules", value: summary.totalSchedules,  icon: Calendar,     color: "bg-background border-border" },
          { label: "Live Schedules",  value: summary.activeSchedules, icon: Clock,        color: "bg-blue-50 border-blue-200 text-blue-800" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className={`border shadow-sm ${color}`}>
            <CardContent className="p-4 flex items-center gap-3">
              <Icon className="w-5 h-5 opacity-50 shrink-0" />
              <div>
                <p className="text-2xl font-black leading-none">{value}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest mt-1 opacity-60">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black tracking-tight">Configured Routes</h3>
          <p className="text-[11px] text-muted-foreground font-semibold">Routes where this brand is approved to operate.</p>
        </div>
        <Button className="h-10 rounded-xl font-bold" onClick={() => setCreateModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />Add Route Service
        </Button>
      </div>

      {/* Config Cards */}
      <div className="space-y-4">
        {groupedConfigs.map((config: any) => {
          const variant  = config.variantId;
          const corridor = variant?.corridorId;
          const sched    = config.scheduleStats || { total: 0, active: 0, suspended: 0, draft: 0 };
          const isInactive = config.status === "INACTIVE";
          const isGroupLive = config.isLive;

          // Outbound direction label (A → B)
          const outboundLabel = corridor?.originId?.name && corridor?.destinationId?.name
            ? `${corridor.originId.name} → ${corridor.destinationId.name}`
            : (variant?.name || "Unnamed Route");

          // Return direction label (B → A) — always shown since every route is bidirectional
          const returnLabel = corridor?.originId?.name && corridor?.destinationId?.name
            ? `${corridor.destinationId.name} → ${corridor.originId.name}`
            : "Return Route";

          const hasReturnTiming = config.returnTimingConfig?.length > 0;

          return (
            <Card key={config._id} className={`border-2 shadow-sm overflow-hidden transition-all ${isGroupLive ? "border-emerald-200" : isInactive ? "border-dashed border-muted opacity-60" : "border-border"}`}>
              {isGroupLive && <div className="h-1 bg-gradient-to-r from-emerald-400 to-teal-400" />}

              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">

                  {/* LEFT — Route info */}
                  <div className="flex-1 p-5 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      {/* Route title + return direction */}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <ConfigStatus status={config.status} isLive={config.isLive} />
                          {config.patternName && config.patternName !== "Standard" && (
                            <span className="text-[9px] font-black uppercase tracking-widest bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                              {config.patternName}
                            </span>
                          )}
                        </div>
                        {/* Outbound A → B */}
                        <h4 className="text-base font-black tracking-tight leading-tight">
                          {outboundLabel}
                        </h4>
                        {/* Return B → A — always shown */}
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <ArrowRight className="w-3 h-3 text-muted-foreground rotate-90" />
                          <span className={`text-xs font-semibold ${hasReturnTiming ? "text-muted-foreground" : "text-rose-500"}`}>
                            {returnLabel}
                            {!hasReturnTiming && (
                              <span className="ml-2 text-[9px] bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded uppercase font-black">
                                No return timing
                              </span>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* ─── Actions Menu ─────────────────────────────── */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-muted shrink-0">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            className="gap-2 cursor-pointer"
                            onClick={() => setEditingConfig(config)}
                            disabled={sched.active > 0}
                          >
                            <Pencil className="w-4 h-4" />
                            Edit Config
                            {sched.active > 0 && <span className="ml-auto text-[10px] text-muted-foreground">({sched.active} live)</span>}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="gap-2 cursor-pointer"
                            onClick={() => toggleMut.mutate(config._id)}
                            disabled={toggleMut.isPending || sched.active > 0}
                          >
                            {isInactive
                              ? <><ToggleRight className="w-4 h-4 text-emerald-500" />Activate Config</>
                              : <><ToggleLeft className="w-4 h-4 text-amber-500" />Deactivate Config</>
                            }
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                            onClick={() => setDeletingConfig(config)}
                            disabled={sched.total > 0}
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete Config
                            {sched.total > 0 && <span className="ml-auto text-[10px]">({sched.total} sched.)</span>}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>


                    {/* Variant subtitle */}
                    {variant?.name && (
                      <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-foreground">{variant.name.replace(/ \(Return\)/i, "").replace(/ \(Forward\)/i, "")}</span>
                        {variant?.type && (
                          <span className="ml-1 text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase font-black tracking-wider">
                            {variant.type}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Outbound stop list */}
                    {config.activeStops?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {config.activeStops.map((stop: any) => (
                          <span key={stop._id} className="inline-flex items-center gap-1 text-[10px] font-bold bg-muted/60 text-muted-foreground px-2 py-0.5 rounded-full border border-border capitalize">
                            <Navigation className="w-2.5 h-2.5" />
                            {stop.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* RIGHT — Schedule stats */}
                  <div className="border-t md:border-t-0 md:border-l border-border p-5 flex flex-col justify-center gap-3 bg-muted/20 min-w-[180px]">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Schedule Breakdown</p>
                    <div className="flex items-center gap-2">
                      <ScheduleStat label="Active"  value={sched.active}    color="bg-emerald-50 border-emerald-200 text-emerald-800" />
                      <ScheduleStat label="Draft"   value={sched.draft}     color="bg-amber-50 border-amber-200 text-amber-700" />
                      <ScheduleStat label="Paused"  value={sched.suspended} color="bg-muted border-border text-muted-foreground" />
                    </div>
                    <p className="text-[10px] text-muted-foreground font-semibold">
                      {sched.total} total schedule{sched.total !== 1 ? "s" : ""} configured
                    </p>
                  </div>

                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>


      {/* Create Modal */}
      <RouteConfigModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        brandId={brandId}
      />

      {/* Edit Modal */}
      <RouteConfigModal
        isOpen={!!editingConfig}
        onClose={() => setEditingConfig(null)}
        brandId={brandId}
        editConfig={editingConfig}
      />

      {/* Delete Confirmation — uses Dialog (alert-dialog not installed) */}
      <Dialog open={!!deletingConfig} onOpenChange={() => setDeletingConfig(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-5 h-5" />
              Delete Route Config?
            </DialogTitle>
            <DialogDescription className="pt-1">
              This will permanently delete the config for{" "}
              <strong>{deletingConfig?.variantId?.name}</strong>.
              The paired return config will also be deleted if it has no schedules.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeletingConfig(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => deletingConfig && deleteMut.mutate(deletingConfig._id)}
              disabled={deleteMut.isPending}
            >
              {deleteMut.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Delete Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default BrandServicesTab;
