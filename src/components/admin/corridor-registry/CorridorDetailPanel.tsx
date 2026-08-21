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
  onViewVariant: (variant: RouteVariant) => void;
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
  onView,
}: {
  variant: RouteVariant;
  onDelete: () => void;
  onResume: () => void;
  onView: () => void;
}) {
  const isDraft = variant.status === "DRAFT";

  return (
    <article className="group rounded-xl border border-white/10 bg-white/[0.025] p-4 transition hover:border-white/20 hover:bg-white/[0.045]">
      <div className="flex items-start gap-3">
        <Route className="mt-0.5 size-4 shrink-0 text-[#D3D925]/70" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-bold text-white">{routeLabel(variant)}</p>
                {variant.revisionNumber && variant.revisionNumber > 1 && (
                  <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-white/70">
                    v{variant.revisionNumber}
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-white/40">{routeMeta(variant)}</p>
              <p className="mt-1 text-[11px] text-white/25">System code: {variant.code}</p>
              {variant.returnVariantId && <p className="mt-1 text-[10px] font-semibold text-[#D3D925]/55">Paired forward + return route family</p>}
            </div>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${statusClassName[variant.status] || statusClassName.INACTIVE}`}>
              {variant.status === "DRAFT" ? "In setup" : variant.status}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={onView} className="rounded-md border border-white/15 px-2.5 py-1.5 text-[10px] font-semibold text-white/70 transition hover:bg-white/10 hover:text-white">View route details</button>
          {isDraft && (<>
              <button
                type="button"
                onClick={onResume}
                className="rounded-md border border-white/15 px-2.5 py-1.5 text-[10px] font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                Resume setup
              </button>
          </>)}
          </div>
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

function PendingRevisionCard({
  revision,
  onDelete,
  onContinue,
}: {
  revision: RouteVariant;
  onDelete: () => void;
  onContinue: () => void;
}) {
  return (
    <article className="rounded-xl border border-[#D3D925]/20 bg-[#D3D925]/[0.04] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#D3D925]/70">Pending paired revision</p>
          <p className="mt-1 text-sm font-bold text-white">{routeLabel(revision)} · v{revision.revisionNumber || 2}</p>
          <p className="mt-1 text-xs leading-5 text-white/40">One revision workspace controls both forward and return directions. The live route is unchanged.</p>
        </div>
        <button type="button" aria-label={`Discard revision for ${routeLabel(revision)}`} onClick={onDelete} className="rounded-lg p-1.5 text-white/30 hover:bg-red-500/10 hover:text-red-300">
          <Trash2 className="size-3.5" />
        </button>
      </div>
      <Button type="button" size="sm" onClick={onContinue} className="mt-3 bg-[#D3D925] font-bold text-black hover:bg-[#D9CD25]">
        <Pencil className="mr-2 size-3.5" />Continue revision
      </Button>
    </article>
  );
}

function DirectionLane({
  direction,
  corridor,
  variants,
  loading,
  onDelete,
  onResume,
  onView,
  pendingRevisions,
}: {
  direction: VariantDirection;
  corridor: RouteCorridor;
  variants: RouteVariant[];
  loading: boolean;
  onDelete: (variant: RouteVariant) => void;
  onResume: (variant: RouteVariant) => void;
  onView: (variant: RouteVariant) => void;
  pendingRevisions: RouteVariant[];
}) {
  const origin = direction === "FORWARD" ? corridor.originId : corridor.destinationId;
  const destination = direction === "FORWARD" ? corridor.destinationId : corridor.originId;
  const visibleVariants = variants.filter((variant) => variant.status === "ACTIVE" || variant.status === "DRAFT");
  const activeCount = visibleVariants.filter((variant) => variant.status === "ACTIVE").length;

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
      </div>

      <div className="space-y-2">
        {pendingRevisions.map((pendingRevision) => (
          <PendingRevisionCard
            key={pendingRevision._id}
            revision={pendingRevision}
            onDelete={() => onDelete(pendingRevision)}
            onContinue={() => onView(pendingRevision)}
          />
        ))}
        {loading ? (
          <div className="rounded-xl border border-dashed border-white/10 px-3 py-7 text-center text-xs text-white/35">
            Loading route paths…
          </div>
        ) : visibleVariants.length ? (
          visibleVariants.map((variant) => (
            <VariantCard
              key={variant._id}
              variant={variant}
              onDelete={() => onDelete(variant)}
              onResume={() => onResume(variant)}
              onView={() => onView(variant)}
            />
          ))
        ) : (
          <div className="w-full rounded-xl border border-dashed border-white/15 px-3 py-7 text-center">
            <p className="text-sm font-semibold text-white/65">Build the first route path</p>
            <p className="mt-1 text-xs text-white/35">
              Use Build route family above to choose a Google road suggestion and review its route stops.
            </p>
          </div>
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
  onViewVariant,
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

  const revisionDrafts = variants.filter((variant) => variant.status === "DRAFT" && variant.revisionOfVariantId);
  const routeVariants = variants.filter((variant) => !(variant.status === "DRAFT" && variant.revisionOfVariantId));
  const pendingByFamily = new Map<string, RouteVariant>();
  revisionDrafts.forEach((revision) => {
    const key = revision.routeFamilyId || revision._id;
    const current = pendingByFamily.get(key);
    if (!current || revision.direction === "FORWARD") pendingByFamily.set(key, revision);
  });
  const pendingRevisions = [...pendingByFamily.values()];
  const forwardVariants = routeVariants.filter((variant) => variant.direction !== "RETURN");
  const returnVariants = routeVariants.filter((variant) => variant.direction === "RETURN");
  const forwardPending = pendingRevisions.filter((variant) => variant.direction !== "RETURN");
  const returnPending = pendingRevisions.filter((variant) => variant.direction === "RETURN");

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
          <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <GitBranchPlus className="mt-0.5 size-4 shrink-0 text-[#D3D925]" />
            <div>
              <p className="text-sm font-semibold text-white">Route path workflow</p>
              <p className="mt-1 text-xs leading-5 text-white/45">
                Build the road path once. Shuvmarg prepares linked forward and return drafts; each direction stays independently reviewable and publishable.
              </p>
            </div>
          </div>
          <Button type="button" onClick={() => onStartVariant("FORWARD")} className="bg-[#D3D925] font-bold text-black hover:bg-[#D9CD25]"><GitBranchPlus className="mr-2 size-4" />Build route family</Button>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <DirectionLane
            direction="FORWARD"
            corridor={corridor}
            variants={forwardVariants}
            pendingRevisions={forwardPending}
            loading={variantsLoading}
            onDelete={onDeleteVariant}
            onResume={onResumeVariant}
            onView={onViewVariant}
          />
          <DirectionLane
            direction="RETURN"
            corridor={corridor}
            variants={returnVariants}
            pendingRevisions={returnPending}
            loading={variantsLoading}
            onDelete={onDeleteVariant}
            onResume={onResumeVariant}
            onView={onViewVariant}
          />
        </div>
      </div>
    </section>
  );
}
