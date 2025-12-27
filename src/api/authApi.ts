import axios from "axios";
import { api } from "./axios";
const apiUrl = "http://34.229.93.103";
export type Admin = {
  id: string;
  adminId: string;
  // name: string;
  email: string;
  role: string;
};
type LoginType = {
  email: string;
  password: string;
  adminId: string;
  otp:string;
};

const loginAdmin = async ({ adminId, email, password, otp }: LoginType) => {
  const { data } = await axios.post(
    `${apiUrl}/api/admin/auth/login`,
    
    { email, password, adminId, otp },
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  return data;
};

const getAdmin = async () => {
  const { data } = await api.get("/api/admin/accountStatus");
  return data;
};

const logoutAdmin = async () => {
  const { data } = await api.post("/auth/logout");
  return data;
};
export { getAdmin, loginAdmin, logoutAdmin };
