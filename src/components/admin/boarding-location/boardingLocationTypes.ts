import type { AdminStop } from "@/components/admin/stop-registry/stopRegistryTypes";

export type BoardingCoordinates = { lat: number; lng: number };

export interface BoardingLocation {
  id: string;
  stopId: string;
  stop: { id: string; code: string | null; name: string | null } | null;
  name: string;
  aliases: string[];
  landmark: string | null;
  address: string | null;
  coordinates: BoardingCoordinates;
  distanceMeters: number | null;
  verificationStatus: "PENDING" | "VERIFIED" | "REJECTED";
  source: "ADMIN" | "OPERATOR_REQUEST" | "FIELD_COLLECTION" | "DISCOVERY" | "LEGACY_MIGRATION";
  status: "ACTIVE" | "INACTIVE";
  createdAt?: string;
  updatedAt?: string;
}

export interface BoardingLocationFormState {
  name: string;
  aliases: string;
  landmark: string;
  address: string;
  coordinates: BoardingCoordinates | null;
  verificationStatus: BoardingLocation["verificationStatus"];
  status: BoardingLocation["status"];
}

export interface BoardingLocationEditorProps {
  open: boolean;
  stop: AdminStop;
  location: BoardingLocation | null;
  onOpenChange: (open: boolean) => void;
  onSaved: (location: BoardingLocation) => void;
}
