/**
 * Dashboard'un üstündeki ihmal uyarı şeridi.
 *
 * En kritik ihmal edilen area'yı seç — score en düşük olan ve neglected
 * olan. Liste içinde bir tane bile yoksa null döner (şerit gizli).
 */
import { Link } from "react-router-dom";
import type { AreaRead } from "@/types/api";

interface Props {
  areas: AreaRead[];
}

export function NeglectStrip({ areas }: Props) {
  const worst = areas
    .filter((a) => a.is_neglected)
    .sort((a, b) => a.health_score - b.health_score)[0];

  if (!worst) return null;

  return (
    <div className="neg-strip">
      <span className="em">{worst.icon ?? "⚠️"}</span>
      <div className="ni">
        <div className="t">{worst.name} alanı ihmal ediliyor</div>
        <div className="d">
          Skor {worst.health_score} · küçük bir görevle hemen ayağa kaldır
        </div>
      </div>
      <Link to={`/areas/${worst.id}`}>Şimdi ilgilen</Link>
    </div>
  );
}
