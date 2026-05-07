import api from "../api/axios";

const authService = {
  register: async (userData) => {
    try {
      const response = await api.post("/register", userData);
      return response.data;
    } catch (error) {
      throw error.response
        ? error.response.data
        : new Error("Une erreur est survenue de notre part");
    }
  },

  verifyOTP: async ({ code }) => {
    try {
      const response = await api.post("/verify", { code });
      return response.data;
    } catch (error) {
      console.log(error);
      throw error.response
        ? error.response.data
        : new Error("Une erreur est survenue de notre part");
    }
  },

  login: async ({ email, password }) => {
    try {
      const response = await api.post("/login", { email, password });
      return response.data;
    } catch (error) {
      throw error.response?.data || new Error("Une erreur est survenue");
    }
  },

  requestPasswordReset: async ({ email }) => {
    try {
      const response = await api.post("/password-reset-request", { email });
      return response.data;
    } catch (error) {
      throw error.response?.data || new Error("Une erreur est survenue");
    }
  },

  resetPassword: async ({ code, newPassword }) => {
    try {
      const response = await api.post("/password-reset", { code, newPassword });
      return response.data;
    } catch (error) {
      throw error.response?.data || new Error("Une erreur est survenue");
    }
  },

  resendOTP: async ({ email }) => {
    try {
      const response = await api.post("/resend-otp", { email });
      return response.data;
    } catch (error) {
      throw error.response?.data || new Error("Une erreur est survenue");
    }
  },

  checkAuth: async () => {
    try {
      const response = await api.get("/check-auth");
      return response.data;
    } catch (error) {
      throw error.response?.data || new Error("Non authentifié");
    }
  },

  logout: async () => {
    try {
      const response = await api.post("/logout");
      return response.data;
    } catch (error) {
      console.log(error);
      throw error.response?.data || new Error("Une erreur est survenue");
    }
  },
  

  refresh: async () => {
    try {
      const response = await api.post("/refresh");
      console.log(response.data);
      return response.data;
    } catch (error) {
      console.log(error);
      throw error.response?.data || new Error("Session expirée");
    }
  },

  getMe: async () => {
    try {
      const response = await api.get("/user");
      return response.data.data.data;
    } catch (error) {
      console.log(error);
      throw error.response?.data || new Error("erreur sur /user");
    }
  },
};

export default authService;
