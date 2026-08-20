import { useCallback, useEffect, useState } from "react";
import { ArrowRight, BusFront, Loader2, Pencil, RefreshCw, Rows3 } from "lucide-react";
import { getSeatLayoutTemplate, listSeatLayoutTemplates } from "@/api/seatLayoutV3Api";
import SeatLayoutCanvas from "@/features/seat-layout-v3/SeatLayoutCanvas";
import { defaultGuidedLayoutConfig } from "@/features/seat-layout-v3/generator";
import { cloneLayout, passengerPlaces } from "@/features/seat-layout-v3/layout";
import type { SeatLayoutTemplate, SeatLayoutV3, VehicleCategory } from "@/features/seat-layout-v3/types";
import FleetSeatLayoutDesigner from "./FleetSeatLayoutDesigner";
import GuidedLayoutBuilder from "./GuidedLayoutBuilder";
import SeatTemplatePicker from "./SeatTemplatePicker";
import type { AdminFleetLayoutChoice } from "./types";

interface Props {
  value: AdminFleetLayoutChoice | null;
  onChange: (choice: AdminFleetLayoutChoice) => void;
  busName: string;
  vehicleCategory: VehicleCategory;
}

export default function AdminFleetSeatLayoutStep({ value, onChange, busName, vehicleCategory }: Props) {
  const [templates, setTemplates] = useState<SeatLayoutTemplate[]>([]);
  const [editorLayout, setEditorLayout] = useState<SeatLayoutV3 | null | undefined>();
  const [editorTitle, setEditorTitle] = useState("Build a seat layout");
  const [sourceTemplateId, setSourceTemplateId] = useState<string | null>(null);
  const [guidedScratch, setGuidedScratch] = useState(false);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const items = await listSeatLayoutTemplates();
      setTemplates(items.filter((item) => item.scope === "PLATFORM" && item.status === "ACTIVE" && item.currentPublishedRevisionId));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load seat layouts.");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function choose(template: SeatLayoutTemplate) {
    setBusy(true);
    setError(null);
    try {
      const detail = await getSeatLayoutTemplate(template.id);
      const revision = detail.revisions.find((item) => item.id === template.currentPublishedRevisionId)
        || detail.revisions.find((item) => item.status === "PUBLISHED");
      if (!revision?.layout) throw new Error("This platform layout has no published seat map.");
      onChange({
        templateId: template.id,
        templateName: template.name,
        revisionId: revision.id,
        totalPlaces: revision.totalPlaces,
        layout: revision.layout,
        customized: false,
        sourceTemplateId: null,
        templateScope: template.scope,
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to select this layout.");
    } finally {
      setBusy(false);
    }
  }

  function customize() {
    if (!value) return;
    setEditorTitle(`Adjust ${value.templateName}`);
    setSourceTemplateId(value.templateScope === "PLATFORM" ? value.templateId : value.sourceTemplateId);
    setEditorLayout(cloneLayout(value.layout));
  }

  function updateCustom(layout: SeatLayoutV3, source = sourceTemplateId) {
    setEditorLayout(layout);
    onChange({
      templateId: null,
      revisionId: null,
      templateName: `${busName.trim() || "Custom"} layout`,
      totalPlaces: passengerPlaces(layout).length,
      layout,
      customized: true,
      sourceTemplateId: source,
    });
  }

  if (guidedScratch) return <GuidedLayoutBuilder
    initialConfig={defaultGuidedLayoutConfig(vehicleCategory)}
    onContinue={(layout) => { setEditorTitle("Make final adjustments"); setSourceTemplateId(null); updateCustom(layout, null); setGuidedScratch(false); }}
    onCancel={() => setGuidedScratch(false)}
  />;

  if (editorLayout !== undefined) return <FleetSeatLayoutDesigner
    title={editorTitle}
    layout={editorLayout}
    busy={busy}
    onChange={updateCustom}
    onUse={(layout) => { updateCustom(layout); setEditorLayout(undefined); }}
    onCancel={() => setEditorLayout(undefined)}
  />;

  if (busy && !templates.length) return <div className="flex min-h-52 items-center justify-center text-sm text-muted-foreground"><Loader2 className="mr-2 size-4 animate-spin" />Loading platform layouts…</div>;
  if (error && !templates.length) return <LoadError error={error} reload={load} />;

  return <div className="space-y-5">
    {error && <div className="rounded-xl bg-red-50 p-3 text-xs font-bold text-red-700">{error}</div>}
    {value?.customized && <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3"><div className="flex size-9 items-center justify-center rounded-xl border border-border bg-accent text-[#D3D925]"><BusFront className="size-4" /></div><div><p className="text-xs font-bold text-foreground">{value.templateName} in progress</p><p className="text-[11px] text-muted-foreground">{value.totalPlaces} places · changes are retained in this registration</p></div></div>
      <button type="button" onClick={customize} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[#D3D925] px-3.5 text-xs font-bold text-black">Continue editing<ArrowRight className="size-3.5" /></button>
    </div>}
    <SeatTemplatePicker templates={templates} selectedId={value?.templateId} busy={busy} onChoose={(template) => void choose(template)} onScratch={() => { setSourceTemplateId(null); setGuidedScratch(true); }} />
    {value && <div className="rounded-[24px] border border-border bg-muted p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><p className="font-black text-foreground">{value.templateName}</p><p className="mt-1 text-xs text-muted-foreground">{value.totalPlaces} places{value.customized ? " · custom for this bus" : " · published platform layout"}</p></div><button type="button" onClick={customize} className="inline-flex h-9 items-center rounded-xl border border-[#D3D925] px-3 text-xs font-black text-[#D3D925]"><Pencil className="mr-2 size-3.5" />Customize layout</button></div>
      <SeatLayoutCanvas layout={value.layout} tool="SELECT" selectedId={null} onSelect={() => undefined} onChange={() => undefined} />
    </div>}
  </div>;
}

function LoadError({ error, reload }: { error: string; reload: () => Promise<void> }) {
  return <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card p-8 text-center"><Rows3 className="size-7 text-[#D3D925]" /><p className="mt-3 text-sm font-black text-foreground">Seat layouts couldn’t load</p><p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">{error}</p><button type="button" onClick={() => void reload()} className="mt-4 inline-flex h-10 items-center rounded-xl border border-border px-4 text-xs font-black text-[#D3D925]"><RefreshCw className="mr-2 size-3.5" />Try again</button></div>;
}
