/**
 * Sağdan açılan bildirim paneli.
 *
 * designs/11-notifications.html'in basit React versiyonu. Backend'den
 * gerçek bildirimler gelir; tek tıkla okundu işaretlenir.
 */
import { useNotifications, useMarkAllRead, useMarkRead } from "@/hooks/useNotifications";
import { Icon } from "@/utils/icons";
import { timeAgo } from "@/utils/format";

interface Props {
  open: boolean;
  onClose: () => void;
}

const TYPE_ICON: Record<string, string> = {
  neglect_warning: "flame",
  streak_success: "flame",
  daily_reminder: "clock",
  dependency_unblocked: "link",
  achievement_unlocked: "star",
  score_critical: "info",
};

const TYPE_COLOR: Record<string, string> = {
  neglect_warning: "var(--h-crit-d)",
  streak_success: "var(--h-good-d)",
  daily_reminder: "var(--iris)",
  dependency_unblocked: "var(--iris)",
  achievement_unlocked: "var(--gold)",
  score_critical: "var(--h-crit-d)",
};

export function NotificationsPanel({ open, onClose }: Props) {
  const { data } = useNotifications(false);
  const markAll = useMarkAllRead();
  const markOne = useMarkRead();

  if (!open) return null;
  const items = data?.items ?? [];
  const unread = data?.unread_count ?? 0;

  return (
    <>
      {/* Karartı arka plan */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(20,15,35,.35)",
          zIndex: 200,
        }}
      />
      {/* Panel */}
      <aside
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(380px, 92vw)",
          background: "var(--surface)",
          borderLeft: "1px solid var(--line-2)",
          boxShadow: "var(--shadow-pop)",
          zIndex: 201,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 20px",
            borderBottom: "1px solid var(--line)",
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="bell" size={18} strokeWidth={1.8} /> Bildirimler
            {unread > 0 && (
              <span
                style={{
                  background: "var(--h-crit)",
                  color: "white",
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: 9,
                }}
              >
                {unread}
              </span>
            )}
          </h2>
          <div style={{ display: "flex", gap: 4 }}>
            {unread > 0 && (
              <button
                className="btn gho sm"
                onClick={() => markAll.mutate()}
                disabled={markAll.isPending}
              >
                Hepsi okundu
              </button>
            )}
            <button
              className="btn gho sm"
              onClick={onClose}
              style={{ padding: "6px 9px" }}
              title="Kapat"
            >
              <Icon name="x" size={16} strokeWidth={2} />
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
          {items.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "var(--ink-3)" }}>
              <Icon name="check" size={32} strokeWidth={1.5} />
              <p style={{ marginTop: 12, fontSize: 14 }}>Yeni bildirimin yok.</p>
            </div>
          ) : (
            items.map((n) => (
              <div
                key={n.id}
                onClick={() => !n.is_read && markOne.mutate(n.id)}
                style={{
                  display: "flex",
                  gap: 12,
                  padding: 12,
                  borderRadius: 10,
                  background: n.is_read ? "transparent" : "var(--i50)",
                  borderBottom: "1px solid var(--line)",
                  cursor: n.is_read ? "default" : "pointer",
                  transition: "background 0.15s",
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 9,
                    background: "var(--surface-2)",
                    color: TYPE_COLOR[n.notification_type] ?? "var(--ink-2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon
                    name={TYPE_ICON[n.notification_type] ?? "info"}
                    size={16}
                    strokeWidth={1.8}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ink)" }}>
                    {n.title}
                  </div>
                  {n.body && (
                    <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 3 }}>
                      {n.body}
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: "var(--ink-4)", marginTop: 5, fontFamily: "var(--mono)" }}>
                    {timeAgo(n.created_at)}
                  </div>
                </div>
                {!n.is_read && (
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "var(--iris)",
                      alignSelf: "center",
                    }}
                  />
                )}
              </div>
            ))
          )}
        </div>
      </aside>
    </>
  );
}
