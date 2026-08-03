import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  LayoutGrid, Pencil, Trash2, RotateCcw, BedDouble, Star, Accessibility,
  DoorOpen, ChevronLeft, Check, Armchair, Plus,
  Hash, ListPlus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/* ─── Types ─────────────────────────────────────────────────────────────── */
export type SeatType = "STANDARD" | "SLEEPER_LOWER" | "SLEEPER_UPPER" | "SEMI_SLEEPER" | "SOFA" | "PRIORITY";
export type CellType = "SEAT" | "AISLE" | "EMPTY" | "DRIVER" | "DOOR";
export type RowType = "DRIVER_CABIN" | "DOOR_ROW" | "SPACER" | "SEAT_ROW" | "BACK_ROW";
export type BusShape = "SINGLE_DECKER" | "DOUBLE_DECKER" | "SLEEPER_COACH" | "MINI";
export type LabelScheme = "KA_KHA" | "ALPHA_NUM" | "NUMERIC";

export interface SeatCell {
  colIndex: number; cellType: CellType; seatId: string | null;
  seatLabel: string | null; labelScheme?: LabelScheme; seatType: SeatType; isActive: boolean;
  zone?: "LEFT" | "RIGHT" | "BACK" | "DOOR_ADJACENT" | null;
}
export interface BusRow { 
  rowIndex: number; rowType: RowType; rowLabel?: string | null; hasKaKha?: boolean; cells: SeatCell[]; 
}
export interface BusFloor { floorIndex: number; rows: BusRow[]; }
export interface SeatConfig { 
  busShape: BusShape; layoutVariant?: "2x2" | "2x1" | "1x1" | "SLEEPER"; 
  hasKaKha?: boolean; totalColumns?: number; floors: BusFloor[]; 
}

/* ─── Seat Meta ──────────────────────────────────────────────────────────── */
const META: Record<SeatType, { label: string; bg: string; border: string; text: string; glow: string; icon?: React.ReactNode }> = {
  STANDARD:      { label: "Standard",     bg: "bg-slate-700",  border: "border-slate-500", text: "text-slate-100", glow: "shadow-slate-500/40" },
  SLEEPER_LOWER: { label: "Sleeper Low",  bg: "bg-violet-800", border: "border-violet-500", text: "text-violet-100", glow: "shadow-violet-500/40", icon: <BedDouble className="w-3 h-3" /> },
  SLEEPER_UPPER: { label: "Sleeper Up",   bg: "bg-indigo-800", border: "border-indigo-500", text: "text-indigo-100", glow: "shadow-indigo-500/40", icon: <BedDouble className="w-3 h-3 opacity-70" /> },
  SEMI_SLEEPER:  { label: "Semi-Sleeper", bg: "bg-teal-800",   border: "border-teal-500",   text: "text-teal-100",   glow: "shadow-teal-500/40" },
  SOFA:          { label: "Sofa / VIP",   bg: "bg-amber-700",  border: "border-amber-400",  text: "text-amber-100",  glow: "shadow-amber-500/40", icon: <Star className="w-3 h-3" /> },
  PRIORITY:      { label: "Priority",     bg: "bg-rose-700",   border: "border-rose-500",   text: "text-rose-100",   glow: "shadow-rose-500/40", icon: <Accessibility className="w-3 h-3" /> },
};

/* ─── Helpers ────────────────────────────────────────────────────────────── */
let _sc = 0;
const mkSeat   = (col: number, type: SeatType, label: string): SeatCell => ({ colIndex: col, cellType: "SEAT", seatId: `S${++_sc}`, seatLabel: label, seatType: type, isActive: true });
const mkAisle  = (col: number): SeatCell => ({ colIndex: col, cellType: "AISLE", seatId: null, seatLabel: null, seatType: "STANDARD", isActive: true });
const mkEmpty  = (col: number): SeatCell => ({ colIndex: col, cellType: "EMPTY", seatId: null, seatLabel: null, seatType: "STANDARD", isActive: true });
const mkDriver = (col: number): SeatCell => ({ colIndex: col, cellType: "DRIVER", seatId: null, seatLabel: "DRV", seatType: "STANDARD", isActive: true });
const mkDoor   = (col: number): SeatCell => ({ colIndex: col, cellType: "DOOR", seatId: null, seatLabel: "Door", seatType: "STANDARD", isActive: true });

function buildConfig(
  shape: BusShape,
  layout: "2x2" | "2x1" | "1x1" | "SLEEPER",
  hasKaKha: boolean,
  rowCount: number,
  left: number,
  right: number,
  type: SeatType = "STANDARD",
  scheme: LabelScheme = "ALPHA_NUM"
): SeatConfig {
  _sc = 0;
  const totalCols = left + 1 + right;
  const rows: BusRow[] = [
    {
      rowIndex: 0, rowType: "DRIVER_CABIN",
      cells: Array.from({ length: totalCols }, (_, i) =>
        i === totalCols - 1 ? mkDriver(i) : i === 0 ? mkDoor(i) : mkEmpty(i)
      )
    }
  ];

  if (hasKaKha) {
    const cells: SeatCell[] = Array.from({ length: totalCols }, (_, i) => {
      if (i === left) return mkAisle(i);
      if (i < left) return mkEmpty(i);
      const idx = i - left - 1;
      if (idx === 0) return mkSeat(i, type, "ka");
      if (idx === 1) return mkSeat(i, type, "kha");
      return mkEmpty(i);
    });
    rows.push({ rowIndex: rows.length, rowType: "DOOR_ROW", hasKaKha: true, cells });
  }

  let leftCtr = 1, rightCtr = 1, numCtr = 1;

  for (let r = 0; r < rowCount; r++) {
    const cells: SeatCell[] = [];
    for (let l = 0; l < left; l++)
      cells.push(mkSeat(l, type, scheme === "NUMERIC" ? `${numCtr++}` : `A${leftCtr++}`));
    cells.push(mkAisle(left));
    for (let ri = 0; ri < right; ri++)
      cells.push(mkSeat(left + 1 + ri, type, scheme === "NUMERIC" ? `${numCtr++}` : `B${rightCtr++}`));
    rows.push({ rowIndex: rows.length, rowType: "SEAT_ROW", cells });
  }

  const backCells: SeatCell[] = Array.from({ length: totalCols }, (_, b) =>
    mkSeat(b, type, `Z${b + 1}`)
  );
  rows.push({ rowIndex: rows.length, rowType: "BACK_ROW", cells: backCells });

  return { busShape: shape, layoutVariant: layout, hasKaKha, totalColumns: totalCols, floors: [{ floorIndex: 0, rows }] };
}

const TEMPLATES = [
  { id: "std-2x2", name: "Standard 2×2", sub: "37 seats · Ka/Kha", shape: "SINGLE_DECKER" as BusShape, layout: "2x2", hasKaKha: true, badge: "Popular", gen: () => buildConfig("SINGLE_DECKER", "2x2", true, 8, 2, 2) },
  { id: "std-2x1", name: "Standard 2×1", sub: "27 seats", shape: "SINGLE_DECKER" as BusShape, layout: "2x1", hasKaKha: false, badge: "", gen: () => buildConfig("SINGLE_DECKER", "2x1", false, 8, 2, 1) },
  { id: "sleeper", name: "Sleeper Coach", sub: "36 berths", shape: "SLEEPER_COACH" as BusShape, layout: "SLEEPER", hasKaKha: false, badge: "Premium", gen: () => buildConfig("SLEEPER_COACH", "2x2", false, 8, 2, 2, "SLEEPER_LOWER") },
  { id: "vip", name: "VIP / Sofa", sub: "20 luxury sofa seats", shape: "SINGLE_DECKER" as BusShape, layout: "1x1", hasKaKha: false, badge: "Luxury", gen: () => buildConfig("SINGLE_DECKER", "1x1", false, 9, 1, 1, "SOFA") },
  { id: "hiace", name: "Hiace / Microbus", sub: "15 seats", shape: "MINI" as BusShape, layout: "2x1", hasKaKha: false, badge: "", gen: () => buildConfig("MINI", "2x1", false, 4, 2, 1) },
];

function countSeats(cfg: SeatConfig | null) {
  if (!cfg || !cfg.floors || !Array.isArray(cfg.floors)) return 0;
  return cfg.floors.flatMap(f => f.rows || []).flatMap(r => r.cells || []).filter(c => c.cellType === "SEAT").length;
}

/* ─── Cell Component ─────────────────────────────────────────────────────── */
const Cell: React.FC<{ cell: SeatCell; selected: boolean; onClick: () => void; isScratch?: boolean }> = ({ cell, selected, onClick, isScratch }) => {
  if (cell.cellType === "AISLE") return (
    <div className={cn("w-8 flex-shrink-0 flex items-center justify-center group/aisle", isScratch && "hover:bg-slate-800/50 cursor-pointer rounded-md")} onClick={isScratch ? onClick : undefined}>
        {isScratch && <div className="w-1 h-4 bg-slate-700 group-hover/aisle:bg-slate-500 rounded-full transition-colors" />}
    </div>
  );

  if (cell.cellType === "EMPTY") return (
    <div className={cn("w-10 h-12 flex-shrink-0 flex items-center justify-center", isScratch && "border-2 border-dashed border-slate-800 hover:bg-slate-800/30 cursor-pointer rounded-xl group/empty")} onClick={onClick}>
        {isScratch && <Plus className="w-4 h-4 text-slate-700 group-hover/empty:text-slate-400 transition-colors" />}
    </div>
  );

  if (cell.cellType === "DRIVER") return (
    <div className="w-10 h-12 flex-shrink-0 rounded-xl bg-gradient-to-b from-slate-600 to-slate-800 border border-slate-500 flex flex-col items-center justify-center gap-0.5 shadow-md">
      <div className="w-5 h-5 rounded-full border-2 border-slate-400 flex items-center justify-center">
        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
      </div>
      <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">DRV</span>
    </div>
  );

  if (cell.cellType === "DOOR") return (
    <TooltipProvider delayDuration={100}><Tooltip>
      <TooltipTrigger asChild>
        <div className={cn(
            "w-10 h-12 flex-shrink-0 rounded-xl border-2 border-dashed border-emerald-500/60 bg-emerald-950/40 flex flex-col items-center justify-center gap-1 cursor-default shadow-inner",
            isScratch && "cursor-pointer hover:bg-emerald-900/40"
        )} onClick={isScratch ? onClick : undefined}>
          <DoorOpen className="w-4 h-4 text-emerald-400" />
          <span className="text-[7px] font-black text-emerald-400 uppercase tracking-wider">Entry</span>
        </div>
      </TooltipTrigger>
      <TooltipContent><p className="text-xs font-bold">Entry Door</p></TooltipContent>
    </Tooltip></TooltipProvider>
  );

  const isKaKha = cell.seatLabel?.toLowerCase() === "ka" || cell.seatLabel?.toLowerCase() === "kha";
  const m = isKaKha ? { ...META[cell.seatType], bg: "bg-emerald-700", border: "border-emerald-500", text: "text-emerald-100", glow: "shadow-emerald-500/40" } : META[cell.seatType];

  return (
    <TooltipProvider delayDuration={100}><Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          className={cn(
            "w-10 h-12 flex-shrink-0 rounded-xl border-2 flex flex-col items-center justify-center gap-0.5 relative overflow-hidden",
            "transition-all duration-150 cursor-pointer select-none",
            "hover:scale-110 hover:brightness-125 hover:z-10",
            "active:scale-95",
            m.bg, m.border, m.text,
            selected && `ring-2 ring-offset-2 ring-offset-slate-900 ring-white scale-110 shadow-lg z-10 ${m.glow}`
          )}
        >
          {/* Headrest indicator for top-down view */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-black/20" />
          
          <div className="mt-1">{m.icon}</div>
          <span className="text-[10px] font-black leading-none z-10">{cell.seatLabel}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="font-bold text-xs">{cell.seatLabel} · {m.label}</TooltipContent>
    </Tooltip></TooltipProvider>
  );
};

/* ─── Main Component ─────────────────────────────────────────────────────── */
interface SeatMapBuilderProps {
  value: SeatConfig | null;
  onChange: (config: SeatConfig, totalSeats: number) => void;
  busType?: string;
  readOnly?: boolean;
}

const SeatMapBuilder: React.FC<SeatMapBuilderProps> = ({ value, onChange, busType: _busType, readOnly }) => {
  const [mode, setMode] = useState<"template" | "canvas" | "scratch_config">("template");
  const [config, setConfig] = useState<SeatConfig | null>(value);
  const [activeFloor, setActiveFloor] = useState(0);
  const [sel, setSel] = useState<{ fi: number; ri: number; ci: number } | null>(null);
  const [fading, setFading] = useState(false);
  const [isScratchMode, setIsScratchMode] = useState(false);

  // Scratch config state
  const [scColsLeft, setScColsLeft] = useState(2);
  const [scColsRight, setScColsRight] = useState(2);
  const [scHasKaKha, setScHasKaKha] = useState(true);
  const [scRows, setScRows] = useState(8);

  // Hydrate canvas when a pre-existing value is injected (e.g. UpdateSeatTemplateModal)
  useEffect(() => {
    if (value) {
      setConfig(value);
      setMode("canvas");
      setIsScratchMode(false);
      setSel(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value?.["busShape" as keyof SeatConfig]]);

  // Derived seat count — single source of truth
  const totalSeats = config ? countSeats(config) : 0;

  // Propagate config changes upward (skip on first render when config is null)
  useEffect(() => {
    if (config) onChange(config, countSeats(config));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  const applyTemplate = (t: typeof TEMPLATES[0]) => {
    setFading(true); setSel(null); _sc = 0; setIsScratchMode(false);
    setTimeout(() => { setConfig(t.gen()); setActiveFloor(0); setMode("canvas"); setFading(false); }, 120);
  };

  const startScratchWizard = () => {
    setMode("scratch_config");
  };

  const generateScratchLayout = () => {
    setFading(true); setSel(null); setIsScratchMode(true);
    setTimeout(() => { 
        const layoutName = `${scColsLeft}x${scColsRight}` as any;
        setConfig(buildConfig("SINGLE_DECKER", layoutName, scHasKaKha, scRows, scColsLeft, scColsRight)); 
        setActiveFloor(0); 
        setMode("canvas"); 
        setFading(false); 
    }, 120);
  };

  const cellAt = (fi: number, ri: number, ci: number) => config?.floors[fi]?.rows[ri]?.cells[ci] ?? null;
  const selCell = sel ? cellAt(sel.fi, sel.ri, sel.ci) : null;

  const updateCell = (fi: number, ri: number, ci: number, update: Partial<SeatCell>) => {
    setConfig(prev => {
        if (!prev) return prev;
        const next: SeatConfig = JSON.parse(JSON.stringify(prev));
        const cell = next.floors[fi].rows[ri].cells[ci];
        Object.assign(cell, update);
        return next;
    });
  };

  const toggleCellScratch = (fi: number, ri: number, ci: number) => {
    const cell = cellAt(fi, ri, ci);
    if (!cell) return;

    if (cell.cellType === "EMPTY") {
        updateCell(fi, ri, ci, { cellType: "SEAT", seatType: "STANDARD", seatLabel: "?", seatId: `S${++_sc}` });
    } else if (cell.cellType === "SEAT") {
        updateCell(fi, ri, ci, { cellType: "AISLE", seatId: null, seatLabel: null });
    } else if (cell.cellType === "AISLE") {
        updateCell(fi, ri, ci, { cellType: "DOOR", seatId: null, seatLabel: "Door" });
    } else {
        updateCell(fi, ri, ci, { cellType: "EMPTY", seatId: null, seatLabel: null });
    }
    setSel({ fi, ri, ci });
  };

  const autoLabelSeats = (scheme: LabelScheme = "ALPHA_NUM") => {
    setConfig(prev => {
        if (!prev) return prev;
        const next: SeatConfig = JSON.parse(JSON.stringify(prev));
        const floor = next.floors[activeFloor];
        let leftCtr = 1, rightCtr = 1, numCtr = 1;

        floor.rows.forEach(row => {
            if (row.rowType === "DRIVER_CABIN" || row.rowType === "SPACER") return;

            if (row.hasKaKha) {
                let isKa = true;
                row.cells.forEach(cell => {
                    if (cell.cellType === "SEAT") { cell.seatLabel = isKa ? "ka" : "kha"; isKa = false; }
                });
                return;
            }

            if (row.rowType === "BACK_ROW") {
                let zCtr = 1;
                row.cells.forEach(cell => { if (cell.cellType === "SEAT") cell.seatLabel = `Z${zCtr++}`; });
                return;
            }

            if (scheme === "NUMERIC") {
                row.cells.forEach(cell => { if (cell.cellType === "SEAT") cell.seatLabel = `${numCtr++}`; });
            } else {
                let passedAisle = false;
                row.cells.forEach(cell => {
                    if (cell.cellType === "AISLE") { passedAisle = true; return; }
                    if (cell.cellType === "SEAT")
                        cell.seatLabel = passedAisle ? `B${rightCtr++}` : `A${leftCtr++}`;
                });
            }
        });
        return next;
    });
    toast.success("Seats re-labeled automatically!");
  };

  const addRow = (position: "top" | "bottom") => {
    setConfig(prev => {
        if (!prev) return prev;
        const next: SeatConfig = JSON.parse(JSON.stringify(prev));
        const floor = next.floors[activeFloor];
        const colCount = next.totalColumns || 5;
        const leftCount = Math.floor(colCount / 2);
        
        const newCells = Array.from({ length: colCount }, (_, i) => {
            if (i === leftCount) return mkAisle(i);
            return mkEmpty(i);
        });

        const newRow: BusRow = { rowIndex: 0, rowType: "SEAT_ROW", cells: newCells };

        if (position === "bottom") {
            // Insert before the BACK_ROW if it exists, else at the end
            const backRowIndex = floor.rows.findIndex(r => r.rowType === "BACK_ROW");
            if (backRowIndex !== -1) {
                floor.rows.splice(backRowIndex, 0, newRow);
            } else {
                floor.rows.push(newRow);
            }
        } else {
            // Insert after DRIVER_CABIN
            floor.rows.splice(1, 0, newRow);
        }
        
        // Re-index
        floor.rows.forEach((r, i) => r.rowIndex = i);
        return next;
    });
    toast.success("Row added");
  };

  const deleteRow = (ri: number) => {
    setConfig(prev => {
        if (!prev) return prev;
        const next: SeatConfig = JSON.parse(JSON.stringify(prev));
        const floor = next.floors[activeFloor];
        if (floor.rows.length <= 1) return prev;
        floor.rows.splice(ri, 1);
        floor.rows.forEach((r, i) => r.rowIndex = i);
        return next;
    });
    setSel(null);
  };

  /* ── TEMPLATE PICKER ── */
  if (mode === "template") return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-black text-foreground">Choose a Layout Template</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Start with a realistic Nepali bus layout</p>
        </div>
        <Button type="button" variant="outline" size="sm" className="font-black text-xs uppercase tracking-widest gap-1.5" onClick={startScratchWizard}>
          <Pencil className="w-3 h-3" /> Build from Scratch
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {TEMPLATES.map(t => (
          <button key={t.id} type="button" onClick={() => applyTemplate(t)}
            className="group relative p-5 rounded-2xl border-2 border-muted bg-background hover:border-primary/60 hover:bg-primary/5 hover:shadow-xl hover:shadow-primary/10 transition-all duration-200 text-left overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            {t.badge && (
              <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest border border-primary/20">{t.badge}</span>
            )}
            <div className="relative space-y-3">
              {/* Mini SVG representation of the bus */}
              <div className="h-16 bg-slate-900 rounded-lg border border-slate-700 flex flex-col items-center justify-center p-2 opacity-80 group-hover:opacity-100 transition-opacity overflow-hidden">
                 <div className="w-full flex justify-between px-1 mb-1">
                    <div className="w-2 h-2 rounded-sm bg-emerald-500/50" /> {/* Door */}
                    <div className="w-3 h-3 rounded-full bg-slate-500/50" /> {/* Driver */}
                 </div>
                 {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex gap-1 mb-1">
                        {Array.from({ length: parseInt(t.layout[0]) }).map((_, j) => <div key={`l-${j}`} className="w-2 h-3 rounded-sm bg-primary/60" />)}
                        <div className="w-2 h-3" /> {/* Aisle */}
                        {Array.from({ length: parseInt(t.layout[2]) }).map((_, j) => <div key={`r-${j}`} className="w-2 h-3 rounded-sm bg-primary/60" />)}
                    </div>
                 ))}
              </div>
              <div>
                <p className="font-black text-sm text-foreground group-hover:text-primary transition-colors">{t.name}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{t.sub}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  /* ── SCRATCH CONFIGURATOR ── */
  if (mode === "scratch_config") return (
      <div className="space-y-6 animate-in fade-in duration-200 p-6 bg-muted/20 rounded-2xl border border-muted max-w-2xl mx-auto">
          <div className="text-center space-y-1 mb-6">
              <h3 className="text-xl font-black text-foreground">Scratch Builder</h3>
              <p className="text-sm text-muted-foreground">Configure the base structure of your vehicle</p>
          </div>

          <div className="space-y-6">
              <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-primary">Columns (Left / Right of Aisle)</label>
                  <div className="flex gap-4">
                      <div className="flex-1 p-4 rounded-xl border-2 bg-background flex flex-col items-center gap-2">
                          <span className="text-xs font-bold text-muted-foreground">Left Side</span>
                          <Input type="number" min={1} max={3} value={scColsLeft} onChange={e => setScColsLeft(parseInt(e.target.value)||1)} className="text-center font-black text-lg" />
                      </div>
                      <div className="flex-shrink-0 flex items-center justify-center w-8 text-muted-foreground font-black">AISLE</div>
                      <div className="flex-1 p-4 rounded-xl border-2 bg-background flex flex-col items-center gap-2">
                          <span className="text-xs font-bold text-muted-foreground">Right Side</span>
                          <Input type="number" min={1} max={3} value={scColsRight} onChange={e => setScColsRight(parseInt(e.target.value)||1)} className="text-center font-black text-lg" />
                      </div>
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-primary">Rows</label>
                      <Input type="number" min={3} max={20} value={scRows} onChange={e => setScRows(parseInt(e.target.value)||8)} className="font-black" />
                  </div>
                  <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-primary">Labeling</label>
                      <button type="button" onClick={() => setScHasKaKha(!scHasKaKha)} className={cn("w-full h-10 rounded-md border-2 font-bold text-sm transition-colors", scHasKaKha ? "bg-primary/10 border-primary text-primary" : "bg-background border-muted text-muted-foreground")}>
                          {scHasKaKha ? "Includes Ka/Kha row" : "Standard numbering only"}
                      </button>
                  </div>
              </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-muted/50">
              <Button type="button" variant="ghost" onClick={() => setMode("template")} className="flex-1 font-bold">Cancel</Button>
              <Button type="button" onClick={generateScratchLayout} className="flex-1 font-black uppercase tracking-widest">Generate Canvas</Button>
          </div>
      </div>
  );

  /* ── CANVAS ── */
  const floor = config?.floors?.[activeFloor];

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-200">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-muted/20 p-3 rounded-xl border">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
            <LayoutGrid className="w-4 h-4 text-primary" />
          </div>
          <div>
            <span className="text-sm font-black">{(config?.busShape || "").replace(/_/g, " ")} {isScratchMode && <Badge variant="secondary" className="ml-2 bg-amber-100 text-amber-700 border-amber-200">Builder Mode</Badge>}</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                <span className="text-[10px] font-black text-primary">{totalSeats} seats</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
            {!readOnly && isScratchMode && (
                <div className="flex items-center gap-1 bg-background p-1 rounded-xl border shadow-sm mr-2">
                    <Button type="button" variant="ghost" size="sm" className="h-8 text-[10px] font-black uppercase tracking-widest px-2" onClick={() => autoLabelSeats("NUMERIC")}>
                        <Hash className="w-3 h-3 mr-1" /> Re-Label
                    </Button>
                    <div className="w-px h-4 bg-muted mx-1" />
                    <Button type="button" variant="ghost" size="sm" className="h-8 text-[10px] font-black uppercase tracking-widest px-2" onClick={() => addRow("bottom")}>
                        <ListPlus className="w-3 h-3 mr-1" /> Add Row
                    </Button>
                </div>
            )}

            {!readOnly && (
              <>
                <Button type="button" variant="outline" size="sm" className="font-bold text-xs gap-1" onClick={() => setMode("template")}>
                  <ChevronLeft className="w-3 h-3" /> Change Layout
                </Button>
                <Button type="button" variant="ghost" size="sm" className="font-bold text-xs text-destructive hover:text-destructive hover:bg-destructive/10 gap-1" onClick={() => { setConfig(null); setMode("template"); setSel(null); }}>
                  <RotateCcw className="w-3 h-3" /> Reset
                </Button>
              </>
            )}
        </div>
      </div>

      {/* Main layout: canvas + sidebar */}
      <div className="flex gap-5 items-start">
        {/* Canvas Area */}
        <div className="flex-1 overflow-auto rounded-[2rem] bg-[#0f172a] border-[8px] border-[#334155] shadow-2xl relative custom-bus-scroll">
          {/* Inner wall shadow */}
          <div className="absolute inset-0 shadow-[0_0_0_2px_#1e293b_inset] pointer-events-none rounded-[1.5rem]" />
          
          {/* Windows indicators */}
          <div className="absolute top-20 bottom-20 left-[-8px] border-l-[3px] border-[#475569]" />
          <div className="absolute top-20 bottom-20 right-[-8px] border-r-[3px] border-[#475569]" />

          <div className={cn("inline-flex flex-col gap-3 p-8 min-w-full transition-opacity duration-200", fading && "opacity-0")}>

            {/* Front Bumper Area */}
            <div className="flex items-center justify-center mb-2">
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] bg-slate-900/50 px-4 py-1 rounded-full border border-slate-700">↑ Front</span>
            </div>

            {/* Column headers — shown once above first seat row */}
            {(() => {
              const firstSeatRow = (floor?.rows || []).find(r => r.rowType === "SEAT_ROW");
              if (!firstSeatRow || !config?.totalColumns) return null;
              const left = Math.floor((config.totalColumns - 1) / 2);
              const right = config.totalColumns - 1 - left;
              return (
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  {Array.from({ length: left }).map((_, i) => (
                    <div key={`lh-${i}`} className="w-10 flex justify-center">
                      {i === 0 && <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">A</span>}
                    </div>
                  ))}
                  <div className="w-8" />
                  {Array.from({ length: right }).map((_, i) => (
                    <div key={`rh-${i}`} className="w-10 flex justify-center">
                      {i === 0 && <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">B</span>}
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* Rows */}
            {(() => {
              let seatRowNum = 0;
              return (floor?.rows || []).map(row => {
                const isSeatRow = row.rowType === "SEAT_ROW";
                const isBackRow = row.rowType === "BACK_ROW";
                if (isSeatRow) seatRowNum++;
                return (
                  <div key={row.rowIndex} className="flex items-center justify-center gap-2 group/row relative">

                    {/* Row number on left */}
                    <div className="absolute -left-8 w-6 flex items-center justify-end">
                      {isSeatRow && (
                        <span className="text-[8px] font-black text-slate-600 tabular-nums">{seatRowNum}</span>
                      )}
                      {isBackRow && (
                        <span className="text-[7px] font-black text-slate-600 uppercase tracking-wide">Z</span>
                      )}
                      {isScratchMode && isSeatRow && (
                        <Button type="button" variant="ghost" size="icon" className="w-5 h-5 rounded-full opacity-0 group-hover/row:opacity-100 text-slate-500 hover:text-rose-500 hover:bg-rose-500/20 ml-1" onClick={() => deleteRow(row.rowIndex)}>
                          <Trash2 className="w-2.5 h-2.5" />
                        </Button>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 relative">
                      {(row.cells || []).map(cell => (
                        <Cell key={cell.colIndex} cell={cell}
                          isScratch={isScratchMode && !readOnly}
                          selected={sel?.fi === activeFloor && sel?.ri === row.rowIndex && sel?.ci === cell.colIndex}
                          onClick={() => {
                            if (readOnly) return;
                            if (isScratchMode) toggleCellScratch(activeFloor, row.rowIndex, cell.colIndex);
                            else {
                              if (cell.cellType !== "SEAT") { setSel(null); return; }
                              setSel({ fi: activeFloor, ri: row.rowIndex, ci: cell.colIndex });
                            }
                          }}
                        />
                      ))}
                    </div>
                  </div>
                );
              });
            })()}

            {/* Rear Bumper Area */}
            <div className="flex items-center justify-center mt-4 pt-4 border-t border-slate-800/50">
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] bg-slate-900/50 px-4 py-1 rounded-full border border-slate-700">↓ Rear</span>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        {!readOnly && (
          <div className="w-56 flex-shrink-0 space-y-3 sticky top-0">
            {selCell && selCell.cellType === "SEAT" ? (
              <div className="space-y-3 animate-in slide-in-from-right-2 duration-150">
                <div className="p-4 rounded-xl bg-muted/40 border-2 border-primary/20 shadow-sm space-y-2">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Seat Label</p>
                  <Input
                    className="h-10 font-black text-lg bg-background border-primary/30 text-foreground text-center"
                    value={selCell.seatLabel || ""}
                    onChange={(e) => updateCell(sel!.fi, sel!.ri, sel!.ci, { seatLabel: e.target.value })}
                    placeholder="e.g. A1"
                  />
                  <p className="text-[9px] text-muted-foreground/60 text-center">A1 · B3 · ka · 12 · Z2</p>
                </div>
                <div className="bg-background p-3 rounded-xl border space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-2">Seat Class</p>
                  {(Object.keys(META) as SeatType[]).map(type => {
                    const m = META[type];
                    const active = selCell.seatType === type;
                    return (
                      <button key={type} type="button" onClick={() => updateCell(sel!.fi, sel!.ri, sel!.ci, { seatType: type })}
                        className={cn(
                          "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-left transition-all duration-150 text-xs font-bold",
                          active ? `${m.bg} ${m.border} ${m.text} shadow-md` : "border-transparent hover:bg-muted/50 text-muted-foreground"
                        )}>
                        {active ? <Check className="w-3 h-3 flex-shrink-0" /> : <span className="w-3 h-3 flex-shrink-0" />}
                        {m.icon ?? <Armchair className="w-3 h-3 flex-shrink-0 opacity-60" />}
                        {m.label}
                      </button>
                    );
                  })}
                </div>
                <Button type="button" variant="outline"
                  onClick={() => { updateCell(sel!.fi, sel!.ri, sel!.ci, { cellType: "EMPTY", seatId: null, seatLabel: null }); setSel(null); }}
                  className="w-full text-xs font-bold text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10 gap-2 h-9">
                  <Trash2 className="w-3.5 h-3.5" /> Remove Seat
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-background border rounded-xl p-3 space-y-2">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-3">Auto-Label All Seats</p>
                  <button type="button" onClick={() => autoLabelSeats("ALPHA_NUM")}
                    className="w-full flex items-start gap-2.5 p-2.5 rounded-lg border-2 border-primary/20 hover:border-primary/60 hover:bg-primary/5 transition-all text-left group">
                    <div className="mt-0.5 flex gap-0.5">
                      <span className="text-[9px] font-black bg-slate-700 text-slate-100 px-1 py-0.5 rounded">A1</span>
                      <span className="text-[9px] font-black bg-slate-700 text-slate-100 px-1 py-0.5 rounded">B1</span>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-foreground group-hover:text-primary">Column Style</p>
                      <p className="text-[9px] text-muted-foreground">A = left · B = right · Z = back</p>
                    </div>
                  </button>
                  <button type="button" onClick={() => autoLabelSeats("NUMERIC")}
                    className="w-full flex items-start gap-2.5 p-2.5 rounded-lg border-2 border-muted hover:border-primary/40 hover:bg-muted/30 transition-all text-left group">
                    <span className="text-[9px] font-black bg-muted text-muted-foreground px-1 py-0.5 rounded mt-0.5">1 2 3</span>
                    <div>
                      <p className="text-[10px] font-black text-foreground group-hover:text-primary">Sequential</p>
                      <p className="text-[9px] text-muted-foreground">1, 2, 3… across all rows</p>
                    </div>
                  </button>
                  {isScratchMode && (
                    <button type="button" onClick={() => addRow("bottom")}
                      className="w-full flex items-center gap-2 p-2 rounded-lg border-2 border-dashed border-muted hover:border-primary/40 hover:bg-muted/20 transition-all group">
                      <ListPlus className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary" />
                      <p className="text-[10px] font-black text-muted-foreground group-hover:text-primary">Add Row</p>
                    </button>
                  )}
                </div>
                <div className="bg-muted/10 border rounded-xl p-3">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-2">Seat Types</p>
                  <div className="space-y-1.5">
                    {(Object.keys(META) as SeatType[]).map(type => (
                      <div key={type} className="flex items-center gap-2">
                        <div className={cn("w-3 h-4 rounded-[3px] border flex-shrink-0", META[type].bg, META[type].border)} />
                        <span className="text-[9px] font-semibold text-muted-foreground">{META[type].label}</span>
                      </div>
                    ))}
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-4 rounded-[3px] border-2 border-emerald-500 bg-emerald-700 flex-shrink-0" />
                      <span className="text-[9px] font-semibold text-muted-foreground">Ka / Kha (Door)</span>
                    </div>
                  </div>
                  <p className="text-[8px] text-muted-foreground/50 mt-2 leading-relaxed">Click any seat to rename or change its class.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SeatMapBuilder;
