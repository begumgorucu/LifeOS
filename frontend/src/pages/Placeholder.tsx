/**
 * Henüz UI'ı yazılmamış sayfalar için ortak iskelet.
 *
 * Her placeholder kendi `title` ve `bodyHint` ile bu komponenti çağırıyor.
 * Backend endpoint'i HAZIR; sadece arayüz beklemede.
 */
interface PlaceholderProps {
  title: string;
  bodyHint: string;
}

export function Placeholder({ title, bodyHint }: PlaceholderProps) {
  return (
    <div>
      <div className="page-head">
        <h1>{title}</h1>
        <p>{bodyHint}</p>
      </div>
      <div className="state-block">
        <h2>Yakında.</h2>
        <p>Bu sayfa sıradaki frontend fazında geliyor. Backend tarafı hazır.</p>
      </div>
    </div>
  );
}

export const DashboardPage = () => (
  <Placeholder
    title="Günaydın, Begüm."
    bodyHint="Yaşam dengesi, günlük havuz ve haftalık özet burada görünecek."
  />
);
export const ProjectsPage = () => (
  <Placeholder title="Projects" bodyHint="Kanban görünümü + proje detayları." />
);
export const TasksPage = () => (
  <Placeholder title="Tasks" bodyHint="Sekmeli liste: bugün / bu hafta / tamamlanan." />
);
export const PoolPage = () => (
  <Placeholder
    title="Daily Pool"
    bodyHint="Sabah ritüeli: 5 akıllı öneri, neden ve onay."
  />
);
export const VisionsPage = () => (
  <Placeholder
    title="Vision Board"
    bodyHint="Hayallerin masonry panosu — skor düşünce hayal soluyor."
  />
);
export const StatsPage = () => (
  <Placeholder
    title="Statistics"
    bodyHint="Trend, ısı haritası ve rozetler buraya gelecek."
  />
);
export const SettingsPage = () => (
  <Placeholder
    title="Settings"
    bodyHint="Profil, tema, dil, bildirim tercihleri ve veri export."
  />
);
