import { createContext, useContext } from "react";
import type { Admin } from "@/api/authApi";

export interface AuthContextType {
  admin: Admin | null;
  isAuthenticated: boolean;
  token: string | null;
  loading: boolean;
  login: (token: string, data: Admin) => void;
  logout: (reason?: string) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
};
