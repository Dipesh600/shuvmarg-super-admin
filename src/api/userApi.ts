import { api } from "./axios";

export interface UsersResponse {
  success?: boolean;
  data?: UserRecord[];
  pagination?: { page: number; limit: number; total: number; totalPages: number };
}

export interface UserRecord {
  _id: string;
  name: string;
  phone: string;
  profilePicture: string;
  email: string;
  status: "active" | "inactive" | "banned";
  isVerified: boolean;
  bookingCount?: number;
  totalSpent?: number;
  createdAt: string;
  role: string;
  roles?: string[];
  lastLoginAt?: string;
  address?: string;
  gender?: string;
  referralCode: string;
  totalReferrals: number;
  yatrapoints: number;
}
type UserAuditEntry = { _id?: string; action: string; createdAt: string; reason?: string; adminId?: { name?: string } };
type UserDetailResponse = {
  data: {
    profile?: UserRecord;
    metrics?: { bookings?: { total?: number; totalSpent?: number } };
    security?: { lastLoginAt?: string; suspensionReason?: string; suspendedAt?: string; activeSessions?: number; failedLoginAttempts?: number; accountLocked?: boolean; forcePasswordChange?: boolean };
    referral?: { code?: string; totalReferrals?: number };
    auditLog?: UserAuditEntry[];
  };
};

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
  const { data } = await api.post<UserDetailResponse>("/getuserById", {
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
