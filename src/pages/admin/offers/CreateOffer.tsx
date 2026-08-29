import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Wand2, Loader2, Save, ChevronDown, Upload } from "lucide-react";
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
import { createCoupon, getCouponById, updateCoupon, uploadCouponImage, type CreateCouponPayload } from "@/api/couponApi";
import { CouponLivePreview } from "@/components/offers/CouponLivePreview";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";

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
  category: "General Offer",
  imageUrl: "",
  discountType: "percentage",
  discountValue: 0,
  minOrderAmount: 0,
  maxDiscountAmount: undefined,
  validFrom: new Date().toISOString().slice(0, 10),
  validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  totalUsageLimit: undefined,
  perUserLimit: 1,
  applicableUserTypes: ["passenger"],
  designConfig: {
    edges: {
      top: "smooth",
      bottom: "smooth",
      left: "smooth",
      right: "smooth",
    },
    typography: {
      titleAlignment: "left",
      descAlignment: "left",
      codeAlignment: "left",
    },
    imageConfig: {
      scale: 100,
      offsetX: 0,
      offsetY: 0,
      fit: "cover",
    },
  },
};

export default function CreateOffer() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const isEditMode = !!editId;

  const queryClient = useQueryClient();
  const [form, setForm] = useState<CreateCouponPayload>(defaultForm);
  const [selectedUserTypes, setSelectedUserTypes] = useState<string[]>(["passenger"]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const CATEGORY_SUGGESTIONS = ["General Offer", "Operator Offer", "Exclusive"];

  // Fetch coupon details if in edit mode
  const { data: couponData, isLoading: isLoadingCoupon } = useQuery({
    queryKey: ["coupon", editId],
    queryFn: () => getCouponById(editId!),
    enabled: isEditMode,
  });

  // Populate form when data arrives (edit mode)
  useEffect(() => {
    if (isEditMode && couponData?.data) {
      const c = couponData.data;
      setForm({
        couponCode: c.couponCode,
        title: c.title,
        description: c.description || "",
        category: c.category || "General Offer",
        imageUrl: c.imageUrl || "",  // raw S3 key — stored in form for submission
        discountType: c.discountType,
        discountValue: c.discountValue,
        minOrderAmount: c.minOrderAmount,
        maxDiscountAmount: c.maxDiscountAmount,
        validFrom: c.validFrom ? new Date(c.validFrom).toISOString().slice(0, 10) : defaultForm.validFrom,
        validTo: c.validTo ? new Date(c.validTo).toISOString().slice(0, 10) : defaultForm.validTo,
        totalUsageLimit: c.totalUsageLimit,
        perUserLimit: c.perUserLimit || 1,
        applicableUserTypes: c.applicableUserTypes || ["passenger"],
        designConfig: c.designConfig || defaultForm.designConfig,
      });
      setSelectedUserTypes(c.applicableUserTypes || ["passenger"]);
      // Use the resolved presigned URL for the preview (not the raw S3 key)
      if (c.imageUrlResolved) {
        setLocalPreviewUrl(c.imageUrlResolved);
      }
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

  const isPending = isCreating || isUpdating || isUploadingImage;

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      // Revoke previous blob URL to avoid memory leak
      if (localPreviewUrl && localPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(localPreviewUrl);
      }
      // Create local blob URL only for live preview — NOT stored in form.imageUrl
      const blobUrl = URL.createObjectURL(file);
      setLocalPreviewUrl(blobUrl);
    }
  };

  const update = (key: keyof CreateCouponPayload, value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const updateDesignConfigEdge = (edge: "top"|"bottom"|"left"|"right", value: unknown) => {
    setForm((prev) => ({
      ...prev,
      designConfig: {
        ...prev.designConfig,
        edges: {
          ...prev.designConfig?.edges,
          [edge]: value,
        },
      },
    }));
  };

  const updateDesignConfigTypo = (key: "titleAlignment"|"descAlignment"|"codeAlignment", value: unknown) => {
    setForm((prev) => ({
      ...prev,
      designConfig: {
        ...prev.designConfig,
        typography: {
          ...prev.designConfig?.typography,
          [key]: value,
        },
      },
    }));
  };

  const updateDesignConfigImage = (key: "scale"|"offsetX"|"offsetY"|"fit", value: unknown) => {
    setForm((prev) => ({
      ...prev,
      designConfig: {
        ...prev.designConfig,
        imageConfig: {
          ...prev.designConfig?.imageConfig,
          [key]: value,
        },
      },
    }));
  };

  const toggleUserType = (type: string) => {
    setSelectedUserTypes((prev) => {
      const next = prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type];
      update("applicableUserTypes", next);
      return next;
    });
  };

  const handleSubmit = async () => {
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

    let finalImageUrl = form.imageUrl;  // defaults to already-stored S3 key

    if (imageFile) {
      setIsUploadingImage(true);
      try {
        const data = await uploadCouponImage(imageFile);
        if (data.imageUrl) {
          finalImageUrl = data.imageUrl;  // raw S3 object key — safe to store
        }
        // Update the preview to show the presigned URL from server
        if (data.previewUrl) {
          setLocalPreviewUrl(data.previewUrl);
        }
      } catch {
        toast.error("Failed to upload image to server.");
        setIsUploadingImage(false);
        return;
      }
      setIsUploadingImage(false);
    }

    const payload = {
      ...form,
      imageUrl: finalImageUrl,
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
          <Card className="bg-[#121212]/30 border-white/5 backdrop-blur-md shadow-xl relative z-20">
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

              <div className="grid grid-cols-2 gap-4">
                {/* Category */}
                <div className="space-y-2 relative z-50">
                  <Label htmlFor="category-input" className="text-white">Category *</Label>
                  <div className="relative">
                    <Input
                      id="category-input"
                      value={form.category || ""}
                      onChange={(e) => update("category", e.target.value)}
                      onFocus={() => setShowCategoryDropdown(true)}
                      onBlur={() => setTimeout(() => setShowCategoryDropdown(false), 200)}
                      placeholder="e.g. General Offer, Exclusive"
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus-visible:ring-[#D3D925] pr-10"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/50">
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </div>
                  {showCategoryDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-[#121212] border border-white/10 rounded-md shadow-lg max-h-48 overflow-auto py-1">
                      {CATEGORY_SUGGESTIONS.map((c) => (
                        <div
                          key={c}
                          className="px-3 py-2 text-sm text-white hover:bg-white/10 cursor-pointer transition-colors"
                          onClick={() => {
                            update("category", c);
                            setShowCategoryDropdown(false);
                          }}
                        >
                          {c}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Image URL */}
                <div className="space-y-2">
                  <Label htmlFor="imageUrl" className="text-white">Image URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="imageUrl"
                      placeholder="e.g. /images/offers/bus.webp"
                      value={form.imageUrl || ""}
                      onChange={(e) => update("imageUrl", e.target.value)}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus-visible:ring-[#D3D925]"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white shrink-0"
                      disabled={isUploadingImage}
                    >
                      {isUploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Upload className="w-4 h-4 mr-2" /> Upload</>}
                    </Button>
                    <input 
                      type="file" 
                      className="hidden" 
                      ref={fileInputRef} 
                      accept="image/*" 
                      onChange={handleFileChange} 
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Discount Config */}
          <Card className="bg-[#121212]/30 border-white/5 backdrop-blur-md shadow-xl relative z-10">
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
                  category: form.category,
                  imageUrl: localPreviewUrl || form.imageUrl,
                  discountType: form.discountType,
                  discountValue: form.discountValue,
                  minOrderAmount: form.minOrderAmount ?? 0,
                  maxDiscountAmount: form.maxDiscountAmount,
                  validFrom: form.validFrom,
                  validTo: form.validTo,
                  perUserLimit: form.perUserLimit ?? 1,
                  designConfig: form.designConfig,
                }}
              />
            </CardContent>
          </Card>

          {/* Design Controls */}
          <Card className="bg-[#121212]/30 border-white/5 backdrop-blur-md shadow-xl mt-6">
            <CardHeader className="border-b border-white/5 bg-white/5 pb-4">
              <CardTitle className="flex items-center gap-2 text-white">Card Design Controls</CardTitle>
              <CardDescription className="text-white/60">Customize edges, typography, and image</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <Tabs defaultValue="edges" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-white/5 border border-white/10 p-1 rounded-lg">
                  <TabsTrigger value="edges" className="data-[state=active]:bg-[#D3D925] data-[state=active]:text-[#121212] data-[state=active]:font-bold text-white/70">Edges</TabsTrigger>
                  <TabsTrigger value="typography" className="data-[state=active]:bg-[#D3D925] data-[state=active]:text-[#121212] data-[state=active]:font-bold text-white/70">Typography</TabsTrigger>
                  <TabsTrigger value="image" className="data-[state=active]:bg-[#D3D925] data-[state=active]:text-[#121212] data-[state=active]:font-bold text-white/70">Image</TabsTrigger>
                </TabsList>

                {/* EDGES TAB */}
                <TabsContent value="edges" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    {["top", "bottom", "left", "right"].map((edge) => (
                      <div key={edge} className="space-y-2">
                        <Label className="text-white capitalize">{edge} Edge</Label>
                        <Select
                          value={form.designConfig?.edges?.[edge as keyof typeof form.designConfig.edges] || "smooth"}
                          onValueChange={(v) => updateDesignConfigEdge(edge as any, v)}
                        >
                          <SelectTrigger className="bg-white/5 border-white/10 text-white focus:ring-[#D3D925]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#121212] border-white/10 text-white">
                            <SelectItem value="smooth" className="focus:bg-white/10 focus:text-white">Smooth</SelectItem>
                            <SelectItem value="jagged" className="focus:bg-white/10 focus:text-white">Jagged</SelectItem>
                            <SelectItem value="ticket" className="focus:bg-white/10 focus:text-white">Ticket (Holes)</SelectItem>
                            <SelectItem value="torn" className="focus:bg-white/10 focus:text-white">Torn Paper</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                {/* TYPOGRAPHY TAB */}
                <TabsContent value="typography" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    {Object.keys(defaultForm.designConfig?.typography || {}).map((key) => {
                      const labelMap: Record<string, string> = {
                        titleAlignment: "Title Alignment",
                        descAlignment: "Description Alignment",
                        codeAlignment: "Code Alignment",
                      };
                      return (
                        <div key={key} className="space-y-2">
                          <Label className="text-white">{labelMap[key]}</Label>
                          <Select
                            value={form.designConfig?.typography?.[key as keyof typeof form.designConfig.typography] || "left"}
                            onValueChange={(v) => updateDesignConfigTypo(key as any, v)}
                          >
                            <SelectTrigger className="bg-white/5 border-white/10 text-white focus:ring-[#D3D925]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#121212] border-white/10 text-white">
                              <SelectItem value="left" className="focus:bg-white/10 focus:text-white">Left</SelectItem>
                              <SelectItem value="center" className="focus:bg-white/10 focus:text-white">Center</SelectItem>
                              <SelectItem value="right" className="focus:bg-white/10 focus:text-white">Right</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      );
                    })}
                  </div>
                </TabsContent>

                {/* IMAGE TAB */}
                <TabsContent value="image" className="space-y-6 mt-4">
                  <div className="grid grid-cols-1 gap-6">
                    {/* Image Fit */}
                    <div className="space-y-2">
                      <Label className="text-white">Image Fit Mode</Label>
                      <Select
                        value={form.designConfig?.imageConfig?.fit || "cover"}
                        onValueChange={(v) => updateDesignConfigImage("fit", v)}
                      >
                        <SelectTrigger className="bg-white/5 border-white/10 text-white focus:ring-[#D3D925]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#121212] border-white/10 text-white">
                          <SelectItem value="cover" className="focus:bg-white/10 focus:text-white">Cover (Fill Space)</SelectItem>
                          <SelectItem value="contain" className="focus:bg-white/10 focus:text-white">Contain (Show Whole)</SelectItem>
                          <SelectItem value="fill" className="focus:bg-white/10 focus:text-white">Fill (Stretch)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Scale — stored as 50-300 (preview divides by 100) */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="text-white">Zoom / Scale</Label>
                        <span className="text-white/60 text-xs">{((form.designConfig?.imageConfig?.scale ?? 100)).toFixed(0)}%</span>
                      </div>
                      <Slider
                        min={30}
                        max={300}
                        step={5}
                        value={[form.designConfig?.imageConfig?.scale ?? 100]}
                        onValueChange={([val]) => updateDesignConfigImage("scale", val)}
                        className="w-full"
                      />
                    </div>

                    {/* Offset X — stored as % of container width, applied via left/right positioning */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="text-white">Horizontal Offset (X)</Label>
                        <span className="text-white/60 text-xs">{form.designConfig?.imageConfig?.offsetX ?? 0}%</span>
                      </div>
                      <Slider
                        min={-50}
                        max={50}
                        step={1}
                        value={[form.designConfig?.imageConfig?.offsetX ?? 0]}
                        onValueChange={([val]) => updateDesignConfigImage("offsetX", val)}
                        className="w-full"
                      />
                    </div>

                    {/* Offset Y */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="text-white">Vertical Offset (Y)</Label>
                        <span className="text-white/60 text-xs">{form.designConfig?.imageConfig?.offsetY ?? 0}%</span>
                      </div>
                      <Slider
                        min={-50}
                        max={50}
                        step={1}
                        value={[form.designConfig?.imageConfig?.offsetY ?? 0]}
                        onValueChange={([val]) => updateDesignConfigImage("offsetY", val)}
                        className="w-full"
                      />
                    </div>

                    {/* Reset image controls */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white"
                      onClick={() => {
                        updateDesignConfigImage("scale", 100);
                        updateDesignConfigImage("offsetX", 0);
                        updateDesignConfigImage("offsetY", 0);
                        updateDesignConfigImage("fit", "cover");
                      }}
                    >
                      Reset Image Controls
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
