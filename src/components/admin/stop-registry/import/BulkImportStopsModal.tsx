import React, { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Search, Loader2, Upload, AlertTriangle, CheckCircle2, X, SkipForward, FileJson } from "lucide-react";
import { toast } from "sonner";
import { previewBulkStops, bulkImportStops } from "@/api/platformRegistryApi";
import type { ScanReport, BulkStopItem, BulkStopError } from "../stopRegistryTypes";

const EXAMPLE_JSON = `[
  { "code": "KTM", "name": "Kathmandu", "type": "CITY", "province": "Bagmati", "district": "Kathmandu", "municipality": "Kathmandu Metropolitan" },
  { "code": "PKR", "name": "Pokhara", "type": "CITY", "province": "Gandaki", "district": "Kaski", "municipality": "Pokhara Metropolitan" },
  { "code": "HTD", "name": "Hetauda", "type": "CITY", "province": "Bagmati", "district": "Makwanpur", "municipality": "Hetauda Sub-Metropolitan" }
]`;

interface BulkImportStopsModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const BulkImportStopsModal: React.FC<BulkImportStopsModalProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<"paste" | "preview">("paste");
  const [jsonText, setJsonText] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [report, setReport] = useState<ScanReport | null>(null);
  const [scanning, setScanning] = useState(false);
  const [importing, setImporting] = useState(false);

  const reset = () => {
    setStep("paste");
    setJsonText("");
    setParseError(null);
    setReport(null);
    setScanning(false);
    setImporting(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleScan = async () => {
    setParseError(null);
    let parsed: unknown[];
    try {
      const result = JSON.parse(jsonText.trim());
      if (!Array.isArray(result)) throw new Error("Root value must be a JSON array [ ... ]");
      parsed = result;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setParseError(`JSON syntax error: ${msg}`);
      return;
    }
    setScanning(true);
    try {
      const res = await previewBulkStops(parsed as BulkStopItem[]);
      setReport(res.data);
      setStep("preview");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      toast.error(err.response?.data?.message || err.message || "Bulk preview failed");
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
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      toast.error(err.response?.data?.message || err.message || "Bulk import failed");
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[680px] rounded-2xl border-none shadow-2xl p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-[#121212] px-7 py-6 text-white border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/10 shrink-0">
              <FileJson className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Bulk Import Stops</h2>
              <p className="text-white/50 text-xs mt-0.5">
                Paste JSON array of stops — dry-run scan checks for duplicates before writing.
              </p>
            </div>
          </div>
        </div>

        {/* Step 1: Paste JSON */}
        {step === "paste" && (
          <div className="p-7 space-y-4 bg-[#0a0a0a]">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/50">
                JSON Array [ &#123; ... &#125; ]
              </label>
              <button
                type="button"
                onClick={() => setJsonText(EXAMPLE_JSON)}
                className="text-[11px] font-bold text-white hover:underline transition-all"
              >
                Load Example JSON
              </button>
            </div>

            <textarea
              id="bulk-json-input"
              rows={9}
              className="w-full font-mono text-xs p-4 rounded-xl bg-[#121212] border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 resize-none"
              placeholder={`[\n  { "code": "KTM", "name": "Kathmandu", "type": "CITY", "province": "Bagmati", "district": "Kathmandu", "municipality": "Kathmandu Metropolitan" }\n]`}
              value={jsonText}
              onChange={(e) => {
                setJsonText(e.target.value);
                setParseError(null);
              }}
            />

            {parseError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2">
                <X className="w-4 h-4 text-red-400 shrink-0" />
                <p className="text-xs text-red-300 font-medium">{parseError}</p>
              </div>
            )}

            <div className="rounded-xl border border-white/5 p-4 bg-white/[0.02] space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Expected Format</p>
              <div className="grid grid-cols-4 gap-2 text-xs">
                {[
                  { f: "code", r: "Optional", e: '"KTM"' },
                  { f: "name", r: "Required", e: '"Kathmandu"' },
                  { f: "type", r: "Optional", e: '"CITY"' },
                  { f: "province", r: "Optional", e: '"Bagmati"' },
                ].map((col) => (
                  <div key={col.f} className="space-y-0.5">
                    <p className="font-bold text-white">{col.f}</p>
                    <p className={`text-[10px] font-bold ${col.r === "Required" ? "text-white" : "text-white/50"}`}>
                      {col.r}
                    </p>
                    <p className="text-white/50">{col.e}</p>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-white/50">
                type must be one of: CITY · JUNCTION · TOWN · HIGHWAY_STOP · BORDER &nbsp;&nbsp;|&nbsp;&nbsp; aliases can be array of strings &nbsp;&nbsp;|&nbsp;&nbsp; max 500 stops per batch
              </p>
            </div>

            <div className="flex gap-3 pt-1">
              <Button variant="outline" onClick={handleClose} className="font-bold rounded-xl h-11 flex-1">
                Cancel
              </Button>
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
                {
                  label: "Skipped ⚠️",
                  val: report.summary.skippedCode + report.summary.skippedIdentity + report.summary.skippedBatch,
                  cls: "bg-white/5 border-white/10 text-white",
                },
                { label: "Invalid ❌", val: report.summary.invalid, cls: "bg-white/5 border-white/10 text-white" },
              ].map((card) => (
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
                      <thead>
                        <tr className="bg-[#D3D925]/10">
                          <th className="px-3 py-2 text-left font-bold text-white/90">Code</th>
                          <th className="px-3 py-2 text-left font-bold text-white/90">Name</th>
                          <th className="px-3 py-2 text-left font-bold text-white/90">Type</th>
                          <th className="px-3 py-2 text-left font-bold text-white/90">Province</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.toInsert.map((s: BulkStopItem, i: number) => (
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
                      <thead>
                        <tr className="bg-white/5">
                          <th className="px-3 py-2 text-left font-bold text-white">Row</th>
                          <th className="px-3 py-2 text-left font-bold text-white">Code</th>
                          <th className="px-3 py-2 text-left font-bold text-white">Your Name</th>
                          <th className="px-3 py-2 text-left font-bold text-white">Context</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.duplicateCode.map((s: BulkStopItem, i: number) => (
                          <tr key={i} className="border-t border-white/10">
                            <td className="px-3 py-2 text-white/50">
                              {s._sourceIndex !== undefined ? s._sourceIndex + 1 : "-"}
                            </td>
                            <td className="px-3 py-2 font-bold text-white">{s.code}</td>
                            <td className="px-3 py-2 font-bold">{s.name}</td>
                            <td className="px-3 py-2 text-white/50">
                              {[s.district, s.municipality].filter(Boolean).join(", ")}
                            </td>
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
                      <thead>
                        <tr className="bg-white/5">
                          <th className="px-3 py-2 text-left font-bold text-white">Row</th>
                          <th className="px-3 py-2 text-left font-bold text-white">Code</th>
                          <th className="px-3 py-2 text-left font-bold text-white">Name</th>
                          <th className="px-3 py-2 text-left font-bold text-white">Existing Code</th>
                          <th className="px-3 py-2 text-left font-bold text-white">Context</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.duplicateIdentity.map((s: BulkStopItem, i: number) => (
                          <tr key={i} className="border-t border-white/10">
                            <td className="px-3 py-2 text-white/50">
                              {s._sourceIndex !== undefined ? s._sourceIndex + 1 : "-"}
                            </td>
                            <td className="px-3 py-2 font-bold text-white">{s.code}</td>
                            <td className="px-3 py-2 font-bold">{s.name}</td>
                            <td className="px-3 py-2 text-white/50">{s.existingStop?.code || "—"}</td>
                            <td className="px-3 py-2 text-white/50">
                              {[s.district, s.municipality].filter(Boolean).join(", ")}
                            </td>
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
                      <thead>
                        <tr className="bg-white/5">
                          <th className="px-3 py-2 text-left font-bold text-white">Row</th>
                          <th className="px-3 py-2 text-left font-bold text-white">Code</th>
                          <th className="px-3 py-2 text-left font-bold text-white">Name</th>
                          <th className="px-3 py-2 text-left font-bold text-white">Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.duplicateWithinBatch.map((s: BulkStopItem, i: number) => (
                          <tr key={i} className="border-t border-white/10">
                            <td className="px-3 py-2 text-white/50">
                              {s._sourceIndex !== undefined ? s._sourceIndex + 1 : "-"}
                            </td>
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
                      <thead>
                        <tr className="bg-white/5">
                          <th className="px-3 py-2 text-left font-bold text-white w-12">Row</th>
                          <th className="px-3 py-2 text-left font-bold text-white">Code</th>
                          <th className="px-3 py-2 text-left font-bold text-white">Error</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.invalid.map((e: BulkStopError, i: number) => (
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
                className="h-11 flex-1 rounded-xl font-bold bg-[#D3D925] text-black hover:bg-[#D9CD25] gap-2 disabled:opacity-50"
                disabled={report.summary.new === 0 || importing}
                onClick={handleImport}
              >
                {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {importing
                  ? "Importing..."
                  : `Confirm Import — Add ${report.summary.new} Stop${report.summary.new !== 1 ? "s" : ""}`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
