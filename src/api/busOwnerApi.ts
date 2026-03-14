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

export { getAllBusOwners, getBusOwnerById, getBusOwnerDashboardData };