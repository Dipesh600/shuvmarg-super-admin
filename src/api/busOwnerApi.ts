import { api } from "./axios";

export type AdminBusOwnerListItem = {
  ownerId: string;
  ownerCode: string | null;
  userId: string | null;
  name: string;
  email: string;
  phone: string;
  profilePicture: string | null;
  companyName: string;
  verificationStatus: "pending" | "approved" | "rejected";
  fleetCount: number;
  userStatus: string;
  createdAt: string | null;
  updatedAt: string | null;
};

type AdminBusOwnerListData = {
  items: AdminBusOwnerListItem[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
};

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
};

// get all busowners
const getAllBusOwners = async (): Promise<AdminBusOwnerListData> => {
  const { data } = await api.get<ApiEnvelope<AdminBusOwnerListData>>("/bus-owners");
  if (!data.success || !data.data || !Array.isArray(data.data.items)) {
    throw new Error("The bus owner directory returned an invalid response.");
  }
  return data.data;
};

// get bus owner by id
const getBusOwnerById = async (userId: string) => {
  const { data } = await api.post("/getBusOwnerDetails", {
    id: userId,
  });
  return data;
};

// get bus owner dashboard data
const getBusOwnerDashboardData = async () => {
  const { data } = await api.get("/busOwnerDashboard");
  return data;
};

// create new bus owner (FormData with files)
const createBusOwner = async (formData: FormData) => {
  const { data } = await api.post("/busOwner/create", formData);
  return data;
};

// reupload specific KYC document
const reuploadKycDocument = async (formData: FormData) => {
  const { data } = await api.post("/busOwner/reuploadKycDocument", formData);
  return data;
};

// update bus owner details
const updateBusOwner = async (payload: Record<string, unknown>) => {
  const { data } = await api.patch("/busOwner/update", payload);
  return data;
};

export { getAllBusOwners, getBusOwnerById, getBusOwnerDashboardData, createBusOwner, reuploadKycDocument, updateBusOwner };
