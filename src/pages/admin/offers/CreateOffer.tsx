import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Wand2, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { createCoupon, getCouponById, updateCoupon, type CreateCouponPayload } from "@/api/couponApi";
import { CouponLivePreview } from "@/components/offers/CouponLivePreview";

const USER_TYPES = [
  { value: "passenger", label: "Passenger" },
  { value: "agent", label: "Agent" },
  { value: "busOwner", label: "Bus Owner" },
];

const generateCode = () => {
  const words = ["RIDE", "SHUV", "TRIP", "DASH", "FLY", "YATRA", "SWIFT"];
  const nums = Math.floor(Math.random() * 90 + 10);
  return words[Math.floor(Math.random() * words.length)] + nums;
};

const defaultForm: CreateCouponPayload = {
  couponCode: "",
  title: "",
  description: "",
  discountType: "percentage",
  discountValue: 0,
  minOrderAmount: 0,
  maxDiscountAmount: undefined,
  validFrom: new Date().toISOString().slice(0, 10),
  validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  totalUsageLimit: undefined,
  perUserLimit: 1,
  applicableUserTypes: ["passenger"],
};

export default function CreateOffer() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const isEditMode = !!editId;

  const queryClient = useQueryClient();
  const [form, setForm] = useState<CreateCouponPayload>(defaultForm);
  const [selectedUserTypes, setSelectedUserTypes] = useState<string[]>(["passenger"]);

  // Fetch coupon details if in edit mode
  const { data: couponData, isLoading: isLoadingCoupon } = useQuery({
    queryKey: ["coupon", editId],
    queryFn: () => getCouponById(editId!),
    enabled: isEditMode,
  });

  // Populate form when data arrives
  useEffect(() => {
    if (isEditMode && couponData?.data) {
      const c = couponData.data;
      setForm({
        couponCode: c.couponCode,
        title: c.title,
        description: c.description || "",
        discountType: c.discountType,
        discountValue: c.discountValue,
        minOrderAmount: c.minOrderAmount,
        maxDiscountAmount: c.maxDiscountAmount,
        validFrom: c.validFrom ? new Date(c.validFrom).toISOString().slice(0, 10) : defaultForm.validFrom,
        validTo: c.validTo ? new Date(c.validTo).toISOString().slice(0, 10) : defaultForm.validTo,
        totalUsageLimit: c.totalUsageLimit,
        perUserLimit: c.perUserLimit || 1,
        applicableUserTypes: c.applicableUserTypes || ["passenger"],
      });
      setSelectedUserTypes(c.applicableUserTypes || ["passenger"]);
    }
  }, [isEditMode, couponData]);

  const { mutate: createMutate, isPending: isCreating } = useMutation({
    mutationFn: createCoupon,
    onSuccess: (data) => {
      toast.success(`Coupon "${data.data?.couponCode ?? form.couponCode}" created successfully!`);
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
      navigate("/admin/offers");
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to create coupon";
      toast.error(msg);
    },
  });

  const { mutate: updateMutate, isPending: isUpdating } = useMutation({
    mutationFn: (payload: CreateCouponPayload) => updateCoupon(editId!, payload),
    onSuccess: (data) => {
      toast.success(`Coupon "${data.data?.couponCode ?? form.couponCode}" updated successfully!`);
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
      queryClient.invalidateQueries({ queryKey: ["coupon", editId] });
      navigate("/admin/offers");
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to update coupon";
      toast.error(msg);
    },
  });

  const isPending = isCreating || isUpdating;

  const update = (key: keyof CreateCouponPayload, value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const toggleUserType = (type: string) => {
    setSelectedUserTypes((prev) => {
      const next = prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type];
      update("applicableUserTypes", next);
      return next;
    });
  };

  const handleSubmit = () => {
    if (!form.couponCode.trim()) return toast.error("Coupon code is required");
    if (!form.title.trim()) return toast.error("Title is required");
    if (!form.discountValue || form.discountValue <= 0)
      return toast.error("Discount value must be > 0");
    if (!form.validFrom || !form.validTo)
      return toast.error("Valid date range is required");
    if (new Date(form.validFrom) >= new Date(form.validTo))
      return toast.error("Valid From must be before Valid To");
    if (selectedUserTypes.length === 0)
      return toast.error("Select at least one user type");

    const payload = {
      ...form,
      couponCode: form.couponCode.toUpperCase(),
      applicableUserTypes: selectedUserTypes,
      maxDiscountAmount: form.maxDiscountAmount || undefined,
      totalUsageLimit: form.totalUsageLimit || undefined,
    };

    if (isEditMode) {
      updateMutate(payload);
    } else {
      createMutate(payload);
    }
  };

  if (isEditMode && isLoadingCoupon) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-white/40" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/offers")} className="shrink-0 text-white/60 hover:text-white hover:bg-white/10">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {isEditMode ? "Edit Offer" : "Create New Offer"}
          </h1>
          <p className="text-white/60 text-sm">
            {isEditMode
              ? "Update the details of your offer — preview updates in real-time on the right"
              : "Fill in the details — preview updates in real-time on the right"}
          </p>
        </div>
        <Button onClick={handleSubmit} disabled={isPending} className="gap-2 shrink-0 bg-[#D3D925] text-[#121212] hover:bg-[#D3D925]/90 font-bold">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isPending ? (isEditMode ? "Updating..." : "Publishing...") : (isEditMode ? "Update Offer" : "Publish Offer")}
        </Button>
      </div>

      {/* Split layout */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6 items-start">
        {/* ── LEFT: Form ─────────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Basic Info */}
          <Card className="bg-[#121212]/30 border-white/5 backdrop-blur-md shadow-xl">
            <CardHeader className="border-b border-white/5 bg-white/5 pb-4">
              <CardTitle className="flex items-center gap-2 text-white">Basic Information</CardTitle>
              <CardDescription className="text-white/60">Set the coupon code, title, and description</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Coupon Code */}
              <div className="space-y-2">
                <Label htmlFor="couponCode" className="text-white">Coupon Code *</Label>
                <div className="flex gap-2">
                  <Input
                    id="couponCode"
                    placeholder="e.g. VOYAGE20"
                    value={form.couponCode}
                    onChange={(e) => update("couponCode", e.target.value.toUpperCase())}
                    className="tracking-widest font-semibold bg-white/5 border-white/10 text-white placeholder:text-white/40 focus-visible:ring-[#D3D925]"
                    maxLength={20}
                    disabled={isEditMode} // Cannot edit coupon code
                  />
                  {!isEditMode && (
                    <Button
                      type="button"
                      variant="outline"
                      className="gap-2 shrink-0 bg-[#121212]/30 border-white/5 text-white hover:bg-white/10 hover:text-white"
                      onClick={() => update("couponCode", generateCode())}
                    >
                      <Wand2 className="h-4 w-4" />
                      Generate
                    </Button>
                  )}
                </div>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-white">Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g. Get 20% OFF on your first trip"
                  value={form.title}
                  onChange={(e) => update("title", e.target.value)}
                  maxLength={100}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus-visible:ring-[#D3D925]"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-white">Description</Label>
                <Textarea
                  id="description"
                  placeholder="e.g. Exclusive launch offer for new Shuvmarg riders."
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  rows={2}
                  maxLength={500}
                  className="resize-none bg-white/5 border-white/10 text-white placeholder:text-white/40 focus-visible:ring-[#D3D925]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Discount Config */}
          <Card className="bg-[#121212]/30 border-white/5 backdrop-blur-md shadow-xl">
            <CardHeader className="border-b border-white/5 bg-white/5 pb-4">
              <CardTitle className="flex items-center gap-2 text-white">Discount Configuration</CardTitle>
              <CardDescription className="text-white/60">Choose between a percentage or fixed amount discount</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Type toggle */}
                <div className="space-y-2">
                  <Label className="text-white">Discount Type *</Label>
                  <Select
                    value={form.discountType}
                    onValueChange={(v) => update("discountType", v as "percentage" | "fixed")}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-white focus:ring-[#D3D925]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#121212] border-white/10 text-white">
                      <SelectItem value="percentage" className="focus:bg-white/10 focus:text-white">Percentage (%)</SelectItem>
                      <SelectItem value="fixed" className="focus:bg-white/10 focus:text-white">Fixed Amount (Rs.)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Value */}
                <div className="space-y-2">
                  <Label htmlFor="discountValue" className="text-white">
                    {form.discountType === "percentage" ? "Percentage (0–100)" : "Amount (Rs.)"} *
                  </Label>
                  <div className="relative">
                    <Input
                      id="discountValue"
                      type="number"
                      min={0}
                      max={form.discountType === "percentage" ? 100 : undefined}
                      value={form.discountValue || ""}
                      onChange={(e) => update("discountValue", Number(e.target.value))}
                      placeholder={form.discountType === "percentage" ? "20" : "500"}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus-visible:ring-[#D3D925]"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 text-sm font-medium">
                      {form.discountType === "percentage" ? "%" : "Rs."}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Min Order */}
                <div className="space-y-2">
                  <Label htmlFor="minOrderAmount" className="text-white">Min. Order Amount (Rs.)</Label>
                  <Input
                    id="minOrderAmount"
                    type="number"
                    min={0}
                    value={form.minOrderAmount || ""}
                    onChange={(e) => update("minOrderAmount", Number(e.target.value))}
                    placeholder="0 = no minimum"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus-visible:ring-[#D3D925]"
                  />
                </div>

                {/* Max Discount */}
                {form.discountType === "percentage" && (
                  <div className="space-y-2">
                    <Label htmlFor="maxDiscountAmount" className="text-white">Max Discount Cap (Rs.)</Label>
                    <Input
                      id="maxDiscountAmount"
                      type="number"
                      min={0}
                      value={form.maxDiscountAmount || ""}
                      onChange={(e) =>
                        update("maxDiscountAmount", e.target.value ? Number(e.target.value) : undefined)
                      }
                      placeholder="Leave blank = unlimited"
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus-visible:ring-[#D3D925]"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Validity & Limits */}
          <Card className="bg-[#121212]/30 border-white/5 backdrop-blur-md shadow-xl">
            <CardHeader className="border-b border-white/5 bg-white/5 pb-4">
              <CardTitle className="flex items-center gap-2 text-white">Validity & Usage Limits</CardTitle>
              <CardDescription className="text-white/60">Set when the offer runs and how many times it can be used</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Date range */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="validFrom" className="text-white">Valid From *</Label>
                  <Input
                    id="validFrom"
                    type="date"
                    value={form.validFrom}
                    onChange={(e) => update("validFrom", e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus-visible:ring-[#D3D925] [color-scheme:dark]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="validTo" className="text-white">Valid To *</Label>
                  <Input
                    id="validTo"
                    type="date"
                    value={form.validTo}
                    onChange={(e) => update("validTo", e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus-visible:ring-[#D3D925] [color-scheme:dark]"
                  />
                </div>
              </div>

              <Separator className="bg-white/10" />

              {/* Usage limits */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="totalUsageLimit" className="text-white">Total Usage Limit</Label>
                  <Input
                    id="totalUsageLimit"
                    type="number"
                    min={1}
                    value={form.totalUsageLimit || ""}
                    onChange={(e) =>
                      update("totalUsageLimit", e.target.value ? Number(e.target.value) : undefined)
                    }
                    placeholder="Leave blank = unlimited"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus-visible:ring-[#D3D925]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="perUserLimit" className="text-white">Per User Limit</Label>
                  <Input
                    id="perUserLimit"
                    type="number"
                    min={1}
                    value={form.perUserLimit}
                    onChange={(e) => update("perUserLimit", Number(e.target.value))}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus-visible:ring-[#D3D925]"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Targeting */}
          <Card className="bg-[#121212]/30 border-white/5 backdrop-blur-md shadow-xl">
            <CardHeader className="border-b border-white/5 bg-white/5 pb-4">
              <CardTitle className="flex items-center gap-2 text-white">User Targeting</CardTitle>
              <CardDescription className="text-white/60">Who can use this offer?</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {USER_TYPES.map((ut) => (
                  <button
                    key={ut.value}
                    type="button"
                    onClick={() => toggleUserType(ut.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                      selectedUserTypes.includes(ut.value)
                        ? "bg-[#D3D925] text-[#121212] border-[#D3D925] shadow-sm font-bold"
                        : "bg-white/5 text-white/60 border-white/10 hover:border-white/20 hover:text-white"
                    }`}
                  >
                    {ut.label}
                  </button>
                ))}
              </div>
              {selectedUserTypes.length === 0 && (
                <p className="text-xs text-white mt-2">Select at least one user type</p>
              )}
            </CardContent>
          </Card>

          {/* Submit CTA (bottom) */}
          <div className="flex justify-end gap-3 pb-4">
            <Button variant="outline" onClick={() => navigate("/admin/offers")} className="bg-[#121212]/30 border-white/5 text-white hover:bg-white/10 hover:text-white">
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isPending} className="gap-2 min-w-32 bg-[#D3D925] text-[#121212] hover:bg-[#D3D925]/90 font-bold">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isPending ? (isEditMode ? "Updating..." : "Publishing...") : (isEditMode ? "Update Offer" : "Publish Offer")}
            </Button>
          </div>
        </div>

        {/* ── RIGHT: Live Preview ─────────────────────────────────────── */}
        <div className="sticky top-6">
          <Card className="bg-[#121212]/30 border-white/5 backdrop-blur-md shadow-xl">
            <CardHeader className="border-b border-white/5 bg-white/5 pb-4">
              <CardTitle className="flex items-center gap-2 text-white">Live Preview</CardTitle>
              <CardDescription className="text-white/60">See how this offer will look to users</CardDescription>
            </CardHeader>
            <CardContent className="min-h-[400px]">
              <CouponLivePreview
                data={{
                  couponCode: form.couponCode,
                  title: form.title,
                  description: form.description || "",
                  discountType: form.discountType,
                  discountValue: form.discountValue,
                  minOrderAmount: form.minOrderAmount ?? 0,
                  maxDiscountAmount: form.maxDiscountAmount,
                  validFrom: form.validFrom,
                  validTo: form.validTo,
                  perUserLimit: form.perUserLimit ?? 1,
                }}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
