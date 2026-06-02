import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Route, Search, Clock, CheckCircle2, XCircle, ArrowRight,
  MapPin, Bus, User, Inbox,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getAllRouteRequests } from "@/api/platformRegistryApi";
import RouteRequestReviewModal from "./RouteRequestReviewModal";

type StatusFilter = "ALL" | "PENDING" | "APPROVED" | "REJECTED";

const statusBadge = (status: string) => {
  switch (status) {
    case "PENDING":
      return <Badge className="bg-amber-100 text-amber-800 border-amber-200 font-black text-[10px] uppercase">Pending</Badge>;
    case "APPROVED":
      return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 font-black text-[10px] uppercase">Approved</Badge>;
    case "REJECTED":
      return <Badge className="bg-rose-100 text-rose-800 border-rose-200 font-black text-[10px] uppercase">Rejected</Badge>;
    default:
      return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
  }
};

const RouteRequestsPanel: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [search, setSearch] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [reviewOpen, setReviewOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["routeRequests", statusFilter],
    queryFn: () => getAllRouteRequests(statusFilter === "ALL" ? undefined : statusFilter),
    staleTime: 0,
  });

  const allRequests: any[] = data?.data || [];

  // Count by status from the full list (when showing ALL)
  const pendingCount = allRequests.filter(r => r.status === "PENDING").length;

  const filtered = allRequests.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.originCity?.toLowerCase().includes(q) ||
      r.destinationCity?.toLowerCase().includes(q) ||
      r.ownerId?.name?.toLowerCase().includes(q) ||
      r.fleetId?.busNumber?.toLowerCase().includes(q)
    );
  });

  const openReview = (request: any) => {
    setSelectedRequest(request);
    setReviewOpen(true);
  };

  const tabs: { label: string; value: StatusFilter; icon: React.ReactNode }[] = [
    { label: "All", value: "ALL", icon: <Route className="h-3.5 w-3.5" /> },
    { label: "Pending", value: "PENDING", icon: <Clock className="h-3.5 w-3.5" /> },
    { label: "Approved", value: "APPROVED", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
    { label: "Rejected", value: "REJECTED", icon: <XCircle className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-black tracking-tight">Operator Route Requests</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Bus operators request new corridors here when their route isn't in the Platform Registry.
          </p>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 border border-amber-200">
            <Clock className="h-3.5 w-3.5 text-amber-700" />
            <span className="text-xs font-black text-amber-800">{pendingCount} Awaiting Review</span>
          </div>
        )}
      </div>

      {/* Status filter tabs */}
      <div className="flex bg-muted/30 p-1 rounded-xl gap-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setStatusFilter(tab.value)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
              statusFilter === tab.value
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by route, owner, or bus number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9 font-medium text-sm"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <Route className="h-8 w-8 text-muted-foreground animate-pulse" />
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Loading requests...</p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 border-2 border-dashed rounded-2xl">
          <Inbox className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm font-black text-muted-foreground">
            {search ? "No matching route requests." : "No route requests yet."}
          </p>
          <p className="text-xs text-muted-foreground/60">
            Requests appear here when operators submit a fleet with a new route.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="text-[10px] font-black uppercase tracking-widest">Requested Route</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest">Fleet</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest">Owner</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest">Submitted</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest">Status</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((req) => (
                <TableRow key={req._id} className="hover:bg-muted/20 transition-colors">
                  {/* Route */}
                  <TableCell>
                    <div className="flex items-center gap-1.5 font-black text-sm">
                      <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>{req.originCity}</span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span>{req.destinationCity}</span>
                    </div>
                    {req.viaStops?.length > 0 && (
                      <p className="text-[10px] text-muted-foreground mt-0.5 ml-5">
                        via {req.viaStops.slice(0, 3).join(", ")}{req.viaStops.length > 3 ? "..." : ""}
                      </p>
                    )}
                    {req.status === "APPROVED" && req.fleetId?.corridorId && (
                      <div className="mt-2 flex items-center gap-1.5 ml-1">
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[9px] px-1.5 py-0 shrink-0">Assigned Corridor</Badge>
                        <div className="flex flex-col">
                          <span className="font-mono text-[10px] font-bold text-emerald-800">{req.fleetId.corridorId.code}</span>
                          {req.fleetId.corridorId.originId?.name && (
                            <span className="text-[9px] text-muted-foreground">
                              {req.fleetId.corridorId.originId.name} → {req.fleetId.corridorId.destinationId?.name}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </TableCell>

                  {/* Fleet */}
                  <TableCell>
                    {req.fleetId ? (
                      <div className="flex items-center gap-1.5">
                        <Bus className="h-3.5 w-3.5 text-muted-foreground" />
                        <div>
                          <p className="font-bold text-sm leading-tight">{req.fleetId.busName}</p>
                          <p className="font-mono text-[10px] text-muted-foreground">{req.fleetId.busNumber}</p>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">N/A</span>
                    )}
                  </TableCell>

                  {/* Owner */}
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      <div>
                        <p className="font-bold text-sm leading-tight">{req.ownerId?.name || "Unknown"}</p>
                        <p className="text-[10px] text-muted-foreground">{req.ownerId?.phone || ""}</p>
                      </div>
                    </div>
                  </TableCell>

                  {/* Submitted */}
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {new Date(req.createdAt).toLocaleDateString("en-NP", { dateStyle: "medium" })}
                    </span>
                  </TableCell>

                  {/* Status */}
                  <TableCell>{statusBadge(req.status)}</TableCell>

                  {/* Action */}
                  <TableCell className="text-right">
                    {req.status === "PENDING" ? (
                      <Button
                        size="sm"
                        variant="default"
                        className="text-xs font-black h-8"
                        onClick={() => openReview(req)}
                      >
                        Review
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs font-bold h-8 text-muted-foreground"
                        onClick={() => openReview(req)}
                      >
                        View
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Review Modal */}
      <RouteRequestReviewModal
        requestId={selectedRequest?._id || null}
        isOpen={reviewOpen}
        onClose={() => { setReviewOpen(false); setSelectedRequest(null); }}
        requestData={selectedRequest}
      />
    </div>
  );
};

export default RouteRequestsPanel;
