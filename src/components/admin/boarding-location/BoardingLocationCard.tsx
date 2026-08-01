import { MapPin, MoreHorizontal, Pencil, ShieldCheck, ShieldQuestion } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { BoardingLocation } from "./boardingLocationTypes";

export function BoardingLocationCard({
  location,
  onEdit,
  onDeactivate,
  deactivating,
}: {
  location: BoardingLocation;
  onEdit: () => void;
  onDeactivate: () => void;
  deactivating: boolean;
}) {
  const verified = location.verificationStatus === "VERIFIED";
  return (
    <article className="group rounded-2xl border border-white/10 bg-white/[0.025] p-4 transition hover:border-[#EA4B2A]/25 hover:bg-white/[0.04]">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-[#EA4B2A]/10 p-2 text-[#EA4B2A]"><MapPin className="size-4" /></div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-white">{location.name}</h3>
            <Badge variant="outline" className={verified ? "border-emerald-400/20 text-emerald-300" : "border-amber-400/20 text-amber-300"}>
              {verified ? <ShieldCheck className="mr-1 size-3" /> : <ShieldQuestion className="mr-1 size-3" />}
              {location.verificationStatus}
            </Badge>
            {location.status === "INACTIVE" && <Badge variant="outline">Inactive</Badge>}
          </div>
          {(location.landmark || location.address) && <p className="mt-1 text-sm text-white/60">{location.landmark || location.address}</p>}
          <p className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-white/30">{location.source.replaceAll("_", " ")}</p>
          {location.aliases.length > 0 && <p className="mt-2 truncate text-xs text-white/40">Also known as {location.aliases.join(", ")}</p>}
        </div>
        <div className="flex gap-1 opacity-70 transition group-hover:opacity-100">
          <Button size="sm" variant="outline" className="h-8" onClick={onEdit}><Pencil className="size-3.5" />Edit</Button>
          {location.status === "ACTIVE" && <Button size="icon" variant="ghost" className="size-8 text-white/45" disabled={deactivating} onClick={onDeactivate} aria-label={`Deactivate ${location.name}`}><MoreHorizontal className="size-4" /></Button>}
        </div>
      </div>
    </article>
  );
}
