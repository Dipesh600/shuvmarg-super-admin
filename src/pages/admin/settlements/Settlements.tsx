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
  pending:    "text-white",
  processing: "text-white",
  paid:       "text-white",
  disputed:   "text-white",
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
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Settlement Management
          </h2>
          <p className="text-white/60 mt-1">
            Review and approve bus owner settlement requests
          </p>
        </div>
        <Button variant="outline" className="gap-2 bg-transparent border-white/10 text-white hover:bg-white/5 hover:text-white">
          <Download className="h-4 w-4 text-[#D3D925]" /> Export
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-4">
        <Card className="bg-[#121212]/30 border-white/5 backdrop-blur-md shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-3 pt-4 px-5 border-b border-white/5 bg-white/5">
            <CardTitle className="text-sm font-semibold text-white/80">Pending Settlements</CardTitle>
            <div className="p-2 bg-white/5 rounded-lg border border-white/5">
              <Clock className="h-4 w-4 text-[#D3D925] shrink-0" />
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-4">
            <div className="text-2xl font-bold text-white">{totalPending}</div>
            <p className="text-xs text-white/80 mt-1">
              Rs. {totalPendingAmt.toLocaleString("en-IN")} total
            </p>
          </CardContent>
        </Card>
        <Card className="bg-[#121212]/30 border-white/5 backdrop-blur-md shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-3 pt-4 px-5 border-b border-white/5 bg-white/5">
            <CardTitle className="text-sm font-semibold text-white/80">Paid Out</CardTitle>
            <div className="p-2 bg-white/5 rounded-lg border border-white/5">
              <CheckCircle2 className="h-4 w-4 text-[#D3D925] shrink-0" />
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-4">
            <div className="text-2xl font-bold text-white">
              Rs. {totalPaidAmt.toLocaleString("en-IN")}
            </div>
            <p className="text-xs text-white/80 mt-1">This period</p>
          </CardContent>
        </Card>
        <Card className="bg-[#121212]/30 border-white/5 backdrop-blur-md shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-3 pt-4 px-5 border-b border-white/5 bg-white/5">
            <CardTitle className="text-sm font-semibold text-white/80">Platform Commission</CardTitle>
            <div className="p-2 bg-white/5 rounded-lg border border-white/5">
              <TrendingUp className="h-4 w-4 text-[#D3D925] shrink-0" />
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-4">
            <div className="text-2xl font-bold text-white">
              Rs. {totalCommission.toLocaleString("en-IN")}
            </div>
            <p className="text-xs text-white/80 mt-1">From all settlements</p>
          </CardContent>
        </Card>
        <Card className="bg-[#121212]/30 border-white/5 backdrop-blur-md shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-3 pt-4 px-5 border-b border-white/5 bg-white/5">
            <CardTitle className="text-sm font-semibold text-white/80">Total Settlements</CardTitle>
            <div className="p-2 bg-white/5 rounded-lg border border-white/5">
              <Wallet className="h-4 w-4 text-[#D3D925] shrink-0" />
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-4">
            <div className="text-2xl font-bold text-white">{settlements.length}</div>
            <p className="text-xs text-white/80 mt-1">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap mb-4">
        {["all", "pending", "processing", "paid", "disputed"].map(s => (
          <Button
            key={s}
            variant={filterStatus === s ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus(s)}
            className={`capitalize ${filterStatus === s ? "bg-[#D3D925] text-black hover:bg-[#b5bc1b] font-semibold border-0" : "bg-transparent border-white/10 text-white hover:bg-white/5 hover:text-white"}`}
          >
            {s}
          </Button>
        ))}
      </div>

      {/* Table */}
      <Card className="bg-[#121212]/30 border-white/5 backdrop-blur-md shadow-xl overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-16">
              <RefreshCw className="h-6 w-6 animate-spin text-white/50" />
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center gap-2 p-16 text-center">
              <AlertCircle className="h-8 w-8 text-white" />
              <p className="text-sm text-white/60">Failed to load settlements.</p>
            </div>
          ) : settlements.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 p-16 text-center">
              <Wallet className="h-8 w-8 text-white/30" />
              <p className="text-sm text-white/60">No settlements found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-white/5 border-b border-white/5">
                <TableRow className="hover:bg-transparent border-white/5">
                  <TableHead className="text-white/80 font-semibold">Bus Owner</TableHead>
                  <TableHead className="text-white/80 font-semibold">Trips</TableHead>
                  <TableHead className="text-right text-white/80 font-semibold">Gross Revenue</TableHead>
                  <TableHead className="text-right text-white/80 font-semibold">Commission</TableHead>
                  <TableHead className="text-right text-white/80 font-semibold">Net Payable</TableHead>
                  <TableHead className="text-white/80 font-semibold">Status</TableHead>
                  <TableHead className="text-white/80 font-semibold">Raised At</TableHead>
                  <TableHead className="text-right text-white/80 font-semibold">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {settlements.map((s) => (
                  <TableRow key={s._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <TableCell>
                      <div className="font-medium text-white">{s.ownerId?.name ?? "—"}</div>
                      <div className="text-xs text-white/50">
                        {s.ownerId?.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-white/10 text-white bg-white/5">{s.tripIds?.length ?? 0} trips</Badge>
                    </TableCell>
                    <TableCell className="text-right text-white">
                      Rs. {s.totalGross?.toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell className="text-right text-white">
                      Rs. {s.platformCommission?.toLocaleString("en-IN")}
                      <span className="text-xs text-white/60 ml-1">
                        ({s.commissionRate}%)
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-bold text-white">
                      Rs. {s.netPayable?.toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          s.status === "paid" ? "border-white/10 text-white bg-white/5" :
                          s.status === "pending" ? "border-white/10 text-white bg-white/5" :
                          s.status === "processing" ? "border-white/10 text-white bg-white/5" :
                          "border-white/10 text-white bg-white/5"
                        }
                      >
                        {s.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-white/60">
                      {new Date(s.raisedAt).toLocaleDateString("en-IN")}
                    </TableCell>
                    <TableCell className="text-right">
                      {s.status === "pending" || s.status === "processing" ? (
                        <Button
                          size="sm"
                          className="bg-[#D3D925] hover:bg-[#b5bc1b] text-black font-semibold border-0"
                          onClick={() => {
                            setSelectedSettlement(s);
                            setPayRef("");
                          }}
                        >
                          Approve & Pay
                        </Button>
                      ) : s.status === "paid" ? (
                        <span className="text-xs text-white font-medium">Paid ✓</span>
                      ) : (
                        <span className="text-xs text-white/50">—</span>
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
        <DialogContent className="max-w-md bg-[#121212] border border-white/10 text-white shadow-2xl backdrop-blur-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Approve & Pay Settlement</DialogTitle>
            <DialogDescription className="text-white/60">
              This will mark the settlement as paid and notify the bus owner.
            </DialogDescription>
          </DialogHeader>

          {selectedSettlement && (
            <div className="space-y-3 text-sm pt-4">
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-white/60">Bus Owner</span>
                <span className="font-medium text-white">{selectedSettlement.ownerId?.name}</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-white/60">Gross Revenue</span>
                <span className="text-white">Rs. {selectedSettlement.totalGross?.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-white/60">
                  Platform Commission ({selectedSettlement.commissionRate}%)
                </span>
                <span className="text-white">
                  − Rs. {selectedSettlement.platformCommission?.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between font-bold text-base pt-2">
                <span className="text-white">Net Payable</span>
                <span className="text-[#D3D925]">
                  Rs. {selectedSettlement.netPayable?.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="pt-4">
                <label className="text-xs text-white/60 mb-1.5 block">
                  Payment Reference (optional)
                </label>
                <Input
                  placeholder="Bank transfer ref, eSewa txn ID, etc."
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  className="bg-white/5 border-white/10 text-white focus-visible:ring-[#D3D925]"
                />
              </div>
            </div>
          )}

          <DialogFooter className="mt-6 border-t border-white/10 pt-4">
            <Button variant="outline" className="bg-transparent border-white/10 text-white hover:bg-white/5 hover:text-white" onClick={() => setSelectedSettlement(null)}>
              Cancel
            </Button>
            <Button
              className="bg-[#D3D925] hover:bg-[#b5bc1b] text-black font-semibold border-0"
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
