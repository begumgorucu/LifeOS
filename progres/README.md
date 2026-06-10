# LifeOS — Süreç Defteri

> Bu klasör Claude'un her oturum başında 30 saniyede konuma gelebilmesi için
> tutulan canlı belgedir. **Önce bu dosyayı oku**, sonra ilgili alt dosyaya in.

---

## 1) Bir cümlede şu an

Frontend split-layout temelleri, Vision Board canlı bağlantısı ve Proje detay
sayfası tamamlandı; aktif odak **görsel polish** ve **görev–proje–hayal
bağlantısının kullanıcıya görünür hale getirilmesi**. Backend, Alembic
**0006**'ya kadar göçtü.

---

## 2) Oturum başlangıç ritüeli

Her seansın ilk 3 dakikası şu sırayla:

1. `progres/README.md` — bu dosya (şu an nerede).
2. `progres/gunluk.md` — son oturumda neyi nasıl yaptık (kararlar + nedenleri).
3. `progres/bilinen-sorunlar.md` — yapılması bekleyen + ertelenen şeyler.
4. Gerekirse `mimari.md` / `veri-ve-api.md` derinleşmek için.

**Kod yazmadan önce kontrol et**:
- `docker compose ps` — backend + db + frontend ayakta mı?
- `docker compose exec backend alembic current` — migration head güncel mi?
- Frontend `http://localhost:5173`, backend `http://localhost:8000/docs`.

---

## 3) Bu klasörde neresi ne için

| Dosya | Ne içerir | Ne zaman aç |
|---|---|---|
| `README.md` | Genel durum + ritüel + indeks | Her zaman ilk |
| `mimari.md` | Stack, klasör yapısı, modülerlik kuralları, yeni modül eklerken adımlar | Yeni feature başlatırken |
| `veri-ve-api.md` | DB modelleri, ilişkiler, migration listesi, REST endpoint envanteri | Veri / endpoint değiştirirken |
| `bilinen-sorunlar.md` | Şimdi çözmediğimiz ama farkında olduğumuz şeyler + "sonra" listesi | Plan yaparken, refactor sezgiyle |
| `gunluk.md` | Oturum-bazlı changelog (tarih + neyi neden) | Her oturumun sonunda güncelle, baş aç |

---

## 4) Çalışma ilkeleri (sabit kalan)

- **Türkçe iletişim, İngilizce kod**. Yorum/docstring İngilizce.
- **Migration her zaman Alembic ile** — elle DB değiştirme.
- **Önce planla, sonra yaz**. Büyük özelliği 3-5 küçük adımda teslim et.
- **Productçı dili**: Begüm yazılımcı değil. Teknik terim kullanırken yanında
  bir cümle sade Türkçe açıklama ver.
- **Tasarımı koru**: `designs/*.html` ve `styles/pages/*.css` kaynaktır.
  Yeni layout uydururken önce burada bir referans var mı bak.

---

## 5) Kritik komutlar (kopyala-yapıştır)

```bash
# Stack başlat / durdur
docker compose up -d
docker compose down

# Backend hot-reload zaten açık; kod değişikliği = otomatik reload.
# Sadece bu durumlarda restart gerekir:
docker compose restart backend     # import error / process hanging

# Migration
docker compose exec backend alembic upgrade head
docker compose exec backend alembic current
docker compose exec backend alembic revision --autogenerate -m "..."   # dikkatli kullan, gözle bak

# DB shell
docker compose exec db psql -U lifeos -d lifeos

# Backend test
docker compose exec backend pytest -x

# Sıfırdan başlamak (sadece MVP boyunca)
docker compose down -v   # volume'leri uçurur; production sonrası ASLA
```

---

## 6) "Yarın açtığımda" senaryosu

Begüm yarın açıp "devam edelim" dediğinde Claude'un yapması gerekenler:

1. Bu README'yi oku.
2. `gunluk.md`'nin en üstündeki son girdiyi oku — "neredeydim?" cevabı orada.
3. `bilinen-sorunlar.md`'den **High** etiketli madde varsa onu öner.
4. Aksi durumda: "Bugün ne üzerinde çalışmak istersin?" diye sor, varsayma.

---

## 7) Acil temas noktaları

- **Frontend kırıldı, hata anlamıyorum**: tarayıcı console (F12 → Console);
  Vite HMR log'u backend container'a da düşer.
- **Backend 500 / VALIDATION_ERROR**: `docker compose logs backend --tail 50`.
- **DB beklemediğim durumda**: önce `psql` aç, **gerçekten** ne yazılı bak.
  Memory/varsayım üzerinden gitme.
