/**
 * Tasks sayfası — split layout (Things 3 / Linear / Notion karması).
 *
 * Sol panel:
 *   - AKILLI LİSTELER: Bugün, Bu hafta, Tüm açık, Tamamlanan, Atlanan
 *   - PROJELER: aktif projeler (sayaç + tıkla = filtre)
 *   - ALANLAR: tüm alanlar (sayaç + sağlık mini-bar + tıkla = filtre)
 *
 * Sağ panel:
 *   - Görünüm başlığı + özet sayım + "Yeni görev" CTA
 *   - Proje görünümünde: progress bar, deadline, açıklama meta paneli
 *   - Inline ekleme satırı (açık listelerde)
 *   - Görev listesi — TaskRow ile (proje + alan chip'leri tıklanabilir)
 *
 * Veri: hepsi tek seferde çekilir (limit 100), client-side filtrelenir.
 */
import { useMemo, useState } from "react";
import "@/styles/pages/tasks.css";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { tasksApi } from "@/api/endpoints";
import { useAreas } from "@/hooks/useAreas";
import { useProjects } from "@/hooks/useProjects";
import { TaskRow } from "@/components/TaskRow";
import { InlineAddTask } from "@/components/InlineAddTask";
import { NewTaskModal } from "@/components/NewTaskModal";
import { Icon, type IconName } from "@/utils/icons";
import type { TaskRead, ProjectRead, AreaRead } from "@/types/api";

// === Görünüm türü =======================================================

type SmartTab = "today" | "week" | "open" | "done" | "skipped";

type View =
  | { kind: "smart"; tab: SmartTab }
  | { kind: "project"; id: string }
  | { kind: "area"; id: string };

const SMART_LABEL: Record<SmartTab, string> = {
  today: "Bugün",
  week: "Bu hafta",
  open: "Tüm açık",
  done: "Tamamlanan",
  skipped: "Atlanan",
};
const SMART_ICONS: Record<SmartTab, IconName> = {
  today: "calendar",
  week: "calendar",
  open: "tasks",
  done: "check",
  skipped: "play",
};

// === Yardımcılar ========================================================

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function filterBySmart(tasks: TaskRead[], tab: SmartTab): TaskRead[] {
  const today = startOfDay(new Date()).getTime();
  const oneDay = 24 * 60 * 60 * 1000;
  const weekEnd = today + 7 * oneDay;
  return tasks.filter((t) => {
    switch (tab) {
      case "today": {
        if (t.status !== "todo" && t.status !== "in_progress") return false;
        if (!t.due_at) return false;
        const due = new Date(t.due_at).getTime();
        return due >= today && due < today + oneDay;
      }
      case "week": {
        if (t.status !== "todo" && t.status !== "in_progress") return false;
        if (!t.due_at) return false;
        const due = new Date(t.due_at).getTime();
        return due >= today && due < weekEnd;
      }
      case "open":
        return t.status === "todo" || t.status === "in_progress";
      case "done":
        return t.status === "done";
      case "skipped":
        return t.status === "skipped";
    }
  });
}

function healthColor(score: number): string {
  if (score >= 70) return "var(--iris)";
  if (score >= 40) return "var(--h-good)";
  return "var(--h-crit)";
}

function dateLabelTR(iso: string | null | undefined): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const target = new Date(iso);
  const today = startOfDay(new Date());
  return Math.floor((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function subtitleFor(tab: SmartTab, count: number): string {
  switch (tab) {
    case "today":
      return `${count} görev bugün`;
    case "week":
      return `${count} görev önümüzdeki 7 gün`;
    case "open":
      return `${count} açık görev`;
    case "done":
      return `${count} tamamlanmış görev`;
    case "skipped":
      return `${count} atlanan görev`;
  }
}

// === Component ==========================================================

export default function TasksPage() {
  const [view, setView] = useState<View>({ kind: "smart", tab: "today" });
  const [modalOpen, setModalOpen] = useState(false);
  const qc = useQueryClient();

  const { data: tasksData, isLoading, isError } = useQuery({
    queryKey: ["tasks", "list", { all: true }],
    queryFn: () => tasksApi.list({ limit: 100 }),
  });
  const tasks = tasksData?.items ?? [];

  const { data: areasData } = useAreas({ limit: 50 });
  const areas = areasData?.items ?? [];

  const { data: projectsData } = useProjects({ limit: 100 });
  const projects = projectsData?.items ?? [];

  const activeProjects = useMemo(
    () => projects.filter((p) => p.status !== "completed"),
    [projects],
  );

  const smartCounts = useMemo(
    () => ({
      today: filterBySmart(tasks, "today").length,
      week: filterBySmart(tasks, "week").length,
      open: filterBySmart(tasks, "open").length,
      done: filterBySmart(tasks, "done").length,
      skipped: filterBySmart(tasks, "skipped").length,
    }),
    [tasks],
  );

  const projectCounts = useMemo(() => {
    const map = new Map<string, number>();
    tasks.forEach((t) => {
      if (!t.project_id) return;
      if (t.status === "done" || t.status === "skipped") return;
      map.set(t.project_id, (map.get(t.project_id) ?? 0) + 1);
    });
    return map;
  }, [tasks]);

  const areaCounts = useMemo(() => {
    const map = new Map<string, number>();
    tasks.forEach((t) => {
      if (t.status === "done" || t.status === "skipped") return;
      map.set(t.area_id, (map.get(t.area_id) ?? 0) + 1);
    });
    return map;
  }, [tasks]);

  const filtered = useMemo(() => {
    if (view.kind === "smart") return filterBySmart(tasks, view.tab);
    if (view.kind === "project")
      return tasks.filter((t) => t.project_id === view.id);
    return tasks.filter((t) => t.area_id === view.id);
  }, [view, tasks]);

  const openTasks = filtered.filter(
    (t) => t.status === "todo" || t.status === "in_progress",
  );
  const doneTasks = filtered.filter((t) => t.status === "done");
  const skippedTasks = filtered.filter((t) => t.status === "skipped");

  const handleDelete = (id: string) => {
    tasksApi.remove(id).then(() => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["areas"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
    });
  };

  const header = useMemo(() => {
    if (view.kind === "smart") {
      return {
        emoji: null as string | null,
        title: SMART_LABEL[view.tab],
        subtitle: subtitleFor(view.tab, filtered.length),
        project: null as ProjectRead | null,
        area: null as AreaRead | null,
      };
    }
    if (view.kind === "project") {
      const p = projects.find((x) => x.id === view.id) ?? null;
      return {
        emoji: null,
        title: p?.title ?? "Proje",
        subtitle: null,
        project: p,
        area: null,
      };
    }
    const a = areas.find((x) => x.id === view.id) ?? null;
    return {
      emoji: a?.icon ?? "🌿",
      title: a?.name ?? "Alan",
      subtitle: null,
      project: null,
      area: a,
    };
  }, [view, projects, areas, filtered.length]);

  const newTaskDefaults = useMemo(() => {
    if (view.kind === "project") {
      const p = projects.find((x) => x.id === view.id);
      return { areaId: p?.area_id, projectId: p?.id };
    }
    if (view.kind === "area") {
      return { areaId: view.id, projectId: undefined };
    }
    return { areaId: undefined, projectId: undefined };
  }, [view, projects]);

  const showInlineAdd =
    view.kind === "smart" && (view.tab === "today" || view.tab === "open");
  const useGroupedLayout = view.kind === "project";

  return (
    <div className="tk-page">
      {/* === SOL PANEL === */}
      <aside className="tk-side">
        {/* Akıllı listeler */}
        <div className="tk-side-sec">
          <div className="lbl">Akıllı listeler</div>
          {(Object.keys(SMART_LABEL) as SmartTab[]).map((k) => (
            <button
              key={k}
              type="button"
              className={`tk-side-item ${
                view.kind === "smart" && view.tab === k ? "on" : ""
              }`}
              onClick={() => setView({ kind: "smart", tab: k })}
            >
              <span className="ic">
                <Icon name={SMART_ICONS[k]} size={14} strokeWidth={1.9} />
              </span>
              <span className="label">{SMART_LABEL[k]}</span>
              <span className="c">{smartCounts[k]}</span>
            </button>
          ))}
        </div>

        {/* Projeler */}
        <div className="tk-side-sec">
          <div className="lbl">
            Projeler{" "}
            <span
              style={{
                fontFamily: "var(--mono)",
                fontSize: 10,
                color: "var(--ink-4)",
                fontWeight: 400,
                marginLeft: 4,
              }}
            >
              ({activeProjects.length})
            </span>
          </div>
          {activeProjects.length === 0 && (
            <div className="tk-side-empty">Henüz aktif proje yok.</div>
          )}
          {activeProjects.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`tk-side-item ${
                view.kind === "project" && view.id === p.id ? "on" : ""
              }`}
              onClick={() => setView({ kind: "project", id: p.id })}
              title={p.title}
            >
              <span className="emoji">📁</span>
              <span className="label">{p.title}</span>
              <span className="c">{projectCounts.get(p.id) ?? 0}</span>
            </button>
          ))}
        </div>

        {/* Alanlar */}
        <div className="tk-side-sec">
          <div className="lbl">
            Alanlar{" "}
            <span
              style={{
                fontFamily: "var(--mono)",
                fontSize: 10,
                color: "var(--ink-4)",
                fontWeight: 400,
                marginLeft: 4,
              }}
            >
              ({areas.length})
            </span>
          </div>
          {areas.length === 0 && (
            <div className="tk-side-empty">Henüz alan yok.</div>
          )}
          {areas.map((a) => {
            const isOn = view.kind === "area" && view.id === a.id;
            const score = a.health_score;
            return (
              <button
                key={a.id}
                type="button"
                className={`tk-side-item ${isOn ? "on" : ""}`}
                onClick={() => setView({ kind: "area", id: a.id })}
                title={`${a.name} · sağlık ${score}/100`}
              >
                <span className="emoji">{a.icon ?? "🌿"}</span>
                <span className="label">{a.name}</span>
                <span className="health" title={`Sağlık: ${score}/100`}>
                  <span
                    className="fill"
                    style={{
                      width: `${score}%`,
                      background: healthColor(score),
                    }}
                  />
                </span>
                <span className="c">{areaCounts.get(a.id) ?? 0}</span>
              </button>
            );
          })}
        </div>
      </aside>

      {/* === SAĞ PANEL === */}
      <main className="tk-main">
        {/* Başlık */}
        <div className="tk-main-head">
          <div className="left">
            <h1>
              {header.emoji && <span className="em">{header.emoji}</span>}
              {header.title}
            </h1>
            {header.subtitle && <div className="sub">{header.subtitle}</div>}
            {view.kind === "project" && header.project && (
              <ProjectSubtitle project={header.project} taskCount={filtered.length} />
            )}
            {view.kind === "area" && header.area && (
              <AreaSubtitle area={header.area} taskCount={filtered.length} />
            )}
          </div>
          <button type="button" className="add" onClick={() => setModalOpen(true)}>
            <Icon name="plus" size={13} strokeWidth={2.4} />
            Yeni görev
          </button>
        </div>

        {/* Proje görünümünde meta paneli */}
        {view.kind === "project" && header.project && (
          <ProjectMetaPanel project={header.project} />
        )}

        {/* Inline ekleme (sadece akıllı listelerde) */}
        {showInlineAdd && <InlineAddTask />}

        {/* Yüklenme / hata / boş durumlar */}
        {isLoading && (
          <div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="tk-skel" />
            ))}
          </div>
        )}

        {isError && (
          <div className="tk-empty">
            <span className="ic">
              <Icon name="info" size={20} strokeWidth={1.8} />
            </span>
            <h3>Görevler yüklenemedi.</h3>
            <p>Backend'e ulaşılamıyor. Birazdan tekrar dene.</p>
          </div>
        )}

        {!isLoading && !isError && filtered.length === 0 && (
          <EmptyState view={view} />
        )}

        {/* Görev listesi */}
        {!useGroupedLayout && filtered.length > 0 && (
          <TaskList
            tasks={filtered}
            view={view}
            onDelete={handleDelete}
            onProjectClick={(id) => setView({ kind: "project", id })}
            onAreaClick={(id) => setView({ kind: "area", id })}
          />
        )}

        {/* Proje görünümü: gruplandırılmış */}
        {useGroupedLayout && filtered.length > 0 && (
          <>
            {openTasks.length > 0 && (
              <div className="tk-group">
                <div className="tk-group-h">
                  Yapılacak <span className="gc">{openTasks.length}</span>
                </div>
                <TaskList
                  tasks={openTasks}
                  view={view}
                  onDelete={handleDelete}
                  onProjectClick={(id) => setView({ kind: "project", id })}
                  onAreaClick={(id) => setView({ kind: "area", id })}
                />
              </div>
            )}
            {doneTasks.length > 0 && (
              <div className="tk-group">
                <div className="tk-group-h">
                  Tamamlanan <span className="gc">{doneTasks.length}</span>
                </div>
                <TaskList
                  tasks={doneTasks}
                  view={view}
                  onDelete={handleDelete}
                  onProjectClick={(id) => setView({ kind: "project", id })}
                  onAreaClick={(id) => setView({ kind: "area", id })}
                />
              </div>
            )}
            {skippedTasks.length > 0 && (
              <div className="tk-group">
                <div className="tk-group-h">
                  Atlanan <span className="gc">{skippedTasks.length}</span>
                </div>
                <TaskList
                  tasks={skippedTasks}
                  view={view}
                  onDelete={handleDelete}
                  onProjectClick={(id) => setView({ kind: "project", id })}
                  onAreaClick={(id) => setView({ kind: "area", id })}
                />
              </div>
            )}
          </>
        )}
      </main>

      <NewTaskModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultAreaId={newTaskDefaults.areaId}
        defaultProjectId={newTaskDefaults.projectId}
      />
    </div>
  );
}

// === Yardımcı bileşenler ================================================

function TaskList({
  tasks,
  view,
  onDelete,
  onProjectClick,
  onAreaClick,
}: {
  tasks: TaskRead[];
  view: View;
  onDelete: (id: string) => void;
  onProjectClick: (id: string) => void;
  onAreaClick: (id: string) => void;
}) {
  return (
    <div className="tlist">
      {tasks.map((t) => (
        <TaskRow
          key={t.id}
          task={t}
          onDelete={onDelete}
          showProject={view.kind !== "project"}
          showArea={view.kind !== "area"}
          onProjectClick={onProjectClick}
          onAreaClick={onAreaClick}
        />
      ))}
    </div>
  );
}

function ProjectSubtitle({
  project,
  taskCount,
}: {
  project: ProjectRead;
  taskCount: number;
}) {
  const dl = daysUntil(project.target_date);
  return (
    <div className="sub">
      <span>📁 Proje</span>
      <span className="sep">·</span>
      <span>
        <b>{taskCount}</b> görev
      </span>
      {dl !== null && (
        <>
          <span className="sep">·</span>
          <span style={{ color: dl < 0 ? "var(--h-crit-d)" : undefined }}>
            {dl < 0
              ? `${Math.abs(dl)} gün gecikti`
              : dl === 0
              ? "Bugün son gün"
              : `${dl} gün kaldı`}
          </span>
        </>
      )}
    </div>
  );
}

function AreaSubtitle({
  area,
  taskCount,
}: {
  area: AreaRead;
  taskCount: number;
}) {
  return (
    <div className="sub">
      <span>Alan</span>
      <span className="sep">·</span>
      <span>
        <b>{taskCount}</b> görev
      </span>
      <span className="sep">·</span>
      <span>Sağlık: {area.health_score}/100</span>
    </div>
  );
}

function ProjectMetaPanel({ project }: { project: ProjectRead }) {
  const dl = daysUntil(project.target_date);
  const progress = project.progress ?? 0;
  return (
    <div className="tk-proj-meta">
      {project.description && <div className="desc">{project.description}</div>}
      <div className="tk-proj-bar">
        <div className="fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="row1">
        <div className="pinfo">
          <span className="item">
            <b>%{progress}</b> tamamlandı
          </span>
          {project.target_date && (
            <span className={`item ${dl !== null && dl < 0 ? "urgent" : ""}`}>
              <Icon name="calendar" size={11} strokeWidth={1.9} />
              {dateLabelTR(project.target_date)}
              {dl !== null && (
                <span style={{ color: "var(--ink-4)", marginLeft: 4 }}>
                  ·{" "}
                  {dl < 0
                    ? `${Math.abs(dl)} gn gecikti`
                    : dl === 0
                    ? "bugün"
                    : `${dl} gn kaldı`}
                </span>
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ view }: { view: View }) {
  let title = "Bu listede görev yok.";
  let hint = "Sağ üstten yeni bir görev ekleyebilirsin.";
  if (view.kind === "smart" && view.tab === "today") {
    title = "Bugün için planlanmış görev yok.";
    hint = "İlk görevi ekle ya da Daily Pool'dan seç.";
  } else if (view.kind === "smart" && view.tab === "done") {
    title = "Henüz tamamlanmış görev yok.";
    hint = "Bir görevi tamamladığında burada görünecek.";
  } else if (view.kind === "project") {
    title = "Bu projeye bağlı görev yok.";
    hint = "Sağ üstten ekle — alan ve proje otomatik seçili gelir.";
  } else if (view.kind === "area") {
    title = "Bu alana ait görev yok.";
    hint = "Sağ üstten ekle — alan otomatik seçili gelir.";
  }
  return (
    <div className="tk-empty">
      <span className="ic">
        <Icon name="tasks" size={20} strokeWidth={1.8} />
      </span>
      <h3>{title}</h3>
      <p>{hint}</p>
    </div>
  );
}
