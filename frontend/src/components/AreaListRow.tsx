/**
 * Areas liste görünümü satırı.
 *
 * designs/03-areas.html rowHTML() fonksiyonunun React karşılığı.
 */
import { Link } from "react-router-dom";
import type { AreaRead } from "@/types/api";
import { RingScore } from "./RingScore";
import { timeAgo } from "@/utils/format";

interface AreaListRowProps {
  area: AreaRead;
}

export function AreaListRow({ area }: AreaListRowProps) {
  return (
    <Link to={`/areas/${area.id}`} className="lrow">
      <div className="ic">{area.icon ?? "🌿"}</div>
      <div className="nmwrap">
        <div className="n">{area.name}</div>
        <div className="d">{area.description ?? "—"}</div>
      </div>
      <div className="visc">
        {area.visions.length === 0 ? (
          <span style={{ fontSize: 11.5, color: "var(--ink-4)" }}>—</span>
        ) : (
          area.visions.map((v) => (
            <span key={v.id} className="tag">
              <span className="sw" style={{ background: "var(--iris)" }} />
              {v.title}
            </span>
          ))
        )}
      </div>
      <div className="meta">
        <span>{area.tasks_count} görev</span>
        <span className="tnum">{timeAgo(area.last_activity_at)}</span>
        <RingScore score={area.health_score} size={40} strokeWidth={5} showLabel={false} />
      </div>
    </Link>
  );
}
