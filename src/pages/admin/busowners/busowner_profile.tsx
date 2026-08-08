import { useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ArrowLeft, Mail, Phone, MapPin, Calendar, Edit, Bus, CreditCard,
  CheckCircle2, XCircle, AlertCircle, UploadCloud, Plus, Loader2, Building2, Activity,
  Briefcase, Copy
} from "lucide-react";
import { toast } from "sonner";
import { useModal } from "@/hooks/use-model-store";
import { SuspendDialog } from "@/components/models/suspended-model";
import { useFetchOwnerDetail } from "@/hooks/useFetchBusOwner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BusOwnerDetailSkeleton } from "@/components/Skeletion_Loading/BusOwnerDetailSkeleton";
import { getBrandsByOwner, createBrand } from "@/api/operatorBrandApi";
import { StatCard } from "@/components/dashboard/StatCard";

// ── Components for different tabs ─────────────────────────────────────────────

const OverviewTab = ({ busOWnerDetail, taxReg, bankDet, ownerStatus, verificationStatus }: any) => {
  const handleCopyBankDetails = () => {
    const details = [
      `Bank: ${bankDet.bankName || 'Not Provided'}`,
      bankDet.branchName ? `Branch: ${bankDet.branchName}` : null,
      `Account Number: ${bankDet.accountNumber || 'Not Provided'}`,
      `Account Holder: ${bankDet.accountHolderName || 'Not Provided'}`
    ].filter(Boolean).join('\n');
    
    navigator.clipboard.writeText(details);
    toast.success("Bank details copied to clipboard!");
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 animate-in fade-in duration-300">
      <Card className="border-white/5 bg-[#121212]/30 backdrop-blur-md shadow-xl text-white lg:col-span-1">
        <CardHeader className="border-b border-white/5 bg-white/5 pb-4">
          <CardTitle className="flex items-center gap-2 text-white">
            Owner Profile
            <Badge variant={ownerStatus === "active" ? "default" : "destructive"} className="text-[10px] font-bold">
              {ownerStatus.toUpperCase()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center py-2">
            <div className="relative group">
              <div className="w-24 h-24 rounded-2xl bg-primary/5 flex items-center justify-center overflow-hidden border-2 border-muted/50">
                <Avatar className="h-full w-full rounded-none">
                  <AvatarImage src={busOWnerDetail?.profilePicture} className="object-cover" />
                  <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">
                    {busOWnerDetail.busOwnerDoc?.companyName?.substring(0, 2).toUpperCase() || "BO"}
                  </AvatarFallback>
                </Avatar>
              </div>
              {verificationStatus === "approved" && (
                <div className="absolute -bottom-2 -right-2 bg-white/5 text-white rounded-full p-1 border-2 border-background shadow-sm">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              )}
            </div>
          </div>
          <div className="text-center space-y-1">
            <h3 className="text-xl font-bold tracking-tight">{busOWnerDetail.busOwnerDoc?.companyName || "N/A"}</h3>
            <p className="text-sm text-muted-foreground font-medium">Primary Contact: {busOWnerDetail.name}</p>
          </div>
          <div className="space-y-3 pt-4 border-t border-muted/40">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="truncate">{busOWnerDetail.email?.includes("@shuvmarg.internal") ? "Email not provided" : busOWnerDetail.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>{busOWnerDetail.phone}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="line-clamp-2">{busOWnerDetail.address}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>Joined {new Date(busOWnerDetail.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/5 bg-[#121212]/30 backdrop-blur-md shadow-xl text-white lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">Legal & Financial Details</CardTitle>
          <CardDescription className="text-white/60">Verified tax and banking information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4 p-4 rounded-xl border bg-muted/20 hover:bg-muted/30 transition-colors">
                <div className="p-3 bg-primary/10 rounded-xl text-primary">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-1">PAN/VAT Number</p>
                  <p className="text-lg font-black tracking-tight text-foreground">{taxReg.panNumber || "Not Provided"}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-xl border bg-muted/20 hover:bg-muted/30 transition-colors">
                <div className="p-3 bg-primary/10 rounded-xl text-primary">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-1">Registration No</p>
                  <p className="text-lg font-black tracking-tight text-foreground">{taxReg.registrationNumber || "Not Provided"}</p>
                </div>
              </div>
            </div>

            <div className="relative p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/50 overflow-hidden shadow-xl group hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300">
              <div className="absolute -right-6 -top-6 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
                <Building2 className="w-40 h-40 text-white" />
              </div>
              <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <div className="relative z-10 flex flex-col h-full justify-between gap-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Bank Account</p>
                    <p className="text-base font-bold text-slate-100">
                      {bankDet.bankName || "Not Provided"}
                    </p>
                    {bankDet.branchName && (
                      <p className="text-xs font-medium text-slate-400 mt-0.5">{bankDet.branchName} Branch</p>
                    )}
                  </div>
                  <button 
                    onClick={handleCopyBankDetails}
                    title="Copy All Bank Details"
                    className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl backdrop-blur-md border border-white/10 shadow-sm transition-all group/copy relative"
                  >
                    <Copy className="w-5 h-5 text-slate-200 absolute opacity-0 group-hover/copy:opacity-100 transition-opacity" />
                    <CreditCard className="w-5 h-5 text-slate-200 group-hover/copy:opacity-0 transition-opacity" />
                  </button>
                </div>
                
                <div className="mt-2">
                  <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Account Number</p>
                  <p className="text-xl font-bold tracking-[0.2em] text-white">
                    {bankDet.accountNumber ? bankDet.accountNumber.replace(/(\d{4})/g, '$1 ').trim() : "XXXX XXXX XXXX XXXX"}
                  </p>
                </div>

                <div className="mt-1">
                  <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Account Holder</p>
                  <p className="text-sm font-bold text-slate-200 uppercase tracking-wide truncate">
                    {bankDet.accountHolderName || "NOT PROVIDED"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const KycDocsTab = ({ verificationStatus, documentSections, busOWnerDetail, id, onOpen, navigate }: any) => {
  const hasRejectedDocs = verificationStatus === "rejected" || documentSections.some((d: any) => d.rejectionReason);
  
  return (
    <Card className="border-white/5 bg-[#121212]/30 backdrop-blur-md shadow-xl text-white animate-in fade-in duration-300">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-white">KYC Verification Status</CardTitle>
            <CardDescription className="text-white/60">
              {verificationStatus === "pending" ? "Documents are currently under review." : "Document verification history and status."}
            </CardDescription>
          </div>
          {verificationStatus === "pending" && (
            <Button size="sm" onClick={() => navigate(`/admin/kyc/bus-owner/${busOWnerDetail.busOwnerDoc?._id}`)}>
              Process Verification
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {documentSections.map((doc: any, idx: number) => {
            const isRejected = !!doc.rejectionReason;
            const isVerified = doc.verified === true;
            const isPending = doc.verified === false && !doc.rejectionReason;
            const notSubmitted = !doc.present;

            return (
              <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border bg-muted/10 gap-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {isVerified && <CheckCircle2 className="h-5 w-5 text-white" />}
                    {isRejected && <XCircle className="h-5 w-5 text-destructive" />}
                    {(isPending || notSubmitted) && <AlertCircle className="h-5 w-5 text-muted-foreground" />}
                  </div>
                  <div>
                    <p className="font-bold text-sm">{doc.label}</p>
                    {isRejected ? (
                      <p className="text-xs text-destructive mt-0.5 font-medium">Rejected: {doc.rejectionReason}</p>
                    ) : isVerified ? (
                      <p className="text-xs text-white font-medium mt-0.5">Verified</p>
                    ) : notSubmitted ? (
                      <p className="text-xs text-muted-foreground mt-0.5">Not submitted</p>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-0.5">Pending Review</p>
                    )}
                  </div>
                </div>
                {isRejected && (
                  <Button variant="outline" size="sm" className="shrink-0 gap-2 h-9 rounded-lg"
                    onClick={() => onOpen("reuploadKycDocument", { busOwnerId: busOWnerDetail.busOwnerDoc?._id, userId: id, documentType: doc.type, documentLabel: doc.label })}>
                    <UploadCloud className="h-4 w-4" /> Re-upload
                  </Button>
                )}
              </div>
            );
          })}
        </div>
        {hasRejectedDocs && (
          <div className="mt-6 p-4 bg-destructive/10 text-destructive rounded-xl border border-destructive/20 text-sm">
            <strong>Action Required:</strong> Please re-upload the rejected documents above to resume the verification process.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const OperatorsTab = ({ ownerId }: { ownerId: string }) => {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ brandName: "", contactEmail: "", contactPhone: "", baseCity: "", commissionRate: "8" });

  const { data, isLoading } = useQuery({
    queryKey: ["owner-brands", ownerId],
    queryFn: () => getBrandsByOwner(ownerId),
    enabled: !!ownerId,
  });
  const brands = data?.data || [];

  const mutation = useMutation({
    mutationFn: (payload: any) => createBrand({ ownerId, ...payload }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["owner-brands", ownerId] });
      toast.success("Operator Brand created successfully.");
      setAddOpen(false);
      setForm({ brandName: "", contactEmail: "", contactPhone: "", baseCity: "", commissionRate: "8" });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || e.message),
  });

  return (
    <Card className="border-white/5 bg-[#121212]/30 backdrop-blur-md shadow-xl text-white animate-in fade-in duration-300">
      <CardHeader className="border-b border-white/5 bg-white/5 pb-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-white">Operator Brands</CardTitle>
          <CardDescription className="text-white/60">Commercial operating identities and their fleets under this owner.</CardDescription>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 font-bold rounded-xl h-10 bg-white/5 hover:bg-white/5">
              <Plus className="w-4 h-4" /> Add Operator
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[460px] rounded-2xl border-none shadow-2xl p-0 overflow-hidden">
            <div className="bg-slate-900 p-7 text-white">
              <DialogHeader>
                <DialogTitle className="text-lg font-black flex items-center gap-2.5">
                  <div className="p-1.5 bg-white/10 rounded-lg"><Briefcase className="w-4 h-4" /></div>
                  Create Operator Brand
                </DialogTitle>
              </DialogHeader>
              <p className="text-slate-400 text-sm mt-1.5 ml-9">Register a new operating identity for this owner.</p>
            </div>
            <div className="p-7 space-y-4 bg-background">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Brand Name</Label>
                <Input placeholder="e.g. Himalayan Express" className="h-11 rounded-xl font-bold"
                  value={form.brandName} onChange={e => setForm({ ...form, brandName: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Contact Email</Label>
                  <Input placeholder="email@brand.com" className="h-11 rounded-xl"
                    value={form.contactEmail} onChange={e => setForm({ ...form, contactEmail: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Contact Phone</Label>
                  <Input placeholder="+977..." className="h-11 rounded-xl"
                    value={form.contactPhone} onChange={e => setForm({ ...form, contactPhone: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Base City</Label>
                  <Input placeholder="e.g. Kathmandu" className="h-11 rounded-xl"
                    value={form.baseCity} onChange={e => setForm({ ...form, baseCity: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Platform Cut (%)</Label>
                  <Input type="number" placeholder="8" className="h-11 rounded-xl font-bold"
                    value={form.commissionRate} onChange={e => setForm({ ...form, commissionRate: e.target.value })} />
                </div>
              </div>
            </div>
            <DialogFooter className="p-7 pt-0 bg-background gap-3">
              <Button variant="outline" onClick={() => setAddOpen(false)} className="font-bold rounded-xl h-11">Cancel</Button>
              <Button className="h-11 rounded-xl font-black bg-slate-900 hover:bg-slate-800 text-white px-8"
                disabled={mutation.isPending || !form.brandName} onClick={() => mutation.mutate({ ...form, commissionRate: Number(form.commissionRate) })}>
                {mutation.isPending && <Loader2 className="mr-2 w-4 h-4 animate-spin" />} Create Brand
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="rounded-xl border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-bold text-xs uppercase tracking-wider">Operator Brand</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider">Status</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider">Fleet Count</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider">Commission</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="h-32 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground/40" /></TableCell></TableRow>
              ) : brands.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="h-32 text-center text-muted-foreground">No operator brands found. Create one to get started.</TableCell></TableRow>
              ) : brands.map((b: any) => (
                <TableRow key={b._id} className="hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <div>
                      <p className="font-bold text-sm">{b.brandName}</p>
                      <p className="text-[10px] text-muted-foreground uppercase mt-0.5">{b.brandCode}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] font-black border-none ${b.status === "ACTIVE" ? "bg-white/5 text-white" : b.status === "SUSPENDED" ? "bg-white/5 text-white" : "bg-white/5 text-white"}`}>
                      {b.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium text-sm"><span className="flex items-center gap-1.5"><Bus className="w-3.5 h-3.5 text-muted-foreground"/> {b.fleetCount} buses</span></TableCell>
                  <TableCell className="font-bold text-sm">{b.commissionRate}%</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="font-bold text-white hover:text-white hover:bg-white/5"
                      onClick={() => navigate(`/admin/bus-owners/operator/${b._id}`)}>
                      Manage
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

const FinancialTab = ({ busOWnerDetail, recentPayments }: any) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="This Month Revenue"
          value={busOWnerDetail.monthlyRevenue || "NPR 0"}
          icon={Activity}
          subtitle="Total income"
          changeType="neutral"
        />
        <StatCard
          title="Pending Settlement"
          value={busOWnerDetail.pendingSettlement ? `NPR ${busOWnerDetail.pendingSettlement}` : "NPR 0"}
          icon={AlertCircle}
          subtitle="To be paid out"
          changeType="negative"
        />
        <StatCard
          title="Last Payout"
          value={busOWnerDetail.lastPayoutDate ? new Date(busOWnerDetail.lastPayoutDate).toLocaleDateString() : "N/A"}
          icon={Calendar}
          subtitle="Recent settlement"
          changeType="neutral"
        />
        <StatCard
          title="Default Commission"
          value={`${busOWnerDetail.defaultCommissionRate || 8}% platform`}
          icon={Briefcase}
          subtitle="Revenue share"
          changeType="neutral"
        />
      </div>

      <Card className="border-white/5 bg-[#121212]/30 backdrop-blur-md shadow-xl text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">Settlement Batches</CardTitle>
          <CardDescription className="text-white/60">History of payouts made to this owner.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Settlement ID</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Period</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Amount</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Date</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentPayments.length > 0 ? recentPayments.map((payment: any) => (
                  <TableRow key={payment.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium text-sm">{payment.id}</TableCell>
                    <TableCell className="text-sm">{payment.period}</TableCell>
                    <TableCell className="text-sm font-bold">{payment.amount}</TableCell>
                    <TableCell className="text-sm">{payment.date}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] border-none font-black px-2 bg-white/5 text-white">
                        {payment.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground italic text-sm">No recent settlements found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const ActivityLogTab = () => {
  return (
    <Card className="border-white/5 bg-[#121212]/30 backdrop-blur-md shadow-xl text-white animate-in fade-in duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">Activity Log</CardTitle>
        <CardDescription className="text-white/60">Timestamped log of every admin action on this owner.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground border-2 border-dashed border-muted rounded-xl">
          <Activity className="w-10 h-10 mb-4 opacity-20" />
          <p className="text-sm font-bold">No recent activity</p>
          <p className="text-xs mt-1 opacity-60">Admin actions will appear here automatically.</p>
        </div>
      </CardContent>
    </Card>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────

const BusOwnerDetail = () => {
  const { id } = useParams();
  const { onOpen } = useModal();
  const { data, isLoading, isError, error } = useFetchOwnerDetail(id);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  const busOWnerDetail = data ? {
    ...data.profile,
    address: "Not provided",
    createdAt: data.createdAt,
    recentPayments: [],
    busOwnerDoc: {
      _id: data.ownerId,
      busOwnerId: data.ownerCode,
      companyName: data.business.companyName,
      verificationStatus: data.verificationStatus,
      companyRegistration: data.documents.companyRegistration,
      ownerIdentity: data.documents.ownerIdentity,
      taxRegistration: data.documents.taxRegistration,
      bankDetails: data.bank,
    },
  } : null;

  if (isLoading) return <BusOwnerDetailSkeleton />;
  if (isError) return <div>{JSON.stringify(error)}</div>;
  if (!busOWnerDetail) return <div>Bus Owner not found.</div>;

  const companyReg = busOWnerDetail.busOwnerDoc?.companyRegistration || {};
  const taxReg = busOWnerDetail.busOwnerDoc?.taxRegistration || {};
  const bankDet = busOWnerDetail.busOwnerDoc?.bankDetails || {};
  const ownerIden = busOWnerDetail.busOwnerDoc?.ownerIdentity || {};
  const verificationStatus = busOWnerDetail.busOwnerDoc?.verificationStatus || "pending";
  const ownerStatus = busOWnerDetail.status;
  const recentPayments = busOWnerDetail.recentPayments || [];

  const documentSections = [
    { label: "Company Registration", type: "companyRegistration", ...companyReg },
    { label: "Owner Identity", type: "ownerIdentity", ...ownerIden },
    { label: "Tax Registration", type: "taxRegistration", ...taxReg },
  ];

  return (
    <div className="container mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate("/admin/bus-owners")} className="h-10 w-10 rounded-xl">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              {busOWnerDetail.busOwnerDoc?.companyName || "Bus Owner Profile"}
              {verificationStatus === "approved" && <CheckCircle2 className="w-5 h-5 text-[#D3D925]" />}
            </h2>
            <p className="text-white/60 mt-1 font-medium text-sm">
              Owner ID: {busOWnerDetail.busOwnerDoc?.busOwnerId || busOWnerDetail.busOwnerDoc?._id || id}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <Button onClick={() => onOpen("editBusOwner", { busOwner: busOWnerDetail })} variant="outline" size="sm" className="gap-2 h-10 rounded-xl font-bold hidden sm:flex">
            <Edit className="h-4 w-4" /> Edit
          </Button>
          <SuspendDialog entityType="bus owner" entityName={busOWnerDetail.busOwnerDoc?.companyName || busOWnerDetail.name} currentStatus={ownerStatus} entityId={id ?? ""} />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="inline-flex h-auto p-1.5 bg-muted/40 rounded-2xl border border-border/50 mb-6 gap-1 w-full overflow-x-auto justify-start sm:justify-start">
          <TabsTrigger value="overview" className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-xl data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md border border-transparent transition-all whitespace-nowrap">
            Overview
          </TabsTrigger>
          <TabsTrigger value="kyc" className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-xl data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md border border-transparent transition-all whitespace-nowrap">
            KYC Docs
            {verificationStatus !== "approved" && <div className="w-2 h-2 rounded-full bg-white/5 ml-1" />}
          </TabsTrigger>
          <TabsTrigger value="operators" className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-xl data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md border border-transparent transition-all whitespace-nowrap">
            Operators
          </TabsTrigger>
          <TabsTrigger value="financial" className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-xl data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md border border-transparent transition-all whitespace-nowrap">
            Financial
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-xl data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md border border-transparent transition-all whitespace-nowrap">
            Activity Log
          </TabsTrigger>
        </TabsList>

        <div className="mt-2">
          <TabsContent value="overview">
            <OverviewTab busOWnerDetail={busOWnerDetail} taxReg={taxReg} bankDet={bankDet} ownerStatus={ownerStatus} verificationStatus={verificationStatus} />
          </TabsContent>
          <TabsContent value="kyc">
            <KycDocsTab verificationStatus={verificationStatus} documentSections={documentSections} busOWnerDetail={busOWnerDetail} id={id} onOpen={onOpen} navigate={navigate} />
          </TabsContent>
          <TabsContent value="operators">
            <OperatorsTab ownerId={id!} />
          </TabsContent>
          <TabsContent value="financial">
            <FinancialTab busOWnerDetail={busOWnerDetail} recentPayments={recentPayments} />
          </TabsContent>
          <TabsContent value="activity">
            <ActivityLogTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default BusOwnerDetail;
