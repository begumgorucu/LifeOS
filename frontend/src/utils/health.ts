/**
 * Sağlık skoru rengini eşik kümesine göre döndürür.
 *
 * Eşikler backend `health_score.py` ile birebir:
 *   70+  → mükemmel (yeşil)
 *   50+  → iyi      (sarı)
 *   30+  → uyarı    (turuncu)
 *   <30  → kritik   (kırmızı)
 *
 * Renk değerleri designs/assets/lifeos.css'deki CSS variable'lardan değil;
 * inline SVG fill/stroke için hex olarak burada saklı. Token isimleri de
 * döndürülüyor — UI ihtiyaç duyarsa `var(--h-exc)` gibi kullanabilir.
 */

export type HealthTier = "exc" | "good" | "warn" | "crit";

export interface HealthInfo {
  tier: HealthTier;
  // Inline kullanım için hex
  color: string;
  // Soft / arka plan tonu
  soft: string;
  // Koyu varyant (etiket rengi olarak okunabilirlik için)
  dark: string;
  // Insanca etiketin Türkçesi
  label: string;
}

const TABLE: Record<HealthTier, HealthInfo> = {
  exc: { tier: "exc", color: "#2E9E6B", soft: "#E6F4ED", dark: "#1f6e49", label: "Mükemmel" },
  good: { tier: "good", color: "#C79221", soft: "#F8F0DC", dark: "#8a6512", label: "İyi" },
  warn: { tier: "warn", color: "#DC7E33", soft: "#FBEDDF", dark: "#9c5418", label: "Uyarı" },
  crit: { tier: "crit", color: "#D2524A", soft: "#FBE7E5", dark: "#9c352f", label: "Kritik" },
};

export function healthInfo(score: number): HealthInfo {
  if (score >= 70) return TABLE.exc;
  if (score >= 50) return TABLE.good;
  if (score >= 30) return TABLE.warn;
  return TABLE.crit;
}
