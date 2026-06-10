/**
 * Yeni alan oluşturma modal'ı.
 *
 * İsim + emoji seçici. Backend POST /areas çağırır; mutation başarılı
 * olunca areas listesi otomatik tazelenir (useCreateArea içindeki
 * invalidate sayesinde).
 */
import { useState } from "react";
import { Modal } from "./Modal";
import { useCreateArea } from "@/hooks/useAreas";

const EMOJIS = ["🌿", "💼", "🗣️", "💰", "❤️", "🎵", "📚", "🏃", "✨", "🎯", "🌍", "🚀", "🎨", "🧠"];

interface NewAreaModalProps {
  open: boolean;
  onClose: () => void;
}

export function NewAreaModal({ open, onClose }: NewAreaModalProps) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState(EMOJIS[0]);
  const createArea = useCreateArea();

  // Modal kapatılırken state'i sıfırla — tekrar açıldığında temiz başlasın.
  const handleClose = () => {
    setName("");
    setIcon(EMOJIS[0]);
    createArea.reset();
    onClose();
  };

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    createArea.mutate(
      { name: trimmed, icon },
      { onSuccess: () => handleClose() },
    );
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      icon="areas"
      title="Yeni alan"
      footer={
        <>
          <button className="btn gho" onClick={handleClose} type="button">
            İptal
          </button>
          <button
            className="btn pri"
            onClick={handleSubmit}
            type="button"
            disabled={!name.trim() || createArea.isPending}
          >
            {createArea.isPending ? "Oluşturuluyor…" : "Oluştur"}
          </button>
        </>
      }
    >
      <div className="cm-field">
        <label>İsim</label>
        <input
          autoFocus
          placeholder="Örn. Sağlık"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
          }}
        />
      </div>
      <div className="cm-field">
        <label>İkon</label>
        <div className="cm-emojis">
          {EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              className={e === icon ? "on" : ""}
              onClick={() => setIcon(e)}
            >
              {e}
            </button>
          ))}
        </div>
      </div>
      {createArea.isError && (
        <p style={{ color: "var(--h-crit-d)", fontSize: 13, marginTop: 8 }}>
          Alan oluşturulamadı, tekrar dener misin?
        </p>
      )}
    </Modal>
  );
}
