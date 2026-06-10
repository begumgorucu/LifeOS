/**
 * /me hook — kullanıcı verisi her sayfada ortak (sidebar, dashboard, settings).
 */
import { useQuery } from "@tanstack/react-query";
import { meApi } from "@/api/endpoints";

export const useMe = () => useQuery({ queryKey: ["me"], queryFn: meApi.get });
