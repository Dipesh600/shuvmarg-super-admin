import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, Route, ArrowRight, Plus, X, Check, Search,
  ArrowRightLeft, GripVertical, Clock, Star
} from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { toast } from "sonner";
import { createVariant, setVariantStops, getStopsForVariant, getAllStops } from "@/api/platformRegistryApi";

// ── Shared Modal Header (uniform dark slate across all Registry modals) ────────
const ModalHeader = ({ icon: Icon, title, subtitle, children }: {
  icon: React.ElementType; title: string; subtitle?: string; children?: React.ReactNode;
}) => (
  <div className="bg-[#121212] p-7 border-b border-white/5 text-white">
    <DialogHeader>
      <DialogTitle className="text-lg font-bold text-white flex items-center gap-2.5">
        <div className="p-1.5 bg-white/10 rounded-lg">
          <Icon className="w-4 h-4 text-white" />
        </div>
        {title}
      </DialogTitle>
    </DialogHeader>
    {subtitle && <p className="text-white/50 text-sm font-medium mt-1.5 ml-9">{subtitle}</p>}
    {children && <div className="mt-3 ml-9">{children}</div>}
  </div>
);

// ── Create Variant Modal ──────────────────────────────────────────────────────
interface CreateVariantModalProps {
  corridor: any;
  open: boolean;
  onClose: () => void;
}

export const CreateVariantModal = ({ corridor, open, onClose }: CreateVariantModalProps) => {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: "", type: "STANDARD", distanceKm: "", durationMinutes: "", autoGenerateReturn: true,
  });

  const mutation = useMutation({
    mutationFn: (payload: any) => createVariant({ corridorId: corridor._id, ...payload }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["variants", corridor._id] });
      const isDouble = data?.data?.forward;
      toast.success(isDouble ? `2 variants created: Forward + Return` : `Variant "${form.name}" created`);
      onClose();
      setForm({ name: "", type: "STANDARD", distanceKm: "", durationMinutes: "", autoGenerateReturn: true });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || e.message),
  });

  const handleSubmit = () => {
    if (!form.name) return toast.error("Variant name is required.");
    mutation.mutate({
      name: form.name, type: form.type,
      distanceKm: form.distanceKm ? parseInt(form.distanceKm) : undefined,
      durationMinutes: form.durationMinutes ? parseInt(form.durationMinutes) : undefined,
      autoGenerateReturn: form.autoGenerateReturn,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] p-0 border-none shadow-2xl rounded-2xl overflow-hidden">
        <ModalHeader icon={Route} title="Add Route Variant" subtitle={`Define a path for corridor ${corridor?.code}`}>
          <div className="flex items-center gap-2">
            <Badge className="bg-white/15 text-white border-none font-bold text-xs px-2">
              {corridor?.originId?.name}
            </Badge>
            <ArrowRight className="w-3.5 h-3.5 text-white/50" />
            <Badge className="bg-white/15 text-white border-none font-bold text-xs px-2">
              {corridor?.destinationId?.name}
            </Badge>
          </div>
        </ModalHeader>

        <div className="p-7 space-y-5 bg-[#0a0a0a]">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Path Name</Label>
            <Input placeholder="e.g. Via BP Highway, Via Hetauda" className="h-11 rounded-xl font-bold"
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Road Type</Label>
              <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                <SelectTrigger className="h-11 rounded-xl font-bold"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl">
                  {["STANDARD","HIGHWAY","EXPRESSWAY","MOUNTAIN","LOCAL"].map(t => (
                    <SelectItem key={t} value={t}>{t[0]+t.slice(1).toLowerCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Distance (km)</Label>
              <Input type="number" placeholder="232" className="h-11 rounded-xl font-bold"
                value={form.distanceKm} onChange={e => setForm({ ...form, distanceKm: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Duration (min)</Label>
              <Input type="number" placeholder="390" className="h-11 rounded-xl font-bold"
                value={form.durationMinutes} onChange={e => setForm({ ...form, durationMinutes: e.target.value })} />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
            <div className="flex items-center gap-3">
              <ArrowRightLeft className="w-4 h-4 text-white/60" />
              <div>
                <p className="text-sm font-bold">Auto-Build Return Variant</p>
                <p className="text-[10px] text-white/50 font-medium">Creates the reverse path automatically.</p>
              </div>
            </div>
            <Switch checked={form.autoGenerateReturn} onCheckedChange={v => setForm({ ...form, autoGenerateReturn: v })} />
          </div>
        </div>

        <DialogFooter className="p-7 pt-0 bg-[#0a0a0a] gap-3">
          <Button variant="outline" onClick={onClose} className="font-bold rounded-xl h-11">Cancel</Button>
          <Button disabled={mutation.isPending || !form.name} onClick={handleSubmit}
            className="font-bold rounded-xl h-11 px-8 bg-[#121212] hover:bg-white/10 text-white">
            {mutation.isPending && <Loader2 className="mr-2 w-4 h-4 animate-spin" />}
            {form.autoGenerateReturn ? "Create Both Directions" : "Create Variant"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ── Map Stops Modal (Industry-Standard Route Timeline) ────────────────────────
interface MapStopsModalProps {
  variant: any;
  open: boolean;
  onClose: () => void;
}

export const MapStopsModal = ({ variant, open, onClose }: MapStopsModalProps) => {
  const qc = useQueryClient();

  const { data: allStopsData } = useQuery({ queryKey: ["stops"], queryFn: getAllStops });
  const allStops = allStopsData?.data || [];

  const { data: currentStopsData, isLoading } = useQuery({
    queryKey: ["variant-stops", variant?._id],
    queryFn: () => getStopsForVariant(variant._id),
    enabled: !!variant?._id && open,
  });

  const [sequence, setSequence] = useState<any[]>([]);
  const [stopSearch, setStopSearch] = useState("");
  const [isSmartPaste, setIsSmartPaste] = useState(false);
  const [smartPasteText, setSmartPasteText] = useState("");

  const handleSmartPaste = () => {
    if (!smartPasteText.trim()) return;
    const items = smartPasteText.split(",").map(s => s.trim().toLowerCase()).filter(s => s.length > 0);
    const newSeq = [...sequence];
    let addedCount = 0;
    const notFound: string[] = [];
    
    for (const nameOrAlias of items) {
      const stop = allStops.find((s: any) => 
        s.name.toLowerCase() === nameOrAlias ||
        (s.aliases && s.aliases.some((a: string) => a.toLowerCase() === nameOrAlias))
      );
      if (stop) {
        if (!newSeq.find(s => s.stopCode === stop.code)) {
          newSeq.push({ stopCode: stop.code, stopName: stop.name, isMajor: true, estimatedMinutesFromOrigin: 0 });
          addedCount++;
        }
      } else {
        notFound.push(nameOrAlias);
      }
    }
    
    setSequence(newSeq);
    setSmartPasteText("");
    setIsSmartPaste(false);
    
    if (notFound.length > 0) {
      toast.warning(`Added ${addedCount} stops. Could not find: ${notFound.join(", ")}`);
    } else if (addedCount > 0) {
      toast.success(`✨ Added ${addedCount} stops automatically.`);
    }
  };

  React.useEffect(() => {
    if (currentStopsData?.data) {
      setSequence(currentStopsData.data.map((rs: any) => ({
        stopCode: rs.stopId.code,
        stopName: rs.stopId.name,
        isMajor: rs.isMajor,
        estimatedMinutesFromOrigin: rs.estimatedMinutesFromOrigin,
      })));
    }
  }, [currentStopsData]);

  const addStop = (stop: any) => {
    if (sequence.find(s => s.stopCode === stop.code)) return toast.error("Stop already in sequence.");
    setSequence(prev => [...prev, { stopCode: stop.code, stopName: stop.name, isMajor: true, estimatedMinutesFromOrigin: 0 }]);
  };

  const removeStop = (code: string) => {
    if (sequence.length <= 2) return toast.error("Cannot remove — minimum 2 stops (origin + destination).");
    setSequence(prev => prev.filter(s => s.stopCode !== code));
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    const items = Array.from(sequence);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setSequence(items);
  };

  const updateStop = (index: number, field: string, value: any) => {
    const updated = [...sequence];
    updated[index] = { ...updated[index], [field]: value };
    setSequence(updated);
  };

  const saveMutation = useMutation({
    mutationFn: () => setVariantStops(variant._id, sequence.map((s, i) => ({
      stopCode: s.stopCode, sequence: i + 1, isMajor: s.isMajor,
      estimatedMinutesFromOrigin: s.estimatedMinutesFromOrigin || 0,
    }))),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["variant-stops", variant._id] });
      toast.success("Stop sequence saved.");
      onClose();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || e.message),
  });

  const usedCodes = sequence.map(s => s.stopCode);
  const availableStops = allStops.filter((s: any) => !usedCodes.includes(s.code));
  const filteredAvailableStops = availableStops.filter((s: any) =>
    !stopSearch || s.name.toLowerCase().includes(stopSearch.toLowerCase()) || s.code.toLowerCase().includes(stopSearch.toLowerCase())
  );

  const getTimeBetween = (index: number) => {
    if (index === 0) return null;
    const diff = sequence[index].estimatedMinutesFromOrigin - sequence[index - 1].estimatedMinutesFromOrigin;
    return diff > 0 ? `+${diff} min` : null;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[780px] h-[88vh] flex flex-col p-0 border-none shadow-2xl rounded-2xl overflow-hidden">
        <ModalHeader icon={Route} title="Route Stop Sequence" subtitle="Define ordered stops for this variant path">
          {variant && (
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="bg-white/15 text-white border-none font-bold text-xs">{variant.code}</Badge>
              <span className="text-white/50 text-xs">{variant.name.replace(/ \(Return\)/i, "").replace(/ \(Forward\)/i, "")}</span>
              {variant.direction && (
                <Badge className={`border-none text-[9px] font-bold ${variant.direction === "RETURN" ? "bg-white/5/20 text-white" : "bg-[#D3D925]/100/20 text-[#D3D925]"}`}>
                  {variant.direction}
                </Badge>
              )}
            </div>
          )}
        </ModalHeader>

        <div className="flex flex-1 overflow-hidden bg-[#0a0a0a]">

          {/* Left Panel: Stop Registry */}
          <div className="w-64 border-r flex flex-col shrink-0 bg-white/[0.02]">
            <div className="px-3 py-3 border-b bg-[#0a0a0a]/80 space-y-2 shrink-0">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Stop Registry</p>
                <button 
                  onClick={() => { setIsSmartPaste(!isSmartPaste); setSmartPasteText(""); }}
                  className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded transition-all ${isSmartPaste ? "bg-slate-200 text-white/30 hover:bg-slate-300" : "bg-[#D3D925]/10 text-[#D3D925] border border-[#D3D925]/20 hover:bg-[#D3D925]/10"}`}
                >
                  {isSmartPaste ? "Back to Search" : "✨ Smart Paste"}
                </button>
              </div>
              
              {!isSmartPaste && (
                <div className="space-y-2 animate-in fade-in">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-white/50" />
                    <Input placeholder="Search stops..." className="pl-7 h-7 rounded-lg text-xs" value={stopSearch} onChange={e => setStopSearch(e.target.value)} />
                  </div>
                  <p className="text-[9px] text-white/50/60">{filteredAvailableStops.length} of {allStops.length} stops</p>
                </div>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto p-2">
              {isSmartPaste ? (
                <div className="flex flex-col h-full space-y-3 animate-in fade-in p-1">
                  <p className="text-[10px] text-white/50 leading-relaxed">
                    Paste a comma-separated list of stop names or aliases to instantly generate the sequence.
                  </p>
                  <textarea 
                    className="flex-1 w-full p-3 text-xs rounded-xl border bg-[#0a0a0a] resize-none focus:outline-none focus:ring-2 focus:ring-[#D3D925]/30"
                    placeholder="e.g. Kathmandu, Mugling, Pokhara"
                    value={smartPasteText}
                    onChange={e => setSmartPasteText(e.target.value)}
                    spellCheck={false}
                  />
                  <Button 
                    onClick={handleSmartPaste} 
                    disabled={!smartPasteText.trim()} 
                    className="w-full h-11 rounded-xl font-bold bg-[#D3D925] text-black hover:bg-[#D9CD25] text-white shrink-0"
                  >
                    Auto-Map Stops
                  </Button>
                </div>
              ) : (
                <div className="space-y-1 animate-in fade-in">
                  {filteredAvailableStops.length === 0 ? (
                    <div className="p-3 text-center text-[10px] text-white/50 italic">
                      {stopSearch ? `No stops matching "${stopSearch}"` : sequence.length > 0 ? "All stops added." : "No stops in registry."}
                    </div>
                  ) : filteredAvailableStops.map((stop: any) => (
                    <button key={stop.code} onClick={() => addStop(stop)}
                      className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-[#D3D925]/8 border border-transparent hover:border-primary/15 transition-all group flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold leading-tight">{stop.name}</p>
                        <p className="text-[9px] text-white/50 uppercase mt-0.5">{stop.code} · {stop.type}</p>
                      </div>
                      <Plus className="w-3.5 h-3.5 text-white/50/40 group-hover:text-[#D3D925] transition-colors shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Route Timeline */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-5 py-3 border-b bg-[#0a0a0a]/80 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Route Timeline</p>
                <p className="text-[10px] text-white/50/70 mt-0.5">{sequence.length} stops · Use arrows to reorder</p>
              </div>
              {sequence.length >= 2 && (
                <div className="flex items-center gap-1.5 overflow-x-auto max-w-xs">
                  {sequence.map((s, i) => (
                    <React.Fragment key={s.stopCode}>
                      <span className={`text-[9px] font-bold shrink-0 ${i === 0 || i === sequence.length - 1 ? "text-white" : "text-white/50"}`}>
                        {s.stopCode}
                      </span>
                      {i < sequence.length - 1 && <ArrowRight className="w-2.5 h-2.5 text-white/50/40 shrink-0" />}
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {isLoading && (
                <div className="flex items-center justify-center h-24">
                  <Loader2 className="w-5 h-5 animate-spin text-[#D3D925]/40" />
                </div>
              )}
              {!isLoading && sequence.length === 0 && (
                <div className="flex flex-col items-center justify-center h-40 text-center text-white/50 border-2 border-dashed border-white/10 rounded-xl">
                  <Route className="w-8 h-8 mb-3 opacity-20" />
                  <p className="text-sm font-bold">No stops added yet</p>
                  <p className="text-xs mt-1 opacity-60">Click stops from the left panel to build the route</p>
                </div>
              )}

              {sequence.length > 0 && (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="sequence-list">
                    {(provided) => (
                      <div className="space-y-0" {...provided.droppableProps} ref={provided.innerRef}>
                        {sequence.map((stop, index) => {
                          const isOrigin = index === 0;
                          const isDest = index === sequence.length - 1;
                          const timeBetween = getTimeBetween(index);

                          return (
                            <Draggable key={stop.stopCode} draggableId={stop.stopCode} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={snapshot.isDragging ? "z-50 relative" : ""}
                                >
                                  {/* Time gap indicator */}
                                  {timeBetween && !snapshot.isDragging && (
                                    <div className="flex items-center gap-2 ml-5 my-1">
                                      <div className="w-px h-5 bg-border ml-2" />
                                      <span className="text-[9px] text-white/50 font-medium flex items-center gap-1">
                                        <Clock className="w-2.5 h-2.5" />{timeBetween}
                                      </span>
                                    </div>
                                  )}

                                  {/* Stop card */}
                                  <div className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all group ${
                                    snapshot.isDragging ? "bg-[#0a0a0a] border-primary shadow-xl scale-[1.02]" :
                                    isOrigin ? "bg-[#D3D925]/10 border-[#D3D925]/20 dark:bg-[#D3D925]/10 dark:border-[#D3D925]/20" :
                                    isDest ? "bg-white/5 border-white/10 dark:bg-white/5 dark:border-white/10" :
                                    "bg-white/[0.02] border-white/5 hover:bg-white/5"
                                  }`}>
                                    {/* Drag Handle */}
                                    <div
                                      {...provided.dragHandleProps}
                                      className="flex items-center justify-center w-6 h-full cursor-grab active:cursor-grabbing text-white/50/40 hover:text-white transition-colors mt-0.5"
                                    >
                                      <GripVertical className="w-4 h-4" />
                                    </div>

                                    {/* Sequence number */}
                                    <div className={`flex items-center justify-center w-7 h-7 rounded-full text-[10px] font-bold shrink-0 mt-0.5 ${
                                      isOrigin ? "bg-[#D3D925] text-black text-white" :
                                      isDest ? "bg-white/5 hover:bg-white/5 text-white" :
                                      "bg-slate-200 text-white/30 dark:bg-slate-700 dark:text-slate-200"
                                    }`}>
                                      {index + 1}
                                    </div>

                                    {/* Stop info */}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-2">
                                        <p className="text-sm font-bold truncate">{stop.stopName}</p>
                                        <span className="text-[9px] text-white/50 uppercase">{stop.stopCode}</span>
                                        {isOrigin && <Badge className="text-[8px] bg-[#D3D925]/10 text-white/90 border-none font-bold px-1.5 py-0">ORIGIN</Badge>}
                                        {isDest && <Badge className="text-[8px] bg-white/5 text-white border-none font-bold px-1.5 py-0">DESTINATION</Badge>}
                                      </div>
                                      <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1.5">
                                          <Clock className="w-3 h-3 text-white/50" />
                                          <Input type="number" value={stop.estimatedMinutesFromOrigin}
                                            onChange={e => updateStop(index, "estimatedMinutesFromOrigin", parseInt(e.target.value) || 0)}
                                            className="h-6 w-20 text-[11px] font-bold rounded-lg px-2 border-white/5 bg-[#0a0a0a]"
                                            placeholder="0"
                                          />
                                          <span className="text-[10px] text-white/50">min from start</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                          <Switch checked={stop.isMajor} onCheckedChange={v => updateStop(index, "isMajor", v)} className="scale-75 origin-left" />
                                          <Label className="text-[10px] font-bold text-white/50 flex items-center gap-1 cursor-pointer">
                                            <Star className="w-2.5 h-2.5" /> Major stop
                                          </Label>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Controls */}
                                    <div className="flex flex-col gap-1 shrink-0">
                                      <button onClick={() => removeStop(stop.stopCode)}
                                        className="w-8 h-8 rounded-md border border-white/10 bg-[#0a0a0a] flex items-center justify-center hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive transition-all">
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              )}
            </div>

            <div className="px-5 py-4 border-t bg-white/[0.02] flex justify-between items-center shrink-0">
              <div>
                {sequence.length < 2
                  ? <p className="text-[11px] text-white font-bold">⚠ Add at least Origin + Destination</p>
                  : <p className="text-[11px] text-[#D3D925] font-bold">✓ {sequence.length} stops ready to save</p>
                }
              </div>
              <div className="flex gap-2.5">
                <Button variant="outline" onClick={onClose} className="font-bold rounded-xl h-10">Cancel</Button>
                <Button disabled={saveMutation.isPending || sequence.length < 2} onClick={() => saveMutation.mutate()}
                  className="font-bold rounded-xl h-10 px-6 gap-2 bg-[#121212] hover:bg-white/10 text-white">
                  {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Save Route
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
