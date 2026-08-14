import { ArrowLeft } from "lucide-react";
import SeatLayoutBuilder from "@/features/seat-layout-v3/SeatLayoutBuilder";
import type { SeatLayoutV3 } from "@/features/seat-layout-v3/types";

interface Props {
  title: string;
  layout: SeatLayoutV3 | null;
  busy: boolean;
  onChange: (layout: SeatLayoutV3) => void;
  onUse: (layout: SeatLayoutV3) => void;
  onCancel: () => void;
}

export default function FleetSeatLayoutDesigner({ title, layout, busy, onChange, onUse, onCancel }: Props) {
  return <div className="space-y-4">
    <div className="flex items-center gap-3">
      <button type="button" onClick={onCancel} className="flex size-9 items-center justify-center rounded-xl border border-[#DCD4CD]" aria-label="Back to templates"><ArrowLeft className="size-4" /></button>
      <div><h4 className="font-black text-[#211D1A]">{title}</h4><p className="text-xs text-[#746E69]">Add, remove, move or rename only what differs on this bus.</p></div>
    </div>
    <SeatLayoutBuilder layout={layout} onChange={onChange} onSave={onUse} busy={busy} saveLabel="Use this layout" simple />
  </div>;
}
