import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Bus, RefreshCw, AlertCircle, Calendar,
  PlayCircle, Navigation, CheckCircle2, XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { getAllTrips, updateTripStatus, type TripStatus, type AdminTrip } from "@/api/tripApi";

// ── State machine: what's the next valid status for each state ───────────

const NEXT_STATUS: Record<TripStatus, TripStatus | null> = {
  scheduled:  "boarding",
  boarding:   "in_transit",
  in_transit: "completed",
  completed:  null,
  cancelled:  null,
};

const NEXT_LABEL: Record<TripStatus, string> = {
  scheduled:  "Start Boarding",
  boarding:   "Depart (In Transit)",
  in_transit: "Mark Completed",
  completed:  "",
  cancelled:  "",
};

const STATUS_BADGE: Record<TripStatus, "default" | "secondary" | "outline" | "destructive"> = {
  scheduled:  "outline",
  boarding:   "secondary",
  in_transit: "default",
  completed:  "default",
  cancelled:  "destructive",
};

const STATUS_ICON: Record<TripStatus, React.ReactNode> = {
  scheduled:  <Calendar className="h-3 w-3" />,
  boarding:   <Bus className="h-3 w-3" />,
  in_transit: <Navigation className="h-3 w-3" />,
  completed:  <CheckCircle2 className="h-3 w-3" />,
  cancelled:  <XCircle className="h-3 w-3" />,
};

const STATUS_COLOR: Record<TripStatus, string> = {
  scheduled:  "text-yellow-600",
  boarding:   "text-blue-600",
  in_transit: "text-green-600",
  completed:  "text-gray-500",
  cancelled:  "text-red-500",
};

const STATUS_FILTERS = ["all", "scheduled", "boarding", "in_transit", "completed", "cancelled"] as const;

export default function TripManagement() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage]                 = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["adminTrips", statusFilter, page],
    queryFn:  () => getAllTrips({ page, limit: 30, status: statusFilter }),
    staleTime: 60_000,
  });

  const { mutate: advanceStatus, isPending: isAdvancing } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TripStatus }) =>
      updateTripStatus(id, status),
    onSuccess: (_, vars) => {
      toast.success(`Trip advanced to "${vars.status}" successfully`);
      queryClient.invalidateQueries({ queryKey: ["adminTrips"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update trip status");
    },
  });

  const trips: AdminTrip[] = data?.trips ?? [];
  const pagination = data?.pagination;

  const getRouteName = (t: AdminTrip) => {
    const r = t.routeId;
    if (!r) return "—";
    return r.routeName ?? (r.from && r.to ? `${r.from} → ${r.to}` : "—");
  };

  const getBusLabel = (t: AdminTrip) => {
    const b = t.busId;
    if (!b) return "—";
    return b.busName ? `${b.busName} (${b.busNumber ?? ""})` : b.busNumber ?? "—";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Trip Management</h2>
          <p className="text-muted-foreground mt-1">
            Monitor and advance live trip lifecycle states
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_FILTERS.map(s => (
                <SelectItem key={s} value={s} className="capitalize">
                  {s === "all" ? "All Statuses" : s.replace("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Summary badge */}
      {pagination && (
        <p className="text-sm text-muted-foreground">
          Showing {trips.length} of {pagination.total} trips
          {statusFilter !== "all" && ` · filtered by "${statusFilter.replace("_"," ")}"`}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Platform Trips</CardTitle>
          <CardDescription>
            Use the status buttons to advance the trip lifecycle. Transitions are enforced by the
            server state machine (scheduled → boarding → in_transit → completed).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-16">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center gap-2 p-12 text-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <p className="text-sm text-muted-foreground">Failed to load trips.</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
            </div>
          ) : trips.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 p-12 text-center">
              <Bus className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No trips found{statusFilter !== "all" ? ` with status "${statusFilter}"` : ""}.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Route</TableHead>
                  <TableHead>Bus</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Trip Date</TableHead>
                  <TableHead>Departure</TableHead>
                  <TableHead>Fare</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Advance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trips.map(trip => {
                  const next = NEXT_STATUS[trip.status];
                  return (
                    <TableRow key={trip._id}>
                      <TableCell className="font-medium">{getRouteName(trip)}</TableCell>
                      <TableCell className="text-sm">{getBusLabel(trip)}</TableCell>
                      <TableCell>
                        <div className="text-sm">{trip.ownerId?.name ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">{trip.ownerId?.email}</div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(trip.tripDate).toLocaleDateString("en-IN")}
                      </TableCell>
                      <TableCell className="text-sm">{trip.departureTime ?? "—"}</TableCell>
                      <TableCell className="text-sm font-mono">
                        {trip.tripFare ? `Rs. ${trip.tripFare.toLocaleString("en-IN")}` : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={STATUS_BADGE[trip.status]}
                          className={`gap-1 capitalize ${STATUS_COLOR[trip.status]}`}
                        >
                          {STATUS_ICON[trip.status]}
                          {trip.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {next ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 text-xs"
                            disabled={isAdvancing}
                            onClick={() => advanceStatus({ id: trip._id, status: next })}
                          >
                            {isAdvancing
                              ? <RefreshCw className="h-3 w-3 animate-spin" />
                              : <PlayCircle className="h-3 w-3" />
                            }
                            {NEXT_LABEL[trip.status]}
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">
                            {trip.status === "completed" ? "Complete ✓" : "—"}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1 || isLoading}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                ← Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page === pagination.totalPages || isLoading}
                onClick={() => setPage(p => p + 1)}
              >
                Next →
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
