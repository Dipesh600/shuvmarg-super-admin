import { api } from "./axios";

// ─── Types ────────────────────────────────────────────────────────────────────

export type DriverApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";
export type DriverStatus = "AVAILABLE" | "ON_DUTY" | "OFF_DUTY" | "SUSPENDED" | "INACTIVE";
export type LicenseType = "HV" | "LV" | "TRK";

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
}

export interface CreateDriverPayload {
  brandId: string;
  fullName: string;
  phone: string;
  email?: string;
  gender?: string;
  address?: string;
  licenseNumber: string;
  licenseType: LicenseType;
  licenseExpiry: string;
  medicalCertExpiry?: string;
  experienceYears?: number;
  previousEmployer?: string;
  notes?: string;
  licenseDoc?: File | null;
  medicalCertDoc?: File | null;
  photo?: File | null;
}

export interface UpdateDriverPayload {
  fullName?: string;
  phone?: string;
  email?: string;
  gender?: string;
  address?: string;
  licenseNumber?: string;
  licenseType?: LicenseType;
  licenseExpiry?: string;
  medicalCertExpiry?: string;
  experienceYears?: number;
  previousEmployer?: string;
  notes?: string;
  status?: DriverStatus;
  // File references returned after upload
  licenseDoc?: File | null;
  medicalCertDoc?: File | null;
  photo?: File | null;
}

// ─── API Functions ────────────────────────────────────────────────────────────

/** Create a new driver profile under a brand (JSON only) */
export const createDriver = async (payload: CreateDriverPayload): Promise<{ success: boolean; data: DriverProfile }> => {
  const { data } = await api.post("/drivers", payload);
  return data;
};

/** Create driver with optional file uploads — sends FormData */
export const createDriverWithFiles = async (
  payload: CreateDriverPayload
): Promise<{ success: boolean; data: DriverProfile }> => {
  const fd = new FormData();

  // Append scalar fields
  const scalarKeys: Array<keyof CreateDriverPayload> = [
    "brandId", "fullName", "phone", "email", "gender", "address",
    "licenseNumber", "licenseType", "licenseExpiry",
    "medicalCertExpiry", "experienceYears", "previousEmployer", "notes",
  ];
  for (const key of scalarKeys) {
    const val = payload[key];
    if (val !== undefined && val !== null && val !== "") {
      fd.append(key, String(val));
    }
  }

  // Append file fields
  if (payload.licenseDoc instanceof File)    fd.append("licenseDoc",    payload.licenseDoc);
  if (payload.medicalCertDoc instanceof File) fd.append("medicalCertDoc", payload.medicalCertDoc);
  if (payload.photo instanceof File)          fd.append("photo",          payload.photo);

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
): Promise<{ success: boolean; data: DriverProfile }> => {
  const fd = new FormData();

  // Append scalar fields
  const scalarKeys: Array<keyof UpdateDriverPayload> = [
    "fullName", "phone", "email", "gender", "address",
    "licenseNumber", "licenseType", "licenseExpiry",
    "medicalCertExpiry", "experienceYears", "previousEmployer", "notes", "status",
  ];
  for (const key of scalarKeys) {
    const val = payload[key];
    if (val !== undefined && val !== null && val !== "") {
      fd.append(key, String(val));
    }
  }

  // Append file fields
  if (payload.licenseDoc instanceof File)    fd.append("licenseDoc",    payload.licenseDoc);
  if (payload.medicalCertDoc instanceof File) fd.append("medicalCertDoc", payload.medicalCertDoc);
  if (payload.photo instanceof File)          fd.append("photo",          payload.photo);

  const { data } = await api.patch(`/drivers/${driverId}`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

/** Admin approves a driver — makes them AVAILABLE for schedule assignment */
export const approveDriver = async (driverId: string): Promise<{ success: boolean; data: DriverProfile }> => {
  const { data } = await api.patch(`/drivers/${driverId}/approve`);
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
