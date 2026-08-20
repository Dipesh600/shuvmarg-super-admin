import type { SeatLayoutV3 } from "@/features/seat-layout-v3/types";

export interface AdminFleetLayoutChoice {
  templateId: string | null;
  templateName: string;
  revisionId: string | null;
  totalPlaces: number;
  layout: SeatLayoutV3;
  customized: boolean;
  sourceTemplateId: string | null;
  templateScope?: "PLATFORM" | "OPERATOR";
}
