/**
 * Stats için React Query hook'ları. Hepsi GET, mutation yok.
 */
import { useQuery } from "@tanstack/react-query";
import { statsApi } from "@/api/endpoints";

export const useStatsSummary = () =>
  useQuery({ queryKey: ["stats", "summary"], queryFn: statsApi.summary });

export const useStatsHeatmap = (weeks = 16) =>
  useQuery({
    queryKey: ["stats", "heatmap", weeks],
    queryFn: () => statsApi.heatmap(weeks),
  });

export const useStatsTrend = (days = 30) =>
  useQuery({
    queryKey: ["stats", "trend", days],
    queryFn: () => statsApi.trend(days),
  });
