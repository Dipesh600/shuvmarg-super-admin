/**
 * DiscoveryTab.tsx
 *
 * Map-assisted Route Discovery workflow:
 *   DRAFT → ROUTE_SELECTED → STOPS_DISCOVERED → APPROVED → PUBLISHED
 *
 * Three views:
 *  1. Sessions list — table of all sessions with status badges
 *  2. Create session — pick origin + destination stop
 *  3. Session detail — route selection + stop review + publish
 */

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Plus, ChevronRight, Loader2, MapPin, Route, CheckCircle2,
  XCircle, Clock, ArrowRight, Sparkles, Check, X,
  Navigation, Milestone, RefreshCw,
} from "lucide-react";
import {
  createDiscoverySession, listDiscoverySessions, getDiscoverySession,
  selectRouteOption, patchDiscoveredStop, approveSession, rejectSession,
  publishSession, refineStopsWithLLM,
  type DiscoverySession, type AdminAction,
} from "@/api/routeDiscoveryApi";
import { searchStops } from "@/api/platformRegistryApi";
import { GoogleRouteMap, type GoogleRouteInfo } from "./RouteMapPreview";

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_META: Record<string, { label: string; color: string }> = {
  DRAFT:            { label: "Draft",          color: "bg-white/10 text-white/50" },
  ROUTE_SELECTED:   { label: "Route Selected", color: "bg-blue-500/20 text-blue-300" },
  STOPS_DISCOVERED: { label: "Stops Found",    color: "bg-yellow-500/20 text-yellow-300" },
  APPROVED:         { label: "Approved",        color: "bg-green-500/20 text-green-300" },
  PUBLISHED:        { label: "Published",       color: "bg-[#D3D925]/20 text-[#D3D925]" },
  REJECTED:         { label: "Rejected",        color: "bg-red-500/20 text-red-300" },
};

const StatusBadge = ({ status }: { status: string }) => {
  const meta = STATUS_META[status] || { label: status, color: "bg-white/10 text-white/40" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${meta.color}`}>
      {meta.label}
    </span>
  );
};

// ── Stop action badge ─────────────────────────────────────────────────────────

const ACTION_META: Record<AdminAction, { label: string; color: string }> = {
  PENDING:  { label: "Pending",  color: "bg-white/10 text-white/50" },
  APPROVED: { label: "Approved", color: "bg-green-500/20 text-green-300" },
  REJECTED: { label: "Rejected", color: "bg-red-500/20 text-red-300" },
  EDITED:   { label: "Edited",   color: "bg-blue-500/20 text-blue-300" },
  MERGED:   { label: "Merged",   color: "bg-purple-500/20 text-purple-300" },
};

const ActionBadge = ({ action }: { action: AdminAction }) => {
  const meta = ACTION_META[action];
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${meta.color}`}>
      {meta.label}
    </span>
  );
};

// ── Stop search combobox ──────────────────────────────────────────────────────

const StopSearchInput = ({
  label, value, onSelect,
}: {
  label: string;
  value: { _id: string; name: string; code: string } | null;
  onSelect: (stop: { _id: string; name: string; code: string }) => void;
}) => {
  const [q, setQ] = useState("");
  const { data, isFetching } = useQuery({
    queryKey: ["stop-search", q],
    queryFn: () => searchStops(q),
    enabled: q.length >= 2,
    staleTime: 10_000,
  });

  const results: any[] = data?.data ?? [];

  return (
    <div className="space-y-2 relative">
      <Label className="text-white/70 text-xs font-semibold uppercase tracking-widest">{label}</Label>
      {value ? (
        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-[#D3D925]/10 border border-[#D3D925]/30">
          <MapPin className="w-4 h-4 text-[#D3D925]" />
          <span className="text-white font-semibold">{value.name}</span>
          <span className="text-white/40 text-xs ml-1">{value.code}</span>
          <button
            onClick={() => { onSelect(null as any); setQ(""); }}
            className="ml-auto text-white/40 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <>
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search stop name..."
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-2xl"
          />
          {q.length >= 2 && (
            <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
              {isFetching ? (
                <div className="px-4 py-3 text-white/40 text-sm flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Searching…
                </div>
              ) : results.length === 0 ? (
                <div className="px-4 py-3 text-white/40 text-sm">No stops found</div>
              ) : (
                results.map((s: any) => (
                  <button
                    key={s._id}
                    onClick={() => { onSelect(s); setQ(""); }}
                    className="w-full text-left px-4 py-3 hover:bg-white/5 flex items-center gap-3 border-b border-white/5 last:border-0"
                  >
                    <MapPin className="w-3.5 h-3.5 text-[#D3D925]" />
                    <span className="text-white text-sm font-medium">{s.name}</span>
                    <span className="text-white/30 text-xs ml-auto">{s.code}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ── Create Session Modal ──────────────────────────────────────────────────────

const CreateSessionModal = ({
  open, onClose, onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (id: string) => void;
}) => {
  const [origin, setOrigin] = useState<{ _id: string; name: string; code: string } | null>(null);
  const [destination, setDestination] = useState<{ _id: string; name: string; code: string } | null>(null);
  const qc = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      createDiscoverySession({ originStopId: origin!._id, destinationStopId: destination!._id }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["discovery-sessions"] });
      toast.success("Discovery session created. Mapbox is fetching routes in the background.");
      onCreated(res.data._id);
      onClose();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || e.message),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-[#111] border-white/10 rounded-3xl p-8 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white text-xl font-bold flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#D3D925]/10">
              <Navigation className="w-5 h-5 text-[#D3D925]" />
            </div>
            New Discovery Session
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-4">
          <p className="text-white/40 text-sm leading-relaxed">
            Select the origin and destination stops. The system will automatically fetch
            real road routes from Mapbox and discover bus stops along the route.
          </p>

          <StopSearchInput label="Origin Stop" value={origin} onSelect={setOrigin} />

          <div className="flex items-center justify-center">
            <ArrowRight className="w-5 h-5 text-white/20" />
          </div>

          <StopSearchInput label="Destination Stop" value={destination} onSelect={setDestination} />
        </div>

        <DialogFooter className="mt-6 gap-3">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-white/50 hover:text-white rounded-2xl"
          >
            Cancel
          </Button>
          <Button
            onClick={() => mutate()}
            disabled={!origin || !destination || isPending}
            className="bg-[#D3D925] text-black font-bold rounded-2xl hover:bg-[#bfc920] px-8"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Create Session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ── Sessions List ─────────────────────────────────────────────────────────────

const SessionsList = ({
  onOpen, onNew,
}: {
  onOpen: (id: string) => void;
  onNew: () => void;
}) => {
  const [statusFilter, setStatusFilter] = useState<string>("");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["discovery-sessions", statusFilter],
    queryFn: () => listDiscoverySessions({ status: statusFilter as any || undefined }),
    refetchInterval: 15_000,  // Poll every 15s — catches background Mapbox/Google completion
  });

  const sessions: DiscoverySession[] = data?.sessions ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-bold text-lg">Discovery Sessions</h3>
          <p className="text-white/40 text-sm mt-0.5">
            Map-assisted route creation workflow
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white/5 border border-white/10 text-white text-sm rounded-xl px-3 py-2 outline-none"
          >
            <option value="">All statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="ROUTE_SELECTED">Route Selected</option>
            <option value="STOPS_DISCOVERED">Stops Found</option>
            <option value="APPROVED">Approved</option>
            <option value="PUBLISHED">Published</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <Button
            onClick={onNew}
            className="bg-[#D3D925] text-black font-bold rounded-2xl hover:bg-[#bfc920] gap-2"
          >
            <Plus className="w-4 h-4" /> New Session
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-white/30">
          <Loader2 className="w-6 h-6 animate-spin mr-3" /> Loading sessions…
        </div>
      ) : sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="p-5 rounded-3xl bg-white/5">
            <Navigation className="w-10 h-10 text-white/20" />
          </div>
          <div>
            <p className="text-white font-semibold">No discovery sessions yet</p>
            <p className="text-white/40 text-sm mt-1">
              Create a session to start the map-assisted route creation flow
            </p>
          </div>
          <Button
            onClick={onNew}
            className="bg-[#D3D925] text-black font-bold rounded-2xl hover:bg-[#bfc920] mt-2 gap-2"
          >
            <Plus className="w-4 h-4" /> Create First Session
          </Button>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden border border-white/5">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-white/40 text-xs font-bold uppercase tracking-widest">Route</TableHead>
                <TableHead className="text-white/40 text-xs font-bold uppercase tracking-widest">Status</TableHead>
                <TableHead className="text-white/40 text-xs font-bold uppercase tracking-widest">Routes Found</TableHead>
                <TableHead className="text-white/40 text-xs font-bold uppercase tracking-widest">Stops</TableHead>
                <TableHead className="text-white/40 text-xs font-bold uppercase tracking-widest">Created</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((s) => {
                const origin = typeof s.originStopId === "object" ? s.originStopId : null;
                const dest = typeof s.destinationStopId === "object" ? s.destinationStopId : null;
                const approvedStops = s.discoveredStops?.filter(
                  (ds) => ds.adminAction === "APPROVED" || ds.adminAction === "EDITED"
                ).length ?? 0;

                return (
                  <TableRow
                    key={s._id}
                    className="border-white/5 hover:bg-white/3 cursor-pointer"
                    onClick={() => onOpen(s._id)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-white font-semibold">{origin?.name ?? "—"}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-white/30" />
                        <span className="text-white font-semibold">{dest?.name ?? "—"}</span>
                      </div>
                    </TableCell>
                    <TableCell><StatusBadge status={s.status} /></TableCell>
                    <TableCell className="text-white/60 text-sm">
                      {s.routeOptions?.length > 0 ? `${s.routeOptions.length} option(s)` : "—"}
                    </TableCell>
                    <TableCell className="text-white/60 text-sm">
                      {s.discoveredStops?.length > 0
                        ? `${approvedStops}/${s.discoveredStops.length} approved`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-white/40 text-xs">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <ChevronRight className="w-4 h-4 text-white/30" />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

// ── Session Detail ────────────────────────────────────────────────────────────

const SessionDetail = ({
  sessionId, onBack,
}: {
  sessionId: string;
  onBack: () => void;
}) => {
  const qc = useQueryClient();
  const [thinkingText,    setThinkingText]    = React.useState("");
  const [isRunningInBg,  setIsRunningInBg]   = React.useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["discovery-session", sessionId],
    queryFn: () => getDiscoverySession(sessionId),
    refetchInterval: (q) => {
      const s: DiscoverySession | undefined = q.state.data?.data;
      // Poll while ordinary background discovery jobs are in flight
      if (s && ["DRAFT", "ROUTE_SELECTED"].includes(s.status)) return 5_000;
      // Poll while the LLM refinement job is running on the server
      if (s?.llmJobStatus === "PROCESSING") return 3_000;
      return false;
    },
  });

  const session: DiscoverySession | undefined = data?.data;

  // Detect when we come back to the page and the server is still refining
  React.useEffect(() => {
    if (!session) return;
    if (session.llmJobStatus === "PROCESSING") {
      setIsRunningInBg(true);
    } else if (session.llmJobStatus === "DONE" || session.llmJobStatus === "FAILED") {
      if (isRunningInBg) {
        // Job completed while we were away — notify the admin
        if (session.llmJobStatus === "DONE") {
          toast.success("AI refinement completed in the background!");
        } else {
          toast.error(`AI refinement failed: ${session.llmJobError ?? "Unknown error"}`);
        }
        setIsRunningInBg(false);
        setThinkingText("");
      }
    }
  }, [session?.llmJobStatus]);

  // ── Mutations ──

  const selectRoute = useMutation({
    mutationFn: ({ idx, info }: { idx: number; info: GoogleRouteInfo }) =>
      selectRouteOption(sessionId, idx, {
        summary:         info.summary,
        distanceKm:      info.distanceKm,
        durationMins:    info.durationMins,
        provider:        "GOOGLE",
        encodedPolyline: info.encodedPolyline,
        stepPolylines:   info.stepPolylines,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["discovery-session", sessionId] });
      toast.success("Route confirmed. Discovering towns along the route…");
    },
    onError: (e: any) => toast.error(e.response?.data?.message || e.message),
  });

  const patchStop = useMutation({
    mutationFn: ({ stopId, patch }: { stopId: string; patch: any }) =>
      patchDiscoveredStop(sessionId, stopId, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["discovery-session", sessionId] }),
    onError: (e: any) => toast.error(e.response?.data?.message || e.message),
  });

  const approveMutation = useMutation({
    mutationFn: () => approveSession(sessionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["discovery-session", sessionId] });
      toast.success("Session approved. Ready to publish.");
    },
    onError: (e: any) => toast.error(e.response?.data?.message || e.message),
  });

  const rejectMutation = useMutation({
    mutationFn: () => rejectSession(sessionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["discovery-session", sessionId] });
      qc.invalidateQueries({ queryKey: ["discovery-sessions"] });
      toast.info("Session rejected.");
      onBack();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || e.message),
  });

  const publishMutation = useMutation({
    mutationFn: () => publishSession(sessionId),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["discovery-session", sessionId] });
      qc.invalidateQueries({ queryKey: ["discovery-sessions"] });
      toast.success(`Published! Variant ${res.data.variantCode} created with ${res.data.stopsCreated} stops.`);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || e.message),
  });

  const refineStopsMutation = useMutation({
    mutationFn: () => {
      setThinkingText(""); // reset on each run
      setIsRunningInBg(false);
      return refineStopsWithLLM(sessionId, (chunk) => {
        setThinkingText((prev) => prev + chunk);
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["discovery-session", sessionId] });
      toast.success("Stops refined with AI.");
      setIsRunningInBg(false);
      // Keep thinking text visible for 4 s then fade it out
      setTimeout(() => setThinkingText(""), 4000);
    },
    onError: (e: any) => {
      // If SSE stream was cut (user navigated away briefly), the job may
      // still be running on the server — don't show as an error in that case.
      if (e?.message?.includes("aborted") || e?.name === "AbortError") {
        setIsRunningInBg(true);
        return;
      }
      toast.error(e?.message || "Refinement failed.");
      setThinkingText("");
      setIsRunningInBg(false);
    },
  });


  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-white/30">
        <Loader2 className="w-6 h-6 animate-spin mr-3" /> Loading session…
      </div>
    );
  }

  if (!session) return null;

  const origin = typeof session.originStopId === "object" ? session.originStopId : null;
  const dest = typeof session.destinationStopId === "object" ? session.destinationStopId : null;
  const isTerminal = ["PUBLISHED", "REJECTED"].includes(session.status);
  const approvedCount = session.discoveredStops?.filter(
    (s) => s.adminAction === "APPROVED" || s.adminAction === "EDITED"
  ).length ?? 0;

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={onBack}
            className="text-white/40 hover:text-white text-sm flex items-center gap-1 mb-3 transition-colors"
          >
            ← Back to sessions
          </button>
          <div className="flex items-center gap-3">
            <h3 className="text-white font-bold text-xl">
              {origin?.name ?? "—"}
              <span className="text-white/30 mx-2">→</span>
              {dest?.name ?? "—"}
            </h3>
            <StatusBadge status={session.status} />
          </div>
          <p className="text-white/30 text-xs mt-1">Session ID: {session._id}</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {!isTerminal && (
            <Button
              variant="outline"
              onClick={() => rejectMutation.mutate()}
              disabled={rejectMutation.isPending}
              className="border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-2xl"
            >
              {rejectMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4 mr-1.5" />}
              Reject
            </Button>
          )}
        </div>
      </div>

      {/* Progress steps */}
      <div className="flex items-center gap-0">
        {[
          { key: "DRAFT",            label: "Draft",         icon: Clock },
          { key: "ROUTE_SELECTED",   label: "Route",         icon: Route },
          { key: "STOPS_DISCOVERED", label: "Stops Found",   icon: Milestone },
          { key: "APPROVED",         label: "Approved",      icon: CheckCircle2 },
          { key: "PUBLISHED",        label: "Published",     icon: Sparkles },
        ].map((step, i, arr) => {
          const statuses = ["DRAFT","ROUTE_SELECTED","STOPS_DISCOVERED","APPROVED","PUBLISHED","REJECTED"];
          const currentIdx = statuses.indexOf(session.status);
          const stepIdx = statuses.indexOf(step.key);
          const done = currentIdx > stepIdx;
          const active = currentIdx === stepIdx;
          const Icon = step.icon;

          return (
            <React.Fragment key={step.key}>
              <div className="flex flex-col items-center gap-1.5">
                <div className={`p-2.5 rounded-2xl transition-all ${
                  done   ? "bg-[#D3D925] text-black" :
                  active ? "bg-white/10 text-white ring-2 ring-[#D3D925]/50" :
                           "bg-white/5 text-white/20"
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`text-xs font-semibold ${
                  done || active ? "text-white/70" : "text-white/20"
                }`}>{step.label}</span>
              </div>
              {i < arr.length - 1 && (
                <div className={`flex-1 h-px mx-2 mb-5 transition-all ${
                  done ? "bg-[#D3D925]/50" : "bg-white/10"
                }`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* ── DRAFT: Google Maps route picker ── */}
      {session.status === "DRAFT" && origin && dest && (
        <div className="space-y-4">
          <h4 className="text-white font-bold text-base flex items-center gap-2">
            <Route className="w-4 h-4 text-[#D3D925]" /> Select a Route
          </h4>
          <p className="text-white/40 text-xs">
            Google Maps shows all available road routes. Click a line on the map or a
            card below, then confirm your selection.
          </p>
          <GoogleRouteMap
            originName={origin.name}
            destinationName={dest.name}
            disabled={selectRoute.isPending}
            onSelect={(idx, info) => selectRoute.mutate({ idx, info })}
          />
        </div>
      )}

      {/* ── ROUTE_SELECTED: waiting for Google Places ── */}
      {session.status === "ROUTE_SELECTED" && (
        <div className="flex items-center gap-4 p-6 rounded-2xl bg-yellow-500/10 border border-yellow-500/20">
          <Loader2 className="w-5 h-5 text-yellow-400 animate-spin flex-shrink-0" />
          <div>
            <p className="text-white font-semibold">Discovering stops along the route…</p>
            <p className="text-white/40 text-sm mt-0.5">
              Google Places is scanning {session.selectedRouteOptionIndex !== null
                ? `Option ${(session.selectedRouteOptionIndex ?? 0) + 1}`
                : "the selected route"} for bus stations. This takes a few seconds.
            </p>
          </div>
        </div>
      )}

      {/* ── STOPS_DISCOVERED / APPROVED: review stops ── */}
      {["STOPS_DISCOVERED", "APPROVED"].includes(session.status) && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-white font-bold text-base flex items-center gap-2">
              <Milestone className="w-4 h-4 text-[#D3D925]" />
              Review Discovered Stops
              <span className="text-white/30 text-sm font-normal ml-1">
                ({approvedCount}/{session.discoveredStops.length} approved)
              </span>
            </h4>
            <div className="flex gap-2">
              {session.status === "STOPS_DISCOVERED" && !session.isLlmRefined && session.discoveredStops.length > 0 && (
                <Button
                  onClick={() => refineStopsMutation.mutate()}
                  disabled={refineStopsMutation.isPending}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-2xl gap-2"
                >
                  {refineStopsMutation.isPending
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Sparkles className="w-4 h-4" />}
                  Refine with AI
                </Button>
              )}
              {session.status === "STOPS_DISCOVERED" && approvedCount >= 2 && (
                <Button
                  onClick={() => approveMutation.mutate()}
                  disabled={approveMutation.isPending}
                  className="bg-green-600 hover:bg-green-500 text-white font-bold rounded-2xl gap-2"
                >
                  {approveMutation.isPending
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <CheckCircle2 className="w-4 h-4" />}
                  Approve Session
                </Button>
              )}
            </div>
          </div>

          {/* ── Background job running banner (navigated away + came back) ── */}
          {isRunningInBg && !refineStopsMutation.isPending && (
            <div className="rounded-2xl border border-orange-500/30 bg-orange-950/20 flex items-center gap-3 px-4 py-3">
              <Loader2 className="w-4 h-4 text-orange-400 animate-spin shrink-0" />
              <div>
                <p className="text-orange-300 text-sm font-semibold">AI is refining stops in the background</p>
                <p className="text-orange-300/60 text-xs mt-0.5">You can navigate freely — the server will finish and this page will update automatically.</p>
              </div>
            </div>
          )}

          {/* ── Live AI thinking stream ─────────────────────────────── */}
          {(refineStopsMutation.isPending || thinkingText) && (
            <div className="rounded-2xl border border-purple-500/20 bg-purple-950/20 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-purple-500/10">
                <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                <span className="text-purple-300 text-xs font-bold uppercase tracking-widest">
                  {refineStopsMutation.isPending ? "Minimax is thinking…" : "Refinement complete"}
                </span>
              </div>
              <pre
                className="p-4 text-[11px] leading-relaxed text-purple-200/70 font-mono whitespace-pre-wrap break-words max-h-64 overflow-y-auto"
              >
                {thinkingText || "Starting…"}
              </pre>
            </div>
          )}

          {session.discoveredStops.length === 0 ? (
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center text-white/40 text-sm">
              No stops were discovered automatically. You can still approve and publish with manually added stops.
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden border border-white/5">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="text-white/40 text-xs font-bold uppercase tracking-widest w-6">#</TableHead>
                    <TableHead className="text-white/40 text-xs font-bold uppercase tracking-widest">Stop Name</TableHead>
                    <TableHead className="text-white/40 text-xs font-bold uppercase tracking-widest">Distance</TableHead>
                    <TableHead className="text-white/40 text-xs font-bold uppercase tracking-widest">ETA</TableHead>
                    <TableHead className="text-white/40 text-xs font-bold uppercase tracking-widest">Action</TableHead>
                    {session.status === "STOPS_DISCOVERED" && (
                      <TableHead className="text-white/40 text-xs font-bold uppercase tracking-widest">Review</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {session.discoveredStops
                    .slice()
                    .sort((a, b) => a.sequenceOrder - b.sequenceOrder)
                    .map((stop, i) => (
                      <TableRow key={stop._id} className="border-white/5">
                        <TableCell className="text-white/30 text-xs">{i + 1}</TableCell>
                        <TableCell>
                          <div>
                            <p className="text-white text-sm font-medium">{stop.candidateName}</p>
                            {stop._matchType && (
                              <p className="text-[10px] mt-0.5 font-bold uppercase tracking-wider">
                                <span className="text-emerald-400">
                                  ✓ Existing
                                </span>
                                <span className="text-white/30 mx-1">·</span>
                                <span className="text-white/40">{stop._matchedName || stop.candidateName}</span>
                                <span className="text-white/20 mx-1">·</span>
                                <span className="text-white/25">{stop._matchType === "PROXIMITY" ? "nearby" : stop._matchType === "NAME_DISTRICT" ? "name match" : "alias"}</span>
                              </p>
                            )}
                            {!stop._matchType && !stop.routeStopId && (
                              <p className="text-[10px] mt-0.5 text-amber-400/60 font-bold uppercase tracking-wider">New stop</p>
                            )}
                            {stop.candidateCoordinates && (
                              <p className="text-white/30 text-xs mt-0.5">
                                {stop.candidateCoordinates.lat?.toFixed(4)}, {stop.candidateCoordinates.lng?.toFixed(4)}
                              </p>
                            )}
                            {stop.source && stop.source === "LLM" && (
                              <p className="text-[10px] mt-0.5 text-purple-400 font-bold uppercase tracking-wider">Refined by AI</p>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="text-white/50 text-sm">
                          {stop.distanceFromOriginKm != null ? `${stop.distanceFromOriginKm} km` : "—"}
                        </TableCell>
                        <TableCell className="text-white/50 text-sm">
                          {stop.durationFromOriginMins != null ? `~${stop.durationFromOriginMins} min` : "—"}
                        </TableCell>
                        <TableCell>
                          <ActionBadge action={stop.adminAction} />
                        </TableCell>
                        {session.status === "STOPS_DISCOVERED" && (
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() =>
                                  patchStop.mutate({ stopId: stop._id, patch: { adminAction: "APPROVED" } })
                                }
                                disabled={patchStop.isPending}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  stop.adminAction === "APPROVED"
                                    ? "bg-green-500/20 text-green-400"
                                    : "bg-white/5 text-white/30 hover:bg-green-500/10 hover:text-green-400"
                                }`}
                                title="Approve"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() =>
                                  patchStop.mutate({ stopId: stop._id, patch: { adminAction: "REJECTED" } })
                                }
                                disabled={patchStop.isPending}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  stop.adminAction === "REJECTED"
                                    ? "bg-red-500/20 text-red-400"
                                    : "bg-white/5 text-white/30 hover:bg-red-500/10 hover:text-red-400"
                                }`}
                                title="Reject"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}

      {/* ── APPROVED: publish ── */}
      {session.status === "APPROVED" && (
        <div className="p-6 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-between">
          <div>
            <p className="text-white font-bold">Ready to Publish</p>
            <p className="text-white/50 text-sm mt-0.5">
              {approvedCount} stops approved. Publishing will create the Corridor, Variant and stop sequence in the live registry.
            </p>
          </div>
          <Button
            onClick={() => publishMutation.mutate()}
            disabled={publishMutation.isPending}
            className="bg-[#D3D925] text-black font-bold rounded-2xl hover:bg-[#bfc920] px-8 gap-2 flex-shrink-0"
          >
            {publishMutation.isPending
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Sparkles className="w-4 h-4" />}
            Publish to Registry
          </Button>
        </div>
      )}

      {/* ── PUBLISHED ── */}
      {session.status === "PUBLISHED" && session.publishedVariant && (
        <div className="p-6 rounded-2xl bg-[#D3D925]/10 border border-[#D3D925]/20">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-[#D3D925]" />
            <div>
              <p className="text-white font-bold">Published to Registry</p>
              <p className="text-white/50 text-sm mt-0.5">
                Variant ID: <code className="text-[#D3D925] text-xs">{session.publishedVariant.variantId}</code>
                {" · "}
                {session.publishedVariant.routeStopSequence?.length ?? 0} stops in sequence
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── REJECTED ── */}
      {session.status === "REJECTED" && (
        <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
          <XCircle className="w-5 h-5 text-red-400" />
          <p className="text-white/70 text-sm">This session was rejected and is now closed.</p>
        </div>
      )}
    </div>
  );
};

// ── Main exported component ───────────────────────────────────────────────────

export const DiscoveryTab = () => {
  const [view, setView] = useState<"list" | "detail">("list");
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const openSession = (id: string) => {
    setActiveSessionId(id);
    setView("detail");
  };

  return (
    <div>
      <CreateSessionModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={openSession}
      />

      {view === "list" ? (
        <SessionsList
          onOpen={openSession}
          onNew={() => setCreateOpen(true)}
        />
      ) : (
        <SessionDetail
          sessionId={activeSessionId!}
          onBack={() => { setView("list"); setActiveSessionId(null); }}
        />
      )}
    </div>
  );
};
