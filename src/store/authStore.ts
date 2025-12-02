import { create } from "zustand";
import { persist } from "zustand/middleware";
type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  userId: string | null;

  login: (data: { token: string; user: User; userId: string }) => void;
  logout: () => void;
}
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      userId: null,

      login: (data) =>
        set(() => ({
          token: data.token,
          user: data.user,
          isAuthenticated: true,
          userId: data.userId,
        })),
      logout: () =>
        set(() => ({
          token: null,
          user: null,
          isAuthenticated: false,
          userId: null,
        })),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        userId: state.userId,
      }),
    }
  )
);
