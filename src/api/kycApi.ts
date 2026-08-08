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
  bankName?: string | null;
  accountNumber?: string | null;
  accountHolderName?: string | null;
  branchName?: string | null;
};

export type SecureKycDocumentRequest = {
  ownerId: string;
  documentType: string;
  fileIndex: number;
  certificateIndex?: number;
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
 *
 * @param s3Key - The S3 object key (e.g. "owners/xxx/kyc/company-registration/file.pdf")
 * @returns { blobUrl, mimeType } or null on failure.
 */
export const fetchDocumentAsBlob = async (
  s3Key: string
): Promise<{ blobUrl: string; mimeType: string } | null> => {
  try {
    const token = sessionStorage.getItem("sumarg_admin_token");
    const baseUrl = import.meta.env.VITE_API_URL;
    const response = await fetch(
      `${baseUrl}/api/admin/documents/view?key=${encodeURIComponent(s3Key)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    // Use the actual Content-Type from the server — don't guess from extension
    const mimeType = response.headers.get("Content-Type") ?? "application/octet-stream";
    const blob = await response.blob();
    return { blobUrl: URL.createObjectURL(blob), mimeType };
  } catch (err) {
    console.error("[fetchDocumentAsBlob] Failed:", err);
    return null;
  }
};

export const fetchKycDocumentAsBlob = async (
  request: SecureKycDocumentRequest,
): Promise<{ blobUrl: string; mimeType: string } | null> => {
  try {
    const token = sessionStorage.getItem("sumarg_admin_token");
    const baseUrl = import.meta.env.VITE_API_URL;
    const params = new URLSearchParams({
      busOwnerId: request.ownerId,
      documentType: request.documentType,
      fileIndex: String(request.fileIndex),
    });
    if (request.certificateIndex !== undefined) {
      params.set("certificateIndex", String(request.certificateIndex));
    }
    const response = await fetch(`${baseUrl}/api/admin/busOwner/kycDocumentView?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const mimeType = response.headers.get("Content-Type") ?? "application/octet-stream";
    const blob = await response.blob();
    return { blobUrl: URL.createObjectURL(blob), mimeType };
  } catch (err) {
    console.error("[fetchKycDocumentAsBlob] Failed:", err);
    return null;
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
  const { data } = await api.post<{ success: boolean; data: AdminKycDetail }>("/getBusOwnerKycDetails", {
    id: busOwnerId,
  });
  return data.data;
}

export const getOwnerDetail = async (busOwnerId: string): Promise<AdminBusOwnerDetail> => {
  const { data } = await api.post<{ success: boolean; data: AdminBusOwnerDetail }>("/getBusOwnerDetails", {
    id: busOwnerId,
  });
  return data.data;
};

export const updateOwnerKycStatus = async(payload: any) => {
  const { data } = await api.patch("/busOwnerKycStatus", payload);
  return data;
};
