import { api } from "./axios";

// get all users
const getAllUsers = async () => {
  const { data } = await api.get("/getAllUsers");
  return data;
};

// get user by id
const getUserById = async (userId: string) => {
  const { data } = await api.post("/getuserById", {
    id: userId,
  });
  return data;
};

// delete user by id
const deleteUserById = async (userId: string) => {
  const { data } = await api.delete("/deleteAccount", {
    data: { id: userId },
  });
  return data;
};

// get user dashboard data
const getUserDashboardData = async () => {
  const { data } = await api.get("/userDashboard");
  return data;
};

export { getAllUsers, getUserById, deleteUserById, getUserDashboardData };
