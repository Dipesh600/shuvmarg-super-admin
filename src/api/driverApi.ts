import { api } from "./axios";

// ─── Types ────────────────────────────────────────────────────────────────────

export type DriverApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";
export type DriverStatus = "AVAILABLE" | "ON_DUTY" | "OFF_DUTY" | "SUSPENDED" | "INACTIVE";
export type LicenseType = "HV" | "LV" | "TRK";
export type DriverAccessStatus = "NOT_LINKED" | "INVITED" | "ACTIVE" | "SUSPENDED" | "REMOVED";
export type DriverNotificationStatus = "QUEUED" | "FAILED" | "NOT_REQUESTED";
export type DriverInvitationDeliveryStatus = "NOT_REQUIRED" | "PENDING" | "QUEUED" | "FAILED";

export interface DriverProfile {
  _id: string;
  brandId: string | { _id: string; brandName: string };
  ownerId: string;
  fullName: string;
  phone: string;
  email?: string;
  photo?: string;
  address?: string;
  gender?: string;
  licenseNumber: string;
  licenseType: LicenseType;
  licenseExpiry: string;
  licenseDoc?: string;
  medicalCertExpiry?: string;
  medicalCertDoc?: string;
  experienceYears: number;
  previousEmployer?: string;
  assignedBusId?: { _id: string; busName: string; busNumber: string } | null;
  status: DriverStatus;
  approvalStatus: DriverApprovalStatus;
  approvedAt?: string;
  rejectionReason?: string;
  notes?: string;
  createdAt: string;
  userId?: string | null;
  accessStatus: DriverAccessStatus;
  invitationDeliveryStatus: DriverInvitationDeliveryStatus;
  phoneVerified?: boolean;
  invitedAt?: string | null;
  activatedAt?: string | null;
  invitationLastAttemptAt?: string | null;
  removedAt?: string | null;
  documents?: {
    license?: { url?: string | null };
    medical?: { url?: string | null };
  };
}

export interface DriverAccessResult {
  userId: string;
  profileId: string;
  activationRequired: boolean;
  notificationStatus: DriverNotificationStatus;
}

export interface DriverWriteResponse {
  success: boolean;
  message?: string;
  data: DriverProfile | DriverAccessResult;
}

export interface CreateDriverPayload {
  brandId: string;
  fullName: string;
  phone: string;
  gender: "male" | "female" | "other" | "";
  experienceYears: number;
  licenseNumber: string;
  licenseType: LicenseType;
  licenseExpiry: string;
  licenseDoc?: File | null;
}

export interface UpdateDriverPayload {
  fullName?: string;
  phone?: string;
  gender?: "male" | "female" | "other" | "";
  experienceYears?: number;
  licenseNumber?: string;
  licenseType?: LicenseType;
  licenseExpiry?: string;
  status?: DriverStatus;
  licenseDoc?: File | null;
}

export interface SecureDriverDocumentRequest {
  driverId: string;
  slot: "license" | "medical" | "photo";
}

export const fetchDriverDocumentAsBlob = async (request: SecureDriverDocumentRequest) => {
  try {
    const response = await api.get<Blob>(
      `/drivers/${encodeURIComponent(request.driverId)}/documents/${request.slot}/view`,
      { responseType: "blob" },
    );
    return { blobUrl: URL.createObjectURL(response.data), mimeType: response.data.type, error: null };
  } catch {
    return { blobUrl: null, mimeType: null, error: "Unable to load this document. It may need to be uploaded again." };
  }
};

// ─── API Functions ────────────────────────────────────────────────────────────

/** Create a new driver profile under a brand (JSON only) */
export const createDriver = async (payload: CreateDriverPayload): Promise<{ success: boolean; data: DriverProfile }> => {
  const { data } = await api.post("/drivers", payload);
  return data;
};

/** Create driver with optional file uploads — sends FormData */
export const createDriverWithFiles = async (
  payload: CreateDriverPayload
): Promise<DriverWriteResponse> => {
  const fd = new FormData();

  // Append scalar fields
  const scalarKeys: Array<keyof CreateDriverPayload> = [
    "brandId", "fullName", "phone", "gender", "experienceYears",
    "licenseNumber", "licenseType", "licenseExpiry",
  ];
  for (const key of scalarKeys) {
    const val = payload[key];
    if (val !== undefined && val !== null && val !== "") {
      fd.append(key, String(val));
    }
  }

  // Append file fields
  if (payload.licenseDoc instanceof File) fd.append("licenseDoc", payload.licenseDoc);

  const { data } = await api.post("/drivers", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

/** Re-send setup instructions for invited accounts or login instructions for existing accounts. */
export const resendDriverAccessMessage = async (driver: DriverProfile): Promise<DriverWriteResponse> => {
  const brandId = typeof driver.brandId === "string" ? driver.brandId : driver.brandId._id;
  const fd = new FormData();
  const values = {
    brandId,
    fullName: driver.fullName,
    phone: driver.phone,
    gender: driver.gender || "other",
    experienceYears: driver.experienceYears || 0,
    licenseNumber: driver.licenseNumber,
    licenseType: driver.licenseType,
    licenseExpiry: driver.licenseExpiry,
    resendInvite: true,
  };
  Object.entries(values).forEach(([key, value]) => fd.append(key, String(value)));
  const { data } = await api.post("/drivers", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

/** List all drivers for a brand (approved only by default, pass ?approvalStatus=PENDING for review queue) */
export const getDriversByBrand = async (
  brandId: string,
  params?: { approvalStatus?: DriverApprovalStatus; status?: DriverStatus }
): Promise<{ success: boolean; results: number; data: DriverProfile[] }> => {
  const { data } = await api.get(`/brands/${brandId}/drivers`, { params });
  return data;
};

/** Get single driver details */
export const getDriverById = async (driverId: string): Promise<{ success: boolean; data: DriverProfile }> => {
  const { data } = await api.get(`/drivers/${driverId}`);
  return data;
};

/** Update driver info — JSON fields only */
export const updateDriver = async (
  driverId: string,
  payload: Partial<UpdateDriverPayload>
): Promise<{ success: boolean; data: DriverProfile }> => {
  const { data } = await api.patch(`/drivers/${driverId}`, payload);
  return data;
};

/** Update driver with optional file re-uploads — sends FormData */
export const updateDriverWithFiles = async (
  driverId: string,
  payload: Partial<UpdateDriverPayload>
): Promise<{ success: boolean; message?: string; data: DriverProfile }> => {
  const fd = new FormData();

  // Append scalar fields
  const scalarKeys: Array<keyof UpdateDriverPayload> = [
    "fullName", "phone", "gender", "experienceYears",
    "licenseNumber", "licenseType", "licenseExpiry", "status",
  ];
  for (const key of scalarKeys) {
    const val = payload[key];
    if (val !== undefined && val !== null && val !== "") {
      fd.append(key, String(val));
    }
  }

  // Append file fields
  if (payload.licenseDoc instanceof File) fd.append("licenseDoc", payload.licenseDoc);

  const { data } = await api.patch(`/drivers/${driverId}`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

/** Admin rejects a driver with a reason */
export const rejectDriver = async (
  driverId: string,
  reason: string
): Promise<{ success: boolean; data: DriverProfile }> => {
  const { data } = await api.patch(`/drivers/${driverId}/reject`, { reason });
  return data;
};

/** Assign a bus as a driver's primary vehicle */
export const assignBusToDriver = async (
  driverId: string,
  busId: string
): Promise<{ success: boolean; data: DriverProfile }> => {
  const { data } = await api.patch(`/drivers/${driverId}/assign-bus`, { busId });
  return data;
};

/** Platform-wide driver list (admin use) */
export const getAllDrivers = async (params?: {
  page?: number;
  limit?: number;
  approvalStatus?: DriverApprovalStatus;
  status?: DriverStatus;
  brandId?: string;
}): Promise<{ success: boolean; results: number; data: DriverProfile[] }> => {
  const { data } = await api.get("/drivers", { params });
  return data;
};
