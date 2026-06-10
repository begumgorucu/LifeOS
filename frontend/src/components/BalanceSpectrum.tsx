/**
 * Denge Spektrumu — Areas sayfasının imza bileşeni.
 *
 * Yatay gradient bant (kırmızı→turuncu→sarı→yeşil), her area kendi skoruna
 * göre x ekseninde konumlanır. Çakışmayı azaltmak için index'i tek/çift'e
 * göre y eksenini farklılaştırıyoruz (designs/03-areas.html'deki gibi).
 */
import type { AreaRead } from "@/types/api";
import { healthInfo } from "@/utils/health";

interface SpectrumProps {
  areas: AreaRead[];
}

export function BalanceSpectrum({ areas }: SpectrumProps) {
  if (areas.length < 2) return null;

  return (
    <div className="spectrum">
      <div className="spec-h">
        <h2>Denge Spektrumu</h2>
        <span className="sx">
          Her alan skoruna göre yerleşti — soldan sağa iyileşiyor
        </span>
      </div>
      <div
        className="spec-track"
        style={{
          background:
            "linear-gradient(90deg,#FBE7E5 0 30%,#FBEDDF 30% 50%,#F8F0DC 50% 70%,#E6F4ED 70% 100%)",
        }}
      >
        {areas.map((a, i) => {
          const info = healthInfo(a.health_score);
          const top = i % 2 === 0 ? 34 : 66;
          return (
            <div
              key={a.id}
              className="spec-chip"
              style={
                {
                  left: `${a.health_score}%`,
                  top: `${top}%`,
                  "--col": info.color,
                } as React.CSSProperties
              }
              title={`${a.name} · ${a.health_score}`}
            >
              <span className="tip">
                {a.name} · <b>{a.health_score}</b>
              </span>
              <div className="ci">{a.icon ?? "🌿"}</div>
            </div>
          );
        })}
      </div>
      <div className="spec-scale">
        <span>Kritik 0</span>
        <span>Uyarı 30</span>
        <span>İyi 50</span>
        <span>Mükemmel 70–100</span>
      </div>
    </div>
  );
}
