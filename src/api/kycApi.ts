import { api } from "./axios";

export const getAllKyc = async () => {
  try {
    const { data } = await api.get("/kyc/unified-list");
    return data;
  } catch (error) {
    console.log(error);
  }
};
