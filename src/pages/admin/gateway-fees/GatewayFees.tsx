import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { api } from "@/api/axios";
import { Landmark, Loader2, RefreshCw } from "lucide-react";

// Matches the structure defined in platformConfigModel.js DEFAULTS.gateway_fees
type GatewayFeeEntry = {
  feePercent: number;
  label: string;
};

type GatewayFeesMap = Record<string, GatewayFeeEntry>;

// Hardcoded display order + labels for known gateways
const GATEWAY_META: Record<string, { displayName: string; note?: string }> = {
  esewa:       { displayName: "eSewa",         note: "Most popular digital wallet" },
  khalti:      { displayName: "Khalti",        note: "Widely used payment gateway" },
  ime_pay:     { displayName: "IME Pay",       note: "IME Digital wallet" },
  connect_ips: { displayName: "ConnectIPS",    note: "Bank transfer network (typically 0%)" },
};

// Default fallback values (mirrors platformConfigModel.js DEFAULTS)
const DEFAULT_FEES: GatewayFeesMap = {
  esewa:       { feePercent: 1.8, label: "eSewa" },
  khalti:      { feePercent: 1.5, label: "Khalti" },
  ime_pay:     { feePercent: 1.5, label: "IME Pay" },
  connect_ips: { feePercent: 0,   label: "ConnectIPS" },
};

const GatewayFees = () => {
  const [loading, setLoading]   = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCustomized, setIsCustomized] = useState(false);
  const [lastUpdated, setLastUpdated]   = useState<string | null>(null);

  // State mirrors the exact backend shape: { gateway: { feePercent, label } }
  const [fees, setFees] = useState<GatewayFeesMap>(DEFAULT_FEES);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await api.get("/platform-config/gateway_fees");
      if (res.data.status && res.data.data) {
        const serverValue: GatewayFeesMap = res.data.data.value;
        setFees(serverValue);
        setIsCustomized(res.data.data.isCustomized);
        setLastUpdated(res.data.data.updatedAt);
      }
    } catch {
      toast.error("Failed to load gateway fees — showing defaults");
      setFees(DEFAULT_FEES);
    } finally {
      setLoading(false);
    }
  };

  const handleFeeChange = (gateway: string, raw: string) => {
    const num = parseFloat(raw);
    setFees((prev) => ({
      ...prev,
      [gateway]: {
        ...prev[gateway],
        feePercent: isNaN(num) ? 0 : Math.min(100, Math.max(0, num)),
      },
    }));
  };

  const handleSave = async () => {
    // Client-side guard: all percentages must be between 0-100
    for (const [key, entry] of Object.entries(fees)) {
      if (entry.feePercent < 0 || entry.feePercent > 100) {
        toast.error(`${GATEWAY_META[key]?.displayName ?? key}: fee must be between 0% and 100%`);
        return;
      }
    }

    try {
      setIsSaving(true);
      const res = await api.put("/platform-config/gateway_fees", {
        value: fees,
        note: "Updated via admin panel",
      });

      if (res.data.status) {
        toast.success("Gateway fees updated successfully!");
        await fetchConfig(); // Reload to confirm server state
      } else {
        toast.error(res.data.message || "Failed to update gateway fees");
      }
    } catch (err: any) {
      const serverMsg = err?.response?.data?.message;
      toast.error(serverMsg || "Failed to update gateway fees");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setFees(DEFAULT_FEES);
    toast.info("Reset to defaults — click Save to apply.");
  };

  return (
    <>
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Payment Gateway Fees</h2>
            <p className="text-white/60 mt-1 text-sm font-medium">
              Configure transaction fee percentages charged to passengers per payment method.
              These take effect immediately — no redeploy needed.
            </p>
          </div>
          <div className="flex items-center gap-2 mt-1">
            {isCustomized && (
              <Badge variant="outline" className="text-xs text-[#D3D925] border-[#D3D925]/30 bg-[#D3D925]/10">
                Customized
              </Badge>
            )}
            {!isCustomized && (
              <Badge variant="outline" className="text-xs text-white/60 border-white/10">
                Default values
              </Badge>
            )}
          </div>
        </div>
        {lastUpdated && (
          <p className="text-xs text-white/40 mt-1">
            Last updated: {new Date(lastUpdated).toLocaleString()}
          </p>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40 text-white/60 gap-2">
          <Loader2 className="animate-spin h-5 w-5" />
          <span>Loading configuration...</span>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Object.entries(fees).map(([gateway, entry]) => {
            const meta = GATEWAY_META[gateway] ?? { displayName: entry.label || gateway };
            return (
              <Card key={gateway} className="bg-[#121212]/30 border-white/5 backdrop-blur-md shadow-xl">
                <CardHeader className="border-b border-white/5 bg-white/5 pb-4">
                  <CardTitle className="flex items-center gap-2 text-white">
                    <div className="w-8 h-8 rounded-lg bg-[#D3D925]/10 flex items-center justify-center">
                      <Landmark className="h-4 w-4 text-[#D3D925]" />
                    </div>
                    {meta.displayName}
                  </CardTitle>
                  {meta.note && (
                    <CardDescription className="text-xs text-white/50">{meta.note}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-3 pt-4">
                  <div className="space-y-1.5">
                    <Label htmlFor={`fee-${gateway}`} className="text-sm font-medium text-white/80">
                      Fee Percentage
                    </Label>
                    <div className="relative">
                      <Input
                        id={`fee-${gateway}`}
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={entry.feePercent}
                        onChange={(e) => handleFeeChange(gateway, e.target.value)}
                        className="pr-8 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[#D3D925] focus-visible:ring-1 focus-visible:border-[#D3D925]"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-white/40">
                        %
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-white/50">
                    On a Rs. 1000 ticket: Rs. {(1000 * entry.feePercent / 100).toFixed(2)} fee
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {!loading && (
        <div className="flex items-center gap-3 mt-8">
          <Button onClick={handleSave} disabled={isSaving} className="min-w-32 bg-[#D3D925] hover:bg-[#b5bc1b] text-black font-semibold">
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
          <Button variant="outline" onClick={handleReset} disabled={isSaving} className="gap-2 bg-transparent border-white/10 text-white hover:bg-white/5 hover:text-white">
            <RefreshCw className="h-4 w-4" />
            Reset to Defaults
          </Button>
          <Button variant="ghost" onClick={fetchConfig} disabled={loading || isSaving} className="gap-2 ml-auto text-white/60 hover:text-white hover:bg-white/5">
            <RefreshCw className="h-4 w-4" />
            Reload
          </Button>
        </div>
      )}
    </>
  );
};

export default GatewayFees;
