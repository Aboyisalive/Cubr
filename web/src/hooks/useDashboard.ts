import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import { ENDPOINTS } from "@/api/endpoints";
import type { ProfileStats } from "@shared/types/solve_record";
import type { Shelf } from "@/types/home";

/** Home dashboard data (Section 6.4 + 6.5), served by the mock adapter for now. */
export function useStats() {
  return useQuery({
    queryKey: ["stats"],
    queryFn: () => api.get<ProfileStats>(ENDPOINTS.stats),
  });
}

export function useShelves() {
  return useQuery({
    queryKey: ["shelves"],
    queryFn: () => api.get<Shelf[]>(ENDPOINTS.shelves),
  });
}
