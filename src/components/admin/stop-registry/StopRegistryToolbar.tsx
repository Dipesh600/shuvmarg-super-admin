import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X, RotateCcw } from "lucide-react";
import type { StopFilterState } from "./stopRegistryTypes";

interface StopRegistryToolbarProps {
  filters: StopFilterState;
  onFilterChange: (updater: (prev: StopFilterState) => StopFilterState) => void;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
}

export const StopRegistryToolbar: React.FC<StopRegistryToolbarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  hasActiveFilters,
}) => {
  const updateFilter = <K extends keyof StopFilterState>(key: K, value: StopFilterState[K]) => {
    onFilterChange((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="p-3.5 rounded-2xl border border-white/10 bg-[#121212]/40 backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
      {/* Left side: Search input */}
      <div className="relative flex-1 min-w-[220px] max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <Input
          placeholder="Search by name, code, alias, district..."
          className="pl-9 pr-8 h-9 rounded-xl text-xs bg-[#121212] border-white/10 text-white placeholder:text-white/40 font-medium"
          value={filters.search}
          onChange={(e) => updateFilter("search", e.target.value)}
        />
        {filters.search && (
          <button
            type="button"
            onClick={() => updateFilter("search", "")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Right side: Dropdown filters */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Role Filter */}
        <Select
          value={filters.role}
          onValueChange={(v) => updateFilter("role", v as StopFilterState["role"])}
        >
          <SelectTrigger className="h-9 text-xs rounded-xl font-bold bg-[#121212] border-white/10 text-white w-36">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent className="rounded-xl bg-[#121212] border-white/10 text-white text-xs">
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="searchable">Passenger Searchable</SelectItem>
            <SelectItem value="route_stop">Route Stop</SelectItem>
            <SelectItem value="both">Both Roles</SelectItem>
            <SelectItem value="neither">Neither Role</SelectItem>
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select
          value={filters.status}
          onValueChange={(v) => updateFilter("status", v as StopFilterState["status"])}
        >
          <SelectTrigger className="h-9 text-xs rounded-xl font-bold bg-[#121212] border-white/10 text-white w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="rounded-xl bg-[#121212] border-white/10 text-white text-xs">
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
          </SelectContent>
        </Select>

        {/* Verification Filter */}
        <Select
          value={filters.verification}
          onValueChange={(v) => updateFilter("verification", v as StopFilterState["verification"])}
        >
          <SelectTrigger className="h-9 text-xs rounded-xl font-bold bg-[#121212] border-white/10 text-white w-32">
            <SelectValue placeholder="Verification" />
          </SelectTrigger>
          <SelectContent className="rounded-xl bg-[#121212] border-white/10 text-white text-xs">
            <SelectItem value="all">All Verification</SelectItem>
            <SelectItem value="VERIFIED">Verified</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
          </SelectContent>
        </Select>

        {/* Parent Relationship Filter */}
        <Select
          value={filters.parentRelation}
          onValueChange={(v) => updateFilter("parentRelation", v as StopFilterState["parentRelation"])}
        >
          <SelectTrigger className="h-9 text-xs rounded-xl font-bold bg-[#121212] border-white/10 text-white w-36">
            <SelectValue placeholder="Hierarchy" />
          </SelectTrigger>
          <SelectContent className="rounded-xl bg-[#121212] border-white/10 text-white text-xs">
            <SelectItem value="all">All Hierarchy</SelectItem>
            <SelectItem value="top_level">Top-Level Stops</SelectItem>
            <SelectItem value="child">Child Sub-Stops</SelectItem>
            <SelectItem value="has_children">Has Children</SelectItem>
          </SelectContent>
        </Select>

        {/* Reset Filters CTA */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            onClick={onResetFilters}
            className="h-9 px-3 rounded-xl text-xs font-bold text-[#D3D925] hover:bg-[#D3D925]/10 gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </Button>
        )}
      </div>
    </div>
  );
};
