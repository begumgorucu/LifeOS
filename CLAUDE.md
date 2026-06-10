# LifeOS — Project Constitution

> Bu dosya proje anayasasıdır. Claude Code, bu projede çalışırken bu dosyadaki tüm kuralları takip eder. Yeni özellik, kod değişikliği veya mimari karar verirken bu doküman referans noktasıdır.

---

## 1. Vision

LifeOS (Life Operating System), kişinin tüm hayat alanlarını tek bir yerden yönetebileceği, görevlerini önceliklendiren, hayallerini görselleştiren ve günlük rutinde ona destek olan bir kişisel hayat işletim sistemidir.

**Tek cümlede:** "Hayatımın tüm alanlarına eşit ilgi vermemi sağlayan, beni hayallerime yakın hissettiren bir sistem."

## 2. Target User

- **Birincil persona:** 25-40 yaş, kariyer + kişisel gelişim odaklı, birden fazla hayat alanını paralel yönetmeye çalışan, dağınıklıktan rahatsız olan, profesyonel görünümlü araçlar isteyen kullanıcı.
- **İlk kullanıcı:** Begüm (ürünün sahibi). MVP boyunca sadece bu kullanıcı vardır.
- **İleride:** SaaS olarak satılması hedeflenir. Mimari multi-tenant kurulur ama MVP'de tek kullanıcı varsayılır.

## 3. Core Promise (Ürün Sözü)

LifeOS, kullanıcıya şu üç şeyi vaat eder:

1. **Her sabah ne yapacağını net bilirsin.** Sistem önerir, sen onaylarsın.
2. **Hiçbir alan unutulmaz.** İhmal edilen alanlar uyarılır.
3. **Hayallerin uzaklaştığında hissedersin.** Görsel hayal panosu sistemi.



---

## 4. Domain Model

LifeOS'un dört temel kavramı vardır. Bunlar yukarıdan aşağıya hiyerarşik bir yapı oluşturur.

### 4.1. Vision (Hayal)
- Kullanıcının uzun vadeli, soyut hedeflerini temsil eder. Örnek: "Berlin'de yaşamak", "Yeni bir kariyer kurmak", "Sağlıklı bir vücut".
- Bir Vision **birden fazla Area'ya bağlanabilir**.
- Görsel hayal panosunda gösterilir. İlgili Area'ların ortalama sağlık skoru, Vision'un "netliğini" belirler (düşük skor = soluk, yüksek skor = canlı).

### 4.2. Area (Hayat Alanı)
- Kullanıcının hayatındaki sürekli ilgi gerektiren alanlar. Kapanmaz, biter de değildir. Örnek: Sağlık, Almanca, Spor, Kişisel bakım.
- Her Area'nın bir **sağlık skoru (0–100)** vardır.
  - Görev tamamlama → skor artar.
  - İhmal edilme (gün geçmesi) → skor düşer.
  - Skor 30'un altına düşerse "ihmal edilen alan" uyarısı tetiklenir.
- Bir Area, **birden fazla Project ve Task** içerebilir.

### 4.3. Project (Proje)
- Bitişi olan, bir hedefe yönelik çalışma. Örnek: "Almanca A2 sertifikası", "PastaKodu MVP".
- Bir Project'in **hedef tarihi (deadline)** ve **ilerleme yüzdesi** vardır.
- Bir Project **bir Area'ya bağlıdır** (her Project bir alanın altındadır).
- Bir Project, **birden fazla Task** içerebilir.
- Project tamamlandığında "completed" durumuna geçer.

### 4.4. Task (Görev)
- Aksiyon birimi. Yapılması gereken somut iş. Örnek: "30 dk yürüyüş yap", "Almanca Ünite 5'i bitir".
- Her Task'in:
  - **due_at** (ne zaman yapılmalı)
  - **priority** (öncelik: low/medium/high)
  - **status** (todo, in_progress, done, skipped)
  - **area_id** (zorunlu — hangi alana ait)
  - **project_id** (opsiyonel — bir projeye bağlı mı)
  - **depends_on** (opsiyonel — başka task'lere bağımlılığı varsa)
- Bir Task **ya bir Area'ya doğrudan bağlanır** ya da **bir Project üzerinden Area'ya bağlanır**.

### 4.5. İlişki Diyagramı
Vision (hayal)
↓ inspires (birden fazla Area'yı besler)
Area (alan)
↓ contains
Project (proje, opsiyonel)
↓ breaks into
Task (görev)
### 4.6. Üç Bağlantı Mekanizması

LifeOS'ta görevler üç farklı şekilde birbirine bağlanabilir:

1. **Goal Decomposition (Hedef Ayrıştırma):** Yukarıdaki hiyerarşi. Bir Vision → Area → Project → Task zinciri.
2. **Task Dependencies (Görev Bağımlılığı):** Bir Task tamamlanmadan başka bir Task başlayamaz. Örnek: "Goethe sınavına kayıt ol" → "A2 ünitelerini bitir" task'ine bağımlıdır. Bu bir DAG (yönlü, döngüsüz graf) yapısıdır.
3. **Cross-Area Triggers (Alanlar Arası Tetikleyici):** Bir alan ihmal edildiğinde, sistem otomatik olarak başka bir alana telafi görevi atayabilir. Örnek: Spor alanı 7 gündür ilgisiz → "30 dk yürüyüş yap" task'i otomatik oluşur.



---

## 5. MVP Features

MVP'de bulunacak özellikler aşağıdaki gibidir. Bu listenin dışındaki özellikler scope dışıdır — sonraki sürümlere bırakılır.

### 5.1. Onboarding
- Kullanıcı ilk açtığında boş sayfa görür.
- "Örnek alanlardan seç" butonu ile 24 adet önerilen alan şablonu gösterilir (Sağlık, Para, Aile, Sevgili, Arkadaşlar, İş Bulmak, Para Yönetimi, Para Kazanma, Yatırım, Deneyim, Spor, Kitap, Müzik, Kişisel Bakım, Sağlıklı Beslenme, Eğlence, KPSS, PastaKodu, Sertifika, Hobi, İngilizce, Almanca, Yaşam Yeri, Gelecek Planı, Hayaller).
- Kullanıcı istediği kadar seçer, isterse sıfırdan kendi alanlarını oluşturur.

### 5.2. Areas (Alanlar)
- Liste görünümü: tüm alanlar ve sağlık skorları.
- Detay görünümü: alan altındaki Project ve Task'ler, son ilgi tarihi, hedef tanımı.
- Ekle / düzenle / sil işlemleri.

### 5.3. Projects (Projeler)
- Listelenebilir, alana göre filtrelenebilir.
- Deadline, ilerleme yüzdesi, ilişkili task'ler görünür.
- Ekle / düzenle / sil işlemleri.

### 5.4. Tasks (Görevler)
- Listelenebilir, alana/projeye göre filtrelenebilir.
- Bağımlılık (depends_on) tanımlanabilir; bağımlı bir task tamamlanmadan diğeri "todo" durumunda kilitli kalır.
- Ekle / düzenle / sil işlemleri.

### 5.5. Daily Pool (Günlük Görev Havuzu)
- Her sabah sistem, kullanıcıya bir öneri listesi sunar:
  - Bugün vadesi gelen task'ler
  - Sağlık skoru düşmüş alanlardan telafi task'leri
  - Devam eden projelerden bir sonraki adım task'leri
- Kullanıcı bu listeden seçer, "bugünün havuzu" oluşur.
- Hibrit yaklaşım: sistem önerir, kullanıcı onaylar veya değiştirir.

### 5.6. Vision Board (Hayal Panosu)
- Ayrı bir sayfada gösterilir, navigasyonun ortasında sabit yeri vardır.
- Kullanıcı her Vision için fotoğraf, kısa metin, hedef tarih ekleyebilir. Hepsi opsiyoneldir.
- Vision'a bağlı Area'ların ortalama sağlık skoru, görselin **renk solgunluğunu** belirler:
  - 0–30 → çok soluk, neredeyse siyah-beyaz
  - 31–70 → orta solgunluk
  - 71–100 → tam canlı, renkli
- Görselin üzerine gelince (hover) detaylı bilgi açılır: skor yüzdesi, bağlı alanlar, son aktivite tarihi, eksik task sayısı.

### 5.7. Settings (Ayarlar)
- Dil seçimi (Türkçe / İngilizce).
- Tema seçimi (Açık / Koyu / Sistem).
- Profil bilgileri (isim, e-posta).

### 5.8. Scope Out (MVP'de Olmayan)
- Çoklu kullanıcı / paylaşım / partner ile ortak hedefler.
- Push notification / e-posta bildirimi.
- Mobile uygulama (responsive web sayfası MVP'de yeterli).
- AI öneriler (Claude API entegrasyonu sonraki sürümde).
- Ödeme sistemi / abonelik.
- Sosyal özellikler (yorum, paylaşma).


---

## 6. Engagement Layers (Bağlayıcı Oyunlaştırma)

LifeOS, kullanıcının uygulamayı düzenli kullanmasını sağlamak için çocuksu olmayan, profesyonel ama bağlayıcı oyunlaştırma katmanları içerir. Hepsi MVP'de bulunur.

### 6.1. Streak
- Kullanıcının üst üste kaç gün en az bir görev tamamladığı sayılır.
- Ana sayfada görünür: "7 gün serisi".
- Seri bozulursa sıfırlanır, ama "en uzun seri" geçmişi saklanır.

### 6.2. Neglected Area Warning (İhmal Edilen Alan Uyarısı)
- Bir Area'nın son aktivite tarihi 7+ gün önceyse veya skor 30'un altındaysa uyarı tetiklenir.
- Ana sayfada kırmızı/turuncu rozet ile gösterilir.
- Bu uyarı, Daily Pool öneri sistemini de besler.

### 6.3. Area Health Score (Alan Sağlık Skoru)
- Her Area için 0–100 arası dinamik skor.
- Görev tamamlama → +X puan (önceliğe göre).
- Gün geçmesi (ihmal) → -Y puan/gün.
- Liste görünümünde renkli mini bar ile gösterilir (yeşil/sarı/turuncu/kırmızı).

### 6.4. Morning Greeting (Sabah Karşılaması)
- Saat 06:00–11:00 arası açılan ilk seans için özel karşılama gösterilir.
- "Günaydın [isim], bugün senin için X öneri hazırladım."
- Daily Pool önerilerini sunan ana sayfa bileşeni.

### 6.5. Weekly Goal (Haftalık Hedef) — Opsiyonel
- Kullanıcı her Area için haftalık hedef belirleyebilir (örn. "haftada 3 spor görevi").
- İlerleme çubuğu ile gösterilir.
- Hedef zorunlu değildir, atlanabilir.

### 6.6. Milestone Achievements (Başarı Kilometre Taşları)
- Sessiz, prestij hisli başarılar. Rozet havasında değil, "kilometre taşı" havasında.
- Örnekler:
  - "30 gün üst üste sağlık alanına ilgi gösterdin"
  - "İlk projeni tamamladın"
  - "Bir Vision'un sağlık skoru ilk kez 90'a ulaştı"
- Profilde liste halinde gösterilir; süslü pop-up yok, sade bir bildirim ile gelir.



---

## 7. Technical Stack & Rules

### 7.1. Stack
- **Backend:** Python 3.12, FastAPI, SQLAlchemy 2.0, Alembic (migrations), Pydantic v2.
- **Database:** PostgreSQL 16 (Docker Compose ile lokal).
- **Auth:** JWT (basit, tek kullanıcı için). Multi-tenant mimari hazır olacak ama MVP'de devre dışı.
- **Scheduler:** APScheduler (Daily Pool oluşturma, ihmal kontrolü için günlük cron job).
- **Frontend:** React 18, Vite, TypeScript, TailwindCSS, TanStack Query (server state), React Router.
- **Internationalization:** react-i18next (Türkçe + İngilizce, en baştan).
- **Deploy:** MVP boyunca localhost. İlerleyen aşamada Hetzner Cloud (Docker Compose).

### 7.2. Klasör Yapısı
lifeos/
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI route'ları
│   │   ├── core/         # config, db, security
│   │   ├── models/       # SQLAlchemy modelleri
│   │   ├── schemas/      # Pydantic şemaları
│   │   ├── services/     # iş mantığı katmanı
│   │   └── main.py
│   ├── alembic/          # migration dosyaları
│   ├── tests/
│   ├── pyproject.toml
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── i18n/         # tr.json, en.json
│   │   └── lib/
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
├── CLAUDE.md
├── PRODUCT.md
└── DOMAIN.md

### 7.3. Coding Rules (Kod Kuralları)
- **Dil:** Kod, fonksiyon isimleri, değişkenler İngilizce. Comment'ler ve docstring'ler İngilizce.
- **Stil:** Backend için PEP 8, frontend için Prettier + ESLint.
- **Test:** Her yeni özellik için en az bir test yazılmalı (pytest backend için, vitest frontend için). Test zorunluluğu MVP'de gevşektir, ama temel servis katmanı test edilmelidir.
- **Migration:** Veritabanı şema değişikliği her zaman Alembic migration ile yapılmalı, ASLA elle değiştirilmemeli.
- **Migration Konvansiyonları:**
  - **Enum tipleri için açık `enum.create()` çağrısı yapma.** `op.create_table` içinde `sa.Enum(...)` yazıldığında SQLAlchemy enum'u otomatik yaratır. Manuel `.create()` + `create_type=False` ikilisi, migration yarıda kalırsa enum'un transaction dışında kalıp "duplicate object" hatasına yol açar.
  - `downgrade()` fonksiyonunda enum'ları açıkça `sa.Enum(name=...).drop(op.get_bind(), checkfirst=True)` ile düşür — `drop_table` enum tipini otomatik silmez.
  - Her enum tek bir tabloda kullanılıyorsa, enum'u o tablonun `create_table` çağrısı içinde tanımla. Birden çok tabloda kullanılıyorsa, ayrı bir adımda `sa.Enum(...).create()` ile yarat, sonraki kullanımlarda `create_type=False` kullan.
  - Migration başarısız olursa, `docker-compose down -v` ile volume'u temizleyip baştan başlamak en güvenlisi (MVP boyunca üretim verisi yok, kayıp risksiz).
  - **Seed verisi:** Veri ekleme/güncelleme için `sa.text()` + raw `INSERT` SQL yerine `op.bulk_insert()` ile birlikte `sa.table()` tanımı kullan. Bu yöntem SQLAlchemy'ye tip bilgisini açıkça verir; UUID, JSON, array gibi sütunlarda otomatik tip cast hataları yaşanmaz. Migration ORM modelinden bağımsız kalır (ORM modeli ileride değişirse migration kırılmaz).
- **Container & dev bağımlılıkları (MVP):** Backend Dockerfile'ı `pip install ".[dev]"` ile kurulum yapar — pytest, ruff, httpx gibi dev paketleri de container'a yüklenir. Bu sayede testler, linter ve geliştirme araçları `docker exec` ile container içinden çalıştırılır; ayrı bir test ortamı kurmaya gerek kalmaz. Production deploy aşamasında (Adım 10 sonrası) multi-stage Dockerfile ile prod/dev image'ları ayrılacak.
- **Secrets:** Hiçbir API key, password, secret koda yazılmaz. `.env` dosyasında tutulur, `.env.example` ile şablonu paylaşılır.
- **Git:** Her özellik kendi branch'inde geliştirilir (`feature/areas-crud`, `feature/vision-board`). Doğrudan main'e push yapılmaz.

### 7.4. Naming Conventions (İsimlendirme)
- **Database tabloları:** plural snake_case (`areas`, `tasks`, `visions`).
- **Python sınıfları:** PascalCase (`AreaService`, `TaskRepository`).
- **React component'leri:** PascalCase (`AreaCard.tsx`, `VisionBoard.tsx`).
- **API endpoint'leri:** kebab-case + plural (`/api/v1/areas`, `/api/v1/daily-pool`).
- **i18n key'leri:** dot.notation snake_case (`areas.create.title`, `dashboard.morning_greeting`).

### 7.5. API Design Principles
- RESTful endpoint yapısı.
- Her endpoint için Pydantic schema (request + response).
- Pagination: liste endpoint'leri `?limit=20&offset=0` ile desteklenmeli.
- Error response standart: `{ "error": { "code": "...", "message": "..." } }`.
- Versiyonlama: tüm endpoint'ler `/api/v1/` prefix'i altında.

### 7.6. Frontend UI Principles
- **Responsive:** Mobile-first değil, "desktop-first ama mobile-friendly". MVP'de desktop hedef.
- **Theme:** CSS variables ile açık/koyu mod desteği. Tailwind dark mode class strategy.
- **Component library:** shadcn/ui kullanılacak (kopyalanabilir, kontrol edilebilir component'ler).
- **State management:** Server state için TanStack Query, lokal state için useState/useReducer. Redux gibi global state manager **kullanılmayacak**.

---

## 8. Working Principles (Çalışma İlkeleri)

Claude Code, bu projede şu ilkelerle çalışır:

1. **Önce planla, sonra yaz.** Her yeni özellik için önce kısa bir plan yaz (hangi dosyalar değişecek, hangi yeni dosyalar oluşacak), sonra koda başla.
2. **Küçük adımlarla ilerle.** Bir özelliği büyük tek commit yerine 3-5 küçük commit ile teslim et.
3. **Soru sor, varsayma.** Belirsiz bir noktada koda dalmadansa kullanıcıya kısa bir soru sor.
4. **Test et.** Bir özellik bittiğinde nasıl test edileceğini söyle (örn. "şu endpoint'i curl ile çağır").
5. **Türkçe iletişim, İngilizce kod.** Kullanıcı ile Türkçe konuş, kodda her şey İngilizce yaz.
6. **Productçı dilini koru.** Kullanıcı yazılımcı değil productçıdır. Teknik terim kullanırken yanında basit açıklamasını ver.

---

## 9. Out of Scope (Bu MVP'nin Sınırları)

Aşağıdakiler bu projenin **kapsamı dışındadır**, eklenmemelidir:

- Çoklu kullanıcı, kullanıcı davet sistemi.
- Sosyal özellikler (paylaşım, yorum, beğeni).
- Push notification, e-posta gönderimi, SMS.
- Mobile native uygulama (iOS/Android).
- Üçüncü parti entegrasyonlar (Google Calendar, Apple Health, vb.).
- AI öneriler, chatbot, akıllı görev oluşturma (Claude API çağrısı).
- Ödeme, abonelik, faturalandırma.
- Admin panel, kullanıcı yönetim arayüzü.
- Analytics, telemetry, kullanıcı davranış izleme.

Bu listedeki bir özellik talep edildiğinde, "MVP scope dışı, sonraki sürüme not edildi" yanıtı verilir.