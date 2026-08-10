import {
  ArrowRight,
  GitBranchPlus,
  MapPinned,
  Pencil,
  Route,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  RouteCorridor,
  RouteVariant,
  VariantDirection,
} from "@/api/corridorWorkflowApi";

interface CorridorDetailPanelProps {
  corridor: RouteCorridor | null;
  variants: RouteVariant[];
  variantsLoading: boolean;
  onStartVariant: (direction: VariantDirection) => void;
  onEditCorridor: () => void;
  onDeleteCorridor: () => void;
  onDeleteVariant: (variant: RouteVariant) => void;
  onResumeVariant: (variant: RouteVariant) => void;
  onActivateVariant: (variant: RouteVariant) => void;
}

const statusClassName: Record<string, string> = {
  ACTIVE: "bg-emerald-400/10 text-emerald-300",
  DRAFT: "bg-amber-300/10 text-amber-200",
  INACTIVE: "bg-white/10 text-white/45",
  ARCHIVED: "bg-white/5 text-white/30",
};

function routeLabel(variant: RouteVariant) {
  return variant.name?.trim() || "Unnamed route path";
}

function routeMeta(variant: RouteVariant) {
  const distance = variant.distanceKm ? `${variant.distanceKm} km` : "distance pending";
  const duration = variant.durationMinutes ? `${variant.durationMinutes} min` : "duration pending";
  return `${distance} · ${duration}`;
}

function VariantCard({
  variant,
  onDelete,
  onResume,
  onActivate,
}: {
  variant: RouteVariant;
  onDelete: () => void;
  onResume: () => void;
  onActivate: () => void;
}) {
  const isDraft = variant.status === "DRAFT";

  return (
    <article className="group rounded-xl border border-white/10 bg-white/[0.025] p-4 transition hover:border-white/20 hover:bg-white/[0.045]">
      <div className="flex items-start gap-3">
        <Route className="mt-0.5 size-4 shrink-0 text-[#D3D925]/70" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-white">{routeLabel(variant)}</p>
              <p className="mt-1 text-xs text-white/40">{routeMeta(variant)}</p>
              <p className="mt-1 text-[11px] text-white/25">System code: {variant.code}</p>
            </div>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${statusClassName[variant.status] || statusClassName.INACTIVE}`}>
              {variant.status === "DRAFT" ? "In setup" : variant.status}
            </span>
          </div>

          {isDraft && (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onResume}
                className="rounded-md border border-white/15 px-2.5 py-1.5 text-[10px] font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                Resume setup
              </button>
              <button
                type="button"
                onClick={onActivate}
                className="rounded-md bg-[#D3D925] px-2.5 py-1.5 text-[10px] font-bold text-black transition hover:bg-[#D9CD25]"
              >
                Activate route
              </button>
            </div>
          )}
        </div>

        {isDraft && (
          <button
            type="button"
            aria-label={`Delete setup for ${routeLabel(variant)}`}
            onClick={onDelete}
            className="mt-0.5 hidden rounded-lg p-1.5 text-white/30 hover:bg-red-500/10 hover:text-red-300 group-hover:block"
          >
            <Trash2 className="size-3.5" />
          </button>
        )}
      </div>
    </article>
  );
}

function DirectionLane({
  direction,
  corridor,
  variants,
  loading,
  onStart,
  onDelete,
  onResume,
  onActivate,
}: {
  direction: VariantDirection;
  corridor: RouteCorridor;
  variants: RouteVariant[];
  loading: boolean;
  onStart: () => void;
  onDelete: (variant: RouteVariant) => void;
  onResume: (variant: RouteVariant) => void;
  onActivate: (variant: RouteVariant) => void;
}) {
  const origin = direction === "FORWARD" ? corridor.originId : corridor.destinationId;
  const destination = direction === "FORWARD" ? corridor.destinationId : corridor.originId;
  const activeCount = variants.filter((variant) => variant.status === "ACTIVE").length;

  return (
    <section className="rounded-2xl border border-white/10 bg-black/15 p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-bold text-white">
            <span>{origin.name}</span>
            <ArrowRight className="size-3.5 text-white/35" />
            <span>{destination.name}</span>
          </p>
          <p className="mt-0.5 text-xs text-white/40">
            {activeCount ? `${activeCount} active route path${activeCount === 1 ? "" : "s"}` : "No active route path yet"}
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onStart}
          className="h-8 border-white/15 bg-transparent px-3 text-xs font-semibold text-white hover:bg-white/10 hover:text-white"
        >
          <GitBranchPlus className="mr-1 size-3.5" />
          Build route
        </Button>
      </div>

      <div className="space-y-2">
        {loading ? (
          <div className="rounded-xl border border-dashed border-white/10 px-3 py-7 text-center text-xs text-white/35">
            Loading route paths…
          </div>
        ) : variants.length ? (
          variants.map((variant) => (
            <VariantCard
              key={variant._id}
              variant={variant}
              onDelete={() => onDelete(variant)}
              onResume={() => onResume(variant)}
              onActivate={() => onActivate(variant)}
            />
          ))
        ) : (
          <button
            type="button"
            onClick={onStart}
            className="w-full rounded-xl border border-dashed border-white/15 px-3 py-7 text-center transition hover:border-[#D3D925]/30 hover:bg-[#D3D925]/5"
          >
            <p className="text-sm font-semibold text-white/65">Build the first route path</p>
            <p className="mt-1 text-xs text-white/35">
              Choose terminals, select a Google road suggestion, then review route stops.
            </p>
          </button>
        )}
      </div>
    </section>
  );
}

export function CorridorDetailPanel({
  corridor,
  variants,
  variantsLoading,
  onStartVariant,
  onEditCorridor,
  onDeleteCorridor,
  onDeleteVariant,
  onResumeVariant,
  onActivateVariant,
}: CorridorDetailPanelProps) {
  if (!corridor) {
    return (
      <section className="flex min-h-[540px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center lg:min-h-[620px]">
        <MapPinned className="mb-4 size-9 text-white/15" />
        <p className="font-semibold text-white/65">Choose a corridor</p>
        <p className="mt-1 max-w-xs text-sm leading-6 text-white/35">
          Select a corridor to build or review its physical route paths.
        </p>
      </section>
    );
  }

  const forwardVariants = variants.filter((variant) => variant.direction !== "RETURN");
  const returnVariants = variants.filter((variant) => variant.direction === "RETURN");

  return (
    <section className="min-h-[540px] overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a]/65 lg:min-h-[620px]">
      <header className="border-b border-white/10 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">{corridor.code}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xl font-bold text-white">
              <span>{corridor.originId?.name || "Unknown endpoint"}</span>
              <span className="text-white/30">↔</span>
              <span>{corridor.destinationId?.name || "Unknown endpoint"}</span>
            </div>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/45">
              This corridor is the market connection. Build one reviewed physical route path for each direction that buses actually operate.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onEditCorridor}
              className="border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              <Pencil className="mr-2 size-3.5" />
              Edit
            </Button>
            <button
              type="button"
              aria-label="Delete corridor"
              title={variants.length > 0 ? "Route paths must be retired before deleting this corridor." : "Delete corridor"}
              disabled={variantsLoading || variants.length > 0}
              onClick={onDeleteCorridor}
              className="rounded-lg border border-white/10 p-2 text-white/35 transition hover:border-red-400/30 hover:bg-red-400/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-white/10 disabled:hover:bg-transparent disabled:hover:text-white/35"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${corridor.status === "ACTIVE" ? "bg-emerald-400/10 text-emerald-300" : "bg-amber-300/10 text-amber-200"}`}>
            {corridor.status}
          </span>
          <span className="rounded-full bg-white/[0.05] px-2.5 py-1 text-[10px] font-semibold text-white/45">
            Direction-neutral corridor
          </span>
          <span className="rounded-full bg-white/[0.05] px-2.5 py-1 text-[10px] font-semibold text-white/45">
            {variants.length} route path{variants.length === 1 ? "" : "s"}
          </span>
        </div>
      </header>

      <div className="space-y-5 p-5 sm:p-6">
        <div className="rounded-xl border border-[#D3D925]/15 bg-[#D3D925]/5 p-4">
          <div className="flex items-start gap-3">
            <GitBranchPlus className="mt-0.5 size-4 shrink-0 text-[#D3D925]" />
            <div>
              <p className="text-sm font-semibold text-white">Route path workflow</p>
              <p className="mt-1 text-xs leading-5 text-white/45">
                Pick a direction, choose real terminal stops, select a Google road suggestion, name it in transport language, then approve canonical route stops.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <DirectionLane
            direction="FORWARD"
            corridor={corridor}
            variants={forwardVariants}
            loading={variantsLoading}
            onStart={() => onStartVariant("FORWARD")}
            onDelete={onDeleteVariant}
            onResume={onResumeVariant}
            onActivate={onActivateVariant}
          />
          <DirectionLane
            direction="RETURN"
            corridor={corridor}
            variants={returnVariants}
            loading={variantsLoading}
            onStart={() => onStartVariant("RETURN")}
            onDelete={onDeleteVariant}
            onResume={onResumeVariant}
            onActivate={onActivateVariant}
          />
        </div>
      </div>
    </section>
  );
}
