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
import { Badge } from "@/components/ui/badge";
import { Plus, Loader2, Database, MapPin, Globe, ArrowRight, Sparkles, ListOrdered, Route, Pencil, Trash2, Search, X, Upload, AlertTriangle, CheckCircle2, FileJson, ChevronRight, SkipForward } from "lucide-react";
import { toast } from "sonner";
import { createStop, getAllStops, updateStop, deleteStop, createCorridor, getAllCorridors, updateCorridor, deleteCorridor, getVariantsByCorridor, updateVariant, deleteVariant, createRegistryBoardingPoint, getBoardingPointsByStop, updateRegistryBoardingPoint, deleteRegistryBoardingPoint, getAllRouteRequests, previewBulkStops, bulkImportStops } from "@/api/platformRegistryApi";
import { CreateVariantModal, MapStopsModal } from "./VariantModals";
import RouteRequestsPanel from "./RouteRequestsPanel";
import { cn } from "@/lib/utils";

// ── Bulk Import Modal ───────────────────────────────────────────────────────────────────

const EXAMPLE_JSON = `[
  { "code": "KTM", "name": "Kathmandu", "type": "CITY", "state": "Bagmati" },
  { "code": "PKR", "name": "Pokhara", "type": "CITY", "state": "Gandaki" },
  { "code": "HTD", "name": "Hetauda", "type": "CITY", "state": "Bagmati" }
]`;

type ScanReport = {
  toInsert: any[];
  duplicateCode: any[];
  duplicateName: any[];
  invalid: any[];
  summary: { total: number; new: number; skippedCode: number; skippedName: number; invalid: number };
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
        <div className="bg-slate-900 px-7 py-6 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/10 shrink-0">
              <FileJson className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-base font-black text-white mb-0.5">Bulk Import Stops via JSON</DialogTitle>
              <p className="text-slate-400 text-xs font-medium">Paste a JSON array — the system scans for duplicates before writing anything.</p>
            </div>
            {/* Step indicator */}
            <div className="flex items-center gap-2 shrink-0">
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black transition-all ${
                step === "paste" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-white/5 text-slate-500"
              }`}><span>1</span><span className="hidden sm:inline">Paste</span></div>
              <ChevronRight className="w-3 h-3 text-slate-600" />
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black transition-all ${
                step === "preview" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-white/5 text-slate-500"
              }`}><span>2</span><span className="hidden sm:inline">Preview</span></div>
            </div>
          </div>
        </div>

        {/* Step 1: Paste JSON */}
        {step === "paste" && (
          <div className="p-6 space-y-4 bg-background">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">JSON Array</Label>
                <button
                  onClick={() => setJsonText(EXAMPLE_JSON)}
                  className="text-[10px] font-bold text-primary hover:underline"
                >Load example</button>
              </div>
              <textarea
                id="bulk-stops-json-input"
                className={`w-full h-52 p-4 rounded-xl border font-mono text-xs resize-none bg-muted/30 focus:outline-none focus:ring-2 transition-all ${
                  parseError ? "border-destructive/60 focus:ring-destructive/30" : "border-border focus:ring-primary/30"
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
            <div className="rounded-xl border border-border/50 p-4 bg-muted/20 space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Expected Format</p>
              <div className="grid grid-cols-4 gap-2 text-xs">
                {[{f:"code",r:"Required",e:'"KTM"'},{f:"name",r:"Required",e:'"Kathmandu"'},{f:"type",r:"Optional",e:'"CITY"'},{f:"state",r:"Optional",e:'"Bagmati"'},{f:"aliases",r:"Optional",e:'["Kantipur"]'}].map(col => (
                  <div key={col.f} className="space-y-0.5">
                    <p className="font-black text-foreground">{col.f}</p>
                    <p className={`text-[10px] font-bold ${col.r === "Required" ? "text-orange-500" : "text-muted-foreground"}`}>{col.r}</p>
                    <p className="text-muted-foreground font-mono">{col.e}</p>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground">type must be one of: CITY · JUNCTION · TOWN · BORDER &nbsp;&nbsp;|&nbsp;&nbsp; aliases can be array of strings &nbsp;&nbsp;|&nbsp;&nbsp; max 500 stops per batch</p>
            </div>

            <div className="flex gap-3 pt-1">
              <Button variant="outline" onClick={handleClose} className="font-bold rounded-xl h-11 flex-1">Cancel</Button>
              <Button
                id="scan-json-btn"
                className="h-11 flex-1 rounded-xl font-black bg-slate-900 hover:bg-slate-800 text-white gap-2"
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
          <div className="flex flex-col bg-background" style={{ maxHeight: "70vh" }}>
            {/* Summary cards */}
            <div className="px-6 pt-5 pb-4 grid grid-cols-4 gap-3 shrink-0">
              {[
                { label: "Total", val: report.summary.total, cls: "bg-muted/40 border-border/50 text-foreground" },
                { label: "New ✅", val: report.summary.new, cls: "bg-emerald-50 border-emerald-200 text-emerald-700" },
                { label: "Skipped ⚠️", val: report.summary.skippedCode + report.summary.skippedName, cls: "bg-amber-50 border-amber-200 text-amber-700" },
                { label: "Invalid ❌", val: report.summary.invalid, cls: "bg-red-50 border-red-200 text-red-600" },
              ].map(card => (
                <div key={card.label} className={`rounded-xl border px-3 py-2.5 text-center ${card.cls}`}>
                  <p className="text-xl font-black">{card.val}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider mt-0.5 opacity-70">{card.label}</p>
                </div>
              ))}
            </div>

            {report.summary.new === 0 && (
              <div className="mx-6 mb-4 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-2 shrink-0">
                <SkipForward className="w-4 h-4 text-amber-600 shrink-0" />
                <p className="text-xs font-bold text-amber-700">All entries already exist in the registry — nothing to import.</p>
              </div>
            )}

            {/* Scrollable table */}
            <div className="flex-1 overflow-y-auto px-6 pb-2 space-y-3" style={{ minHeight: 0 }}>
              {/* New stops */}
              {report.toInsert.length > 0 && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1.5 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {report.toInsert.length} New — will be added
                  </p>
                  <div className="rounded-xl border border-emerald-200 overflow-hidden">
                    <table className="w-full text-xs">
                      <thead><tr className="bg-emerald-50">
                        <th className="px-3 py-2 text-left font-black text-emerald-700">Code</th>
                        <th className="px-3 py-2 text-left font-black text-emerald-700">Name</th>
                        <th className="px-3 py-2 text-left font-black text-emerald-700">Type</th>
                        <th className="px-3 py-2 text-left font-black text-emerald-700">Province</th>
                      </tr></thead>
                      <tbody>
                        {report.toInsert.map((s: any, i: number) => (
                          <tr key={i} className="border-t border-emerald-100">
                            <td className="px-3 py-2 font-black font-mono text-emerald-700">{s.code}</td>
                            <td className="px-3 py-2 font-bold">{s.name}</td>
                            <td className="px-3 py-2 text-muted-foreground">{s.type}</td>
                            <td className="px-3 py-2 text-muted-foreground">{s.state || "—"}</td>
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
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-1.5 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" /> {report.duplicateCode.length} Duplicate Code — skipped
                  </p>
                  <div className="rounded-xl border border-amber-200 overflow-hidden">
                    <table className="w-full text-xs">
                      <thead><tr className="bg-amber-50">
                        <th className="px-3 py-2 text-left font-black text-amber-700">Code</th>
                        <th className="px-3 py-2 text-left font-black text-amber-700">Your Name</th>
                        <th className="px-3 py-2 text-left font-black text-amber-700">Existing Name</th>
                      </tr></thead>
                      <tbody>
                        {report.duplicateCode.map((s: any, i: number) => (
                          <tr key={i} className="border-t border-amber-100">
                            <td className="px-3 py-2 font-black font-mono text-amber-700">{s.code}</td>
                            <td className="px-3 py-2 font-bold">{s.name}</td>
                            <td className="px-3 py-2 text-muted-foreground">{s.existingName}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Duplicate names */}
              {report.duplicateName.length > 0 && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-1.5 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" /> {report.duplicateName.length} Duplicate Name — skipped
                  </p>
                  <div className="rounded-xl border border-amber-200 overflow-hidden">
                    <table className="w-full text-xs">
                      <thead><tr className="bg-amber-50">
                        <th className="px-3 py-2 text-left font-black text-amber-700">Code</th>
                        <th className="px-3 py-2 text-left font-black text-amber-700">Name</th>
                        <th className="px-3 py-2 text-left font-black text-amber-700">Existing Code</th>
                      </tr></thead>
                      <tbody>
                        {report.duplicateName.map((s: any, i: number) => (
                          <tr key={i} className="border-t border-amber-100">
                            <td className="px-3 py-2 font-black font-mono text-amber-700">{s.code}</td>
                            <td className="px-3 py-2 font-bold">{s.name}</td>
                            <td className="px-3 py-2 text-muted-foreground font-mono">{s.existingCode}</td>
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
                  <p className="text-[10px] font-black uppercase tracking-widest text-red-600 mb-1.5 flex items-center gap-1.5">
                    <X className="w-3.5 h-3.5" /> {report.invalid.length} Invalid — skipped
                  </p>
                  <div className="rounded-xl border border-red-200 overflow-hidden">
                    <table className="w-full text-xs">
                      <thead><tr className="bg-red-50">
                        <th className="px-3 py-2 text-left font-black text-red-600">Error</th>
                      </tr></thead>
                      <tbody>
                        {report.invalid.map((e: any, i: number) => (
                          <tr key={i} className="border-t border-red-100">
                            <td className="px-3 py-2 text-red-600">{e.error}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="px-6 py-4 border-t bg-muted/10 flex gap-3 shrink-0">
              <Button variant="outline" onClick={() => setStep("paste")} className="font-bold rounded-xl h-11">
                ← Back
              </Button>
              <Button
                id="confirm-bulk-import-btn"
                className="h-11 flex-1 rounded-xl font-black bg-emerald-600 hover:bg-emerald-700 text-white gap-2 disabled:opacity-50"
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
  const [editForm, setEditForm] = useState({ name: "", type: "CITY", state: "", aliases: "" });
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [form, setForm] = useState({ code: "", name: "", type: "CITY", state: "", aliases: "" });

  const { data, isLoading } = useQuery({ queryKey: ["stops"], queryFn: getAllStops });
  const stops = data?.data || [];

  const filtered = useMemo(() =>
    stops.filter((s: any) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase())
    ), [stops, search]);

  const createMutation = useMutation({
    mutationFn: createStop,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["stops"] }); toast.success("Stop added."); setOpen(false); setForm({ code: "", name: "", type: "CITY", state: "", aliases: "" }); },
    onError: (e: any) => toast.error(e.response?.data?.message || e.message),
  });

  const editMutation = useMutation({
    mutationFn: ({ id, payload }: any) => updateStop(id, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["stops"] }); toast.success("Stop updated."); setEditStop(null); },
    onError: (e: any) => toast.error(e.response?.data?.message || e.message),
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search stops..." className="pl-9 h-10 rounded-xl" value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-3.5 h-3.5 text-muted-foreground" /></button>}
        </div>
        <div className="flex items-center gap-2">
          {/* Bulk Import Button */}
          <Button
            id="bulk-import-stops-btn"
            variant="outline"
            onClick={() => setBulkOpen(true)}
            className="gap-2 font-bold rounded-xl h-10 px-4 border-dashed hover:bg-primary/5 hover:border-primary/40 hover:text-primary transition-all"
          >
            <FileJson className="w-4 h-4" />
            <span className="hidden sm:inline">Bulk Import</span>
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 font-bold rounded-xl h-10 px-5"><Plus className="w-4 h-4" /> Add Stop</Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-[420px] rounded-2xl border-none shadow-2xl p-0 overflow-hidden">
            <div className="bg-slate-900 p-7 text-white">
              <DialogHeader><DialogTitle className="text-lg font-black text-white flex items-center gap-2.5"><div className="p-1.5 bg-white/10 rounded-lg"><MapPin className="w-4 h-4 text-white" /></div>Register Stop Node</DialogTitle></DialogHeader>
              <p className="text-slate-400 text-sm font-medium mt-1.5 ml-9">Add a city or junction to the global registry.</p>
            </div>
            <div className="p-7 space-y-4 bg-background">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Short Code</Label><Input placeholder="KTM" className="h-11 rounded-xl font-black uppercase" value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} /></div>
                <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Full Name</Label><Input placeholder="Kathmandu" className="h-11 rounded-xl font-bold" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Type</Label>
                  <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}><SelectTrigger className="h-11 rounded-xl font-bold"><SelectValue /></SelectTrigger><SelectContent className="rounded-xl"><SelectItem value="CITY">City</SelectItem><SelectItem value="JUNCTION">Junction</SelectItem><SelectItem value="TOWN">Town</SelectItem><SelectItem value="BORDER">Border</SelectItem></SelectContent></Select>
                </div>
                <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Province</Label><Input placeholder="Bagmati" className="h-11 rounded-xl font-bold" value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} /></div>
              </div>
              <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Aliases (Comma Separated)</Label><Input placeholder="Kantipur, Yen" className="h-11 rounded-xl font-bold" value={form.aliases} onChange={e => setForm({ ...form, aliases: e.target.value })} /></div>
            </div>
            <DialogFooter className="p-7 pt-0 bg-background gap-3">
              <Button variant="outline" onClick={() => setOpen(false)} className="font-bold rounded-xl h-11">Cancel</Button>
              <Button className="h-11 rounded-xl font-black bg-slate-900 hover:bg-slate-800 text-white px-8" disabled={createMutation.isPending} onClick={() => createMutation.mutate({ ...form, aliases: form.aliases.split(',').map(s => s.trim()).filter(s => s.length > 0) })}>
                {createMutation.isPending && <Loader2 className="mr-2 w-4 h-4 animate-spin" />} Register Stop
              </Button>
            </DialogFooter>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Bulk Import Modal */}
      <BulkImportStopsModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        onSuccess={() => qc.invalidateQueries({ queryKey: ["stops"] })}
      />

      {/* Edit Stop Modal */}
      <Dialog open={!!editStop} onOpenChange={() => setEditStop(null)}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl border-none shadow-2xl p-0 overflow-hidden">
          <div className="bg-slate-900 p-6 text-white"><DialogHeader><DialogTitle className="text-base font-black text-white flex items-center gap-2"><div className="p-1.5 bg-white/10 rounded-lg"><Pencil className="w-3.5 h-3.5" /></div>Edit Stop</DialogTitle></DialogHeader>
            <p className="text-slate-400 text-xs mt-1 ml-8">Code is permanent — only name, type, and province are editable.</p>
          </div>
          <div className="p-6 space-y-4 bg-background">
            <div className="px-3 py-2 rounded-lg bg-muted/50 border"><p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Code (read-only)</p><p className="font-black text-primary font-mono">{editStop?.code}</p></div>
            <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Name</Label><Input className="h-10 rounded-xl font-bold" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Type</Label>
                <Select value={editForm.type} onValueChange={v => setEditForm(f => ({ ...f, type: v }))}><SelectTrigger className="h-10 rounded-xl font-bold"><SelectValue /></SelectTrigger><SelectContent className="rounded-xl"><SelectItem value="CITY">City</SelectItem><SelectItem value="JUNCTION">Junction</SelectItem><SelectItem value="TOWN">Town</SelectItem><SelectItem value="BORDER">Border</SelectItem></SelectContent></Select>
              </div>
              <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Province</Label><Input className="h-10 rounded-xl font-bold" value={editForm.state} onChange={e => setEditForm(f => ({ ...f, state: e.target.value }))} /></div>
            </div>
            <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Aliases (Comma Separated)</Label><Input className="h-10 rounded-xl font-bold" value={editForm.aliases} onChange={e => setEditForm(f => ({ ...f, aliases: e.target.value }))} /></div>
          </div>
          <DialogFooter className="p-6 pt-0 bg-background gap-2">
            <Button variant="outline" onClick={() => setEditStop(null)} className="font-bold rounded-xl h-10">Cancel</Button>
            <Button className="h-10 rounded-xl font-black bg-slate-900 hover:bg-slate-800 text-white px-6" disabled={editMutation.isPending} onClick={() => editMutation.mutate({ id: editStop._id, payload: { ...editForm, aliases: editForm.aliases.split(',').map(s => s.trim()).filter(s => s.length > 0) } })}>
              {editMutation.isPending && <Loader2 className="mr-2 w-3.5 h-3.5 animate-spin" />} Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-[360px] rounded-2xl p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-rose-600 p-6 text-white"><DialogHeader><DialogTitle className="text-base font-black text-white flex items-center gap-2"><Trash2 className="w-4 h-4" />Remove Stop</DialogTitle></DialogHeader></div>
          <div className="p-6 space-y-3 bg-background">
            <p className="text-sm font-medium">Remove <strong>{deleteTarget?.name}</strong> ({deleteTarget?.code}) from the registry?</p>
            <p className="text-xs text-muted-foreground">If this stop is used in any route sequences, deletion will be blocked.</p>
          </div>
          <DialogFooter className="p-6 pt-0 bg-background gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} className="font-bold rounded-xl h-10">Cancel</Button>
            <Button variant="destructive" className="h-10 rounded-xl font-black px-6" disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate(deleteTarget._id)}>
              {deleteMutation.isPending && <Loader2 className="mr-2 w-3.5 h-3.5 animate-spin" />} Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="rounded-2xl border overflow-hidden bg-background/50">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="hover:bg-transparent border-b border-border/50">
              <TableHead className="font-black text-xs uppercase tracking-wider">Code</TableHead>
              <TableHead className="font-black text-xs uppercase tracking-wider">Name</TableHead>
              <TableHead className="font-black text-xs uppercase tracking-wider">Type</TableHead>
              <TableHead className="font-black text-xs uppercase tracking-wider">Province</TableHead>
              <TableHead className="font-black text-xs uppercase tracking-wider w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="h-32 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary/40" /></TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="h-32 text-center text-muted-foreground text-sm">{search ? `No stops matching "${search}"` : "No stops in registry."}</TableCell></TableRow>
            ) : filtered.map((s: any) => (
              <TableRow key={s._id} className="border-b border-border/40 group">
                <TableCell><Badge variant="outline" className="font-black text-primary border-primary/20 bg-primary/5">{s.code}</Badge></TableCell>
                <TableCell className="font-bold">{s.name}</TableCell>
                <TableCell><Badge variant="secondary" className="text-[10px] font-black uppercase">{s.type}</Badge></TableCell>
                <TableCell className="text-muted-foreground text-sm">{s.state || "—"}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditStop(s); setEditForm({ name: s.name, type: s.type, state: s.state || "", aliases: (s.aliases || []).join(", ") }); }} className="w-7 h-7 rounded-lg border border-border/60 bg-background flex items-center justify-center hover:bg-muted transition-all"><Pencil className="w-3 h-3" /></button>
                    <button onClick={() => setDeleteTarget(s)} className="w-7 h-7 rounded-lg border border-border/60 bg-background flex items-center justify-center hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive transition-all"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
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
      {isLoading && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
      {variants.length === 0 && !isLoading && (
        <span className="text-[10px] text-muted-foreground italic">No paths yet —</span>
      )}
      {variants.map((v: any) => (
        <div key={v._id} className="flex items-center gap-0.5 group/chip">
          <button onClick={() => onMapStops(v)}
            className="flex items-center gap-1 px-2 py-1 text-[10px] font-black rounded-l-lg bg-violet-50 border border-violet-200 text-violet-700 hover:bg-violet-100 transition-all">
            <ListOrdered className="w-3 h-3" />{v.name.replace(/ \(Return\)/i, "").replace(/ \(Forward\)/i, "")}
          </button>
          <button onClick={() => onEditVariant(v)} className="h-[26px] px-1.5 bg-violet-50 border-y border-violet-200 text-violet-500 hover:bg-violet-100 transition-all"><Pencil className="w-2.5 h-2.5" /></button>
          <button onClick={() => onDeleteVariant(v)} className="h-[26px] px-1.5 bg-violet-50 border border-l-0 border-violet-200 rounded-r-lg text-violet-400 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200 transition-all"><Trash2 className="w-2.5 h-2.5" /></button>
        </div>
      ))}
      <button onClick={onAddVariant}
        className="flex items-center gap-1 px-2 py-1 text-[10px] font-black rounded-lg border border-dashed border-primary/30 text-primary hover:bg-primary/5 transition-all">
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
        <p className="text-sm text-muted-foreground font-medium max-w-lg">
          Declared city-to-city corridors. These are the <strong>logical edges</strong> of your route graph. Variants (Via X) are added inside each corridor.
        </p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 font-bold rounded-xl h-11 px-6" disabled={stops.length < 2}>
              <Plus className="w-4 h-4" /> Declare Corridor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[440px] rounded-2xl border-none shadow-2xl p-0 overflow-hidden">
            <div className="bg-slate-900 p-7 text-white">
              <DialogHeader><DialogTitle className="text-lg font-black text-white flex items-center gap-2.5"><div className="p-1.5 bg-white/10 rounded-lg"><Globe className="w-4 h-4 text-white"/></div>Declare Route Corridor</DialogTitle></DialogHeader>
              <p className="text-slate-400 text-sm font-medium mt-1.5 ml-9">Define a city-to-city corridor from the Stop Registry.</p>
            </div>
            <div className="p-8 space-y-5 bg-background">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Origin Stop</Label>
                <Select value={form.originCode} onValueChange={v => setForm({ ...form, originCode: v })}>
                  <SelectTrigger className="h-11 rounded-xl font-bold"><SelectValue placeholder="Select origin city" /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {stops.map((s: any) => <SelectItem key={s.code} value={s.code}>{s.name} ({s.code})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Destination Stop</Label>
                <Select value={form.destinationCode} onValueChange={v => setForm({ ...form, destinationCode: v })}>
                  <SelectTrigger className="h-11 rounded-xl font-bold"><SelectValue placeholder="Select destination city" /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {stops.filter((s: any) => s.code !== form.originCode).map((s: any) => <SelectItem key={s.code} value={s.code}>{s.name} ({s.code})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Notes (optional)</Label>
                <Input placeholder="e.g. Primary highway corridor" className="h-11 rounded-xl" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>
            <DialogFooter className="p-8 pt-0 bg-background">
              <Button className="w-full h-12 rounded-2xl font-black bg-indigo-600 hover:bg-indigo-700" disabled={mutation.isPending || !form.originCode || !form.destinationCode} onClick={() => mutation.mutate(form)}>
                {mutation.isPending && <Loader2 className="mr-2 w-4 h-4 animate-spin" />} Register Corridor
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {stops.length < 2 && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm font-bold">
          ⚠️ Add at least 2 stops in the Stop Registry before declaring corridors.
        </div>
      )}

      <div className="rounded-2xl border overflow-hidden bg-background/50">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="hover:bg-transparent border-b border-border/50">
              <TableHead className="font-black text-xs uppercase tracking-wider">Code</TableHead>
              <TableHead className="font-black text-xs uppercase tracking-wider">Corridor</TableHead>
              <TableHead className="font-black text-xs uppercase tracking-wider">Type</TableHead>
              <TableHead className="font-black text-xs uppercase tracking-wider">Variants / Paths</TableHead>
              <TableHead className="font-black text-xs uppercase tracking-wider w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="h-32 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary/40" /></TableCell></TableRow>
            ) : corridors.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="h-32 text-center text-muted-foreground text-sm">No corridors declared yet.</TableCell></TableRow>
            ) : corridors.map((c: any) => (
              <TableRow key={c._id} className="border-b border-border/40 group">
                <TableCell><Badge variant="outline" className="font-black font-mono text-indigo-600 border-indigo-200 bg-indigo-50">{c.code}</Badge></TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">{c.originId?.name}</span>
                    <ArrowRight className="w-3 h-3 text-muted-foreground" />
                    <span className="font-bold text-sm">{c.destinationId?.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={c.isSymmetric ? "default" : "secondary"} className="text-[10px] font-black">
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
                    <button onClick={() => { setEditCorridor(c); setEditCorridorForm({ notes: c.notes || "", isSymmetric: c.isSymmetric }); }} className="w-7 h-7 rounded-lg border border-border/60 bg-background flex items-center justify-center hover:bg-muted transition-all"><Pencil className="w-3 h-3" /></button>
                    <button onClick={() => setDeleteCorridor(c)} className="w-7 h-7 rounded-lg border border-border/60 bg-background flex items-center justify-center hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive transition-all"><Trash2 className="w-3 h-3" /></button>
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
        <div className="bg-slate-900 p-6 text-white"><DialogHeader><DialogTitle className="text-base font-black text-white flex items-center gap-2"><Pencil className="w-4 h-4" />Edit Corridor</DialogTitle></DialogHeader>
          <p className="text-slate-400 text-xs mt-1">Code, origin, and destination are immutable.</p>
        </div>
        <div className="p-6 space-y-4 bg-background">
          <div className="px-3 py-2 rounded-lg bg-muted/50 border font-mono font-black text-sm text-indigo-600">{editCorridor?.code}</div>
          <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Notes</Label><Input className="h-10 rounded-xl" value={editCorridorForm.notes} onChange={e => setEditCorridorForm(f => ({ ...f, notes: e.target.value }))} /></div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border">
            <input type="checkbox" id="sym" checked={editCorridorForm.isSymmetric} onChange={e => setEditCorridorForm(f => ({ ...f, isSymmetric: e.target.checked }))} className="w-4 h-4 rounded" />
            <label htmlFor="sym" className="text-sm font-bold cursor-pointer">Bidirectional corridor</label>
          </div>
        </div>
        <DialogFooter className="p-6 pt-0 bg-background gap-2">
          <Button variant="outline" onClick={() => setEditCorridor(null)} className="font-bold rounded-xl h-10">Cancel</Button>
          <Button className="h-10 rounded-xl font-black bg-slate-900 hover:bg-slate-800 text-white px-6" disabled={editCorridorMutation.isPending} onClick={() => editCorridorMutation.mutate({ id: editCorridor._id, payload: editCorridorForm })}>
            {editCorridorMutation.isPending && <Loader2 className="mr-2 w-3.5 h-3.5 animate-spin" />} Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Delete Corridor Modal */}
    <Dialog open={!!deleteCorridor} onOpenChange={() => setDeleteCorridor(null)}>
      <DialogContent className="sm:max-w-[360px] rounded-2xl p-0 overflow-hidden border-none shadow-2xl">
        <div className="bg-rose-600 p-6 text-white"><DialogHeader><DialogTitle className="text-base font-black text-white flex items-center gap-2"><Trash2 className="w-4 h-4" />Delete Corridor</DialogTitle></DialogHeader></div>
        <div className="p-6 bg-background space-y-2">
          <p className="text-sm font-medium">Delete <strong>{deleteCorridor?.code}</strong>?</p>
          <p className="text-xs text-muted-foreground">Blocked if fleets are assigned or route sequences exist.</p>
        </div>
        <DialogFooter className="p-6 pt-0 bg-background gap-2">
          <Button variant="outline" onClick={() => setDeleteCorridor(null)} className="font-bold rounded-xl h-10">Cancel</Button>
          <Button variant="destructive" className="h-10 rounded-xl font-black px-6" disabled={deleteCorridorMutation.isPending} onClick={() => deleteCorridorMutation.mutate(deleteCorridor._id)}>
            {deleteCorridorMutation.isPending && <Loader2 className="mr-2 w-3.5 h-3.5 animate-spin" />} Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Edit Variant Modal */}
    <Dialog open={!!editVariant} onOpenChange={() => setEditVariant(null)}>
      <DialogContent className="sm:max-w-[380px] rounded-2xl border-none shadow-2xl p-0 overflow-hidden">
        <div className="bg-violet-900 p-6 text-white"><DialogHeader><DialogTitle className="text-base font-black text-white flex items-center gap-2"><Pencil className="w-4 h-4" />Edit Variant</DialogTitle></DialogHeader></div>
        <div className="p-6 space-y-4 bg-background">
          <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Name</Label><Input className="h-10 rounded-xl font-bold" value={editVariantForm.name} onChange={e => setEditVariantForm(f => ({ ...f, name: e.target.value }))} /></div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5 col-span-1"><Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Type</Label>
              <Select value={editVariantForm.type} onValueChange={v => setEditVariantForm(f => ({ ...f, type: v }))}><SelectTrigger className="h-10 rounded-xl font-bold text-xs"><SelectValue /></SelectTrigger><SelectContent className="rounded-xl">{["STANDARD","HIGHWAY","EXPRESSWAY","MOUNTAIN","LOCAL"].map(t => <SelectItem key={t} value={t}>{t[0]+t.slice(1).toLowerCase()}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Km</Label><Input type="number" className="h-10 rounded-xl font-bold" value={editVariantForm.distanceKm} onChange={e => setEditVariantForm(f => ({ ...f, distanceKm: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Min</Label><Input type="number" className="h-10 rounded-xl font-bold" value={editVariantForm.durationMinutes} onChange={e => setEditVariantForm(f => ({ ...f, durationMinutes: e.target.value }))} /></div>
          </div>
        </div>
        <DialogFooter className="p-6 pt-0 bg-background gap-2">
          <Button variant="outline" onClick={() => setEditVariant(null)} className="font-bold rounded-xl h-10">Cancel</Button>
          <Button className="h-10 rounded-xl font-black bg-violet-700 hover:bg-violet-800 text-white px-6" disabled={editVariantMutation.isPending} onClick={() => editVariantMutation.mutate({ id: editVariant._id, payload: { name: editVariantForm.name, type: editVariantForm.type, distanceKm: editVariantForm.distanceKm ? Number(editVariantForm.distanceKm) : undefined, durationMinutes: editVariantForm.durationMinutes ? Number(editVariantForm.durationMinutes) : undefined } })}>
            {editVariantMutation.isPending && <Loader2 className="mr-2 w-3.5 h-3.5 animate-spin" />} Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Delete Variant Modal */}
    <Dialog open={!!deleteVariant} onOpenChange={() => setDeleteVariant(null)}>
      <DialogContent className="sm:max-w-[340px] rounded-2xl p-0 overflow-hidden border-none shadow-2xl">
        <div className="bg-rose-600 p-6 text-white"><DialogHeader><DialogTitle className="text-base font-black text-white flex items-center gap-2"><Trash2 className="w-4 h-4" />Delete Variant</DialogTitle></DialogHeader></div>
        <div className="p-6 bg-background"><p className="text-sm font-medium">Delete variant <strong>{deleteVariant?.name}</strong>? Its stop sequence will also be removed.</p></div>
        <DialogFooter className="p-6 pt-0 bg-background gap-2">
          <Button variant="outline" onClick={() => setDeleteVariant(null)} className="font-bold rounded-xl h-10">Cancel</Button>
          <Button variant="destructive" className="h-10 rounded-xl font-black px-6" disabled={deleteVariantMutation.isPending} onClick={() => deleteVariantMutation.mutate(deleteVariant._id)}>
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
    type === "BOARDING" ? "bg-blue-50 text-blue-700 border-blue-200"
    : type === "DROPPING" ? "bg-amber-50 text-amber-700 border-amber-200"
    : "bg-slate-50 text-slate-700 border-slate-200";

  return (
    <div className="flex gap-5 h-[560px]">
      {/* Left: Stop list with search */}
      <div className="w-56 flex flex-col border rounded-2xl overflow-hidden bg-background shrink-0">
        <div className="px-3 py-3 bg-muted/20 border-b space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Stop Registry</p>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
            <Input placeholder="Search..." className="pl-7 h-7 rounded-lg text-xs" value={stopSearch} onChange={e => setStopSearch(e.target.value)} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {stops.length === 0 && <p className="text-[11px] text-muted-foreground italic p-3">{stopSearch ? "No matches" : "No stops yet."}</p>}
          {stops.map((s: any) => (
            <button key={s.code} onClick={() => { setSelectedStop(s); setAddOpen(false); setEditPoint(null); }}
              className={`w-full text-left px-3 py-2.5 rounded-lg transition-all border ${selectedStop?.code === s.code ? "bg-slate-900 text-white border-slate-900" : "border-transparent hover:bg-muted/60"}`}>
              <p className={`text-xs font-bold truncate ${selectedStop?.code === s.code ? "text-white" : ""}`}>{s.name}</p>
              <p className={`text-[9px] font-mono uppercase mt-0.5 ${selectedStop?.code === s.code ? "text-slate-400" : "text-muted-foreground"}`}>{s.code} · {s.type}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Right: Hub management */}
      <div className="flex-1 flex flex-col border rounded-2xl overflow-hidden bg-background min-w-0">
        {!selectedStop ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground p-8">
            <MapPin className="w-10 h-10 mb-3 opacity-15" />
            <p className="text-sm font-bold">Select a stop</p>
            <p className="text-xs mt-1 opacity-60">Choose a city from the left to manage its boarding hubs</p>
          </div>
        ) : (
          <>
            <div className="px-5 py-4 border-b bg-muted/10 flex items-center justify-between shrink-0">
              <div>
                <p className="font-black text-sm">{selectedStop.name}</p>
                <p className="text-[10px] text-muted-foreground font-mono uppercase">{selectedStop.code} · {points.length} hub{points.length !== 1 ? "s" : ""}</p>
              </div>
              <Button size="sm" onClick={() => { setAddOpen(v => !v); setEditPoint(null); }}
                className={`gap-1.5 h-8 text-xs font-black rounded-xl ${addOpen ? "bg-muted text-foreground hover:bg-muted/80 border" : "bg-slate-900 text-white hover:bg-slate-800"}`}>
                <Plus className="w-3.5 h-3.5" />{addOpen ? "Cancel" : "Add Hub"}
              </Button>
            </div>

            {addOpen && (
              <div className="px-5 py-4 border-b bg-muted/20 shrink-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">New Hub · {selectedStop.name}</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 space-y-1"><Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Hub Name</Label><Input placeholder="e.g. Kalanki Bus Park" className="h-9 rounded-lg font-bold text-sm" value={form.pointName} onChange={e => setForm({ ...form, pointName: e.target.value })} /></div>
                  <div className="space-y-1"><Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Purpose</Label>
                    <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}><SelectTrigger className="h-9 rounded-lg font-bold text-sm"><SelectValue /></SelectTrigger><SelectContent className="rounded-xl"><SelectItem value="BOARDING">Boarding</SelectItem><SelectItem value="DROPPING">Dropping</SelectItem><SelectItem value="BOTH">Both</SelectItem></SelectContent></Select>
                  </div>
                  <div className="col-span-2 space-y-1"><Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Landmark (optional)</Label><Input placeholder="Near Kalanki Chowk" className="h-9 rounded-lg text-sm" value={form.landmark} onChange={e => setForm({ ...form, landmark: e.target.value })} /></div>
                  <div className="flex items-end"><Button className="w-full h-9 rounded-lg font-black text-sm bg-slate-900 hover:bg-slate-800 text-white" disabled={createMutation.isPending || !form.pointName} onClick={() => createMutation.mutate({ stopCode: selectedStop.code, ...form })}>{createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add"}</Button></div>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {isLoading && <div className="flex items-center justify-center h-24"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground/30" /></div>}
              {!isLoading && points.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                  <MapPin className="w-8 h-8 mb-2 opacity-15" />
                  <p className="text-sm font-bold">No hubs registered</p>
                  <p className="text-xs mt-1 opacity-60">Click "Add Hub" to register the first boarding point</p>
                </div>
              )}
              {!isLoading && points.map((p: any, i: number) => (
                <div key={p._id}>
                  {editPoint?._id === p._id ? (
                    <div className="p-3 rounded-xl border-2 border-primary/30 bg-primary/5 space-y-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary">Editing Hub #{i + 1}</p>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2 space-y-1"><Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Name</Label><Input className="h-8 rounded-lg text-sm font-bold" value={editForm.pointName} onChange={e => setEditForm(f => ({ ...f, pointName: e.target.value }))} /></div>
                        <div className="space-y-1"><Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Type</Label><Select value={editForm.type} onValueChange={v => setEditForm(f => ({ ...f, type: v }))}><SelectTrigger className="h-8 rounded-lg text-xs font-bold"><SelectValue /></SelectTrigger><SelectContent className="rounded-xl"><SelectItem value="BOARDING">Boarding</SelectItem><SelectItem value="DROPPING">Dropping</SelectItem><SelectItem value="BOTH">Both</SelectItem></SelectContent></Select></div>
                        <div className="col-span-2 space-y-1"><Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Landmark</Label><Input className="h-8 rounded-lg text-sm" value={editForm.landmark} onChange={e => setEditForm(f => ({ ...f, landmark: e.target.value }))} /></div>
                        <div className="flex gap-1 items-end">
                          <Button size="sm" className="flex-1 h-8 rounded-lg font-black text-xs bg-slate-900 hover:bg-slate-800 text-white" disabled={editMutation.isPending} onClick={() => editMutation.mutate({ id: p._id, payload: editForm })}>{editMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}</Button>
                          <Button size="sm" variant="outline" className="h-8 rounded-lg" onClick={() => setEditPoint(null)}><X className="w-3 h-3" /></Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-background hover:bg-muted/20 transition-all group/hub">
                      <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-muted text-muted-foreground text-[10px] font-black shrink-0">{i + 1}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{p.pointName}</p>
                        {p.landmark && <p className="text-[10px] text-muted-foreground mt-0.5">{p.landmark}</p>}
                      </div>
                      <Badge variant="outline" className={`text-[9px] font-black shrink-0 ${typeCls(p.type)}`}>{p.type === "BOTH" ? "UNIVERSAL" : p.type}</Badge>
                      <div className="flex items-center gap-1 opacity-0 group-hover/hub:opacity-100 transition-opacity shrink-0">
                        <button onClick={() => { setEditPoint(p); setEditForm({ pointName: p.pointName, landmark: p.landmark || "", type: p.type }); setAddOpen(false); }} className="w-6 h-6 rounded-md border border-border/60 flex items-center justify-center hover:bg-muted transition-all"><Pencil className="w-3 h-3" /></button>
                        <button onClick={() => setDeletePoint(p)} className="w-6 h-6 rounded-md border border-border/60 flex items-center justify-center hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all"><Trash2 className="w-3 h-3" /></button>
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
          <div className="bg-rose-600 p-5 text-white"><DialogHeader><DialogTitle className="text-sm font-black text-white flex items-center gap-2"><Trash2 className="w-4 h-4" />Remove Hub</DialogTitle></DialogHeader></div>
          <div className="p-5 bg-background"><p className="text-sm font-medium">Remove <strong>{deletePoint?.pointName}</strong>?</p></div>
          <DialogFooter className="p-5 pt-0 bg-background gap-2">
            <Button variant="outline" onClick={() => setDeletePoint(null)} className="font-bold rounded-xl h-9 text-sm">Cancel</Button>
            <Button variant="destructive" className="h-9 rounded-xl font-black px-5 text-sm" disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate(deletePoint._id)}>{deleteMutation.isPending && <Loader2 className="mr-1.5 w-3 h-3 animate-spin" />}Delete</Button>
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
      <div className="p-4 rounded-[1.5rem] bg-primary shadow-2xl shadow-primary/30 text-primary-foreground">
        <Database className="w-9 h-9" />
      </div>
      <div>
        <h1 className="text-5xl font-black tracking-tighter">Platform Registry</h1>
        <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs mt-1">5-Layer Infrastructure System</p>
      </div>
    </div>

    <div className="p-5 rounded-2xl bg-primary/5 border border-primary/10 text-sm font-medium text-muted-foreground">
      <strong className="text-foreground">Build Order:</strong> Start with <strong>Stop Registry</strong> → then <strong>Corridors</strong> → then <strong>Boarding Hubs</strong>. Each layer depends on the one before it.
    </div>

    <Tabs defaultValue="stops" className="w-full">
      <TabsList className="inline-flex h-auto p-2 bg-muted/40 rounded-[2rem] border border-border/50 mb-8 gap-1">
        <TabsTrigger value="stops" className="flex items-center gap-2 px-8 py-3.5 text-sm font-black rounded-2xl data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-xl border border-transparent">
          <MapPin className="w-4 h-4" /> Stop Registry
        </TabsTrigger>
        <TabsTrigger value="corridors" className="flex items-center gap-2 px-8 py-3.5 text-sm font-black rounded-2xl data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-xl border border-transparent">
          <Globe className="w-4 h-4" /> Corridors
        </TabsTrigger>
        <TabsTrigger value="hubs" className="flex items-center gap-2 px-8 py-3.5 text-sm font-black rounded-2xl data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-xl border border-transparent">
          <Sparkles className="w-4 h-4" /> Boarding Hubs
        </TabsTrigger>
        <TabsTrigger value="route-requests" className="flex items-center gap-2 px-8 py-3.5 text-sm font-black rounded-2xl data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-xl border border-transparent">
          <Route className="w-4 h-4" /> Route Requests
          {pendingRouteRequests > 0 && (
            <span className="ml-1 bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
              {pendingRouteRequests}
            </span>
          )}
        </TabsTrigger>
      </TabsList>

      <Card className="border-none shadow-[0_20px_60px_rgba(0,0,0,0.06)] bg-card/60 backdrop-blur-2xl rounded-[2.5rem] overflow-hidden">
        <CardHeader className="p-8 pb-4 border-b border-border/50 bg-muted/5">
          <CardTitle className="text-xl font-black">Infrastructure Control</CardTitle>
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
        </CardContent>
      </Card>
    </Tabs>
  </div>
  );
};

export default PlatformRegistry;
