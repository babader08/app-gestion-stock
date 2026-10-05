import axios from "axios";
import authService from "../services/authService";
import toast from "react-hot-toast";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
  timeout: 15000,
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    console.log("❌ AXIOS ERROR");
    console.log("URL :", originalRequest?.url);
    console.log("METHOD :", originalRequest?.method);
    console.log("CODE :", error.code);
    console.log("MESSAGE :", error.message);
    console.log("STATUS :", error.response?.status);
    console.log("RESPONSE :", error.response?.data);

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
          if (window.location.pathname !== "/") {
            console.warn("Session expirée, redirection login");
            window.location.href = "/";
          }
        }
        return Promise.reject(refreshError);
      }
    }
    if (error.code === "ECONNABORTED") {
      toast.error("Le serveur met du temps à répondre, réessayez dans un instant");
    } else if (!error.response) {
      toast.error("Serveur injoignable, réessayez plus tard");
    } else if (error.response.status === 500) {
      toast.error("Erreur interne du serveur");
    } else {
      toast.error(error.response.data?.message || "Une erreur est survenue");
    }
    return Promise.reject(error);
  },
);
export default api;
