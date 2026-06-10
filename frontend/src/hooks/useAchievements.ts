/**
 * Achievements (rozetler) hook'u.
 */
import { useQuery } from "@tanstack/react-query";
import { achievementsApi } from "@/api/endpoints";

export const useAchievements = () =>
  useQuery({ queryKey: ["achievements"], queryFn: achievementsApi.list });
