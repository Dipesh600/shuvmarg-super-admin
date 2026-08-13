import React from "react";
import { Armchair, BedDouble, CircleGauge, DoorOpen, Eraser, MousePointer2, Rows3, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { passengerPlaces, resizeSection, updateElement } from "./layout";
import { layoutPresets } from "./presets";
import SeatLayoutCanvas from "./SeatLayoutCanvas";
import type { BuilderTool, Comfort, LayoutElement, SeatLayoutV3 } from "./types";

const tools: { id: BuilderTool; label: string; icon: typeof MousePointer2 }[] = [
  { id: "SELECT", label: "Select", icon: MousePointer2 }, { id: "SEAT", label: "Seat", icon: Armchair },
  { id: "BERTH", label: "Sleeper", icon: BedDouble }, { id: "AISLE", label: "Aisle", icon: Rows3 },
  { id: "DOOR", label: "Door", icon: DoorOpen }, { id: "DRIVER", label: "Driver", icon: CircleGauge },
  { id: "ERASE", label: "Remove", icon: Eraser },
];

export default function SeatLayoutBuilder({ layout, onChange, onSave, busy = false }: {
  layout: SeatLayoutV3 | null; onChange: (layout: SeatLayoutV3) => void;
  onSave: (layout: SeatLayoutV3) => void; busy?: boolean;
}) {
  const [tool, setTool] = React.useState<BuilderTool>("SELECT");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const selected = layout?.sections.flatMap((section) => section.elements).find((element) => element.elementId === selectedId) || null;
  if (!layout) return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{layoutPresets.map((preset) => <button key={preset.id} type="button" onClick={() => onChange(preset.create())} className="group rounded-3xl border border-white/10 bg-white/[0.025] p-6 text-left transition hover:border-[#D3D925]/60 hover:bg-[#D3D925]/[0.04]">
    <div className="mb-8 flex size-11 items-center justify-center rounded-2xl bg-white/5 text-[#D3D925]"><Armchair className="size-5" /></div><p className="font-bold text-white">{preset.name}</p><p className="mt-1 text-sm text-white/40">{preset.detail}</p><p className="mt-5 text-[10px] font-black uppercase tracking-widest text-[#D3D925]">Use this starting point</p>
  </button>)}</div>;
  return <div className="grid gap-5 2xl:grid-cols-[180px_minmax(0,1fr)_290px]">
    <aside className="rounded-3xl border border-white/10 bg-white/[0.025] p-3"><p className="px-2 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/35">Build tools</p><div className="grid grid-cols-2 gap-2 2xl:grid-cols-1">{tools.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => setTool(id)} className={cn("flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold", tool === id ? "border-[#D3D925]/70 bg-[#D3D925]/10 text-[#D3D925]" : "border-white/5 text-white/55 hover:bg-white/5")}><Icon className="size-4" />{label}</button>)}</div></aside>
    <main className="min-w-0"><SeatLayoutCanvas layout={layout} tool={tool} selectedId={selectedId} onSelect={setSelectedId} onChange={onChange} /></main>
    <aside className="space-y-4 rounded-3xl border border-white/10 bg-white/[0.025] p-5"><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">Layout summary</p><p className="mt-2 text-3xl font-black text-white">{passengerPlaces(layout).length}</p><p className="text-xs text-white/40">reservable passenger places</p></div>
      {selected && (selected.kind === "SEAT" || selected.kind === "BERTH") ? <ElementEditor element={selected} onChange={(update) => onChange(updateElement(layout, selected.elementId, update))} /> : <div className="rounded-2xl border border-dashed border-white/10 p-4 text-xs leading-5 text-white/35">Choose Select, then click a seat or berth to edit its passenger label and class.</div>}
      <div className="space-y-2 border-t border-white/10 pt-4">{layout.sections.map((section) => <label key={section.sectionId} className="flex items-center justify-between gap-3 text-xs text-white/55"><span>{section.name} rows</span><Input type="number" min={2} max={40} value={section.heightUnits} onChange={(event) => onChange(resizeSection(layout, section.sectionId, Number(event.target.value)))} className="h-8 w-20 border-white/10 bg-black/20" /></label>)}</div>
      <Button disabled={busy} onClick={() => onSave(layout)} className="w-full bg-[#D3D925] font-black text-black hover:bg-[#dce331]"><Save className="mr-2 size-4" />{busy ? "Saving…" : "Save draft"}</Button>
    </aside>
  </div>;
}

function ElementEditor({ element, onChange }: { element: LayoutElement; onChange: (update: Partial<LayoutElement>) => void }) {
  return <div className="space-y-3 border-t border-white/10 pt-4"><p className="text-xs font-bold text-white">Selected {element.kind.toLowerCase()}</p><label className="block text-[10px] font-bold uppercase tracking-wider text-white/35">Passenger label<Input value={element.label || ""} onChange={(event) => onChange({ label: event.target.value })} className="mt-1 border-white/10 bg-black/20" /></label>
    <label className="block text-[10px] font-bold uppercase tracking-wider text-white/35">Comfort<select value={element.attributes?.comfort} onChange={(event) => onChange({ attributes: { ...element.attributes!, comfort: event.target.value as Comfort } })} className="mt-1 h-10 w-full rounded-md border border-white/10 bg-[#111] px-3 text-xs text-white"><option>STANDARD</option><option>RECLINING</option><option>SEMI_SLEEPER</option></select></label>
    <label className="block text-[10px] font-bold uppercase tracking-wider text-white/35">Commercial class<select value={element.attributes?.commercialClass} onChange={(event) => onChange({ attributes: { ...element.attributes!, commercialClass: event.target.value as "STANDARD" | "PREMIUM" | "PRIORITY" } })} className="mt-1 h-10 w-full rounded-md border border-white/10 bg-[#111] px-3 text-xs text-white"><option>STANDARD</option><option>PREMIUM</option><option>PRIORITY</option></select></label>
    <label className="flex items-center gap-2 text-xs text-white/60"><input type="checkbox" checked={element.attributes?.accessible === true} onChange={(event) => onChange({ attributes: { ...element.attributes!, accessible: event.target.checked } })} />Accessible place</label>
  </div>;
}
