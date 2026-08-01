import { ChevronDown, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { BoardingLocationFormState } from "./boardingLocationTypes";

export function BoardingLocationFields({
  value,
  onChange,
}: {
  value: BoardingLocationFormState;
  onChange: (value: BoardingLocationFormState) => void;
}) {
  const set = <K extends keyof BoardingLocationFormState>(
    key: K,
    next: BoardingLocationFormState[K],
  ) => onChange({ ...value, [key]: next });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-white">What should passengers recognise?</p>
        <p className="mt-1 text-xs leading-relaxed text-white/45">Map search fills the name, address and likely place type. Confirm the passenger-specific details below.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="boarding-name">Boarding place name *</Label>
        <Input id="boarding-name" autoFocus value={value.name} onChange={(event) => set("name", event.target.value)} placeholder="e.g. Kalanki Chowk" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="boarding-landmark">Nearby landmark</Label>
        <Input id="boarding-landmark" value={value.landmark} onChange={(event) => set("landmark", event.target.value)} placeholder="e.g. Opposite Bhatbhateni" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="boarding-type">Place type</Label>
          <select id="boarding-type" value={value.locationType} onChange={(event) => set("locationType", event.target.value as BoardingLocationFormState["locationType"])} className="h-10 w-full rounded-md border border-white/10 bg-[#121212] px-3 text-sm text-white">
            <option value="ROADSIDE">Roadside</option><option value="BUS_PARK">Bus park</option><option value="TERMINAL_GATE">Terminal gate</option><option value="BUS_BAY">Bus bay</option><option value="COUNTER">Counter</option><option value="LANDMARK">Landmark</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="boarding-gate">Gate, bay or counter</Label>
          <Input id="boarding-gate" value={value.gateOrBay} onChange={(event) => set("gateOrBay", event.target.value)} placeholder="e.g. Gate 2" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="boarding-direction">Road side or direction</Label>
        <Input id="boarding-direction" value={value.directionHint} onChange={(event) => set("directionHint", event.target.value)} placeholder="e.g. Ring-road side towards Thankot" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="boarding-address">How passengers can recognise it</Label>
        <Textarea id="boarding-address" value={value.address} onChange={(event) => set("address", event.target.value)} placeholder="Beside the pedestrian bridge, on the ring-road side" rows={3} />
      </div>

      <details className="group rounded-xl border border-white/10 bg-white/[0.025]">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-xs font-semibold text-white/60">
          Advanced details
          <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
        </summary>
        <div className="border-t border-white/10 p-4">
          <Label htmlFor="boarding-aliases">Alternate names</Label>
          <Input id="boarding-aliases" className="mt-2" value={value.aliases} onChange={(event) => set("aliases", event.target.value)} placeholder="Comma-separated aliases" />
        </div>
      </details>

      <div className="flex gap-2 rounded-xl bg-white/[0.035] p-3 text-xs leading-relaxed text-white/45">
        <Info className="mt-0.5 size-4 shrink-0 text-[#EA4B2A]" />
        A map pin is a proposal. Save it for later review, or verify it only after checking access, road side, passenger recognition, and nearby matches.
      </div>

      <div className="rounded-xl border border-white/10 bg-black/20 p-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/35">Selected map point</p>
        <p className="mt-1 font-mono text-xs text-white/70">
          {value.coordinates
            ? `${value.coordinates.lat.toFixed(6)}, ${value.coordinates.lng.toFixed(6)}`
            : "Choose the exact place on the map"}
        </p>
      </div>
    </div>
  );
}
