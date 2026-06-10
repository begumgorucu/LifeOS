# Veri Modeli & API Envanteri

> Bu dosya: tablolar, ilişkiler, migration sırası, endpoint listesi.
> Veri yapısı değiştirirken veya yeni endpoint eklerken **önce buraya bak**.

---

## 1) Domain hiyerarşisi

```
Vision (hayal)                      Soyut, uzun vadeli, görselleştirilir.
  ├── M:N areas (vision_areas)      Vision birden çok alanla beslenebilir.
  └── M:N projects (vision_projects)  ← YENİ (2026-06-09 / 0006)
                                    Doğrudan proje bağlanır; vibrance hesabına
                                    direkt katılır.

Area (alan)                         Sürekli ilgi gerektiren hayat alanı.
  ├── 1:N projects                  Proje alana bağlı (zorunlu).
  ├── 1:N tasks                     Görev alana bağlı (zorunlu).
  └── health_score (0..100)         Görev tamamlama + zaman geçişiyle değişir.

Project (proje)                     Bitişi olan hedef.
  ├── 1:N tasks (project_id null'da olabilir)
  └── progress (0..100)             Tasks'tan otomatik hesap (done / total).

Task (görev)                        Aksiyon birimi.
  ├── area_id (zorunlu)
  ├── project_id (opsiyonel)
  └── M:N task_dependencies (DAG)   Bağımlı task tamamlanmadan kilitli.
```

**Vibrance formülü** (`vision_service.compute_vibrance`):
```
area_avg     = avg(linked_area.health_score)         varsa
project_avg  = avg(linked_project.progress)          varsa
boş & boş    → 70 (neutral default)
sadece biri  → o tek değer
ikisi de var → (area_avg + project_avg) / 2
```

---

## 2) Tablo envanteri

| Tablo | Anahtar sütunlar | Notlar |
|---|---|---|
| `users` | id, email, name, level, xp, streak_count, notif_* | Multi-tenant hazır |
| `areas` | id, user_id, name, icon, color, health_score, last_activity_at | health 0..100 |
| `projects` | id, user_id, area_id, title, status, progress, target_date | status enum: active/completed/archived |
| `tasks` | id, user_id, area_id, project_id (nullable), title, description, status, priority, due_at | status: todo/in_progress/done/skipped |
| `visions` | id, user_id, title, description, image_url, target_date | "tracked" değil; vibrance derive edilir |
| `vision_areas` | vision_id, area_id, created_at | M:N junction |
| `vision_projects` | vision_id, project_id, created_at | M:N junction (0006) |
| `task_dependencies` | task_id, depends_on_task_id, created_at | DAG, döngü kontrolü service'te |
| `area_health_snapshots` | id, area_id, score, captured_at | Geçmiş skor zaman serisi |
| `daily_pool_items` | id, user_id, task_id, reason, status, generated_at | Günlük havuz |
| `daily_activity_log` | id, user_id, task_id, action, created_at | Tamamlama/atlama logu |
| `notifications` | id, user_id, type, payload, is_read, created_at | Event feed |
| `achievements` | id, user_id, type, payload, achieved_at | Sessiz kilometre taşları |

---

## 3) Enum tipleri (`app/models/enums.py`)

- `ProjectStatus`: `active`, `completed`, `archived`
- `TaskStatus`: `todo`, `in_progress`, `done`, `skipped`
- `TaskPriority`: `low`, `medium`, `high`
- `PoolReason`: `neglected`, `due_today`, `next_step`, …
- `NotificationType`: `area_neglected`, `streak_milestone`, …

**Hatırlatma**: enum değerleri **küçük harf**. Python'da `ProjectStatus.active`,
`.ACTIVE` yok.

---

## 4) Alembic migration sırası

| Rev | Açıklama | Tarih |
|---|---|---|
| 0001 | initial schema | başlangıç |
| 0002 | schema hardening (constraints, index'ler) | erken |
| 0003 | gamification (streak, xp, level) | |
| 0004 | pool + achievements + snapshots | |
| 0005 | notifications + user notif tercihleri | 2026-06-03 |
| 0006 | **vision_projects junction** | 2026-06-09 |

**Yeni migration eklerken**:
1. `app/models/...` değişikliklerini önce yap.
2. `docker compose exec backend alembic revision --autogenerate -m "..."` (otomatik üret).
3. Üretilen dosyayı **gözle** — enum'lar, server_default, index'ler beklenen mi?
4. Manuel düzeltmeler (genelde gerekli — autogenerate enum'larla beceriksizdir).
5. `docker compose exec backend alembic upgrade head`.

---

## 5) Backend API endpoint'leri

Base URL: `http://localhost:8000/api/v1`. Swagger: `/docs`.

### `/me`
| Method | Path | Action |
|---|---|---|
| GET | `/me` | Kullanıcı bilgisi (level, xp, streak, notif tercihleri) |
| PATCH | `/me` | Profil güncelle (name, email, notif_* tercihleri) |

### `/areas`
| Method | Path | Action |
|---|---|---|
| GET | `/areas?limit&offset` | Liste (zenginleştirilmiş: visions, tasks_count, projects_count) |
| POST | `/areas` | Oluştur |
| GET | `/areas/{id}` | Detay |
| PATCH | `/areas/{id}` | Güncelle |
| DELETE | `/areas/{id}` | Sil (CASCADE projects/tasks/vision_areas) |
| POST | `/areas/{id}/log-activity` | Aktivite kaydı (health bump) |
| POST | `/areas/recompute-health` | Toplu sağlık skoru yeniden hesap |

### `/projects`
| Method | Path | Action |
|---|---|---|
| GET | `/projects?limit&offset&area_id&status` | Liste |
| POST | `/projects` | Oluştur |
| GET | `/projects/{id}` | Detay |
| PATCH | `/projects/{id}` | Güncelle |
| DELETE | `/projects/{id}` | Sil (vision_projects CASCADE) |

### `/tasks`
| Method | Path | Action |
|---|---|---|
| GET | `/tasks?limit&offset&status&priority&area_id&project_id&due_before&due_after` | Liste |
| POST | `/tasks` | Oluştur (area_id zorunlu, project_id opsiyonel, depends_on_ids[]) |
| GET | `/tasks/{id}` | Detay |
| PATCH | `/tasks/{id}` | Güncelle |
| DELETE | `/tasks/{id}` | Sil |
| POST | `/tasks/{id}/complete` | Tamamla (health bump + log + project.progress recompute) |
| POST | `/tasks/{id}/skip` | Atla |
| POST | `/tasks/{id}/reopen` | Geri aç |

### `/visions`
| Method | Path | Action |
|---|---|---|
| GET | `/visions?limit&offset&area_id` | Liste (vibrance + areas + projects ile) |
| POST | `/visions` | Oluştur (area_ids[], **project_ids[]** ← yeni) |
| GET | `/visions/{id}` | Detay |
| PATCH | `/visions/{id}` | Güncelle (area_ids/project_ids: null=koru, []=temizle, [...]=değiştir) |
| DELETE | `/visions/{id}` | Sil (junctionlar CASCADE) |

### `/daily-pool`
| Method | Path | Action |
|---|---|---|
| GET | `/daily-pool` | Bugünün havuzu |
| POST | `/daily-pool/generate?force=` | Havuz öner |
| POST | `/daily-pool/{id}/approve` | Havuza al |
| POST | `/daily-pool/{id}/skip` | Reddet |

### `/notifications`
GET/POST/PATCH (is_read flip).

### `/achievements`, `/stats`
GET liste / summary.

---

## 6) Frontend tip senkronu (`types/api.ts`)

Backend `*Read` schema'sı = Frontend `*Read` interface. Senkron tutmak için:

- Backend schema ekledikten sonra **`types/api.ts`** açıp aynı tipi yansıt.
- `*Summary` tipleri (`AreaSummary`, `ProjectSummary`, `VisionSummary`,
  `TaskSummary`) ortak `common.py` modülünde — birden çok yerde import edilir.
- Backend `int`, `str | None` → Frontend `number`, `string | null`.
- Backend `datetime` → Frontend `string` (ISO format).
- Backend `uuid.UUID` → Frontend `string`.

---

## 7) React Query cache key konvansiyonu

| Veri | Key | Invalidate trigger |
|---|---|---|
| Tüm task'ler | `["tasks", "list", params]` veya `["tasks", "all-for-calendar"]` | Task mutation, project complete |
| Belirli task | `["tasks", "by-project", projectId]` | Aynı kaynak |
| Alanlar | `["areas", "list", params]` | Area / task / project mutation |
| Projeler | `["projects", "list", params]` | Project / task mutation |
| Hayaller | `["visions"]` | Vision / area / project mutation |
| Bugün havuzu | `["pool"]` | Task complete, pool action |
| Profil/me | `["me"]` | Profile patch, XP/level değişimi |
| Bildirim | `["notifications"]` | Yeni event |

**Mutation pattern** (kural):
- `onSuccess` içinde **etki ettiği tüm kaynak prefix'lerini** invalide et.
- Örnek: bir task tamamlandığında `["tasks", "areas", "projects", "pool",
  "me", "notifications", "achievements", "stats"]` hepsi invalide olur.
  `useTasks.ts:33-39` bunun şablonu.

---

## 8) Hızlı SQL örnekleri

```sql
-- Aktif vision'lar + bağlı projeler + vibrance kompozisyonu
SELECT v.title, v.id,
       ARRAY_AGG(DISTINCT a.name) AS areas,
       ARRAY_AGG(DISTINCT p.title) AS projects
FROM visions v
LEFT JOIN vision_areas va ON va.vision_id = v.id
LEFT JOIN areas a         ON a.id = va.area_id
LEFT JOIN vision_projects vp ON vp.vision_id = v.id
LEFT JOIN projects p         ON p.id = vp.project_id
GROUP BY v.id;

-- Açık görevlerin proje/alan dağılımı
SELECT a.name AS area, p.title AS project, COUNT(*) AS open_tasks
FROM tasks t
JOIN areas a ON a.id = t.area_id
LEFT JOIN projects p ON p.id = t.project_id
WHERE t.status IN ('todo','in_progress')
GROUP BY a.name, p.title
ORDER BY open_tasks DESC;
```
