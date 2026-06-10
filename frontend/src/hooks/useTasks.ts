/**
 * Tasks için React Query hook'ları.
 *
 * Mutation'lar (complete/skip/reopen) backend'de areas + projects + user
 * verisini de etkilediği için ilgili tüm sorguları invalidate ediyoruz —
 * kullanıcı tek bir aksiyondan sonra her yerde güncel veri görsün.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { tasksApi, type ListTasksParams } from "@/api/endpoints";
import type { TaskCreate } from "@/types/api";

export const tasksKeys = {
  all: ["tasks"] as const,
  list: (params: ListTasksParams = {}) => ["tasks", "list", params] as const,
};

export function useTasks(params: ListTasksParams = {}) {
  return useQuery({
    queryKey: tasksKeys.list(params),
    queryFn: () => tasksApi.list(params),
  });
}

function useTaskMutation<T>(
  fn: (id: string) => Promise<T>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      // Bir task değişince ekoları her yerde: areas (count), pool (status),
      // me (xp/streak), notifications, achievements.
      qc.invalidateQueries({ queryKey: tasksKeys.all });
      qc.invalidateQueries({ queryKey: ["areas"] });
      qc.invalidateQueries({ queryKey: ["pool"] });
      qc.invalidateQueries({ queryKey: ["me"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["achievements"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export const useCompleteTask = () => useTaskMutation(tasksApi.complete);
export const useSkipTask = () => useTaskMutation(tasksApi.skip);
export const useReopenTask = () => useTaskMutation(tasksApi.reopen);

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: TaskCreate) => tasksApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tasksKeys.all });
      qc.invalidateQueries({ queryKey: ["areas"] });
    },
  });
}
