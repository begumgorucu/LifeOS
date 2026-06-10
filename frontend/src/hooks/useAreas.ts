/**
 * Areas için React Query hook'ları.
 *
 * Sorgu anahtarı (`queryKey`) cache'in adresi: ["areas", params].
 * Aynı parametreyle ikinci kez render olursa React Query DB'ye gitmeden
 * cache'den döner. Mutation'lar başarılı olursa invalidate ile listeyi
 * yeniden çekeriz.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { areasApi, type ListAreasParams } from "@/api/endpoints";
import type { AreaCreate } from "@/types/api";

export const areasKeys = {
  all: ["areas"] as const,
  list: (params: ListAreasParams = {}) => ["areas", "list", params] as const,
  detail: (id: string) => ["areas", "detail", id] as const,
};

export function useAreas(params: ListAreasParams = {}) {
  return useQuery({
    queryKey: areasKeys.list(params),
    queryFn: () => areasApi.list(params),
  });
}

export function useCreateArea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AreaCreate) => areasApi.create(payload),
    onSuccess: () => {
      // Tüm "areas" anahtarlı sorguları geçersiz kıl → kart sayısı vs. tazelenir
      qc.invalidateQueries({ queryKey: areasKeys.all });
    },
  });
}
