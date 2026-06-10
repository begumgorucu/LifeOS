/**
 * Daily Pool — yörünge ritüeli (designs/07-daily-pool.html birebir taklit).
 *
 * Stage 820×600 koordinat sisteminde:
 *   - Çekirdek: (CX, CY) = (410, 290), yarıçap CORE_R = 86
 *   - Satellite yörüngesi: R = 228 (çekirdek merkezinden kart merkezine)
 *   - i. satellite açısı: -90° + i × (360°/n) — saat 12'den başlar
 *   - Connectors: çekirdek edge'inden satellite başlangıcına kesik çizgi
 *
 * Approved item için connector teal + tam çizgi + ucunda nokta; skipped için
 * soluk gri; default için kesik çizgi.
 */
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "@/styles/pages/daily-pool.css";
import {
  useApprovePoolItem,
  useDailyPool,
  useGeneratePool,
  useSkipPoolItem,
} from "@/hooks/useDailyPool";
import { useCompleteTask, useCreateTask } from "@/hooks/useTasks";
import { useAreas } from "@/hooks/useAreas";
import { Icon } from "@/utils/icons";
import type { DailyPoolItemRead, PoolReason } from "@/types/api";

const STAGE_W = 820;
const STAGE_H = 600;
const CX = 410;
const CY = 290;
// Yörünge yarıçapı 228 → 195: az item olduğunda (örn n=2: saat 12 ve 6)
// satellite kartları stage sınırlarını aşıp intro/footer'a değiyordu.
// 195 ile en uç satellite y = CY±R = 95 ve 485, kart half-height ~95
// dahil edildiğinde stage içinde rahat sığar.
const R = 195;
const CORE_R = 86;

const REASON_LABEL: Record<PoolReason, string> = {
  neglected: "İhmal ediliyor",
  deadline: "Bugün deadline",
  streak: "Streak'i koru",
  dependency_ready: "Artık başlayabilir",
  flow: "Akıştasın",
};

// Designs/lifeos.css'te tanımlı `.reason` modifier sınıfları
const REASON_CLASS: Record<PoolReason, string> = {
  neglected: "reason-crit",
  deadline: "reason-due",
  streak: "reason-streak",
  dependency_ready: "reason-due",
  flow: "reason-low",
};

const REASON_ICON: Record<PoolReason, string> = {
  neglected: "flame",
  deadline: "clock",
  streak: "flame",
  dependency_ready: "link",
  flow: "info",
};

// i. satellite'in açısı ve (x, y) konumu (stage koordinatlarında)
function satellitePos(i: number, n: number): { x: number; y: number; ang: number } {
  const ang = ((-90 + i * (360 / n)) * Math.PI) / 180;
  return { x: CX + R * Math.cos(ang), y: CY + R * Math.sin(ang), ang };
}

// Connector başlangıç (çekirdek edge) ve bitiş (satellite içine girer) noktaları
function connectorEnds(ang: number) {
  return {
    x1: CX + CORE_R * Math.cos(ang),
    y1: CY + CORE_R * Math.sin(ang),
    x2: CX + (R - 58) * Math.cos(ang),
    y2: CY + (R - 58) * Math.sin(ang),
  };
}

interface SatelliteProps {
  item: DailyPoolItemRead;
  pos: { x: number; y: number };
  onApprove: () => void;
  onSkip: () => void;
}

function Satellite({ item, pos, onApprove, onSkip }: SatelliteProps) {
  const cls = `sat ${item.approved ? "approved" : ""} ${item.skipped ? "skipped" : ""}`;
  return (
    <div
      className={cls}
      style={{ left: pos.x, top: pos.y }}
      data-id={item.id}
    >
      <div className="card">
        <div className="stop">
          <span className="achip">
            <span>{item.task.area.icon ?? "🌿"}</span>
            {item.task.area.name}
          </span>
          {/* "mins" alanı backend'de yok — yer tutucu */}
          <span className="mins">·</span>
        </div>
        <div className="task">{item.task.title}</div>
        <div className={`reason ${REASON_CLASS[item.reason]}`}>
          <Icon name={REASON_ICON[item.reason]} size={11} strokeWidth={1.8} />
          {REASON_LABEL[item.reason]}
        </div>
        <div className="sact">
          <button
            type="button"
            className="sbtn ok"
            onClick={onApprove}
            title="Onayla"
          >
            <Icon name="check" size={13} strokeWidth={2} />
            {item.approved ? "Onaylandı" : "Onayla"}
          </button>
          <button
            type="button"
            className="sbtn sk"
            onClick={onSkip}
            title="Yarına ertele"
          >
            <Icon name="skip" size={13} strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DailyPoolPage() {
  const nav = useNavigate();
  const { data, isLoading } = useDailyPool();
  const generate = useGeneratePool();
  const approve = useApprovePoolItem();
  const skip = useSkipPoolItem();
  const complete = useCompleteTask();
  const createTask = useCreateTask();
  const { data: areasData } = useAreas({ limit: 50 });
  const [customTaskText, setCustomTaskText] = useState("");

  const items = data?.items ?? [];
  const n = items.length;
  const approvedCount = items.filter((i) => i.approved).length;

  // "Kendi görevini ekle" inputu — Enter ile ilk alan altına yeni task ekler.
  const submitCustomTask = () => {
    const trimmed = customTaskText.trim();
    const targetAreaId = areasData?.items[0]?.id;
    if (!trimmed || !targetAreaId) return;
    createTask.mutate(
      { title: trimmed, area_id: targetAreaId, priority: "medium" },
      { onSuccess: () => setCustomTaskText("") },
    );
  };

  // Stage'i hem genişliğe hem de yüksekliğe sığdır.
  //   reservedV = topbar(60) + content top padding(30) + intro(~120) + footer(~190)
  //   Minimum scale 0.78 → satellite'ler okunaklı kalır.
  //   transformOrigin top center + marginBottom negatif: stage yukarıda kalır,
  //   alttaki ölü alanı footer geri kazanır → scrolla gerek olmaz.
  const stageRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const fit = () => {
      const parent = stage.parentElement;
      if (!parent) return;
      const availW = parent.clientWidth;
      const reservedV = 60 + 30 + 120 + 190;
      const availH = Math.max(360, window.innerHeight - reservedV);
      const scaleW = availW / 824;
      const scaleH = availH / 600;
      const scale = Math.max(0.78, Math.min(1, Math.min(scaleW, scaleH)));
      stage.style.transform = `scale(${scale})`;
      stage.style.transformOrigin = "top center";
      stage.style.marginBottom = `${-600 * (1 - scale)}px`;
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [n]);

  const C = 2 * Math.PI * 84;
  const coreOffset = n > 0 ? C * (1 - approvedCount / n) : C;

  const handleStartDay = async () => {
    if (approvedCount === 0) return;
    const toComplete = items.filter((it) => it.approved && it.task.status !== "done");
    await Promise.all(toComplete.map((it) => complete.mutateAsync(it.task.id)));
    nav("/");
  };

  const summary = {
    minutes: 0,
    areas: new Set(items.map((it) => it.task.area_id)).size,
    points: items.reduce((s, it) => {
      const p = it.task.priority;
      return s + (p === "high" ? 100 : p === "medium" ? 50 : 20);
    }, 0),
  };

  // --- Loading -----------------------------------------------------------
  if (isLoading) {
    return (
      <div className="ritual">
        <div className="intro">
          <div className="kick">Sabah ritüeli</div>
          <h1>Yükleniyor…</h1>
        </div>
      </div>
    );
  }

  // --- Boş ----------------------------------------------------------------
  if (items.length === 0) {
    return (
      <div className="ritual">
        <div className="intro">
          <div className="kick">Sabah ritüeli</div>
          <h1>Bugün için öneriler hazır değil</h1>
          <p>
            Akıllı motor 5 görev önerisi hazırlayabilir: ihmal edilen alanlar,
            yaklaşan tarihler ve streak'in için kolay bir kazanım.
          </p>
        </div>
        <div style={{ textAlign: "center", padding: "20px 0 40px" }}>
          <button
            className="btn pri lg"
            onClick={() => generate.mutate(false)}
            disabled={generate.isPending}
          >
            {generate.isPending ? "Hazırlanıyor…" : "Önerileri oluştur"}
          </button>
        </div>
      </div>
    );
  }

  // --- Ana hal: yörünge ---------------------------------------------------
  const todayStr = new Intl.DateTimeFormat("tr-TR", { weekday: "long" })
    .format(new Date())
    .toUpperCase();

  return (
    <div className="ritual">
      <div className="intro">
        <div className="kick">Sabah ritüeli · {todayStr}</div>
        <h1>Bugün için {n} görev hazırladım</h1>
        <p>Çekirdeğin etrafındaki görevleri onayla, sonra ortadan günü başlat.</p>
      </div>

      <div className="stage" id="stage" ref={stageRef}>
        <div className="orbit-ring" />

        <svg className="orbit-svg" viewBox={`0 0 ${STAGE_W} ${STAGE_H}`} preserveAspectRatio="none">
          {items.map((it, i) => {
            const { ang } = satellitePos(i, n);
            const { x1, y1, x2, y2 } = connectorEnds(ang);
            const col = it.approved
              ? "var(--iris)"
              : it.skipped
                ? "var(--line-2)"
                : "var(--line-3)";
            return (
              <g key={it.id}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={col}
                  strokeWidth={it.approved ? 2.5 : 1.5}
                  strokeLinecap="round"
                  strokeDasharray={it.approved ? undefined : "2 6"}
                />
                {it.approved && <circle cx={x2} cy={y2} r="3.5" fill="var(--iris)" />}
              </g>
            );
          })}
        </svg>

        <button
          className="core"
          type="button"
          onClick={handleStartDay}
          disabled={approvedCount === 0}
        >
          <svg className="ring-svg" width="188" height="188" viewBox="0 0 188 188">
            {/* Background track: gri yerine teal-200 (logo yeşilinin açık tonu)
                — designs'taki var(--surface-2) çok soluk kalıyordu. */}
            <circle cx="94" cy="94" r="84" fill="none" stroke="var(--i200)" strokeWidth="5" />
            <circle
              cx="94"
              cy="94"
              r="84"
              fill="none"
              stroke="var(--iris)"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={coreOffset}
              transform="rotate(-90 94 94)"
            />
          </svg>
          <div className="orb">
            <div className="play">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 5l12 7-12 7z" />
              </svg>
            </div>
            <div className="ct">Günü başlat</div>
            <div className="cc">
              {approvedCount}/{n} hazır
            </div>
          </div>
        </button>

        {items.map((it, i) => {
          const p = satellitePos(i, n);
          return (
            <Satellite
              key={it.id}
              item={it}
              pos={{ x: p.x, y: p.y }}
              onApprove={() => approve.mutate(it.id)}
              onSkip={() => skip.mutate(it.id)}
            />
          );
        })}
      </div>

      <div className="ritual-foot">
        <div className="pool-summary">
          <div className="ps-item">
            <div className="v tnum">
              {summary.minutes > 0 ? summary.minutes : "—"}
              {summary.minutes > 0 && <span style={{ fontSize: 12 }}>dk</span>}
            </div>
            <div className="l">Tahmini süre</div>
          </div>
          <div className="ps-item">
            <div className="v tnum">{summary.areas}</div>
            <div className="l">Alan</div>
          </div>
          <div className="ps-item">
            <div className="v" style={{ color: "var(--gold)" }}>
              +{summary.points}
            </div>
            <div className="l">Olası puan</div>
          </div>
        </div>

        <div className="pool-add" onClick={(e) => e.currentTarget.querySelector("input")?.focus()}>
          <Icon name="plus" size={14} strokeWidth={2} />
          <input
            placeholder="Kendi görevini ekle…"
            value={customTaskText}
            onChange={(e) => setCustomTaskText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitCustomTask();
            }}
          />
          <span className="mins" style={{ fontFamily: "var(--mono)", color: "var(--ink-4)" }}>
            ⏎
          </span>
        </div>

        <div style={{ textAlign: "center", marginTop: 10 }}>
          <button
            type="button"
            className="btn gho sm"
            onClick={() => generate.mutate(true)}
            disabled={generate.isPending}
          >
            <Icon name="refresh" size={13} strokeWidth={1.8} /> Önerileri yenile
          </button>
        </div>
      </div>
    </div>
  );
}
