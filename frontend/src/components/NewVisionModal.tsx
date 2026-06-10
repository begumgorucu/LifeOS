/**
 * Hayal (Vision) modal'ı — hem yeni eklemek hem mevcut hayalı düzenlemek için.
 *
 * `editing` prop verilirse PATCH /visions/:id, verilmezse POST /visions.
 * Backend `vibrance`'ı bağlı alanların sağlık skoru + aktif projelerinin
 * ortalama ilerleme yüzdesinden hesaplar; o yüzden alan seçimi kritik.
 */
import { useEffect, useMemo, useState } from "react";
import { Modal } from "./Modal";
import { useAreas } from "@/hooks/useAreas";
import { useProjects } from "@/hooks/useProjects";
import { useCreateVision, useUpdateVision } from "@/hooks/useVisions";
import type { VisionRead } from "@/types/api";

interface Props {
  open: boolean;
  onClose: () => void;
  editing?: VisionRead | null;
}

// ISO date "YYYY-MM-DD" -> date input
function isoToDate(iso?: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

export function NewVisionModal({ open, onClose, editing }: Props) {
  const { data: areasData } = useAreas({ limit: 50 });
  const areas = areasData?.items ?? [];
  const { data: projectsData } = useProjects({ limit: 100 });
  const allProjects = projectsData?.items ?? [];

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [areaIds, setAreaIds] = useState<string[]>([]);
  const [projectIds, setProjectIds] = useState<string[]>([]);

  const create = useCreateVision();
  const update = useUpdateVision();
  const isEdit = !!editing;
  const pending = create.isPending || update.isPending;

  // Düzenleme moduna girince mevcut alanları doldur
  useEffect(() => {
    if (open && editing) {
      setTitle(editing.title);
      setDescription(editing.description ?? "");
      setImageUrl(editing.image_url ?? "");
      setTargetDate(isoToDate(editing.target_date));
      setAreaIds(editing.areas.map((a) => a.id));
      setProjectIds(editing.projects.map((p) => p.id));
    }
  }, [open, editing]);

  const handleClose = () => {
    setTitle("");
    setDescription("");
    setImageUrl("");
    setTargetDate("");
    setAreaIds([]);
    setProjectIds([]);
    create.reset();
    update.reset();
    onClose();
  };

  const toggleArea = (id: string) => {
    setAreaIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleProject = (id: string) => {
    setProjectIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  // Aktif projeler — seçili alanlardakileri öne çıkar, sonra diğerleri.
  // Tüm aktif projeleri gösterilebilir tut; alan seçimi kullanıcıya yön verir.
  const orderedProjects = useMemo(() => {
    const active = allProjects.filter((p) => p.status !== "completed");
    if (areaIds.length === 0) return active;
    const inSelected = active.filter((p) => areaIds.includes(p.area_id));
    const rest = active.filter((p) => !areaIds.includes(p.area_id));
    return [...inSelected, ...rest];
  }, [allProjects, areaIds]);

  const submit = () => {
    const trimmed = title.trim();
    if (!trimmed) return;

    const payload = {
      title: trimmed,
      description: description.trim() || null,
      image_url: imageUrl.trim() || null,
      target_date: targetDate || null,
    };

    if (isEdit && editing) {
      update.mutate(
        {
          id: editing.id,
          payload: {
            ...payload,
            area_ids: areaIds,
            project_ids: projectIds,
          },
        },
        { onSuccess: handleClose },
      );
    } else {
      create.mutate(
        { ...payload, area_ids: areaIds, project_ids: projectIds },
        { onSuccess: handleClose },
      );
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      icon="vision"
      title={isEdit ? "Hayalı düzenle" : "Yeni hayal"}
      footer={
        <>
          <button className="btn gho" type="button" onClick={handleClose}>
            İptal
          </button>
          <button
            className="btn pri"
            type="button"
            onClick={submit}
            disabled={!title.trim() || pending}
          >
            {pending
              ? isEdit
                ? "Kaydediliyor…"
                : "Asılıyor…"
              : isEdit
              ? "Kaydet"
              : "Panoya as"}
          </button>
        </>
      }
    >
      <div className="cm-field">
        <label>Hayal</label>
        <input
          autoFocus
          placeholder="Örn. Avrupa'da yaşamak"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) submit();
          }}
        />
      </div>
      <div className="cm-field">
        <label>Açıklama (opsiyonel)</label>
        <input
          placeholder="Hayali kısaca yaz…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="cm-field">
        <label>Görsel URL (opsiyonel)</label>
        <input
          placeholder="https://… (kart arka planı olur)"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
        />
      </div>
      <div className="cm-field">
        <label>Hedef tarih (opsiyonel)</label>
        <input
          type="date"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
        />
      </div>
      <div className="cm-field">
        <label>
          Bağlı alanlar
          <span
            style={{
              marginLeft: 8,
              fontSize: 11,
              color: "var(--ink-4)",
              fontWeight: 400,
            }}
          >
            · alanın sağlık skoru canlılığı besler
          </span>
        </label>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            paddingTop: 4,
          }}
        >
          {areas.length === 0 && (
            <span style={{ fontSize: 12, color: "var(--ink-4)" }}>
              Henüz alanın yok — önce Areas'tan bir alan ekle.
            </span>
          )}
          {areas.map((a) => {
            const on = areaIds.includes(a.id);
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => toggleArea(a.id)}
                style={{
                  border: on
                    ? "1.5px solid var(--iris)"
                    : "1px solid var(--line-2)",
                  background: on ? "var(--i50)" : "var(--surface)",
                  color: on ? "var(--iris)" : "var(--ink-2)",
                  padding: "6px 10px",
                  borderRadius: 8,
                  font: "inherit",
                  fontSize: 13,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <span>{a.icon ?? "🌿"}</span>
                {a.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* === Bağlı projeler — bu hayalın iskeleti === */}
      <div className="cm-field">
        <label>
          Bağlı projeler
          <span
            style={{
              marginLeft: 8,
              fontSize: 11,
              color: "var(--ink-4)",
              fontWeight: 400,
            }}
          >
            · projenin ilerlemesi hayalın canlılığına direkt yansır
          </span>
        </label>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            paddingTop: 4,
            maxHeight: 180,
            overflowY: "auto",
          }}
        >
          {orderedProjects.length === 0 && (
            <span style={{ fontSize: 12, color: "var(--ink-4)" }}>
              Aktif proje yok — önce Projects sayfasından bir proje aç.
            </span>
          )}
          {orderedProjects.map((p) => {
            const on = projectIds.includes(p.id);
            const inSelectedArea = areaIds.includes(p.area_id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => toggleProject(p.id)}
                title={`${p.area.name} · %${p.progress} tamamlandı`}
                style={{
                  border: on
                    ? "1.5px solid var(--iris)"
                    : "1px solid var(--line-2)",
                  background: on ? "var(--i50)" : "var(--surface)",
                  color: on ? "var(--iris)" : "var(--ink-2)",
                  padding: "6px 10px",
                  borderRadius: 8,
                  font: "inherit",
                  fontSize: 13,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  opacity: inSelectedArea || areaIds.length === 0 ? 1 : 0.6,
                }}
              >
                <span>📁</span>
                <span>{p.title}</span>
                <span
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 10.5,
                    color: on ? "var(--iris)" : "var(--ink-4)",
                    fontWeight: 600,
                  }}
                >
                  %{p.progress}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
