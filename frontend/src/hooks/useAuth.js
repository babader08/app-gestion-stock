import { useMutation, useQuery } from "@tanstack/react-query";
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
  return useMutation({
    mutationFn: authService.logout,
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
    staleTime: 1000 * 60 * 15,
    refetchOnWindowFocus: true,
  });
};
