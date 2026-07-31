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
import { Plus, Loader2, MapPin, Globe, ArrowRight, Sparkles, Route, Pencil, Trash2, Search, X, ChevronRight, ChevronDown, Navigation } from "lucide-react";
import { toast } from "sonner";
import { createCorridor, getAllCorridors, updateCorridor, deleteCorridor, getVariantsByCorridor, updateVariant, deleteVariant, createRegistryBoardingPoint, getBoardingPointsByStop, updateRegistryBoardingPoint, deleteRegistryBoardingPoint, getAllRouteRequests } from "@/api/platformRegistryApi";
import { CreateVariantModal, MapStopsModal } from "./VariantModals";
import RouteRequestsPanel from "./RouteRequestsPanel";
import { DiscoveryTab } from "./DiscoveryTab";
import { StopRegistryWorkspace } from "@/components/admin/stop-registry/StopRegistryWorkspace";
import { cn } from "@/lib/utils";

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
            <StopRegistryWorkspace />
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
