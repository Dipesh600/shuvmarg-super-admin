import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { type Admin, getAdmin } from "../api/authApi";
import { useNavigate } from "react-router-dom";

type AuthContextType = {
  admin: Admin | null;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;

  loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const qc = useQueryClient();
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: getAdmin,
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });

  const login = (token: string) => {
    localStorage.setItem("token", token);
    qc.invalidateQueries({ queryKey: ["me"]});
  };

  const logout = () => {
    localStorage.removeItem("token");
    qc.clear();
    navigate("/auth/login", { replace: true });
  };
  useEffect(() => {
    if (data && token) {
      navigate("/admin", { replace: true });
    }
  }, [token, data]);
  return (
    <AuthContext.Provider
      value={{
        admin: data ?? null,
        isAuthenticated: !!data,
        login,
        logout,

        loading: isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
export default AuthProvider;
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
