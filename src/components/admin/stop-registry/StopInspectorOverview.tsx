import React from "react";
import { Badge } from "@/components/ui/badge";
import type { AdminStop } from "./stopRegistryTypes";

interface StopInspectorOverviewProps {
  stop: AdminStop;
}

export const StopInspectorOverview: React.FC<StopInspectorOverviewProps> = ({ stop }) => {
  const hasCoordinates =
    stop.coordinates &&
    stop.coordinates.lat !== null &&
    stop.coordinates.lat !== undefined &&
    stop.coordinates.lng !== null &&
    stop.coordinates.lng !== undefined;

  const aliasesList = Array.isArray(stop.aliases)
    ? stop.aliases.filter((a) => typeof a === "string" && a.trim().length > 0)
    : [];

  return (
    <div className="space-y-5 text-xs text-white">
      {/* Roles & Capabilities */}
      <div className="space-y-2.5">
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/50 block">
          Operational Roles
        </span>

        <div className="grid grid-cols-2 gap-2">
          {/* Passenger Searchable */}
          <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-[11px]">Passenger Searchable</span>
              <Badge
                variant="outline"
                className={
                  stop.isSearchable
                    ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10 text-[9px] font-bold"
                    : "border-white/10 text-white/40 bg-white/5 text-[9px] font-bold"
                }
              >
                {stop.isSearchable ? "YES" : "NO"}
              </Badge>
            </div>
            <p className="text-[10px] text-white/40 leading-snug">
              {stop.isSearchable
                ? "Appears in passenger From/To dropdown."
                : "Hidden from passenger origin/destination selection."}
            </p>
          </div>

          {/* Operational Route Stop */}
          <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-[11px]">Operational Route Stop</span>
              <Badge
                variant="outline"
                className={
                  stop.isRouteStop
                    ? "border-orange-500/30 text-orange-400 bg-orange-500/10 text-[9px] font-bold"
                    : "border-white/10 text-white/40 bg-white/5 text-[9px] font-bold"
                }
              >
                {stop.isRouteStop ? "YES" : "NO"}
              </Badge>
            </div>
            <p className="text-[10px] text-white/40 leading-snug">
              {stop.isRouteStop
                ? "Available for route stop sequences."
                : "Not enabled for route sequence mapping."}
            </p>
          </div>
        </div>
      </div>

      {/* Geography */}
      <div className="space-y-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/50 block">
          Geography
        </span>

        <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-[10px] text-white/40 uppercase tracking-wider font-bold">Province</p>
            <p className="font-bold text-white mt-0.5">{stop.province || "Not provided"}</p>
          </div>
          <div>
            <p className="text-[10px] text-white/40 uppercase tracking-wider font-bold">District</p>
            <p className="font-bold text-white mt-0.5">{stop.district || "Not provided"}</p>
          </div>
          <div>
            <p className="text-[10px] text-white/40 uppercase tracking-wider font-bold">Municipality</p>
            <p className="font-bold text-white mt-0.5">{stop.municipality || "Not provided"}</p>
          </div>
        </div>
      </div>

      {/* Attributes Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Stop Type */}
        <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Stop Classification</p>
          <div className="flex items-center gap-2 pt-0.5">
            <Badge variant="secondary" className="font-bold uppercase text-[10px] tracking-wider">
              {stop.type || "CITY"}
            </Badge>
          </div>
        </div>

        {/* Coordinates */}
        <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">GIS Coordinates</p>
          <p className="font-mono text-[11px] font-bold text-white/90">
            {hasCoordinates ? `${stop.coordinates!.lat}, ${stop.coordinates!.lng}` : "Not provided"}
          </p>
        </div>
      </div>

      {/* Aliases */}
      <div className="space-y-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/50 block">
          Search Aliases
        </span>
        <div className="p-3 rounded-xl bg-white/5 border border-white/5">
          {aliasesList.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {aliasesList.map((alias, idx) => (
                <Badge
                  key={idx}
                  variant="outline"
                  className="bg-white/5 border-white/10 text-white/80 text-[11px] font-medium"
                >
                  {alias}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-white/40 text-[11px] italic">Not provided</p>
          )}
        </div>
      </div>
    </div>
  );
};
