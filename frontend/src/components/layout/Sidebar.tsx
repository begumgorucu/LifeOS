/**
 * Sol kenar navigasyonu.
 *
 * `react-router-dom`'un `NavLink`'i aktif sayfaya otomatik `.active` CSS
 * class'ı koyar — designs'taki `.nav-item.active` stilini bedavaya alıyoruz.
 *
 * Streak chip + profile alt kısmı `/me` endpoint'inden çekilen `UserRead`
 * verisini kullanır. Veri henüz yüklenmediyse (placeholder) iskelet gösterir.
 */
import { Link, NavLink } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { meApi } from "@/api/endpoints";
import { Icon, type IconName } from "@/utils/icons";

interface NavItem {
  to: string;
  icon: IconName;
  label: string;
}

const NAV: NavItem[] = [
  { to: "/", icon: "dashboard", label: "Dashboard" },
  { to: "/areas", icon: "areas", label: "Areas" },
  { to: "/projects", icon: "projects", label: "Projects" },
  { to: "/tasks", icon: "tasks", label: "Tasks" },
  { to: "/calendar", icon: "calendar", label: "Takvim" },
  { to: "/pool", icon: "pool", label: "Daily Pool" },
  { to: "/visions", icon: "vision", label: "Vision Board" },
  { to: "/stats", icon: "stats", label: "Stats" },
];

export function Sidebar() {
  const { data: me } = useQuery({ queryKey: ["me"], queryFn: meApi.get });

  return (
    <aside className="sidebar">
      {/* Marka */}
      <div className="sb-brand">
        <div className="sb-logo">L</div>
        <div className="sb-name">
          Life<span>OS</span>
        </div>
      </div>

      {/* Navigasyon */}
      <nav className="sb-nav">
        <div className="sb-sec">Çalışma alanı</div>
        {NAV.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === "/"} className="nav-item">
            <span className="ic">
              <Icon name={item.icon} size={18} strokeWidth={1.7} />
            </span>
            <span>{item.label}</span>
          </NavLink>
        ))}

        <div className="sb-sec">Hesap</div>
        <NavLink to="/settings" className="nav-item">
          <span className="ic">
            <Icon name="settings" size={18} strokeWidth={1.7} />
          </span>
          <span>Settings</span>
        </NavLink>
      </nav>

      {/* Alt: streak + profil. Streak istatistiklere, profil ayarlara gider. */}
      <div className="sb-foot">
        {me && me.streak_count > 0 && (
          <Link
            to="/stats"
            className="sb-streak"
            style={{ textDecoration: "none", cursor: "pointer" }}
            title="İstatistikleri gör"
          >
            <span className="fl">🔥</span>
            <span className="st">
              <b>{me.streak_count} gün</b> streak · seviye {me.level}
            </span>
          </Link>
        )}
        {me && (
          <Link
            to="/settings"
            className="sb-prof"
            style={{ textDecoration: "none", color: "inherit" }}
            title="Profil ayarları"
          >
            <div className="avatar">{me.name.charAt(0).toUpperCase()}</div>
            <div className="col">
              <span className="pn">{me.name}</span>
              <span className="pe">
                {me.level_name} · {me.xp.toLocaleString("tr-TR")} XP
              </span>
            </div>
          </Link>
        )}
      </div>
    </aside>
  );
}
