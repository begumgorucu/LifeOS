# Oturum Günlüğü

> Her oturumun sonunda **en üste** yeni bir blok ekle. Format:
> tarih (ISO), oturum süresi sezgisi, ne yapıldı (madde), kararlar (madde),
> sonraki adım için not.
>
> En üst = en yeni. Aşağı indikçe geçmiş.

---

## 2026-06-09 → 2026-06-10 (Vision Board canlandırma + tasarım onarımı)

**Bağlam**: Calendar bug'dan başlayıp Tasks split layout → Project detay →
Vision Board real-data + edit/delete'e kadar uzanan tek seansta yapılan
büyük UI/UX hamlesi.

### Yapılanlar (sırayla)
1. **NewTaskModal**'a "Açıklama" textarea + "Kısa ad" netleştirme;
   `due_at` UTC öğleni (`Z` suffix'li ISO).
2. **Calendar bug**: `limit=500` → backend 422 → boş liste sanılıyordu.
   `limit=100`'e indirildi. Backend `limit ≤ 100` cap'i tüm endpoint'lerde.
3. **Calendar yeniden tasarım** — birkaç iterasyon:
   - "Profesyonel ay grid" (cancelled)
   - Apple iOS Calendar tarzı dikey (cancelled)
   - **Final: Notion tarzı geniş hafta görünümü** + 12 ay şeridi + 
     yıl seçici dropdown (chevron + dropdown). `pages/calendar.css` baştan yazıldı,
     `.calw-*` prefix'li class'lar.
4. **Tasks sayfası → split layout** (`pages/Tasks.tsx`, `pages/tasks.css`).
   Sol panel: akıllı listeler + Projeler + Alanlar (sayaç + sağlık mini bar).
   Sağ panel: filtrelenmiş görev listesi + proje görünümünde meta panel.
   `View = "smart" | "project" | "area"` discriminated union.
5. **Görev–Proje bağlantısı** UI'a yansıtıldı:
   - `NewTaskModal` → "Proje (opsiyonel)" alanı (alan seçimine göre filtreli).
   - `TaskRow` → teal proje chip'i (tıklanabilir, Tasks sayfasında proje
     filtresine zıplar).
6. **Proje detay sayfası** (yeni): `pages/ProjectDetail.tsx` + 
   `pages/project-detail.css`. Route `/projects/:projectId`. 2-kolon
   (hero + tasks / sağda Notlar sticky). Markdown-lite parser
   (`## başlık`, `- bullet`, `` `code` ``, http link).
7. **Demo veri**:
   - Kariyer alanı yaratıldı.
   - `LifeOS v1 yayını` projesi + 12 task (7 done + 5 todo, "UI tasarımı"
     → "Wireframe → UI dönüşümü" dependency).
   - 3 vision: Avrupa'da yaşamak, LifeOS'u dünyaya açmak, Sağlıklı bir vücut.
8. **Vision Board → real backend data**:
   - `useVisions`/`useCreateVision`/`useUpdateVision`/`useDeleteVision`
     mutation'ları.
   - Edit modal (NewVisionModal'ı `editing` prop ile yeniden kullanıyor).
   - Delete confirm modal.
   - Hover overlay'de ✎ / 🗑 butonları (`.pin-actions`).
9. **Vision-Project doğrudan bağlantı** (Migration **0006**):
   - `vision_projects` junction table.
   - `Vision.projects` relationship.
   - `VisionRead.projects: list[ProjectSummary]`.
   - `VisionCreate/Update`'e `project_ids` alanı.
   - `compute_vibrance` formülü güncellendi: avg(area.health, project.progress).
10. **NewVisionModal** zenginleştirildi: image_url, target_date, projects
    multi-select (area seçimine göre öne çıkarma).
11. **Tasarım onarımı (mockup-uyumu)**:
    - **Caveat** + **Instrument Serif** Google Fonts'tan eklendi
      (`index.html`). Caveat el yazısı için, Serif banner için.
    - "Sözler" filter geri getirildi.
    - Hint metni sağa hizalandı (`.note` class + `marginLeft:auto`).
    - Motif emoji eklendi (sağ üst, bağlı alan ikonu / fallback).
    - **ProgressPin** geri getirildi (aktif projeden en yüksek progress'li
      olanı dinamik gösterir).
12. **`progres/` klasörü** açıldı: README + mimari + veri-ve-api +
    bilinen-sorunlar + bu günlük.

### Önemli kararlar
- **Backend liste limit'i tüm endpoint'lerde 100**. Bunu aşmak isteyen
  client 422 yiyor. Pagination gerçekten lazımsa **tüm endpoint'leri**
  aynı anda yükselt.
- **Tarih `Z` suffix'li UTC** her yerde. Modal'dan `${date}T12:00:00Z`,
  Calendar query'sinde `${YYYY-MM-01}T00:00:00Z`.
- **Vibrance**: Vision'a hem area hem project bağlanabilir. İkisi de varsa
  ortalama; biri varsa o; ikisi de yoksa 70.
- **Vision dekorasyon pin'leri** (AFFIRMS / MOOD / PROGRESS) hâlâ dekoratif
  amaçlı, statik veya türetilmiş — Begüm tarafından düzenlenemiyor şimdilik.
- **ProjectStatus enum değerleri küçük harf** (`.active`). `.ACTIVE` yok.

### Yarın açıldığında ilk kontrol
1. `docker compose ps` — containers ayakta mı?
2. `alembic current` → `0006` görünüyor mu?
3. **Vision Board ekran kontrolü**: fontlar yüklendiyse Caveat görünür,
   serif banner zarif olur. Görünmüyorsa `index.html` font link'i doğru mu?
4. `bilinen-sorunlar.md` → High etiketli madde varsa onunla başla.

### Açık sorular / Begüm'e sorulacak
- Vision Board mockup'a artık ne kadar benziyor? (fontlar geldikten sonra)
- "Hafta / Ajanda" sekmeleri silelim mi yoksa gerçekten yapalım mı?
- Onboarding sayfası ne zaman? (CLAUDE.md'de var ama yok)

---

## 2026-06-02 → 2026-06-08 (özet — pre-progres dönemi)

Bu klasör açılmadan önceki dönemin özeti (jsonl transcript'ten derlendi):

- Backend tamamlandı: FastAPI + Pydantic v2 + SQLAlchemy 2.0 + PostgreSQL
  + Alembic. 5 migration, 29 endpoint, 73 test.
- Frontend taban: React 18 + Vite + TS + TanStack Query + react-i18next.
- Tasarım sistemi: teal tonal, Hanken Grotesk + Geist Mono.
- Dashboard, Areas, AreaDetail, Projects (Kanban), Tasks (sekmeli),
  Daily Pool (orbit/stage), Vision Board (statik DREAMS), Stats, Settings
  inşa edildi.
- Toast sistemi, useLogActivity hook (gerçek aktivite/skor bump).
- "Dashboard butonları çalışmıyor", "Aktivite butonu çalışmıyor",
  "Vision Board native alert kullanıyor" gibi nokta düzeltmeleri.
- AreaDetail sayfası eklendi, sidebar streak/profile chip'leri Link'e
  çevrildi.
