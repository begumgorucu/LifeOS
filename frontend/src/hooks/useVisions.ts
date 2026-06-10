/**
 * Visions hook'ları — list, create, update, delete.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { visionsApi } from "@/api/endpoints";
import type { VisionCreate, VisionUpdate } from "@/types/api";

export const visionsKeys = {
  all: ["visions"] as const,
};

export const useVisions = () =>
  useQuery({
    queryKey: visionsKeys.all,
    queryFn: () => visionsApi.list({ limit: 50 }),
  });

export function useCreateVision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: VisionCreate) => visionsApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: visionsKeys.all });
      qc.invalidateQueries({ queryKey: ["areas"] });
    },
  });
}

export function useUpdateVision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: VisionUpdate }) =>
      visionsApi.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: visionsKeys.all });
      qc.invalidateQueries({ queryKey: ["areas"] });
    },
  });
}

export function useDeleteVision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => visionsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: visionsKeys.all });
      qc.invalidateQueries({ queryKey: ["areas"] });
    },
  });
}
