# Mimari & Modülerlik

> Bu dosya: stack, klasör yapısı, yeni özellik eklerken adımlar, *neyin nereye*
> ait olduğu, çakışma riskleri. Yeni feature başlatmadan önce buraya bak.

---

## 1) Stack

| Katman | Teknoloji | Notlar |
|---|---|---|
| Backend dili | Python 3.12 | type-hint zorunlu |
| Web framework | FastAPI | router → service → model 3-katman |
| ORM | SQLAlchemy 2.0 | `Mapped[...]` syntax, autoflush=False |
| Schema | Pydantic v2 | `ConfigDict(from_attributes=True)` |
| DB | PostgreSQL 16 | TIMESTAMPTZ, JSONB, enum tipleri |
| Migration | Alembic | enum'lar `create_table` içinde tanımlanır |
| Scheduler | APScheduler | Daily Pool + ihmal kontrolü için cron |
| Auth | JWT | tek kullanıcı, multi-tenant mimari hazır |
| Frontend dili | TypeScript | strict, noUnusedLocals |
| UI | React 18 + Vite | functional component, no class |
| State | TanStack Query | server state. **Redux yok.** Lokal: useState/useReducer |
| Router | React Router v6 | `BrowserRouter`, `<Outlet />` Layout pattern |
| Stil | CSS değişkenleri + tasarım sistemi | `tokens.css` + her sayfa için `styles/pages/X.css` |
| i18n | react-i18next | TR + EN, key'ler `dot.snake_case` |
| HTTP | Axios | `api/endpoints.ts` tek dosyada toplu |
| Deploy | Docker Compose | MVP boyunca lokal, sonra Hetzner |

**Fontlar** (Google Fonts, `index.html`'den yüklenir):
- `Hanken Grotesk` — gövde sans
- `Geist Mono` — etiket/sayı (font-variant-numeric: tabular-nums)
- `Caveat` — Vision Board el yazısı kart başlıkları
- `Instrument Serif` — Vision Board büyük serif başlığı

**Tasarım renkleri** (`tokens.css`):
- `--iris` `#0BA99B` (teal, ana aksent)
- `--surface` beyaz / `--surface-2` açık gri-yeşil
- `--ink` `#15211F` (koyu metin) → `--ink-4` (soluk)
- `--h-good` altın · `--h-crit` kırmızı (uyarı/öncelik)
- `--i50..i900` teal tonal skala

---

## 2) Klasör yapısı

```
lifeos/
├── backend/
│   ├── app/
│   │   ├── api/v1/         FastAPI router'lar (areas, projects, tasks, visions, …)
│   │   ├── core/           config, db, security, scheduler
│   │   ├── models/         SQLAlchemy modelleri + associations.py (M:N junction)
│   │   ├── schemas/        Pydantic request/response + common.py (Summary tipleri)
│   │   ├── services/       İş mantığı — router'dan çağrılır, model'i sarar
│   │   └── main.py         FastAPI app + middleware
│   ├── alembic/versions/   Migration'lar 0001..0006 (sırayla numaralı)
│   ├── tests/              pytest, container içinden `docker exec pytest`
│   ├── pyproject.toml      `.[dev]` ile dev paketleri (ruff, httpx, pytest)
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/endpoints.ts          Axios + tüm REST endpoint'ler
│   │   ├── components/               Modal'lar (NewTask, NewProject, NewVision,
│   │   │                              NewArea), TaskRow, InlineAddTask, Toast,
│   │   │                              layout/Sidebar, layout/Topbar, layout/Layout
│   │   ├── hooks/                    useAreas, useProjects, useTasks,
│   │   │                              useVisions, useLogActivity
│   │   ├── pages/                    Dashboard, Areas, AreaDetail, Projects,
│   │   │                              ProjectDetail, Tasks, Calendar, DailyPool,
│   │   │                              VisionBoard, Stats, Settings
│   │   ├── styles/
│   │   │   ├── tokens.css            CSS değişkenleri, global stiller
│   │   │   └── pages/X.css           sayfa-özel CSS (page component'ten import)
│   │   ├── types/api.ts              Backend ile senkron TypeScript tipleri
│   │   ├── utils/icons.tsx           Tek dosyada SVG icon registry
│   │   └── main.tsx, App.tsx, index.css
│   ├── designs/                       Kaynak HTML tasarım mockup'ları
│   └── Dockerfile
├── docker-compose.yml
├── CLAUDE.md                          Proje anayasası
└── progres/                           Bu klasör
```

---

## 3) Modülerlik kuralları (yeni özellik eklerken)

### Yeni bir **endpoint** ekleyeceksen:

1. `app/api/v1/<modul>.py` içine route ekle.
2. Gerekiyorsa `app/schemas/<modul>.py` içine Create/Update/Read Pydantic.
3. `app/services/<modul>_service.py` içine iş mantığı (DB çağrıları burada).
4. Model değişiyorsa: önce `app/models/<modul>.py`, sonra **Alembic migration**.
5. Frontend `types/api.ts`'a aynı tipi yansıt.
6. Frontend `api/endpoints.ts`'a Axios çağrısı ekle.
7. Frontend `hooks/use<Modul>.ts` içine TanStack Query hook'u.

### Yeni bir **sayfa** ekleyeceksen:

1. `pages/<Modul>.tsx` yarat.
2. `App.tsx`'te `<Route>` ekle (`/...` kebab-case).
3. `components/layout/Layout.tsx` içindeki `TITLES` sözlüğüne meta ekle
   (Topbar başlığı ve crumb).
4. `components/layout/Sidebar.tsx` `NAV` dizisine ekle (gerekirse).
5. `styles/pages/<modul>.css` yarat ve sayfa component'inden import et:
   `import "@/styles/pages/<modul>.css";`
6. Mevcut design system class'larını öncelikli kullan (`.btn`, `.tlist`,
   `.pcard`, `.cm-field`...). Inline style minimum.

### Yeni bir **M:N ilişki** ekleyeceksen (örnek: vision_projects):

1. `app/models/associations.py` içine `Table(...)` ekle.
2. İki model dosyasında `relationship(secondary=...)` ekle (back_populates
   gerekirse).
3. Alembic migration: tablo + iki FK + index (genelde reverse-side için).
4. Schema'da `*Summary` listesi olarak göster.
5. Service'te verify_X helper'ı (id listesi ↔ model dönüşümü + permission
   kontrolü user_id ile).

---

## 4) Çakışma riskleri (kod yazarken dikkat)

### Migration zinciri
- Her zaman önce `alembic current` → en son hangi revision'dayız bak.
- Yeni migration dosyasının `down_revision` doğru olsun.
- Migration başarısız olursa **container'ı uçurmadan** `docker compose down -v`
  ile temizle (MVP boyunca, üretim verisi yok).

### React Query cache anahtarları
- `["tasks", ...]` prefix'i tüm task query'leri kapsar. `invalidateQueries`
  prefix-match yapar.
- Cache key tutarlılığı: `Mutation.onSuccess` içinde ilgili tüm prefix'leri
  invalide et (areas, projects, visions kararı `health_score`/`progress`/
  `vibrance` etkilediği için zincirleme invalidasyon şart).

### Backend `limit` üst sınırı
- Tüm liste endpoint'lerinde `Query(le=100)`. Frontend 500 isterse 422 döner
  ve sessizce yutulur — `useQuery` boş array sanırız.
- 100'ün üzerine çıkarmak istiyorsan, **tüm** endpoint'leri tutarlı güncelle.

### Backend enum kullanımı
- `ProjectStatus.active` (küçük), `TaskStatus.todo`. `.ACTIVE` yok.
- Yeni enum eklerken `app/models/enums.py` + migration içinde
  `create_table(... sa.Enum(...))` (manuel `.create()` yapma).

### Frontend tarih (timezone)
- Modal/form'dan giden datetime mutlaka `Z` suffix'li ISO: `2026-06-15T12:00:00Z`.
- Filter'lar da UTC string: `2026-06-01T00:00:00Z`.
- Listeleme grupları `due_at.slice(0, 10)` (UTC tarih). `new Date(...).getDate()`
  yapma — local timezone'a kayar.

### CSS class çakışması
- Her sayfa CSS dosyası `pages/X.css` tek bir sayfayı hedefler.
- Global class isimlerini tekrar etme (`.btn`, `.modal-*` zaten tokens.css'te).
- Yeni feature'a özel class prefix kullan (örn. `tk-*` Tasks split layout,
  `pd-*` Project Detail, `calw-*` Calendar Week, `vbar`/`pin`/`note` Vision Board).

### Backend autoflush off
- `SessionLocal` autoflush=False. Pending değişiklik DB'ye yansımadan
  SELECT yaparsan yeni veriyi göremezsin → `db.flush()` çağır.

---

## 5) Tasarım sistemi referansları

| Sayfa | CSS dosyası | Ana class'lar |
|---|---|---|
| Dashboard | `pages/dashboard.css` | `.acard`, hero, area cards |
| Areas | `pages/areas.css` | `.acard`, health bar |
| Area detail | `pages/areas.css` (paylaşımlı) | sayfa-içi grid |
| Projects | `pages/projects.css` | `.pcard`, `.kanban`, `.momentum`, `.mom-stat` |
| Project detail | `pages/project-detail.css` | `.pd-page`, `.pd-hero`, `.pd-tasks`, `.pd-notes` |
| Tasks (split) | `pages/tasks.css` | `.tk-page`, `.tk-side`, `.tk-main`, `.trow` (paylaşımlı) |
| Calendar | `pages/calendar.css` | `.calw-page`, `.calw-mstrip`, `.calw-cols`, `.calw-card` |
| Daily Pool | `pages/daily-pool.css` | `.stage`, `.orbit`, `.satellite` |
| Vision Board | `pages/vision-board.css` | `.board-cover`, `.corkboard`, `.pin .photo`, `.note .paper`, `.card-pin` |
| Stats | `pages/stats.css` | grid metric cards |
| Settings | `pages/settings.css` | left nav + right form |

**Kural**: yeni sayfanın CSS'i hangi `designs/0X-name.html` mockup'tan
gelmişse, oradan `<style>` bloğunu `awk '/<style>/{flag=1;next}/<\/style>/{flag=0}flag' designs/X.html > styles/pages/x.css`
ile çıkar — kopyala-yapıştır değil.

---

## 6) "Şu anda kırılgan" alanlar

- **VisionBoard.tsx** — son refactor sırasında static demo → real data
  geçişinde birkaç tasarım detayı düşmüş ve eklenmişti (Sözler filter,
  motif emoji, ProgressPin). Daha fazla değişiklik yapmadan önce mevcut
  görünümü ekran görüntüsü ile doğrula.
- **NewTaskModal** — 4 modal arasında en sık değişen. Schema değişirse
  burayı yeniden gözden geçir.
- **Vision-Project link** — yeni eklendi (migration 0006). Edge case'leri
  henüz görmedik (vision silinince proje korunmalı; proje silinince vision
  bağlantısı CASCADE ile gider).
