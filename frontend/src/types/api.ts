/**
 * Backend Pydantic şemalarıyla birebir uyumlu TypeScript tipleri.
 *
 * Bu dosyayı OpenAPI'den otomatik üretebilirdik ama elle yazmak iki sebepten
 * daha iyi:
 *   1) Tipleri okuyup bağlamı kavramak daha kolay (öğrenme değeri).
 *   2) Bağımlılığımızı azaltır — backend değişince burası da elle güncellenir,
 *      bu da "kontratın değiştiği"ni gözle yakalama fırsatı verir.
 */

// ---------- Enums (Pydantic str-enum'larına birebir) ------------------------

export type TaskStatus = "todo" | "in_progress" | "done" | "skipped";
export type TaskPriority = "low" | "medium" | "high";
export type ProjectStatus = "active" | "completed" | "archived";
export type PoolReason =
  | "neglected"
  | "deadline"
  | "streak"
  | "dependency_ready"
  | "flow";
export type NotificationType =
  | "neglect_warning"
  | "streak_success"
  | "daily_reminder"
  | "dependency_unblocked"
  | "achievement_unlocked"
  | "score_critical";

// ---------- Summary types (birden fazla yerde gömülü kullanılıyor) ----------

export interface AreaSummary {
  id: string;
  name: string;
  icon: string | null;
  health_score: number;
}

export interface VisionSummary {
  id: string;
  title: string;
}

export interface TaskSummary {
  id: string;
  title: string;
  status: TaskStatus;
}

export interface ProjectSummary {
  id: string;
  title: string;
}

// ---------- Pagination zarfı ------------------------------------------------

export interface Paginated<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

// ---------- User / Me -------------------------------------------------------

export interface UserRead {
  id: string;
  email: string;
  name: string;
  locale: string;
  theme: string;
  created_at: string;
  updated_at: string;
  // Oyunlaştırma
  streak_count: number;
  streak_last_active_date: string | null;
  longest_streak: number;
  xp: number;
  level: number;
  level_name: string;
  xp_to_next_level: number;
  // Bildirim tercihleri
  notif_daily_reminder_enabled: boolean;
  notif_daily_reminder_time: string;
  notif_neglect_warnings_enabled: boolean;
  notif_streak_risk_enabled: boolean;
  notif_email_weekly_enabled: boolean;
  notif_push_enabled: boolean;
}

export interface UserUpdate {
  name?: string;
  locale?: string;
  theme?: string;
  notif_daily_reminder_enabled?: boolean;
  notif_daily_reminder_time?: string;
  notif_neglect_warnings_enabled?: boolean;
  notif_streak_risk_enabled?: boolean;
  notif_email_weekly_enabled?: boolean;
  notif_push_enabled?: boolean;
}

// ---------- Areas -----------------------------------------------------------

export interface AreaRead {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  health_score: number;
  last_activity_at: string | null;
  is_neglected: boolean;
  created_at: string;
  updated_at: string;
  // Zenginleştirme (Grup 1)
  tasks_count: number;
  projects_count: number;
  visions: VisionSummary[];
}

export interface AreaCreate {
  name: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
}

export type AreaUpdate = Partial<AreaCreate>;
export type PaginatedAreas = Paginated<AreaRead>;

// ---------- Projects --------------------------------------------------------

export interface ProjectRead {
  id: string;
  user_id: string;
  area_id: string;
  title: string;
  description: string | null;
  status: ProjectStatus;
  progress: number;
  target_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  area: AreaSummary;
  tasks_total: number;
  tasks_done: number;
}

export interface ProjectCreate {
  area_id: string;
  title: string;
  description?: string | null;
  target_date?: string | null;
}

export type PaginatedProjects = Paginated<ProjectRead>;

// ---------- Tasks -----------------------------------------------------------

export interface TaskRead {
  id: string;
  user_id: string;
  area_id: string;
  project_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  area: AreaSummary;
  project: ProjectSummary | null;
  depends_on: TaskSummary[];
  is_blocked: boolean;
}

export interface TaskCreate {
  area_id: string;
  title: string;
  description?: string | null;
  project_id?: string | null;
  priority?: TaskPriority;
  due_at?: string | null;
  depends_on_ids?: string[];
}

export type PaginatedTasks = Paginated<TaskRead>;

// ---------- Visions ---------------------------------------------------------

export interface VisionRead {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  target_date: string | null;
  created_at: string;
  updated_at: string;
  areas: AreaSummary[];
  projects: ProjectSummary[];
  vibrance: number;
}

export interface VisionCreate {
  title: string;
  description?: string | null;
  image_url?: string | null;
  target_date?: string | null;
  area_ids?: string[];
  project_ids?: string[];
}

export interface VisionUpdate {
  title?: string;
  description?: string | null;
  image_url?: string | null;
  target_date?: string | null;
  // null = değişme; [] = hepsini sil; [...] = yenisiyle değiştir
  area_ids?: string[] | null;
  project_ids?: string[] | null;
}

export type PaginatedVisions = Paginated<VisionRead>;

// ---------- Daily Pool ------------------------------------------------------

export interface DailyPoolItemRead {
  id: string;
  user_id: string;
  date: string;
  ordering: number;
  reason: PoolReason;
  approved: boolean;
  skipped: boolean;
  created_at: string;
  updated_at: string;
  task: TaskRead;
}

export interface DailyPoolBundle {
  date: string;
  items: DailyPoolItemRead[];
  total_slots: number;
  approved_count: number;
  skipped_count: number;
  pre_existing: boolean;
}

// ---------- Stats -----------------------------------------------------------

export interface StatsSummary {
  completed_this_month: number;
  current_streak: number;
  longest_streak: number;
  completion_rate: number;
  most_active_area: AreaSummary | null;
  most_active_area_completions: number;
}

export interface HeatmapCell {
  date: string;
  tasks_completed: number;
}

export interface StatsHeatmap {
  weeks: number;
  cells: HeatmapCell[];
}

export interface AreaCompletionPoint {
  date: string;
  health_score: number;
}

export interface AreaTrendSeries {
  area: AreaSummary;
  data_points: AreaCompletionPoint[];
}

export interface StatsTrend {
  days: number;
  series: AreaTrendSeries[];
}

export interface TopPerformerEntry {
  area: AreaSummary;
  delta: number;
  tasks_completed: number;
}

export interface StatsTopPerformers {
  days: number;
  items: TopPerformerEntry[];
}

// ---------- Achievements ----------------------------------------------------

export type AchievementType =
  | "counter"
  | "streak"
  | "area_score"
  | "early_completions"
  | "perfect_week";

export interface AchievementRead {
  key: string;
  name: string;
  description: string;
  icon: string;
  achievement_type: AchievementType;
  target: number;
  progress: number;
  unlocked: boolean;
  unlocked_at: string | null;
}

export interface AchievementList {
  items: AchievementRead[];
  unlocked_count: number;
  total: number;
}

// ---------- Notifications ---------------------------------------------------

export interface NotificationRead {
  id: string;
  user_id: string;
  notification_type: NotificationType;
  title: string;
  body: string | null;
  icon: string | null;
  area_id: string | null;
  task_id: string | null;
  link_to: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface NotificationList {
  items: NotificationRead[];
  total: number;
  unread_count: number;
  limit: number;
  offset: number;
}

export interface UnreadCount {
  unread_count: number;
}

// ---------- Standart hata zarfı (backend errors.py ile birebir) -------------

export interface ApiErrorEnvelope {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
