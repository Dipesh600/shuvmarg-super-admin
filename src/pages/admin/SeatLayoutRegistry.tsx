import { useEffect, useState } from "react";
import { Check, ChevronRight, Library, Plus, RefreshCw, Send, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SeatLayoutBuilder from "@/features/seat-layout-v3/SeatLayoutBuilder";
import type { SeatLayoutRevision, SeatLayoutTemplate, SeatLayoutV3, TemplateDetail, VehicleCategory } from "@/features/seat-layout-v3/types";
import { createSeatLayoutRevision, createSeatLayoutTemplate, getSeatLayoutTemplate, listSeatLayoutChangeRequests, listSeatLayoutTemplates, publishSeatLayoutRevision, reviewSeatLayoutChange } from "@/api/seatLayoutV3Api";

export default function SeatLayoutRegistry() {
  const [templates, setTemplates] = useState<SeatLayoutTemplate[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<TemplateDetail | null>(null);
  const [layout, setLayout] = useState<SeatLayoutV3 | null>(null);
  const [name, setName] = useState(""); const [code, setCode] = useState("");
  const [category, setCategory] = useState<VehicleCategory>("BUS");
  const [summary, setSummary] = useState("Initial physical layout");
  const [busy, setBusy] = useState(false);
  const [requests, setRequests] = useState<Array<{ id: string; fleetId: string; proposedRevisionId: string }>>([]);
  async function reload(select = selectedId) {
    const [items, pending] = await Promise.all([listSeatLayoutTemplates(), listSeatLayoutChangeRequests()]);
    setTemplates(items); setRequests(pending);
    const id = select && items.some((item) => item.id === select) ? select : items[0]?.id;
    setSelectedId(id || null);
    if (id) { const value = await getSeatLayoutTemplate(id); setDetail(value); setName(value.template.name); setCode(value.template.templateCode); setCategory(value.template.vehicleCategory); setLayout(value.revisions.find((revision) => revision.layout)?.layout || null); }
  }
  useEffect(() => {
    let active = true;
    void Promise.all([listSeatLayoutTemplates(), listSeatLayoutChangeRequests()])
      .then(async ([items, pending]) => {
        if (!active) return;
        setTemplates(items); setRequests(pending);
        const id = items[0]?.id;
        setSelectedId(id || null);
        if (!id) return;
        const value = await getSeatLayoutTemplate(id);
        if (!active) return;
        setDetail(value); setName(value.template.name); setCode(value.template.templateCode);
        setCategory(value.template.vehicleCategory);
        setLayout(value.revisions.find((revision) => revision.layout)?.layout || null);
      })
      .catch(() => { if (active) toast.error("Unable to load seat-layout registry."); });
    return () => { active = false; };
  }, []);
  async function select(id: string) { setSelectedId(id); const value = await getSeatLayoutTemplate(id); setDetail(value); setName(value.template.name); setCode(value.template.templateCode); setCategory(value.template.vehicleCategory); setLayout(value.revisions.find((revision) => revision.layout)?.layout || null); }
  async function saveDraft(value: SeatLayoutV3) {
    if (!name.trim()) return toast.error("Give this reusable layout a clear name.");
    setBusy(true);
    try {
      let templateId = selectedId;
      if (!templateId) {
        const created = await createSeatLayoutTemplate({ templateCode: code.trim().toUpperCase(), name: name.trim(), vehicleCategory: category });
        templateId = created.id;
      }
      await createSeatLayoutRevision(templateId, value, summary.trim());
      await reload(templateId); toast.success("Immutable layout draft created.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to save draft."); } finally { setBusy(false); }
  }
  async function publish(revision: SeatLayoutRevision) { if (!detail) return; setBusy(true); try { await publishSeatLayoutRevision(detail.template.id, revision.id); await reload(detail.template.id); toast.success("Layout revision published."); } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to publish."); } finally { setBusy(false); } }
  return <div className="space-y-6 pb-12">
    <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-xs font-black uppercase tracking-[0.24em] text-[#D3D925]">Fleet infrastructure</p><h1 className="mt-2 text-4xl font-black tracking-tight">Seat layout registry</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Create reusable physical templates. Published revisions are immutable; operator fleet changes remain reviewable.</p></div><Button onClick={() => { setSelectedId(null); setDetail(null); setLayout(null); setName(""); setCode(""); }} className="bg-[#D3D925] font-black text-black hover:bg-[#dce331]"><Plus className="mr-2 size-4" />New platform layout</Button></header>
    <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]"><aside className="rounded-3xl border border-white/10 bg-white/[0.025] p-3"><div className="flex items-center justify-between px-3 py-3"><span className="text-xs font-black uppercase tracking-widest text-white/40">Library</span><Library className="size-4 text-[#D3D925]" /></div>{templates.map((template) => <button key={template.id} onClick={() => void select(template.id)} className={`mb-2 w-full rounded-2xl border p-4 text-left ${selectedId === template.id ? "border-[#D3D925]/60 bg-[#D3D925]/10" : "border-white/5 hover:bg-white/5"}`}><div className="flex items-start justify-between gap-2"><strong className="text-sm text-white">{template.name}</strong><ChevronRight className="size-4 text-white/30" /></div><p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-white/35">{template.templateCode} · {template.currentPublishedRevisionId ? "Published" : "Draft only"}</p></button>)}</aside>
      <main className="space-y-5"><section className="grid gap-4 rounded-3xl border border-white/10 bg-white/[0.025] p-5 md:grid-cols-4"><label className="text-[10px] font-bold uppercase tracking-widest text-white/40 md:col-span-2">Template name<Input value={name || detail?.template.name || ""} onChange={(event) => setName(event.target.value)} placeholder="e.g. Deluxe 2 × 1" className="mt-2 border-white/10 bg-black/20" /></label><label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Registry code<Input value={code || detail?.template.templateCode || ""} disabled={Boolean(detail)} onChange={(event) => setCode(event.target.value)} placeholder="BUS-DLX-21" className="mt-2 border-white/10 bg-black/20" /></label><label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Vehicle<select value={detail?.template.vehicleCategory || category} disabled={Boolean(detail)} onChange={(event) => setCategory(event.target.value as VehicleCategory)} className="mt-2 h-10 w-full rounded-md border border-white/10 bg-[#111] px-3 text-sm"><option>BUS</option><option>MINIBUS</option><option>HIACE</option></select></label><label className="text-[10px] font-bold uppercase tracking-widest text-white/40 md:col-span-4">Revision note<Input value={summary} onChange={(event) => setSummary(event.target.value)} className="mt-2 border-white/10 bg-black/20" /></label></section>
        <SeatLayoutBuilder layout={layout} onChange={setLayout} onSave={saveDraft} busy={busy} />
        {detail && <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-5"><div className="flex items-center gap-2"><RefreshCw className="size-4 text-[#D3D925]" /><h2 className="font-bold">Revision history</h2></div><div className="mt-4 grid gap-3 md:grid-cols-2">{detail.revisions.map((revision) => <div key={revision.id} className="flex items-center justify-between rounded-2xl border border-white/10 p-4"><div><p className="text-sm font-bold">Revision {revision.revisionNumber}</p><p className="mt-1 text-xs text-white/40">{revision.totalPlaces} places · {revision.status.replaceAll("_", " ")}</p></div>{["DRAFT", "IN_REVIEW"].includes(revision.status) && <Button size="sm" disabled={busy} onClick={() => void publish(revision)}><Send className="mr-2 size-3.5" />Publish</Button>}{revision.status === "PUBLISHED" && <Check className="size-5 text-emerald-400" />}</div>)}</div></section>}
        {requests.length > 0 && <section className="rounded-3xl border border-amber-400/20 bg-amber-400/[0.04] p-5"><div className="flex items-center gap-2"><ShieldCheck className="size-5 text-amber-300" /><h2 className="font-bold">Fleet changes awaiting review</h2></div><div className="mt-4 space-y-2">{requests.map((request) => <div key={request.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-black/20 p-4"><div><p className="text-sm font-bold">Fleet {request.fleetId}</p><p className="text-xs text-white/40">Proposed revision {request.proposedRevisionId}</p></div><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => void reviewSeatLayoutChange(request.id, "reject", "Rejected during physical layout review").then(() => reload())}>Reject</Button><Button size="sm" onClick={() => void reviewSeatLayoutChange(request.id, "approve").then(() => reload())}>Approve</Button></div></div>)}</div></section>}
      </main></div>
  </div>;
}
