import { api } from "./axios";

export type KycDocumentDescriptor = {
  present: boolean;
  available: boolean;
  fileCount: number;
  verified?: boolean;
  rejectionReason?: string | null;
  panNumber?: string | null;
  vatNumber?: string | null;
  registrationNumber?: string | null;
  // Compatibility fields for KYC responses served by the previous backend.
  bankName?: string | null;
  accountNumber?: string | null;
  accountHolderName?: string | null;
  branchName?: string | null;
  swiftCode?: string | null;
};

export type SecureKycDocumentRequest = {
  ownerId: string;
  documentType: string;
  fileIndex: number;
};

export type SettlementAccount = {
  bankName: string | null;
  accountNumber: string | null;
  accountHolderName: string | null;
  branchName: string | null;
  swiftCode: string | null;
};

export type AdminKycDetail = {
  ownerId: string;
  ownerCode: string | null;
  userId: string | null;
  owner: {
    name: string;
    email: string;
    phone: string;
    companyName: string;
    registeredAddress: Record<string, string | null> | null;
  };
  bank: SettlementAccount;
  verificationStatus: string;
  documentSecurity: { status: string; scannedAt: string | null; availableToReview: boolean };
  rejectionReason: string | null;
  documents: Record<string, KycDocumentDescriptor>;
  createdAt: string | null;
  updatedAt: string | null;
};

export type AdminBusOwnerDetail = {
  ownerId: string;
  ownerCode: string | null;
  userId: string | null;
  profile: { name: string; email: string; phone: string; profilePicture: string | null; status: string };
  business: { companyName: string };
  bank: KycDocumentDescriptor & { present: boolean };
  documents: Record<string, KycDocumentDescriptor>;
  verificationStatus: string;
  rejectionReason: string | null;
  fleetSummary: { fleetSize: number; buses: unknown[] };
  createdAt: string | null;
  updatedAt: string | null;
};

/**
 * Fetches a private S3 document through the secure server-side proxy.
 * Returns a temporary object URL (blob) that is only valid in the current
 * browser session — the raw S3 presigned URL is never exposed to the client.
 */
export type DocumentBlobResult =
  | {
      blobUrl: string;
      mimeType: string;
      error?: undefined;
    }
  | {
      blobUrl?: undefined;
      mimeType?: undefined;
      error: string;
    };

export const fetchDocumentAsBlob = async (
  s3Key: string
): Promise<DocumentBlobResult> => {
  try {
    const token = sessionStorage.getItem("sumarg_admin_token");
    const baseUrl = import.meta.env.VITE_API_URL;
    const response = await fetch(
      `${baseUrl}/api/admin/documents/view?key=${encodeURIComponent(s3Key)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (!response.ok) {
      const errJson = await response.json().catch(() => null);
      const msg = errJson?.message || `Failed to load document (HTTP ${response.status})`;
      return { error: msg };
    }
    const mimeType = response.headers.get("Content-Type") ?? "application/octet-stream";
    const blob = await response.blob();
    return { blobUrl: URL.createObjectURL(blob), mimeType };
  } catch (err: any) {
    console.error("[fetchDocumentAsBlob] Failed:", err);
    return { error: err?.message || "Failed to load document." };
  }
};

export const fetchKycDocumentAsBlob = async (
  request: SecureKycDocumentRequest,
): Promise<DocumentBlobResult> => {
  try {
    const token = sessionStorage.getItem("sumarg_admin_token");
    const baseUrl = import.meta.env.VITE_API_URL;
    const params = new URLSearchParams({
      busOwnerId: request.ownerId,
      documentType: request.documentType,
      fileIndex: String(request.fileIndex),
    });
    const response = await fetch(`${baseUrl}/api/admin/busOwner/kycDocumentView?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      const errJson = await response.json().catch(() => null);
      const msg = errJson?.message || `Failed to load document (HTTP ${response.status})`;
      return { error: msg };
    }
    const mimeType = response.headers.get("Content-Type") ?? "application/octet-stream";
    const blob = await response.blob();
    return { blobUrl: URL.createObjectURL(blob), mimeType };
  } catch (err: any) {
    console.error("[fetchKycDocumentAsBlob] Failed:", err);
    return { error: err?.message || "Failed to load document." };
  }
};

export const getAllKyc = async () => {
  try {
    const { data } = await api.get("/kyc/unified-list");
    return data;
  } catch (error) {
    console.log(error);
  }
};

export const getOwnerKycDetail = async (busOwnerId: string): Promise<AdminKycDetail> => {
  type AdminKycDetailWire = Omit<AdminKycDetail, "bank"> & {
    bank?: Partial<SettlementAccount> | null;
  };
  const { data } = await api.post<{ success: boolean; data: AdminKycDetailWire }>("/getBusOwnerKycDetails", {
    id: busOwnerId,
  });
  const payload = data.data;
  const legacyBank = payload.documents?.bankDetails;
  return {
    ...payload,
    bank: {
      bankName: payload.bank?.bankName ?? legacyBank?.bankName ?? null,
      accountNumber: payload.bank?.accountNumber ?? legacyBank?.accountNumber ?? null,
      accountHolderName: payload.bank?.accountHolderName ?? legacyBank?.accountHolderName ?? null,
      branchName: payload.bank?.branchName ?? legacyBank?.branchName ?? null,
      swiftCode: payload.bank?.swiftCode ?? legacyBank?.swiftCode ?? null,
    },
  };
};

export const getOwnerDetail = async (busOwnerId: string): Promise<AdminBusOwnerDetail> => {
  const { data } = await api.post<{ success: boolean; data: AdminBusOwnerDetail }>("/getBusOwnerDetails", {
    id: busOwnerId,
  });
  return data.data;
};

export const updateOwnerKycStatus = async (payload: any) => {
  const { data } = await api.patch("/busOwnerKycStatus", payload);
  return data;
};
