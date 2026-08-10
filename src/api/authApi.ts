import { api } from "./axios";
export type Admin = {
  id: string;
  adminId: string;
  // name: string;
  email: string;
  role: string;
  isRootAdmin?: boolean;
};
type LoginType = {
  email: string;
  password: string;
  adminId: string;
  otp: string;
};

const loginAdmin = async ({ adminId, email, password, otp }: LoginType) => {
  const { data } = await api.post(
    "/auth/login",

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
