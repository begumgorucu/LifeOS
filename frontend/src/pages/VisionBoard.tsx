/**
 * Vision Board — backend'deki gerçek hayallere bağlı dinamik pano.
 *
 * - Vision kartları masonry tarzı dağıtılır; üst-üste hafif rotasyon
 *   ile pushpin / tape (raptiye / bant) ile asılı durur.
 * - Her kartın canlılığı backend'den gelen `vibrance` değerine (0..100)
 *   göre değişir:
 *     ≥ 65          → tam renkli (vivid)
 *     45 – 64       → "semi" (yarı solgun)
 *     < 45          → "fade" (siyah-beyaz, neredeyse silik)
 *   Vibrance = bağlı alanların avg health + aktif projelerinin avg ilerleme.
 *   Görev tamamladıkça vision daha canlı, ihmal edince soluyor.
 * - Hover'da sağ üstte ✎ (düzenle) ve 🗑 (sil) butonları belirir.
 *
 * Hâlâ statik kalan: AFFIRMS (motto / söz pin'leri) ve MOOD swatch — pano
 * estetiğini doldurur. İleride bunlar da kullanıcı tarafından düzenlenebilir
 * hale gelecek.
 */
import { useMemo, useState } from "react";
import "@/styles/pages/vision-board.css";
import { VisionScene, type SceneName } from "@/components/VisionScenes";
import { NewVisionModal } from "@/components/NewVisionModal";
import { Modal } from "@/components/Modal";
import { Icon } from "@/utils/icons";
import { useVisions, useDeleteVision } from "@/hooks/useVisions";
import { useProjects } from "@/hooks/useProjects";
import type { VisionRead, ProjectRead } from "@/types/api";

// === Statik pano dekoru (motto + mood) =================================

const AFFIRMS = [
  {
    q: "Küçük adımlar, büyük hayaller.",
    by: "Günün hatırlatması",
    bg: "#BFEDE6",
  },
  {
    q: "Disiplin, hayalle gerçeğin köprüsü.",
    by: "Pano sözü",
    bg: "#FCE3A6",
  },
  {
    q: "Hayalin uzaklaşmasın diye bugün bir adım at.",
    by: "",
    bg: "#F6CBC2",
  },
];

const MOOD = {
  t: "2026 enerjim",
  d: "Sakin · odaklı · cesur",
  cols: ["#0BA99B", "#22BEB0", "#E0A82E", "#2E9E6B", "#15211F"],
};

// === Yardımcılar =======================================================

const SCENES: SceneName[] = ["city", "grid", "mountains", "plant", "waves", "sun"];
// Fallback motif emojiler (bağlı alan ikonu yoksa)
const MOTIFS = ["🌍", "🚀", "⛰️", "🌱", "🎹", "📚", "✨", "🌊", "🔭"];
const GRADIENTS = [
  "linear-gradient(165deg,#16243f,#3a4f7a 48%,#e8956b)",
  "linear-gradient(160deg,#06302d,#0BA99B 60%,#3ce0cc)",
  "linear-gradient(165deg,#2b2f57,#7a5a8f 50%,#f2a25c)",
  "linear-gradient(165deg,#0f3326,#2e7d5b 55%,#8fd4a6)",
  "linear-gradient(165deg,#1a2440,#3d5a8a 55%,#c9a0e0)",
  "linear-gradient(165deg,#3a2614,#9a6730 55%,#e6b87a)",
];
const HEIGHTS = [150, 130, 168, 140, 160, 130];
const ROTS = [-2.6, 1.8, -1.4, 2.3, -2, 1.3, -1.7, 2.5, -1.1, 1.9, -2.3];
const PIN_COLORS = ["#0BA99B", "#D2524A", "#E0A82E", "#2E9E6B", "#0E9C90"];

// Vision id'sinden deterministic bir tamsayı türet (kararlı görsel için)
function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// Vibrance → fade class (CSS'te .fade siyah-beyaz, .semi ara ton)
function fadeClass(v: number): "" | "semi" | "fade" {
  if (v >= 65) return "";
  if (v >= 45) return "semi";
  return "fade";
}

function vibranceColor(v: number): string {
  if (v >= 70) return "#2E9E6B";
  if (v >= 50) return "#C79221";
  if (v >= 30) return "#DC7E33";
  return "#D2524A";
}

function dateLabelTR(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// === Asılı eleman (raptiye / bant) =====================================

function Hanger({ idx }: { idx: number }) {
  if (idx % 3 === 2) {
    const tr = idx % 2 ? 5 : -5;
    return (
      <span
        className="tape"
        style={{ "--tr": `${tr}deg` } as React.CSSProperties}
      />
    );
  }
  const pc = PIN_COLORS[idx % PIN_COLORS.length];
  return (
    <span
      className="pushpin"
      style={{ "--pc": pc } as React.CSSProperties}
    />
  );
}

// === Vision pin ========================================================

interface VisionPinProps {
  vision: VisionRead;
  idx: number;
  onEdit: () => void;
  onDelete: () => void;
}

function VisionPin({ vision, idx, onEdit, onDelete }: VisionPinProps) {
  const h = hashId(vision.id);
  const scene = SCENES[h % SCENES.length];
  const grad = GRADIENTS[h % GRADIENTS.length];
  const height = HEIGHTS[h % HEIGHTS.length];
  const fc = fadeClass(vision.vibrance);
  const col = vibranceColor(vision.vibrance);
  const rot = ROTS[idx % ROTS.length];
  // Motif: bağlı ilk alanın iconu, yoksa hash'le seçilmiş varsayılan
  const motif =
    vision.areas.find((a) => a.icon)?.icon ?? MOTIFS[h % MOTIFS.length];

  return (
    <div
      className={`pin photo ${fc}`}
      style={{ "--rot": `${rot}deg` } as React.CSSProperties}
    >
      <Hanger idx={idx} />

      <div
        className="art"
        style={{
          height,
          background: vision.image_url ? undefined : grad,
          backgroundImage: vision.image_url
            ? `url(${vision.image_url})`
            : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {!vision.image_url && (
          <div className="scene-layer">
            <VisionScene name={scene} />
            <div className="grain" />
            <div className="sheen" />
          </div>
        )}

        {/* Sağ üst motif emoji (mockup'taki gibi) */}
        <span className="motif">{motif}</span>

        {fc && (
          <span className="fade-badge">
            <Icon name="info" size={11} strokeWidth={1.8} />
            {fc === "fade" ? "Soluyor" : "Dikkat"}
          </span>
        )}

        {/* Hover overlay: edit + delete */}
        <div className="pin-actions">
          <button
            type="button"
            className="pa-btn"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            title="Düzenle"
            aria-label="Düzenle"
          >
            <Icon name="edit" size={13} strokeWidth={1.9} />
          </button>
          <button
            type="button"
            className="pa-btn danger"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Sil"
            aria-label="Sil"
          >
            <Icon name="trash" size={13} strokeWidth={1.9} />
          </button>
        </div>
      </div>

      <div className="caption">
        <div className="cap-t">{vision.title}</div>
        {vision.description && (
          <div
            style={{
              fontSize: 11.5,
              color: "var(--ink-3)",
              marginTop: 3,
              lineHeight: 1.4,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {vision.description}
          </div>
        )}
        <div className="cap-f">
          <div className="avatars">
            {vision.areas.length === 0 ? (
              <span
                style={{
                  fontSize: 10.5,
                  color: "var(--ink-4)",
                  fontStyle: "italic",
                }}
              >
                alan bağlı değil
              </span>
            ) : (
              vision.areas.slice(0, 3).map((a) => (
                <span key={a.id} className="a" title={a.name}>
                  {a.icon ?? "🌿"}
                </span>
              ))
            )}
            {vision.areas.length > 3 && (
              <span
                className="a"
                style={{
                  background: "var(--surface-2)",
                  fontSize: 10,
                  color: "var(--ink-3)",
                }}
              >
                +{vision.areas.length - 3}
              </span>
            )}
          </div>
          <div className="avg" style={{ color: col }}>
            <span className="d" style={{ background: col }} />
            {vision.vibrance}
          </div>
        </div>

        {vision.projects.length > 0 && (
          <div
            style={{
              marginTop: 7,
              display: "flex",
              flexWrap: "wrap",
              gap: 4,
            }}
            title={vision.projects.map((p) => p.title).join(", ")}
          >
            {vision.projects.slice(0, 2).map((p) => (
              <span
                key={p.id}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                  fontSize: 10.5,
                  color: "var(--iris)",
                  background: "var(--i50)",
                  padding: "2px 6px",
                  borderRadius: 5,
                  fontWeight: 500,
                  maxWidth: 120,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                📁 {p.title}
              </span>
            ))}
            {vision.projects.length > 2 && (
              <span
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 10,
                  color: "var(--ink-4)",
                  alignSelf: "center",
                }}
              >
                +{vision.projects.length - 2}
              </span>
            )}
          </div>
        )}

        {vision.target_date && (
          <div
            style={{
              fontFamily: "var(--mono)",
              fontSize: 10.5,
              color: "var(--ink-4)",
              marginTop: 6,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Icon name="calendar" size={10} strokeWidth={1.8} />
            {dateLabelTR(vision.target_date)}
          </div>
        )}
      </div>
    </div>
  );
}

// === Affirm / Mood (sabit dekor) ======================================

function AffirmPin({ aff, idx }: { aff: (typeof AFFIRMS)[number]; idx: number }) {
  return (
    <div
      className="pin note"
      style={{ "--rot": `${ROTS[idx % ROTS.length]}deg` } as React.CSSProperties}
    >
      <Hanger idx={idx} />
      <div className="paper" style={{ background: aff.bg }}>
        <blockquote>{aff.q}</blockquote>
        {aff.by && <div className="by">{aff.by}</div>}
      </div>
    </div>
  );
}

function MoodPin({ idx }: { idx: number }) {
  return (
    <div
      className="pin"
      style={{ "--rot": `${ROTS[idx % ROTS.length]}deg` } as React.CSSProperties}
    >
      <Hanger idx={idx} />
      <div className="card-pin mood">
        <div className="swrow">
          {MOOD.cols.map((c, i) => (
            <i key={i} style={{ background: c }} />
          ))}
        </div>
        <div className="mt">{MOOD.t}</div>
        <div className="md">{MOOD.d}</div>
      </div>
    </div>
  );
}

// Progress pini — pano dekoru; gerçek aktif projenin ilerlemesini gösterir.
// Mockup'taki "İlerleme · Almanca · B2 yolunda" pini ile aynı estetik.
function ProgressPin({ project, idx }: { project: ProjectRead; idx: number }) {
  // 5 milestone'lu mini track: progress'e göre kaçı dolu
  const NODES = 5;
  const filled = Math.min(NODES, Math.round((project.progress / 100) * NODES));
  const nodes = Array.from({ length: NODES }, (_, i) => {
    if (i < filled - 1) return "done";
    if (i === filled - 1) return "now";
    return "";
  });
  return (
    <div
      className="pin"
      style={{ "--rot": `${ROTS[idx % ROTS.length]}deg` } as React.CSSProperties}
    >
      <Hanger idx={idx} />
      <div className="card-pin prog">
        <div className="pk">İlerleme ✦</div>
        <div className="pt">{project.title}</div>
        <div className="mini-track">
          {nodes.map((n, i) => (
            <span key={i} className={`mnode ${n}`} />
          ))}
        </div>
        <div className="pf">
          <span>
            {project.tasks_done}/{project.tasks_total} kilometre taşı
          </span>
          <b>%{project.progress}</b>
        </div>
      </div>
    </div>
  );
}

// === Layout: vision'lar ve aralara dekor ==============================

type SlotItem =
  | { kind: "vision"; vision: VisionRead }
  | { kind: "affirm"; aff: (typeof AFFIRMS)[number] }
  | { kind: "mood" }
  | { kind: "progress"; project: ProjectRead };

function buildLayout(
  visions: VisionRead[],
  progressProject: ProjectRead | null,
): SlotItem[] {
  const out: SlotItem[] = [];
  let progressInserted = false;
  visions.forEach((v, i) => {
    out.push({ kind: "vision", vision: v });
    // Vision'ların arasında ~3'de bir, sırayla affirm / progress / mood
    // dekoru gir — mockup'taki masonry dolulukla aynı.
    if ((i + 1) % 3 === 0 && i + 1 < visions.length) {
      const affIdx = Math.floor(i / 3) % AFFIRMS.length;
      out.push({ kind: "affirm", aff: AFFIRMS[affIdx] });
    }
    if (
      progressProject &&
      !progressInserted &&
      visions.length >= 2 &&
      i === Math.min(1, visions.length - 2)
    ) {
      out.push({ kind: "progress", project: progressProject });
      progressInserted = true;
    }
    if (visions.length >= 4 && i === Math.floor(visions.length / 2)) {
      out.push({ kind: "mood" });
    }
  });
  // Hâlâ progress yerleşmediyse sona ekle (kısa pano durumu)
  if (progressProject && !progressInserted) {
    out.push({ kind: "progress", project: progressProject });
  }
  return out;
}

// === Page ==============================================================

type FilterKey = "all" | "alive" | "fading" | "quotes";

export default function VisionBoardPage() {
  const { data, isLoading, isError } = useVisions();
  const visions = data?.items ?? [];
  const deleteVision = useDeleteVision();

  // ProgressPin için aktif projeler arasından en yüksek ilerlemeli olanı seç
  // (mockup'taki "Almanca · B2 yolunda %46" pinine karşılık gelir).
  const { data: projectsData } = useProjects({ limit: 100 });
  const progressProject = useMemo<ProjectRead | null>(() => {
    const active = (projectsData?.items ?? []).filter(
      (p) => p.status === "active",
    );
    if (active.length === 0) return null;
    return [...active].sort((a, b) => b.progress - a.progress)[0];
  }, [projectsData]);

  const [filter, setFilter] = useState<FilterKey>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<VisionRead | null>(null);
  const [deleting, setDeleting] = useState<VisionRead | null>(null);

  const filteredVisions = useMemo(() => {
    if (filter === "alive") return visions.filter((v) => v.vibrance >= 65);
    if (filter === "fading") return visions.filter((v) => v.vibrance < 45);
    if (filter === "quotes") return [];
    return visions;
  }, [visions, filter]);

  // Sözler modunda sadece AFFIRMS pin'leri (sayfa tasarımı korunsun diye)
  const slots = useMemo(() => {
    if (filter === "quotes") {
      return AFFIRMS.map(
        (aff) => ({ kind: "affirm" as const, aff }) satisfies SlotItem,
      );
    }
    return buildLayout(filteredVisions, progressProject);
  }, [filteredVisions, filter, progressProject]);

  const totalVisions = visions.length;
  const avgVibrance =
    totalVisions === 0
      ? 0
      : Math.round(
          visions.reduce((s, v) => s + v.vibrance, 0) / totalVisions,
        );
  const fadingCount = visions.filter((v) => v.vibrance < 45).length;
  const aliveCount = visions.filter((v) => v.vibrance >= 65).length;

  const confirmDelete = () => {
    if (!deleting) return;
    deleteVision.mutate(deleting.id, {
      onSuccess: () => setDeleting(null),
    });
  };

  return (
    <>
      {/* === Üst kapak === */}
      <div className="board-cover">
        <div className="grain" />
        <div>
          <div className="eyebrow">Hayal Panom · {new Date().getFullYear()}</div>
          <h1 className="vserif">Geleceğimi buraya asıyorum.</h1>
          <div className="cstats">
            <div className="s">
              <b className="tnum">{totalVisions}</b>
              <span>Hayal</span>
            </div>
            <div className="s">
              <b className="tnum">{avgVibrance}</b>
              <span>Ort. canlılık</span>
            </div>
            <div className="s">
              <b style={{ color: fadingCount > 0 ? "#FFD98B" : "#fff" }}>
                {fadingCount}
              </b>
              <span>Soluyor</span>
            </div>
          </div>
        </div>
        <button
          className="cover-add"
          type="button"
          title="Pin ekle"
          onClick={() => setCreateOpen(true)}
        >
          <Icon name="plus" size={16} strokeWidth={2.2} />
          <span style={{ marginLeft: 6 }}>Pin ekle</span>
        </button>
      </div>

      {/* === Filtreler === */}
      {totalVisions > 0 && (
        <div className="vbar">
          <div className="vchips">
            <button
              type="button"
              className={filter === "all" ? "on" : ""}
              onClick={() => setFilter("all")}
            >
              Tümü ({totalVisions})
            </button>
            <button
              type="button"
              className={filter === "alive" ? "on" : ""}
              onClick={() => setFilter("alive")}
            >
              Canlı ({aliveCount})
            </button>
            <button
              type="button"
              className={filter === "fading" ? "on" : ""}
              onClick={() => setFilter("fading")}
            >
              Soluyor ({fadingCount})
            </button>
            <button
              type="button"
              className={filter === "quotes" ? "on" : ""}
              onClick={() => setFilter("quotes")}
            >
              Sözler
            </button>
          </div>
          <div className="note" style={{ marginLeft: "auto" }}>
            <Icon name="info" size={12} strokeWidth={1.8} />
            Bir fotoğrafın üstüne gel — düzelir ve ne yapman gerektiğini söyler.
          </div>
        </div>
      )}

      {/* === Yükleme / hata / boş === */}
      {isLoading && (
        <div className="corkboard">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="pin photo"
              style={{ "--rot": `${ROTS[i]}deg` } as React.CSSProperties}
            >
              <div
                className="art"
                style={{ height: 150, background: "var(--surface-2)" }}
              />
              <div className="caption">
                <div
                  className="cap-t"
                  style={{
                    background: "var(--surface-2)",
                    width: "70%",
                    height: 14,
                    borderRadius: 4,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {isError && (
        <div className="state-block">
          <h2>Hayaller yüklenemedi.</h2>
          <p>Backend'e ulaşamıyoruz.</p>
        </div>
      )}

      {!isLoading && !isError && totalVisions === 0 && (
        <div className="state-block">
          <h2>Panon henüz boş.</h2>
          <p>
            İlk hayalini ekle — sağ üstteki <b>Pin ekle</b> butonu ile.
            Bağladığın alanlar ihmal edilirse hayalin solar, görev yaptıkça
            canlanır.
          </p>
        </div>
      )}

      {/* === Pano === */}
      {!isLoading && !isError && filteredVisions.length > 0 && (
        <div className="corkboard">
          {slots.map((slot, idx) => {
            if (slot.kind === "vision") {
              return (
                <VisionPin
                  key={slot.vision.id}
                  vision={slot.vision}
                  idx={idx}
                  onEdit={() => setEditing(slot.vision)}
                  onDelete={() => setDeleting(slot.vision)}
                />
              );
            }
            if (slot.kind === "affirm") {
              return (
                <AffirmPin
                  key={`aff-${idx}`}
                  aff={slot.aff}
                  idx={idx}
                />
              );
            }
            if (slot.kind === "progress") {
              return (
                <ProgressPin
                  key={`prog-${slot.project.id}`}
                  project={slot.project}
                  idx={idx}
                />
              );
            }
            return <MoodPin key={`mood-${idx}`} idx={idx} />;
          })}
        </div>
      )}

      {!isLoading &&
        !isError &&
        totalVisions > 0 &&
        filteredVisions.length === 0 && (
          <div
            style={{
              padding: 40,
              textAlign: "center",
              color: "var(--ink-3)",
              fontSize: 14,
              fontStyle: "italic",
            }}
          >
            {filter === "alive"
              ? "Canlı kategoride hayal yok — biraz görev yapsan canlanır."
              : "Soluyor kategoride hayal yok — şu an her şey yolunda."}
          </div>
        )}

      {/* Modallar */}
      <NewVisionModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
      <NewVisionModal
        open={!!editing}
        onClose={() => setEditing(null)}
        editing={editing}
      />

      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        icon="trash"
        title="Hayalı sil"
        footer={
          <>
            <button
              className="btn gho"
              type="button"
              onClick={() => setDeleting(null)}
            >
              İptal
            </button>
            <button
              className="btn pri"
              type="button"
              onClick={confirmDelete}
              disabled={deleteVision.isPending}
              style={{ background: "var(--h-crit)" }}
            >
              {deleteVision.isPending ? "Siliniyor…" : "Evet, sil"}
            </button>
          </>
        }
      >
        <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.5 }}>
          <b>{deleting?.title}</b> panodan kalkacak. Bağlı alanlara
          dokunulmaz — sadece bu hayal silinir. Bu işlem geri alınamaz.
        </p>
      </Modal>
    </>
  );
}
