import { api } from "./axios";

export interface UsersResponse {
  success?: boolean;
  data?: any[];
  pagination?: any;
}

// Get all users with optional search, status filter, and pagination
const getAllUsers = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}): Promise<UsersResponse> => {
  const { data } = await api.get("/getAllUsers", { params });
  return data;
};

// Get enriched user profile by ID
const getUserById = async (userId: string) => {
  const { data } = await api.post("/getuserById", {
    id: userId,
  });
  return data;
};

// Soft-delete user by id
const deleteUserById = async (userId: string, reason?: string) => {
  const { data } = await api.delete("/deleteAccount", {
    data: { id: userId, reason },
  });
  return data;
};

// Get user dashboard data
const getUserDashboardData = async () => {
  const { data } = await api.get("/userDashboard");
  return data;
};

// Get user transactions
const getUserTransactions = async (
  userId: string,
  params?: { page?: number; limit?: number }
) => {
  const { data } = await api.get(`/users/${userId}/transactions`, { params });
  return data;
};

// Update user status (ban, suspend, reactivate) with reason
const updateUserStatus = async (payload: {
  id: string;
  status: "active" | "inactive" | "banned";
  reason?: string;
}) => {
  const { data } = await api.patch("/updateStatus", payload);
  return data;
};

export {
  getAllUsers,
  getUserById,
  deleteUserById,
  getUserDashboardData,
  getUserTransactions,
  updateUserStatus,
};
