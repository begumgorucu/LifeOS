/**
 * Areas grid kartı (tam tasarım versiyonu).
 *
 * designs/03-areas.html cardHTML() fonksiyonunun React karşılığı.
 * Hover'da alttan yukarı kayan quick actions barı çıkar:
 *   - Görev: hızlı task ekle (parent'tan callback)
 *   - Aktivite: skoru +5 (recompute-health endpoint'i)
 *   - Detay: area detayına git
 */
import { Link } from "react-router-dom";
import type { AreaRead } from "@/types/api";
import { RingScore } from "./RingScore";
import { Icon } from "@/utils/icons";
import { timeAgo } from "@/utils/format";

interface AreaCardProps {
  area: AreaRead;
  onAddTask?: (areaId: string) => void;
  onLogActivity?: (areaId: string) => void;
}

export function AreaCard({ area, onAddTask, onLogActivity }: AreaCardProps) {
  return (
    <div className={`acard ${area.is_neglected ? "neg" : ""}`}>
      {area.is_neglected && <span className="neg-pulse" />}

      <div className="topr">
        <div className="ac-ic">{area.icon ?? "🌿"}</div>
        <RingScore score={area.health_score} size={56} strokeWidth={6} showLabel labelText="Skor" />
      </div>

      <div className="ac-nm">{area.name}</div>
      <div className="ac-desc">{area.description ?? "Açıklama eklenmedi"}</div>

      <div className="ac-vis">
        {area.visions.length === 0 ? (
          <span style={{ fontSize: 11.5, color: "var(--ink-4)" }}>
            Hayal bağlı değil
          </span>
        ) : (
          area.visions.map((v) => (
            <span key={v.id} className="tag">
              <span className="sw" style={{ background: "var(--iris)" }} />
              {v.title}
            </span>
          ))
        )}
      </div>

      <div className="ac-foot">
        <span className="m">
          <Icon name="tasks" size={13} strokeWidth={1.8} />
          {area.tasks_count} görev
        </span>
        <span className="m">
          <Icon name="clock" size={13} strokeWidth={1.8} />
          {timeAgo(area.last_activity_at)}
        </span>
      </div>

      {/* Hover'da görünen quick actions barı */}
      <div className="qa">
        <button
          type="button"
          className="pri"
          onClick={(e) => {
            e.stopPropagation();
            onAddTask?.(area.id);
          }}
        >
          <Icon name="plus" size={14} strokeWidth={2} /> Görev
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onLogActivity?.(area.id);
          }}
        >
          <Icon name="check" size={14} strokeWidth={2} /> Aktivite
        </button>
        <Link to={`/areas/${area.id}`} onClick={(e) => e.stopPropagation()}>
          <button type="button">
            <Icon name="arrow" size={14} strokeWidth={2} /> Detay
          </button>
        </Link>
      </div>
    </div>
  );
}
