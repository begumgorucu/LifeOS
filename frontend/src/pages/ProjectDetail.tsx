/**
 * Proje detay sayfası — designs mockup'ına uyumlu 2-kolon layout.
 *
 * Sol (geniş):
 *   - Breadcrumb (Projeler / proje adı)
 *   - Hero card: alan chip, başlık, açıklama (1. paragraf), meta satırı
 *     (durum, son tarih, alan, hayal), ilerleme bar
 *   - Görevler card: bağlı task'ler (check + dependency chip) + inline add
 *
 * Sağ (320px, sticky):
 *   - "Notlar" panel: proje description'ı markdown-lite render
 *     (## başlık, - bullet, `code`).
 *
 * Veri:
 *   - GET /projects/:id (zenginleştirilmiş)
 *   - GET /tasks?project_id=:id (o projeye ait görevler)
 *   - HAYAL: area.visions[0] varsa link olarak göster (alan → Vision)
 */
import { useMemo, useState, type KeyboardEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { projectsApi, tasksApi } from "@/api/endpoints";
import { useAreas } from "@/hooks/useAreas";
import {
  useCompleteTask,
  useReopenTask,
  useCreateTask,
} from "@/hooks/useTasks";
import { Icon } from "@/utils/icons";
import type { ProjectRead, TaskRead, ProjectStatus } from "@/types/api";
import "@/styles/pages/project-detail.css";

// === Yardımcılar =======================================================

function dateLabelTR(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
  });
}

function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const t = new Date(iso);
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.floor((t.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

const STATUS_LABEL: Record<ProjectStatus, string> = {
  active: "Aktif",
  completed: "Tamamlandı",
  archived: "Arşivlendi",
};

// === Markdown-lite parser =============================================
// Sadece: ## başlık, - bullet, `code`, ve düz paragraflar.
type MdNode =
  | { kind: "h"; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "p"; text: string };

function parseMd(src: string): MdNode[] {
  const out: MdNode[] = [];
  const lines = src.split("\n");
  let i = 0;
  while (i < lines.length) {
    const ln = lines[i].trim();
    if (ln === "") {
      i++;
      continue;
    }
    if (ln.startsWith("## ")) {
      out.push({ kind: "h", text: ln.slice(3).trim() });
      i++;
      continue;
    }
    if (ln.startsWith("- ") || ln.startsWith("* ")) {
      const items: string[] = [];
      while (i < lines.length) {
        const l2 = lines[i].trim();
        if (l2.startsWith("- ") || l2.startsWith("* ")) {
          items.push(l2.slice(2).trim());
          i++;
        } else if (l2 === "") {
          // tek boş satır listeyi bitirmesin
          if (
            i + 1 < lines.length &&
            (lines[i + 1].trim().startsWith("- ") ||
              lines[i + 1].trim().startsWith("* "))
          ) {
            i++;
            continue;
          }
          break;
        } else {
          break;
        }
      }
      out.push({ kind: "ul", items });
      continue;
    }
    // Düz paragraf: ardışık metin satırlarını birleştir
    const buf: string[] = [ln];
    i++;
    while (i < lines.length) {
      const l2 = lines[i].trim();
      if (
        l2 === "" ||
        l2.startsWith("## ") ||
        l2.startsWith("- ") ||
        l2.startsWith("* ")
      )
        break;
      buf.push(l2);
      i++;
    }
    out.push({ kind: "p", text: buf.join(" ") });
  }
  return out;
}

// Inline `code` + http(s):// link parse → JSX
function renderInline(text: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  // Önce `code`
  const codeSplit = text.split(/(`[^`]+`)/g);
  let key = 0;
  codeSplit.forEach((seg) => {
    if (seg.startsWith("`") && seg.endsWith("`")) {
      out.push(<code key={`c${key++}`}>{seg.slice(1, -1)}</code>);
      return;
    }
    // Sonra link
    const urlSplit = seg.split(/(https?:\/\/[^\s]+)/g);
    urlSplit.forEach((s) => {
      if (s.startsWith("http")) {
        out.push(
          <a key={`a${key++}`} href={s} target="_blank" rel="noopener noreferrer">
            {s}
          </a>,
        );
      } else if (s) {
        out.push(<span key={`t${key++}`}>{s}</span>);
      }
    });
  });
  return out;
}

// === Component =========================================================

export default function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const { data: project, isLoading, isError } = useQuery({
    queryKey: ["projects", "detail", projectId],
    queryFn: () => projectsApi.get(projectId!),
    enabled: !!projectId,
  });

  const { data: tasksData } = useQuery({
    queryKey: ["tasks", "by-project", projectId],
    queryFn: () => tasksApi.list({ limit: 100, project_id: projectId }),
    enabled: !!projectId,
  });
  const tasks = tasksData?.items ?? [];

  const { data: areasData } = useAreas({ limit: 50 });
  const areas = areasData?.items ?? [];

  const complete = useCompleteTask();
  const reopen = useReopenTask();
  const createTask = useCreateTask();

  // Tasks: önce açık (todo / in_progress), sonra tamamlanan
  const sortedTasks = useMemo(() => {
    const order: Record<TaskRead["status"], number> = {
      todo: 0,
      in_progress: 1,
      skipped: 2,
      done: 3,
    };
    return [...tasks].sort((a, b) => order[a.status] - order[b.status]);
  }, [tasks]);

  const taskTotal = tasks.length;
  const taskDone = tasks.filter((t) => t.status === "done").length;
  const taskPct =
    taskTotal === 0 ? 0 : Math.round((taskDone / taskTotal) * 100);

  // Bu alana bağlı hayal — area.visions ilkini al
  const visionForArea = useMemo(() => {
    if (!project) return null;
    const a = areas.find((x) => x.id === project.area_id);
    return a?.visions?.[0] ?? null;
  }, [project, areas]);

  const notes = useMemo(() => {
    if (!project?.description) return [];
    return parseMd(project.description);
  }, [project?.description]);

  // Description'ın 1. paragrafını hero'da göster
  const heroBlurb = useMemo(() => {
    if (!project?.description) return null;
    const firstP = notes.find((n) => n.kind === "p") as
      | { kind: "p"; text: string }
      | undefined;
    return firstP?.text ?? null;
  }, [notes, project?.description]);

  if (isLoading) {
    return (
      <div className="pd-page">
        <div>
          <div
            className="pd-hero"
            style={{ height: 220, background: "var(--surface-2)" }}
          />
        </div>
        <div
          className="pd-notes"
          style={{ height: 200, background: "var(--surface-2)" }}
        />
      </div>
    );
  }

  if (isError || !project) {
    return (
      <div className="state-block">
        <h2>Proje bulunamadı.</h2>
        <p>
          <Link to="/projects" style={{ color: "var(--iris)" }}>
            Projelere dön
          </Link>
        </p>
      </div>
    );
  }

  const dl = daysUntil(project.target_date);

  const handleAddTask = () => {
    const title = newTaskTitle.trim();
    if (!title) return;
    createTask.mutate(
      {
        title,
        area_id: project.area_id,
        project_id: project.id,
        priority: "medium",
      },
      {
        onSuccess: () => setNewTaskTitle(""),
      },
    );
  };

  const onTaskKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleAddTask();
  };

  return (
    <div className="pd-page">
      <div>
        {/* Breadcrumb */}
        <div className="pd-crumb">
          <Link to="/projects">Projeler</Link>
          <span className="sep">›</span>
          <span className="here">{project.title}</span>
        </div>

        {/* === HERO === */}
        <div className="pd-hero">
          {/* Alan chip */}
          <Link
            to={`/areas/${project.area_id}`}
            className="pd-area-chip"
            title={`${project.area.name} alanına git`}
          >
            <span className="ic">{project.area.icon ?? "🌿"}</span>
            <span>{project.area.name}</span>
          </Link>

          <h1 className="pd-title">{project.title}</h1>

          {heroBlurb && <div className="pd-desc">{heroBlurb}</div>}

          {/* Meta satırı */}
          <div className="pd-meta">
            <div className="item">
              <span className="lbl">Durum</span>
              <span className="val">
                <span className={`pd-status ${project.status}`}>
                  <span className="dot" />
                  {STATUS_LABEL[project.status]}
                </span>
              </span>
            </div>

            <div className="item">
              <span className="lbl">Son tarih</span>
              <span className="val">
                <Icon name="calendar" size={13} strokeWidth={1.9} />
                {dateLabelTR(project.target_date)}
                {dl !== null && project.status === "active" && (
                  <span
                    style={{
                      color: dl < 0 ? "var(--h-crit-d)" : "var(--ink-3)",
                      fontWeight: 500,
                      fontSize: 12,
                      marginLeft: 2,
                    }}
                  >
                    ·{" "}
                    {dl < 0
                      ? `${Math.abs(dl)} gn gecikti`
                      : dl === 0
                      ? "bugün"
                      : `${dl} gn`}
                  </span>
                )}
              </span>
            </div>

            <div className="item">
              <span className="lbl">Alan</span>
              <span className="val">
                <span className="ico-em">{project.area.icon ?? "🌿"}</span>
                <Link
                  to={`/areas/${project.area_id}`}
                  style={{ color: "var(--ink)", textDecoration: "none" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--iris)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--ink)")}
                >
                  {project.area.name}
                </Link>
              </span>
            </div>

            <div className="item">
              <span className="lbl">Hayal</span>
              <span className="val">
                {visionForArea ? (
                  <Link to="/visions">{visionForArea.title}</Link>
                ) : (
                  <span style={{ color: "var(--ink-4)" }}>—</span>
                )}
              </span>
            </div>
          </div>

          {/* Progress */}
          <div>
            <div className="pd-prog-row">
              <span className="label">İlerleme</span>
              <span className="count">
                <b>
                  {taskDone}/{taskTotal}
                </b>{" "}
                görev
              </span>
            </div>
            <div
              className={`pd-prog-bar ${project.status === "completed" ? "completed" : ""}`}
              style={{ marginTop: 8 }}
            >
              <div
                className="fill"
                style={{ width: `${taskPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* === GÖREVLER === */}
        <div className="pd-tasks">
          <div className="pd-tasks-head">
            <div className="ttl">
              Görevler ·{" "}
              <span className="c">
                <b>{taskDone}</b>/{taskTotal}
              </span>
            </div>
          </div>

          {sortedTasks.length === 0 ? (
            <div className="pd-tasks-empty">
              Bu projeye bağlı görev yok. Aşağıdan ekle.
            </div>
          ) : (
            <div className="pd-tlist">
              {sortedTasks.map((t) => {
                const done = t.status === "done";
                const hasDep = t.depends_on.length > 0;
                return (
                  <div
                    key={t.id}
                    className={`pd-trow ${done ? "done" : ""}`}
                    onClick={() => {
                      if (done) reopen.mutate(t.id);
                      else complete.mutate(t.id);
                    }}
                  >
                    <span className={`tchk ${done ? "done" : ""}`}>
                      <svg viewBox="0 0 12 12">
                        <polyline points="2,6 5,9 10,3" />
                      </svg>
                    </span>
                    <span className="ttitle">{t.title}</span>
                    {hasDep && (
                      <span
                        className="dep-chip"
                        title={`Bekliyor: ${t.depends_on
                          .map((d) => d.title)
                          .join(", ")}`}
                      >
                        <Icon name="link" size={11} strokeWidth={1.9} />
                        {t.depends_on[0].title}
                        {t.depends_on.length > 1 &&
                          ` +${t.depends_on.length - 1}`}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Inline ekleme */}
          {project.status !== "archived" && (
            <div className="pd-tadd" onClick={(e) => {
              const inp = (e.currentTarget as HTMLDivElement).querySelector("input");
              inp?.focus();
            }}>
              <span className="icplus">
                <svg viewBox="0 0 12 12">
                  <line x1="6" y1="2" x2="6" y2="10" />
                  <line x1="2" y1="6" x2="10" y2="6" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Görev ekle..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={onTaskKey}
              />
              {newTaskTitle.trim() && (
                <span className="hint">Enter ile ekle</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* === SAĞ PANEL: NOTLAR === */}
      <aside className="pd-notes">
        <div className="nhead">
          <span className="ic" />
          <span>Notlar</span>
        </div>
        <div className="body">
          {notes.length === 0 ? (
            <div className="pd-notes-empty">
              Açıklama yok. Düzenle butonuyla markdown ile not ekle.
              <br />
              <span
                style={{ fontFamily: "var(--mono)", fontSize: 11 }}
              >
                ## Başlık · - madde · `kod`
              </span>
            </div>
          ) : (
            notes.map((n, idx) => {
              if (n.kind === "h") return <h3 key={idx}>{n.text}</h3>;
              if (n.kind === "ul")
                return (
                  <ul key={idx}>
                    {n.items.map((it, j) => (
                      <li key={j}>
                        <span>{renderInline(it)}</span>
                      </li>
                    ))}
                  </ul>
                );
              // 1. paragraf zaten hero'da; sağda diğerlerini göster
              if (idx === notes.findIndex((x) => x.kind === "p")) return null;
              return <p key={idx}>{renderInline(n.text)}</p>;
            })
          )}
        </div>
      </aside>

    </div>
  );
}
