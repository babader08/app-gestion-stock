import { useQuery } from "@tanstack/react-query";
import { userService } from "../services/userService";

export const useUser = () => {
  return useQuery({
    queryKey: ["auth-user"],
    queryFn: userService.getUser,
    staleTime: Infinity,
  });
};
