/**
 * "8 gün önce", "2 saat önce" gibi göreceli zaman etiketleri.
 *
 * Backend her zaman ISO 8601 + timezone gönderiyor. `Date(iso)` doğru
 * parse eder. Future tarihleri "az önce" gibi gösteriyoruz — pratik.
 */

export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffMin = Math.max(0, Math.floor((now - then) / 60000));

  if (diffMin < 1) return "az önce";
  if (diffMin < 60) return `${diffMin} dk önce`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} saat önce`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return "Dün";
  if (diffDay < 30) return `${diffDay} gün önce`;
  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return `${diffMonth} ay önce`;
  return `${Math.floor(diffMonth / 12)} yıl önce`;
}
