import React from "react";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, GitCommit, Layers } from "lucide-react";
import { AdminStop, getStopId } from "./stopRegistryTypes";
import { findParentStop, getChildStopsForParent } from "./stopRegistryTree";

interface StopInspectorRelationshipsProps {
  stop: AdminStop;
  allStops: AdminStop[];
  onSelectStop: (stopId: string) => void;
}

export const StopInspectorRelationships: React.FC<StopInspectorRelationshipsProps> = ({
  stop,
  allStops,
  onSelectStop,
}) => {
  const currentId = getStopId(stop);
  const parentStop = findParentStop(stop, allStops);
  const childStops = currentId ? getChildStopsForParent(currentId, allStops) : [];

  return (
    <div className="space-y-5 text-xs text-white">
      {/* Parent Stop Card */}
      <div className="space-y-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/50 block">
          Parent Destination
        </span>

        {parentStop ? (
          <button
            type="button"
            onClick={() => onSelectStop(getStopId(parentStop))}
            className="w-full text-left p-3.5 rounded-xl bg-white/5 border border-white/10 hover:border-[#D3D925]/40 hover:bg-white/[0.08] transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#D3D925]/10 border border-[#D3D925]/20 text-[#D3D925]">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-white group-hover:text-[#D3D925] transition-colors">
                  {parentStop.name}
                </p>
                <p className="text-[10px] text-white/40 mt-0.5">
                  {parentStop.code ? `Code: ${parentStop.code}` : parentStop.district || "Top-Level Destination"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[9px] font-bold border-white/10 text-white/60">
                PARENT
              </Badge>
              <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-[#D3D925] group-hover:translate-x-0.5 transition-all" />
            </div>
          </button>
        ) : (
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/5 text-white/40">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-white/80">Top-Level Stop</p>
              <p className="text-[10px] text-white/40 mt-0.5">
                This stop has no parent stop assigned (acts as a top-level hub/city).
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Child Stops List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">
            Child Sub-Stops
          </span>
          <Badge variant="secondary" className="text-[10px] font-bold bg-white/10 text-white">
            {childStops.length} {childStops.length === 1 ? "child" : "children"}
          </Badge>
        </div>

        {childStops.length > 0 ? (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {childStops.map((child) => {
              const childId = getStopId(child);
              return (
                <button
                  key={childId}
                  type="button"
                  onClick={() => onSelectStop(childId)}
                  className="w-full text-left p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/20 hover:bg-white/[0.08] transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5">
                    <GitCommit className="w-3.5 h-3.5 text-white/40 group-hover:text-[#D3D925]" />
                    <div>
                      <p className="font-bold text-white text-xs group-hover:text-[#D3D925] transition-colors">
                        {child.name}
                      </p>
                      <p className="text-[10px] text-white/40">
                        {child.code ? `Code: ${child.code}` : child.district || "Sub-stop"}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-white/30 group-hover:text-[#D3D925] group-hover:translate-x-0.5 transition-all" />
                </button>
              );
            })}
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 text-center py-5">
            <p className="text-white/60 font-bold text-xs">No child stops</p>
            <p className="text-[10px] text-white/40 mt-1">
              Other sub-stops can be linked to this stop as their parent.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
