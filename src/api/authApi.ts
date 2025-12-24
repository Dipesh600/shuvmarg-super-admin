import axios from "axios";
import { api } from "./axios";

export type Admin = {
  id: string;
  name: string;
  email: string;
  role: string;
};
type LoginType = {
  email: string;
  password: string;
  adminCode: string;
};

const loginAdmin = async ({ email, password, adminCode }: LoginType) => {
  const { data } = await axios.post(
    "http://localhost:4000/api/admin/auth/login",
    { email, password, adminCode },
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  return data;
};

const getAdmin = async () => {
  const { data } = await api.get("/auth/profile");
  return data;
};

const logoutAdmin = async () => {
  const { data } = await api.post("/auth/logout");
  return data;
};
export { getAdmin, loginAdmin, logoutAdmin };
