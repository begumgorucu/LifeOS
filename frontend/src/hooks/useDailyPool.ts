/**
 * Daily Pool için React Query hook'ları.
 *
 * `generate` mutation'ı her zaman bugünkü pool'u döndürür (yoksa yaratır,
 * varsa mevcudu); `?force=true` istersek mevcudu silip yeniden üretir.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { poolApi } from "@/api/endpoints";

export const poolKeys = {
  all: ["pool"] as const,
  today: ["pool", "today"] as const,
};

export function useDailyPool() {
  return useQuery({
    queryKey: poolKeys.today,
    queryFn: poolApi.today,
  });
}

export function useGeneratePool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (force?: boolean) => poolApi.generate(force),
    onSuccess: () => qc.invalidateQueries({ queryKey: poolKeys.all }),
  });
}

function usePoolMutation(fn: (id: string) => Promise<unknown>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => qc.invalidateQueries({ queryKey: poolKeys.all }),
  });
}

export const useApprovePoolItem = () => usePoolMutation(poolApi.approve);
export const useSkipPoolItem = () => usePoolMutation(poolApi.skip);
