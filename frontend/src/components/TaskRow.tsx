/**
 * Tasks listesinin tek satırı.
 *
 * designs/06-tasks.html trow() çıktısının React karşılığı:
 * Checkbox, öncelik noktası, başlık, dependency badge'i, alan/dakika/tarih
 * meta'ları, hover quick actions.
 *
 * Tıklama: checkbox → complete, sağ buton trash → silme. Diğer aksiyonlar
 * (düzenle, öncelik, kopyala) faz 3'te.
 */
import type { TaskRead } from "@/types/api";
import { useCompleteTask, useSkipTask, useReopenTask } from "@/hooks/useTasks";
import { Icon } from "@/utils/icons";

interface TaskRowProps {
  task: TaskRead;
  onDelete?: (id: string) => void;
  // Hangi meta'lar gösterilsin? Tasks sayfasında zaten Proje görünümündeysek
  // proje chip'i tekrarlanmasın diye seçilebilir.
  showProject?: boolean;
  showArea?: boolean;
  onProjectClick?: (projectId: string) => void;
  onAreaClick?: (areaId: string) => void;
}

const PRIORITY_COLOR: Record<TaskRead["priority"], string> = {
  high: "var(--h-crit)",
  medium: "var(--h-good)",
  low: "var(--ink-4)",
};

const PRIORITY_LABEL: Record<TaskRead["priority"], string> = {
  high: "Yüksek",
  medium: "Orta",
  low: "Düşük",
};

function dueLabel(due: string | null): { label: string; urgent: boolean } | null {
  if (!due) return null;
  const dueDate = new Date(due);
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diffMs = dueDate.getTime() - startOfToday.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { label: `${Math.abs(diffDays)} gn gecikmiş`, urgent: true };
  if (diffDays === 0) return { label: "Bugün", urgent: true };
  if (diffDays === 1) return { label: "Yarın", urgent: false };
  if (diffDays < 7) return { label: `${diffDays} gün`, urgent: false };
  return {
    label: new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short" }).format(
      dueDate,
    ),
    urgent: false,
  };
}

export function TaskRow({
  task,
  onDelete,
  showProject = true,
  showArea = true,
  onProjectClick,
  onAreaClick,
}: TaskRowProps) {
  const complete = useCompleteTask();
  const skip = useSkipTask();
  const reopen = useReopenTask();

  const done = task.status === "done";
  const skipped = task.status === "skipped";
  const due = dueLabel(task.due_at);

  const handleCheckClick = () => {
    if (done) reopen.mutate(task.id);
    else complete.mutate(task.id);
  };

  return (
    <div className={`trow ${done ? "done" : ""} ${skipped ? "skipped" : ""}`}>
      <button
        type="button"
        className={`tcheck ${done ? "done" : ""}`}
        onClick={handleCheckClick}
        aria-label={done ? "Geri aç" : "Tamamla"}
        title={done ? "Geri aç" : "Tamamla"}
      >
        <Icon name="check" size={12} strokeWidth={3} />
      </button>

      <span
        className={`pri-dot pri-${task.priority}`}
        title={PRIORITY_LABEL[task.priority]}
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          backgroundColor: PRIORITY_COLOR[task.priority],
          flexShrink: 0,
          display: "inline-block",
        }}
      />

      <span
        className="tn"
        style={{
          flex: 1,
          fontSize: 14,
          color: done ? "var(--ink-3)" : "var(--ink)",
          textDecoration: done ? "line-through" : undefined,
        }}
      >
        {task.title}
      </span>

      {task.is_blocked && task.depends_on.length > 0 && (
        <span
          className="dep"
          title={task.depends_on.map((d) => d.title).join(", ")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontSize: 11.5,
            color: "var(--ink-3)",
            background: "var(--surface-2)",
            padding: "2px 7px",
            borderRadius: 5,
          }}
        >
          <Icon name="link" size={12} strokeWidth={1.8} />
          {task.depends_on.length} bekliyor
        </span>
      )}

      <div
        className="meta"
        style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--ink-3)" }}
      >
        {showProject && task.project && (
          <span
            className="proj-chip"
            onClick={(e) => {
              if (!onProjectClick) return;
              e.stopPropagation();
              onProjectClick(task.project!.id);
            }}
            title={`Proje: ${task.project.title}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 11.5,
              color: "var(--iris)",
              background: "var(--i50)",
              padding: "2px 8px",
              borderRadius: 5,
              cursor: onProjectClick ? "pointer" : "default",
              maxWidth: 160,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontWeight: 500,
            }}
          >
            <Icon name="projects" size={11} strokeWidth={1.9} />
            {task.project.title}
          </span>
        )}

        {showArea && (
          <span
            className="area-t"
            onClick={(e) => {
              if (!onAreaClick) return;
              e.stopPropagation();
              onAreaClick(task.area.id);
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 12,
              cursor: onAreaClick ? "pointer" : "default",
            }}
          >
            <span>{task.area.icon ?? "🌿"}</span>
            {task.area.name}
          </span>
        )}

        {due && (
          <span
            className={`due ${due.urgent ? "urgent" : ""}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 12,
              color: due.urgent ? "var(--h-crit-d)" : "var(--ink-3)",
            }}
          >
            <Icon name="calendar" size={12} strokeWidth={1.8} />
            {due.label}
          </span>
        )}
      </div>

      <div
        className="qact"
        style={{ display: "flex", gap: 4, marginLeft: 8, opacity: 0.6 }}
      >
        {!done && !skipped && (
          <button
            type="button"
            title="Atla"
            onClick={() => skip.mutate(task.id)}
            style={{
              background: "none",
              border: "none",
              padding: 4,
              cursor: "pointer",
              color: "var(--ink-3)",
            }}
          >
            <Icon name="play" size={14} strokeWidth={1.8} />
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            title="Sil"
            onClick={() => onDelete(task.id)}
            style={{
              background: "none",
              border: "none",
              padding: 4,
              cursor: "pointer",
              color: "var(--h-crit)",
            }}
          >
            <Icon name="trash" size={14} strokeWidth={1.8} />
          </button>
        )}
      </div>
    </div>
  );
}
