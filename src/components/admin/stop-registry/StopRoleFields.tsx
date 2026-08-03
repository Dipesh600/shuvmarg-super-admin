import React from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface StopRoleFieldsProps {
  isSearchable: boolean;
  isRouteStop: boolean;
  onChangeSearchable: (checked: boolean) => void;
  onChangeRouteStop: (checked: boolean) => void;
}

export const StopRoleFields: React.FC<StopRoleFieldsProps> = ({
  isSearchable,
  isRouteStop,
  onChangeSearchable,
  onChangeRouteStop,
}) => {
  return (
    <div className="space-y-3 border-t border-white/10 pt-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-widest text-white/50">
          Operational Roles
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Passenger Searchable */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/5">
          <div className="space-y-1 pr-2">
            <Label className="text-xs font-bold text-white cursor-pointer">
              Passenger Searchable
            </Label>
            <p className="text-[10px] text-white/50 leading-relaxed">
              Appears in passenger From/To search dropdown.
            </p>
          </div>
          <Switch
            checked={isSearchable}
            onCheckedChange={onChangeSearchable}
          />
        </div>

        {/* Operational Route Stop */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/5">
          <div className="space-y-1 pr-2">
            <Label className="text-xs font-bold text-white cursor-pointer">
              Operational Route Stop
            </Label>
            <p className="text-[10px] text-white/50 leading-relaxed">
              Can be included in physical route stop sequences.
            </p>
          </div>
          <Switch
            checked={isRouteStop}
            onCheckedChange={onChangeRouteStop}
          />
        </div>
      </div>
    </div>
  );
};
