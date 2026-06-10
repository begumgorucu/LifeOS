/**
 * Dashboard — uygulamanın ana sayfası.
 *
 * designs/02-dashboard.html'in temel yapısı:
 *   - Karşılama (greet) + streak/level chip'leri
 *   - Hero: Yaşam dengesi özet + Daily Pool
 *   - Areas grid özeti (kompakt kartlar)
 *   - İhmal şeridi (gerekirse)
 *   - Bu hafta aktivite çubuğu
 *
 * Tüm veri React Query ile geliyor; her bölüm bağımsız loading durumunu
 * yönetir, böylece bir bölüm geç gelirse diğerleri beklemez.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import "@/styles/pages/dashboard.css"; // designs/02-dashboard.html style bloğunun birebir kopyası
import { useAreas } from "@/hooks/useAreas";
import { useMe } from "@/hooks/useMe";
import { useStatsSummary } from "@/hooks/useStats";
import { useLogActivity } from "@/hooks/useLogActivity";
import { AreaCard } from "@/components/AreaCard";
import { PoolPreview } from "@/components/PoolPreview";
import { NeglectStrip } from "@/components/NeglectStrip";
import { WeeklyChart } from "@/components/WeeklyChart";
import { RingScore } from "@/components/RingScore";
import { NewTaskModal } from "@/components/NewTaskModal";
import { Icon } from "@/utils/icons";

const TR_DATE = new Intl.DateTimeFormat("tr-TR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

function greeting(hour: number): string {
  if (hour < 6) return "İyi geceler";
  if (hour < 11) return "Günaydın";
  if (hour < 18) return "Tünaydın";
  return "İyi akşamlar";
}

export default function DashboardPage() {
  const { data: me } = useMe();
  const { data: areasData } = useAreas({ limit: 50 });
  const { data: summary } = useStatsSummary();
  const logActivity = useLogActivity();
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [newTaskAreaId, setNewTaskAreaId] = useState<string | undefined>();

  const areas = areasData?.items ?? [];

  // AreaCard quick action handler'ları — Areas sayfasındaki ile aynı.
  const handleAddTask = (areaId: string) => {
    setNewTaskAreaId(areaId);
    setNewTaskOpen(true);
  };
  const handleLogActivity = (areaId: string) => {
    const a = areas.find((x) => x.id === areaId);
    logActivity.mutate({ areaId, areaName: a?.name });
  };
  const today = new Date();
  const hour = today.getHours();
  const hello = greeting(hour);
  const dateStr = TR_DATE.format(today);
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  // Yaşam dengesi: tüm alanların ortalama skoru
  const balanceScore =
    areas.length > 0
      ? Math.round(areas.reduce((s, a) => s + a.health_score, 0) / areas.length)
      : 0;

  return (
    <>
      {/* Karşılama */}
      <div className="greet">
        <div>
          <h1>
            {hello}, {me?.name ?? "…"}.
          </h1>
          <div className="date">
            <b>{cap(dateStr)}</b> · Hayatın bugün dengede mi?
          </div>
        </div>
        <div className="hero-chips">
          {me && me.streak_count > 0 && (
            <Link
              to="/stats"
              className="hchip streak"
              style={{ textDecoration: "none", color: "inherit", cursor: "pointer" }}
              title="Streak istatistikleri"
            >
              <div className="lab">Streak</div>
              <div className="v">
                <span className="fl">🔥</span>
                <b className="tnum">{me.streak_count}</b>
                <span style={{ fontSize: 12, color: "var(--h-good-d)" }}>gün</span>
              </div>
            </Link>
          )}
          {me && (
            <Link
              to="/stats"
              className="hchip"
              style={{ textDecoration: "none", color: "inherit", cursor: "pointer" }}
              title="Seviye ilerlemesi"
            >
              <div className="lab">
                Seviye {me.level} · {me.level_name}
              </div>
              <div className="v">
                <b className="tnum">{me.xp.toLocaleString("tr-TR")}</b>
                <span style={{ fontSize: 12, color: "var(--ink-3)" }}>
                  /{(me.xp + me.xp_to_next_level).toLocaleString("tr-TR")}
                </span>
              </div>
              <div className="lvbar">
                <i
                  style={{
                    width: `${
                      me.xp_to_next_level === 0
                        ? 100
                        : Math.round((me.xp / (me.xp + me.xp_to_next_level)) * 100)
                    }%`,
                  }}
                />
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* Hero grid: balance + pool */}
      <div className="hero">
        <Link
          to="/stats"
          className="wheel-card"
          style={{ textDecoration: "none", color: "inherit", cursor: "pointer" }}
          title="İstatistikleri gör"
        >
          <div className="wc-head">
            <h2>Yaşam Dengesi</h2>
            <div className="bal">
              Denge skoru <b>{balanceScore}</b>/100
            </div>
          </div>
          <div
            className="wheel-wrap"
            style={{ padding: "20px 0", justifyContent: "center" }}
          >
            <RingScore
              score={balanceScore}
              size={140}
              strokeWidth={10}
              labelText="Denge"
            />
          </div>
          <div className="wleg">
            <span className="li">
              <span className="d" style={{ background: "var(--h-exc)" }} /> Mükemmel
            </span>
            <span className="li">
              <span className="d" style={{ background: "var(--h-good)" }} /> İyi
            </span>
            <span className="li">
              <span className="d" style={{ background: "var(--h-warn)" }} /> Uyarı
            </span>
            <span className="li">
              <span className="d" style={{ background: "var(--h-crit)" }} /> Kritik
            </span>
          </div>
        </Link>

        <div className="rstack">
          <PoolPreview />
          {summary && (
            <Link
              to="/stats"
              className="rail-card"
              style={{ textDecoration: "none", color: "inherit", cursor: "pointer" }}
              title="Tüm istatistikler"
            >
              <div className="rc-head">
                <div
                  className="ic"
                  style={{ background: "var(--h-exc-s)", color: "var(--h-exc)" }}
                >
                  <Icon name="check" size={16} strokeWidth={1.8} />
                </div>
                <h3>Bu ay</h3>
              </div>
              <div className="wk-stat" style={{ marginBottom: 8 }}>
                <b className="tnum">{summary.completed_this_month}</b>
                <span style={{ color: "var(--ink-3)", fontSize: 13 }}>tamamlanan</span>
              </div>
              <p style={{ fontSize: 13, color: "var(--ink-3)", margin: 0 }}>
                Tamamlama oranı <b>{Math.round(summary.completion_rate * 100)}%</b> · En aktif:{" "}
                {summary.most_active_area?.name ?? "—"}
              </p>
            </Link>
          )}
        </div>
      </div>

      {/* İhmal şeridi (gerekirse) */}
      {areas.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <NeglectStrip areas={areas} />
        </div>
      )}

      {/* Areas grid özeti */}
      {areas.length > 0 && (
        <>
          <div className="block-head" style={{ marginTop: 26 }}>
            <h2>Hayat alanların</h2>
            <Link className="link" to="/areas">
              Tümünü gör <Icon name="arrow" size={14} strokeWidth={2} />
            </Link>
          </div>
          <div className="areas-grid">
            {areas.slice(0, 4).map((a) => (
              <AreaCard
                key={a.id}
                area={a}
                onAddTask={handleAddTask}
                onLogActivity={handleLogActivity}
              />
            ))}
          </div>
        </>
      )}

      {/* Bu hafta aktivite + rozet özeti */}
      <div className="grid2">
        <WeeklyChart />
        {summary && (
          <Link
            to="/stats"
            className="rail-card"
            style={{ textDecoration: "none", color: "inherit", cursor: "pointer" }}
            title="Detaylı istatistikler"
          >
            <div className="rc-head">
              <div
                className="ic"
                style={{ background: "var(--gold-s)", color: "var(--gold)" }}
              >
                <Icon name="star" size={16} strokeWidth={1.8} />
              </div>
              <h3>Sayılar</h3>
            </div>
            <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
              <div>
                <div className="lab" style={{ fontSize: 11, color: "var(--ink-3)" }}>
                  Streak
                </div>
                <b className="tnum" style={{ fontSize: 22, color: "var(--gold)" }}>
                  🔥 {summary.current_streak}
                </b>
              </div>
              <div>
                <div className="lab" style={{ fontSize: 11, color: "var(--ink-3)" }}>
                  En uzun
                </div>
                <b className="tnum" style={{ fontSize: 22 }}>
                  {summary.longest_streak}
                </b>
              </div>
              <div>
                <div className="lab" style={{ fontSize: 11, color: "var(--ink-3)" }}>
                  Bu ay
                </div>
                <b className="tnum" style={{ fontSize: 22 }}>
                  {summary.completed_this_month}
                </b>
              </div>
            </div>
          </Link>
        )}
      </div>

      <NewTaskModal
        open={newTaskOpen}
        onClose={() => setNewTaskOpen(false)}
        defaultAreaId={newTaskAreaId}
      />
    </>
  );
}
