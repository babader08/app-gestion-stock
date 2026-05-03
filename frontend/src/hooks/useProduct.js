import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import productService from "../services/productService";

export const useUploadImage = () => {
  return useMutation({
    mutationFn: productService.uploadImage,
  });
};

export const useCreateProduct = () => {
  return useMutation({
    mutationFn: productService.createProduct,
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => productService.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
    onError: (error) => {
      console.error("Erreur lors de la suppression:", error);
    },
  });
};

export const useDashboardProducts = () => {
  return useQuery({
    queryKey: ["dashboardProducts"],
    queryFn: productService.dashboardProducts,
    staleTime: 1000 * 60 * 5,
    keepPreviousData: true,
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: true,
  });
};

export const useAllProducts = (filters = {}) => {
  return useInfiniteQuery({
    queryKey: ["products", "infinite", filters],
    queryFn: async ({ pageParam = 0 }) => {
      return productService.allProducts({
        cursor: pageParam,
        limit: 20,
        status: filters.status || "",
        category: filters.category || "",
        search: filters.search || "",
      });
    },

    getNextPageParam: (lastPage) => {
      const hasMore = lastPage.data?.has_more;
      const nextCursor = lastPage.data?.next_cursor;
      return hasMore ? nextCursor : undefined;
    },

    initialPageParam: 0,
    placeholderData: keepPreviousData,
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => productService.updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
    onError: (error) => {
      console.error("Erreur update:", error);
    },
  });
};

export const useStats = () => {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: productService.getDashboardStats,
    staleTime: 1000 * 60 * 5,
  });
};

// useInfiniteQuery est un hook de React Query qui permet de gérer la pagination.
// Il sert à charger des données page par page,
//  par exemple quand tu veux afficher une liste de produits et
//  charger la suite au fur et à mesure que l’utilisateur fait défiler la page ou clique sur Charger plus
