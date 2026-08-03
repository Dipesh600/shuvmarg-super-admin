// hooks/useUserBookings.ts
import { getUserBookings } from "@/api/suspendApi";
import { useAuth } from "@/providers/AuthProvider";
import { useQuery } from "@tanstack/react-query";

export function useUserBookings(id: string | undefined) {
  const { token } = useAuth();
  return useQuery({
    // Include userId in queryKey so navigating between profiles refetches data
    queryKey: ["user-bookings", id],
    enabled: !!token && !!id,
    refetchOnWindowFocus: false,
    queryFn: () => getUserBookings(id ?? ""),
  });
}
