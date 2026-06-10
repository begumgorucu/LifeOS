/**
 * Liste içine inline task ekleme satırı.
 *
 * Enter'a bastığında verilen alana yeni task ekler. Area seçimi olmadan
 * çalışmaz — komponent prop'la zorunlu area alır.
 */
import { useState } from "react";
import { useCreateTask } from "@/hooks/useTasks";
import { useAreas } from "@/hooks/useAreas";
import { Icon } from "@/utils/icons";

interface Props {
  defaultAreaId?: string;
}

export function InlineAddTask({ defaultAreaId }: Props) {
  const { data: areasData } = useAreas({ limit: 50 });
  const areas = areasData?.items ?? [];
  const [title, setTitle] = useState("");
  const [areaId, setAreaId] = useState(defaultAreaId ?? "");
  const createTask = useCreateTask();

  const submit = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const targetArea = areaId || areas[0]?.id;
    if (!targetArea) return;
    createTask.mutate(
      { title: trimmed, area_id: targetArea, priority: "medium" },
      {
        onSuccess: () => setTitle(""),
      },
    );
  };

  return (
    <div
      className="inline-add"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 14px",
        margin: "10px 0",
        border: "1px dashed var(--line-2)",
        borderRadius: 10,
        background: "var(--surface)",
      }}
    >
      <button
        type="button"
        onClick={submit}
        style={{
          background: "var(--iris)",
          color: "white",
          border: "none",
          borderRadius: 7,
          width: 26,
          height: 26,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}
      >
        <Icon name="plus" size={14} strokeWidth={2.4} />
      </button>
      <input
        type="text"
        placeholder="Hızlı görev ekle, Enter…"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
        }}
        style={{
          flex: 1,
          border: "none",
          outline: "none",
          background: "none",
          font: "inherit",
          color: "var(--ink)",
        }}
      />
      {areas.length > 0 && (
        <select
          value={areaId}
          onChange={(e) => setAreaId(e.target.value)}
          style={{
            border: "1px solid var(--line-2)",
            borderRadius: 7,
            padding: "5px 8px",
            font: "inherit",
            fontSize: 12.5,
            color: "var(--ink-2)",
            background: "var(--surface)",
            cursor: "pointer",
          }}
        >
          <option value="">{defaultAreaId ? "" : "Alan seç"}</option>
          {areas.map((a) => (
            <option key={a.id} value={a.id}>
              {a.icon ?? "🌿"} {a.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
