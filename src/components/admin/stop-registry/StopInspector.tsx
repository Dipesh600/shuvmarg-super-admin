import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pencil, Trash2, MapPin, Layers, Info } from "lucide-react";
import type { AdminStop } from "./stopRegistryTypes";
import { StopInspectorOverview } from "./StopInspectorOverview";
import { StopInspectorRelationships } from "./StopInspectorRelationships";

interface StopInspectorProps {
  stop: AdminStop | null;
  allStops: AdminStop[];
  onEdit: (stop: AdminStop) => void;
  onDelete: (stop: AdminStop) => void;
  onSelectStop: (stopId: string) => void;
}

export const StopInspector: React.FC<StopInspectorProps> = ({
  stop,
  allStops,
  onEdit,
  onDelete,
  onSelectStop,
}) => {
  const [activeTab, setActiveTab] = useState<"overview" | "relationships">("overview");

  if (!stop) {
    return (
      <div className="h-full rounded-2xl border border-white/10 bg-[#121212]/40 backdrop-blur-md p-8 flex flex-col items-center justify-center text-center space-y-3 min-h-[420px]">
        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40">
          <MapPin className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">No Stop Selected</h3>
          <p className="text-xs text-white/40 max-w-xs mt-1">
            Select a stop from the explorer to view detailed geographic, capability, and relationship data.
          </p>
        </div>
      </div>
    );
  }

  const isVerified = (stop.verificationStatus || "VERIFIED").toUpperCase() === "VERIFIED";
  const isActive = (stop.status || "ACTIVE").toUpperCase() === "ACTIVE";

  return (
    <div className="h-full rounded-2xl border border-white/10 bg-[#121212]/40 backdrop-blur-md overflow-hidden flex flex-col">
      {/* Inspector Header */}
      <div className="p-5 border-b border-white/10 bg-white/[0.02] space-y-3 shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[11px] font-bold border-[#D3D925]/30 text-[#D3D925] bg-[#D3D925]/10">
                {stop.code || "NO CODE"}
              </Badge>
              <Badge
                variant="outline"
                className={
                  isVerified
                    ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10 text-[10px] font-bold"
                    : "border-yellow-500/30 text-yellow-400 bg-yellow-500/10 text-[10px] font-bold"
                }
              >
                {stop.verificationStatus || "VERIFIED"}
              </Badge>
              <Badge
                variant="outline"
                className={
                  isActive
                    ? "border-white/10 text-white/80 bg-white/5 text-[10px] font-bold"
                    : "border-red-500/30 text-red-400 bg-red-500/10 text-[10px] font-bold"
                }
              >
                {stop.status || "ACTIVE"}
              </Badge>
            </div>

            <h2 className="text-xl font-bold text-white mt-2 flex items-center gap-2">
              {stop.name}
            </h2>
            <p className="text-xs text-white/50 mt-0.5 font-medium">
              {[stop.municipality, stop.district, stop.province].filter(Boolean).join(" • ") || "Nepal"}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <Button
            onClick={() => onEdit(stop)}
            className="flex-1 h-9 rounded-xl font-bold bg-[#121212] hover:bg-white/10 text-white border border-white/10 gap-2 text-xs"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit Stop
          </Button>

          <Button
            variant="outline"
            onClick={() => onDelete(stop)}
            className="h-9 px-3 rounded-xl font-bold border-white/10 hover:border-red-500/40 hover:bg-red-500/10 text-white/70 hover:text-red-400 text-xs"
            title="Delete Stop"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Inspector Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "overview" | "relationships")}
        className="flex-1 flex flex-col overflow-hidden"
      >
        <div className="px-5 pt-3 border-b border-white/10 bg-white/[0.01]">
          <TabsList className="bg-white/5 p-1 rounded-xl w-full grid grid-cols-2">
            <TabsTrigger
              value="overview"
              className="text-xs font-bold rounded-lg data-[state=active]:bg-[#121212] data-[state=active]:text-[#D3D925] gap-1.5"
            >
              <Info className="w-3.5 h-3.5" />
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="relationships"
              className="text-xs font-bold rounded-lg data-[state=active]:bg-[#121212] data-[state=active]:text-[#D3D925] gap-1.5"
            >
              <Layers className="w-3.5 h-3.5" />
              Relationships
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="p-5 overflow-y-auto flex-1">
          <TabsContent value="overview" className="mt-0">
            <StopInspectorOverview stop={stop} />
          </TabsContent>
          <TabsContent value="relationships" className="mt-0">
            <StopInspectorRelationships
              stop={stop}
              allStops={allStops}
              onSelectStop={onSelectStop}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};
