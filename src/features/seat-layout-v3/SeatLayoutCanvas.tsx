import { useRef, useState, type PointerEvent } from "react";
import { BedDouble, CircleGauge, DoorOpen, Gauge } from "lucide-react";
import { cn } from "@/lib/utils";
import { applyTool, sectionLabel } from "./layout";
import type { BuilderTool, LayoutElement, LayoutSection, SeatLayoutV3 } from "./types";

const colors: Record<LayoutElement["kind"], string> = {
  SEAT: "border-cyan-400/70 bg-cyan-400/15 text-cyan-100",
  BERTH: "border-violet-400/70 bg-violet-400/15 text-violet-100",
  AISLE: "border-white/10 bg-white/[0.03] text-white/25",
  DOOR: "border-emerald-400/60 bg-emerald-400/10 text-emerald-200",
  DRIVER: "border-amber-400/60 bg-amber-400/10 text-amber-100",
};

function content(element: LayoutElement) {
  if (element.kind === "BERTH") return <><BedDouble className="size-3.5" /><span>{element.label}</span></>;
  if (element.kind === "DOOR") return <DoorOpen className="size-4" />;
  if (element.kind === "DRIVER") return <CircleGauge className="size-4" />;
  return element.kind === "AISLE" ? null : element.label;
}

function Deck({ section, layout, tool, selectedId, onChange, onSelect, onMove }: {
  section: LayoutSection; layout: SeatLayoutV3; tool: BuilderTool; selectedId: string | null;
  onChange: (layout: SeatLayoutV3) => void; onSelect: (id: string | null) => void;
  onMove: (sectionId: string, elementId: string, x: number, y: number) => void;
}) {
  const drag = useRef<{ pointerId: number; elementId: string; startX: number; startY: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const cells = Array.from({ length: section.widthUnits * section.heightUnits }, (_, index) => ({
    x: index % section.widthUnits, y: Math.floor(index / section.widthUnits),
  }));
  function beginMove(event: PointerEvent<HTMLButtonElement>, element: LayoutElement) {
    if (tool !== "SELECT" || !["SEAT", "BERTH"].includes(element.kind)) return;
    drag.current = { pointerId: event.pointerId, elementId: element.elementId, startX: event.clientX, startY: event.clientY, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDraggingId(element.elementId);
  }
  function trackMove(event: PointerEvent<HTMLButtonElement>) {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    if (Math.hypot(event.clientX - current.startX, event.clientY - current.startY) > 5) {
      current.moved = true;
      event.preventDefault();
    }
  }
  function finishMove(event: PointerEvent<HTMLButtonElement>) {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (current.moved) {
      const target = document.elementsFromPoint(event.clientX, event.clientY)
        .find((item) => item instanceof HTMLElement && item.dataset.layoutCell === "true") as HTMLElement | undefined;
      if (target?.dataset.sectionId === section.sectionId) {
        onMove(section.sectionId, current.elementId, Number(target.dataset.x), Number(target.dataset.y));
      }
      suppressClick.current = true;
    }
    drag.current = null;
    setDraggingId(null);
  }
  return <section className="min-w-0 rounded-3xl border border-white/10 bg-[#0d1010] p-4 shadow-2xl">
    <div className="mb-4 flex items-center justify-between gap-3">
      <div><p className="text-sm font-bold text-white">{sectionLabel(section)}</p><p className="text-[10px] uppercase tracking-[0.2em] text-white/35">Front at top</p></div>
      <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-bold text-white/45">{section.elements.filter((e) => e.kind === "SEAT" || e.kind === "BERTH").length} places</span>
    </div>
    <div className="mx-auto grid max-w-[360px] gap-1.5 rounded-[2rem] border-2 border-white/10 bg-black/25 p-3"
      style={{ gridTemplateColumns: `repeat(${section.widthUnits}, minmax(32px, 1fr))`, gridTemplateRows: `repeat(${section.heightUnits}, 38px)` }}>
      {cells.map(({ x, y }) => <button key={`${x}:${y}`} type="button" data-layout-cell="true" data-section-id={section.sectionId} data-x={x} data-y={y} aria-label={`Grid ${x + 1}, ${y + 1}`}
        onClick={() => { const hit = section.elements.find((e) => x >= e.position.x && x < e.position.x + e.size.width && y >= e.position.y && y < e.position.y + e.size.height); if (tool === "SELECT") onSelect(hit?.elementId || null); else onChange(applyTool(layout, section.sectionId, x, y, tool)); }}
        className="rounded-lg border border-dashed border-white/[0.06] bg-white/[0.015] hover:border-white/20" />)}
      {section.elements.map((element) => <button key={element.elementId} type="button" onPointerDown={(event) => beginMove(event, element)} onPointerMove={trackMove} onPointerUp={finishMove} onPointerCancel={finishMove} onClick={() => { if (suppressClick.current) { suppressClick.current = false; return; } if (tool === "SELECT") onSelect(element.elementId); else onChange(applyTool(layout, section.sectionId, element.position.x, element.position.y, tool)); }}
        className={cn("z-10 flex min-w-0 touch-none select-none items-center justify-center gap-1 rounded-lg border text-[10px] font-black shadow-lg transition hover:brightness-125", colors[element.kind], selectedId === element.elementId && "ring-2 ring-[#D3D925] ring-offset-2 ring-offset-black", draggingId === element.elementId && "scale-105 opacity-70 ring-2 ring-[#D3D925]")}
        style={{ gridColumn: `${element.position.x + 1} / span ${element.size.width}`, gridRow: `${element.position.y + 1} / span ${element.size.height}` }}>
        {content(element)}
      </button>)}
    </div>
  </section>;
}

export default function SeatLayoutCanvas(props: {
  layout: SeatLayoutV3; tool: BuilderTool; selectedId: string | null;
  onChange: (layout: SeatLayoutV3) => void; onSelect: (id: string | null) => void;
  onMove: (sectionId: string, elementId: string, x: number, y: number) => void;
}) {
  return <div>
    <div className="mb-3 flex items-center gap-2 text-xs text-white/40"><Gauge className="size-3.5" />Decks are shown side by side; berth length is physical grid length.</div>
    <div className={cn("grid gap-4", props.layout.sections.length > 1 && "xl:grid-cols-2")}>{props.layout.sections.map((section) => <Deck key={section.sectionId} section={section} {...props} />)}</div>
  </div>;
}
