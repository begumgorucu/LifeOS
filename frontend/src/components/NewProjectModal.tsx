/**
 * Yeni proje modal'ı — Projects sayfasındaki "Yeni proje" butonundan açılır.
 * Alan + başlık + (opsiyonel) hedef tarih.
 */
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Modal } from "./Modal";
import { useAreas } from "@/hooks/useAreas";
import { projectsApi } from "@/api/endpoints";
import type { ProjectCreate } from "@/types/api";

interface Props {
  open: boolean;
  onClose: () => void;
  defaultAreaId?: string;
}

export function NewProjectModal({ open, onClose, defaultAreaId }: Props) {
  const { data: areasData } = useAreas({ limit: 50 });
  const areas = areasData?.items ?? [];
  const qc = useQueryClient();

  const [title, setTitle] = useState("");
  const [areaId, setAreaId] = useState(defaultAreaId ?? "");
  const [targetDate, setTargetDate] = useState("");

  const create = useMutation({
    mutationFn: (payload: ProjectCreate) => projectsApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["areas"] });
      handleClose();
    },
  });

  const handleClose = () => {
    setTitle("");
    setAreaId(defaultAreaId ?? "");
    setTargetDate("");
    create.reset();
    onClose();
  };

  const submit = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const target = areaId || areas[0]?.id;
    if (!target) return;
    create.mutate({
      title: trimmed,
      area_id: target,
      target_date: targetDate || undefined,
    });
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      icon="projects"
      title="Yeni proje"
      footer={
        <>
          <button className="btn gho" type="button" onClick={handleClose}>
            İptal
          </button>
          <button
            className="btn pri"
            type="button"
            onClick={submit}
            disabled={!title.trim() || create.isPending}
          >
            {create.isPending ? "Oluşturuluyor…" : "Oluştur"}
          </button>
        </>
      }
    >
      <div className="cm-field">
        <label>İsim</label>
        <input
          autoFocus
          placeholder="Örn. B2 sınavına hazırlık"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
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
        <label>Hedef tarih (opsiyonel)</label>
        <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
      </div>
    </Modal>
  );
}
