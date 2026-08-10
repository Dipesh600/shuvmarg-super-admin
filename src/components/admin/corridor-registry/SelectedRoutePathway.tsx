import { CheckCircle2 } from "lucide-react";
import type {
  CorridorStop,
  RouteOption,
} from "@/api/corridorWorkflowApi";

interface SelectedRoutePathwayProps {
  option: RouteOption;
  source: CorridorStop | undefined;
  destination: CorridorStop | undefined;
}

interface PathwayNode {
  key: string;
  name: string;
  kind: string;
  color: string;
}

function pathwayNodes(
  source: CorridorStop | undefined,
  destination: CorridorStop | undefined,
  roadLabels: string[],
): PathwayNode[] {
  const interior = roadLabels.slice(0, 4).map((label, index) => ({
    key: `road-${index}-${label}`,
    name: label,
    kind: "Road guidance",
    color: "border-sky-400 bg-sky-400",
  }));
  return [
    { key: "corridor-origin", name: source?.name || "Origin", kind: "Corridor origin", color: "border-[#D3D925] bg-[#D3D925]" },
    ...interior,
    { key: "corridor-destination", name: destination?.name || "Destination", kind: "Corridor destination", color: "border-[#D3D925] bg-[#D3D925]" },
  ];
}

export function SelectedRoutePathway({
  option,
  source,
  destination,
}: SelectedRoutePathwayProps) {
  const nodes = pathwayNodes(source, destination, option.roadLabels || []);
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#D3D925]">
            Selected road path
          </p>
          <h4 className="mt-1 text-sm font-bold text-white">
            {source?.name || "Origin"} → {destination?.name || "Destination"}
          </h4>
          <p className="mt-1 text-xs text-white/45">
            {option.label} · {option.distanceKm.toLocaleString()} km · {option.durationMinutes} min
          </p>
        </div>
        <CheckCircle2 className="size-5 text-[#D3D925]" />
      </div>

      <div className="mt-5 overflow-x-auto pb-2">
          <ol className="flex min-w-max items-start px-2">
            {nodes.map((node, index) => (
              <li key={node.key} className="relative w-36 shrink-0 pr-4 last:pr-0">
                {index < nodes.length - 1 && (
                  <span className="absolute left-3 top-2 h-px w-[calc(100%-12px)] bg-white/15" />
                )}
                <span className={`relative z-10 block size-4 rounded-full border-[3px] border-[#111] ring-1 ${node.color}`} />
                <p className="mt-2 line-clamp-2 text-xs font-semibold leading-4 text-white/80">
                  {node.name}
                </p>
                <p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-white/30">
                  {node.kind}
                </p>
              </li>
            ))}
          </ol>
      </div>

      {(option.roadLabels || []).length > 0 && (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-white/8 pt-3 text-[10px] text-white/35">
          <span><i className="mr-1.5 inline-block size-2 rounded-full bg-sky-400" />Google road guidance</span>
          <span className="ml-auto">Physical stops are discovered and reconciled only after you confirm this path.</span>
        </div>
      )}
    </section>
  );
}
