# LifeOS

> **Hayatımın tüm alanlarına eşit ilgi vermemi sağlayan, beni hayallerime yakın hissettiren bir sistem.**

LifeOS, kişinin tüm hayat alanlarını (kariyer, sağlık, ilişkiler, hobiler…)
tek bir yerden yönetebileceği, görevlerini önceliklendiren, hayallerini
görselleştiren ve günlük rutinde ona destek olan kişisel bir hayat işletim
sistemidir.

---

## Üç Söz

1. **Her sabah ne yapacağını net bilirsin.** Sistem öneri sunar, sen onaylarsın.
2. **Hiçbir alan unutulmaz.** İhmal edilen alanlar uyarılır.
3. **Hayallerin uzaklaştığında hissedersin.** Görsel hayal panosu — bağladığın projelerde ilerledikçe canlanır, ihmal ettikçe soluyor.

---

## Domain Modeli

```
Vision (Hayal)                — uzun vadeli, soyut hedefler
   ↓ inspires (M:N)
   ├── Area (Alan)            — sürekli ilgi gerektiren yaşam alanları
   │     ↓ contains (1:N)
   │     └── Project (Proje)  — bitişi olan somut çalışmalar
   │           ↓ breaks into (1:N)
   │           └── Task       — yapılması gereken aksiyon
   └── Project (M:N)          — Vision'a doğrudan proje bağlanabilir
```

Üç bağlantı mekanizması:
- **Goal Decomposition** — yukarıdaki hiyerarşi.
- **Task Dependencies** — bir görev başka göreve bağımlı (DAG).
- **Cross-Area Triggers** — ihmal edilen alan başka alana telafi görevi tetikler.

---

## Özellikler (MVP)

- 📋 **Areas / Projects / Tasks** — üç katmanlı görev yönetimi.
- 🎯 **Daily Pool** — sabah karşılaması + günün önerilmiş görevleri.
- 🖼 **Vision Board** — mantar pano + polaroid hayal kartları + el yazısı sözler. Bağlı projelerin ilerlemesi vibrance puanını besler; ihmal edilen hayaller fiziksel olarak soluyor.
- 📅 **Calendar** — Notion tarzı geniş hafta görünümü + yıl/ay seçici.
- 📁 **Project Detail** — markdown notlar paneli, dependency-aware görev listesi.
- 🔥 **Engagement** — streak, level/XP, area health score (0–100), sessiz milestone'lar.
- 🌍 **i18n** — Türkçe + İngilizce (react-i18next).
- 🌓 **Tema** — açık / koyu / sistem (CSS değişkenleri).

---

## Teknoloji

| Katman | Stack |
|---|---|
| Backend | Python 3.12, FastAPI, SQLAlchemy 2.0, Pydantic v2 |
| DB | PostgreSQL 16 |
| Migration | Alembic |
| Auth | JWT |
| Scheduler | APScheduler |
| Frontend | React 18, TypeScript, Vite, TanStack Query, React Router v6 |
| Stil | CSS değişkenleri + tasarım sistemi (Hanken Grotesk + Geist Mono + Caveat + Instrument Serif) |
| HTTP | Axios |
| i18n | react-i18next |
| Deploy | Docker Compose |

---

## Hızlı Başlangıç

Önkoşul: Docker + Docker Compose kurulu olmalı.

```bash
# 1. Ortam değişkenlerini hazırla (varsayılanlar dev için yeterli)
cp .env.example .env

# 2. Stack'i ayağa kaldır
docker compose up --build

# İlk inşa 2–5 dk. Sonrakiler saniyeler.
```

Servisler ayağa kalktığında:

| Servis | URL | |
|---|---|---|
| Frontend | http://localhost:5173 | React arayüz |
| Backend  | http://localhost:8000 | FastAPI |
| API Docs | http://localhost:8000/docs | Swagger UI |
| Health   | http://localhost:8000/health | sağlık kontrolü |
| PostgreSQL | `localhost:5432` | lifeos / lifeos / lifeos |

---

## Geliştirme Komutları

```bash
# Migration (yeni revision)
docker compose exec backend alembic revision --autogenerate -m "yeni özellik"
docker compose exec backend alembic upgrade head
docker compose exec backend alembic current

# Backend testleri
docker compose exec backend pytest -x

# DB shell
docker compose exec db psql -U lifeos -d lifeos

# Stack'i durdur
docker compose down

# Sıfırdan (volume'leri uçur — sadece MVP boyunca)
docker compose down -v
```

---

## Klasör Yapısı

```
lifeos/
├── backend/
│   ├── app/
│   │   ├── api/v1/         FastAPI router'lar
│   │   ├── core/           config, db, security, scheduler
│   │   ├── models/         SQLAlchemy modelleri
│   │   ├── schemas/        Pydantic request/response
│   │   ├── services/       İş mantığı katmanı
│   │   └── main.py
│   ├── alembic/versions/   Migration'lar (sırayla numaralı)
│   └── tests/
├── frontend/
│   ├── src/
│   │   ├── api/            Axios endpoint'leri
│   │   ├── components/     Yeniden kullanılabilir UI
│   │   ├── hooks/          TanStack Query hook'ları
│   │   ├── pages/          Route'larla eşleşen sayfalar
│   │   ├── styles/         tokens.css + sayfa-özel CSS
│   │   ├── types/api.ts    Backend ile senkron tipler
│   │   └── utils/
│   └── designs/            Kaynak HTML tasarım mockup'ları
├── docker-compose.yml
├── CLAUDE.md               Proje anayasası (vizyon, kurallar, scope)
└── progres/                Geliştirme süreç defteri (mimari, günlük, sorunlar)
```

---

## Tasarım Felsefesi

- **Çocuksu olmayan oyunlaştırma**: streak, milestone'lar prestij hissi verir;
  pop-up'lar yok, ses yok, rozet defteri yok.
- **Hibrit öneri**: sistem önerir, kullanıcı onaylar — robot değil ortak.
- **Görsel duygu**: hayaller fiziksel olarak canlanır/soluyor; ekrana
  baktığında hissedersin.
- **Productçı-için**: Begüm yazılımcı değil; arayüzde teknik terim minimum,
  her şey amacıyla isimlendirilmiş.

---

## Proje Durumu

MVP geliştirme aşamasında. Geliştirme defteri, mimari kararları, açık sorunlar
ve sonraki adımlar için `progres/` klasörüne bak:

- `progres/README.md` — özet + nerede olduğumuz
- `progres/mimari.md` — stack, modülerlik kuralları
- `progres/veri-ve-api.md` — modeller, ilişkiler, endpoint envanteri
- `progres/bilinen-sorunlar.md` — ertelenen şeyler + sonraki adımlar
- `progres/gunluk.md` — oturum-bazlı değişiklik kayıtları

---

## Lisans

Henüz lisans seçilmedi — şu an kişisel/aile kullanımı için, ileride SaaS
olarak konumlanacak.

---

> **Tek cümlede**: hayatımın tüm alanlarına eşit ilgi vermemi sağlayan, beni
> hayallerime yakın hissettiren bir sistem.
