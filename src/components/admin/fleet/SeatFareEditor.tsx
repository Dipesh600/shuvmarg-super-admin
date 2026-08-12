import { useMemo } from "react";

type Cell = { cellType?: string; seatLabel?: string | null; seatType?: string };
type Config = { floors?: Array<{ rows?: Array<{ cells?: Cell[] }> }> } | null;

export default function SeatFareEditor({ config, baseFare, overrides, onChange }: {
  config: Config;
  baseFare: number;
  overrides: Record<string, number>;
  onChange: (value: Record<string, number>) => void;
}) {
  const seats = useMemo(() => config?.floors?.flatMap((floor) => floor.rows?.flatMap((row) => row.cells?.filter((cell) => cell.cellType === "SEAT" && cell.seatLabel) || []) || []) || [], [config]);
  if (!seats.length || !baseFare) return <p className="rounded-xl border border-dashed p-4 text-xs text-muted-foreground">Choose a fleet with a versioned seat layout and enter a base fare to map individual seat prices.</p>;
  return <div className="rounded-xl border p-4"><div className="mb-3 flex items-center justify-between"><div><p className="text-sm font-black">Seat fare map</p><p className="text-[11px] text-muted-foreground">Every seat starts at NPR {baseFare}. Edit only exceptions.</p></div><button type="button" onClick={() => onChange({})} className="text-xs font-bold text-primary">Reset all</button></div>
    <div className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-4">{seats.map((seat) => { const label = String(seat.seatLabel); return <label key={label} className="rounded-lg border bg-muted/20 p-2"><span className="flex justify-between text-[10px] font-bold"><b>{label}</b><span className="text-muted-foreground">{String(seat.seatType || "STANDARD").replaceAll("_", " ")}</span></span><input type="number" min={1} value={overrides[label] ?? baseFare} onChange={(event) => { const fare = Number(event.target.value); const next = { ...overrides }; if (!fare || fare === baseFare) delete next[label]; else next[label] = fare; onChange(next); }} className="mt-2 h-8 w-full rounded-md border bg-background px-2 text-xs font-bold" /></label>; })}</div>
  </div>;
}
