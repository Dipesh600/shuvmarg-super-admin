import { useMemo, useState } from "react";
import { ArrowLeftRight, Loader2, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CorridorStop, CreateCorridorInput } from "@/api/corridorWorkflowApi";

interface CorridorCreateDialogProps {
  open: boolean;
  stops: CorridorStop[];
  isSaving: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: CreateCorridorInput) => void;
}

interface EndpointPickerProps {
  label: string;
  placeholder: string;
  value: CorridorStop | null;
  excludedStopId?: string;
  stops: CorridorStop[];
  onSelect: (stop: CorridorStop | null) => void;
}

function EndpointPicker({ label, placeholder, value, excludedStopId, stops, onSelect }: EndpointPickerProps) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const results = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return stops.filter((stop) => stop._id !== excludedStopId && (
      !normalizedQuery || [stop.name, stop.code, stop.district, stop.municipality, stop.province]
        .some((field) => field?.toLocaleLowerCase().includes(normalizedQuery))
    )).slice(0, 8);
  }, [excludedStopId, query, stops]);

  if (value) {
    return (
      <div className="space-y-2">
        <Label className="text-[10px] font-bold uppercase tracking-widest text-white/45">{label}</Label>
        <div className="flex items-center gap-3 rounded-xl border border-[#D3D925]/20 bg-[#D3D925]/5 px-3.5 py-3">
          <MapPin className="size-4 shrink-0 text-[#D3D925]" aria-hidden="true" />
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-white">{value.name}</p><p className="text-xs text-white/40">{value.code}</p></div>
          <button type="button" onClick={() => { setQuery(""); onSelect(null); }} className="text-xs font-semibold text-white/45 hover:text-white">Change</button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative space-y-2">
      <Label className="text-[10px] font-bold uppercase tracking-widest text-white/45">{label}</Label>
      <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-white/35" aria-hidden="true" /><Input value={query} onFocus={() => setFocused(true)} onBlur={() => window.setTimeout(() => setFocused(false), 120)} onChange={(event) => setQuery(event.target.value)} placeholder={placeholder} className="h-11 border-white/10 bg-white/[0.04] pl-9 text-white placeholder:text-white/30" /></div>
      {focused && (
        <div className="absolute z-30 max-h-60 w-full overflow-y-auto rounded-xl border border-white/10 bg-[#171717] p-1 shadow-2xl">
          {results.length === 0 ? <p className="px-3 py-5 text-center text-xs text-white/40">No matching stops</p> : results.map((stop) => (
            <button key={stop._id} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => { onSelect(stop); setQuery(""); setFocused(false); }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-white/[0.06]">
              <MapPin className="size-3.5 shrink-0 text-white/35" aria-hidden="true" /><span className="min-w-0 flex-1 truncate text-sm font-medium text-white">{stop.name}</span><span className="text-[10px] font-bold text-white/35">{stop.code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function CorridorCreateDialog({ open, stops, isSaving, onOpenChange, onSubmit }: CorridorCreateDialogProps) {
  const [origin, setOrigin] = useState<CorridorStop | null>(null);
  const [destination, setDestination] = useState<CorridorStop | null>(null);
  const [notes, setNotes] = useState("");
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) { setOrigin(null); setDestination(null); setNotes(""); }
    onOpenChange(nextOpen);
  };
  const canSubmit = Boolean(origin && destination && origin._id !== destination._id);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg border-white/10 bg-[#111] p-0 text-white sm:rounded-2xl">
        <DialogHeader className="border-b border-white/10 p-6 pr-12"><DialogTitle className="text-lg font-bold">Declare a corridor</DialogTitle><DialogDescription className="mt-1 text-sm text-white/45">A corridor is the commercial connection between two stops. It remains a draft until an active route variant exists.</DialogDescription></DialogHeader>
        <div className="space-y-5 p-6">
          <EndpointPicker label="First endpoint" placeholder="Search first endpoint by name or code" value={origin} excludedStopId={destination?._id} stops={stops} onSelect={setOrigin} />
          <div className="flex justify-center"><ArrowLeftRight className="size-4 text-white/25" aria-hidden="true" /></div>
          <EndpointPicker label="Second endpoint" placeholder="Search second endpoint by name or code" value={destination} excludedStopId={origin?._id} stops={stops} onSelect={setDestination} />
          <div className="space-y-2"><Label className="text-[10px] font-bold uppercase tracking-widest text-white/45">Operating note <span className="normal-case tracking-normal text-white/25">(optional)</span></Label><Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="For example: primary intercity market connection" className="min-h-20 border-white/10 bg-white/[0.04] text-white placeholder:text-white/30" /></div>
        </div>
        <DialogFooter className="border-t border-white/10 p-6"><Button variant="outline" onClick={() => handleOpenChange(false)} className="border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white">Cancel</Button><Button disabled={!canSubmit || isSaving} onClick={() => origin && destination && onSubmit({ originCode: origin.code, destinationCode: destination.code, notes: notes.trim() || undefined })} className="bg-[#D3D925] font-bold text-black hover:bg-[#D9CD25]">{isSaving && <Loader2 className="mr-2 size-4 animate-spin" />}Declare corridor</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
