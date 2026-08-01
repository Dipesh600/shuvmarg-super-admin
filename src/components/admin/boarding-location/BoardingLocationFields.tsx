import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { BoardingLocationFormState } from "./boardingLocationTypes";

export function BoardingLocationFields({
  value,
  onChange,
}: {
  value: BoardingLocationFormState;
  onChange: (value: BoardingLocationFormState) => void;
}) {
  const set = <K extends keyof BoardingLocationFormState>(
    key: K,
    next: BoardingLocationFormState[K],
  ) => onChange({ ...value, [key]: next });

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="boarding-name">Location name</Label>
        <Input id="boarding-name" value={value.name} onChange={(event) => set("name", event.target.value)} placeholder="e.g. Kalanki Chowk" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="boarding-aliases">Aliases</Label>
        <Input id="boarding-aliases" value={value.aliases} onChange={(event) => set("aliases", event.target.value)} placeholder="Comma-separated alternate names" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="boarding-landmark">Landmark</Label>
        <Input id="boarding-landmark" value={value.landmark} onChange={(event) => set("landmark", event.target.value)} placeholder="Near the pedestrian bridge" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="boarding-address">Passenger recognition details</Label>
        <Textarea id="boarding-address" value={value.address} onChange={(event) => set("address", event.target.value)} placeholder="Physical address or stable recognition details" rows={3} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Verification</Label>
          <Select value={value.verificationStatus} onValueChange={(next) => set("verificationStatus", next as BoardingLocationFormState["verificationStatus"])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="VERIFIED">Verified</SelectItem>
              <SelectItem value="PENDING">Pending review</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={value.status} onValueChange={(next) => set("status", next as BoardingLocationFormState["status"])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Map coordinates</p>
        <p className="mt-1 font-mono text-xs text-white/80">
          {value.coordinates
            ? `${value.coordinates.lat.toFixed(6)}, ${value.coordinates.lng.toFixed(6)}`
            : "Choose a precise point on the map"}
        </p>
      </div>
    </div>
  );
}
