// hooks/useUserBookings.ts
import { getUserBookings } from "@/api/suspendApi";
import { useAuth } from "@/providers/AuthProvider";
import { useQuery } from "@tanstack/react-query";

export function useUserBookings(id:string | undefined) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ["user-bookings"],
     enabled: !!token,
     refetchOnWindowFocus:false,
    queryFn: ()=> getUserBookings(id ?? ""),
  });
}
