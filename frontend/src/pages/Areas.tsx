/**
 * Areas Listesi — tam tasarım uygulaması.
 *
 * Yapı (tepeden tabana):
 *   1. Başlık + "Yeni alan" butonu
 *   2. Denge Spektrumu (2+ alan varsa)
 *   3. Filter pills + Sort + View toggle (grid/list)
 *   4. Grid veya list view
 *
 * Filtre kategorileri (designs ile aynı):
 *   - Tümü
 *   - Sağlıklı   (score >= 70 ve ihmal değil)
 *   - Dikkat     (30-70 arası ve ihmal değil)
 *   - İhmal      (is_neglected true veya score < 30)
 */
import { useMemo, useState } from "react";
import "@/styles/pages/areas.css"; // designs/03-areas.html style bloğu
import { useAreas } from "@/hooks/useAreas";
import { AreaCard } from "@/components/AreaCard";
import { AreaListRow } from "@/components/AreaListRow";
import { BalanceSpectrum } from "@/components/BalanceSpectrum";
import { NewAreaModal } from "@/components/NewAreaModal";
import { NewTaskModal } from "@/components/NewTaskModal";
import { useLogActivity } from "@/hooks/useLogActivity";
import { Icon } from "@/utils/icons";
import type { AreaRead } from "@/types/api";

type FilterKey = "all" | "healthy" | "attention" | "neglected";
type SortKey = "score-desc" | "score-asc" | "recent" | "name";
type ViewMode = "grid" | "list";

const FILTER_FNS: Record<FilterKey, (a: AreaRead) => boolean> = {
  all: () => true,
  healthy: (a) => a.health_score >= 70 && !a.is_neglected,
  attention: (a) => a.health_score >= 30 && a.health_score < 70 && !a.is_neglected,
  neglected: (a) => a.is_neglected || a.health_score < 30,
};

const SORT_FNS: Record<SortKey, (a: AreaRead, b: AreaRead) => number> = {
  "score-desc": (a, b) => b.health_score - a.health_score,
  "score-asc": (a, b) => a.health_score - b.health_score,
  recent: (a, b) => {
    const at = a.last_activity_at ? new Date(a.last_activity_at).getTime() : 0;
    const bt = b.last_activity_at ? new Date(b.last_activity_at).getTime() : 0;
    return bt - at;
  },
  name: (a, b) => a.name.localeCompare(b.name, "tr"),
};

const SORT_LABEL: Record<SortKey, string> = {
  "score-desc": "Skora göre (yüksek)",
  "score-asc": "Skora göre (düşük)",
  recent: "Son aktivite",
  name: "İsme göre",
};

export default function AreasPage() {
  const { data, isLoading, isError, error, refetch } = useAreas({ limit: 50 });
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sort, setSort] = useState<SortKey>("score-desc");
  const [view, setView] = useState<ViewMode>("grid");
  const [createOpen, setCreateOpen] = useState(false);
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [newTaskAreaId, setNewTaskAreaId] = useState<string | undefined>();

  const areas = data?.items ?? [];

  // Quick action: kart üstündeki "Görev" → o area için NewTaskModal aç
  const handleAddTask = (areaId: string) => {
    setNewTaskAreaId(areaId);
    setNewTaskOpen(true);
  };

  // Filtre sayıları — pills üzerinde rozet olarak göster
  const counts = useMemo(() => {
    return {
      all: areas.length,
      healthy: areas.filter(FILTER_FNS.healthy).length,
      attention: areas.filter(FILTER_FNS.attention).length,
      neglected: areas.filter(FILTER_FNS.neglected).length,
    };
  }, [areas]);

  // Filtrele + sırala
  const visibleAreas = useMemo(() => {
    return [...areas].filter(FILTER_FNS[filter]).sort(SORT_FNS[sort]);
  }, [areas, filter, sort]);

  const avgScore =
    areas.length > 0
      ? Math.round(areas.reduce((s, a) => s + a.health_score, 0) / areas.length)
      : 0;
  const neglectedCount = counts.neglected;

  // "Aktivite" hızlı aksiyonu: o alana 1 task ekleyip hemen complete ederek
  // skoru +5 puan ve last_activity_at'i şimdi yapar. Toast ile bildirim.
  const logActivity = useLogActivity();
  const handleLogActivity = (areaId: string) => {
    const a = areas.find((x) => x.id === areaId);
    logActivity.mutate({ areaId, areaName: a?.name });
  };

  // -------- Loading --------
  if (isLoading) {
    return (
      <>
        <div className="page-head">
          <h1>Alanların</h1>
          <p>Yükleniyor…</p>
        </div>
        <div className="agrid">
          {[1, 2, 3].map((i) => (
            <div key={i} className="acard">
              <div className="skel" style={{ height: 56, marginBottom: 14 }} />
              <div className="skel" style={{ height: 18, marginBottom: 8, width: "60%" }} />
              <div className="skel" style={{ height: 13, width: "80%" }} />
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
        <h2>Alanlar yüklenemedi.</h2>
        <p>{(error as Error)?.message ?? "Sunucuya ulaşamıyoruz."}</p>
        <div className="state-actions">
          <button className="btn pri lg" onClick={() => refetch()}>
            Tekrar dene
          </button>
        </div>
      </div>
    );
  }

  // -------- Empty --------
  if (areas.length === 0) {
    return (
      <>
        <div className="areas-head">
          <div>
            <h1>Alanların</h1>
            <div className="sub">Henüz alan yok</div>
          </div>
          <button className="btn pri" onClick={() => setCreateOpen(true)}>
            <Icon name="plus" size={15} strokeWidth={2.2} />
            Yeni alan
          </button>
        </div>
        <div className="state-block">
          <h2>Henüz alanın yok.</h2>
          <p>
            Sağlık, Kariyer, Hayaller… Neyi düzenli takip etmek istersin? Bir
            alan ekleyerek başla.
          </p>
          <div className="state-actions">
            <button className="btn pri lg" onClick={() => setCreateOpen(true)}>
              Yeni alan oluştur
            </button>
          </div>
        </div>
        <NewAreaModal open={createOpen} onClose={() => setCreateOpen(false)} />
      </>
    );
  }

  // -------- Main --------
  return (
    <>
      {/* Başlık + CTA */}
      <div className="areas-head">
        <div>
          <h1>Alanların</h1>
          <div className="sub">
            {areas.length} alan · ortalama skor{" "}
            <b className="tnum" style={{ color: "var(--ink-2)" }}>
              {avgScore}
            </b>
            {neglectedCount > 0 && (
              <>
                {" · "}
                <span style={{ color: "var(--h-crit-d)" }}>
                  {neglectedCount} ihmal edilen
                </span>
              </>
            )}
          </div>
        </div>
        <button className="btn pri" onClick={() => setCreateOpen(true)}>
          <Icon name="plus" size={15} strokeWidth={2.2} />
          Yeni alan
        </button>
      </div>

      <BalanceSpectrum areas={areas} />

      {/* Toolbar */}
      <div className="toolbar">
        <div className="filter-pills">
          {(["all", "healthy", "attention", "neglected"] as FilterKey[]).map((key) => (
            <button
              key={key}
              type="button"
              className={filter === key ? "on" : ""}
              onClick={() => setFilter(key)}
            >
              {labelFor(key)} <span className="cnt">{counts[key]}</span>
            </button>
          ))}
        </div>
        <div className="spacer" />

        <label className="sortbox">
          <Icon name="filter" size={14} strokeWidth={2} />
          <span>Sırala:</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            style={{
              border: "none",
              background: "transparent",
              font: "inherit",
              color: "inherit",
              cursor: "pointer",
            }}
          >
            {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => (
              <option key={k} value={k}>
                {SORT_LABEL[k]}
              </option>
            ))}
          </select>
        </label>

        <div className="viewtoggle">
          <button
            type="button"
            className={view === "grid" ? "on" : ""}
            onClick={() => setView("grid")}
            title="Grid"
          >
            <Icon name="grid" size={17} strokeWidth={1.8} />
          </button>
          <button
            type="button"
            className={view === "list" ? "on" : ""}
            onClick={() => setView("list")}
            title="Liste"
          >
            <Icon name="list" size={17} strokeWidth={1.8} />
          </button>
        </div>
      </div>

      {/* Görüntü */}
      {visibleAreas.length === 0 ? (
        <p style={{ color: "var(--ink-3)", padding: 20, textAlign: "center" }}>
          Bu filtreye uyan alan yok.
        </p>
      ) : view === "grid" ? (
        <div className="agrid">
          {visibleAreas.map((area) => (
            <AreaCard
              key={area.id}
              area={area}
              onAddTask={handleAddTask}
              onLogActivity={handleLogActivity}
            />
          ))}
        </div>
      ) : (
        <div className="alist show">
          {visibleAreas.map((area) => (
            <AreaListRow key={area.id} area={area} />
          ))}
        </div>
      )}

      <NewAreaModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <NewTaskModal
        open={newTaskOpen}
        onClose={() => setNewTaskOpen(false)}
        defaultAreaId={newTaskAreaId}
      />
    </>
  );
}

function labelFor(key: FilterKey): string {
  return { all: "Tümü", healthy: "Sağlıklı", attention: "Dikkat", neglected: "İhmal" }[key];
}
