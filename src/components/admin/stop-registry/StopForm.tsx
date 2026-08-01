import React, { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getStopId } from "./stopRegistryTypes";
import type { AdminStop, StopFormState } from "./stopRegistryTypes";
import { getDescendantStopIds } from "./stopRegistryTree";
import { StopRoleFields } from "./StopRoleFields";
import { StopGeographyFields } from "./StopGeographyFields";
import { StopLocationField } from "./StopLocationField";

interface StopFormProps {
  form: StopFormState;
  onChange: (updater: (prev: StopFormState) => StopFormState) => void;
  allStops: AdminStop[];
  editingStopId?: string | null;
  isEditMode?: boolean;
}

export const StopForm: React.FC<StopFormProps> = ({
  form,
  onChange,
  allStops,
  editingStopId,
  isEditMode = false,
}) => {
  // Extract unique districts and municipalities for autocomplete
  const uniqueDistricts = useMemo(
    () => Array.from(new Set(allStops.map((s) => s.district).filter(Boolean) as string[])).sort(),
    [allStops]
  );
  const uniqueMunicipalities = useMemo(
    () => Array.from(new Set(allStops.map((s) => s.municipality).filter(Boolean) as string[])).sort(),
    [allStops]
  );

  // Compute prohibited parent IDs (self + descendants)
  const invalidParentIds = useMemo(() => {
    const set = new Set<string>();
    if (editingStopId) {
      set.add(editingStopId);
      const descendants = getDescendantStopIds(editingStopId, allStops);
      descendants.forEach((id) => set.add(id));
    }
    return set;
  }, [editingStopId, allStops]);

  // Valid searchable parent options
  const parentOptions = useMemo(() => {
    return allStops
      .filter((s) => {
        const id = getStopId(s);
        if (!id) return false;
        if (invalidParentIds.has(id)) return false;
        return s.isSearchable !== false;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allStops, invalidParentIds]);

  const updateField = <K extends keyof StopFormState>(key: K, value: StopFormState[K]) => {
    onChange((prev) => ({ ...prev, [key]: value }));
  };

  const parentStop = allStops.find((stop) => getStopId(stop) === form.parentStopId) || null;
  const handleMapSelection = (selection: StopFormState["mapSelection"]) => {
    if (!selection) return;
    onChange((current) => ({
      ...current,
      mapSelection: selection,
      name: current.name.trim() ? current.name : selection.suggestedName || "",
      province: current.province.trim() ? current.province : selection.suggestedProvince || "",
      district: current.district.trim() ? current.district : selection.suggestedDistrict || "",
      municipality: current.municipality.trim()
        ? current.municipality : selection.suggestedMunicipality || "",
    }));
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)] lg:items-start">
      <div className="order-1 lg:sticky lg:top-0">
        <StopLocationField
          key={`${editingStopId || "new"}:${form.parentStopId}`}
          value={form.mapSelection}
          parentStop={parentStop}
          allStops={allStops}
          editingStopId={editingStopId}
          onSelect={handleMapSelection}
        />
      </div>

      <div className="order-2 space-y-5">
      {/* Basic Information */}
      <div className="space-y-3">
        <span className="text-[11px] font-bold uppercase tracking-widest text-white/50 block">
          Basic Identification
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Short Code */}
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-white/50">
              Short Code {isEditMode && "(Read-Only)"}
            </Label>
            <Input
              placeholder="KTM"
              readOnly={isEditMode}
              disabled={isEditMode}
              className={`h-10 rounded-xl font-bold uppercase ${
                isEditMode
                  ? "bg-white/5 border-white/10 text-[#D3D925] cursor-not-allowed opacity-90"
                  : "bg-[#121212] border-white/10 text-white"
              }`}
              value={form.code}
              onChange={(e) => updateField("code", e.target.value.toUpperCase())}
            />
          </div>

          {/* Name */}
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-white/50">
              Full Stop Name <span className="text-red-400">*</span>
            </Label>
            <Input
              placeholder="Kathmandu"
              className="h-10 rounded-xl font-bold bg-[#121212] border-white/10 text-white"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Stop Type */}
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-white/50">
              Stop Type
            </Label>
            <Select value={form.type} onValueChange={(v) => updateField("type", v)}>
              <SelectTrigger className="h-10 rounded-xl font-bold bg-[#121212] border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl bg-[#121212] border-white/10 text-white">
                <SelectItem value="CITY">City</SelectItem>
                <SelectItem value="JUNCTION">Junction</SelectItem>
                <SelectItem value="TOWN">Town</SelectItem>
                <SelectItem value="HIGHWAY_STOP">Highway Stop</SelectItem>
                <SelectItem value="BORDER">Border</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Aliases */}
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-white/50">
              Aliases (Comma Separated)
            </Label>
            <Input
              placeholder="Kantipur, Yen"
              className="h-10 rounded-xl font-bold bg-[#121212] border-white/10 text-white"
              value={form.aliases}
              onChange={(e) => updateField("aliases", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Geography */}
      <StopGeographyFields
        province={form.province}
        district={form.district}
        municipality={form.municipality}
        uniqueDistricts={uniqueDistricts}
        uniqueMunicipalities={uniqueMunicipalities}
        onChangeProvince={(v) => updateField("province", v)}
        onChangeDistrict={(v) => updateField("district", v)}
        onChangeMunicipality={(v) => updateField("municipality", v)}
      />

      {/* Roles & Capabilities */}
      <StopRoleFields
        isSearchable={form.isSearchable}
        isRouteStop={form.isRouteStop}
        onChangeSearchable={(c) => updateField("isSearchable", c)}
        onChangeRouteStop={(c) => updateField("isRouteStop", c)}
      />

      {/* Parent Stop Selection */}
      <div className="space-y-1.5 border-t border-white/10 pt-4">
        <Label className="text-[10px] font-bold uppercase tracking-widest text-white/50">
          Parent Stop (Optional)
        </Label>
        <p className="text-[11px] text-white/50 mb-1.5">
          Assign to a broad searchable place (e.g. assign &quot;Balaju&quot; to &quot;Kathmandu&quot;).
        </p>
        <Select
          value={form.parentStopId}
          onValueChange={(v) => updateField("parentStopId", v)}
        >
          <SelectTrigger className="h-11 rounded-xl font-bold bg-[#121212] border-white/10 text-white">
            <SelectValue placeholder="Select broad searchable place..." />
          </SelectTrigger>
          <SelectContent className="rounded-xl bg-[#121212] border-white/10 text-white max-h-60">
            <SelectItem value="none" className="text-white/50">
              None (Top-Level Stop)
            </SelectItem>
            {parentOptions.map((s) => {
              const sId = getStopId(s);
              return (
                <SelectItem key={sId} value={sId}>
                  {s.name} ({s.code || s.district || "Stop"})
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      </div>
    </div>
  );
};
