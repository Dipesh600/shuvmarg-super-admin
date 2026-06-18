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
    pending: "bg-white/5 text-white border-white/10",
    processing: "bg-white/5 text-white border-white/10",
    completed: "bg-white/5 text-white border-white/10",
    rejected: "bg-white/5 text-white border-white/10",
  };

  return (
    <Card className="bg-[#121212]/30 border-white/5 backdrop-blur-md shadow-xl">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-white">Refund Queue</CardTitle>
            <CardDescription className="text-white/60">
              {pendingCount} pending · {processingCount} processing · {completedCount} completed
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-3 sm:justify-end items-center">
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-4 w-4 text-white/40" />
              <Input
                type="text"
                placeholder="Search ticket, name, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 w-[200px] lg:w-[250px] text-sm bg-white/5 border-white/10 text-white placeholder:text-white/40 focus-visible:ring-[#D3D925]"
              />
            </div>
            <div className="flex gap-2 border-l border-white/10 pl-3">
            {["", "pending", "processing", "completed", "rejected"].map((s) => (
              <Button
                key={s}
                variant={statusFilter === s ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(s)}
                className={`capitalize text-xs ${statusFilter === s ? "bg-[#D3D925] text-[#121212] hover:bg-[#D3D925]/90" : "bg-white/5 border-white/10 text-white/80 hover:bg-white/10 hover:text-white"}`}
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
            <Loader2 className="h-6 w-6 animate-spin text-white/40" />
          </div>
        ) : refunds.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-white/60 text-sm">
            No refund requests found
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-white/60">Ticket</TableHead>
                <TableHead className="text-white/60">Passenger</TableHead>
                <TableHead className="text-white/60">Route</TableHead>
                <TableHead className="text-right text-white/60">Original</TableHead>
                <TableHead className="text-right text-white/60">Refund</TableHead>
                <TableHead className="text-white/60">Reason</TableHead>
                <TableHead className="text-white/60">Requested</TableHead>
                <TableHead className="text-white/60">Status</TableHead>
                <TableHead className="text-white/60">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {refunds.map((refund: any) => (
                <TableRow key={refund._id} className="border-white/5 hover:bg-white/5">
                  <TableCell className="text-xs text-white/40">
                    {refund.booking?.ticketId || "—"}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm text-white/90">{refund.user?.name || "—"}</p>
                      {refund.user?.phone && (
                        <p className="text-xs text-white/60">{refund.user.phone}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-white">{refund.route}</TableCell>
                  <TableCell className="text-right text-sm text-white">
                    Rs. {refund.originalAmount?.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-sm font-semibold text-[#D3D925]">
                    Rs. {refund.refundAmount?.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-sm max-w-[160px] truncate text-white" title={refund.reason}>
                    {refund.reason || "—"}
                  </TableCell>
                  <TableCell className="text-sm text-white/60">
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
                      className={`text-xs ${refund.status === "pending" || refund.status === "processing" ? "bg-[#D3D925] text-[#121212] hover:bg-[#D3D925]/90" : "bg-white/5 border-white/10 text-white/80 hover:bg-white/10 hover:text-white"}`}
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
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Refund Management
          </h2>
          <p className="text-white/60 mt-1 font-medium text-sm">
            Process refund requests and manage policies
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-[#121212]/30 border-white/5 backdrop-blur-md shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-3 pt-4 px-5 border-b border-white/5 bg-white/5">
            <CardTitle className="text-sm font-semibold text-white/80">
              Pending Refunds
            </CardTitle>
            <div className="p-2 bg-white/5 rounded-lg border border-white/5">
              <Clock className="h-4 w-4 text-[#D3D925] shrink-0" />
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-4">
            <div className="text-2xl font-bold text-white">{pendingCount}</div>
            <p className="text-xs text-white/80 mt-1">
              Rs. {pendingAmount.toLocaleString()} total value
            </p>
          </CardContent>
        </Card>
        <Card className="bg-[#121212]/30 border-white/5 backdrop-blur-md shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-3 pt-4 px-5 border-b border-white/5 bg-white/5">
            <CardTitle className="text-sm font-semibold text-white/80">Processing</CardTitle>
            <div className="p-2 bg-white/5 rounded-lg border border-white/5">
              <RotateCcw className="h-4 w-4 text-[#D3D925] shrink-0" />
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-4">
            <div className="text-2xl font-bold text-white">{processingCount}</div>
            <p className="text-xs text-white/80 mt-1">
              Rs. {processingAmount.toLocaleString()} in transit
            </p>
          </CardContent>
        </Card>
        <Card className="bg-[#121212]/30 border-white/5 backdrop-blur-md shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-3 pt-4 px-5 border-b border-white/5 bg-white/5">
            <CardTitle className="text-sm font-semibold text-white/80">
              Completed
            </CardTitle>
            <div className="p-2 bg-white/5 rounded-lg border border-white/5">
              <CheckCircle className="h-4 w-4 text-[#D3D925] shrink-0" />
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-4">
            <div className="text-2xl font-bold text-white">{completedCount}</div>
            <p className="text-xs text-white/80 mt-1">Rs. {completedAmount.toLocaleString()} refunded</p>
          </CardContent>
        </Card>
        <Card className="bg-[#121212]/30 border-white/5 backdrop-blur-md shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-3 pt-4 px-5 border-b border-white/5 bg-white/5">
            <CardTitle className="text-sm font-semibold text-white/80">
              Rejection Rate
            </CardTitle>
            <div className="p-2 bg-white/5 rounded-lg border border-white/5">
              <XCircle className="h-4 w-4 text-[#D3D925] shrink-0" />
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-4">
            <div className="text-2xl font-bold text-white">{rejectionRate}%</div>
            <p className="text-xs text-white/80 mt-1">Of {totalRequests} total requests</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="requests" className="space-y-4">
        <TabsList className="bg-[#121212]/30 border border-white/5">
          <TabsTrigger value="requests" className="data-[state=active]:bg-[#D3D925] data-[state=active]:text-[#121212] text-white/60">Refund Requests</TabsTrigger>
          <TabsTrigger value="policies" className="data-[state=active]:bg-[#D3D925] data-[state=active]:text-[#121212] text-white/60">Refund Policies</TabsTrigger>
        </TabsList>

        <TabsContent value="requests">
          <RefundRequestsTab onOpen={onOpen} />
        </TabsContent>

        <TabsContent value="policies">
          <Card className="bg-[#121212]/30 border-white/5 backdrop-blur-md shadow-xl">
            <CardHeader className="border-b border-white/5 bg-white/5 pb-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-white">Cancellation Policy Timeline</CardTitle>
                <CardDescription className="text-white/60">
                  How much passengers get back based on when they cancel
                </CardDescription>
              </div>
              <Button
                onClick={() => onOpen("addRefundPolicy", {})}
                className="cursor-pointer bg-[#D3D925] text-[#121212] hover:bg-[#D3D925]/90"
              >
                <PlusCircle className="mr-2" />
                <span className="capitalize font-bold">Add Policy</span>
              </Button>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {/* Visual Timeline Preview */}
              {policiesTableData && policiesTableData.length > 0 ? (
                <>
                  {/* Horizontal bar visualization */}
                  <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-4">
                    <p className="text-sm font-medium text-white/80">
                      Passenger Refund Timeline — Hours Before Departure
                    </p>
                    <div className="flex w-full h-12 rounded-lg overflow-hidden border border-white/10">
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
                    <div className="flex justify-between text-xs text-white/40">
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
                          className="relative rounded-xl border border-white/10 bg-white/5 p-5 space-y-3 hover:bg-white/10 transition-colors cursor-pointer"
                          onClick={() => onOpen("editRefundPolicy", policy)}
                        >
                          {/* Color accent bar */}
                          <div
                            className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
                            style={{ backgroundColor: policy.color || "#64748b" }}
                          />

                          <div className="flex items-center justify-between pt-1">
                            <h4 className="font-semibold text-sm text-white">{policy.policyName}</h4>
                            <Badge
                              variant="outline"
                              className="text-xs bg-[#121212]/30"
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
                            <span className="text-xs text-white/40">refund</span>
                          </div>

                          {/* Time window */}
                          <div className="flex items-center gap-2 text-sm text-white/60">
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
                              <CheckCircle className="h-3 w-3 text-white" />
                              <span className="text-white/60">
                                {policy.refundPercentage}% back
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <XCircle className="h-3 w-3 text-white" />
                              <span className="text-white/60">
                                {policy.deductionPercentage}% fee
                              </span>
                            </div>
                          </div>

                          <p className="text-xs text-white/40 leading-relaxed">
                            {policy.description}
                          </p>
                        </div>
                      ))}
                  </div>

                  {/* Example calculation */}
                  <div className="rounded-xl border border-white/10 bg-[#121212]/30 p-5">
                    <p className="text-sm font-medium mb-3 text-white">Example: NPR 1,000 Ticket</p>
                    <div className="grid gap-2 md:grid-cols-4">
                      {[...policiesTableData]
                        .sort((a: any, b: any) => (b.maxHours ?? 999) - (a.maxHours ?? 999))
                        .map((policy: any) => (
                          <div key={policy.id} className="flex items-center gap-3 text-sm">
                            <div
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: policy.color }}
                            />
                            <span className="text-white/60">{policy.policyName}:</span>
                            <span className="font-semibold text-white">
                              NPR {Math.round(1000 * policy.refundPercentage / 100).toLocaleString()}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 text-white/40 text-sm gap-2">
                  <p>No refund policies configured yet</p>
                  <Button
                    variant="outline"
                    onClick={() => onOpen("addRefundPolicy", {})}
                    className="mt-2 bg-[#121212]/30 border-white/5 text-white hover:bg-white/10"
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
