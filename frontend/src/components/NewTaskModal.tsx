/**
 * Hızlı yeni görev modal'ı.
 *
 * Topbar "Hızlı ekle" / AreaCard "Görev" / Calendar hücresi gibi her
 * yerden açılır. İsim + alan + öncelik + (opsiyonel) tarih.
 */
import { useEffect, useMemo, useState } from "react";
import { Modal } from "./Modal";
import { useAreas } from "@/hooks/useAreas";
import { useProjects } from "@/hooks/useProjects";
import { useCreateTask } from "@/hooks/useTasks";
import type { TaskPriority } from "@/types/api";

interface Props {
  open: boolean;
  onClose: () => void;
  defaultAreaId?: string;
  defaultProjectId?: string;
  defaultDueAt?: string; // ISO datetime string (örn. "2026-06-15T12:00:00")
}

const PRIORITIES: { key: TaskPriority; label: string; color: string }[] = [
  { key: "low", label: "Düşük", color: "var(--ink-4)" },
  { key: "medium", label: "Orta", color: "var(--h-good)" },
  { key: "high", label: "Yüksek", color: "var(--h-crit)" },
];

// ISO string → "YYYY-MM-DD" (date input için)
function isoToDate(iso?: string): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

export function NewTaskModal({
  open,
  onClose,
  defaultAreaId,
  defaultProjectId,
  defaultDueAt,
}: Props) {
  const { data: areasData } = useAreas({ limit: 50 });
  const areas = areasData?.items ?? [];
  const { data: projectsData } = useProjects({ limit: 100 });
  const allProjects = projectsData?.items ?? [];

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [areaId, setAreaId] = useState(defaultAreaId ?? "");
  const [projectId, setProjectId] = useState(defaultProjectId ?? "");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [dueDate, setDueDate] = useState(isoToDate(defaultDueAt));
  const createTask = useCreateTask();

  // Modal her açıldığında default değerleri senkronize et
  useEffect(() => {
    if (open) {
      setAreaId(defaultAreaId ?? "");
      setProjectId(defaultProjectId ?? "");
      setDueDate(isoToDate(defaultDueAt));
    }
  }, [open, defaultAreaId, defaultProjectId, defaultDueAt]);

  // Seçili alana ait projeler — alan değişince proje seçimi sıfırlanır.
  const projectsForArea = useMemo(() => {
    const target = areaId || areas[0]?.id;
    if (!target) return [];
    return allProjects.filter(
      (p) => p.area_id === target && p.status !== "completed",
    );
  }, [allProjects, areaId, areas]);

  // Alan değişince, mevcut proje seçimi bu alana ait değilse sıfırla.
  useEffect(() => {
    if (!projectId) return;
    if (!projectsForArea.some((p) => p.id === projectId)) {
      setProjectId("");
    }
  }, [areaId, projectsForArea, projectId]);

  const handleClose = () => {
    setName("");
    setDescription("");
    setAreaId("");
    setProjectId("");
    setPriority("medium");
    setDueDate("");
    createTask.reset();
    onClose();
  };

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const target = areaId || areas[0]?.id;
    if (!target) return;
    // Tarihi UTC öğleni olarak gönder (sonundaki Z timezone bilgisi şart).
    const due_at = dueDate ? `${dueDate}T12:00:00Z` : undefined;
    const trimmedDesc = description.trim();
    createTask.mutate(
      {
        title: trimmed,
        description: trimmedDesc || undefined,
        area_id: target,
        project_id: projectId || undefined,
        priority,
        due_at,
      },
      { onSuccess: () => handleClose() },
    );
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      icon="tasks"
      title="Yeni görev"
      footer={
        <>
          <button className="btn gho" onClick={handleClose} type="button">
            İptal
          </button>
          <button
            className="btn pri"
            onClick={submit}
            type="button"
            disabled={!name.trim() || createTask.isPending}
          >
            {createTask.isPending ? "Oluşturuluyor…" : "Oluştur"}
          </button>
        </>
      }
    >
      <div className="cm-field">
        <label>Kısa ad</label>
        <input
          autoFocus
          placeholder="Örn. Almanca tekrar"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
        />
        <small style={{ display: "block", marginTop: 4, fontSize: 11, color: "var(--ink-4)" }}>
          Takvimde bu kısa ad görünür.
        </small>
      </div>
      <div className="cm-field">
        <label>Açıklama (opsiyonel)</label>
        <textarea
          placeholder="Detaylar, notlar, hatırlatmalar…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          style={{
            width: "100%",
            padding: "8px 10px",
            border: "1px solid var(--line)",
            borderRadius: 8,
            background: "var(--surface)",
            color: "var(--ink)",
            fontFamily: "inherit",
            fontSize: 13,
            resize: "vertical",
            minHeight: 60,
          }}
        />
      </div>
      <div className="cm-field">
        <label>Alan</label>
        <select value={areaId} onChange={(e) => setAreaId(e.target.value)}>
          <option value="">{areas[0]?.name ?? "—"}</option>
          {areas.map((a) => (
            <option key={a.id} value={a.id}>
              {a.icon ?? "🌿"} {a.name}
            </option>
          ))}
        </select>
      </div>
      <div className="cm-field">
        <label>
          Proje (opsiyonel)
          {projectsForArea.length === 0 && (
            <span
              style={{
                marginLeft: 8,
                fontSize: 11,
                color: "var(--ink-4)",
                fontWeight: 400,
              }}
            >
              · bu alanda aktif proje yok
            </span>
          )}
        </label>
        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          disabled={projectsForArea.length === 0}
        >
          <option value="">— Yok (sadece alana bağlı)</option>
          {projectsForArea.map((p) => (
            <option key={p.id} value={p.id}>
              📁 {p.title}
              {p.target_date
                ? ` · ${new Date(p.target_date).toLocaleDateString("tr-TR", {
                    day: "numeric",
                    month: "short",
                  })}`
                : ""}
            </option>
          ))}
        </select>
      </div>
      <div className="cm-field">
        <label>Tarih (opsiyonel)</label>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </div>
      <div className="cm-field">
        <label>Öncelik</label>
        <div className="cm-pri">
          {PRIORITIES.map((p) => (
            <button
              key={p.key}
              type="button"
              className={p.key === priority ? "on" : ""}
              onClick={() => setPriority(p.key)}
            >
              <span className="pd" style={{ background: p.color }} />
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}
