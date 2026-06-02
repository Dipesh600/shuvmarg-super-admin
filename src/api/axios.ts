import axios from "axios";

const apiUrl = import.meta.env.VITE_API_URL;

export const api = axios.create({
  baseURL: `${apiUrl}/api/admin`,
});

// Attach the Super Admin JWT on every outgoing request
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("sumarg_admin_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On any 401 (expired or invalid token), immediately clear the session
// and redirect to login. Super Admin sessions are explicit — no silent refresh.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem("sumarg_admin_token");
      sessionStorage.removeItem("sumarg_admin_data");
      // Only redirect if not already on the login page (prevents redirect loops)
      if (!window.location.pathname.includes("/auth/login")) {
        window.location.href = "/auth/login";
      }
    }
    return Promise.reject(error);
  }
);
