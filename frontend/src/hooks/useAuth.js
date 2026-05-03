import {
  QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import authService from "../services/authService";

export const useRegister = () => {
  return useMutation({
    mutationFn: authService.register,
  });
};

export const useVerifyOTP = () => {
  return useMutation({
    mutationFn: authService.verifyOTP,
  });
};

export const useLogin = () => {
  return useMutation({
    mutationFn: authService.login,
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth"] });
      queryClient.clear();
    },
  });
};

export const useRequestPasswordReset = () => {
  return useMutation({
    mutationFn: authService.requestPasswordReset,
  });
};

export const useResetPassword = () => {
  return useMutation({
    mutationFn: authService.resetPassword,
  });
};

export const useResendOTP = () => {
  return useMutation({
    mutationFn: authService.resendOTP,
  });
};

export const useCheckAuth = () => {
  return useQuery({
    queryKey: ["auth"],
    queryFn: authService.checkAuth,
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
};
