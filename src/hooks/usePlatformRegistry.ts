import { useQuery } from "@tanstack/react-query";
import { getAllCorridors } from "@/api/platformRegistryApi";

export const useFetchAllCorridors = () => {
    return useQuery({
        queryKey: ["platformCorridors"],
        queryFn: getAllCorridors,
    });
};
