/**
 * Sağlık halkası — SVG dairesel progress.
 *
 * Tasarımcının lifeos.js'deki `ring()` helper'ı bu komponentin temeli.
 * `score` 0-100 arası, ekstra strokeWidth ve size prop'larıyla farklı
 * yerlerde (kart 56px, detay 96px) aynı bileşeni kullanabiliyoruz.
 */
import { healthInfo } from "@/utils/health";

interface RingScoreProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  labelText?: string;
}

export function RingScore({
  score,
  size = 56,
  strokeWidth = 6,
  showLabel = true,
  labelText = "Skor",
}: RingScoreProps) {
  const clamped = Math.max(0, Math.min(100, score));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - clamped / 100);
  const info = healthInfo(clamped);

  // Sayı boyutunu çevreye göre oranla — küçük halka, küçük sayı
  const numberSize = Math.round(size * 0.3);
  const labelSize = Math.max(8, Math.round(size * 0.11));

  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Arka plan track — sağlık tonunun yumuşak versiyonu */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={info.soft}
          strokeWidth={strokeWidth}
        />
        {/* Asıl ilerleme — saat 12'den başlasın diye -90° döndürdük */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={info.color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(.4,0,.2,1)" }}
        />
      </svg>
      <div className="rv">
        <b
          className="tnum"
          style={{
            fontSize: numberSize,
            fontWeight: 600,
            letterSpacing: "-0.02em",
            color: info.color,
            lineHeight: 1,
          }}
        >
          {Math.round(clamped)}
        </b>
        {showLabel && (
          <span
            style={{
              fontSize: labelSize,
              fontFamily: "var(--mono)",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              color: "var(--ink-3)",
              marginTop: 2,
            }}
          >
            {labelText}
          </span>
        )}
      </div>
    </div>
  );
}
