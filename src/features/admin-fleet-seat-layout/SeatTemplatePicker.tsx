import { CheckCircle2, Plus } from "lucide-react";
import type { SeatLayoutTemplate } from "@/features/seat-layout-v3/types";

interface Props {
  templates: SeatLayoutTemplate[];
  selectedId?: string | null;
  busy: boolean;
  onChoose: (template: SeatLayoutTemplate) => void;
  onScratch: () => void;
}

export default function SeatTemplatePicker({ templates, selectedId, busy, onChoose, onScratch }: Props) {
  return <div className="space-y-4">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h4 className="font-black text-foreground">Start with a platform layout</h4>
        <p className="mt-1 text-xs text-muted-foreground">Choose a published layout, preview it, then adjust only what differs.</p>
      </div>
      <button type="button" onClick={onScratch} className="inline-flex h-9 items-center justify-center rounded-xl border border-[#D3D925] px-3.5 text-xs font-bold text-[#D3D925] hover:bg-accent">
        <Plus className="mr-1.5 size-3.5" />Build from scratch
      </button>
    </div>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {templates.map((template) => {
        const selected = selectedId === template.id;
        return <button key={template.id} type="button" disabled={busy} onClick={() => onChoose(template)} className={`rounded-2xl border p-4 text-left transition disabled:opacity-60 ${selected ? "border-[#D3D925] bg-accent shadow-sm" : "border-border bg-card hover:border-border"}`}>
          <div className="flex justify-between gap-2"><p className="text-sm font-black text-foreground">{template.name}</p>{selected && <CheckCircle2 className="size-4 text-[#D3D925]" />}</div>
          <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{template.vehicleCategory.replaceAll("_", " ")}</p>
        </button>;
      })}
    </div>
  </div>;
}
