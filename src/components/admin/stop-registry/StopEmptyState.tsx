import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, FileJson, RotateCcw, AlertTriangle, MapPin, Loader2 } from "lucide-react";

interface StopEmptyStateProps {
  type: "loading" | "error" | "no_records" | "no_filter_match";
  errorMessage?: string;
  onAddStop?: () => void;
  onImportStops?: () => void;
  onResetFilters?: () => void;
  onRetry?: () => void;
}

export const StopEmptyState: React.FC<StopEmptyStateProps> = ({
  type,
  errorMessage,
  onAddStop,
  onImportStops,
  onResetFilters,
  onRetry,
}) => {
  if (type === "loading") {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#121212]/40 backdrop-blur-md p-12 flex flex-col items-center justify-center text-center space-y-4 min-h-[360px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#D3D925]" />
        <p className="text-sm font-bold text-white/70">Loading Stop Registry Explorer...</p>
      </div>
    );
  }

  if (type === "error") {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 backdrop-blur-md p-10 flex flex-col items-center justify-center text-center space-y-3 min-h-[320px]">
        <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white">Unable to Load Stop Registry</h3>
          <p className="text-xs text-white/50 max-w-sm mt-1">
            {errorMessage || "A network or server error occurred while retrieving stops."}
          </p>
        </div>
        {onRetry && (
          <Button
            onClick={onRetry}
            className="font-bold rounded-xl h-10 px-6 bg-white/10 hover:bg-white/20 text-white text-xs mt-2"
          >
            Retry Loading
          </Button>
        )}
      </div>
    );
  }

  if (type === "no_records") {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#121212]/40 backdrop-blur-md p-12 flex flex-col items-center justify-center text-center space-y-4 min-h-[360px]">
        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40">
          <MapPin className="w-7 h-7" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white">No Stops Have Been Added Yet</h3>
          <p className="text-xs text-white/50 max-w-md mt-1">
            Get started by registering individual stops or importing a batch of destinations from JSON.
          </p>
        </div>
        <div className="flex items-center gap-3 pt-2">
          {onImportStops && (
            <Button
              variant="outline"
              onClick={onImportStops}
              className="gap-2 font-bold rounded-xl h-10 px-4 border-dashed border-white/20 text-white hover:bg-[#D3D925]/10 text-xs"
            >
              <FileJson className="w-4 h-4" />
              <span>Import Stops</span>
            </Button>
          )}
          {onAddStop && (
            <Button
              onClick={onAddStop}
              className="gap-2 font-bold rounded-xl h-10 px-5 bg-[#D3D925] text-black hover:bg-[#D9CD25] text-xs"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Stop</span>
            </Button>
          )}
        </div>
      </div>
    );
  }

  // type === "no_filter_match"
  return (
    <div className="rounded-2xl border border-white/10 bg-[#121212]/40 backdrop-blur-md p-10 flex flex-col items-center justify-center text-center space-y-3 min-h-[320px]">
      <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40">
        <RotateCcw className="w-5 h-5" />
      </div>
      <div>
        <h3 className="text-base font-bold text-white">No Stops Match Current Filters</h3>
        <p className="text-xs text-white/50 max-w-xs mt-1">
          Try broadening your search term or adjusting role, status, and relationship filter dropdowns.
        </p>
      </div>
      {onResetFilters && (
        <Button
          onClick={onResetFilters}
          className="font-bold rounded-xl h-10 px-6 bg-[#D3D925] text-black hover:bg-[#D9CD25] text-xs gap-2 mt-1"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Filters</span>
        </Button>
      )}
    </div>
  );
};
