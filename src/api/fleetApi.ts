import { api } from "./axios";

export const getAllFleets = async () => {
  try {
    const { data } = await api.get("/fleet/getAllFleet");
    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const getFleetById = async (id: string) => {
  try {
    const { data } = await api.get(`/fleet/getById/${id}`);
    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const getFleetDashboardData = async () => {
  try {
    const { data } = await api.get("/fleet/fleetDashboard");
    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};