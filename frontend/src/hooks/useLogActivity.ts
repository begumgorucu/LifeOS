/**
 * Bir alana hızlı "aktivite" kaydı.
 *
 * Backend'de dedicated bir endpoint yok; biz iki adımda yapıyoruz:
 *   1. POST /tasks            → o alana "Hızlı aktivite" başlıklı task aç
 *   2. POST /tasks/:id/complete → hemen complete et → skor +5 (medium bonus),
 *                                  last_activity_at güncellenir
 *
 * Sonuçta kullanıcı tek tıkla skor +5, streak +1 etkisi alır. Toast gösterilir.
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tasksApi } from "@/api/endpoints";
import { useToast } from "@/components/Toast";

interface LogParams {
  areaId: string;
  areaName?: string;
}

export function useLogActivity() {
  const qc = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({ areaId }: LogParams) => {
      const now = new Date();
      const stamp = now.toLocaleTimeString("tr-TR", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const task = await tasksApi.create({
        title: `Hızlı aktivite · ${stamp}`,
        area_id: areaId,
        priority: "medium",
      });
      await tasksApi.complete(task.id);
      return task;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["areas"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["me"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      toast.show(`${vars.areaName ?? "Alan"}: +5 puan, skor güncellendi`);
    },
    onError: () => {
      toast.show("Aktivite kaydedilemedi", "warn");
    },
  });
}
