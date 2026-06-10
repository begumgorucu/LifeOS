# Bilinen Sorunlar & Sonraki Adımlar

> Şu an çözmediğimiz ama farkında olduğumuz şeyler. Yeni bir özelliğe
> başlamadan önce burayı tara — bazıları yeni işle çakışıyor olabilir.

Format: `[öncelik] başlık — bir cümle özet`. Öncelik: **High / Med / Low**.

---

## Aktif rahatsızlıklar (UI/UX)

- **[Med]** Calendar "Hafta" ve "Ajanda" sekmeleri hâlâ "Yakında" disabled.
  Notion-style hafta görünümü zaten ana görünüm (`/calendar`), bu tabs
  müşteri rolünde gerek bile yok — ya gerçekten yap, ya sil.
- **[Med]** Vision Board `AFFIRMS` / `MOOD` pin'leri statik (hard-coded
  literals). Kullanıcı düzenleyemiyor. Edit modu eklendiğinde JSON-store
  veya backend tablosu lazım.
- **[Low]** ProjectDetail "Notlar" panelindeki markdown parser çok basit;
  inline code + link'i parse ediyor ama bold/italic yok. `react-markdown`
  eklenirse hızlı çözülür.
- **[Low]** Topbar arama kutusu (Cmd/Ctrl+K) görsel — fonksiyonel değil.

---

## Backend kısıtları

- **[Med]** Tüm liste endpoint'leri `limit ≤ 100`. Frontend bu sınırın
  üstüne çıkıp 422 alırsa sessizce boş liste sanır. Calendar bug'ında bu
  yaşandı — bütün sayfalarda `100` limit'ini varsayıyoruz. Pagination
  gerçekten lazım olduğunda **tüm sayfalarda tutarlı** geçilmeli.
- **[Med]** Vision delete CASCADE'i: `vision_areas` ve `vision_projects`
  silinir, ama bağlı `Area`/`Project` korunur ✓. **Project delete** ise
  `vision_projects` satırını CASCADE ile siler ✓; manuel test edildi.
  **Henüz tezgah dışı** edge case: aynı task farklı vision'lara dolaylı
  bağlıysa orphan check yapılmıyor — şu an problem değil.
- **[Med]** `compute_vibrance` her vision için `area.projects` üzerinden
  hesap yapıyordu (eski formül). Yeni formül **doğrudan `vision.projects`**
  kullanıyor. Eski yerlerde (örn. eski test'ler) hâlâ eski mantık
  varsayımı varsa düzeltilmeli.
- **[Low]** APScheduler cron'ları (Daily Pool oluşturma, ihmal kontrolü)
  kuruldu ama frontend'de "havuz oluşturuldu" bildirimi belirgin değil.

---

## Veri uyumluluk

- **[High]** Frontend `types/api.ts`'de `VisionRead.projects: ProjectSummary[]`
  alanı eklendi (0006 ile). Bu alan **eski seansta yaratılmış** vision'lar
  için `[]` döner — sorun değil. Test datası kontrollü.
- **[Med]** `NewTaskModal` proje seçimi area'ya göre filtreliyor. Ama task
  oluşurken Area + Project tutarsızlığı backend'de kontrol edilmiyor
  (project.area_id != task.area_id yazılabiliyor). Service'e bir guard
  şart — şu an UI bunu engelliyor, ama bypass mümkün.
- **[Low]** `compute_vibrance` boş bağlantı durumunda 70 default veriyor.
  Bu CLAUDE.md ile uyumlu, ama "0 hayalle başladığında 70 görmek" UX'i
  garip olabilir; gözlemleyip karar verelim.

---

## Tarih / timezone

- **[High]** Calendar / NewTaskModal'da datetime mutlaka `Z` suffix'li.
  Bu konvansiyon **yeni component'lerde de korunmalı**. Local Date
  objesinin `.toISOString()` çıktısı sözde "UTC" ama yerel TZ'yi
  UTC'ye dönüştürerek **gün kayması** yaratıyor. `${date}T12:00:00Z`
  pattern'ı standart.
- **[Med]** Vision `target_date` (yalnızca `date`, datetime değil) — ayrı
  bir veri tipi. Frontend hâlâ ISO string ile geliyor; `toLocaleDateString`
  ile render OK.

---

## Test eksikleri

- **[Med]** Backend test coverage zayıf — `vision_service` yeni formül
  için unit test yok. (Eski test'ler eski formülü doğrular, kırılmış olabilir.)
- **[Med]** Frontend test yok (vitest setup'ı var, kullanılmıyor).
- **[Low]** Manuel E2E akışı yok — Begüm tarafından klik klik test ediliyor.

---

## Tasarım & i18n

- **[Med]** i18n: TR ağırlıklı yazıldı; EN string'ler bazı yerlerde eksik.
  `i18n/tr.json` ve `i18n/en.json` arasında parity audit lazım.
- **[Low]** Mobile responsive eksik — desktop-first karar bilinçli.
  Sadece sidebar collapsing yapıldı bazı sayfalarda (`@media (max-width:
  900px)`). Ciddi mobil destek MVP scope dışı.
- **[Low]** Dark mode CSS değişkenleri var ama toggle UI'da test edilmedi;
  Settings sayfasında "Tema" alanı stub.

---

## Out of scope (CLAUDE.md'de zaten geçer)

Hatırlatma için — bunlar **istenmediğinde eklenmeyecek**:
- Çoklu kullanıcı, davet sistemi
- Push notification, e-posta, SMS (sadece in-app `notifications` tablosu)
- Mobile native app
- Üçüncü parti entegrasyonlar (Google Calendar, Apple Health…)
- AI öneriler / Claude API entegrasyonu
- Ödeme/abonelik
- Sosyal özellikler (yorum, beğeni, paylaşım)

---

# Sonraki adımlar (öncelik sırasıyla)

1. **Vision Board görsel kalite kontrolü** (High). Fontlar yüklendikten
   sonra mockup ile ekran görüntüsü karşılaştır. Hâlâ uyumsuzluk varsa:
   - `.vbar` hint sağa hizalama
   - polaroid kart altında Caveat font render olup olmadığı
   - corkboard kahverengi background gerçekten görünüyor mu
2. **NewTaskModal area-project tutarlılık guard'ı** (High). Backend
   service'te `if project.area_id != area_id: raise APIError(...)`.
3. **ProjectDetail "Notlar" markdown renderer'ı `react-markdown`'a geçir**
   (Med). Mevcut basit parser'ın yerine geçer, bold/italic/inline link/
   blockquote destekler.
4. **Vision Board AFFIRMS/MOOD edit etme** (Med). Tablo: `vision_decor`
   veya basitçe `users.vision_board_meta JSONB` — fazla mühendislik yapma.
5. **Tests: vision_service vibrance** (Med). 4 case: no links, only areas,
   only projects, both.
6. **Calendar tab consolidation** (Med). Ya Hafta/Ajanda gerçekten yaz,
   ya sekme tab'larını sil — şu an stillerle yanıltıyor.
7. **Topbar Cmd+K search** (Low). Areas + Projects + Tasks fuzzy match.
   Backend `/search` endpoint'i veya client-side.
