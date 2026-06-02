import { api } from "./axios";

// get all busowners
const getAllBusOwners = async () => {
  const { data } = await api.get("/getAllBusOwners");
  return data;
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
const updateBusOwner = async (payload: any) => {
  const { data } = await api.patch("/busOwner/update", payload);
  return data;
};

export { getAllBusOwners, getBusOwnerById, getBusOwnerDashboardData, createBusOwner, reuploadKycDocument, updateBusOwner };