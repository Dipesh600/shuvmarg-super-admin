import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Wallet, Clock, CheckCircle2, RefreshCw, Download,
  AlertCircle, TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { getSettlements, paySettlement, type Settlement } from "@/api/settlementApi";

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending:    "outline",
  processing: "secondary",
  paid:       "default",
  disputed:   "destructive",
};

const statusColor: Record<string, string> = {
  pending:    "text-orange-500",
  processing: "text-blue-500",
  paid:       "text-green-600",
  disputed:   "text-red-500",
};

export default function Settlements() {
  const queryClient = useQueryClient();
  const [selectedSettlement, setSelectedSettlement] = useState<Settlement | null>(null);
  const [payRef, setPayRef] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["settlements", filterStatus],
    queryFn: () => getSettlements(filterStatus !== "all" ? { status: filterStatus } : {}),
    staleTime: 2 * 60 * 1000,
  });

  const { mutate: approveSettlement, isPending: isPaying } = useMutation({
    mutationFn: ({ id, ref }: { id: string; ref: string }) =>
      paySettlement(id, ref),
    onSuccess: () => {
      toast.success("Settlement marked as paid successfully.");
      queryClient.invalidateQueries({ queryKey: ["settlements"] });
      setSelectedSettlement(null);
      setPayRef("");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to process settlement.");
    },
  });

  const settlements: Settlement[] = data?.data ?? [];

  // Stats aggregation
  const totalPending   = settlements.filter(s => s.status === "pending").length;
  const totalPendingAmt = settlements
    .filter(s => s.status === "pending")
    .reduce((sum, s) => sum + s.netPayable, 0);
  const totalPaidAmt   = settlements
    .filter(s => s.status === "paid")
    .reduce((sum, s) => sum + s.netPayable, 0);
  const totalCommission = settlements.reduce((sum, s) => sum + s.platformCommission, 0);

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Settlement Management
          </h2>
          <p className="text-muted-foreground mt-1">
            Review and approve bus owner settlement requests
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" /> Export
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Settlements</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPending}</div>
            <p className="text-xs text-muted-foreground">
              Rs. {totalPendingAmt.toLocaleString("en-IN")} total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Paid Out</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Rs. {totalPaidAmt.toLocaleString("en-IN")}
            </div>
            <p className="text-xs text-muted-foreground">This period</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Platform Commission</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Rs. {totalCommission.toLocaleString("en-IN")}
            </div>
            <p className="text-xs text-muted-foreground">From all settlements</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Settlements</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{settlements.length}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {["all", "pending", "processing", "paid", "disputed"].map(s => (
          <Button
            key={s}
            variant={filterStatus === s ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus(s)}
            className="capitalize"
          >
            {s}
          </Button>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-16">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center gap-2 p-16 text-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <p className="text-sm text-muted-foreground">Failed to load settlements.</p>
            </div>
          ) : settlements.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 p-16 text-center">
              <Wallet className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No settlements found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bus Owner</TableHead>
                  <TableHead>Trips</TableHead>
                  <TableHead className="text-right">Gross Revenue</TableHead>
                  <TableHead className="text-right">Commission</TableHead>
                  <TableHead className="text-right">Net Payable</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Raised At</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {settlements.map((s) => (
                  <TableRow key={s._id}>
                    <TableCell>
                      <div className="font-medium">{s.ownerId?.name ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">
                        {s.ownerId?.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{s.tripIds?.length ?? 0} trips</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      Rs. {s.totalGross?.toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell className="text-right font-mono text-blue-600">
                      Rs. {s.platformCommission?.toLocaleString("en-IN")}
                      <span className="text-xs text-muted-foreground ml-1">
                        ({s.commissionRate}%)
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold">
                      Rs. {s.netPayable?.toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={statusVariant[s.status]}
                        className={statusColor[s.status]}
                      >
                        {s.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(s.raisedAt).toLocaleDateString("en-IN")}
                    </TableCell>
                    <TableCell className="text-right">
                      {s.status === "pending" || s.status === "processing" ? (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedSettlement(s);
                            setPayRef("");
                          }}
                        >
                          Approve & Pay
                        </Button>
                      ) : s.status === "paid" ? (
                        <span className="text-xs text-green-600 font-medium">Paid ✓</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pay Settlement Dialog */}
      <Dialog
        open={!!selectedSettlement}
        onOpenChange={(o) => { if (!o) setSelectedSettlement(null); }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Approve & Pay Settlement</DialogTitle>
            <DialogDescription>
              This will mark the settlement as paid and notify the bus owner.
            </DialogDescription>
          </DialogHeader>

          {selectedSettlement && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Bus Owner</span>
                <span className="font-medium">{selectedSettlement.ownerId?.name}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Gross Revenue</span>
                <span>Rs. {selectedSettlement.totalGross?.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">
                  Platform Commission ({selectedSettlement.commissionRate}%)
                </span>
                <span className="text-blue-600">
                  − Rs. {selectedSettlement.platformCommission?.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between font-bold text-base">
                <span>Net Payable</span>
                <span className="text-green-600">
                  Rs. {selectedSettlement.netPayable?.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="pt-2">
                <label className="text-xs text-muted-foreground mb-1 block">
                  Payment Reference (optional)
                </label>
                <Input
                  placeholder="Bank transfer ref, eSewa txn ID, etc."
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedSettlement(null)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                approveSettlement({
                  id: selectedSettlement!._id,
                  ref: payRef,
                })
              }
              disabled={isPaying}
            >
              {isPaying ? "Processing..." : "Confirm Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
