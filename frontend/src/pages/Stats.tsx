/**
 * Stats / İstatistikler sayfası (designs/09-stats.html).
 *
 * 4 ana metrik kartı + trend chart (multi-line SVG) + heatmap +
 * top performers + achievements grid.
 *
 * Tüm veri backend hook'larından geliyor; mock yok.
 */
import { useMemo, useState } from "react";
import "@/styles/pages/stats.css";
import { useStatsSummary, useStatsTrend, useStatsHeatmap } from "@/hooks/useStats";
import { useQuery } from "@tanstack/react-query";
import { statsApi } from "@/api/endpoints";
import { useAchievements } from "@/hooks/useAchievements";
import { Icon } from "@/utils/icons";
import { healthInfo } from "@/utils/health";

// Multi-line SVG chart — designs/09-stats.html multiLine() karşılığı
function MultiLineChart({
  series,
  width = 560,
  height = 170,
}: {
  series: { name: string; color: string; data: number[] }[];
  width?: number;
  height?: number;
}) {
  if (series.length === 0 || series.every((s) => s.data.length === 0)) {
    return (
      <p style={{ color: "var(--ink-4)", padding: 40, textAlign: "center" }}>
        Trend için yeterli veri yok.
      </p>
    );
  }
  const pad = 8;
  const cw = width - pad * 2;
  const ch = height - pad * 2;
  const yFor = (v: number) => pad + (1 - v / 100) * ch;

  return (
    <>
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        {/* Yatay grid çizgileri */}
        {[70, 50, 30].map((v) => (
          <line
            key={v}
            x1={pad}
            y1={yFor(v)}
            x2={width - pad}
            y2={yFor(v)}
            stroke="var(--line)"
            strokeWidth="1"
          />
        ))}
        {series.map((s) => {
          if (s.data.length < 2) return null;
          const pts: [number, number][] = s.data.map((v, i) => [
            pad + (i / (s.data.length - 1)) * cw,
            yFor(v),
          ]);
          const path = pts
            .map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
            .join(" ");
          const last = pts[pts.length - 1];
          return (
            <g key={s.name}>
              <path
                d={path}
                fill="none"
                stroke={s.color}
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx={last[0]} cy={last[1]} r="4" fill={s.color} stroke="#fff" strokeWidth="2" />
            </g>
          );
        })}
      </svg>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontFamily: "var(--mono)",
          fontSize: 10,
          color: "var(--ink-4)",
          marginTop: 6,
        }}
      >
        <span>Başlangıç</span>
        <span>Orta</span>
        <span>Bugün</span>
      </div>
    </>
  );
}

const SHADES = ["var(--surface-2)", "#CFF4EE", "#66D6C8", "#22BEB0", "#0BA99B"];

function shadeFor(count: number): string {
  if (count === 0) return SHADES[0];
  if (count <= 2) return SHADES[1];
  if (count <= 5) return SHADES[2];
  if (count <= 8) return SHADES[3];
  return SHADES[4];
}

export default function StatsPage() {
  const { data: summary } = useStatsSummary();
  const { data: trend } = useStatsTrend(30);
  const { data: heatmap } = useStatsHeatmap(16);
  const { data: topPerformers } = useQuery({
    queryKey: ["stats", "top-performers"],
    queryFn: () => statsApi.topPerformers(30, 3),
  });
  const { data: achievements } = useAchievements();
  const [period, setPeriod] = useState<"month" | "year" | "all">("month");

  const cards = useMemo(() => {
    if (!summary) return [];
    return [
      {
        ic: "check",
        bg: "var(--i50)",
        col: "var(--iris)",
        v: String(summary.completed_this_month),
        l: "Bu ay tamamlanan",
        d: "",
        up: true,
      },
      {
        ic: "flame",
        bg: "var(--gold-s)",
        col: "var(--gold)",
        v: String(summary.current_streak),
        l: "Güncel streak",
        d: `en uzun ${summary.longest_streak}`,
        up: true,
      },
      {
        ic: "stats",
        bg: "var(--h-exc-s)",
        col: "var(--h-exc)",
        v: `${Math.round(summary.completion_rate * 100)}%`,
        l: "Tamamlama oranı",
        d: "",
        up: true,
      },
      {
        ic: "areas",
        bg: "var(--h-warn-s)",
        col: "var(--h-warn)",
        v: summary.most_active_area?.name ?? "—",
        l: "En aktif alan",
        d: `${summary.most_active_area_completions} görev`,
        up: true,
      },
    ];
  }, [summary]);

  // Trend serileri — backend AreaTrendSeries[]'i grafiğe çevir
  const trendSeries = useMemo(() => {
    if (!trend) return [];
    return trend.series.slice(0, 4).map((s) => ({
      name: s.area.name,
      color: healthInfo(s.area.health_score).color,
      data: s.data_points.map((p) => p.health_score),
    }));
  }, [trend]);

  // Heatmap matrisi — 16 hafta x 7 gün grid
  const heatMatrix = useMemo(() => {
    if (!heatmap) return null;
    const countByDate = new Map<string, number>();
    heatmap.cells.forEach((c) => countByDate.set(c.date, c.tasks_completed));
    const today = new Date();
    const totalDays = heatmap.weeks * 7;
    const days: { date: string; count: number }[] = [];
    for (let i = totalDays - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      days.push({ date: iso, count: countByDate.get(iso) ?? 0 });
    }
    // 7 günlük kolonlara böl
    const cols: { date: string; count: number }[][] = [];
    for (let w = 0; w < heatmap.weeks; w++) {
      cols.push(days.slice(w * 7, w * 7 + 7));
    }
    return cols;
  }, [heatmap]);

  return (
    <>
      <div className="shead">
        <div>
          <h1>İstatistikler</h1>
          <div className="sub">İlerlemenin tam resmi</div>
        </div>
        <div className="period-seg">
          <button
            type="button"
            className={period === "month" ? "on" : ""}
            onClick={() => setPeriod("month")}
          >
            Ay
          </button>
          <button
            type="button"
            className={period === "year" ? "on" : ""}
            onClick={() => setPeriod("year")}
          >
            Yıl
          </button>
          <button
            type="button"
            className={period === "all" ? "on" : ""}
            onClick={() => setPeriod("all")}
          >
            Tümü
          </button>
        </div>
      </div>

      {/* 4 metric card */}
      <div className="stat-cards">
        {cards.map((c, i) => (
          <div key={i} className="scard">
            <div className="ic" style={{ background: c.bg, color: c.col }}>
              <Icon name={c.ic} size={18} strokeWidth={1.8} />
            </div>
            <div className="v tnum">{c.v}</div>
            <div className="l">{c.l}</div>
            {c.d && (
              <span className={`delta ${c.up ? "up" : "down"}`}>
                {c.up ? "↑" : "↓"} {c.d}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Grid: trend + heatmap | top performers + achievements */}
      <div className="stat-grid">
        <div>
          <div className="panel">
            <div className="panel-h">
              <h3>Alan skorları · 30 gün</h3>
              <div className="legend">
                {trendSeries.map((s) => (
                  <span key={s.name} className="lg">
                    <span className="ln" style={{ background: s.color }} />
                    {s.name}
                  </span>
                ))}
              </div>
            </div>
            <MultiLineChart series={trendSeries} />
          </div>

          <div className="panel">
            <div className="panel-h">
              <h3>Aktivite haritası</h3>
              <span className="muted" style={{ fontSize: 12.5 }}>
                Son 16 hafta
              </span>
            </div>
            <div className="heat">
              {heatMatrix?.map((col, ci) => (
                <div key={ci} className="heat-col">
                  {col.map((d, di) => (
                    <div
                      key={di}
                      className="heat-cell"
                      style={{ background: shadeFor(d.count) }}
                      title={`${d.date} · ${d.count} görev`}
                    />
                  ))}
                </div>
              ))}
            </div>
            <div className="heat-foot">
              Az
              <div className="scale">
                {SHADES.map((s, i) => (
                  <i key={i} style={{ background: s }} />
                ))}
              </div>
              Çok
            </div>
          </div>
        </div>

        <div>
          <div className="panel">
            <div className="panel-h">
              <h3>En çok ilerleyen</h3>
            </div>
            {(topPerformers?.items ?? []).map((p, i) => (
              <div key={p.area.id} className="perf">
                <span className="rank">{i + 1}</span>
                <div className="pic">{p.area.icon ?? "🌿"}</div>
                <div className="pn">
                  <div className="t">{p.area.name}</div>
                  <div className="d">
                    {p.area.health_score} skor · {p.tasks_completed} görev
                  </div>
                </div>
                <span className="chg">
                  <Icon name="arrow" size={13} strokeWidth={2} /> +{p.delta}
                </span>
              </div>
            ))}
            {(!topPerformers || topPerformers.items.length === 0) && (
              <p style={{ color: "var(--ink-4)", padding: 20, textAlign: "center" }}>
                Henüz veri yok.
              </p>
            )}
          </div>

          <div className="panel">
            <div className="panel-h">
              <h3>Rozetler</h3>
              <span className="muted" style={{ fontSize: 12.5 }}>
                {achievements?.unlocked_count ?? 0}/{achievements?.total ?? 0}
              </span>
            </div>
            <div className="ach-grid">
              {(achievements?.items ?? []).map((a) => (
                <div key={a.key} className={`ach-c ${a.unlocked ? "" : "locked"}`}>
                  <div className={`medal ${a.unlocked ? "on" : "off"}`}>
                    {a.unlocked ? <Icon name={a.icon} size={20} strokeWidth={1.8} /> : "🔒"}
                  </div>
                  <div className="an">{a.name}</div>
                  <div className="ad">
                    {a.unlocked ? "Kazanıldı" : `${a.progress}/${a.target}`}
                  </div>
                  {!a.unlocked && (
                    <div className="miniprog">
                      <i style={{ width: `${Math.round((a.progress / a.target) * 100)}%` }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
