import api from "../api/axios";

export const userService = {
  getUser: async () => {
    try {
      const response = await api.get("/user");
      return response.data.data.data;
    } catch (error) {
      console.log(error);
      throw error.response?.data || new Error("erreur sur /user");
    }
  },
};
