/**
 * Üst bar — başlık + arama (placeholder) + hızlı ekle + bildirim zili.
 *
 * "Hızlı ekle" → NewTaskModal açar.
 * Bell → NotificationsPanel açar (sağdan kayan panel).
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { notificationsApi } from "@/api/endpoints";
import { Icon } from "@/utils/icons";
import { NewTaskModal } from "@/components/NewTaskModal";
import { NotificationsPanel } from "@/components/NotificationsPanel";

interface TopbarProps {
  title: string;
  crumb?: string;
}

export function Topbar({ title, crumb }: TopbarProps) {
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const { data: unread } = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: notificationsApi.unreadCount,
    refetchInterval: 30_000,
  });

  return (
    <>
      <header className="topbar">
        <div className="tb-title">
          {crumb && <span className="crumb">{crumb} / </span>}
          {title}
        </div>
        <div className="tb-spacer" />
        <div
          className="tb-search"
          role="button"
          aria-label="Arama (yakında)"
          onClick={() => setNewTaskOpen(true)}
          style={{ cursor: "pointer" }}
          title="Hızlı ekle (⌘K)"
        >
          <Icon name="search" size={17} strokeWidth={1.8} />
          <span>Ara veya ekle…</span>
          <span className="kbd">⌘K</span>
        </div>
        <button
          className="tb-add"
          type="button"
          onClick={() => setNewTaskOpen(true)}
        >
          <Icon name="plus" size={15} strokeWidth={2.2} />
          <span>Hızlı ekle</span>
        </button>
        <button
          className="tb-icon"
          type="button"
          title="Bildirimler"
          onClick={() => setNotifOpen(true)}
        >
          <Icon name="bell" size={18} strokeWidth={1.7} />
          {unread && unread.unread_count > 0 && (
            <span className="dot">{unread.unread_count}</span>
          )}
        </button>
      </header>

      <NewTaskModal open={newTaskOpen} onClose={() => setNewTaskOpen(false)} />
      <NotificationsPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
    </>
  );
}
