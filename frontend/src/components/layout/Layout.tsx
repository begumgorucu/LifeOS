/**
 * Sayfaların ortak iskeleti: Sidebar + (Topbar + içerik).
 *
 * React Router v6'da `<Outlet />` aktif sayfanın komponentinin
 * gömüleceği yer. Her sayfa kendi `<DocumentTitle>` ya da
 * `useLayout({title, crumb})` çağrısıyla Topbar'ı bilgilendirebilir.
 * Şimdilik basit: her sayfa kendi Topbar'ını render eder ya da Layout'a
 * route adından çıkarsın — biz route bazlı sabit eşleme yapıyoruz.
 */
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

// Route → Topbar başlığı eşleştirmesi (tasarımdaki crumb/title alanlarıyla uyumlu)
const TITLES: Record<string, { title: string; crumb?: string }> = {
  "/": { title: "Dashboard" },
  "/areas": { title: "Areas", crumb: "Çalışma alanı" },
  "/projects": { title: "Projects", crumb: "Çalışma alanı" },
  "/tasks": { title: "Tasks", crumb: "Çalışma alanı" },
  "/calendar": { title: "Takvim", crumb: "Çalışma alanı" },
  "/pool": { title: "Daily Pool" },
  "/visions": { title: "Vision Board" },
  "/stats": { title: "Stats" },
  "/settings": { title: "Settings", crumb: "Hesap" },
};

export function Layout() {
  const loc = useLocation();
  // Dynamic route eşleştirmesi: /areas/:id, /projects/:id gibi
  let meta = TITLES[loc.pathname];
  if (!meta) {
    if (loc.pathname.startsWith("/areas/")) {
      meta = { title: "Alan detayı", crumb: "Çalışma alanı / Areas" };
    } else if (loc.pathname.startsWith("/projects/")) {
      meta = { title: "Proje detayı", crumb: "Çalışma alanı / Projects" };
    } else {
      meta = { title: "LifeOS" };
    }
  }

  return (
    <div className="app">
      <Sidebar />
      <div className="main">
        <Topbar title={meta.title} crumb={meta.crumb} />
        <div className="content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
