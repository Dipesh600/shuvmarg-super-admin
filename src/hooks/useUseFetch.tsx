import { getAllUsers } from "@/api/userApi";
import { useAuth } from "@/providers/AuthProvider";
import { useQuery } from "@tanstack/react-query";

const useUsersFetch = () => {
  const { token } = useAuth();
  return useQuery({
    queryKey: ["allUsers"],
    enabled: !!token,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 100, // 5min
    queryFn: async () => {
      const { data } = await getAllUsers();
      return data;
    },
  });
};

export default useUsersFetch;
