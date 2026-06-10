/**
 * Tüm backend endpoint'lerinin tipli sarmalayıcıları.
 *
 * React Query hook'ları bu fonksiyonları queryFn / mutationFn olarak
 * çağırır. Hook katmanı caching/refetch'i yönetir; bu dosya yalnızca
 * "URL + tip" eşleştirmesinden sorumlu.
 */
import { api } from "@/api/client";
import type {
  AchievementList,
  AreaCreate,
  AreaRead,
  AreaUpdate,
  DailyPoolBundle,
  DailyPoolItemRead,
  NotificationList,
  NotificationRead,
  PaginatedAreas,
  PaginatedProjects,
  PaginatedTasks,
  PaginatedVisions,
  ProjectCreate,
  ProjectRead,
  StatsHeatmap,
  StatsSummary,
  StatsTopPerformers,
  StatsTrend,
  TaskCreate,
  TaskRead,
  UnreadCount,
  UserRead,
  UserUpdate,
  VisionCreate,
  VisionRead,
  VisionUpdate,
} from "@/types/api";

// ---------- /me -------------------------------------------------------------

export const meApi = {
  get: () => api.get<UserRead>("/me").then((r) => r.data),
  update: (payload: UserUpdate) =>
    api.patch<UserRead>("/me", payload).then((r) => r.data),
};

// ---------- /areas ----------------------------------------------------------

export interface ListAreasParams {
  limit?: number;
  offset?: number;
}

export const areasApi = {
  list: (params: ListAreasParams = {}) =>
    api.get<PaginatedAreas>("/areas", { params }).then((r) => r.data),
  get: (id: string) => api.get<AreaRead>(`/areas/${id}`).then((r) => r.data),
  create: (payload: AreaCreate) =>
    api.post<AreaRead>("/areas", payload).then((r) => r.data),
  update: (id: string, payload: AreaUpdate) =>
    api.patch<AreaRead>(`/areas/${id}`, payload).then((r) => r.data),
  remove: (id: string) => api.delete<void>(`/areas/${id}`).then(() => undefined),
  recomputeHealth: (id: string) =>
    api.post<AreaRead>(`/areas/${id}/recompute-health`).then((r) => r.data),
};

// ---------- /projects -------------------------------------------------------

export interface ListProjectsParams {
  limit?: number;
  offset?: number;
  status?: string;
  area_id?: string;
}

export const projectsApi = {
  list: (params: ListProjectsParams = {}) =>
    api.get<PaginatedProjects>("/projects", { params }).then((r) => r.data),
  get: (id: string) =>
    api.get<ProjectRead>(`/projects/${id}`).then((r) => r.data),
  create: (payload: ProjectCreate) =>
    api.post<ProjectRead>("/projects", payload).then((r) => r.data),
  remove: (id: string) =>
    api.delete<void>(`/projects/${id}`).then(() => undefined),
};

// ---------- /tasks ----------------------------------------------------------

export interface ListTasksParams {
  limit?: number;
  offset?: number;
  status?: string;
  area_id?: string;
  project_id?: string;
  due_before?: string;
  due_after?: string;
}

export const tasksApi = {
  list: (params: ListTasksParams = {}) =>
    api.get<PaginatedTasks>("/tasks", { params }).then((r) => r.data),
  get: (id: string) => api.get<TaskRead>(`/tasks/${id}`).then((r) => r.data),
  create: (payload: TaskCreate) =>
    api.post<TaskRead>("/tasks", payload).then((r) => r.data),
  remove: (id: string) => api.delete<void>(`/tasks/${id}`).then(() => undefined),
  complete: (id: string) =>
    api.post<TaskRead>(`/tasks/${id}/complete`).then((r) => r.data),
  skip: (id: string) =>
    api.post<TaskRead>(`/tasks/${id}/skip`).then((r) => r.data),
  reopen: (id: string) =>
    api.post<TaskRead>(`/tasks/${id}/reopen`).then((r) => r.data),
};

// ---------- /visions --------------------------------------------------------

export const visionsApi = {
  list: (params: { area_id?: string; limit?: number; offset?: number } = {}) =>
    api.get<PaginatedVisions>("/visions", { params }).then((r) => r.data),
  get: (id: string) =>
    api.get<VisionRead>(`/visions/${id}`).then((r) => r.data),
  create: (payload: VisionCreate) =>
    api.post<VisionRead>("/visions", payload).then((r) => r.data),
  update: (id: string, payload: VisionUpdate) =>
    api.patch<VisionRead>(`/visions/${id}`, payload).then((r) => r.data),
  remove: (id: string) =>
    api.delete<void>(`/visions/${id}`).then(() => undefined),
};

// ---------- /daily-pool -----------------------------------------------------

export const poolApi = {
  today: () => api.get<DailyPoolBundle>("/daily-pool").then((r) => r.data),
  generate: (force = false) =>
    api
      .post<DailyPoolBundle>("/daily-pool/generate", null, { params: { force } })
      .then((r) => r.data),
  approve: (id: string) =>
    api.post<DailyPoolItemRead>(`/daily-pool/${id}/approve`).then((r) => r.data),
  skip: (id: string) =>
    api.post<DailyPoolItemRead>(`/daily-pool/${id}/skip`).then((r) => r.data),
};

// ---------- /stats ----------------------------------------------------------

export const statsApi = {
  summary: () => api.get<StatsSummary>("/stats/summary").then((r) => r.data),
  trend: (days = 30) =>
    api.get<StatsTrend>("/stats/trend", { params: { days } }).then((r) => r.data),
  heatmap: (weeks = 16) =>
    api
      .get<StatsHeatmap>("/stats/heatmap", { params: { weeks } })
      .then((r) => r.data),
  topPerformers: (days = 30, limit = 3) =>
    api
      .get<StatsTopPerformers>("/stats/top-performers", { params: { days, limit } })
      .then((r) => r.data),
};

// ---------- /achievements ---------------------------------------------------

export const achievementsApi = {
  list: () => api.get<AchievementList>("/achievements").then((r) => r.data),
};

// ---------- /notifications --------------------------------------------------

export const notificationsApi = {
  list: (params: { unread_only?: boolean; limit?: number; offset?: number } = {}) =>
    api.get<NotificationList>("/notifications", { params }).then((r) => r.data),
  unreadCount: () =>
    api.get<UnreadCount>("/notifications/unread-count").then((r) => r.data),
  markRead: (id: string) =>
    api
      .post<NotificationRead>(`/notifications/${id}/read`)
      .then((r) => r.data),
  readAll: () => api.post<void>("/notifications/read-all").then(() => undefined),
};
