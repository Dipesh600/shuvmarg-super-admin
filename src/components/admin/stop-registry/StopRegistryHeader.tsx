import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, FileJson, MapPin, Search, Route, AlertCircle } from "lucide-react";
import type { AdminStop } from "./stopRegistryTypes";

interface StopRegistryHeaderProps {
  stops: AdminStop[];
  onAddStop: () => void;
  onImportStops: () => void;
}

export const StopRegistryHeader: React.FC<StopRegistryHeaderProps> = ({
  stops,
  onAddStop,
  onImportStops,
}) => {
  // Reliable derived summary counts
  const totalStops = stops.length;
  const searchableCount = stops.filter((s) => s.isSearchable).length;
  const routeStopCount = stops.filter((s) => s.isRouteStop).length;
  const needsReviewCount = stops.filter(
    (s) => (s.verificationStatus || "VERIFIED").toUpperCase() !== "VERIFIED"
  ).length;

  return (
    <div className="space-y-4">
      {/* Title & Actions Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 text-white">
              <MapPin className="w-5 h-5" />
            </div>
            Stop Registry Workspace
          </h1>
          <p className="text-xs text-white/50 font-medium mt-1">
            Manage passenger destinations, operational route stops, and hierarchical parent-child relationships.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            id="bulk-import-stops-btn"
            variant="outline"
            onClick={onImportStops}
            className="gap-2 font-bold rounded-xl h-10 px-4 border-dashed border-white/20 text-white hover:bg-[#D3D925]/10 hover:border-[#D3D925]/40 hover:text-[#D3D925] transition-all text-xs"
          >
            <FileJson className="w-4 h-4" />
            <span>Import Stops</span>
          </Button>

          <Button
            id="add-stop-btn"
            onClick={onAddStop}
            className="gap-2 font-bold rounded-xl h-10 px-5 bg-[#D3D925] text-black hover:bg-[#D9CD25] text-xs shadow-lg shadow-[#D3D925]/10"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Stop</span>
          </Button>
        </div>
      </div>

      {/* Derived Metric Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white/5 text-white/70">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <p className="text-lg font-bold text-white leading-tight">{totalStops}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Total Stops</p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
            <Search className="w-4 h-4" />
          </div>
          <div>
            <p className="text-lg font-bold text-white leading-tight">{searchableCount}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Searchable Places</p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400">
            <Route className="w-4 h-4" />
          </div>
          <div>
            <p className="text-lg font-bold text-white leading-tight">{routeStopCount}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Route Stops</p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-yellow-500/10 text-yellow-400">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div>
            <p className="text-lg font-bold text-white leading-tight">{needsReviewCount}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Needs Review</p>
          </div>
        </div>
      </div>
    </div>
  );
};
