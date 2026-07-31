import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Loader2, Database, MapPin, Globe, ArrowRight, Sparkles, ListOrdered, Route, Pencil, Trash2, Search, X, Upload, AlertTriangle, CheckCircle2, FileJson, ChevronRight, ChevronDown, SkipForward, Navigation } from "lucide-react";
import { toast } from "sonner";
import { createStop, getAllStops, updateStop, deleteStop, createCorridor, getAllCorridors, updateCorridor, deleteCorridor, getVariantsByCorridor, updateVariant, deleteVariant, createRegistryBoardingPoint, getBoardingPointsByStop, updateRegistryBoardingPoint, deleteRegistryBoardingPoint, getAllRouteRequests, previewBulkStops, bulkImportStops } from "@/api/platformRegistryApi";
import { CreateVariantModal, MapStopsModal } from "./VariantModals";
import RouteRequestsPanel from "./RouteRequestsPanel";
import { DiscoveryTab } from "./DiscoveryTab";
import { cn } from "@/lib/utils";

// ── Bulk Import Modal ───────────────────────────────────────────────────────────────────

const EXAMPLE_JSON = `[
  { "code": "KTM", "name": "Kathmandu", "type": "CITY", "province": "Bagmati", "district": "Kathmandu", "municipality": "Kathmandu Metropolitan" },
  { "code": "PKR", "name": "Pokhara", "type": "CITY", "province": "Gandaki", "district": "Kaski", "municipality": "Pokhara Metropolitan" },
  { "code": "HTD", "name": "Hetauda", "type": "CITY", "province": "Bagmati", "district": "Makwanpur", "municipality": "Hetauda Sub-Metropolitan" }
]`;

type ScanReport = {
  toInsert: any[];
  duplicateCode: any[];
  duplicateIdentity: any[];
  duplicateWithinBatch: any[];
  invalid: any[];
  summary: { total: number; new: number; skippedCode: number; skippedIdentity: number; skippedBatch: number; invalid: number };
};

const BulkImportStopsModal = ({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) => {
  const [step, setStep] = React.useState<"paste" | "preview">("paste");
  const [jsonText, setJsonText] = React.useState("");
  const [parseError, setParseError] = React.useState<string | null>(null);
  const [report, setReport] = React.useState<ScanReport | null>(null);
  const [scanning, setScanning] = React.useState(false);
  const [importing, setImporting] = React.useState(false);

  const reset = () => {
    setStep("paste");
    setJsonText("");
    setParseError(null);
    setReport(null);
    setScanning(false);
    setImporting(false);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleScan = async () => {
    setParseError(null);
    let parsed: any[];
    try {
      parsed = JSON.parse(jsonText.trim());
      if (!Array.isArray(parsed)) throw new Error("Root value must be a JSON array [ ... ]");
    } catch (e: any) {
      setParseError(`JSON syntax error: ${e.message}`);
      return;
    }
    setScanning(true);
    try {
      const res = await previewBulkStops(parsed);
      setReport(res.data);
      setStep("preview");
    } catch (e: any) {
      toast.error(e.response?.data?.message || e.message);
    } finally {
      setScanning(false);
    }
  };

  const handleImport = async () => {
    if (!report || report.toInsert.length === 0) return;
    setImporting(true);
    try {
      const res = await bulkImportStops(report.toInsert);
      toast.success(`✅ ${res.data.inserted} stop(s) imported successfully.`);
      onSuccess();
      handleClose();
    } catch (e: any) {
      toast.error(e.response?.data?.message || e.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[680px] rounded-2xl border-none shadow-2xl p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-[#121212] px-7 py-6 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/10 shrink-0">
              <FileJson className="w-5 h-5 text-[#D3D925]" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-base font-bold text-white mb-0.5">Bulk Import Stops via JSON</DialogTitle>
              <p className="text-white/50 text-xs font-medium">Paste a JSON array — the system scans for duplicates before writing anything.</p>
            </div>
            {/* Step indicator */}
            <div className="flex items-center gap-2 shrink-0">
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                step === "paste" ? "bg-[#D3D925]/10 text-[#D3D925] border border-[#D3D925]/20" : "bg-white/5 text-white/50"
              }`}><span>1</span><span className="hidden sm:inline">Paste</span></div>
              <ChevronRight className="w-3 h-3 text-white/40" />
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                step === "preview" ? "bg-[#D3D925]/10 text-[#D3D925] border border-[#D3D925]/20" : "bg-white/5 text-white/50"
              }`}><span>2</span><span className="hidden sm:inline">Preview</span></div>
            </div>
          </div>
        </div>

        {/* Step 1: Paste JSON */}
        {step === "paste" && (
          <div className="p-6 space-y-4 bg-[#0a0a0a]">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-white/50">JSON Array</Label>
                <button
                  onClick={() => setJsonText(EXAMPLE_JSON)}
                  className="text-[10px] font-bold text-[#D3D925] hover:underline"
                >Load example</button>
              </div>
              <textarea
                id="bulk-stops-json-input"
                className={`w-full h-52 p-4 rounded-xl border text-xs resize-none bg-white/[0.04] focus:outline-none focus:ring-2 transition-all ${
                  parseError ? "border-destructive/60 focus:ring-destructive/30" : "border-white/10 focus:ring-primary/30"
                }`}
                placeholder={EXAMPLE_JSON}
                value={jsonText}
                onChange={e => { setJsonText(e.target.value); setParseError(null); }}
                spellCheck={false}
              />
              {parseError && (
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-destructive/10 border border-destructive/20">
                  <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                  <p className="text-xs text-destructive font-medium">{parseError}</p>
                </div>
              )}
            </div>

            {/* Format hint */}
            <div className="rounded-xl border border-white/5 p-4 bg-white/[0.02] space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Expected Format</p>
              <div className="grid grid-cols-4 gap-2 text-xs">
                {[{f:"code",r:"Optional",e:'"KTM"'},{f:"name",r:"Required",e:'"Kathmandu"'},{f:"type",r:"Optional",e:'"CITY"'},{f:"province",r:"Optional",e:'"Bagmati"'}].map(col => (
                  <div key={col.f} className="space-y-0.5">
                    <p className="font-bold text-white">{col.f}</p>
                    <p className={`text-[10px] font-bold ${col.r === "Required" ? "text-white" : "text-white/50"}`}>{col.r}</p>
                    <p className="text-white/50">{col.e}</p>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-white/50">type must be one of: CITY · JUNCTION · TOWN · HIGHWAY_STOP · BORDER &nbsp;&nbsp;|&nbsp;&nbsp; aliases can be array of strings &nbsp;&nbsp;|&nbsp;&nbsp; max 500 stops per batch</p>
            </div>

            <div className="flex gap-3 pt-1">
              <Button variant="outline" onClick={handleClose} className="font-bold rounded-xl h-11 flex-1">Cancel</Button>
              <Button
                id="scan-json-btn"
                className="h-11 flex-1 rounded-xl font-bold bg-[#121212] hover:bg-white/10 text-white gap-2"
                disabled={!jsonText.trim() || scanning}
                onClick={handleScan}
              >
                {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                {scanning ? "Scanning..." : "Scan JSON"}
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Preview report */}
        {step === "preview" && report && (
          <div className="flex flex-col bg-[#0a0a0a]" style={{ maxHeight: "70vh" }}>
            {/* Summary cards */}
            <div className="px-6 pt-5 pb-4 grid grid-cols-4 gap-3 shrink-0">
              {[
                { label: "Total", val: report.summary.total, cls: "bg-white/5 border-white/5 text-white" },
                { label: "New ✅", val: report.summary.new, cls: "bg-[#D3D925]/10 border-[#D3D925]/20 text-white/90" },
                { label: "Skipped ⚠️", val: report.summary.skippedCode + report.summary.skippedIdentity + report.summary.skippedBatch, cls: "bg-white/5 border-white/10 text-white" },
                { label: "Invalid ❌", val: report.summary.invalid, cls: "bg-white/5 border-white/10 text-white" },
              ].map(card => (
                <div key={card.label} className={`rounded-xl border px-3 py-2.5 text-center ${card.cls}`}>
                  <p className="text-xl font-bold">{card.val}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider mt-0.5 opacity-70">{card.label}</p>
                </div>
              ))}
            </div>

            {report.summary.new === 0 && (
              <div className="mx-6 mb-4 px-4 py-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2 shrink-0">
                <SkipForward className="w-4 h-4 text-white shrink-0" />
                <p className="text-xs font-bold text-white">All entries already exist in the registry — nothing to import.</p>
              </div>
            )}

            {/* Scrollable table */}
            <div className="flex-1 overflow-y-auto px-6 pb-2 space-y-3" style={{ minHeight: 0 }}>
              {/* New stops */}
              {report.toInsert.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#D3D925] mb-1.5 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {report.toInsert.length} New — will be added
                  </p>
                  <div className="rounded-xl border border-[#D3D925]/20 overflow-hidden">
                    <table className="w-full text-xs">
                      <thead><tr className="bg-[#D3D925]/10">
                        <th className="px-3 py-2 text-left font-bold text-white/90">Code</th>
                        <th className="px-3 py-2 text-left font-bold text-white/90">Name</th>
                        <th className="px-3 py-2 text-left font-bold text-white/90">Type</th>
                        <th className="px-3 py-2 text-left font-bold text-white/90">Province</th>
                      </tr></thead>
                      <tbody>
                        {report.toInsert.map((s: any, i: number) => (
                          <tr key={i} className="border-t border-[#D3D925]/10">
                            <td className="px-3 py-2 font-bold text-white/90">{s.code}</td>
                            <td className="px-3 py-2 font-bold">{s.name}</td>
                            <td className="px-3 py-2 text-white/50">{s.type}</td>
                            <td className="px-3 py-2 text-white/50">{s.province || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Duplicate codes */}
              {report.duplicateCode.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white mb-1.5 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" /> {report.duplicateCode.length} Duplicate Code — skipped
                  </p>
                  <div className="rounded-xl border border-white/10 overflow-hidden">
                    <table className="w-full text-xs">
                      <thead><tr className="bg-white/5">
                        <th className="px-3 py-2 text-left font-bold text-white">Row</th>
                        <th className="px-3 py-2 text-left font-bold text-white">Code</th>
                        <th className="px-3 py-2 text-left font-bold text-white">Your Name</th>
                        <th className="px-3 py-2 text-left font-bold text-white">Context</th>
                      </tr></thead>
                      <tbody>
                        {report.duplicateCode.map((s: any, i: number) => (
                          <tr key={i} className="border-t border-white/10">
                            <td className="px-3 py-2 text-white/50">{s._sourceIndex !== undefined ? s._sourceIndex + 1 : "-"}</td>
                            <td className="px-3 py-2 font-bold text-white">{s.code}</td>
                            <td className="px-3 py-2 font-bold">{s.name}</td>
                            <td className="px-3 py-2 text-white/50">{[s.district, s.municipality].filter(Boolean).join(", ")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Duplicate identities */}
              {report.duplicateIdentity.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white mb-1.5 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" /> {report.duplicateIdentity.length} Duplicate Identity — skipped
                  </p>
                  <div className="rounded-xl border border-white/10 overflow-hidden">
                    <table className="w-full text-xs">
                      <thead><tr className="bg-white/5">
                        <th className="px-3 py-2 text-left font-bold text-white">Row</th>
                        <th className="px-3 py-2 text-left font-bold text-white">Code</th>
                        <th className="px-3 py-2 text-left font-bold text-white">Name</th>
                        <th className="px-3 py-2 text-left font-bold text-white">Existing Code</th>
                        <th className="px-3 py-2 text-left font-bold text-white">Context</th>
                      </tr></thead>
                      <tbody>
                        {report.duplicateIdentity.map((s: any, i: number) => (
                          <tr key={i} className="border-t border-white/10">
                            <td className="px-3 py-2 text-white/50">{s._sourceIndex !== undefined ? s._sourceIndex + 1 : "-"}</td>
                            <td className="px-3 py-2 font-bold text-white">{s.code}</td>
                            <td className="px-3 py-2 font-bold">{s.name}</td>
                            <td className="px-3 py-2 text-white/50">{s.existingStop?.code || "—"}</td>
                            <td className="px-3 py-2 text-white/50">{[s.district, s.municipality].filter(Boolean).join(", ")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Duplicate within batch */}
              {report.duplicateWithinBatch.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white mb-1.5 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" /> {report.duplicateWithinBatch.length} Duplicate Within Batch — skipped
                  </p>
                  <div className="rounded-xl border border-white/10 overflow-hidden">
                    <table className="w-full text-xs">
                      <thead><tr className="bg-white/5">
                        <th className="px-3 py-2 text-left font-bold text-white">Row</th>
                        <th className="px-3 py-2 text-left font-bold text-white">Code</th>
                        <th className="px-3 py-2 text-left font-bold text-white">Name</th>
                        <th className="px-3 py-2 text-left font-bold text-white">Reason</th>
                      </tr></thead>
                      <tbody>
                        {report.duplicateWithinBatch.map((s: any, i: number) => (
                          <tr key={i} className="border-t border-white/10">
                            <td className="px-3 py-2 text-white/50">{s._sourceIndex !== undefined ? s._sourceIndex + 1 : "-"}</td>
                            <td className="px-3 py-2 font-bold text-white">{s.code}</td>
                            <td className="px-3 py-2 font-bold">{s.name}</td>
                            <td className="px-3 py-2 text-white/50">{s.conflictReason || "Conflict"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Invalid entries */}
              {report.invalid.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white mb-1.5 flex items-center gap-1.5">
                    <X className="w-3.5 h-3.5" /> {report.invalid.length} Invalid — skipped
                  </p>
                  <div className="rounded-xl border border-white/10 overflow-hidden">
                    <table className="w-full text-xs">
                      <thead><tr className="bg-white/5">
                        <th className="px-3 py-2 text-left font-bold text-white w-12">Row</th>
                        <th className="px-3 py-2 text-left font-bold text-white">Code</th>
                        <th className="px-3 py-2 text-left font-bold text-white">Error</th>
                      </tr></thead>
                      <tbody>
                        {report.invalid.map((e: any, i: number) => (
                          <tr key={i} className="border-t border-white/10">
                            <td className="px-3 py-2 text-white/50">{e.index !== null ? e.index + 1 : "-"}</td>
                            <td className="px-3 py-2 text-white/70">{e.code || "-"}</td>
                            <td className="px-3 py-2 text-white">{e.message || e.error}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="px-6 py-4 border-t bg-white/[0.02] flex gap-3 shrink-0">
              <Button variant="outline" onClick={() => setStep("paste")} className="font-bold rounded-xl h-11">
                ← Back
              </Button>
              <Button
                id="confirm-bulk-import-btn"
                className="h-11 flex-1 rounded-xl font-bold bg-[#D3D925] text-black hover:bg-[#D9CD25] text-white gap-2 disabled:opacity-50"
                disabled={report.summary.new === 0 || importing}
                onClick={handleImport}
              >
                {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {importing ? "Importing..." : `Confirm Import — Add ${report.summary.new} Stop${report.summary.new !== 1 ? "s" : ""}`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

// ── Layer 3: Stop Registry Tab ────────────────────────────────────────────────
const StopRegistryTab = () => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [editStop, setEditStop] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({ name: "", type: "CITY", province: "", district: "", municipality: "", aliases: "", lat: "", lng: "", isSearchable: true, isRouteStop: false, parentStopId: "none" });
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [form, setForm] = useState({ code: "", name: "", type: "CITY", province: "", district: "", municipality: "", aliases: "", lat: "", lng: "", isSearchable: true, isRouteStop: false, parentStopId: "none" });
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const { data, isLoading } = useQuery({ queryKey: ["stops"], queryFn: getAllStops });
  const stops = data?.data || [];

  const filtered = useMemo(() =>
    stops.filter((s: any) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.code && s.code.toLowerCase().includes(search.toLowerCase()))
    ), [stops, search]);

  const tree = useMemo(() => {
    const t: any = {};
    filtered.forEach((s: any) => {
      const p = s.province || "Uncategorized";
      const d = s.district || "Uncategorized";
      const m = s.municipality || "Uncategorized";
      if (!t[p]) t[p] = {};
      if (!t[p][d]) t[p][d] = {};
      if (!t[p][d][m]) t[p][d][m] = [];
      t[p][d][m].push(s);
    });
    return t;
  }, [filtered]);

  const uniqueDistricts = useMemo(() => Array.from(new Set(stops.map((s: any) => s.district).filter(Boolean))).sort(), [stops]);
  const uniqueMunicipalities = useMemo(() => Array.from(new Set(stops.map((s: any) => s.municipality).filter(Boolean))).sort(), [stops]);

  const toggleExpand = (key: string) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const createMutation = useMutation({
    mutationFn: createStop,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["stops"] }); toast.success("Stop added."); setOpen(false); setForm({ code: "", name: "", type: "CITY", province: "", district: "", municipality: "", aliases: "", lat: "", lng: "", isSearchable: true, isRouteStop: false, parentStopId: "none" }); },
    onError: (e: any) => toast.error(e.response?.data?.message || e.message),
  });

  const editMutation = useMutation({
    mutationFn: ({ id, payload }: any) => updateStop(id, payload),
    // Optimistically update the cache so the tree re-groups the stop immediately
    onMutate: async ({ id, payload }: any) => {
      await qc.cancelQueries({ queryKey: ["stops"] });
      const previous = qc.getQueryData(["stops"]);
      qc.setQueryData(["stops"], (old: any) => {
        if (!old?.data || !Array.isArray(old.data)) return old;
        return {
          ...old,
          data: old.data.map((s: any) =>
            s._id === id
              ? {
                  ...s,
                  ...(payload.name      && { name: payload.name }),
                  ...(payload.type      && { type: payload.type }),
                  ...(payload.province  !== undefined && { province:     payload.province }),
                  ...(payload.district  !== undefined && { district:     payload.district }),
                  ...(payload.municipality !== undefined && { municipality: payload.municipality }),
                  ...(payload.aliases   !== undefined && { aliases:      payload.aliases }),
                  ...(payload.coordinates !== undefined && { coordinates:  payload.coordinates }),
                }
              : s
          )
        };
      });
      return { previous };
    },
    onError: (_e: any, _vars: any, context: any) => {
      // Roll back on failure
      if (context?.previous) qc.setQueryData(["stops"], context.previous);
      toast.error(_e.response?.data?.message || _e.message);
    },
    onSuccess: () => {
      toast.success("Stop updated.");
      setEditStop(null);
    },
    onSettled: () => {
      // Always reconcile with server state after the call
      qc.invalidateQueries({ queryKey: ["stops"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteStop(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["stops"] }); toast.success("Stop deleted."); setDeleteTarget(null); },
    onError: (e: any) => {
      const msg = e.response?.data?.message || e.message;
      toast.error(msg);
      setDeleteTarget(null);
    },
  });

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center gap-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
          <Input placeholder="Search stops..." className="pl-9 h-10 rounded-xl" value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-3.5 h-3.5 text-white/50" /></button>}
        </div>
        <div className="flex items-center gap-2">
          <Button
            id="bulk-import-stops-btn"
            variant="outline"
            onClick={() => setBulkOpen(true)}
            className="gap-2 font-bold rounded-xl h-10 px-4 border-dashed hover:bg-[#D3D925]/10 hover:border-[#D3D925]/40 hover:text-[#D3D925] transition-all"
          >
            <FileJson className="w-4 h-4" />
            <span className="hidden sm:inline">Bulk Import</span>
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 font-bold rounded-xl h-10 px-5"><Plus className="w-4 h-4" /> Add Stop</Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] rounded-2xl border-none shadow-2xl p-0 overflow-hidden">
            <div className="bg-[#121212] p-7 border-b border-white/5 text-white">
              <DialogHeader><DialogTitle className="text-lg font-bold text-white flex items-center gap-2.5"><div className="p-1.5 bg-white/10 rounded-lg"><MapPin className="w-4 h-4 text-white" /></div>Register Stop Node</DialogTitle></DialogHeader>
              <p className="text-white/50 text-sm font-medium mt-1.5 ml-9">Add a city or junction to the global registry.</p>
            </div>
            <div className="p-7 space-y-4 bg-[#0a0a0a]">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Short Code (Optional)</Label><Input placeholder="KTM" className="h-11 rounded-xl font-bold uppercase" value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} /></div>
                <div className="space-y-1.5"><Label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Full Name</Label><Input placeholder="Kathmandu" className="h-11 rounded-xl font-bold" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Type</Label>
                  <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}><SelectTrigger className="h-11 rounded-xl font-bold"><SelectValue /></SelectTrigger><SelectContent className="rounded-xl"><SelectItem value="CITY">City</SelectItem><SelectItem value="JUNCTION">Junction</SelectItem><SelectItem value="TOWN">Town</SelectItem><SelectItem value="HIGHWAY_STOP">Highway Stop</SelectItem><SelectItem value="BORDER">Border</SelectItem></SelectContent></Select>
                </div>
                <div className="space-y-1.5"><Label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Province</Label><Input placeholder="Bagmati" className="h-11 rounded-xl font-bold" value={form.province} onChange={e => setForm({ ...form, province: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label className="text-[10px] font-bold uppercase tracking-widest text-white/50">District</Label><Input list="district-list" placeholder="Kathmandu" className="h-11 rounded-xl font-bold" value={form.district} onChange={e => setForm({ ...form, district: e.target.value })} /></div>
                <div className="space-y-1.5"><Label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Municipality</Label><Input list="municipality-list" placeholder="KMC" className="h-11 rounded-xl font-bold" value={form.municipality} onChange={e => setForm({ ...form, municipality: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Aliases (Comma Separated)</Label><Input placeholder="Kantipur, Yen" className="h-11 rounded-xl font-bold" value={form.aliases} onChange={e => setForm({ ...form, aliases: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-2">
                   <div className="space-y-1.5"><Label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Latitude</Label><Input type="number" placeholder="27.7172" className="h-11 rounded-xl font-bold" value={form.lat} onChange={e => setForm({ ...form, lat: e.target.value })} /></div>
                   <div className="space-y-1.5"><Label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Longitude</Label><Input type="number" placeholder="85.3240" className="h-11 rounded-xl font-bold" value={form.lng} onChange={e => setForm({ ...form, lng: e.target.value })} /></div>
                </div>
              </div>
              <div className="border-t border-white/10 pt-4 mt-2">
                <p className="text-xs font-bold text-white/50 mb-3 uppercase tracking-widest">Capabilities</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-bold text-white">Searchable Place</Label>
                      <p className="text-[10px] text-white/50">Appears in passenger search</p>
                    </div>
                    <Switch checked={form.isSearchable} onCheckedChange={(c) => setForm({ ...form, isSearchable: c })} />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-bold text-white">Route Stop</Label>
                      <p className="text-[10px] text-white/50">Used for boarding/dropping</p>
                    </div>
                    <Switch checked={form.isRouteStop} onCheckedChange={(c) => setForm({ ...form, isRouteStop: c })} />
                  </div>
                </div>
                {form.isRouteStop && (
                  <div className="mt-4 space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Parent Stop (Optional)</Label>
                    <Select value={form.parentStopId} onValueChange={(v) => setForm({ ...form, parentStopId: v })}>
                      <SelectTrigger className="h-11 rounded-xl font-bold bg-[#121212] border-white/10 text-white">
                        <SelectValue placeholder="Select broad searchable place..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl bg-[#121212] border-white/10 text-white">
                        <SelectItem value="none" className="text-white/50">None</SelectItem>
                        {stops.filter((s: any) => s.isSearchable).map((s: any) => (
                          <SelectItem key={s._id} value={s._id}>{s.name} ({s.code || s.district})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter className="p-7 pt-0 bg-[#0a0a0a] gap-3">
              <Button variant="outline" onClick={() => setOpen(false)} className="font-bold rounded-xl h-11">Cancel</Button>
              <Button className="h-11 rounded-xl font-bold bg-[#121212] hover:bg-white/10 text-white px-8" disabled={createMutation.isPending} onClick={() => createMutation.mutate({ ...form, parentStopId: form.parentStopId === 'none' ? null : form.parentStopId, aliases: form.aliases.split(',').map(s => s.trim()).filter(s => s.length > 0), coordinates: (form.lat && form.lng) ? { lat: Number(form.lat), lng: Number(form.lng) } : undefined })}>
                {createMutation.isPending && <Loader2 className="mr-2 w-4 h-4 animate-spin" />} Register Stop
              </Button>
            </DialogFooter>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      <BulkImportStopsModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        onSuccess={() => qc.invalidateQueries({ queryKey: ["stops"] })}
      />

      <Dialog open={!!editStop} onOpenChange={() => setEditStop(null)}>
        <DialogContent aria-describedby={undefined} className="sm:max-w-[500px] rounded-2xl border-none shadow-2xl p-0 overflow-hidden">
          <div className="bg-[#121212] p-6 border-b border-white/5 text-white"><DialogHeader><DialogTitle className="text-base font-bold text-white flex items-center gap-2"><div className="p-1.5 bg-white/10 rounded-lg"><Pencil className="w-3.5 h-3.5" /></div>Edit Stop</DialogTitle></DialogHeader>
            <p className="text-white/50 text-xs mt-1 ml-8">Code is permanent — other fields are editable.</p>
          </div>
          <div className="p-6 space-y-4 bg-[#0a0a0a]">
            <div className="px-3 py-2 rounded-lg bg-white/5 border flex gap-2 items-center"><p className="text-[10px] text-white/50 font-bold uppercase tracking-widest">Code (read-only)</p><p className="font-bold text-[#D3D925]">{editStop?.code || "—"}</p></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Name</Label><Input className="h-10 rounded-xl font-bold" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Type</Label>
                <Select value={editForm.type} onValueChange={v => setEditForm(f => ({ ...f, type: v }))}><SelectTrigger className="h-10 rounded-xl font-bold"><SelectValue /></SelectTrigger><SelectContent className="rounded-xl"><SelectItem value="CITY">City</SelectItem><SelectItem value="JUNCTION">Junction</SelectItem><SelectItem value="TOWN">Town</SelectItem><SelectItem value="HIGHWAY_STOP">Highway Stop</SelectItem><SelectItem value="BORDER">Border</SelectItem></SelectContent></Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Province</Label><Input className="h-10 rounded-xl font-bold" value={editForm.province} onChange={e => setEditForm(f => ({ ...f, province: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label className="text-[10px] font-bold uppercase tracking-widest text-white/50">District</Label><Input list="district-list" className="h-10 rounded-xl font-bold" value={editForm.district} onChange={e => setEditForm(f => ({ ...f, district: e.target.value }))} /></div>
            </div>
            <div className="space-y-1.5"><Label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Municipality</Label><Input list="municipality-list" className="h-10 rounded-xl font-bold" value={editForm.municipality} onChange={e => setEditForm(f => ({ ...f, municipality: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Aliases (Comma Separated)</Label><Input className="h-10 rounded-xl font-bold" value={editForm.aliases} onChange={e => setEditForm(f => ({ ...f, aliases: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-2">
                 <div className="space-y-1.5"><Label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Latitude</Label><Input type="number" className="h-10 rounded-xl font-bold" value={editForm.lat} onChange={e => setEditForm(f => ({ ...f, lat: e.target.value }))} /></div>
                 <div className="space-y-1.5"><Label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Longitude</Label><Input type="number" className="h-10 rounded-xl font-bold" value={editForm.lng} onChange={e => setEditForm(f => ({ ...f, lng: e.target.value }))} /></div>
              </div>
            </div>
            <div className="border-t border-white/10 pt-4 mt-2">
              <p className="text-xs font-bold text-white/50 mb-3 uppercase tracking-widest">Capabilities</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold text-white">Searchable Place</Label>
                    <p className="text-[10px] text-white/50">Appears in search</p>
                  </div>
                  <Switch checked={editForm.isSearchable} onCheckedChange={(c) => setEditForm(f => ({ ...f, isSearchable: c }))} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold text-white">Route Stop</Label>
                    <p className="text-[10px] text-white/50">Used physically</p>
                  </div>
                  <Switch checked={editForm.isRouteStop} onCheckedChange={(c) => setEditForm(f => ({ ...f, isRouteStop: c }))} />
                </div>
              </div>
              {editForm.isRouteStop && (
                <div className="mt-4 space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Parent Stop (Optional)</Label>
                  <Select value={editForm.parentStopId} onValueChange={(v) => setEditForm(f => ({ ...f, parentStopId: v }))}>
                    <SelectTrigger className="h-11 rounded-xl font-bold bg-[#121212] border-white/10 text-white">
                      <SelectValue placeholder="Select broad searchable place..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl bg-[#121212] border-white/10 text-white">
                      <SelectItem value="none" className="text-white/50">None</SelectItem>
                      {stops.filter((s: any) => s.isSearchable && s._id !== editStop?._id).map((s: any) => (
                        <SelectItem key={s._id} value={s._id}>{s.name} ({s.code || s.district})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="p-6 pt-0 bg-[#0a0a0a] gap-2">
            <Button variant="outline" onClick={() => setEditStop(null)} className="font-bold rounded-xl h-10">Cancel</Button>
            <Button className="h-10 rounded-xl font-bold bg-[#121212] hover:bg-white/10 text-white px-6" disabled={editMutation.isPending} onClick={() => editMutation.mutate({ id: editStop._id, payload: { ...editForm, parentStopId: editForm.parentStopId === 'none' ? null : editForm.parentStopId, aliases: editForm.aliases ? editForm.aliases.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0) : [], coordinates: (editForm.lat !== "" || editForm.lng !== "") ? { lat: Number(editForm.lat) || null, lng: Number(editForm.lng) || null } : { lat: null, lng: null } } })}>
              {editMutation.isPending && <Loader2 className="mr-2 w-3.5 h-3.5 animate-spin" />} Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent aria-describedby={undefined} className="sm:max-w-[400px] rounded-2xl border-none shadow-2xl p-0 overflow-hidden">
          <div className="bg-[#121212] p-6 text-white text-center border-b border-white/5">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <DialogTitle className="text-lg font-bold mb-1">Delete Stop Node</DialogTitle>
            <p className="text-white/50 text-sm">Are you sure you want to delete {deleteTarget?.name}?</p>
          </div>
          <DialogFooter className="p-6 bg-[#0a0a0a] gap-2 sm:justify-center flex-row">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} className="font-bold rounded-xl h-11 w-full sm:w-auto">Cancel</Button>
            <Button variant="destructive" onClick={() => deleteMutation.mutate(deleteTarget._id)} className="font-bold rounded-xl h-11 w-full sm:w-auto px-8" disabled={deleteMutation.isPending}>{deleteMutation.isPending && <Loader2 className="mr-2 w-4 h-4 animate-spin" />}Delete Permanently</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Accordion Tree View */}
      <div className="rounded-2xl border bg-[#121212]/20 backdrop-blur-sm p-4 space-y-4">
        {isLoading ? (
          <div className="h-32 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#D3D925]/40" /></div>
        ) : filtered.length === 0 ? (
          <div className="h-32 flex items-center justify-center text-white/50 text-sm">{search ? `No stops matching "${search}"` : "No stops in registry."}</div>
        ) : (
          Object.keys(tree).sort().map(pKey => (
            <div key={pKey} className="border border-white/10 rounded-xl overflow-hidden bg-white/[0.01]">
              <button 
                onClick={() => toggleExpand('p-'+pKey)} 
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-white/5 transition-colors border-b border-white/5"
              >
                {expanded['p-'+pKey] ? <ChevronDown className="w-4 h-4 text-white/50" /> : <ChevronRight className="w-4 h-4 text-white/50" />}
                <MapPin className="w-4 h-4 text-[#D3D925]" />
                <span className="font-bold text-sm tracking-wide uppercase">{pKey}</span>
              </button>
              {expanded['p-'+pKey] && (
                <div className="pl-6 pr-3 py-2 space-y-2 bg-black/20">
                  {Object.keys(tree[pKey]).sort().map(dKey => (
                    <div key={dKey} className="border border-white/5 rounded-lg overflow-hidden">
                      <button 
                        onClick={() => toggleExpand('d-'+pKey+'-'+dKey)} 
                        className="w-full flex items-center gap-2 p-2.5 text-left hover:bg-white/5 transition-colors border-b border-white/5"
                      >
                        {expanded['d-'+pKey+'-'+dKey] ? <ChevronDown className="w-4 h-4 text-white/50" /> : <ChevronRight className="w-4 h-4 text-white/50" />}
                        <span className="font-semibold text-sm text-white/90">{dKey} District</span>
                      </button>
                      {expanded['d-'+pKey+'-'+dKey] && (
                        <div className="pl-6 pr-2 py-2 space-y-2 bg-black/40">
                          {Object.keys(tree[pKey][dKey]).sort().map(mKey => (
                            <div key={mKey} className="border border-white/5 rounded-lg overflow-hidden bg-[#0a0a0a]">
                              <button 
                                onClick={() => toggleExpand('m-'+pKey+'-'+dKey+'-'+mKey)} 
                                className="w-full flex items-center gap-2 p-2 text-left hover:bg-white/5 transition-colors border-b border-white/5"
                              >
                                {expanded['m-'+pKey+'-'+dKey+'-'+mKey] ? <ChevronDown className="w-3.5 h-3.5 text-white/40" /> : <ChevronRight className="w-3.5 h-3.5 text-white/40" />}
                                <span className="font-medium text-xs text-white/80">{mKey}</span>
                                <span className="ml-auto text-[10px] text-white/40 font-bold bg-white/5 px-1.5 py-0.5 rounded">{tree[pKey][dKey][mKey].length}</span>
                              </button>
                              {expanded['m-'+pKey+'-'+dKey+'-'+mKey] && (
                                <div className="p-2 space-y-1">
                                  {tree[pKey][dKey][mKey].map((s: any) => (
                                    <div key={s._id} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] group transition-colors">
                                      <div className="flex items-center gap-3">
                                        <Badge variant="outline" className="text-[10px] font-bold text-[#D3D925] border-[#D3D925]/20 bg-[#D3D925]/10">{s.code || "—"}</Badge>
                                        <span className="font-bold text-sm">{s.name}</span>
                                        <Badge variant="secondary" className="text-[9px] font-bold uppercase ml-2">{s.type}</Badge>
                                        {s.isSearchable && <Badge variant="outline" className="text-[9px] font-bold uppercase border-blue-500/30 text-blue-400 bg-blue-500/10 ml-2">Searchable</Badge>}
                                        {s.isRouteStop && <Badge variant="outline" className="text-[9px] font-bold uppercase border-orange-500/30 text-orange-400 bg-orange-500/10 ml-2">Route Stop</Badge>}
                                      </div>
                                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => { setEditStop(s); setEditForm({ name: s.name, type: s.type, province: s.province || "", district: s.district || "", municipality: s.municipality || "", aliases: (s.aliases || []).join(", "), lat: s.coordinates?.lat?.toString() || "", lng: s.coordinates?.lng?.toString() || "", isSearchable: s.isSearchable ?? true, isRouteStop: s.isRouteStop ?? false, parentStopId: s.parentStopId || "none" }); }} className="w-7 h-7 rounded-lg border border-white/10 bg-black flex items-center justify-center hover:bg-white/10 transition-all"><Pencil className="w-3 h-3" /></button>
                                        <button onClick={() => setDeleteTarget(s)} className="w-7 h-7 rounded-lg border border-white/10 bg-black flex items-center justify-center hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive transition-all"><Trash2 className="w-3 h-3" /></button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <datalist id="district-list">
        {(uniqueDistricts as string[]).map((d) => (
          <option key={d} value={d} />
        ))}
      </datalist>
      <datalist id="municipality-list">
        {(uniqueMunicipalities as string[]).map((m) => (
          <option key={m} value={m} />
        ))}
      </datalist>
    </div>
  );
};


// ── Layer 1+2: Corridor & Variant Tab ────────────────────────────────────────

// Inline sub-component: shows variants for a corridor row
const CorridorVariants = ({ corridor, onAddVariant, onMapStops, onEditVariant, onDeleteVariant }: any) => {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["variants", corridor._id],
    queryFn: () => getVariantsByCorridor(corridor._id),
  });
  const variants = data?.data || [];
  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      {isLoading && <Loader2 className="w-3 h-3 animate-spin text-white/50" />}
      {variants.length === 0 && !isLoading && (
        <span className="text-[10px] text-white/50 italic">No paths yet —</span>
      )}
      {variants.map((v: any) => (
        <div key={v._id} className="flex items-center gap-0.5 group/chip">
          <button onClick={() => onMapStops(v)}
            className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded-l-lg bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 transition-all">
            <ListOrdered className="w-3 h-3" />{v.name.replace(/ \(Return\)/i, "").replace(/ \(Forward\)/i, "")}
          </button>
          <button onClick={() => onEditVariant(v)} className="h-[26px] px-1.5 bg-white/5 border-y border-white/10 text-white/70 hover:bg-white/10 transition-all"><Pencil className="w-2.5 h-2.5" /></button>
          <button onClick={() => onDeleteVariant(v)} className="h-[26px] px-1.5 bg-white/5 border border-l-0 border-white/10 rounded-r-lg text-white/70 hover:bg-white/5 hover:text-white hover:border-white/10 transition-all"><Trash2 className="w-2.5 h-2.5" /></button>
        </div>
      ))}
      <button onClick={onAddVariant}
        className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded-lg border border-dashed border-[#D3D925]/30 text-[#D3D925] hover:bg-[#D3D925]/10 transition-all">
        <Plus className="w-3 h-3" /> Add Path
      </button>
    </div>
  );
};

const CorridorTab = () => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ originCode: "", destinationCode: "", isSymmetric: true, notes: "" });
  const [variantModal, setVariantModal] = useState<{ open: boolean; corridor: any | null }>({ open: false, corridor: null });
  const [stopsModal, setStopsModal] = useState<{ open: boolean; variant: any | null }>({ open: false, variant: null });
  const [editCorridor, setEditCorridor] = useState<any | null>(null);
  const [editCorridorForm, setEditCorridorForm] = useState({ notes: "", isSymmetric: true });
  const [deleteCorridor, setDeleteCorridor] = useState<any | null>(null);
  const [editVariant, setEditVariant] = useState<any | null>(null);
  const [editVariantForm, setEditVariantForm] = useState({ name: "", type: "STANDARD", distanceKm: "", durationMinutes: "" });
  const [deleteVariant, setDeleteVariant] = useState<any | null>(null);

  const { data: stopsData } = useQuery({ queryKey: ["stops"], queryFn: getAllStops });
  const { data, isLoading } = useQuery({ queryKey: ["corridors"], queryFn: getAllCorridors });
  const corridors = data?.data || [];
  const stops = stopsData?.data || [];

  const mutation = useMutation({
    mutationFn: createCorridor,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["corridors"] }); toast.success("Corridor registered."); setOpen(false); setForm({ originCode: "", destinationCode: "", isSymmetric: true, notes: "" }); },
    onError: (e: any) => toast.error(e.response?.data?.message || e.message),
  });

  const editCorridorMutation = useMutation({
    mutationFn: ({ id, payload }: any) => updateCorridor(id, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["corridors"] }); toast.success("Corridor updated."); setEditCorridor(null); },
    onError: (e: any) => toast.error(e.response?.data?.message || e.message),
  });

  const deleteCorridorMutation = useMutation({
    mutationFn: (id: string) => deleteCorridor(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["corridors"] }); toast.success("Corridor deleted."); setDeleteCorridor(null); },
    onError: (e: any) => { toast.error(e.response?.data?.message || e.message); setDeleteCorridor(null); },
  });

  const editVariantMutation = useMutation({
    mutationFn: ({ id, payload }: any) => updateVariant(id, payload),
    onSuccess: (_, vars) => { qc.invalidateQueries({ queryKey: ["variants"] }); toast.success("Variant updated."); setEditVariant(null); },
    onError: (e: any) => toast.error(e.response?.data?.message || e.message),
  });

  const deleteVariantMutation = useMutation({
    mutationFn: (id: string) => deleteVariant(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["variants"] }); toast.success("Variant deleted."); setDeleteVariant(null); },
    onError: (e: any) => { toast.error(e.response?.data?.message || e.message); setDeleteVariant(null); },
  });

  return (
    <>
      <div className="space-y-5">
      <div className="flex justify-between items-center">
        <p className="text-sm text-white/50 font-medium max-w-lg">
          Declared city-to-city corridors. These are the <strong>logical edges</strong> of your route graph. Variants (Via X) are added inside each corridor.
        </p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 font-bold rounded-xl h-11 px-6" disabled={stops.length < 2}>
              <Plus className="w-4 h-4" /> Declare Corridor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[440px] rounded-2xl border-none shadow-2xl p-0 overflow-hidden">
            <div className="bg-[#121212] p-7 border-b border-white/5 text-white">
              <DialogHeader><DialogTitle className="text-lg font-bold text-white flex items-center gap-2.5"><div className="p-1.5 bg-white/10 rounded-lg"><Globe className="w-4 h-4 text-white"/></div>Declare Route Corridor</DialogTitle></DialogHeader>
              <p className="text-white/50 text-sm font-medium mt-1.5 ml-9">Define a city-to-city corridor from the Stop Registry.</p>
            </div>
            <div className="p-8 space-y-5 bg-[#0a0a0a]">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Origin Stop</Label>
                <Select value={form.originCode} onValueChange={v => setForm({ ...form, originCode: v })}>
                  <SelectTrigger className="h-11 rounded-xl font-bold"><SelectValue placeholder="Select origin city" /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {stops.map((s: any) => <SelectItem key={s.code} value={s.code}>{s.name} ({s.code})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Destination Stop</Label>
                <Select value={form.destinationCode} onValueChange={v => setForm({ ...form, destinationCode: v })}>
                  <SelectTrigger className="h-11 rounded-xl font-bold"><SelectValue placeholder="Select destination city" /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {stops.filter((s: any) => s.code !== form.originCode).map((s: any) => <SelectItem key={s.code} value={s.code}>{s.name} ({s.code})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Notes (optional)</Label>
                <Input placeholder="e.g. Primary highway corridor" className="h-11 rounded-xl" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>
            <DialogFooter className="p-8 pt-0 bg-[#0a0a0a]">
              <Button className="w-full h-12 rounded-2xl font-bold bg-[#D3D925] text-black hover:bg-[#D9CD25]" disabled={mutation.isPending || !form.originCode || !form.destinationCode} onClick={() => mutation.mutate(form)}>
                {mutation.isPending && <Loader2 className="mr-2 w-4 h-4 animate-spin" />} Register Corridor
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {stops.length < 2 && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-bold">
          ⚠️ Add at least 2 stops in the Stop Registry before declaring corridors.
        </div>
      )}

      <div className="rounded-2xl border overflow-hidden bg-[#121212]/20 backdrop-blur-sm">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="hover:bg-transparent border-b border-white/5">
              <TableHead className="font-bold text-xs uppercase tracking-wider">Code</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider">Corridor</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider">Type</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider">Variants / Paths</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="h-32 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-[#D3D925]/40" /></TableCell></TableRow>
            ) : corridors.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="h-32 text-center text-white/50 text-sm">No corridors declared yet.</TableCell></TableRow>
            ) : corridors.map((c: any) => (
              <TableRow key={c._id} className="border-b border-white/5 group">
                <TableCell><Badge variant="outline" className="font-bold text-white/90 border-white/10 bg-white/5">{c.code}</Badge></TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">{c.originId?.name}</span>
                    <ArrowRight className="w-3 h-3 text-white/50" />
                    <span className="font-bold text-sm">{c.destinationId?.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={c.isSymmetric ? "default" : "secondary"} className="text-[10px] font-bold">
                    {c.isSymmetric ? "↔ Bidirectional" : "→ One-way"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <CorridorVariants
                    corridor={c}
                    onAddVariant={() => setVariantModal({ open: true, corridor: c })}
                    onMapStops={(v: any) => setStopsModal({ open: true, variant: v })}
                    onEditVariant={(v: any) => { setEditVariant(v); setEditVariantForm({ name: v.name, type: v.type, distanceKm: v.distanceKm || "", durationMinutes: v.durationMinutes || "" }); }}
                    onDeleteVariant={(v: any) => setDeleteVariant(v)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditCorridor(c); setEditCorridorForm({ notes: c.notes || "", isSymmetric: c.isSymmetric }); }} className="w-7 h-7 rounded-lg border border-white/10 bg-[#0a0a0a] flex items-center justify-center hover:bg-white/5 transition-all"><Pencil className="w-3 h-3" /></button>
                    <button onClick={() => setDeleteCorridor(c)} className="w-7 h-7 rounded-lg border border-white/10 bg-[#0a0a0a] flex items-center justify-center hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive transition-all"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>

    {/* Edit Corridor Modal */}
    <Dialog open={!!editCorridor} onOpenChange={() => setEditCorridor(null)}>
      <DialogContent className="sm:max-w-[380px] rounded-2xl border-none shadow-2xl p-0 overflow-hidden">
        <div className="bg-[#121212] p-6 border-b border-white/5 text-white"><DialogHeader><DialogTitle className="text-base font-bold text-white flex items-center gap-2"><Pencil className="w-4 h-4" />Edit Corridor</DialogTitle></DialogHeader>
          <p className="text-white/50 text-xs mt-1">Code, origin, and destination are immutable.</p>
        </div>
        <div className="p-6 space-y-4 bg-[#0a0a0a]">
          <div className="px-3 py-2 rounded-lg bg-white/5 border font-bold text-sm text-white/90">{editCorridor?.code}</div>
          <div className="space-y-1.5"><Label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Notes</Label><Input className="h-10 rounded-xl" value={editCorridorForm.notes} onChange={e => setEditCorridorForm(f => ({ ...f, notes: e.target.value }))} /></div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.04] border">
            <input type="checkbox" id="sym" checked={editCorridorForm.isSymmetric} onChange={e => setEditCorridorForm(f => ({ ...f, isSymmetric: e.target.checked }))} className="w-4 h-4 rounded" />
            <label htmlFor="sym" className="text-sm font-bold cursor-pointer">Bidirectional corridor</label>
          </div>
        </div>
        <DialogFooter className="p-6 pt-0 bg-[#0a0a0a] gap-2">
          <Button variant="outline" onClick={() => setEditCorridor(null)} className="font-bold rounded-xl h-10">Cancel</Button>
          <Button className="h-10 rounded-xl font-bold bg-[#121212] hover:bg-white/10 text-white px-6" disabled={editCorridorMutation.isPending} onClick={() => editCorridorMutation.mutate({ id: editCorridor._id, payload: editCorridorForm })}>
            {editCorridorMutation.isPending && <Loader2 className="mr-2 w-3.5 h-3.5 animate-spin" />} Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Delete Corridor Modal */}
    <Dialog open={!!deleteCorridor} onOpenChange={() => setDeleteCorridor(null)}>
      <DialogContent className="sm:max-w-[360px] rounded-2xl p-0 overflow-hidden border-none shadow-2xl">
        <div className="bg-[#121212] p-6 border-b border-white/10 text-white"><DialogHeader><DialogTitle className="text-base font-bold text-white flex items-center gap-2"><Trash2 className="w-4 h-4" />Delete Corridor</DialogTitle></DialogHeader></div>
        <div className="p-6 bg-[#0a0a0a] space-y-2">
          <p className="text-sm font-medium">Delete <strong>{deleteCorridor?.code}</strong>?</p>
          <p className="text-xs text-white/50">Blocked if fleets are assigned or route sequences exist.</p>
        </div>
        <DialogFooter className="p-6 pt-0 bg-[#0a0a0a] gap-2">
          <Button variant="outline" onClick={() => setDeleteCorridor(null)} className="font-bold rounded-xl h-10">Cancel</Button>
          <Button variant="destructive" className="h-10 rounded-xl font-bold px-6" disabled={deleteCorridorMutation.isPending} onClick={() => deleteCorridorMutation.mutate(deleteCorridor._id)}>
            {deleteCorridorMutation.isPending && <Loader2 className="mr-2 w-3.5 h-3.5 animate-spin" />} Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Edit Variant Modal */}
    <Dialog open={!!editVariant} onOpenChange={() => setEditVariant(null)}>
      <DialogContent className="sm:max-w-[380px] rounded-2xl border-none shadow-2xl p-0 overflow-hidden">
        <div className="bg-[#121212] p-6 border-b border-white/5 text-white"><DialogHeader><DialogTitle className="text-base font-bold text-white flex items-center gap-2"><Pencil className="w-4 h-4" />Edit Variant</DialogTitle></DialogHeader></div>
        <div className="p-6 space-y-4 bg-[#0a0a0a]">
          <div className="space-y-1.5"><Label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Name</Label><Input className="h-10 rounded-xl font-bold" value={editVariantForm.name} onChange={e => setEditVariantForm(f => ({ ...f, name: e.target.value }))} /></div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5 col-span-1"><Label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Type</Label>
              <Select value={editVariantForm.type} onValueChange={v => setEditVariantForm(f => ({ ...f, type: v }))}><SelectTrigger className="h-10 rounded-xl font-bold text-xs"><SelectValue /></SelectTrigger><SelectContent className="rounded-xl">{["STANDARD","HIGHWAY","EXPRESSWAY","MOUNTAIN","LOCAL"].map(t => <SelectItem key={t} value={t}>{t[0]+t.slice(1).toLowerCase()}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="space-y-1.5"><Label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Km</Label><Input type="number" className="h-10 rounded-xl font-bold" value={editVariantForm.distanceKm} onChange={e => setEditVariantForm(f => ({ ...f, distanceKm: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Min</Label><Input type="number" className="h-10 rounded-xl font-bold" value={editVariantForm.durationMinutes} onChange={e => setEditVariantForm(f => ({ ...f, durationMinutes: e.target.value }))} /></div>
          </div>
        </div>
        <DialogFooter className="p-6 pt-0 bg-[#0a0a0a] gap-2">
          <Button variant="outline" onClick={() => setEditVariant(null)} className="font-bold rounded-xl h-10">Cancel</Button>
          <Button className="h-10 rounded-xl font-bold bg-[#D3D925] hover:bg-[#D9CD25] text-black text-white px-6" disabled={editVariantMutation.isPending} onClick={() => editVariantMutation.mutate({ id: editVariant._id, payload: { name: editVariantForm.name, type: editVariantForm.type, distanceKm: editVariantForm.distanceKm ? Number(editVariantForm.distanceKm) : undefined, durationMinutes: editVariantForm.durationMinutes ? Number(editVariantForm.durationMinutes) : undefined } })}>
            {editVariantMutation.isPending && <Loader2 className="mr-2 w-3.5 h-3.5 animate-spin" />} Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Delete Variant Modal */}
    <Dialog open={!!deleteVariant} onOpenChange={() => setDeleteVariant(null)}>
      <DialogContent className="sm:max-w-[340px] rounded-2xl p-0 overflow-hidden border-none shadow-2xl">
        <div className="bg-[#121212] p-6 border-b border-white/10 text-white"><DialogHeader><DialogTitle className="text-base font-bold text-white flex items-center gap-2"><Trash2 className="w-4 h-4" />Delete Variant</DialogTitle></DialogHeader></div>
        <div className="p-6 bg-[#0a0a0a]"><p className="text-sm font-medium">Delete variant <strong>{deleteVariant?.name}</strong>? Its stop sequence will also be removed.</p></div>
        <DialogFooter className="p-6 pt-0 bg-[#0a0a0a] gap-2">
          <Button variant="outline" onClick={() => setDeleteVariant(null)} className="font-bold rounded-xl h-10">Cancel</Button>
          <Button variant="destructive" className="h-10 rounded-xl font-bold px-6" disabled={deleteVariantMutation.isPending} onClick={() => deleteVariantMutation.mutate(deleteVariant._id)}>
            {deleteVariantMutation.isPending && <Loader2 className="mr-2 w-3.5 h-3.5 animate-spin" />} Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {variantModal.corridor && (
      <CreateVariantModal corridor={variantModal.corridor} open={variantModal.open} onClose={() => setVariantModal({ open: false, corridor: null })} />
    )}
    {stopsModal.variant && (
      <MapStopsModal variant={stopsModal.variant} open={stopsModal.open} onClose={() => setStopsModal({ open: false, variant: null })} />
    )}
  </>
  );
};


// ── Layer 5: Boarding Hubs Tab (multi-hub per stop) ────────────────────────────────────
const BoardingPointsTab = () => {
  const qc = useQueryClient();
  const [selectedStop, setSelectedStop] = useState<any | null>(null);
  const [stopSearch, setStopSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ pointName: "", landmark: "", type: "BOTH" });
  const [editPoint, setEditPoint] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({ pointName: "", landmark: "", type: "BOTH" });
  const [deletePoint, setDeletePoint] = useState<any | null>(null);

  const { data: stopsData } = useQuery({ queryKey: ["stops"], queryFn: getAllStops });
  const allStops = stopsData?.data || [];
  const stops = useMemo(() => allStops.filter((s: any) =>
    s.name.toLowerCase().includes(stopSearch.toLowerCase()) || s.code.toLowerCase().includes(stopSearch.toLowerCase())
  ), [allStops, stopSearch]);

  const { data, isLoading } = useQuery({
    queryKey: ["boarding-points", selectedStop?.code],
    queryFn: () => getBoardingPointsByStop(selectedStop.code),
    enabled: !!selectedStop,
  });
  const points = data?.data || [];

  const createMutation = useMutation({
    mutationFn: createRegistryBoardingPoint,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["boarding-points", selectedStop?.code] }); toast.success(`Hub added to ${selectedStop?.name}`); setForm({ pointName: "", landmark: "", type: "BOTH" }); setAddOpen(false); },
    onError: (e: any) => toast.error(e.response?.data?.message || e.message),
  });

  const editMutation = useMutation({
    mutationFn: ({ id, payload }: any) => updateRegistryBoardingPoint(id, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["boarding-points", selectedStop?.code] }); toast.success("Hub updated."); setEditPoint(null); },
    onError: (e: any) => toast.error(e.response?.data?.message || e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteRegistryBoardingPoint(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["boarding-points", selectedStop?.code] }); toast.success("Hub deleted."); setDeletePoint(null); },
    onError: (e: any) => { toast.error(e.response?.data?.message || e.message); setDeletePoint(null); },
  });

  const typeCls = (type: string) =>
    type === "BOARDING" ? "bg-white/5 text-white/70 border-white/10"
    : type === "DROPPING" ? "bg-white/5 text-white border-white/10"
    : "bg-white/5 text-white/30 border-white/10";

  return (
    <div className="flex gap-5 h-[560px]">
      {/* Left: Stop list with search */}
      <div className="w-56 flex flex-col border rounded-2xl overflow-hidden bg-[#0a0a0a] shrink-0">
        <div className="px-3 py-3 bg-white/[0.02] border-b space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Stop Registry</p>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-white/50" />
            <Input placeholder="Search..." className="pl-7 h-7 rounded-lg text-xs" value={stopSearch} onChange={e => setStopSearch(e.target.value)} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {stops.length === 0 && <p className="text-[11px] text-white/50 italic p-3">{stopSearch ? "No matches" : "No stops yet."}</p>}
          {stops.map((s: any) => (
            <button key={s.code} onClick={() => { setSelectedStop(s); setAddOpen(false); setEditPoint(null); }}
              className={`w-full text-left px-3 py-2.5 rounded-lg transition-all border ${selectedStop?.code === s.code ? "bg-[#121212] border-b border-white/5 text-white border-white/20" : "border-transparent hover:bg-white/5/60"}`}>
              <p className={`text-xs font-bold truncate ${selectedStop?.code === s.code ? "text-white" : ""}`}>{s.name}</p>
              <p className={`text-[9px] uppercase mt-0.5 ${selectedStop?.code === s.code ? "text-white/50" : "text-white/50"}`}>{s.code} · {s.type}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Right: Hub management */}
      <div className="flex-1 flex flex-col border rounded-2xl overflow-hidden bg-[#0a0a0a] min-w-0">
        {!selectedStop ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-white/50 p-8">
            <MapPin className="w-10 h-10 mb-3 opacity-15" />
            <p className="text-sm font-bold">Select a stop</p>
            <p className="text-xs mt-1 opacity-60">Choose a city from the left to manage its boarding hubs</p>
          </div>
        ) : (
          <>
            <div className="px-5 py-4 border-b bg-white/[0.02] flex items-center justify-between shrink-0">
              <div>
                <p className="font-bold text-sm">{selectedStop.name}</p>
                <p className="text-[10px] text-white/50 uppercase">{selectedStop.code} · {points.length} hub{points.length !== 1 ? "s" : ""}</p>
              </div>
              <Button size="sm" onClick={() => { setAddOpen(v => !v); setEditPoint(null); }}
                className={`gap-1.5 h-8 text-xs font-bold rounded-xl ${addOpen ? "bg-white/5 text-white hover:bg-white/5/80 border" : "bg-[#121212] border-b border-white/5 text-white hover:bg-white/10"}`}>
                <Plus className="w-3.5 h-3.5" />{addOpen ? "Cancel" : "Add Hub"}
              </Button>
            </div>

            {addOpen && (
              <div className="px-5 py-4 border-b bg-white/[0.02] shrink-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-3">New Hub · {selectedStop.name}</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 space-y-1"><Label className="text-[9px] font-bold uppercase tracking-widest text-white/50">Hub Name</Label><Input placeholder="e.g. Kalanki Bus Park" className="h-9 rounded-lg font-bold text-sm" value={form.pointName} onChange={e => setForm({ ...form, pointName: e.target.value })} /></div>
                  <div className="space-y-1"><Label className="text-[9px] font-bold uppercase tracking-widest text-white/50">Purpose</Label>
                    <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}><SelectTrigger className="h-9 rounded-lg font-bold text-sm"><SelectValue /></SelectTrigger><SelectContent className="rounded-xl"><SelectItem value="BOARDING">Boarding</SelectItem><SelectItem value="DROPPING">Dropping</SelectItem><SelectItem value="BOTH">Both</SelectItem></SelectContent></Select>
                  </div>
                  <div className="col-span-2 space-y-1"><Label className="text-[9px] font-bold uppercase tracking-widest text-white/50">Landmark (optional)</Label><Input placeholder="Near Kalanki Chowk" className="h-9 rounded-lg text-sm" value={form.landmark} onChange={e => setForm({ ...form, landmark: e.target.value })} /></div>
                  <div className="flex items-end"><Button className="w-full h-9 rounded-lg font-bold text-sm bg-[#121212] hover:bg-white/10 text-white" disabled={createMutation.isPending || !form.pointName} onClick={() => createMutation.mutate({ stopCode: selectedStop.code, ...form })}>{createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add"}</Button></div>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {isLoading && <div className="flex items-center justify-center h-24"><Loader2 className="w-5 h-5 animate-spin text-white/50/30" /></div>}
              {!isLoading && points.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center text-white/50">
                  <MapPin className="w-8 h-8 mb-2 opacity-15" />
                  <p className="text-sm font-bold">No hubs registered</p>
                  <p className="text-xs mt-1 opacity-60">Click "Add Hub" to register the first boarding point</p>
                </div>
              )}
              {!isLoading && points.map((p: any, i: number) => (
                <div key={p._id}>
                  {editPoint?._id === p._id ? (
                    <div className="p-3 rounded-xl border-2 border-[#D3D925]/30 bg-[#D3D925]/10 space-y-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#D3D925]">Editing Hub #{i + 1}</p>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2 space-y-1"><Label className="text-[9px] font-bold uppercase tracking-widest text-white/50">Name</Label><Input className="h-8 rounded-lg text-sm font-bold" value={editForm.pointName} onChange={e => setEditForm(f => ({ ...f, pointName: e.target.value }))} /></div>
                        <div className="space-y-1"><Label className="text-[9px] font-bold uppercase tracking-widest text-white/50">Type</Label><Select value={editForm.type} onValueChange={v => setEditForm(f => ({ ...f, type: v }))}><SelectTrigger className="h-8 rounded-lg text-xs font-bold"><SelectValue /></SelectTrigger><SelectContent className="rounded-xl"><SelectItem value="BOARDING">Boarding</SelectItem><SelectItem value="DROPPING">Dropping</SelectItem><SelectItem value="BOTH">Both</SelectItem></SelectContent></Select></div>
                        <div className="col-span-2 space-y-1"><Label className="text-[9px] font-bold uppercase tracking-widest text-white/50">Landmark</Label><Input className="h-8 rounded-lg text-sm" value={editForm.landmark} onChange={e => setEditForm(f => ({ ...f, landmark: e.target.value }))} /></div>
                        <div className="flex gap-1 items-end">
                          <Button size="sm" className="flex-1 h-8 rounded-lg font-bold text-xs bg-[#121212] hover:bg-white/10 text-white" disabled={editMutation.isPending} onClick={() => editMutation.mutate({ id: p._id, payload: editForm })}>{editMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}</Button>
                          <Button size="sm" variant="outline" className="h-8 rounded-lg" onClick={() => setEditPoint(null)}><X className="w-3 h-3" /></Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-[#0a0a0a] hover:bg-white/[0.02] transition-all group/hub">
                      <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-white/5 text-white/50 text-[10px] font-bold shrink-0">{i + 1}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{p.pointName}</p>
                        {p.landmark && <p className="text-[10px] text-white/50 mt-0.5">{p.landmark}</p>}
                      </div>
                      <Badge variant="outline" className={`text-[9px] font-bold shrink-0 ${typeCls(p.type)}`}>{p.type === "BOTH" ? "UNIVERSAL" : p.type}</Badge>
                      <div className="flex items-center gap-1 opacity-0 group-hover/hub:opacity-100 transition-opacity shrink-0">
                        <button onClick={() => { setEditPoint(p); setEditForm({ pointName: p.pointName, landmark: p.landmark || "", type: p.type }); setAddOpen(false); }} className="w-6 h-6 rounded-md border border-white/10 flex items-center justify-center hover:bg-white/5 transition-all"><Pencil className="w-3 h-3" /></button>
                        <button onClick={() => setDeletePoint(p)} className="w-6 h-6 rounded-md border border-white/10 flex items-center justify-center hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Delete Hub Confirm */}
      <Dialog open={!!deletePoint} onOpenChange={() => setDeletePoint(null)}>
        <DialogContent className="sm:max-w-[320px] rounded-2xl p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-white/5 p-5 text-white"><DialogHeader><DialogTitle className="text-sm font-bold text-white flex items-center gap-2"><Trash2 className="w-4 h-4" />Remove Hub</DialogTitle></DialogHeader></div>
          <div className="p-5 bg-[#0a0a0a]"><p className="text-sm font-medium">Remove <strong>{deletePoint?.pointName}</strong>?</p></div>
          <DialogFooter className="p-5 pt-0 bg-[#0a0a0a] gap-2">
            <Button variant="outline" onClick={() => setDeletePoint(null)} className="font-bold rounded-xl h-9 text-sm">Cancel</Button>
            <Button variant="destructive" className="h-9 rounded-xl font-bold px-5 text-sm" disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate(deletePoint._id)}>{deleteMutation.isPending && <Loader2 className="mr-1.5 w-3 h-3 animate-spin" />}Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────

const PlatformRegistry = () => {
  const { data: routeReqData } = useQuery({
    queryKey: ["routeRequests", "PENDING"],
    queryFn: () => getAllRouteRequests("PENDING"),
    staleTime: 30_000,
  });
  const pendingRouteRequests = routeReqData?.results || 0;

  return (
  <div className="container mx-auto pb-12 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
    <div className="flex items-center gap-5">
      <div className="p-4 rounded-[1.5rem] bg-[#D3D925] shadow-2xl shadow-[#D3D925]/20 text-black">
        <Database className="w-9 h-9" />
      </div>
      <div>
        <h1 className="text-5xl font-bold tracking-tighter">Platform Registry</h1>
        <p className="text-white/50 font-bold uppercase tracking-widest text-xs mt-1">5-Layer Infrastructure System</p>
      </div>
    </div>

    <div className="p-5 rounded-2xl bg-[#D3D925]/10 border border-[#D3D925]/10 text-sm font-medium text-white/50">
      <strong className="text-white">Build Order:</strong> Start with <strong>Stop Registry</strong> → then <strong>Corridors</strong> → then <strong>Boarding Hubs</strong>. Each layer depends on the one before it.
    </div>

    <Tabs defaultValue="stops" className="w-full">
      <TabsList className="inline-flex h-auto p-2 bg-white/5 rounded-[2rem] border border-white/5 mb-8 gap-1">
        <TabsTrigger value="stops" className="flex items-center gap-2 px-8 py-3.5 text-sm font-bold rounded-2xl data-[state=active]:bg-[#0a0a0a] data-[state=active]:text-[#D3D925] data-[state=active]:shadow-xl border border-transparent">
          <MapPin className="w-4 h-4" /> Stop Registry
        </TabsTrigger>
        <TabsTrigger value="corridors" className="flex items-center gap-2 px-8 py-3.5 text-sm font-bold rounded-2xl data-[state=active]:bg-[#0a0a0a] data-[state=active]:text-[#D3D925] data-[state=active]:shadow-xl border border-transparent">
          <Globe className="w-4 h-4" /> Corridors
        </TabsTrigger>
        <TabsTrigger value="hubs" className="flex items-center gap-2 px-8 py-3.5 text-sm font-bold rounded-2xl data-[state=active]:bg-[#0a0a0a] data-[state=active]:text-[#D3D925] data-[state=active]:shadow-xl border border-transparent">
          <Sparkles className="w-4 h-4" /> Boarding Hubs
        </TabsTrigger>
        <TabsTrigger value="route-requests" className="flex items-center gap-2 px-8 py-3.5 text-sm font-bold rounded-2xl data-[state=active]:bg-[#0a0a0a] data-[state=active]:text-[#D3D925] data-[state=active]:shadow-xl border border-transparent">
          <Route className="w-4 h-4" /> Route Requests
          {pendingRouteRequests > 0 && (
            <span className="ml-1 bg-white/5 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
              {pendingRouteRequests}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="discovery" className="flex items-center gap-2 px-8 py-3.5 text-sm font-bold rounded-2xl data-[state=active]:bg-[#0a0a0a] data-[state=active]:text-[#D3D925] data-[state=active]:shadow-xl border border-transparent">
          <Navigation className="w-4 h-4" /> Discovery
        </TabsTrigger>
      </TabsList>

      <Card className="border-none shadow-[0_20px_60px_rgba(0,0,0,0.06)] border-white/5 bg-[#121212]/30 backdrop-blur-md shadow-xl rounded-[2.5rem] overflow-hidden">
        <CardHeader className="border-b border-white/5 bg-white/5 pb-4">
          <CardTitle className="flex items-center gap-2 text-white">Infrastructure Control</CardTitle>
          <CardDescription className="font-medium">Platform-level route graph management.</CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <TabsContent value="stops" className="mt-0 animate-in fade-in duration-300">
            <StopRegistryTab />
          </TabsContent>
          <TabsContent value="corridors" className="mt-0 animate-in fade-in duration-300">
            <CorridorTab />
          </TabsContent>
          <TabsContent value="hubs" className="mt-0 animate-in fade-in duration-300">
            <BoardingPointsTab />
          </TabsContent>
          <TabsContent value="route-requests" className="mt-0 animate-in fade-in duration-300">
            <RouteRequestsPanel />
          </TabsContent>
          <TabsContent value="discovery" className="mt-0 animate-in fade-in duration-300">
            <DiscoveryTab />
          </TabsContent>
        </CardContent>
      </Card>
    </Tabs>
  </div>
  );
};

export default PlatformRegistry;
