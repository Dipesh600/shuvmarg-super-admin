import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface StopGeographyFieldsProps {
  province: string;
  district: string;
  municipality: string;
  uniqueDistricts: string[];
  uniqueMunicipalities: string[];
  onChangeProvince: (value: string) => void;
  onChangeDistrict: (value: string) => void;
  onChangeMunicipality: (value: string) => void;
}

export const StopGeographyFields: React.FC<StopGeographyFieldsProps> = ({
  province,
  district,
  municipality,
  uniqueDistricts,
  uniqueMunicipalities,
  onChangeProvince,
  onChangeDistrict,
  onChangeMunicipality,
}) => {
  return (
    <div className="space-y-3">
      <span className="text-[11px] font-bold uppercase tracking-widest text-white/50 block">
        Geographic Context
      </span>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label className="text-[10px] font-bold uppercase tracking-widest text-white/50">
            Province
          </Label>
          <Input
            placeholder="Bagmati"
            className="h-10 rounded-xl font-bold bg-[#121212] border-white/10 text-white"
            value={province}
            onChange={(e) => onChangeProvince(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[10px] font-bold uppercase tracking-widest text-white/50">
            District
          </Label>
          <Input
            list="district-list-form"
            placeholder="Kathmandu"
            className="h-10 rounded-xl font-bold bg-[#121212] border-white/10 text-white"
            value={district}
            onChange={(e) => onChangeDistrict(e.target.value)}
          />
          <datalist id="district-list-form">
            {uniqueDistricts.map((d) => (
              <option key={d} value={d} />
            ))}
          </datalist>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[10px] font-bold uppercase tracking-widest text-white/50">
            Municipality
          </Label>
          <Input
            list="municipality-list-form"
            placeholder="Kathmandu Metro"
            className="h-10 rounded-xl font-bold bg-[#121212] border-white/10 text-white"
            value={municipality}
            onChange={(e) => onChangeMunicipality(e.target.value)}
          />
          <datalist id="municipality-list-form">
            {uniqueMunicipalities.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
        </div>
      </div>
    </div>
  );
};
