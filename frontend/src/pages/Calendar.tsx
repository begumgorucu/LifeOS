/**
 * Takvim — geniş haftalık görünüm (Notion tarzı).
 *
 * Layout:
 *   1) Üst: hafta numarası + tarih aralığı + ay nav (< Bugün >) + "Yeni" CTA
 *   2) 12 ay seçici şerit (yıl bazında, aktif ay vurgulu, görev var olan ay'lar dot'lu)
 *   3) 7 sütun: PZT..PAZ — her sütun bir gün
 *      - Sütun başlığı: DOW + gün rakamı (bugün teal pill içinde)
 *      - Sütun gövdesi: o günün TÜM görevleri kart kart (scroll'lu, gizleme yok)
 *      - Sütun hover'ında alt satırda "+ ekle" butonu belirir
 *      - Boş sütun: "+ ekle" placeholder
 *   4) Alt legend + klavye kısayolları
 *
 * Klavye:
 *   ← / →  : önceki / sonraki hafta
 *   T      : bu hafta
 *
 * Veri: tüm task'ler tek seferde çekilir (limit 100), client-side gruplanır.
 * Backend tarih filtresi kullanılmıyor (timezone bug'larını önlemek için).
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { tasksApi } from "@/api/endpoints";
import { NewTaskModal } from "@/components/NewTaskModal";
import { useCompleteTask, useReopenTask } from "@/hooks/useTasks";
import type { TaskRead } from "@/types/api";
import "@/styles/pages/calendar.css";

const DAY_LABELS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const MONTHS_SHORT = [
  "Oca", "Şub", "Mar", "Nis", "May", "Haz",
  "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara",
];
const MONTHS_LONG = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];
const PRIORITY_LABELS: Record<TaskRead["priority"], string> = {
  low: "Düşük",
  medium: "Orta",
  high: "Yüksek",
};

// === Yardımcılar ========================================================

// Verilen tarihten o haftanın Pazartesi'sini döner (saatler sıfırlı).
function getMonday(d: Date): Date {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // Pzt=0
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}

// 7 günlük dizi (Pzt..Paz)
function buildWeek(monday: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

// ISO 8601 hafta numarası (Pazartesi'den başlar, ilk Perşembe içeren hafta = 1)
function getISOWeek(date: Date): number {
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
}

function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// Hafta tarih aralığı metni: "8 – 14 Haziran" / "29 Haz – 5 Tem" / "29 Aralık – 4 Ocak"
function rangeLabel(week: Date[]): { range: string; year: number } {
  const start = week[0];
  const end = week[6];
  const yEnd = end.getFullYear();
  if (start.getMonth() === end.getMonth()) {
    return {
      range: `${start.getDate()} – ${end.getDate()} ${MONTHS_LONG[start.getMonth()]}`,
      year: yEnd,
    };
  }
  if (start.getFullYear() === end.getFullYear()) {
    return {
      range: `${start.getDate()} ${MONTHS_SHORT[start.getMonth()]} – ${end.getDate()} ${MONTHS_SHORT[end.getMonth()]}`,
      year: yEnd,
    };
  }
  return {
    range: `${start.getDate()} ${MONTHS_SHORT[start.getMonth()]} ${start.getFullYear()} – ${end.getDate()} ${MONTHS_SHORT[end.getMonth()]}`,
    year: yEnd,
  };
}

// === Component ==========================================================

export default function CalendarPage() {
  const today = useMemo(() => new Date(), []);
  const [monday, setMonday] = useState<Date>(() => getMonday(today));
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState<string | undefined>();
  // Ay şeridi için ayrı "viewYear" — hafta cursor yılından bağımsız
  // gezinmeyi mümkün kılar (ör. 2026'dayken 2028'e bakıp ay seç).
  const [viewYear, setViewYear] = useState<number>(() => today.getFullYear());
  const [yearPopOpen, setYearPopOpen] = useState(false);
  const yearPopRef = useRef<HTMLDivElement | null>(null);

  // Tüm task'ler — client-side grupla.
  const { data: tasksData, isLoading } = useQuery({
    queryKey: ["tasks", "all-for-calendar"],
    queryFn: () => tasksApi.list({ limit: 100 }),
  });
  const allTasks = tasksData?.items ?? [];

  // ISO YYYY-MM-DD -> Task[]
  const byDate = useMemo(() => {
    const map = new Map<string, TaskRead[]>();
    allTasks.forEach((t) => {
      if (!t.due_at) return;
      const key = t.due_at.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    });
    return map;
  }, [allTasks]);

  // Hangi aylarda görev var? (görüntülenen yıl için)
  const monthsWithTasks = useMemo(() => {
    const set = new Set<number>();
    allTasks.forEach((t) => {
      if (!t.due_at) return;
      if (t.due_at.slice(0, 4) === String(viewYear)) {
        set.add(parseInt(t.due_at.slice(5, 7), 10) - 1);
      }
    });
    return set;
  }, [allTasks, viewYear]);

  // Hangi yıllarda görev var? (yıl dropdown'unda dot için)
  const yearsWithTasks = useMemo(() => {
    const set = new Set<number>();
    allTasks.forEach((t) => {
      if (!t.due_at) return;
      set.add(parseInt(t.due_at.slice(0, 4), 10));
    });
    return set;
  }, [allTasks]);

  // Yıl dropdown'ında gösterilecek 12 yıl: bugünden 4 önce, 7 sonra.
  const yearOptions = useMemo(() => {
    const base = today.getFullYear() - 4;
    return Array.from({ length: 12 }, (_, i) => base + i);
  }, [today]);

  const week = useMemo(() => buildWeek(monday), [monday]);
  const weekNo = useMemo(() => getISOWeek(monday), [monday]);
  const { range, year } = rangeLabel(week);

  // Sütun başına özet metrikler
  const weekTotals = useMemo(() => {
    let tot = 0;
    let done = 0;
    week.forEach((d) => {
      const ts = byDate.get(isoDate(d)) ?? [];
      tot += ts.length;
      done += ts.filter((t) => t.status === "done").length;
    });
    return { tot, done };
  }, [week, byDate]);

  const complete = useCompleteTask();
  const reopen = useReopenTask();

  const shiftWeek = (deltaDays: number) => {
    const next = new Date(monday);
    next.setDate(next.getDate() + deltaDays);
    setMonday(next);
    // Hafta nav'ı yıl sınırını geçtiyse ay şeridini de o yıla taşı.
    if (next.getFullYear() !== viewYear) setViewYear(next.getFullYear());
  };
  const goPrevWeek = () => shiftWeek(-7);
  const goNextWeek = () => shiftWeek(7);
  const goThisWeek = () => {
    setMonday(getMonday(today));
    setViewYear(today.getFullYear());
  };

  const goMonth = (monthIdx: number) => {
    // viewYear'daki o ayın 1. gününü içeren haftanın Pazartesi'sine zıpla.
    const first = new Date(viewYear, monthIdx, 1);
    setMonday(getMonday(first));
  };

  const goYear = (y: number) => {
    setViewYear(y);
    setYearPopOpen(false);
  };
  const shiftYear = (delta: number) => setViewYear((y) => y + delta);

  const openAddForDay = (d: Date) => {
    setModalDate(isoDate(d));
    setModalOpen(true);
  };
  const openAddBlank = () => {
    setModalDate(isoDate(today));
    setModalOpen(true);
  };

  // Klavye nav
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (modalOpen) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
        return;
      }
      if (e.key === "Escape" && yearPopOpen) {
        setYearPopOpen(false);
        return;
      }
      if (e.key === "ArrowLeft") { e.preventDefault(); goPrevWeek(); }
      else if (e.key === "ArrowRight") { e.preventDefault(); goNextWeek(); }
      else if (e.key === "t" || e.key === "T") { goThisWeek(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monday, modalOpen, yearPopOpen]);

  // Yıl dropdown — dış tıklamada kapat
  useEffect(() => {
    if (!yearPopOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!yearPopRef.current) return;
      if (!yearPopRef.current.contains(e.target as Node)) {
        setYearPopOpen(false);
      }
    };
    // bir mikro gecikme — açan tıklama bunu hemen tetiklemesin
    const t = window.setTimeout(() => document.addEventListener("click", onClick), 0);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("click", onClick);
    };
  }, [yearPopOpen]);

  return (
    <div className="calw-page">
      {/* === Üst başlık === */}
      <div className="calw-head">
        <div className="left">
          <span className="wk">
            Hafta {weekNo} · {weekTotals.tot} görev · {weekTotals.done} tamamlandı
          </span>
          <span className="rng">
            {range} <span className="yr">{year}</span>
          </span>
        </div>
        <div className="right">
          <div className="calw-nav">
            <button type="button" onClick={goPrevWeek} title="Önceki hafta (←)">
              <ChevronLeft />
            </button>
            <button type="button" className="today" onClick={goThisWeek} title="Bugün (T)">
              Bugün
            </button>
            <button type="button" onClick={goNextWeek} title="Sonraki hafta (→)">
              <ChevronRight />
            </button>
          </div>
          <button type="button" className="calw-add" onClick={openAddBlank}>
            <Plus /> Yeni görev
          </button>
        </div>
      </div>

      {/* === Yıl + 12 ay seçici şerit === */}
      <div className="calw-mstrip" role="tablist" aria-label="Yıl ve ay seçici">
        {/* Yıl navigator */}
        <div className="calw-yr" ref={yearPopRef}>
          <button
            type="button"
            className="arr"
            onClick={() => shiftYear(-1)}
            title="Önceki yıl"
          >
            <ChevronLeft />
          </button>
          <button
            type="button"
            className={`yrnum ${yearPopOpen ? "open" : ""}`}
            onClick={() => setYearPopOpen((o) => !o)}
            title="Yıl seç"
          >
            {viewYear} <span className="caret">▾</span>
          </button>
          <button
            type="button"
            className="arr"
            onClick={() => shiftYear(1)}
            title="Sonraki yıl"
          >
            <ChevronRight />
          </button>

          {yearPopOpen && (
            <div className="calw-yr-pop" role="listbox" aria-label="Yıl seç">
              {yearOptions.map((y) => {
                const isCurrent = y === today.getFullYear();
                const isSelected = y === viewYear;
                const has = yearsWithTasks.has(y);
                return (
                  <button
                    key={y}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className={`${isSelected ? "on" : ""} ${isCurrent && !isSelected ? "now" : ""}`}
                    onClick={() => goYear(y)}
                    title={has ? `${y} — görevler var` : `${y}`}
                  >
                    {y}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="div" />

        {/* 12 ay */}
        {MONTHS_SHORT.map((m, i) => {
          const isActive =
            i === monday.getMonth() && viewYear === monday.getFullYear();
          const has = monthsWithTasks.has(i);
          return (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`mb ${isActive ? "on" : ""} ${has ? "has" : ""}`}
              onClick={() => goMonth(i)}
              title={`${MONTHS_LONG[i]} ${viewYear}`}
            >
              <span>{m}</span>
              <span className="dot" />
            </button>
          );
        })}
      </div>

      {/* === Hafta sütunları === */}
      <div className={`calw-cols ${isLoading ? "calw-skel" : ""}`}>
        {week.map((d, i) => {
          const isToday = isSameDay(d, today);
          const isWeekend = i >= 5;
          const iso = isoDate(d);
          const dayTasks = byDate.get(iso) ?? [];

          const classes = [
            "calw-col",
            isToday ? "today" : "",
            isWeekend ? "we" : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <div key={iso} className={classes}>
              <div className="calw-col-head">
                <span className="dow">{DAY_LABELS[i]}</span>
                <span className="num">{d.getDate()}</span>
              </div>

              <div className="calw-col-body">
                {dayTasks.length === 0 ? (
                  <div
                    className="calw-empty-cell"
                    onClick={() => openAddForDay(d)}
                    title="Tıkla, görev ekle"
                  >
                    <span className="plus">+</span>
                  </div>
                ) : (
                  <>
                    {dayTasks.map((t) => {
                      const done = t.status === "done";
                      return (
                        <div
                          key={t.id}
                          className={`calw-card ${done ? "done" : ""}`}
                          onClick={() =>
                            done ? reopen.mutate(t.id) : complete.mutate(t.id)
                          }
                          title={`${t.title}${
                            t.description ? `\n\n${t.description}` : ""
                          }`}
                        >
                          <span className={`bar ${t.priority}`} />
                          <div className="body">
                            <span className="ttl">{t.title}</span>
                            {t.description && (
                              <span className="desc">{t.description}</span>
                            )}
                            <div className="foot">
                              <span className={`pri ${t.priority}`}>
                                {PRIORITY_LABELS[t.priority]}
                              </span>
                              <span className="check">
                                {done && (
                                  <svg viewBox="0 0 12 12">
                                    <polyline points="2,6 5,9 10,3" />
                                  </svg>
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div
                      className="calw-add-row"
                      onClick={() => openAddForDay(d)}
                      title="Bu güne görev ekle"
                    >
                      <span className="plus">+</span> ekle
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* === Alt legend === */}
      <div className="calw-legend">
        <span className="item"><span className="sw low" /> Düşük</span>
        <span className="sep">·</span>
        <span className="item"><span className="sw medium" /> Orta</span>
        <span className="sep">·</span>
        <span className="item"><span className="sw high" /> Yüksek</span>
        <span className="sep">·</span>
        <span>
          <span className="kbd">←</span> <span className="kbd">→</span> hafta
        </span>
        <span className="sep">·</span>
        <span>
          <span className="kbd">T</span> bu hafta
        </span>
      </div>

      <NewTaskModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultDueAt={modalDate ? `${modalDate}T12:00:00Z` : undefined}
      />
    </div>
  );
}

// === İkonlar ============================================================

function ChevronLeft() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <polyline points="15,18 9,12 15,6" />
    </svg>
  );
}
function ChevronRight() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <polyline points="9,18 15,12 9,6" />
    </svg>
  );
}
function Plus() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
