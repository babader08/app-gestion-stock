import axios from "axios";
import authService from "../services/authService";
import toast from "react-hot-toast";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
  timeout: 5000,
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (
        originalRequest.url.includes("/login") ||
        originalRequest.url.includes("/refresh")
      ) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        await authService.refresh();
        return api(originalRequest);
      } catch (refreshError) {
        if (
          refreshError.response?.status === 401 ||
          refreshError.response?.status === 403
        ) {
          console.warn("Session expirée, redirection login");
          window.location.href = "/";
        }
        return Promise.reject(refreshError);
      }
    }

    if (error.code === "ECONNABORTED") {
      toast.error("La connexion est trop lente, réessayez");
    } else if (!error.response) {
      toast.error("Serveur injoignable, réessayez plus tard");
    } else if (error.response.status === 500) {
      toast.error("Erreur interne du serveur");
    }

    return Promise.reject(error);
  },
);
export default api;
