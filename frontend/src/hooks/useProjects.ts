/**
 * Projects için React Query hook'ları.
 */
import { useQuery } from "@tanstack/react-query";
import { projectsApi, type ListProjectsParams } from "@/api/endpoints";

export const projectsKeys = {
  all: ["projects"] as const,
  list: (params: ListProjectsParams = {}) => ["projects", "list", params] as const,
};

export function useProjects(params: ListProjectsParams = {}) {
  return useQuery({
    queryKey: projectsKeys.list(params),
    queryFn: () => projectsApi.list(params),
  });
}
