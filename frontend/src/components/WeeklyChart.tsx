/**
 * Dashboard'daki haftalık aktivite çubuğu.
 *
 * Backend `/stats/heatmap?weeks=1` çağrısı bu hafta için günlük task
 * count'larını veriyor. Eğer bir günün satırı yoksa 0 sayıyoruz.
 *
 * "Bugün" çubuğu iris rengine, diğerleri açık iris tonuna boyanır.
 */
import { useStatsHeatmap } from "@/hooks/useStats";

const DAY_LABELS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

function getThisWeekDates(): Date[] {
  // ISO haftası: Pazartesi günü 0. Bugün'den geriye N gün dön ve son 7 günü dön.
  const today = new Date();
  // Pazartesi'yi bul (Pazar = 0 ise Cumartesi haftasına dahil)
  const day = today.getDay(); // 0=Paz, 1=Pzt, ..., 6=Cmt
  const offsetToMon = (day + 6) % 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - offsetToMon);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function WeeklyChart() {
  const { data } = useStatsHeatmap(2); // son ~2 hafta yeter, biz 7 günü filtreliyoruz

  const weekDays = getThisWeekDates();
  const todayIso = isoDate(new Date());
  const countByDate = new Map<string, number>();
  data?.cells.forEach((c) => countByDate.set(c.date, c.tasks_completed));

  const counts = weekDays.map((d) => countByDate.get(isoDate(d)) ?? 0);
  const maxCount = Math.max(1, ...counts);
  const totalThisWeek = counts.reduce((s, c) => s + c, 0);

  return (
    <div className="rail-card">
      <div className="rc-head">
        <div className="ic" style={{ background: "var(--i50)", color: "var(--iris)" }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" strokeLinecap="round" />
          </svg>
        </div>
        <h3>Bu hafta</h3>
      </div>
      <div className="wk-stat">
        <b className="tnum">{totalThisWeek}</b>
        <span style={{ color: "var(--ink-3)", fontSize: 13 }}>tamamlanan görev</span>
      </div>
      <div className="wk-chart">
        {counts.map((c, i) => {
          const heightPct = Math.max(8, Math.round((c / maxCount) * 100));
          const isToday = isoDate(weekDays[i]) === todayIso;
          return (
            <div key={i} className={`wk-bar ${isToday ? "today" : ""}`}>
              <div className="bar" style={{ height: `${heightPct}%` }} />
              <span className="dl">{DAY_LABELS[i]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
