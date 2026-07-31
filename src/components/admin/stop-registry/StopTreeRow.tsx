import React from "react";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, ChevronDown, MapPin, GitCommit } from "lucide-react";
import { AdminStop, StopTreeNode, getStopId } from "./stopRegistryTypes";

interface StopTreeRowProps {
  node: StopTreeNode;
  isSelected: boolean;
  isExpanded: boolean;
  onToggleExpand: (stopId: string, e: React.MouseEvent) => void;
  onSelect: (stop: AdminStop) => void;
}

export const StopTreeRow: React.FC<StopTreeRowProps> = ({
  node,
  isSelected,
  isExpanded,
  onToggleExpand,
  onSelect,
}) => {
  const { stop, children, depth } = node;
  const stopId = getStopId(stop);
  const hasChildren = children.length > 0;

  const isVerified = (stop.verificationStatus || "VERIFIED").toUpperCase() === "VERIFIED";
  const isActive = (stop.status || "ACTIVE").toUpperCase() === "ACTIVE";

  // Indentation padding based on hierarchy depth
  const paddingLeftClass = depth === 0 ? "pl-3" : depth === 1 ? "pl-8" : depth === 2 ? "pl-12" : "pl-16";

  return (
    <div
      onClick={() => onSelect(stop)}
      className={`group flex items-center justify-between py-2.5 pr-3 ${paddingLeftClass} rounded-xl cursor-pointer transition-all border ${
        isSelected
          ? "bg-[#D3D925]/15 border-[#D3D925]/40 text-white shadow-sm"
          : "bg-white/[0.02] border-transparent hover:bg-white/5 text-white/90"
      }`}
    >
      {/* Left side: Expand toggle + icon + stop info */}
      <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
        {/* Expand / Collapse Icon */}
        {hasChildren ? (
          <button
            type="button"
            onClick={(e) => onToggleExpand(stopId, e)}
            className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/15 flex items-center justify-center text-white/60 hover:text-white shrink-0 transition-colors"
            title={isExpanded ? "Collapse children" : "Expand children"}
          >
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        ) : (
          <div className="w-6 h-6 flex items-center justify-center shrink-0">
            <GitCommit className="w-3 h-3 text-white/30" />
          </div>
        )}

        {/* Stop Icon */}
        <MapPin
          className={`w-3.5 h-3.5 shrink-0 ${
            isSelected ? "text-[#D3D925]" : "text-white/40 group-hover:text-white/70"
          }`}
        />

        {/* Name & Subtitle */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs truncate text-white">{stop.name}</span>
            {stop.code && (
              <Badge
                variant="outline"
                className={`text-[9px] font-bold px-1.5 py-0 h-4 border-white/10 ${
                  isSelected ? "text-[#D3D925] border-[#D3D925]/30 bg-[#D3D925]/10" : "text-white/60"
                }`}
              >
                {stop.code}
              </Badge>
            )}
          </div>
          <p className="text-[10px] text-white/40 truncate font-medium mt-0.5">
            {[stop.municipality, stop.district].filter(Boolean).join(", ") || stop.province || "Nepal"}
          </p>
        </div>
      </div>

      {/* Right side: Capabilities, status, child count */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Capability Badges */}
        {stop.isSearchable && (
          <Badge variant="outline" className="text-[9px] font-bold uppercase border-emerald-500/30 text-emerald-400 bg-emerald-500/10 px-1.5 h-4 hidden sm:inline-flex">
            Searchable
          </Badge>
        )}
        {stop.isRouteStop && (
          <Badge variant="outline" className="text-[9px] font-bold uppercase border-orange-500/30 text-orange-400 bg-orange-500/10 px-1.5 h-4 hidden sm:inline-flex">
            Route Stop
          </Badge>
        )}

        {/* Verification indicator if pending/rejected */}
        {!isVerified && (
          <Badge variant="outline" className="text-[9px] font-bold uppercase border-yellow-500/30 text-yellow-400 bg-yellow-500/10 px-1.5 h-4">
            {stop.verificationStatus}
          </Badge>
        )}

        {/* Inactive status */}
        {!isActive && (
          <Badge variant="outline" className="text-[9px] font-bold uppercase border-red-500/30 text-red-400 bg-red-500/10 px-1.5 h-4">
            INACTIVE
          </Badge>
        )}

        {/* Child Count Badge */}
        {hasChildren && (
          <span className="text-[10px] font-bold text-[#D3D925] bg-[#D3D925]/10 border border-[#D3D925]/20 px-2 py-0.5 rounded-full ml-1">
            {children.length} {children.length === 1 ? "child" : "children"}
          </span>
        )}
      </div>
    </div>
  );
};
