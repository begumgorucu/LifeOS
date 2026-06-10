/**
 * Projects sayfası — Kanban + momentum hero (designs/05-projects.html).
 *
 * Üstte: Aktif sayı + genel momentum % + her aktif projenin progress satırı.
 * Altta: 3 kolon (Aktif / Tamamlandı / Arşiv) + kart hover'da quick actions.
 *
 * Backend'de "notes" alanı yok; project detayına gitmek için kart click'i
 * sonradan Area Detail benzeri bir route'a bağlanır.
 */
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "@/styles/pages/projects.css";
import { useProjects } from "@/hooks/useProjects";
import { useAreas } from "@/hooks/useAreas";
import { NewProjectModal } from "@/components/NewProjectModal";
import { Icon } from "@/utils/icons";
import { healthInfo } from "@/utils/health";
import type { ProjectRead, ProjectStatus } from "@/types/api";

type ViewMode = "kanban" | "list";

const COLS: { key: ProjectStatus; label: string; color: string }[] = [
  { key: "active", label: "Aktif", color: "var(--iris)" },
  { key: "completed", label: "Tamamlandı", color: "var(--h-exc)" },
  { key: "archived", label: "Arşiv", color: "var(--ink-3)" },
];

// Mini ring — designs/05-projects.html miniRing() karşılığı
function MiniRing({ pct, color }: { pct: number; color: string }) {
  const r = 14;
  const c = 2 * Math.PI * r;
  return (
    <svg width="36" height="36" viewBox="0 0 36 36">
      <circle cx="18" cy="18" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="3.5" />
      <circle
        cx="18"
        cy="18"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct / 100)}
        transform="rotate(-90 18 18)"
      />
      <text
        x="18"
        y="22"
        textAnchor="middle"
        fontSize="11"
        fontWeight="600"
        fill={color}
        fontFamily="Hanken Grotesk"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {pct}
      </text>
    </svg>
  );
}

function daysLeft(date: string | null): number | null {
  if (!date) return null;
  const target = new Date(date);
  const today = new Date();
  return Math.floor((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function ProjectCard({ project }: { project: ProjectRead }) {
  const pct = project.progress;
  const color = healthInfo(project.area.health_score).color;
  const completed = project.status === "completed";
  const dl = daysLeft(project.target_date);
  const dlCls = dl !== null && dl < 7 ? "soon" : dl !== null && dl <= 14 ? "mid" : "far";

  return (
    <Link
      to={`/projects/${project.id}`}
      className={`pcard ${project.status}`}
      style={{ "--ac": color, textDecoration: "none", color: "inherit" } as React.CSSProperties}
    >
      {completed && (
        <span className="pseal">
          <Icon name="check" size={12} strokeWidth={2.4} />
        </span>
      )}
      <div className="qhead" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span className="tag">
          <span style={{ fontSize: 13 }}>{project.area.icon ?? "🌿"}</span>
          {project.area.name}
        </span>
        <MiniRing pct={pct} color={completed ? "var(--h-exc)" : color} />
      </div>
      <div className="pn">{project.title}</div>
      <div className="pfoot" style={{ marginTop: 12 }}>
        <span className="pprog tnum">
          {project.tasks_done}/{project.tasks_total} görev
        </span>
        {project.target_date && !completed && dl !== null && (
          <span className={`pdl ${dlCls}`}>
            <Icon name="clock" size={12} strokeWidth={1.8} /> {dl >= 0 ? `${dl} gün` : `${Math.abs(dl)} gn gecikmiş`}
          </span>
        )}
      </div>
    </Link>
  );
}

export default function ProjectsPage() {
  const { data, isLoading, isError, refetch } = useProjects({ limit: 100 });
  const { data: areasData } = useAreas({ limit: 50 });
  const [areaFilter, setAreaFilter] = useState<string>("");
  const [view, setView] = useState<ViewMode>("kanban");
  const [createOpen, setCreateOpen] = useState(false);
  const [createDefaultArea, setCreateDefaultArea] = useState<string | undefined>();

  const projects = data?.items ?? [];
  const filtered = useMemo(
    () => (areaFilter ? projects.filter((p) => p.area_id === areaFilter) : projects),
    [projects, areaFilter],
  );

  const activeProjects = filtered.filter((p) => p.status === "active");
  const totalDone = filtered.reduce((s, p) => s + p.tasks_done, 0);
  const totalAll = filtered.reduce((s, p) => s + p.tasks_total, 0);
  const overall = totalAll > 0 ? Math.round((totalDone / totalAll) * 100) : 0;

  const countsByStatus = useMemo(
    () => ({
      active: filtered.filter((p) => p.status === "active").length,
      completed: filtered.filter((p) => p.status === "completed").length,
      archived: filtered.filter((p) => p.status === "archived").length,
    }),
    [filtered],
  );

  // -------- Loading --------
  if (isLoading) {
    return (
      <>
        <div className="phead">
          <div>
            <h1>Projeler</h1>
            <div className="sub">Yükleniyor…</div>
          </div>
        </div>
        <div className="kanban">
          {[1, 2, 3].map((i) => (
            <div key={i} className="kcol">
              <div className="skel" style={{ height: 120, borderRadius: 11 }} />
            </div>
          ))}
        </div>
      </>
    );
  }

  // -------- Error --------
  if (isError) {
    return (
      <div className="state-block">
        <h2>Projeler yüklenemedi.</h2>
        <p>Sunucuya ulaşamıyoruz. Birazdan tekrar dene.</p>
        <div className="state-actions">
          <button className="btn pri lg" onClick={() => refetch()}>
            Tekrar dene
          </button>
        </div>
      </div>
    );
  }

  // -------- Empty --------
  if (projects.length === 0) {
    return (
      <>
        <div className="phead">
          <div>
            <h1>Projeler</h1>
            <div className="sub">Henüz proje yok</div>
          </div>
        </div>
        <div className="state-block">
          <h2>Henüz projen yok.</h2>
          <p>
            Bir alan altında bitişi olan ilk projeni yarat. Sertifika, ürün
            yayını, kitap okuma — küçük başla.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="phead">
        <div>
          <h1>Projeler</h1>
          <div className="sub">
            {countsByStatus.active} aktif · {countsByStatus.completed} tamamlandı · {countsByStatus.archived} arşiv
          </div>
        </div>
        <button
          className="btn pri"
          type="button"
          onClick={() => {
            setCreateDefaultArea(undefined);
            setCreateOpen(true);
          }}
        >
          <Icon name="plus" size={15} strokeWidth={2.2} /> Yeni proje
        </button>
      </div>

      {/* Filter toolbar */}
      <div className="ptoolbar">
        <label className="chipfilter">
          <Icon name="areas" size={14} strokeWidth={2} />
          Alan:
          <select
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value)}
            style={{
              border: "none",
              background: "transparent",
              font: "inherit",
              color: "inherit",
              cursor: "pointer",
            }}
          >
            <option value="">Tümü</option>
            {(areasData?.items ?? []).map((a) => (
              <option key={a.id} value={a.id}>
                {a.icon ?? "🌿"} {a.name}
              </option>
            ))}
          </select>
        </label>
        <div className="spacer" />
        <div className="seg">
          <button
            type="button"
            className={view === "kanban" ? "on" : ""}
            onClick={() => setView("kanban")}
          >
            Kanban
          </button>
          <button
            type="button"
            className={view === "list" ? "on" : ""}
            onClick={() => setView("list")}
          >
            Liste
          </button>
        </div>
      </div>

      {/* Momentum hero */}
      {activeProjects.length > 0 && (
        <div className="momentum">
          <div className="mom-stat">
            <div className="v" style={{ color: "var(--iris)" }}>
              {activeProjects.length}
            </div>
            <div className="l">Aktif proje</div>
          </div>
          <div className="mom-stat">
            <div className="v">%{overall}</div>
            <div className="l">Genel momentum</div>
          </div>
          <div className="mom-list">
            {activeProjects.slice(0, 6).map((p) => {
              const pc = p.progress;
              const col = healthInfo(p.area.health_score).color;
              return (
                <div className="mrow" key={p.id}>
                  <span className="mi">{p.area.icon ?? "🌿"}</span>
                  <span className="mn">{p.title}</span>
                  <div className="mbar">
                    <i style={{ width: `${pc}%`, background: col }} />
                  </div>
                  <span className="mp">{pc}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Kanban veya Liste */}
      {view === "kanban" ? (
        <div className="kanban">
          {COLS.map((col) => {
            const items = filtered.filter((p) => p.status === col.key);
            return (
              <div key={col.key} className="kcol">
                <div className="kcol-head">
                  <div className="t">
                    <span className="dot" style={{ background: col.color }} />
                    {col.label}
                    <span className="cnt">{items.length}</span>
                  </div>
                  <button
                    type="button"
                    className="add"
                    onClick={() => {
                      setCreateDefaultArea(areaFilter || undefined);
                      setCreateOpen(true);
                    }}
                    title="Bu kolona yeni proje ekle"
                  >
                    <Icon name="plus" size={15} strokeWidth={2.2} />
                  </button>
                </div>
                <div className="kcards">
                  {items.map((p) => (
                    <ProjectCard key={p.id} project={p} />
                  ))}
                  {items.length === 0 && (
                    <p
                      style={{
                        fontSize: 12,
                        color: "var(--ink-4)",
                        textAlign: "center",
                        padding: "20px 6px",
                      }}
                    >
                      Boş
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: 14,
            overflow: "hidden",
          }}
        >
          {filtered.map((p) => {
            const color = healthInfo(p.area.health_score).color;
            return (
              <div
                key={p.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "14px 18px",
                  borderTop: "1px solid var(--line)",
                }}
              >
                <span style={{ fontSize: 18 }}>{p.area.icon ?? "🌿"}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{p.title}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{p.area.name}</div>
                </div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--ink-3)" }}>
                  {p.tasks_done}/{p.tasks_total}
                </div>
                <div
                  style={{
                    width: 80,
                    height: 6,
                    borderRadius: 3,
                    background: "var(--surface-2)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${p.progress}%`,
                      height: "100%",
                      background: color,
                    }}
                  />
                </div>
                <div
                  style={{
                    width: 40,
                    textAlign: "right",
                    fontFamily: "var(--mono)",
                    fontSize: 12,
                    color,
                    fontWeight: 600,
                  }}
                >
                  {p.progress}%
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p style={{ padding: 24, textAlign: "center", color: "var(--ink-4)" }}>
              Bu filtreye uyan proje yok.
            </p>
          )}
        </div>
      )}

      <NewProjectModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        defaultAreaId={createDefaultArea}
      />
    </>
  );
}
