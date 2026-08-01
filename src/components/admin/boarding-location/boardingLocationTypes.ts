import type { AdminStop } from "@/components/admin/stop-registry/stopRegistryTypes";

export type BoardingCoordinates = { lat: number; lng: number };
export type BoardingCoordinateSource = "MAP_PIN" | "GOOGLE_PLACE" | "ADMIN_GPS" | "OPERATOR_GPS" | "FIELD_GPS" | "DISCOVERY";
export type BoardingLocationType = "BUS_PARK" | "TERMINAL_GATE" | "BUS_BAY" | "ROADSIDE" | "COUNTER" | "LANDMARK";

export interface BoardingMapSelection {
  coordinates: BoardingCoordinates;
  coordinateSource: BoardingCoordinateSource;
  coordinateAccuracyMeters: number | null;
  capturedAt: string;
  suggestedName?: string;
  suggestedLocationType?: BoardingLocationType;
  providerMetadata?: {
    provider: "GOOGLE";
    placeId: string | null;
    suggestedAddress: string | null;
  };
}

export interface BoardingLocation {
  id: string;
  stopId: string;
  stop: { id: string; code: string | null; name: string | null } | null;
  name: string;
  aliases: string[];
  landmark: string | null;
  address: string | null;
  locationType: BoardingLocationType;
  gateOrBay: string | null;
  directionHint: string | null;
  coordinates: BoardingCoordinates;
  coordinateSource: BoardingCoordinateSource;
  coordinateAccuracyMeters: number | null;
  capturedAt: string | null;
  providerMetadata: BoardingMapSelection["providerMetadata"] | null;
  distanceMeters: number | null;
  verificationStatus: "PENDING" | "VERIFIED" | "REJECTED";
  verificationMethod: "DESK_MAP" | "OPERATOR_EVIDENCE" | "FIELD_GPS" | null;
  verifiedAt: string | null;
  source: "ADMIN" | "OPERATOR_REQUEST" | "FIELD_COLLECTION" | "DISCOVERY" | "LEGACY_MIGRATION";
  status: "ACTIVE" | "INACTIVE";
  activeAssignmentCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface BoardingLocationFormState {
  name: string;
  aliases: string;
  landmark: string;
  address: string;
  locationType: BoardingLocationType;
  gateOrBay: string;
  directionHint: string;
  coordinates: BoardingCoordinates | null;
  coordinateSource: BoardingCoordinateSource;
  coordinateAccuracyMeters: number | null;
  capturedAt: string | null;
  providerMetadata: BoardingMapSelection["providerMetadata"] | null;
  verificationStatus: BoardingLocation["verificationStatus"];
  status: BoardingLocation["status"];
}

export interface BoardingLocationEditorProps {
  open: boolean;
  stop: AdminStop;
  location: BoardingLocation | null;
  existingLocations: BoardingLocation[];
  onOpenChange: (open: boolean) => void;
  onSaved: (location: BoardingLocation) => void;
}

export interface BoardingAssignmentReview {
  id: string;
  usage: "PICKUP" | "DROP" | "BOTH";
  displayName: string | null;
  status: "PENDING_REVIEW" | "ACTIVE" | "INACTIVE" | "REJECTED";
  rejectionReason: string | null;
  boardingLocation: {
    id: string; name: string; status: string; verificationStatus: string;
    stop: { id: string; name: string; code: string } | null;
  } | null;
  brand: { id: string; name: string; code: string; status: string } | null;
}

export interface BoardingOperatorAccess {
  brandId: string;
  brandName: string;
  brandCode: string;
  assignmentId: string | null;
  usage: "PICKUP" | "DROP" | "BOTH";
  status: "NOT_ASSIGNED" | "ACTIVE" | "INACTIVE" | "REJECTED" | "PENDING_REVIEW";
}
