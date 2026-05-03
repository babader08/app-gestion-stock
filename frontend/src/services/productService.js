import api from "../api/axios";

const productService = {
  uploadImage: async (image) => {
    try {
      const formData = new FormData();
      formData.append("image", image);

      const response = await api.post("/upload", formData);
      return response.data;
    } catch (error) {
      console.log(error);
      throw error.response?.data || new Error("Impossible de stocker l'image");
    }
  },

  createProduct: async (data) => {
    try {
      const response = await api.post("/create-product", data);
      return response.data;
    } catch (error) {
      console.log(error);
      throw error.response?.data || new Error("Impossible de stocker l'image");
    }
  },

  dashboardProducts: async () => {
    try {
      const response = await api.get("/products?limit=20");
      return response.data;
    } catch (error) {
      console.error("Erreur Dashboard Products:", error);
      throw (
        error.response?.data ||
        new Error("Impossible de récupérer les produits du dashboard")
      );
    }
  },

  allProducts: async (params) => {
    try {
      const response = await api.get("/products", { params });
      return response.data.data;
    } catch (error) {
      console.error("Erreur sur allProducts:", error);
      throw (
        error.response?.data ||
        new Error("Impossible de récupérer tous les produits")
      );
    }
  },

  deleteProduct: async (id) => {
    try {
      const response = await api.delete(`/products/${id}`);
      return response.data;
    } catch (error) {
      console.log(error);
      throw (
        error.response?.data || new Error("Impossible de supprimée la produit")
      );
    }
  },

  updateProduct: async (id, data) => {
    try {
      const response = await api.put(`/products/${id}`, data);
      return response.data;
    } catch (error) {
      console.log(error);
      throw (
        error.response?.data || new Error("Impossible de supprimée la produit")
      );
    }
  },

  getDashboardStats: async () => {
    try {
      const response = await api.get("/stats");
      return response.data.data.data;
    } catch (error) {
      console.log(error);
      throw (
        error.response?.data || new Error("Impossible de récupéré les stats")
      );
    }
  },
};

export default productService;
