/**
 * Notifications hook'ları — liste, mark-read, mark-all-read.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationsApi } from "@/api/endpoints";

export const notifKeys = {
  all: ["notifications"] as const,
  list: (unreadOnly = false) => ["notifications", "list", unreadOnly] as const,
};

export function useNotifications(unreadOnly = false) {
  return useQuery({
    queryKey: notifKeys.list(unreadOnly),
    queryFn: () => notificationsApi.list({ unread_only: unreadOnly, limit: 50 }),
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.readAll(),
    onSuccess: () => qc.invalidateQueries({ queryKey: notifKeys.all }),
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: notifKeys.all }),
  });
}
