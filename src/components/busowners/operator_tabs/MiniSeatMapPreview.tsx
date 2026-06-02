import React from "react";
import { SeatConfig, SeatType, CellType } from "./SeatMapBuilder";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/* ─── Public interface ──────────────────────────────────────────────────── */
export interface MiniSeatMapPreviewProps {
  /** The full seatConfig JSON produced by SeatMapBuilder */
  config: SeatConfig;
  /** Visual scale: xs = tiny table thumbnail, sm = card preview, md = default, lg = full-size modal view */
  size?: "xs" | "sm" | "md" | "lg";
  /** Show seat labels (only meaningful at md and lg) */
  showLabels?: boolean;
  /**
   * For the passenger booking engine — pass an array of seatIds to mark as
   * already booked. They render with a distinct "taken" treatment.
   */
  bookedSeatIds?: string[];
  className?: string;
}

/* ─── Color tokens — mirror SeatMapBuilder META exactly ─────────────────── */
const SEAT_META: Record<SeatType, { bg: string; border: string; label: string }> = {
  STANDARD:      { bg: "bg-slate-700",  border: "border-slate-500", label: "Standard" },
  SLEEPER_LOWER: { bg: "bg-violet-800", border: "border-violet-500", label: "Sleeper (Lower)" },
  SLEEPER_UPPER: { bg: "bg-indigo-800", border: "border-indigo-500", label: "Sleeper (Upper)" },
  SEMI_SLEEPER:  { bg: "bg-teal-800",   border: "border-teal-500",   label: "Semi-Sleeper" },
  SOFA:          { bg: "bg-amber-700",  border: "border-amber-400",  label: "Sofa / VIP" },
  PRIORITY:      { bg: "bg-rose-700",   border: "border-rose-500",   label: "Priority" },
};

const KA_KHA_META = { bg: "bg-emerald-700", border: "border-emerald-500", label: "Ka/Kha" };
const BOOKED_META  = { bg: "bg-slate-900",   border: "border-slate-600" };

/* ─── Size scale definitions ─────────────────────────────────────────────── */
interface SizeScale {
  cell:   string; // w+h classes for seat cells
  aisle:  string; // width-only for aisle gap
  empty:  string; // w+h for empty/spacer cells
  rowGap: string; // gap between rows (flex-col gap)
  colGap: string; // gap between cells in a row
  text:   string; // label font-size
  pad:    string; // outer container padding
  radius: string; // container border-radius
  border: string; // container border width
  headH:  string; // headrest strip height
}

const SCALES: Record<"xs" | "sm" | "md" | "lg", SizeScale> = {
  xs: {
    cell:   "w-[6px] h-[8px]",
    aisle:  "w-[5px]",
    empty:  "w-[6px] h-[8px]",
    rowGap: "gap-y-[2px]",
    colGap: "gap-x-[2px]",
    text:   "text-[3px]",
    pad:    "p-[6px]",
    radius: "rounded-[6px]",
    border: "border-[2px]",
    headH:  "h-[15%]",
  },
  sm: {
    cell:   "w-3 h-4",
    aisle:  "w-2",
    empty:  "w-3 h-4",
    rowGap: "gap-y-1",
    colGap: "gap-x-1",
    text:   "text-[5px]",
    pad:    "p-3",
    radius: "rounded-xl",
    border: "border-[3px]",
    headH:  "h-[20%]",
  },
  md: {
    cell:   "w-6 h-8",
    aisle:  "w-4",
    empty:  "w-6 h-8",
    rowGap: "gap-y-1.5",
    colGap: "gap-x-1.5",
    text:   "text-[7px]",
    pad:    "p-4",
    radius: "rounded-2xl",
    border: "border-[4px]",
    headH:  "h-[20%]",
  },
  lg: {
    cell:   "w-10 h-12",
    aisle:  "w-8",
    empty:  "w-10 h-12",
    rowGap: "gap-y-2",
    colGap: "gap-x-1.5",
    text:   "text-[10px]",
    pad:    "p-6",
    radius: "rounded-[2rem]",
    border: "border-[6px]",
    headH:  "h-[17%]",
  },
};

/* ─── Individual cell renderer ──────────────────────────────────────────── */
interface CellNodeProps {
  cellType: CellType;
  seatType: SeatType;
  seatLabel: string | null;
  seatId: string | null;
  scale: SizeScale;
  showLabels: boolean;
  isBooked: boolean;
  withTooltip: boolean;
}

const CellNode: React.FC<CellNodeProps> = ({
  cellType,
  seatType,
  seatLabel,
  seatId,
  scale,
  showLabels,
  isBooked,
  withTooltip,
}) => {
  /* ── Non-seat structural cells ── */
  if (cellType === "AISLE") {
    return <div className={scale.aisle} aria-hidden />;
  }

  if (cellType === "EMPTY") {
    return (
      <div
        className={cn(
          scale.empty,
          "border border-dashed border-slate-700/40 rounded-sm"
        )}
        aria-hidden
      />
    );
  }

  if (cellType === "DRIVER") {
    return (
      <div
        className={cn(
          scale.cell,
          "rounded-sm bg-gradient-to-b from-slate-600 to-slate-800 border border-slate-500",
          "flex flex-col items-center justify-center gap-0.5"
        )}
        title="Driver"
        aria-label="Driver seat"
      >
        {/* Steering wheel glyph — visible at md+ */}
        <div className="w-[40%] aspect-square rounded-full border border-slate-400/70 flex items-center justify-center">
          <div className="w-[30%] aspect-square bg-slate-400/70 rounded-full" />
        </div>
      </div>
    );
  }

  if (cellType === "DOOR") {
    return (
      <div
        className={cn(
          scale.cell,
          "rounded-sm border-2 border-dashed border-emerald-500/70 bg-emerald-950/40"
        )}
        title="Entry Door"
        aria-label="Entry door"
      />
    );
  }

  /* ── Seat cell ── */
  const isKaKha =
    seatLabel?.toLowerCase() === "ka" || seatLabel?.toLowerCase() === "kha";
  const meta = isBooked ? BOOKED_META : isKaKha ? KA_KHA_META : (SEAT_META[seatType] ?? SEAT_META.STANDARD);

  const tooltipText = isBooked
    ? `${seatLabel} · Booked`
    : `${seatLabel ?? seatId} · ${isKaKha ? "Ka/Kha" : SEAT_META[seatType]?.label ?? seatType}`;

  const node = (
    <div
      className={cn(
        scale.cell,
        "rounded-sm border relative overflow-hidden flex flex-col items-center justify-center shadow-sm select-none",
        meta.bg,
        meta.border,
        isBooked && "opacity-40"
      )}
      aria-label={tooltipText}
    >
      {/* Headrest strip — top-view depth cue */}
      <div className={cn("absolute top-0 left-0 right-0 bg-black/25", scale.headH)} />

      {showLabels && seatLabel && (
        <span
          className={cn(
            "font-black text-white z-10 leading-none mt-0.5 drop-shadow-sm",
            scale.text
          )}
        >
          {seatLabel}
        </span>
      )}
    </div>
  );

  if (!withTooltip) return node;

  return (
    <TooltipProvider key={seatId ?? seatLabel ?? "cell"} delayDuration={80}>
      <Tooltip>
        <TooltipTrigger asChild>{node}</TooltipTrigger>
        <TooltipContent side="top" className="text-xs font-bold">
          {tooltipText}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

/* ─── Main export ────────────────────────────────────────────────────────── */
export const MiniSeatMapPreview: React.FC<MiniSeatMapPreviewProps> = ({
  config,
  size = "md",
  showLabels = false,
  bookedSeatIds = [],
  className,
}) => {
  if (!config?.floors?.length) return null;

  const scale = SCALES[size];
  const floor = config.floors[0]; // single-floor view; double-decker support is additive
  const withTooltip = size === "md" || size === "lg";
  const bookedSet = new Set(bookedSeatIds);

  return (
    <div
      className={cn(
        /* Bus body chrome */
        "bg-[#0f172a] shadow-2xl relative inline-flex flex-col items-center",
        "border-[#334155]",
        scale.pad,
        scale.radius,
        scale.border,
        className
      )}
      role="img"
      aria-label={`Bus seat map — ${config.busShape?.replace(/_/g, " ")}`}
    >
      {/* Window strip left */}
      <div className="absolute top-[15%] bottom-[15%] left-[-2px] w-[2px] bg-slate-600/60 rounded-full" />
      {/* Window strip right */}
      <div className="absolute top-[15%] bottom-[15%] right-[-2px] w-[2px] bg-slate-600/60 rounded-full" />

      {/* ── FRONT label ── */}
      {(size === "md" || size === "lg") && (
        <div className="mb-3 text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] bg-slate-900/60 px-3 py-0.5 rounded-full border border-slate-700/70">
          ↑ Front
        </div>
      )}

      {/* ── Rows ── */}
      <div className={cn("flex flex-col", scale.rowGap)}>
        {floor.rows.map((row, ri) => (
          <div
            key={ri}
            className={cn("flex items-center justify-center", scale.colGap)}
          >
            {row.cells.map((cell, ci) => (
              <CellNode
                key={`${ri}-${ci}`}
                cellType={cell.cellType}
                seatType={cell.seatType}
                seatLabel={cell.seatLabel}
                seatId={cell.seatId}
                scale={scale}
                showLabels={showLabels}
                isBooked={!!cell.seatId && bookedSet.has(cell.seatId)}
                withTooltip={withTooltip}
              />
            ))}
          </div>
        ))}
      </div>

      {/* ── REAR label ── */}
      {(size === "md" || size === "lg") && (
        <div className="mt-3 pt-3 border-t border-slate-700/40 w-full flex justify-center">
          <div className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] bg-slate-900/60 px-3 py-0.5 rounded-full border border-slate-700/70">
            ↓ Rear
          </div>
        </div>
      )}
    </div>
  );
};

export default MiniSeatMapPreview;
