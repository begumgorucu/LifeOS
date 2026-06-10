/**
 * Area Detail — tek bir alanın detay sayfası.
 *
 * Backend endpoint'leri:
 *   - GET /areas/:id      → alan bilgisi + visions + counts
 *   - GET /tasks?area_id  → bu alanın görevleri
 *   - GET /projects?area_id → bu alanın projeleri
 *   - POST /areas/:id/recompute-health → "Aktivite" aksiyonu
 *
 * Tasarımdaki Hedef Yolu (roadmap) backend'de henüz milestone modeli
 * olmadığı için şimdilik placeholder. Görevler ve projeler gerçek data.
 */
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { areasApi, projectsApi, tasksApi } from "@/api/endpoints";
import { RingScore } from "@/components/RingScore";
import { TaskRow } from "@/components/TaskRow";
import { NewTaskModal } from "@/components/NewTaskModal";
import { NewProjectModal } from "@/components/NewProjectModal";
import { useLogActivity } from "@/hooks/useLogActivity";
import { Icon } from "@/utils/icons";
import { healthInfo } from "@/utils/health";
import { timeAgo } from "@/utils/format";

export default function AreaDetailPage() {
  const { areaId = "" } = useParams<{ areaId: string }>();
  const nav = useNavigate();
  const qc = useQueryClient();

  const { data: area, isLoading } = useQuery({
    queryKey: ["areas", "detail", areaId],
    queryFn: () => areasApi.get(areaId),
    enabled: !!areaId,
  });

  const { data: tasksData } = useQuery({
    queryKey: ["tasks", "list", { area_id: areaId, limit: 100 }],
    queryFn: () => tasksApi.list({ area_id: areaId, limit: 100 }),
    enabled: !!areaId,
  });

  const { data: projectsData } = useQuery({
    queryKey: ["projects", "list", { area_id: areaId, limit: 100 }],
    queryFn: () => projectsApi.list({ area_id: areaId, limit: 100 }),
    enabled: !!areaId,
  });

  const logActivity = useLogActivity();

  const deleteArea = useMutation({
    mutationFn: () => areasApi.remove(areaId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["areas"] });
      nav("/areas");
    },
  });

  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [newProjectOpen, setNewProjectOpen] = useState(false);

  if (isLoading) {
    return (
      <>
        <div className="page-head">
          <h1>Yükleniyor…</h1>
        </div>
        <div className="skel" style={{ height: 200 }} />
      </>
    );
  }

  if (!area) {
    return (
      <div className="state-block">
        <h2>Alan bulunamadı.</h2>
        <p>Bu alan silinmiş olabilir ya da bağlantı yanlış.</p>
        <div className="state-actions">
          <Link to="/areas" className="btn pri lg">
            Alanlar listesine dön
          </Link>
        </div>
      </div>
    );
  }

  const tasks = tasksData?.items ?? [];
  const projects = projectsData?.items ?? [];
  const openTasks = tasks.filter((t) => t.status === "todo" || t.status === "in_progress");
  const doneTasks = tasks.filter((t) => t.status === "done");
  const info = healthInfo(area.health_score);

  return (
    <>
      {/* Crumb */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          fontSize: 13,
          color: "var(--ink-3)",
          marginBottom: 18,
        }}
      >
        <Link to="/areas" style={{ color: "var(--ink-3)", textDecoration: "none" }}>
          Alanlar
        </Link>
        <Icon name="chevron" size={14} strokeWidth={2} />
        <span style={{ color: "var(--ink-2)" }}>{area.name}</span>
      </div>

      {/* Header card */}
      <div
        className={`card ${area.is_neglected ? "neg" : ""}`}
        style={{
          padding: 24,
          marginBottom: 20,
          position: "relative",
          overflow: "hidden",
          borderColor: area.is_neglected ? "#F0CFCB" : undefined,
        }}
      >
        {area.is_neglected && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              background: "var(--h-crit)",
            }}
          />
        )}

        <div style={{ display: "flex", alignItems: "flex-start", gap: 18 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: area.is_neglected ? "var(--h-crit-s)" : "var(--surface-2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              flexShrink: 0,
            }}
          >
            {area.icon ?? "🌿"}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h1
              style={{
                fontSize: 25,
                fontWeight: 600,
                letterSpacing: "-0.02em",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              {area.name}
              {area.is_neglected && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12,
                    fontWeight: 500,
                    color: "var(--h-crit-d)",
                    background: "var(--h-crit-s)",
                    padding: "4px 10px",
                    borderRadius: 7,
                  }}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: "var(--h-crit)",
                      animation: "pulse 2s infinite",
                    }}
                  />
                  İhmal ediliyor
                </span>
              )}
            </h1>
            <p
              style={{
                fontSize: 14,
                color: "var(--ink-3)",
                marginTop: 3,
              }}
            >
              {area.description ?? "Açıklama eklenmedi."}
            </p>

            {/* Stats meta */}
            <div
              style={{
                display: "flex",
                gap: 22,
                marginTop: 18,
                paddingTop: 16,
                borderTop: "1px solid var(--line)",
                flexWrap: "wrap",
              }}
            >
              <Stat label="Açık görev" value={openTasks.length} />
              <Stat label="Tamamlanan" value={doneTasks.length} />
              <Stat label="Aktif proje" value={area.projects_count} />
              <Stat label="Bağlı hayal" value={area.visions.length} />
              <Stat
                label="Son aktivite"
                value={timeAgo(area.last_activity_at)}
                tnum={false}
              />
            </div>
          </div>

          {/* Sağ üst: Ring + delta */}
          <div style={{ flexShrink: 0, textAlign: "center" }}>
            <RingScore score={area.health_score} size={96} strokeWidth={7} labelText="Skor" />
            <div
              style={{
                fontSize: 11.5,
                color: "var(--ink-3)",
                marginTop: 8,
                fontFamily: "var(--mono)",
              }}
            >
              {info.label}
            </div>
          </div>
        </div>

        {/* Aksiyon barı */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginTop: 20,
            paddingTop: 16,
            borderTop: "1px solid var(--line)",
          }}
        >
          <button
            type="button"
            className="btn pri"
            onClick={() => setNewTaskOpen(true)}
          >
            <Icon name="plus" size={14} strokeWidth={2.2} /> Görev ekle
          </button>
          <button
            type="button"
            className="btn sec"
            onClick={() => setNewProjectOpen(true)}
          >
            <Icon name="projects" size={14} strokeWidth={1.8} /> Proje ekle
          </button>
          <button
            type="button"
            className="btn sec"
            onClick={() =>
              logActivity.mutate({ areaId: area.id, areaName: area.name })
            }
            disabled={logActivity.isPending}
            title="Hızlı aktivite kaydet — skor +5"
          >
            <Icon name="check" size={14} strokeWidth={1.8} />{" "}
            {logActivity.isPending ? "Kaydediliyor…" : "Aktivite"}
          </button>
          <div style={{ flex: 1 }} />
          <button
            type="button"
            className="btn gho"
            style={{ color: "var(--h-crit-d)" }}
            onClick={() => {
              if (
                window.confirm(
                  `"${area.name}" alanını silmek istediğine emin misin? Bağlı tüm proje ve görevler de silinecek.`,
                )
              ) {
                deleteArea.mutate();
              }
            }}
            disabled={deleteArea.isPending}
          >
            <Icon name="trash" size={14} strokeWidth={1.8} /> Sil
          </button>
        </div>
      </div>

      {/* Görevler */}
      <div style={{ marginBottom: 20 }}>
        <div className="block-head" style={{ marginBottom: 12 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600 }}>Görevler</h2>
          <span style={{ fontSize: 12, color: "var(--ink-3)" }}>
            {openTasks.length} açık · {doneTasks.length} tamam
          </span>
        </div>
        {tasks.length === 0 ? (
          <p
            style={{
              padding: 24,
              textAlign: "center",
              color: "var(--ink-4)",
              fontSize: 13,
              background: "var(--surface)",
              border: "1px dashed var(--line-2)",
              borderRadius: 12,
            }}
          >
            Bu alana henüz görev eklenmedi.
          </p>
        ) : (
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--line)",
              borderRadius: 14,
              padding: 6,
            }}
          >
            {tasks.slice(0, 10).map((t) => (
              <TaskRow key={t.id} task={t} />
            ))}
          </div>
        )}
      </div>

      {/* Projeler */}
      {projects.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div className="block-head" style={{ marginBottom: 12 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600 }}>Projeler</h2>
            <Link to="/projects" className="link" style={{ fontSize: 13, color: "var(--iris)" }}>
              Tüm projeler <Icon name="arrow" size={13} strokeWidth={2} />
            </Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
            {projects.map((p) => (
              <div
                key={p.id}
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--line-2)",
                  borderRadius: 12,
                  padding: 14,
                }}
              >
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    marginBottom: 8,
                  }}
                >
                  {p.title}
                </div>
                <div
                  style={{
                    height: 6,
                    background: "var(--surface-2)",
                    borderRadius: 3,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${p.progress}%`,
                      height: "100%",
                      background: info.color,
                    }}
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: 8,
                    fontSize: 12,
                    color: "var(--ink-3)",
                  }}
                >
                  <span>
                    {p.tasks_done}/{p.tasks_total} görev
                  </span>
                  <b style={{ color: info.color, fontFamily: "var(--mono)" }}>{p.progress}%</b>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bağlı hayaller */}
      {area.visions.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div className="block-head" style={{ marginBottom: 12 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600 }}>Bağlı hayaller</h2>
            <Link to="/visions" className="link" style={{ fontSize: 13, color: "var(--iris)" }}>
              Vision Board <Icon name="arrow" size={13} strokeWidth={2} />
            </Link>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {area.visions.map((v) => (
              <span
                key={v.id}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: "var(--i50)",
                  color: "var(--iris)",
                  padding: "6px 12px",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                ⭐ {v.title}
              </span>
            ))}
          </div>
        </div>
      )}

      <NewTaskModal
        open={newTaskOpen}
        onClose={() => setNewTaskOpen(false)}
        defaultAreaId={area.id}
      />
      <NewProjectModal
        open={newProjectOpen}
        onClose={() => setNewProjectOpen(false)}
        defaultAreaId={area.id}
      />
    </>
  );
}

function Stat({
  label,
  value,
  tnum = true,
}: {
  label: string;
  value: number | string;
  tnum?: boolean;
}) {
  return (
    <div>
      <div
        style={{
          fontFamily: "var(--mono)",
          fontSize: 10,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          color: "var(--ink-4)",
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div
        className={tnum ? "tnum" : ""}
        style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.01em" }}
      >
        {value}
      </div>
    </div>
  );
}
