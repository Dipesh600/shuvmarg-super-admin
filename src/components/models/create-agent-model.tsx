import { useState, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useModal } from "@/hooks/use-model-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  Loader2,
  Search,
  User,
  Users,
  Building2,
  CheckCircle2,
  ArrowLeft,
  Info,
  AlertTriangle,
  Phone,
  Route,
} from "lucide-react";
import { toast } from "sonner";
import {
  searchUsersByPhone,
  makeUserAgent,
  finalizeAgentSetup,
  getAllBrands,
  getBrandRouteServices,
  type AgentBrandOption,
  type AgentRouteServiceOption,
} from "@/api/agentApi";
import { getErrorMessage } from "@/lib/error-message";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type AgentType = "DEFAULT" | "OPERATOR_LINKED";
type BusScope = "ALL_OPERATOR_BUSES" | "SPECIFIC_ROUTES";
type SettlementMethod = "BANK" | "ESEWA" | "KHALTI" | "";

type FoundUser = {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  role: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Step indicator (same pattern as create-bus-owner-model)
// ─────────────────────────────────────────────────────────────────────────────
const STEPS_OPERATOR_LINKED = [
  { num: 1, title: "Type"     },
  { num: 2, title: "User"     },
  { num: 3, title: "Operator" },
  { num: 4, title: "Routes"   }, // only shown if SPECIFIC_ROUTES
  { num: 5, title: "Details"  },
  { num: 6, title: "Confirm"  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Empty form
// ─────────────────────────────────────────────────────────────────────────────
const EMPTY_FORM = {
  district: "",
  municipality: "",
  businessName: "",
  shopAddress: "",
  operationType: "",
  claimedMonthlyVolume: "",
  currentOperators: "",
  settlementMethod: "" as SettlementMethod,
  bankName: "",
  bankAccountNumber: "",
  bankAccountName: "",
  esewaNumber: "",
  khaltiNumber: "",
  commissionRate: "5",
  minSettlementThreshold: "500",
  adminNotes: "",
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export const AddAgentDialog = () => {
  const { isOpen, type, onClose } = useModal();
  const isModelOpen = isOpen && type === "addAgent";
  const queryClient = useQueryClient();

  // ── Wizard state ───────────────────────────────────────────────────────────
  const [step, setStep]           = useState(1);
  const [agentType, setAgentType] = useState<AgentType | null>(null);

  // Step 2 — user search
  const [phoneQuery, setPhoneQuery]   = useState("");
  const [searching, setSearching]     = useState(false);
  const [foundUsers, setFoundUsers]   = useState<FoundUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<FoundUser | null>(null);

  // Step 3 — operator
  const [selectedBrandId, setSelectedBrandId]   = useState("");
  const [busScope, setBusScope]                 = useState<BusScope>("ALL_OPERATOR_BUSES");

  // Step 4 — specific routes
  const [selectedRouteIds, setSelectedRouteIds] = useState<string[]>([]);

  // Step 5 — details form
  const [form, setForm] = useState(EMPTY_FORM);

  // Created agent mongo ID (returned from makeUserAgent)
  const [createdAgentMongoId, setCreatedAgentMongoId] = useState<string | null>(null);

  const setField = (k: keyof typeof EMPTY_FORM, v: string) =>
    setForm((p) => ({ ...p, [k]: v }));

  // ── Data: brands ───────────────────────────────────────────────────────────
  const { data: brandsData, isLoading: brandsLoading } = useQuery({
    queryKey: ["brands"],
    queryFn: getAllBrands,
    enabled: isModelOpen,
    staleTime: 5 * 60 * 1000,
  });
  const brands: AgentBrandOption[] = brandsData?.data ?? [];

  // ── Data: route services for selected brand ────────────────────────────────
  const { data: routesData, isLoading: routesLoading } = useQuery({
    queryKey: ["brandRouteServices", selectedBrandId],
    queryFn: () => getBrandRouteServices(selectedBrandId),
    enabled: !!selectedBrandId && busScope === "SPECIFIC_ROUTES",
    staleTime: 5 * 60 * 1000,
  });
  const routeServices: AgentRouteServiceOption[] = routesData?.data ?? [];

  // ── Step 1 → 2: skip to step 2 when OPERATOR_LINKED ──────────────────────
  const handleTypeSelect = (t: AgentType) => {
    setAgentType(t);
    if (t === "OPERATOR_LINKED") setStep(2);
    // DEFAULT stays on step 1 — shows info card
  };

  // ── Step 2: search users ───────────────────────────────────────────────────
  const handleSearch = async () => {
    if (!phoneQuery.trim()) return;
    setSearching(true);
    try {
      const res = await searchUsersByPhone(phoneQuery.trim());
      const users = res?.data ?? [];
      setFoundUsers(users);
      if (!users.length) toast.info("No users found. They may need to register via the app first.");
    } catch {
      toast.error("Search failed — check backend connection.");
    } finally {
      setSearching(false);
    }
  };

  // ── Step 2 → 3: promote user ───────────────────────────────────────────────
  const promoteMutation = useMutation({
    mutationFn: () => makeUserAgent(selectedUser!._id),
    onSuccess: (res) => {
      setCreatedAgentMongoId(res?.data?.agentMongoId ?? res?.data?.agentId);
      setStep(3);
    },
    onError: (err: unknown) =>
      toast.error(getErrorMessage(err, "Failed to create agent account.")),
  });

  // ── Step 5 → 6 → submit ───────────────────────────────────────────────────
  const finalizeMutation = useMutation({
    mutationFn: () =>
      finalizeAgentSetup({
        id: createdAgentMongoId!,
        agentType: "OPERATOR_LINKED",
        linkedOperatorId: selectedBrandId,
        busAccessScope: busScope,
        allowedRouteIds: busScope === "SPECIFIC_ROUTES" ? selectedRouteIds : undefined,
        district: form.district || undefined,
        municipality: form.municipality || undefined,
        businessName: form.businessName || undefined,
        shopAddress: form.shopAddress || undefined,
        operationType: form.operationType || undefined,
        claimedMonthlyVolume: form.claimedMonthlyVolume || undefined,
        currentOperators: form.currentOperators || undefined,
        settlementMethod: form.settlementMethod || undefined,
        bankName: form.bankName || undefined,
        bankAccountNumber: form.bankAccountNumber || undefined,
        bankAccountName: form.bankAccountName || undefined,
        esewaNumber: form.esewaNumber || undefined,
        khaltiNumber: form.khaltiNumber || undefined,
        commissionRate: parseFloat(form.commissionRate) || 5,
        minSettlementThreshold: parseFloat(form.minSettlementThreshold) || 500,
        adminNotes: form.adminNotes || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      queryClient.invalidateQueries({ queryKey: ["agentDashboard"] });
      toast.success("Operator-linked agent created and approved! They'll receive a welcome SMS.");
      handleClose();
    },
    onError: (err: unknown) =>
      toast.error(getErrorMessage(err, "Failed to finalize agent setup.")),
  });

  // ── Reset & close ──────────────────────────────────────────────────────────
  const handleClose = useCallback(() => {
    setStep(1);
    setAgentType(null);
    setPhoneQuery("");
    setFoundUsers([]);
    setSelectedUser(null);
    setSelectedBrandId("");
    setBusScope("ALL_OPERATOR_BUSES");
    setSelectedRouteIds([]);
    setForm(EMPTY_FORM);
    setCreatedAgentMongoId(null);
    onClose();
  }, [onClose]);

  const handleBack = () => {
    if (step === 2) { setStep(1); setAgentType(null); }
    else setStep((s) => s - 1);
  };

  // Whether to show the Routes step
  const stepsForType = agentType === "OPERATOR_LINKED" && busScope === "SPECIFIC_ROUTES"
    ? STEPS_OPERATOR_LINKED
    : STEPS_OPERATOR_LINKED.filter((s) => s.num !== 4);

  // Effective step count for progress bar calculation
  const effectiveSteps = stepsForType;
  const maxStep = effectiveSteps[effectiveSteps.length - 1]?.num ?? 6;

  // ── Step indicator (bus-owner-modal pattern) ───────────────────────────────
  const StepIndicator = ({ num, title }: { num: number; title: string }) => {
    const isActive    = step === num;
    const isCompleted = step > num;
    return (
      <div className="flex flex-col items-center flex-1 relative z-10 transition-all">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors ${
          isActive    ? "border-[#D3D925] bg-[#D3D925] text-[#003D38]"
          : isCompleted ? "border-[#D3D925] bg-[#D3D925] text-[#003D38]"
          : "border-white/10 bg-white/5 text-white/30"
        }`}>
          {isCompleted ? <Check className="w-4 h-4" /> : num}
        </div>
        <span className={`text-[10px] mt-1.5 font-medium text-center ${
          isActive || isCompleted ? "text-white" : "text-white/30"
        }`}>
          {title}
        </span>
      </div>
    );
  };

  // ── Selected brand object ──────────────────────────────────────────────────
  const selectedBrand = brands.find((b) => b._id === selectedBrandId || b.brandId === selectedBrandId);

  // Toggle route selection
  const toggleRoute = (routeId: string) =>
    setSelectedRouteIds((prev) =>
      prev.includes(routeId) ? prev.filter((r) => r !== routeId) : [...prev, routeId]
    );

  // Next button disabled state per step
  const nextDisabled = () => {
    if (step === 2) return !selectedUser || promoteMutation.isPending;
    if (step === 3) return !selectedBrandId;
    if (step === 4) return selectedRouteIds.length === 0;
    return false;
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <Dialog open={isModelOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] bg-[#0B1A17] border-white/8 text-white p-0 overflow-hidden">

        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="text-white text-lg font-bold">Add New Agent</DialogTitle>
          <DialogDescription className="text-white/50 text-sm">
            {step === 1 && "Choose the type of agent you want to create."}
            {step === 2 && "Find the user account to promote to agent."}
            {step === 3 && "Link to an operator brand and set access scope."}
            {step === 4 && "Select which routes this agent can access."}
            {step === 5 && "Fill optional details — can be updated later."}
            {step === 6 && "Review and confirm — agent will be approved immediately."}
          </DialogDescription>
        </DialogHeader>

        {/* ── Progress bar (only when OPERATOR_LINKED path active) ── */}
        {agentType === "OPERATOR_LINKED" && (
          <div className="relative flex justify-between items-start px-6 pt-5 pb-2">
            <div className="absolute top-9 left-[12%] right-[12%] h-[1px] bg-white/10 z-0">
              <div
                className="h-full bg-[#D3D925] transition-all duration-300"
                style={{
                  width: `${Math.max(0, ((step - 1) / (maxStep - 1)) * 100)}%`,
                }}
              />
            </div>
            {effectiveSteps.map((s) => (
              <StepIndicator key={s.num} num={s.num} title={s.title} />
            ))}
          </div>
        )}

        {/* ── Step content ── */}
        <div className="px-6 py-4 max-h-[58vh] overflow-y-auto custom-scrollbar space-y-4">

          {/* ══ STEP 1: Type selector ══ */}
          {step === 1 && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
              {/* DEFAULT card */}
              <div
                className={`rounded-2xl border p-5 cursor-pointer transition-all ${
                  agentType === "DEFAULT"
                    ? "border-white/20 bg-white/5"
                    : "border-white/8 bg-white/[0.02] hover:bg-white/5"
                }`}
                onClick={() => handleTypeSelect("DEFAULT")}
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    <User className="h-5 w-5 text-white/50" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-white">Default Agent</p>
                      <Badge className="bg-white/8 text-white/50 border-white/10 text-[10px]">Self-apply</Badge>
                    </div>
                    <p className="text-sm text-white/50">
                      Applies independently via the Shuvmarg Partner App. Admin reviews their KYC documents in the <strong className="text-white/70">Applications tab</strong>.
                    </p>
                  </div>
                  {agentType === "DEFAULT" && (
                    <CheckCircle2 className="h-5 w-5 text-[#D3D925] shrink-0" />
                  )}
                </div>

                {/* Info state when DEFAULT is selected */}
                {agentType === "DEFAULT" && (
                  <div className="mt-4 p-3 rounded-xl border border-[#D3D925]/25 bg-[#D3D925]/5">
                    <div className="flex items-center gap-2 text-[#D3D925] text-sm font-semibold mb-1">
                      <Info className="h-4 w-4" /> No admin creation needed
                    </div>
                    <p className="text-xs text-white/50">
                      Tell the person to download the Shuvmarg Partner App, register with their phone, and submit their KYC application. Once submitted, it will appear in the Applications tab for your review.
                    </p>
                    <Button
                      size="sm"
                      className="mt-3 bg-[#D3D925] text-[#003D38] hover:bg-[#c8ce20] font-bold text-xs"
                      onClick={(e) => { e.stopPropagation(); handleClose(); window.location.href = "/admin/agents?tab=applications"; }}
                    >
                      Go to Applications Tab
                    </Button>
                  </div>
                )}
              </div>

              {/* OPERATOR_LINKED card */}
              <div
                className={`rounded-2xl border p-5 cursor-pointer transition-all ${
                  agentType === "OPERATOR_LINKED"
                    ? "border-[#D3D925]/40 bg-[#D3D925]/5"
                    : "border-white/8 bg-white/[0.02] hover:bg-white/5"
                }`}
                onClick={() => handleTypeSelect("OPERATOR_LINKED")}
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#D3D925]/10 border border-[#D3D925]/20 flex items-center justify-center shrink-0">
                    <Building2 className="h-5 w-5 text-[#D3D925]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-white">Operator-Linked Agent</p>
                      <Badge className="bg-[#D3D925]/15 text-[#D3D925] border-[#D3D925]/25 text-[10px]">Admin creates</Badge>
                    </div>
                    <p className="text-sm text-white/50">
                      Counter staff linked to a specific bus operator brand. Only sees that operator's buses in the app. Approved immediately — no document review required.
                    </p>
                  </div>
                  {agentType === "OPERATOR_LINKED" && (
                    <CheckCircle2 className="h-5 w-5 text-[#D3D925] shrink-0" />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ══ STEP 2: Find user ══ */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                  <Input
                    placeholder="Search by phone or name..."
                    value={phoneQuery}
                    onChange={(e) => setPhoneQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="pl-9 h-10 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  />
                </div>
                <Button
                  onClick={handleSearch}
                  disabled={searching || !phoneQuery.trim()}
                  className="bg-[#D3D925] text-[#003D38] hover:bg-[#c8ce20] font-bold px-4"
                >
                  {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>

              {/* Results */}
              {foundUsers.length > 0 && (
                <div className="space-y-2 max-h-44 overflow-y-auto custom-scrollbar">
                  {foundUsers.map((u) => {
                    const isSelected    = selectedUser?._id === u._id;
                    const alreadyAgent  = u.role === "agent";
                    return (
                      <div
                        key={u._id}
                        onClick={() => !alreadyAgent && setSelectedUser(u)}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                          alreadyAgent
                            ? "border-white/5 bg-white/[0.02] opacity-50 cursor-not-allowed"
                            : isSelected
                            ? "border-[#D3D925]/40 bg-[#D3D925]/5 cursor-pointer"
                            : "border-white/8 bg-white/[0.02] cursor-pointer hover:bg-white/5"
                        }`}
                      >
                        <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                          <User className="h-4 w-4 text-white/40" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white text-sm truncate">{u.name}</p>
                          <p className="text-xs text-white/40">{u.phone}{u.email ? ` · ${u.email}` : ""}</p>
                        </div>
                        {alreadyAgent && (
                          <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/25 text-[10px] shrink-0">
                            Already Agent
                          </Badge>
                        )}
                        {isSelected && !alreadyAgent && (
                          <Check className="h-5 w-5 text-[#D3D925] shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Selected summary */}
              {selectedUser && (
                <div className="p-3 rounded-xl border border-[#D3D925]/30 bg-[#D3D925]/5">
                  <p className="text-[10px] text-[#D3D925] font-semibold mb-1 uppercase tracking-wide">Selected</p>
                  <p className="font-bold text-white text-sm">{selectedUser.name}</p>
                  <p className="text-xs text-white/50 mt-0.5">{selectedUser.phone}</p>
                </div>
              )}

              {foundUsers.length === 0 && !searching && (
                <p className="text-center text-sm text-white/30 py-6">
                  The user must be registered in the Shuvmarg app before they can be linked as an agent.
                </p>
              )}
            </div>
          )}

          {/* ══ STEP 3: Operator link ══ */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <div className="space-y-1.5">
                <Label className="text-white/70 text-xs font-semibold uppercase tracking-wide">Operator Brand *</Label>
                {brandsLoading ? (
                  <div className="flex items-center gap-2 text-white/40 text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading brands...
                  </div>
                ) : (
                  <Select value={selectedBrandId} onValueChange={setSelectedBrandId}>
                    <SelectTrigger className="h-11 bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Select operator brand..." />
                    </SelectTrigger>
                    <SelectContent>
                      {brands.map((b) => (
                        <SelectItem key={b._id ?? b.brandId} value={b._id ?? b.brandId}>
                          <span className="font-semibold">{b.brandName}</span>
                          {b.brandCode && <span className="text-white/40 ml-2 text-xs">{b.brandCode}</span>}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {selectedBrand && (
                <div className="p-3 rounded-xl border border-white/8 bg-white/[0.02] flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#D3D925]/10 border border-[#D3D925]/20 flex items-center justify-center shrink-0">
                    <Building2 className="h-4 w-4 text-[#D3D925]" />
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">{selectedBrand.brandName}</p>
                    <p className="text-xs text-white/40">{selectedBrand.brandCode} · {selectedBrand.baseCity || "—"}</p>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-white/70 text-xs font-semibold uppercase tracking-wide">Bus Access Scope</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(["ALL_OPERATOR_BUSES", "SPECIFIC_ROUTES"] as BusScope[]).map((scope) => (
                    <button
                      key={scope}
                      type="button"
                      onClick={() => setBusScope(scope)}
                      className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition-all ${
                        busScope === scope
                          ? "border-[#D3D925]/40 bg-[#D3D925]/5"
                          : "border-white/8 bg-white/[0.02] hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {scope === "ALL_OPERATOR_BUSES"
                          ? <Users className="h-4 w-4 text-[#D3D925]" />
                          : <Route className="h-4 w-4 text-[#D3D925]" />
                        }
                        <span className="text-white text-xs font-semibold">
                          {scope === "ALL_OPERATOR_BUSES" ? "All Buses" : "Specific Routes"}
                        </span>
                        {busScope === scope && <Check className="h-3.5 w-3.5 text-[#D3D925] ml-auto" />}
                      </div>
                      <p className="text-[10px] text-white/40">
                        {scope === "ALL_OPERATOR_BUSES"
                          ? "Can book on any bus in this operator's fleet"
                          : "Restricted to selected routes only"}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ══ STEP 4: Specific Routes picker ══ */}
          {step === 4 && busScope === "SPECIFIC_ROUTES" && (
            <div className="space-y-3 animate-in fade-in slide-in-from-right-4">
              <div className="flex items-center justify-between">
                <Label className="text-white/70 text-xs font-semibold uppercase tracking-wide">
                  Select Routes *
                </Label>
                {selectedRouteIds.length > 0 && (
                  <Badge className="bg-[#D3D925]/15 text-[#D3D925] border-[#D3D925]/25 text-[10px]">
                    {selectedRouteIds.length} selected
                  </Badge>
                )}
              </div>

              {routesLoading ? (
                <div className="flex items-center gap-2 text-white/40 text-sm py-4">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading routes...
                </div>
              ) : routeServices.length === 0 ? (
                <div className="text-center py-8 text-white/30 text-sm">
                  No active routes found for this brand.
                </div>
              ) : (
                <div className="space-y-2 max-h-52 overflow-y-auto custom-scrollbar">
                  {routeServices.map((route) => {
                    const id = route.variantId ?? route._id;
                    const selected = selectedRouteIds.includes(id);
                    return (
                      <div
                        key={id}
                        onClick={() => toggleRoute(id)}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          selected
                            ? "border-[#D3D925]/40 bg-[#D3D925]/5"
                            : "border-white/8 bg-white/[0.02] hover:bg-white/5"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                          selected ? "border-[#D3D925] bg-[#D3D925]" : "border-white/20"
                        }`}>
                          {selected && <Check className="h-3 w-3 text-[#003D38]" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white text-sm truncate">
                            {route.origin} → {route.destination}
                          </p>
                          {route.patternName && (
                            <p className="text-[10px] text-white/40">{route.patternName}</p>
                          )}
                        </div>
                        {route.status && (
                          <Badge className={`text-[10px] ${
                            route.status === "ACTIVE"
                              ? "bg-green-500/15 text-green-400 border-green-500/25"
                              : "bg-white/5 text-white/30 border-white/10"
                          }`}>
                            {route.status}
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ══ STEP 5: Details (all optional) ══ */}
          {step === 5 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <p className="text-xs text-white/40 flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5" /> All fields below are optional — can be updated from the agent's profile later.
              </p>

              {/* Personal */}
              <div>
                <p className="text-[10px] text-white/40 font-semibold uppercase tracking-wide mb-2">Location</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-white/60 text-xs">District</Label>
                    <Input placeholder="e.g. Kathmandu" value={form.district} onChange={(e) => setField("district", e.target.value)} className="h-9 bg-white/5 border-white/10 text-white text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-white/60 text-xs">Municipality / City</Label>
                    <Input placeholder="e.g. Thamel" value={form.municipality} onChange={(e) => setField("municipality", e.target.value)} className="h-9 bg-white/5 border-white/10 text-white text-sm" />
                  </div>
                </div>
              </div>

              {/* Business */}
              <div>
                <p className="text-[10px] text-white/40 font-semibold uppercase tracking-wide mb-2">Business</p>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-white/60 text-xs">Counter / Business Name</Label>
                      <Input placeholder="e.g. Thapa Ticket Counter" value={form.businessName} onChange={(e) => setField("businessName", e.target.value)} className="h-9 bg-white/5 border-white/10 text-white text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-white/60 text-xs">Operation Type</Label>
                      <Select value={form.operationType} onValueChange={(v) => setField("operationType", v)}>
                        <SelectTrigger className="h-9 bg-white/5 border-white/10 text-white text-sm">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ticket_counter">Ticket Counter</SelectItem>
                          <SelectItem value="travel_agent">Travel Agent</SelectItem>
                          <SelectItem value="mobile_shop">Mobile Shop</SelectItem>
                          <SelectItem value="individual">Individual</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Settlement */}
              <div>
                <p className="text-[10px] text-white/40 font-semibold uppercase tracking-wide mb-2">Settlement (Optional)</p>
                <div className="space-y-2">
                  <Select value={form.settlementMethod} onValueChange={(v) => setField("settlementMethod", v)}>
                    <SelectTrigger className="h-9 bg-white/5 border-white/10 text-white text-sm">
                      <SelectValue placeholder="Choose payout method (optional)..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BANK">🏦 Bank Transfer</SelectItem>
                      <SelectItem value="ESEWA">📱 eSewa</SelectItem>
                      <SelectItem value="KHALTI">💜 Khalti</SelectItem>
                    </SelectContent>
                  </Select>

                  {form.settlementMethod === "BANK" && (
                    <div className="space-y-2 p-3 rounded-xl border border-white/8 bg-white/[0.02]">
                      <Input placeholder="Bank name (e.g. Nepal Bank Ltd)" value={form.bankName} onChange={(e) => setField("bankName", e.target.value)} className="h-9 bg-white/5 border-white/10 text-white text-sm" />
                      <div className="grid grid-cols-2 gap-2">
                        <Input placeholder="Account number" value={form.bankAccountNumber} onChange={(e) => setField("bankAccountNumber", e.target.value)} className="h-9 bg-white/5 border-white/10 text-white text-sm" />
                        <Input placeholder="Account holder name" value={form.bankAccountName} onChange={(e) => setField("bankAccountName", e.target.value)} className="h-9 bg-white/5 border-white/10 text-white text-sm" />
                      </div>
                    </div>
                  )}
                  {form.settlementMethod === "ESEWA" && (
                    <Input placeholder="eSewa registered phone" value={form.esewaNumber} onChange={(e) => setField("esewaNumber", e.target.value)} className="h-9 bg-white/5 border-white/10 text-white text-sm" />
                  )}
                  {form.settlementMethod === "KHALTI" && (
                    <Input placeholder="Khalti registered phone" value={form.khaltiNumber} onChange={(e) => setField("khaltiNumber", e.target.value)} className="h-9 bg-white/5 border-white/10 text-white text-sm" />
                  )}
                </div>
              </div>

              {/* Config */}
              <div>
                <p className="text-[10px] text-white/40 font-semibold uppercase tracking-wide mb-2">Commission</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-white/60 text-xs">Commission Rate (%)</Label>
                    <Input type="number" min={0} max={30} step={0.5} value={form.commissionRate} onChange={(e) => setField("commissionRate", e.target.value)} className="h-9 bg-white/5 border-white/10 text-white text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-white/60 text-xs">Min. Threshold (NPR)</Label>
                    <Input type="number" min={0} step={100} value={form.minSettlementThreshold} onChange={(e) => setField("minSettlementThreshold", e.target.value)} className="h-9 bg-white/5 border-white/10 text-white text-sm" />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-white/60 text-xs">Internal Notes (Admin only)</Label>
                <Textarea placeholder="Notes visible only to admins..." value={form.adminNotes} onChange={(e) => setField("adminNotes", e.target.value)} className="bg-white/5 border-white/10 text-white resize-none h-16 text-sm" />
              </div>
            </div>
          )}

          {/* ══ STEP 6: Confirm ══ */}
          {step === 6 && (
            <div className="space-y-3 animate-in fade-in slide-in-from-right-4">
              <div className="rounded-2xl border border-white/8 bg-white/[0.02] overflow-hidden">
                <SummaryRow label="Agent"        value={selectedUser?.name ?? "—"} />
                <SummaryRow label="Phone"        value={selectedUser?.phone ?? "—"} />
                <SummaryRow label="Type"         value="Operator-Linked" accent />
                <SummaryRow label="Operator"     value={selectedBrand?.brandName ?? selectedBrandId} />
                <SummaryRow label="Access"       value={busScope === "ALL_OPERATOR_BUSES" ? "All operator buses" : `${selectedRouteIds.length} specific routes`} />
                {form.district || form.municipality ? (
                  <SummaryRow label="Location"   value={[form.municipality, form.district].filter(Boolean).join(", ")} />
                ) : null}
                {form.businessName && <SummaryRow label="Business" value={form.businessName} />}
                {form.settlementMethod && <SummaryRow label="Settlement" value={form.settlementMethod} />}
                <SummaryRow label="Commission"   value={`${form.commissionRate}%`} accent />
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl border border-amber-500/20 bg-amber-500/5">
                <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-400">
                  This agent will be <strong>approved immediately</strong>. They'll receive a welcome SMS with instructions to download the Shuvmarg Partner App.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer navigation ── */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/5">
          {/* Back / Cancel */}
          {step === 1 ? (
            <Button variant="outline" className="border-white/10 text-white/60 hover:text-white bg-transparent" onClick={handleClose}>
              Cancel
            </Button>
          ) : (
            <Button variant="ghost" className="text-white/50 hover:text-white gap-1" onClick={handleBack} disabled={promoteMutation.isPending || finalizeMutation.isPending}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          )}

          {/* Right action */}
          <div>
            {/* Step 1 — no right button when DEFAULT info shown; no button if nothing selected */}
            {step === 1 && agentType !== "OPERATOR_LINKED" && (
              <span /> // Empty — type selection moves automatically
            )}

            {/* Step 2 — promote user */}
            {step === 2 && (
              <Button
                className="bg-[#D3D925] text-[#003D38] hover:bg-[#c8ce20] font-bold gap-2"
                disabled={!selectedUser || promoteMutation.isPending}
                onClick={() => promoteMutation.mutate()}
              >
                {promoteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {promoteMutation.isPending ? "Creating..." : "Create Agent Account"}
              </Button>
            )}

            {/* Steps 3–5 — next */}
            {(step === 3 || step === 4 || step === 5) && (
              <Button
                className="bg-[#D3D925] text-[#003D38] hover:bg-[#c8ce20] font-bold"
                disabled={nextDisabled()}
                onClick={() => setStep((s) => {
                  // Skip step 4 if not SPECIFIC_ROUTES
                  if (s === 3 && busScope !== "SPECIFIC_ROUTES") return 5;
                  return s + 1;
                })}
              >
                Next
              </Button>
            )}

            {/* Step 6 — final create */}
            {step === 6 && (
              <Button
                className="bg-[#D3D925] text-[#003D38] hover:bg-[#c8ce20] font-bold gap-2"
                disabled={finalizeMutation.isPending}
                onClick={() => finalizeMutation.mutate()}
              >
                {finalizeMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {finalizeMutation.isPending ? "Creating..." : "Create & Approve Agent"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Summary row helper
// ─────────────────────────────────────────────────────────────────────────────
function SummaryRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between items-center px-4 py-2.5 border-b border-white/5 last:border-0">
      <span className="text-xs text-white/40 font-medium">{label}</span>
      <span className={`text-sm font-semibold ${accent ? "text-[#D3D925]" : "text-white"}`}>{value}</span>
    </div>
  );
}
