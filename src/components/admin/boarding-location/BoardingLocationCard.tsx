import { MapPin, Pencil, ShieldCheck, ShieldQuestion } from "lucide-react";
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
    <article className="group rounded-2xl border border-white/10 bg-white/[0.025] p-4 transition hover:border-white/20 hover:bg-white/[0.04]">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-[#D3D925]/10 p-2 text-[#D3D925]"><MapPin className="size-4" /></div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-white">{location.name}</h3>
            <Badge variant="outline" className={verified ? "border-emerald-400/20 text-emerald-300" : "border-amber-400/20 text-amber-300"}>
              {verified ? <ShieldCheck className="mr-1 size-3" /> : <ShieldQuestion className="mr-1 size-3" />}
              {location.verificationStatus}
            </Badge>
            {location.status === "INACTIVE" && <Badge variant="outline">Inactive</Badge>}
          </div>
          {location.landmark && <p className="mt-1 text-sm text-white/65">{location.landmark}</p>}
          <p className="mt-2 font-mono text-[11px] text-white/40">{location.coordinates.lat.toFixed(6)}, {location.coordinates.lng.toFixed(6)}</p>
          {location.aliases.length > 0 && <p className="mt-2 truncate text-xs text-white/40">Also known as {location.aliases.join(", ")}</p>}
        </div>
        <div className="flex gap-1 opacity-70 transition group-hover:opacity-100">
          <Button size="icon" variant="outline" className="size-8" onClick={onEdit} aria-label={`Edit ${location.name}`}><Pencil className="size-3.5" /></Button>
          {location.status === "ACTIVE" && <Button size="sm" variant="outline" className="h-8 text-xs" disabled={deactivating} onClick={onDeactivate}>Deactivate</Button>}
        </div>
      </div>
    </article>
  );
}
