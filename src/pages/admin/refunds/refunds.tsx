import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  RotateCcw,
  Clock,
  CheckCircle,
  XCircle,
  Filter,
  Download,
  PlusCircle,
  Loader2,
  Search,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useModal } from "@/hooks/use-model-store";
import { useRefundPolicies } from "@/hooks/useRefundPolicy";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRefundQueue, updateRefundStatus } from "@/api/refundApi";
import { toast } from "sonner";
import { format } from "date-fns";

// ─── Refund Requests Tab (live data) ──────────────────────────────────────────

interface RefundRequestsTabProps {
  onOpen: (modal: string, data: any) => void;
}

function RefundRequestsTab({ onOpen }: RefundRequestsTabProps) {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const queryClient = useQueryClient();

  // Debounce the search query to avoid spamming the backend
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const { data, isLoading } = useQuery({
    queryKey: ["refund-queue", statusFilter, debouncedSearch],
    queryFn: () => getRefundQueue(statusFilter || undefined, debouncedSearch || undefined),
  });

  const { mutate: doUpdate, isPending: isUpdating } = useMutation({
    mutationFn: updateRefundStatus,
    onSuccess: () => {
      toast.success("Refund status updated");
      queryClient.invalidateQueries({ queryKey: ["refund-queue"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const refunds = data?.data || [];
  const summary = data?.summary || {};
  const pendingCount = summary.pending?.count || 0;
  const processingCount = summary.processing?.count || 0;
  const completedCount = summary.completed?.count || 0;

  const statusColors: Record<string, string> = {
    pending: "bg-blue-500/15 text-blue-600 border-blue-500/30",
    processing: "bg-amber-500/15 text-amber-600 border-amber-500/30",
    completed: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
    rejected: "bg-red-500/15 text-red-500 border-red-500/30",
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <CardTitle>Refund Queue</CardTitle>
            <CardDescription>
              {pendingCount} pending · {processingCount} processing · {completedCount} completed
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-3 sm:justify-end items-center">
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search ticket, name, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 w-[200px] lg:w-[250px] text-sm"
              />
            </div>
            <div className="flex gap-2 border-l pl-3">
            {["", "pending", "processing", "completed", "rejected"].map((s) => (
              <Button
                key={s}
                variant={statusFilter === s ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(s)}
                className="capitalize text-xs"
              >
                {s || "All"}
              </Button>
            ))}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : refunds.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            No refund requests found
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket</TableHead>
                <TableHead>Passenger</TableHead>
                <TableHead>Route</TableHead>
                <TableHead className="text-right">Original</TableHead>
                <TableHead className="text-right">Refund</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {refunds.map((refund: any) => (
                <TableRow key={refund._id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {refund.booking?.ticketId || "—"}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{refund.user?.name || "—"}</p>
                      {refund.user?.phone && (
                        <p className="text-xs text-muted-foreground">{refund.user.phone}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{refund.route}</TableCell>
                  <TableCell className="text-right text-sm">
                    Rs. {refund.originalAmount?.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-sm font-semibold text-emerald-600">
                    Rs. {refund.refundAmount?.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-sm max-w-[160px] truncate" title={refund.reason}>
                    {refund.reason || "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {refund.requestedAt
                      ? format(new Date(refund.requestedAt), "d MMM, HH:mm")
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColors[refund.status] || ""}>
                      {refund.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant={refund.status === "pending" || refund.status === "processing" ? "default" : "outline"}
                      size="sm"
                      className="text-xs"
                      onClick={() => onOpen("editRefundProccess", refund)}
                    >
                      {refund.status === "completed" || refund.status === "rejected" ? "View Details" : "Review"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Static data ──────────────────────────────────────────────────────────────



interface RefundPolicy {
  _id: string;
  policyName: string;
  refundPercentage: number;
  deductionPercentage: number;
  description: string;
  minHours: number;
  maxHours: number | null;
  color: string;
}

const Refunds = () => {
  const { onOpen } = useModal();
  const { data: policies } = useRefundPolicies();
  const { data: queueData } = useQuery({
    queryKey: ["refund-queue", ""],
    queryFn: () => getRefundQueue(),
  });

  const summary = queueData?.summary || {};
  const pendingCount = summary.pending?.count || 0;
  const pendingAmount = summary.pending?.totalAmount || 0;
  const processingCount = summary.processing?.count || 0;
  const processingAmount = summary.processing?.totalAmount || 0;
  const completedCount = summary.completed?.count || 0;
  const completedAmount = summary.completed?.totalAmount || 0;
  const rejectedCount = summary.rejected?.count || 0;
  
  const totalRequests = pendingCount + processingCount + completedCount + rejectedCount;
  const rejectionRate = totalRequests > 0 ? ((rejectedCount / totalRequests) * 100).toFixed(1) : "0.0";

  const policiesTableData = policies?.data?.map((policy: RefundPolicy) => ({
    id: policy._id,
    policyName: policy.policyName,
    refundPercentage: policy.refundPercentage,
    deductionPercentage: policy.deductionPercentage,
    description: policy.description,
    minHours: policy.minHours,
    maxHours: policy.maxHours,
    color: policy.color,
    isActive: (policy as any).isActive,
  }));
  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Refund Management
          </h2>
          <p className="text-muted-foreground mt-1">
            Process refund requests and manage policies
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Refunds
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">
              Rs. {pendingAmount.toLocaleString()} total value
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <RotateCcw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{processingCount}</div>
            <p className="text-xs text-muted-foreground">
              Rs. {processingAmount.toLocaleString()} in transit
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completed
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCount}</div>
            <p className="text-xs text-muted-foreground">Rs. {completedAmount.toLocaleString()} refunded</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Rejection Rate
            </CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rejectionRate}%</div>
            <p className="text-xs text-muted-foreground">Of {totalRequests} total requests</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="requests" className="space-y-4">
        <TabsList>
          <TabsTrigger value="requests">Refund Requests</TabsTrigger>
          <TabsTrigger value="policies">Refund Policies</TabsTrigger>
        </TabsList>

        <TabsContent value="requests">
          <RefundRequestsTab onOpen={onOpen} />
        </TabsContent>

        <TabsContent value="policies">
          <Card>
            <CardHeader className="flex flex-row justify-between items-center">
              <div>
                <CardTitle>Cancellation Policy Timeline</CardTitle>
                <CardDescription>
                  How much passengers get back based on when they cancel
                </CardDescription>
              </div>
              <Button
                onClick={() => onOpen("addRefundPolicy", {})}
                className="cursor-pointer"
              >
                <PlusCircle />
                <span className="capitalize">Add Policy</span>
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Visual Timeline Preview */}
              {policiesTableData && policiesTableData.length > 0 ? (
                <>
                  {/* Horizontal bar visualization */}
                  <div className="rounded-xl border bg-muted/30 p-6 space-y-4">
                    <p className="text-sm font-medium text-muted-foreground">
                      Passenger Refund Timeline — Hours Before Departure
                    </p>
                    <div className="flex w-full h-12 rounded-lg overflow-hidden border">
                      {[...policiesTableData]
                        .sort((a: any, b: any) => a.minHours - b.minHours)
                        .map((policy: any) => {
                          // calculate relative width (cap at 96hrs for visual)
                          const maxDisplay = 96;
                          const min = policy.minHours || 0;
                          const max = policy.maxHours ?? maxDisplay;
                          const span = Math.min(max, maxDisplay) - min;
                          const widthPercent = Math.max((span / maxDisplay) * 100, 12);
                          return (
                            <div
                              key={policy.id}
                              className="flex flex-col items-center justify-center text-xs font-semibold transition-all hover:opacity-90"
                              style={{
                                width: `${widthPercent}%`,
                                backgroundColor: policy.color || "#64748b",
                                color: policy.refundPercentage > 50 ? "#fff" : "#fff",
                              }}
                              title={`${policy.policyName}: ${policy.refundPercentage}% refund (${min}-${policy.maxHours ?? "∞"} hrs)`}
                            >
                              <span>{policy.refundPercentage}%</span>
                              <span className="text-[10px] opacity-80">
                                {min}-{policy.maxHours ?? "∞"}h
                              </span>
                            </div>
                          );
                        })}
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>← Departure</span>
                      <span>48+ hours ahead →</span>
                    </div>
                  </div>

                  {/* Policy Cards Grid */}
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[...policiesTableData]
                      .sort((a: any, b: any) => (b.maxHours ?? 999) - (a.maxHours ?? 999))
                      .map((policy: any) => (
                        <div
                          key={policy.id}
                          className="relative rounded-xl border bg-card p-5 space-y-3 hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => onOpen("editRefundPolicy", policy)}
                        >
                          {/* Color accent bar */}
                          <div
                            className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
                            style={{ backgroundColor: policy.color || "#64748b" }}
                          />

                          <div className="flex items-center justify-between pt-1">
                            <h4 className="font-semibold text-sm">{policy.policyName}</h4>
                            <Badge
                              variant="outline"
                              className="text-xs"
                              style={{
                                borderColor: policy.color || "#64748b",
                                color: policy.color || "#64748b",
                              }}
                            >
                              {policy.isActive !== false ? "Active" : "Inactive"}
                            </Badge>
                          </div>

                          {/* Big refund number */}
                          <div className="flex items-baseline gap-1">
                            <span
                              className="text-3xl font-bold tabular-nums"
                              style={{ color: policy.color || "#64748b" }}
                            >
                              {policy.refundPercentage}%
                            </span>
                            <span className="text-xs text-muted-foreground">refund</span>
                          </div>

                          {/* Time window */}
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            <span>
                              {policy.minHours === 0 && policy.maxHours
                                ? `Within ${policy.maxHours} hours`
                                : policy.maxHours === null
                                ? `${policy.minHours}+ hours before`
                                : `${policy.minHours} – ${policy.maxHours} hours before`}
                            </span>
                          </div>

                          {/* Fee breakdown */}
                          <div className="flex gap-3 text-xs">
                            <div className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3 text-emerald-500" />
                              <span className="text-muted-foreground">
                                {policy.refundPercentage}% back
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <XCircle className="h-3 w-3 text-destructive" />
                              <span className="text-muted-foreground">
                                {policy.deductionPercentage}% fee
                              </span>
                            </div>
                          </div>

                          <p className="text-xs text-muted-foreground/70 leading-relaxed">
                            {policy.description}
                          </p>
                        </div>
                      ))}
                  </div>

                  {/* Example calculation */}
                  <div className="rounded-xl border bg-muted/20 p-5">
                    <p className="text-sm font-medium mb-3">Example: NPR 1,000 Ticket</p>
                    <div className="grid gap-2 md:grid-cols-4">
                      {[...policiesTableData]
                        .sort((a: any, b: any) => (b.maxHours ?? 999) - (a.maxHours ?? 999))
                        .map((policy: any) => (
                          <div key={policy.id} className="flex items-center gap-3 text-sm">
                            <div
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: policy.color }}
                            />
                            <span className="text-muted-foreground">{policy.policyName}:</span>
                            <span className="font-semibold">
                              NPR {Math.round(1000 * policy.refundPercentage / 100).toLocaleString()}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-sm gap-2">
                  <p>No refund policies configured yet</p>
                  <Button
                    variant="outline"
                    onClick={() => onOpen("addRefundPolicy", {})}
                    className="mt-2"
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create First Policy
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
};

export default Refunds;
